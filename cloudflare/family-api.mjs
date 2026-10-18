import {createPinVerifier} from './pin-hash.mjs';
// Parent-only family API. Every query derives the family from a verified session.
// Never trust a client-supplied family_id or parent_id.
const origin = 'https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const out=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const deny=()=>out({detail:'Not authenticated'},401);
const cookieName='__Host-hh_session';
function cookie(req) {
 const match=(req.headers.get('cookie')||'').split(';').map(p=>p.trim()).find(p=>p.startsWith(cookieName+'='));
 return match ? match.slice(cookieName.length+1) : null;
}
async function sha(input) {
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input)));
 return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
}
export async function authorizedParent(req,env) {
 const token=cookie(req);
 if(!env.DB||!token||! /^[a-zA-Z0-9_-]{40,128}$/.test(token))return null;
 try {
  const row=await env.DB.prepare(`SELECT s.parent_id,m.family_id,p.display_name,f.display_name AS family_name,
    COALESCE(settings.timezone,'UTC') AS timezone
   FROM auth_sessions s JOIN parent_users p ON p.id=s.parent_id
   JOIN family_memberships m ON m.parent_id=s.parent_id JOIN families f ON f.id=m.family_id
   LEFT JOIN family_settings settings ON settings.family_id=f.id
   WHERE s.token_hash=? AND s.role='parent' AND s.revoked_at IS NULL AND s.expires_at>?
   AND p.disabled_at IS NULL AND f.deleted_at IS NULL
   AND (p.pin_hash IS NULL OR s.pin_verified_at IS NOT NULL
    OR (s.household_mode=0 AND NOT EXISTS(
      SELECT 1 FROM child_profiles cc WHERE cc.family_id=m.family_id AND cc.deleted_at IS NULL)))
   ORDER BY m.created_at LIMIT 1`).bind(await sha(token),new Date().toISOString()).first();
  return row||null;
 }catch{return null}
}
export async function familyOverview(req,env) {
 const parent=await authorizedParent(req,env);
 if(!parent)return deny();
 try {
  const children=await env.DB.prepare(`SELECT id,display_name,age_band,avatar_id,avatar_level,(pin_hash IS NOT NULL) AS pin_configured,created_at
    FROM child_profiles WHERE family_id=? AND deleted_at IS NULL ORDER BY created_at,id LIMIT 100`)
    .bind(parent.family_id).all();
  return out({family:{id:parent.family_id,name:parent.family_name,timezone:parent.timezone},parent:{id:parent.parent_id,name:parent.display_name},
   children:children.results||[]});
 }catch{return out({detail:'Service unavailable'},503)}
}
export async function createChild(req,env) {
 // Required for cookie-authenticated writes; cross-site forms cannot bypass.
 if(req.headers.get('origin')!==origin)return out({detail:'Forbidden'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return out({detail:'JSON required'},415);
 const parent=await authorizedParent(req,env);
 if(!parent)return deny();
 let body;
 try {
  const raw=await req.text();
  if(raw.length>1024)return out({detail:'Request too large'},413);
  body=JSON.parse(raw);
 }catch{return out({detail:'Invalid JSON'},400)}
 if(!body||typeof body!=='object'||Array.isArray(body))return out({detail:'Invalid child data'},400);
 const name=typeof body.name==='string'?body.name.trim():'';
 const age=body.age_band===null||body.age_band===undefined?null:body.age_band;
 const pin=body.pin??null,avatar=body.avatar_id??null;
 if(name.length<1||name.length>80||/[\u0000-\u001f\u007f]/.test(name) ||
   (age!==null&&!['6-8','9-11','12-14'].includes(age)) ||
   (pin!==null&&(typeof pin!=='string'||!/^\d{4}$/.test(pin))) || (avatar!==null&&!['hero-girl','hero-boy'].includes(avatar)))
   return out({detail:'Invalid name, age group or 4-digit PIN'},400);
 const id=crypto.randomUUID(),now=new Date().toISOString();
 try{
  const verifier=pin===null?null:await createPinVerifier(pin);
  const result=await env.DB.prepare(`INSERT INTO child_profiles
    (id,family_id,display_name,age_band,pin_hash,avatar_id,created_at,updated_at)
    SELECT ?,family_id,?,?,?,?,?,? FROM family_memberships
    WHERE family_id=? AND parent_id=?`)
   .bind(id,name,age,verifier,avatar,now,now,parent.family_id,parent.parent_id).run();
  if(result.meta?.changes!==1)return out({detail:'Could not create child'},503);
  return out({id,name,age_band:age,avatar_id:avatar,pin_configured:!!verifier},201);
 }catch{return out({detail:'Could not create child'},503)}
}

export async function editChild(req,env){
 if(req.headers.get('origin')!==origin)return out({detail:'Forbidden'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return out({detail:'JSON required'},415);
 const parent=await authorizedParent(req,env);
 if(!parent)return deny();
 let value;
 try{const raw=await req.text();if(raw.length>1024)return out({detail:'Request too large'},413);value=JSON.parse(raw)}
 catch{return out({detail:'Invalid JSON'},400)}
 const id=value?.child_id,name=typeof value?.name==='string'?value.name.trim():'',
  age=value?.age_band??null,avatar=value?.avatar_id??null;
 if(typeof id!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)||
  !name||name.length>80||/[\u0000-\u001f\u007f]/.test(name)||
  (age!==null&&!['6-8','9-11','12-14'].includes(age))||(avatar!==null&&!['hero-girl','hero-boy'].includes(avatar)))
  return out({detail:'Invalid child details'},400);
 try{
  const result=await env.DB.prepare(`UPDATE child_profiles
   SET display_name=?,age_band=?,avatar_id=COALESCE(?,avatar_id),updated_at=? WHERE family_id=? AND id=? AND deleted_at IS NULL`)
   .bind(name,age,avatar,new Date().toISOString(),parent.family_id,id).run();
  if(result.meta?.changes!==1)return out({detail:'Child not found'},404);
  return out({id,name,age_band:age,avatar_id:avatar});
 }catch{return out({detail:'Could not update child'},503)}
}
