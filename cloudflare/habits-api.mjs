import {authorizedParent} from './family-api.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const respond=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
export async function listHabits(request,env){
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 try{
  const result=await env.DB.prepare(`SELECT h.id,h.name_el,h.name_en,h.points,h.emoji,h.frequency_type,
   a.child_id,c.display_name AS child_name
   FROM habits h LEFT JOIN habit_assignments a ON a.family_id=h.family_id AND a.habit_id=h.id
   LEFT JOIN child_profiles c ON c.id=a.child_id AND c.family_id=h.family_id AND c.deleted_at IS NULL
   WHERE h.family_id=? AND h.active=1 AND h.deleted_at IS NULL ORDER BY h.created_at DESC LIMIT 150`)
   .bind(actor.family_id).all();
  const habits=new Map();
  for(const r of result.results||[]){
   if(!habits.has(r.id))habits.set(r.id,{id:r.id,name:r.name_el,points:r.points,emoji:r.emoji,frequency:r.frequency_type,children:[]});
   if(r.child_id&&r.child_name)habits.get(r.id).children.push({id:r.child_id,name:r.child_name});
  }
  return respond({habits:[...habits.values()]});
 }catch{return respond({detail:'Service temporarily unavailable'},503)}
}
export async function createHabit(request,env){
 if(request.headers.get('origin')!==origin)return respond({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 let value;
 try{
  const body=await request.text();
  if(body.length>2000)return respond({detail:'Request too large'},413);
  value=JSON.parse(body);
 }catch{return respond({detail:'Invalid JSON'},400)}
 const name=typeof value?.name==='string'?value.name.trim():'';
 const points=value?.points;
 const frequency=value?.frequency||'daily';
 const childId=value?.child_id;
 const count=value?.frequency_count??1,retry=value?.retry_delay_minutes??0;
 const description=typeof value?.description==='string'?value.description.trim():'';
 const benefit=typeof value?.benefit==='string'?value.benefit.trim():'';
 if(!name||name.length>100||/[\u0000-\u001f\u007f]/.test(name)
    ||!Number.isInteger(points)||points<1||points>1000
    ||!['daily','weekly','monthly','once'].includes(frequency)
    ||!Number.isInteger(count)||count<1||count>5||!Number.isInteger(retry)||retry<0||retry>1440
    ||description.length>500||benefit.length>500
    ||typeof childId!=='string'||! /^[0-9a-f-]{36}$/i.test(childId))
    return respond({detail:'Invalid habit details'},400);
 try{
  const child=await env.DB.prepare('SELECT id FROM child_profiles WHERE id=? AND family_id=? AND deleted_at IS NULL').bind(childId,actor.family_id).first();
  if(!child)return respond({detail:'Child not found in your family'},404);
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const batch=await env.DB.batch([
    env.DB.prepare(`INSERT INTO habits
      (id,family_id,name_el,name_en,points,frequency_type,frequency_count,retry_delay_minutes,description_el,why_important_el,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id,actor.family_id,name,'',points,frequency,count,retry,description,benefit,now,now),
    env.DB.prepare(`INSERT INTO habit_assignments (family_id,habit_id,child_id,assigned_at)
      VALUES (?,?,?,?)`).bind(actor.family_id,id,childId,now)
  ]);
  if(batch.some(x=>x.success===false))return respond({detail:'Could not save habit'},503);
  return respond({id,name,points,frequency,child_id:childId},201);
 }catch{return respond({detail:'Could not save habit'},503)}
}

/** Edit habit properties without rewriting historical submissions or points. */
export async function updateHabit(request,env){
 if(request.headers.get('origin')!==origin)return respond({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 let data;
 try{const raw=await request.text();if(raw.length>2048)return respond({detail:'Request too large'},413);data=JSON.parse(raw)}
 catch{return respond({detail:'Invalid JSON'},400)}
 const id=data?.habit_id,name=typeof data?.name==='string'?data.name.trim():'',
  points=data?.points,frequency=data?.frequency;
 if(typeof id!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id)||
    !name||name.length>100||/[\u0000-\u001f\u007f]/.test(name)||
    !Number.isInteger(points)||points<1||points>1000||
    !['daily','weekly','monthly','once'].includes(frequency))
  return respond({detail:'Invalid habit details'},400);
 try{
  const result=await env.DB.prepare(`UPDATE habits SET name_el=?,points=?,frequency_type=?,updated_at=?
    WHERE family_id=? AND id=? AND deleted_at IS NULL AND active=1`)
   .bind(name,points,frequency,new Date().toISOString(),actor.family_id,id).run();
  if(result.meta?.changes!==1)return respond({detail:'Habit not found'},404);
  return respond({id,name,points,frequency});
 }catch{return respond({detail:'Could not update habit'},503)}
}
/** Soft archive: historical submissions and immutable point-ledger entries remain intact. */
export async function archiveHabit(request,env){
 if(request.headers.get('origin')!==origin)return respond({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 let data;
 try{const raw=await request.text();if(raw.length>512)return respond({detail:'Request too large'},413);data=JSON.parse(raw)}
 catch{return respond({detail:'Invalid JSON'},400)}
 const id=data?.habit_id;
 if(typeof id!=='string'||!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(id))
  return respond({detail:'Invalid habit'},400);
 try{
  const now=new Date().toISOString();
  const result=await env.DB.prepare(`UPDATE habits SET active=0,deleted_at=?,updated_at=?
    WHERE family_id=? AND id=? AND active=1 AND deleted_at IS NULL`)
    .bind(now,now,actor.family_id,id).run();
  if(result.meta?.changes!==1)return respond({detail:'Habit not found or already archived'},404);
  return respond({id,status:'archived'});
 }catch{return respond({detail:'Could not archive habit'},503)}
}

/** Assign an existing active habit to another child in the same family. */
export async function assignHabit(request,env){
 if(request.headers.get('origin')!==origin)return respond({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return respond({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 let body;
 try{const raw=await request.text();if(raw.length>512)return respond({detail:'Request too large'},413);body=JSON.parse(raw)}
 catch{return respond({detail:'Invalid JSON'},400)}
 const valid=x=>typeof x==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(x);
 if(!valid(body?.habit_id)||!valid(body?.child_id))return respond({detail:'Invalid assignment'},400);
 try{
  const result=await env.DB.prepare(`INSERT INTO habit_assignments (family_id,habit_id,child_id,assigned_at)
   SELECT ?,h.id,c.id,? FROM habits h JOIN child_profiles c ON c.family_id=h.family_id
   WHERE h.family_id=? AND h.id=? AND c.id=? AND h.active=1 AND h.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND NOT EXISTS(SELECT 1 FROM habit_assignments a WHERE a.family_id=h.family_id
      AND a.habit_id=h.id AND a.child_id=c.id)`)
   .bind(actor.family_id,new Date().toISOString(),actor.family_id,body.habit_id,body.child_id).run();
  if(result.meta?.changes!==1)return respond({detail:'Assignment unavailable or already exists'},409);
  return respond({status:'assigned'},201);
 }catch{return respond({detail:'Unable to assign habit'},503)}
}

export async function unassignHabit(request,env){
 if(request.headers.get('origin')!==origin)return respond({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return respond({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 let body;
 try{const raw=await request.text();if(raw.length>512)return respond({detail:'Request too large'},413);body=JSON.parse(raw)}
 catch{return respond({detail:'Invalid JSON'},400)}
 const valid=x=>typeof x==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(x);
 if(!valid(body?.habit_id)||!valid(body?.child_id))return respond({detail:'Invalid assignment'},400);
 try{
  const result=await env.DB.prepare(`DELETE FROM habit_assignments
   WHERE family_id=? AND habit_id=? AND child_id=?`)
   .bind(actor.family_id,body.habit_id,body.child_id).run();
  if(result.meta?.changes!==1)return respond({detail:'Assignment not found'},404);
  return respond({status:'unassigned'});
 }catch{return respond({detail:'Could not remove assignment'},503)}
}
