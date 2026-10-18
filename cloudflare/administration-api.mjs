import {authorizedParent} from './family-api.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const reply=(body,status=200,headers={})=>Response.json(body,{status,headers:{'cache-control':'no-store',...headers}});
const sha=async text=>btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const token=()=>btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(24)))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
async function input(req){if(req.headers.get('origin')!==origin)return {error:reply({detail:'Forbidden'},403)};if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:reply({detail:'JSON required'},415)};try{const raw=await req.text();if(raw.length>1500)throw Error();const body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw Error();return {body}}catch{return {error:reply({detail:'Invalid JSON'},400)}}}
const fresh=actor=>actor.pin_verified_at&&Date.now()-Date.parse(actor.pin_verified_at)<15*60000;
const clearChild='__Host-hh_child=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
export async function familyAdministration(req,env){const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{
 const members=await env.DB.prepare('SELECT p.id,p.display_name,m.role,p.disabled_at,rv.revoked_at FROM family_memberships m JOIN parent_users p ON p.id=m.parent_id LEFT JOIN family_membership_revocations rv ON rv.family_id=m.family_id AND rv.parent_id=m.parent_id WHERE m.family_id=? ORDER BY m.created_at').bind(actor.family_id).all();
 const families=await env.DB.prepare('SELECT f.id,f.display_name,m.role FROM family_memberships m JOIN families f ON f.id=m.family_id WHERE m.parent_id=? AND f.deleted_at IS NULL AND NOT EXISTS(SELECT 1 FROM family_membership_revocations rv WHERE rv.family_id=m.family_id AND rv.parent_id=m.parent_id)').bind(actor.parent_id).all();
 const sessions=await env.DB.prepare("SELECT id,created_at,expires_at,pin_verified_at,household_mode,family_id FROM auth_sessions WHERE parent_id=? AND role='parent' AND revoked_at IS NULL AND expires_at>? ORDER BY created_at DESC LIMIT 100").bind(actor.parent_id,new Date().toISOString()).all();
 const invitations=actor.membership_role==='owner'?(await env.DB.prepare('SELECT id,email_normalized,expires_at FROM family_invitations WHERE family_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').bind(actor.family_id,new Date().toISOString()).all()).results:[];
 return reply({members:members.results||[],families:families.results||[],sessions:(sessions.results||[]).map(s=>({...s,current:s.id===actor.session_id})),invitations,owner:actor.membership_role==='owner'});
 }catch{return reply({detail:'Could not load family administration'},503)}}
