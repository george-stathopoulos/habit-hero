import {submitHabitForActor} from './child-auth.mjs';
import {scheduleStatus} from './schedule.mjs';
import {localDay} from './timezone.mjs';
import {occurrenceKey,occurrenceSql} from './occurrence.mjs';
// Supervised child activity flow: parent session is required even for submissions.
// Independent child PIN sessions are deliberately NOT implemented yet.
import {authorizedParent} from './family-api.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=v=>typeof v==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
async function writeContext(request,env){
 if(request.headers.get('origin')!==origin)return {error:reply({detail:'Forbidden'},403)};
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return {error:reply({detail:'JSON required'},415)};
 const parent=await authorizedParent(request,env);
 if(!parent)return {error:reply({detail:'Not authenticated'},401)};
 let body;
 try{
  const raw=await request.text();
  if(raw.length>1400)return {error:reply({detail:'Request too large'},413)};
  body=JSON.parse(raw);
 }catch{return {error:reply({detail:'Invalid JSON'},400)}}
 if(!body||typeof body!=='object'||Array.isArray(body))return {error:reply({detail:'Invalid JSON'},400)};
 return {parent,body};
}
export async function listActivities(request,env){
 const actor=await authorizedParent(request,env);
 if(!actor)return reply({detail:'Not authenticated'},401);
 const today=localDay(actor.timezone);
 try{
  const results=await env.DB.prepare(`SELECT c.id AS child_id,c.display_name AS child_name,
   h.id AS habit_id,h.name_el AS habit_name,h.points,h.emoji,h.frequency_type,
   s.id AS completion_id,s.status AS submission_status,s.submitted_at
   FROM habit_assignments a JOIN child_profiles c ON c.id=a.child_id AND c.family_id=a.family_id
   JOIN habits h ON h.id=a.habit_id AND h.family_id=a.family_id
   LEFT JOIN completion_submissions s ON s.id = (
      SELECT x.id FROM completion_submissions x WHERE x.family_id=a.family_id
       AND x.child_id=a.child_id AND x.habit_id=a.habit_id
       AND x.occurrence_date=${occurrenceSql} ORDER BY x.submitted_at DESC LIMIT 1)
   WHERE a.family_id=? AND c.deleted_at IS NULL AND h.deleted_at IS NULL AND h.active=1
   ORDER BY c.display_name,h.name_el LIMIT 200`)
    .bind(today,today,today,actor.family_id).all();
  return reply({date:today,mode:'parent_supervised',
    activities:results.results||[]});
 }catch{return reply({detail:'Unable to load activities'},503)}
}
export async function submitActivity(request,env){
 const {parent,body,error}=await writeContext(request,env);
 if(error)return error;
 if(!uuid(body.child_id)||!uuid(body.habit_id))return reply({detail:'Invalid habit or child'},400);
 return submitHabitForActor({...parent,child_id:body.child_id},body,env);
}

