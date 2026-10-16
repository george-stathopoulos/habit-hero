// Read-only progress insights. All tenant and child access is derived from verified sessions.
import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const respond=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const day=timestamp=>timestamp.slice(0,10);
function streak(dates,today){
 const achieved=new Set(dates);
 const cursor=new Date(today+'T12:00:00Z');
 if(!achieved.has(day(cursor.toISOString())))cursor.setUTCDate(cursor.getUTCDate()-1);
 let count=0;
 while(count<366&&achieved.has(day(cursor.toISOString()))){
  count++;cursor.setUTCDate(cursor.getUTCDate()-1);
 }
 return count;
}
async function metrics(env,familyId,childId=null){
 const now=new Date(),today=day(now.toISOString());
 const from=new Date(now);from.setUTCDate(from.getUTCDate()-29);
 const since=day(from.toISOString());
 const children=await env.DB.prepare(`SELECT id,display_name FROM child_profiles
  WHERE family_id=? AND deleted_at IS NULL AND (? IS NULL OR id=?)
  ORDER BY created_at LIMIT 100`).bind(familyId,childId,childId).all();
 const data=[];
 for(const child of children.results||[]){
  const completed=await env.DB.prepare(`SELECT occurrence_date, COUNT(*) AS total,
   COALESCE(SUM(points_awarded),0) AS points_earned
   FROM completion_submissions
   WHERE family_id=? AND child_id=? AND status='approved' AND occurrence_date>=?
   GROUP BY occurrence_date ORDER BY occurrence_date DESC`)
    .bind(familyId,child.id,since).all();
  const balance=await env.DB.prepare(`SELECT COALESCE(SUM(delta),0) AS balance
   FROM point_ledger WHERE family_id=? AND child_id=?`).bind(familyId,child.id).first();
  const calendar=completed.results||[];
  data.push({child_id:child.id,child_name:child.display_name,
   approved_last_30_days:calendar.reduce((sum,r)=>sum+r.total,0),
   earned_last_30_days:calendar.reduce((sum,r)=>sum+r.points_earned,0),
   active_days_last_30_days:calendar.length,
   current_streak_days:streak(calendar.map(r=>r.occurrence_date),today),
   points_balance:balance?.balance??0,
   activity_by_day:calendar.map(r=>({date:r.occurrence_date,completed:r.total}))});
 }
 return {as_of:today,window_days:30,children:data};
}
export async function parentProgress(req,env){
 const actor=await authorizedParent(req,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 try{return respond(await metrics(env,actor.family_id))}
 catch{return respond({detail:'Could not load progress'},503)}
}
export async function childProgress(req,env){
 const actor=await authorizedChild(req,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 try{
  const data=await metrics(env,actor.family_id,actor.child_id);
  return respond({as_of:data.as_of,window_days:30,progress:data.children[0]??null});
 }catch{return respond({detail:'Could not load progress'},503)}
}