export async function administerFamily(req,env){const {body,error}=await input(req);if(error)return error;const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{
 const now=new Date().toISOString();
 if(body.action==='revoke_session'){
  const result=await env.DB.prepare("UPDATE auth_sessions SET revoked_at=? WHERE id=? AND parent_id=? AND role='parent' AND revoked_at IS NULL").bind(now,body.session_id||'',actor.parent_id).run();return result.meta?.changes?reply({ok:true,current:body.session_id===actor.session_id}):reply({detail:'Session not found'},404);
 }
 if(body.action==='switch'){
  if(!await env.DB.prepare('SELECT family_id FROM family_memberships WHERE parent_id=? AND family_id=? AND NOT EXISTS(SELECT 1 FROM family_membership_revocations rv WHERE rv.family_id=family_memberships.family_id AND rv.parent_id=family_memberships.parent_id)').bind(actor.parent_id,body.family_id||'').first())return reply({detail:'Family not found'},404);
  await env.DB.prepare('UPDATE auth_sessions SET family_id=?,pin_verified_at=NULL,household_mode=1 WHERE id=? AND parent_id=?').bind(body.family_id,actor.session_id,actor.parent_id).run();return reply({ok:true,locked:true},200,{'set-cookie':clearChild});
 }
 if(body.action==='accept'){
  if(typeof body.code!=='string'||!/^[A-Za-z0-9_-]{32}$/.test(body.code))return reply({detail:'Invalid invitation'},400);
  const me=await env.DB.prepare('SELECT email_normalized FROM parent_users WHERE id=?').bind(actor.parent_id).first();const hash=await sha(body.code);
  const invite=await env.DB.prepare('SELECT * FROM family_invitations WHERE token_hash=? AND email_normalized=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').bind(hash,me.email_normalized,now).first();if(!invite)return reply({detail:'Η πρόσκληση έληξε ή αφορά διαφορετικό email.'},404);
  await env.DB.batch([
   env.DB.prepare('UPDATE family_invitations SET consumed_at=? WHERE id=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').bind(now,invite.id,now),
   env.DB.prepare("INSERT OR IGNORE INTO family_memberships(family_id,parent_id,role,created_at) SELECT family_id,?,'parent',? FROM family_invitations WHERE id=? AND consumed_at=?").bind(actor.parent_id,now,invite.id,now),
   env.DB.prepare('DELETE FROM family_membership_revocations WHERE family_id=? AND parent_id=? AND EXISTS(SELECT 1 FROM family_invitations WHERE id=? AND consumed_at=?)').bind(invite.family_id,actor.parent_id,invite.id,now)
  ]);return reply({ok:true});
 }
 if(actor.membership_role!=='owner')return reply({detail:'Only the family owner can perform this action'},403);
 if(body.action==='remove_parent'){
  const member=await env.DB.prepare("SELECT parent_id FROM family_memberships WHERE family_id=? AND parent_id=? AND role='parent'").bind(actor.family_id,body.parent_id||'').first();if(!member||member.parent_id===actor.parent_id)return reply({detail:'Only another non-owner parent can be removed'},400);
  await env.DB.batch([
   env.DB.prepare('INSERT INTO family_membership_revocations(family_id,parent_id,revoked_at) VALUES(?,?,?) ON CONFLICT(family_id,parent_id) DO UPDATE SET revoked_at=excluded.revoked_at').bind(actor.family_id,member.parent_id,now),
   env.DB.prepare("UPDATE auth_sessions SET revoked_at=? WHERE (parent_id=? AND (family_id=? OR family_id IS NULL)) OR (family_id=? AND role='child')").bind(now,member.parent_id,actor.family_id,actor.family_id),
   env.DB.prepare('DELETE FROM child_device_pairings WHERE family_id=? AND created_by=?').bind(actor.family_id,member.parent_id)
  ]);return reply({ok:true});
 }
 if(body.action==='invite'){
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';if(email.length>254||!/^\S+@\S+\.\S+$/.test(email))return reply({detail:'Invalid email'},400);
  const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM family_invitations WHERE family_id=? AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?').bind(actor.family_id,now).first();if(count.n>=5)return reply({detail:'Maximum five active invitations'},409);
  const code=token(),expires=new Date(Date.now()+86400000).toISOString();await env.DB.prepare('INSERT INTO family_invitations(id,family_id,created_by,email_normalized,token_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?)').bind(crypto.randomUUID(),actor.family_id,actor.parent_id,email,await sha(code),now,expires).run();return reply({code,expires_at:expires},201);
 }
 if(body.action==='revoke_invite'){await env.DB.prepare('UPDATE family_invitations SET revoked_at=? WHERE family_id=? AND id=? AND consumed_at IS NULL').bind(now,actor.family_id,body.invitation_id||'').run();return reply({ok:true})}
 return reply({detail:'Invalid action'},400);
 }catch{return reply({detail:'Could not update family administration'},503)}}
