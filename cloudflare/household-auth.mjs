// Family device anchor: a persistent Google-authenticated session only identifies the household.
// All parent controls require a separately unlocked server-side parent session.
import {createPinVerifier,verifyPin} from './pin-hash.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const out=(x,s=200,headers={})=>Response.json(x,{status:s,headers:{'cache-control':'no-store',...headers}});
const sha=async x=>btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(x))))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const token=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replaceAll('+','-').replaceAll('/','_');
const parentToken=req=>(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-hh_session='))?.slice(18);
async function anchor(req,env){
 const t=parentToken(req);if(!t||!/^[a-zA-Z0-9_-]{40,128}$/.test(t))return null;
 return env.DB.prepare(`SELECT s.id AS session_id,s.pin_verified_at,s.household_mode,p.id AS parent_id,p.display_name,
 p.pin_hash,p.pin_attempts,p.pin_locked_until,m.family_id FROM auth_sessions s
 JOIN parent_users p ON p.id=s.parent_id JOIN family_memberships m ON m.parent_id=p.id
 JOIN families f ON f.id=m.family_id
 WHERE s.token_hash=? AND s.role='parent' AND s.revoked_at IS NULL AND s.expires_at>?
 AND f.deleted_at IS NULL AND p.disabled_at IS NULL ORDER BY m.created_at LIMIT 1`)
 .bind(await sha(t),new Date().toISOString()).first();
}
async function body(req){
 if(req.headers.get('origin')!==origin)return {error:out({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:out({detail:'JSON required'},415)};
 try{const raw=await req.text();if(raw.length>400)throw Error();return {value:JSON.parse(raw)}}
 catch{return {error:out({detail:'Invalid JSON'},400)}}
}
export async function householdState(req,env){
 try{
  const actor=await anchor(req,env);
  if(!actor)return out({setup:true,google_required:true});
  const children=await env.DB.prepare(`SELECT id,display_name,avatar_id,(pin_hash IS NOT NULL) AS pin_configured
   FROM child_profiles WHERE family_id=? AND deleted_at IS NULL ORDER BY created_at LIMIT 30`)
   .bind(actor.family_id).all();
  return out({setup:!actor.pin_hash||!(children.results||[]).length,
   parent_name:actor.display_name,has_parent_pin:!!actor.pin_hash,parent_unlocked:!actor.household_mode||!!actor.pin_verified_at,
   children:children.results||[]});
 }catch{return out({detail:'Household unavailable'},503)}
}
export async function setupParentPin(req,env){
 const input=await body(req);if(input.error)return input.error;
 const pin=input.value?.pin;
 if(typeof pin!=='string'||!/^\d{4}$/.test(pin))return out({detail:'Four digits required'},400);
 try{
  const actor=await anchor(req,env);if(!actor)return out({detail:'Sign in with Google first'},401);
  if(actor.pin_hash)return out({detail:'Parent PIN already configured'},409);
  const verifier=await createPinVerifier(pin);
  let result;
  try{
   result=await env.DB.prepare('UPDATE parent_users SET pin_hash=?,pin_attempts=0,pin_locked_until=NULL WHERE id=? AND pin_hash IS NULL')
    .bind(verifier,actor.parent_id).run();
  }catch(error){
   console.error('Household PIN database update failed',String(error));
   return out({detail:'Could not save PIN in database. Check the shared-device database migration.',code:'PIN_DATABASE_UPDATE_FAILED'},503);
  }
  if(result.meta?.changes!==1)return out({detail:'Parent PIN already configured'},409);
  return out({configured:true});
 }catch(error){
  console.error('Household PIN setup failed',String(error));
  return out({detail:'PIN setup failed. Please try again.',code:'PIN_SETUP_FAILED'},503);
 }
}
export async function unlockHousehold(req,env){
 const input=await body(req);if(input.error)return input.error;
 const pin=input.value?.pin,childId=input.value?.child_id??null;
 if(typeof pin!=='string'||!/^\d{4}$/.test(pin))return out({detail:'Four digits required'},400);
 try{
  const actor=await anchor(req,env);if(!actor)return out({detail:'Household not found'},401);
  const now=new Date().toISOString();
  const child=childId?await env.DB.prepare('SELECT id,pin_hash,pin_attempts,pin_locked_until FROM child_profiles WHERE id=? AND family_id=? AND deleted_at IS NULL')
   .bind(childId,actor.family_id).first():null;
  if(childId&&!child)return out({detail:'Profile not found'},404);
  const identity=child||actor,scope=child?'child_profiles':'parent_users',identifier=child?.id||actor.parent_id;
  if(!identity.pin_hash)return out({detail:'PIN not configured'},409);
  if(identity.pin_locked_until&&identity.pin_locked_until>now)return out({detail:'Too many attempts. Try later.'},429);
  const matches=await verifyPin(pin,identity.pin_hash);
  if(!matches){
   const previous=identity.pin_locked_until&&identity.pin_locked_until<=now?0:identity.pin_attempts;
   const attempts=previous+1,until=attempts>=5?new Date(Date.now()+15*60000).toISOString():null;
   await env.DB.prepare(`UPDATE ${scope} SET pin_attempts=?,pin_locked_until=? WHERE id=? AND pin_attempts=?`)
    .bind(attempts,until,identifier,identity.pin_attempts).run();
   return out({detail:until?'Locked for 15 minutes.':'Incorrect PIN'},until?429:401);
  }
  await env.DB.prepare(`UPDATE ${scope} SET pin_attempts=0,pin_locked_until=NULL WHERE id=?`).bind(identifier).run();
  if(child){
   const key=token(),nowHash=await sha(key),expires=new Date(Date.now()+12*3600000).toISOString();
   await env.DB.batch([
    env.DB.prepare(`UPDATE auth_sessions SET pin_verified_at=NULL WHERE id=? AND role='parent'`).bind(actor.session_id),
    env.DB.prepare(`INSERT INTO auth_sessions (id,child_id,family_id,role,token_hash,created_at,expires_at,pin_verified_at)
       VALUES (?,?,?,'child',?,?,?,?)`).bind(crypto.randomUUID(),child.id,actor.family_id,nowHash,now,expires,now)
   ]);
   return out({role:'child',url:'/habit-hero/child/'},200,{'set-cookie':'__Host-hh_child='+key+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200'});
  }
  // Child cookies cannot authorize parent routes; parent unlock resets household profile selection.
  await env.DB.prepare(`UPDATE auth_sessions SET pin_verified_at=? WHERE id=? AND role='parent'`).bind(now,actor.session_id).run();
  return out({role:'parent',url:'/habit-hero/parent/'});
 }catch{return out({detail:'PIN verification unavailable'},503)}
}
export async function exitToHousehold(req,env){
 if(req.headers.get('origin')!==origin)return out({detail:'Forbidden'},403);
 try{
  const actor=await anchor(req,env);if(!actor)return out({detail:'Household not found'},401);
  const child=(req.headers.get('cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('__Host-hh_child='))?.slice(16);
  const queries=[env.DB.prepare('UPDATE auth_sessions SET pin_verified_at=NULL,household_mode=1 WHERE id=?').bind(actor.session_id)];
  if(child&&/^[A-Za-z0-9_-]{32}$/.test(child))queries.push(env.DB.prepare("UPDATE auth_sessions SET revoked_at=? WHERE token_hash=? AND role='child'").bind(new Date().toISOString(),await sha(child)));
  await env.DB.batch(queries);
  return out({ok:true},200,{'set-cookie':'__Host-hh_child=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});
 }catch{return out({detail:'Could not switch profile'},503)}
}
