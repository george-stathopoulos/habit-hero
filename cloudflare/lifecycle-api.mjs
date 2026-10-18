import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
import {localDay} from './timezone.mjs';
import {occurrenceKey} from './occurrence.mjs';
import {slotAvailability} from './schedule.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const uuid=v=>typeof v==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
async function input(req){
 if(req.headers.get('origin')!==origin)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try{const raw=await req.text();if(raw.length>1024)return {error:json({detail:'Request too large'},413)};const body=JSON.parse(raw);if(!body||Array.isArray(body)||typeof body!=='object')throw Error();return {body}}catch{return {error:json({detail:'Invalid JSON'},400)}}
}
export async function parentLifecycle(req,env){
 const {body,error}=await input(req);if(error)return error;
 const actor=await authorizedParent(req,env);if(!actor)return json({detail:'Not authenticated'},401);
 if(!uuid(body.habit_id)||!['pause','resume','restore','retry'].includes(body.action)||(body.action==='retry'&&!uuid(body.completion_id)))return json({detail:'Invalid lifecycle action'},400);
 try{
  const now=new Date().toISOString();let mutation,event;
  if(body.action==='retry'){
   const attempt=await env.DB.prepare(`SELECT s.*,h.frequency_type FROM completion_submissions s JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id
    WHERE s.family_id=? AND s.habit_id=? AND s.id=? AND s.status='rejected' AND h.active=1 AND h.deleted_at IS NULL
     AND NOT EXISTS(SELECT 1 FROM completion_submissions x WHERE x.family_id=s.family_id AND x.child_id=s.child_id AND x.habit_id=s.habit_id AND x.occurrence_date=s.occurrence_date AND x.slot_index=s.slot_index AND (x.status IN ('pending','approved') OR x.rowid>s.rowid))`)
    .bind(actor.family_id,body.habit_id,body.completion_id).first();
   if(!attempt)return json({detail:'Η προσπάθεια δεν είναι διαθέσιμη για επανάληψη.'},409);
   if(attempt.occurrence_date!==occurrenceKey(attempt.frequency_type,localDay(actor.timezone)))return json({detail:'Η περίοδος αυτής της προσπάθειας έχει λήξει. Χρησιμοποιήστε την τρέχουσα αποστολή.'},409);
   mutation=env.DB.prepare(`INSERT INTO habit_occurrence_controls(family_id,child_id,habit_id,occurrence_date,slot_index,retry_for,updated_at) VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(family_id,child_id,habit_id,occurrence_date,slot_index) DO UPDATE SET retry_for=excluded.retry_for,deferred_until=NULL,updated_at=excluded.updated_at`)
    .bind(actor.family_id,attempt.child_id,attempt.habit_id,attempt.occurrence_date,attempt.slot_index,attempt.id,now);
   event={child:attempt.child_id,completion:attempt.id};
  }else{
   const predicate={pause:'active=1 AND deleted_at IS NULL',resume:'active=0 AND deleted_at IS NULL',restore:'deleted_at IS NOT NULL'}[body.action];
   mutation=env.DB.prepare(`UPDATE habits SET active=?,deleted_at=NULL,updated_at=? WHERE family_id=? AND id=? AND ${predicate}`)
    .bind(body.action==='pause'?0:1,now,actor.family_id,body.habit_id);
   event={};
  }
  const audit=env.DB.prepare(`INSERT INTO habit_lifecycle_events(id,family_id,child_id,habit_id,completion_id,action,actor_parent_id,created_at)
   SELECT ?,?,?,?,?,?,?,? WHERE changes()=1`).bind(crypto.randomUUID(),actor.family_id,event.child||null,body.habit_id,event.completion||null,body.action,actor.parent_id,now);
  const results=await env.DB.batch([mutation,audit]);
  if(results[0]?.meta?.changes!==1)return json({detail:'Η κατάσταση άλλαξε ήδη. Ανανεώστε τη σελίδα.'},409);
  return json({status:body.action});
 }catch{return json({detail:'Could not update habit lifecycle'},503)}
}
export async function childPostpone(req,env){
 const {body,error}=await input(req);if(error)return error;
 const actor=await authorizedChild(req,env);if(!actor)return json({detail:'Not authenticated'},401);
 const slot=body.slot_index??1,minutes=body.minutes;
 if(!uuid(body.habit_id)||!Number.isInteger(slot)||slot<1||slot>5||![0,15,30,60].includes(minutes))return json({detail:'Invalid postponement'},400);
 try{
  const habit=await env.DB.prepare(`SELECT h.* FROM habits h JOIN habit_assignments a ON a.family_id=h.family_id AND a.habit_id=h.id
   WHERE h.family_id=? AND h.id=? AND a.child_id=? AND h.active=1 AND h.deleted_at IS NULL`).bind(actor.family_id,body.habit_id,actor.child_id).first();
  if(!habit)return json({detail:'Habit not assigned'},404);
  if(slot>(habit.frequency_type==='once'?1:habit.frequency_count||1))return json({detail:'Invalid occurrence'},400);
  const now=new Date(),period=occurrenceKey(habit.frequency_type,localDay(actor.timezone,now));
  const rows=await env.DB.prepare(`SELECT id AS completion_id,status AS submission_status,slot_index,submitted_at FROM completion_submissions WHERE family_id=? AND child_id=? AND habit_id=? AND occurrence_date=? ORDER BY submitted_at DESC,rowid DESC`).bind(actor.family_id,actor.child_id,habit.id,period).all();
  if((rows.results||[]).some(x=>x.slot_index===slot))return json({detail:'Η προσπάθεια έχει ήδη σταλεί. Μιλήστε με τον γονέα σας.'},409);
  if(minutes&&!slotAvailability(habit,rows.results||[],slot,actor.timezone,now).schedule_available)return json({detail:'Η αποστολή δεν είναι διαθέσιμη τώρα.'},409);
  const until=new Date(now.getTime()+minutes*60000);
  if(minutes&&localDay(actor.timezone,until)!==localDay(actor.timezone,now))return json({detail:'Διαλέξτε μικρότερο διάλειμμα μέσα στη σημερινή ημέρα.'},400);
  const at=now.toISOString();
  await env.DB.batch([
   env.DB.prepare(`INSERT INTO habit_occurrence_controls(family_id,child_id,habit_id,occurrence_date,slot_index,deferred_until,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(family_id,child_id,habit_id,occurrence_date,slot_index) DO UPDATE SET deferred_until=excluded.deferred_until,updated_at=excluded.updated_at`)
    .bind(actor.family_id,actor.child_id,habit.id,period,slot,minutes?until.toISOString():null,at),
   env.DB.prepare(`INSERT INTO habit_lifecycle_events(id,family_id,child_id,habit_id,action,detail,created_at) VALUES(?,?,?,?,?,?,?)`)
    .bind(crypto.randomUUID(),actor.family_id,actor.child_id,habit.id,minutes?'postpone':'cancel_postpone',minutes?until.toISOString():null,at)
  ]);
  return json({deferred_until:minutes?until.toISOString():null});
 }catch{return json({detail:'Could not postpone habit'},503)}
}
