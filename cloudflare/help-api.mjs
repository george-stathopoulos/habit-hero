import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
async function body(req){
 if(req.headers.get('origin')!==origin)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try{const raw=await req.text();if(raw.length>1024)throw Error();return {value:JSON.parse(raw)}}
 catch{return {error:json({detail:'Invalid JSON'},400)}}
}
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
export async function childAskHelp(req,env){
 const parsed=await body(req);if(parsed.error)return parsed.error;
 const child=await authorizedChild(req,env);if(!child)return json({detail:'Not authenticated'},401);
 const habitId=parsed.value?.habit_id;
 if(!uuid(habitId))return json({detail:'Invalid mission'},400);
 try{
  const assigned=await env.DB.prepare(`SELECT 1 AS ok FROM habit_assignments a JOIN habits h ON h.id=a.habit_id AND h.family_id=a.family_id
   WHERE a.family_id=? AND a.child_id=? AND a.habit_id=? AND h.active=1 AND h.deleted_at IS NULL`)
   .bind(child.family_id,child.child_id,habitId).first();
  if(!assigned)return json({detail:'Mission not assigned'},404);
  const existing=await env.DB.prepare(`SELECT id FROM habit_help_requests WHERE family_id=? AND child_id=? AND habit_id=? AND status='pending' LIMIT 1`)
   .bind(child.family_id,child.child_id,habitId).first();
  if(existing)return json({detail:'A help request is already waiting',id:existing.id},409);
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO habit_help_requests(id,family_id,child_id,habit_id,created_at) VALUES(?,?,?,?,?)`)
   .bind(id,child.family_id,child.child_id,habitId,new Date().toISOString()).run();
  return json({id,status:'pending'},201);
 }catch{return json({detail:'Help request unavailable'},503)}
}
export async function childHelpStatus(req,env){
 const child=await authorizedChild(req,env);if(!child)return json({detail:'Not authenticated'},401);
 try{
  const result=await env.DB.prepare(`SELECT id,habit_id,status,parent_message,created_at FROM habit_help_requests
   WHERE family_id=? AND child_id=? ORDER BY created_at DESC LIMIT 30`).bind(child.family_id,child.child_id).all();
  return json({requests:result.results||[]});
 }catch{return json({detail:'Help status unavailable'},503)}
}
export async function parentHelpRequests(req,env){
 const parent=await authorizedParent(req,env);if(!parent)return json({detail:'Not authenticated'},401);
 try{
  const result=await env.DB.prepare(`SELECT r.id,r.child_id,r.habit_id,r.status,r.created_at,c.display_name AS child_name,h.name_el AS habit_name
   FROM habit_help_requests r JOIN child_profiles c ON c.id=r.child_id AND c.family_id=r.family_id
   JOIN habits h ON h.id=r.habit_id AND h.family_id=r.family_id
   WHERE r.family_id=? AND r.status='pending' ORDER BY r.created_at ASC LIMIT 50`).bind(parent.family_id).all();
  return json({requests:result.results||[]});
 }catch{return json({detail:'Help requests unavailable'},503)}
}
export async function respondToHelp(req,env){
 const parsed=await body(req);if(parsed.error)return parsed.error;
 const parent=await authorizedParent(req,env);if(!parent)return json({detail:'Not authenticated'},401);
 const id=parsed.value?.request_id,status=parsed.value?.status;
 if(!uuid(id)||!['helping','try_again'].includes(status))return json({detail:'Invalid reply'},400);
 const message=typeof parsed.value?.message==='string'?parsed.value.message.trim():'';
 if(message.length>200)return json({detail:'Message too long'},400);
 const defaultMessage=status==='helping'?'Έρχομαι να σε βοηθήσω! 💜':'Πιστεύω σε σένα! Δοκίμασε λίγο ακόμα και ζήτησέ μου ξανά βοήθεια αν τη χρειάζεσαι. 🌟';
 try{
  const result=await env.DB.prepare(`UPDATE habit_help_requests SET status=?,parent_message=?,responded_at=?
   WHERE id=? AND family_id=? AND status='pending'`)
   .bind(status,message||defaultMessage,new Date().toISOString(),id,parent.family_id).run();
  if(result.meta?.changes!==1)return json({detail:'Request already answered or missing'},409);
  return json({status,message:message||defaultMessage});
 }catch{return json({detail:'Reply unavailable'},503)}
}