export async function listApprovals(request,env){
 const actor=await authorizedParent(request,env);
 if(!actor)return reply({detail:'Not authenticated'},401);
 try{
  const pending=await env.DB.prepare(`SELECT s.id,s.child_id,c.display_name AS child_name,
   s.habit_id,h.name_el AS habit_name,h.points,s.occurrence_date,s.submitted_at
   FROM completion_submissions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id
   JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id
   WHERE s.family_id=? AND s.status='pending' AND c.deleted_at IS NULL
   ORDER BY s.submitted_at ASC LIMIT 100`).bind(actor.family_id).all();
  const today=localDay(actor.timezone);
  const rejected=await env.DB.prepare(`SELECT s.id,s.child_id,c.display_name AS child_name,s.habit_id,h.name_el AS habit_name,s.submitted_at FROM completion_submissions s
   JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id
   WHERE s.family_id=? AND s.status='rejected' AND h.active=1 AND h.deleted_at IS NULL AND c.deleted_at IS NULL
    AND s.occurrence_date=${occurrenceSql} AND NOT EXISTS(SELECT 1 FROM completion_submissions x WHERE x.family_id=s.family_id AND x.child_id=s.child_id AND x.habit_id=s.habit_id AND x.occurrence_date=s.occurrence_date AND x.slot_index=s.slot_index AND (x.status IN ('pending','approved') OR x.rowid>s.rowid))
   AND NOT EXISTS(SELECT 1 FROM habit_occurrence_controls k WHERE k.family_id=s.family_id AND k.child_id=s.child_id AND k.habit_id=s.habit_id AND k.retry_for=s.id)
   ORDER BY s.submitted_at DESC LIMIT 100`).bind(actor.family_id,today,today,today).all();
  return reply({pending:pending.results||[],rejected:rejected.results||[]});
 }catch{return reply({detail:'Unable to load approvals'},503)}
}
export async function reviewActivity(request,env){
 const {parent,body,error}=await writeContext(request,env);
 if(error)return error;
 if(!uuid(body.completion_id)||!['approved','rejected'].includes(body.decision))
  return reply({detail:'Invalid decision'},400);
 try{
  const record=await env.DB.prepare(`SELECT s.id,s.child_id,s.status,h.points FROM completion_submissions s
   JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id
   WHERE s.family_id=? AND s.id=?`).bind(parent.family_id,body.completion_id).first();
  if(!record)return reply({detail:'Submission not found'},404);
  if(record.status!=='pending')return reply({detail:'Already reviewed'},409);
  const now=new Date().toISOString();
  // D1 batch is a transaction. The ledger INSERT is conditional on this request
  // having transitioned the record. A retry cannot award points again.
  const update=env.DB.prepare(`UPDATE completion_submissions
   SET status=?,points_awarded=?,reviewed_at=?,reviewed_by=?
   WHERE family_id=? AND id=? AND status='pending'`)
   .bind(body.decision,body.decision==='approved'?record.points:0,now,parent.parent_id,parent.family_id,record.id);
  if(body.decision==='approved'){
   const ledger=env.DB.prepare(`INSERT INTO point_ledger
      (id,family_id,child_id,delta,reason,completion_id,actor_parent_id,idempotency_key,created_at)
      SELECT ?,s.family_id,s.child_id,s.points_awarded,'habit_completion',s.id,?,
       'completion-'+s.id,?
      FROM completion_submissions s
      WHERE s.family_id=? AND s.id=? AND s.status='approved' AND s.reviewed_at=?
       AND s.reviewed_by=? AND s.points_awarded>0`)
     .bind(crypto.randomUUID(),parent.parent_id,now,parent.family_id,record.id,now,parent.parent_id);
   const results=await env.DB.batch([update,ledger]);
   if(results[0]?.meta?.changes!==1||results[1]?.meta?.changes!==1)
     return reply({detail:'Review conflict. Refresh to see latest status'},409);
  }else{
   const result=await update.run();
   if(result.meta?.changes!==1)return reply({detail:'Already reviewed'},409);
  }
  return reply({completion_id:record.id,status:body.decision,
    points_awarded:body.decision==='approved'?record.points:0});
 }catch(e){
  if(/UNIQUE|constraint/i.test(String(e)))return reply({detail:'Already reviewed'},409);
  return reply({detail:'Could not review activity'},503);
 }
}
export async function listBalances(request,env){
 const actor=await authorizedParent(request,env);
 if(!actor)return reply({detail:'Not authenticated'},401);
 try{
  const results=await env.DB.prepare(`SELECT c.id AS child_id,c.display_name AS child_name,
     COALESCE(SUM(l.delta),0) AS points
     FROM child_profiles c LEFT JOIN point_ledger l ON l.family_id=c.family_id AND l.child_id=c.id
     WHERE c.family_id=? AND c.deleted_at IS NULL
     GROUP BY c.id,c.display_name ORDER BY c.created_at`).bind(actor.family_id).all();
  return reply({balances:results.results||[]});
 }catch{return reply({detail:'Could not load points'},503)}
}
