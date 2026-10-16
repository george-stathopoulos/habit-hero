// Four-digit child PIN is a secondary unlock on a parent-paired device, never remote login.
// PBKDF2 salted verifier and durable child-level lockout. No plaintext PIN storage.
import {authorizedParent} from './family-api.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(v,s=200)=>Response.json(v,{status:s,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
const pinValid=x=>typeof x==='string'&&/^\d{4}$/.test(x);
const cookie=req=>(req.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('__Host-hh_child='))?.slice(16);
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=x=>Uint8Array.from(atob(x.replaceAll('-','+').replaceAll('_','/')),v=>v.charCodeAt(0));
async function digest(text){return b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))))}
async function hash(pin,salt){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 return b64(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:decode(salt),iterations:100000,hash:'SHA-256'},key,256)));
}
async function body(req){
 if(req.headers.get('origin')!==origin)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try{const raw=await req.text();if(raw.length>400)return {error:json({detail:'Too large'},413)};
 const v=JSON.parse(raw);if(!v||Array.isArray(v)||typeof v!=='object')throw Error();return {v}}
 catch{return {error:json({detail:'Invalid JSON'},400)}}
}
export async function configureChildPin(req,env){
 const input=await body(req);if(input.error)return input.error;
 const parent=await authorizedParent(req,env);
 if(!parent)return json({detail:'Not authenticated'},401);
 const {child_id,pin}=input.v;
 if(!uuid(child_id)||!pinValid(pin))return json({detail:'PIN must be four digits'},400);
 const salt=b64(crypto.getRandomValues(new Uint8Array(16)));
 const verifier='pbkdf2-sha256-100000$'+salt+'$'+await hash(pin,salt);
 try{
 const now=new Date().toISOString();
 const changes=await env.DB.batch([
  env.DB.prepare(`UPDATE child_profiles SET pin_hash=?,pin_attempts=0,pin_locked_until=NULL,updated_at=?
   WHERE family_id=? AND id=? AND deleted_at IS NULL`).bind(verifier,now,parent.family_id,child_id),
  env.DB.prepare(`UPDATE auth_sessions SET pin_verified_at=NULL WHERE role='child' AND family_id=? AND child_id=?`).bind(parent.family_id,child_id)
 ]);
 if(changes[0]?.meta?.changes!==1)return json({detail:'Child not found'},404);
 return json({configured:true});
 }catch{return json({detail:'Could not save PIN'},503)}
}
export async function childPinStatus(req,env){
 const token=cookie(req);if(!token||!/^[A-Za-z0-9_-]{32}$/.test(token))return json({detail:'Not authenticated'},401);
 try{
 const result=await env.DB.prepare(`SELECT c.pin_hash,s.pin_verified_at FROM auth_sessions s
 JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id
 WHERE s.token_hash=? AND s.role='child' AND s.revoked_at IS NULL AND s.expires_at>?
 AND c.deleted_at IS NULL`).bind(await digest(token),new Date().toISOString()).first();
 if(!result)return json({detail:'Not authenticated'},401);
 return json({requires_pin:!!result.pin_hash&&!result.pin_verified_at});
 }catch{return json({detail:'Unavailable'},503)}
}
export async function unlockChildPin(req,env){
 const input=await body(req);if(input.error)return input.error;
 const token=cookie(req);if(!token||!/^[A-Za-z0-9_-]{32}$/.test(token))return json({detail:'Not authenticated'},401);
 const pin=input.v.pin;if(!pinValid(pin))return json({detail:'Invalid PIN'},400);
 const now=new Date().toISOString();
 try{
 const session=await env.DB.prepare(`SELECT s.id,s.family_id,s.child_id,c.pin_hash,c.pin_attempts,c.pin_locked_until
 FROM auth_sessions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id
 WHERE s.token_hash=? AND s.role='child' AND s.revoked_at IS NULL AND s.expires_at>?
 AND c.deleted_at IS NULL`).bind(await digest(token),now).first();
 if(!session)return json({detail:'Not authenticated'},401);
 if(!session.pin_hash)return json({detail:'PIN not configured'},409);
 if(session.pin_locked_until&&session.pin_locked_until>now)return json({detail:'PIN locked. Ask a parent to reset it, or retry later.'},429);
 const [alg,salt,expected]=session.pin_hash.split('$');
 const actual=alg==='pbkdf2-sha256-100000'&&salt?await hash(pin,salt):'';
 if(expected!==actual){
  // Durable five-attempt lockout shared between all devices for this child.
  const prior=(session.pin_locked_until&&session.pin_locked_until<=now)?0:session.pin_attempts;
  const next=prior+1,locked=next>=5?new Date(Date.now()+15*60000).toISOString():null;
  await env.DB.prepare(`UPDATE child_profiles SET pin_attempts=?,pin_locked_until=?
    WHERE family_id=? AND id=? AND pin_attempts=?`).bind(next,locked,session.family_id,session.child_id,session.pin_attempts).run();
  return json({detail:locked?'Too many attempts. Locked for 15 minutes.':'Incorrect PIN'},locked?429:401);
 }
 const results=await env.DB.batch([
  env.DB.prepare(`UPDATE child_profiles SET pin_attempts=0,pin_locked_until=NULL WHERE family_id=? AND id=?`).bind(session.family_id,session.child_id),
  env.DB.prepare(`UPDATE auth_sessions SET pin_verified_at=? WHERE id=? AND role='child' AND revoked_at IS NULL`).bind(now,session.id)
 ]);
 return results[1]?.meta?.changes===1?json({unlocked:true}):json({detail:'Session unavailable'},401);
 }catch{return json({detail:'PIN verification unavailable'},503)}
}

export async function lockChildPin(req,env){
 if(req.headers.get('origin')!==origin)return json({detail:'Forbidden'},403);
 const token=cookie(req);
 if(!token||!/^[A-Za-z0-9_-]{32}$/.test(token))return json({detail:'Not authenticated'},401);
 try{
  const result=await env.DB.prepare(`UPDATE auth_sessions SET pin_verified_at=NULL
   WHERE token_hash=? AND role='child' AND revoked_at IS NULL AND expires_at>?`)
   .bind(await digest(token),new Date().toISOString()).run();
  if(result.meta?.changes!==1)return json({detail:'Session not found'},401);
  return json({locked:true});
 }catch{return json({detail:'Cannot lock profile'},503)}
}
