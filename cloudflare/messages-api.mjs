import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=value=>typeof value==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value);
async function body(req){
 if(req.headers.get('origin')!==origin)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try{const raw=await req.text();if(raw.length>1400)return {error:json({detail:'Request too large'},413)};return {value:JSON.parse(raw)}}catch{return {error:json({detail:'Invalid JSON'},400)}}
}
export async function parentMessages(req,env){
 const parent=await authorizedParent(req,env);if(!parent)return json({detail:'Not authenticated'},401);
 try{const rows=await env.DB.prepare(`SELECT m.id,m.child_id,c.display_name AS child_name,m.body,m.gift_points,m.created_at,m.read_at,m.claimed_at
 FROM family_messages m JOIN child_profiles c ON c.family_id=m.family_id AND c.id=m.child_id
 WHERE m.family_id=? AND c.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 100`).bind(parent.family_id).all();return json({messages:rows.results||[]})}catch{return json({detail:'Messages unavailable'},503)}
}
export async function sendMessage(req,env){
 const input=await body(req);if(input.error)return input.error;
 const parent=await authorizedParent(req,env);if(!parent)return json({detail:'Not authenticated'},401);
 const value=input.value,text=typeof value?.body==='string'?value.body.trim():'',points=value?.gift_points??0;
 if(!uuid(value?.child_id)||!uuid(value?.request_id)||!text||text.length>500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)||!Number.isInteger(points)||points<0||points>100)return json({detail:'Ελέγξτε το παιδί, το μήνυμα και τους πόντους (0–100).'},400);
 try{
  const child=await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL').bind(parent.family_id,value.child_id).first();
  if(!child)return json({detail:'Child not found'},404);
  const id=crypto.randomUUID();
  await env.DB.prepare(`INSERT INTO family_messages (id,family_id,child_id,created_by,body,gift_points,request_id,created_at)
   VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(family_id,request_id) DO NOTHING`).bind(id,parent.family_id,value.child_id,parent.parent_id,text,points,value.request_id,new Date().toISOString()).run();
  const saved=await env.DB.prepare('SELECT id FROM family_messages WHERE family_id=? AND request_id=?').bind(parent.family_id,value.request_id).first();
  return saved?json({id:saved.id,sent:true},201):json({detail:'Message unavailable'},503);
 }catch{return json({detail:'Δεν στάλθηκε το μήνυμα. Δοκιμάστε ξανά.'},503)}
}
export async function childMessages(req,env){
 const child=await authorizedChild(req,env);if(!child)return json({detail:'Not authenticated'},401);
 try{const rows=await env.DB.prepare(`SELECT m.id,m.body,m.gift_points,m.created_at,m.read_at,m.claimed_at,p.display_name AS sender_name
 FROM family_messages m JOIN parent_users p ON p.id=m.created_by
 WHERE m.family_id=? AND m.child_id=? ORDER BY m.created_at DESC LIMIT 100`).bind(child.family_id,child.child_id).all();return json({messages:rows.results||[]})}catch{return json({detail:'Messages unavailable'},503)}
}
export async function readMessage(req,env){
 const input=await body(req);if(input.error)return input.error;
 const child=await authorizedChild(req,env);if(!child)return json({detail:'Not authenticated'},401);
 if(!uuid(input.value?.message_id))return json({detail:'Invalid message'},400);
 try{const r=await env.DB.prepare('UPDATE family_messages SET read_at=COALESCE(read_at,?) WHERE family_id=? AND child_id=? AND id=?').bind(new Date().toISOString(),child.family_id,child.child_id,input.value.message_id).run();return r.meta?.changes?json({read:true}):json({detail:'Message not found'},404)}catch{return json({detail:'Read status unavailable'},503)}
}
export async function claimLove(req,env){
 const input=await body(req);if(input.error)return input.error;
 const child=await authorizedChild(req,env);if(!child)return json({detail:'Not authenticated'},401);
 const id=input.value?.message_id;if(!uuid(id))return json({detail:'Invalid message'},400);
 try{
  const message=await env.DB.prepare('SELECT id,gift_points FROM family_messages WHERE family_id=? AND child_id=? AND id=?').bind(child.family_id,child.child_id,id).first();
  if(!message)return json({detail:'Message not found'},404);
  if(!message.gift_points)return json({detail:'This message has no points gift'},400);
  const now=new Date().toISOString(),key='love-'+id;
  // Both statements execute as one D1 transaction. The ledger uniqueness key makes every retry safe.
  await env.DB.batch([
   env.DB.prepare(`INSERT INTO point_ledger (id,family_id,child_id,delta,reason,actor_parent_id,idempotency_key,created_at)
    SELECT ?,m.family_id,m.child_id,m.gift_points,'love_credit',m.created_by,?,? FROM family_messages m
    WHERE m.family_id=? AND m.child_id=? AND m.id=? AND m.gift_points>0
    ON CONFLICT(family_id,child_id,idempotency_key) DO NOTHING`).bind(crypto.randomUUID(),key,now,child.family_id,child.child_id,id),
   env.DB.prepare(`UPDATE family_messages SET claimed_at=COALESCE(claimed_at,?),read_at=COALESCE(read_at,?)
    WHERE family_id=? AND child_id=? AND id=? AND EXISTS(SELECT 1 FROM point_ledger WHERE family_id=? AND child_id=? AND idempotency_key=?)`).bind(now,now,child.family_id,child.child_id,id,child.family_id,child.child_id,key)
  ]);
  return json({claimed:true,points:message.gift_points});
 }catch{return json({detail:'Δεν παραλήφθηκε το δώρο. Δοκίμασε ξανά.'},503)}
}