// One transaction opens a family-scoped erasure guard, deletes dependent rows,
// then closes the guard. Ordinary ledger writes remain immutable.
function eraseStatements(env,family,parent,now,removeFamily){
 const queries=[env.DB.prepare('INSERT INTO family_erasure_authorizations(family_id,created_by,created_at) VALUES(?,?,?)').bind(family,parent,now)];
 const tables=['inactivity_rules','notification_deliveries','push_subscriptions','notification_preferences','family_invitations','family_messages','child_routine_steps','custom_routines','habit_occurrence_controls','habit_lifecycle_events','point_ledger','reward_redemptions','completion_submissions','habit_help_requests','habit_assignments','reward_eligibility','child_device_pairings'];
 for(const table of tables){const sql=table==='notification_deliveries'?'DELETE FROM notification_deliveries WHERE subscription_id IN (SELECT id FROM push_subscriptions WHERE family_id=?)':'DELETE FROM '+table+' WHERE family_id=?';queries.push(env.DB.prepare(sql).bind(family))}
 queries.push(env.DB.prepare("DELETE FROM auth_sessions WHERE family_id=? AND role='child'").bind(family));
 for(const table of ['child_profiles','habits','reward_catalog'])queries.push(env.DB.prepare('DELETE FROM '+table+' WHERE family_id=?').bind(family));
 if(removeFamily){queries.push(env.DB.prepare('UPDATE auth_sessions SET revoked_at=? WHERE family_id=?').bind(now,family));queries.push(env.DB.prepare('DELETE FROM family_membership_revocations WHERE family_id=?').bind(family));queries.push(env.DB.prepare('DELETE FROM family_memberships WHERE family_id=?').bind(family));queries.push(env.DB.prepare('DELETE FROM family_settings WHERE family_id=?').bind(family));queries.push(env.DB.prepare('DELETE FROM families WHERE id=?').bind(family))}
 queries.push(env.DB.prepare('DELETE FROM family_erasure_authorizations WHERE family_id=?').bind(family));return queries;
}
export async function eraseAccountData(req,env){const {body,error}=await input(req);if(error)return error;const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);
 if(!fresh(actor))return reply({detail:'Για ασφάλεια, κλειδώστε και ξεκλειδώστε ξανά τον γονέα με PIN και επαναλάβετε μέσα σε 15 λεπτά.'},403);
 const now=new Date().toISOString();try{
 if(body.action==='reset'&&body.confirm==='RESET'){
  if(actor.membership_role!=='owner')return reply({detail:'Only the owner can reset the family'},403);
  await env.DB.batch(eraseStatements(env,actor.family_id,actor.parent_id,now,false));return reply({ok:true,reset:true},200,{'set-cookie':clearChild});
 }
 if(body.action==='delete_account'&&body.confirm==='DELETE ACCOUNT'){
  const memberships=(await env.DB.prepare('SELECT family_id,role FROM family_memberships WHERE parent_id=?').bind(actor.parent_id).all()).results||[];const statements=[];
  for(const membership of memberships){const remaining=(await env.DB.prepare('SELECT m.parent_id FROM family_memberships m JOIN parent_users p ON p.id=m.parent_id WHERE m.family_id=? AND m.parent_id!=? AND p.disabled_at IS NULL AND NOT EXISTS(SELECT 1 FROM family_membership_revocations rv WHERE rv.family_id=m.family_id AND rv.parent_id=m.parent_id) ORDER BY m.created_at LIMIT 1').bind(membership.family_id,actor.parent_id).all()).results||[];
   if(!remaining.length)statements.push(...eraseStatements(env,membership.family_id,actor.parent_id,now,true));
   else{if(membership.role==='owner')statements.push(env.DB.prepare("UPDATE family_memberships SET role='owner' WHERE family_id=? AND parent_id=?").bind(membership.family_id,remaining[0].parent_id));statements.push(env.DB.prepare('DELETE FROM family_invitations WHERE family_id=? AND created_by=?').bind(membership.family_id,actor.parent_id))}
  }
  statements.push(env.DB.prepare('DELETE FROM parent_identities WHERE parent_id=?').bind(actor.parent_id));
  statements.push(env.DB.prepare('DELETE FROM auth_challenges WHERE parent_id=?').bind(actor.parent_id));
  statements.push(env.DB.prepare('DELETE FROM auth_sessions WHERE parent_id=?').bind(actor.parent_id));
  statements.push(env.DB.prepare('UPDATE parent_users SET email_normalized=?,display_name=?,pin_hash=NULL,disabled_at=?,updated_at=? WHERE id=?').bind('deleted-'+actor.parent_id+'@invalid.example','Διαγραμμένος γονέας',now,now,actor.parent_id));
  await env.DB.batch(statements);return reply({ok:true,deleted:true},200,{'set-cookie':'__Host-hh_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});
 }
 return reply({detail:'Exact confirmation required'},400);
 }catch{return reply({detail:'Η διαγραφή δεν ολοκληρώθηκε. Δεν εφαρμόστηκαν μερικές αλλαγές. Δοκιμάστε ξανά.'},503)}}
