import {localDay} from './timezone.mjs';
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
async function metrics(env,familyId,childId=null,timezone='UTC'){
 const today=localDay(timezone);
 const from=new Date(today+'T12:00:00.000Z');from.setUTCDate(from.getUTCDate()-29);
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
  const lifetime=await env.DB.prepare(`SELECT COUNT(*) AS approved_total
   FROM completion_submissions WHERE family_id=? AND child_id=? AND status='approved'`)
   .bind(familyId,child.id).first();
  const earned=await env.DB.prepare(`SELECT COALESCE(SUM(CASE WHEN delta>0 THEN delta ELSE 0 END),0) AS earned_total
   FROM point_ledger WHERE family_id=? AND child_id=?`).bind(familyId,child.id).first();
  const history=await env.DB.prepare(`SELECT s.id,s.occurrence_date,s.status,
   h.name_el AS habit_name,s.points_awarded,s.submitted_at,s.reviewed_at
   FROM completion_submissions s JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id
   WHERE s.family_id=? AND s.child_id=? ORDER BY s.submitted_at DESC LIMIT 20`)
    .bind(familyId,child.id).all();
  const balance=await env.DB.prepare(`SELECT COALESCE(SUM(delta),0) AS balance
   FROM point_ledger WHERE family_id=? AND child_id=?`).bind(familyId,child.id).first();
  const calendar=completed.results||[];
  const earnedTotal=earned?.earned_total??0,approvedTotal=lifetime?.approved_total??0;
  const badges=[];
  if(approvedTotal>=1)badges.push({id:'first_quest',name:'Πρώτη αποστολή',emoji:'🌟'});
  if(approvedTotal>=10)badges.push({id:'ten_quests',name:'10 αποστολές',emoji:'🥉'});
  if(approvedTotal>=50)badges.push({id:'fifty_quests',name:'50 αποστολές',emoji:'🥈'});
  if(approvedTotal>=100)badges.push({id:'hundred_quests',name:'100 αποστολές',emoji:'🥇'});
  data.push({child_id:child.id,child_name:child.display_name,
   level:Math.floor(earnedTotal/100)+1,level_points:earnedTotal%100,
   lifetime_points_earned:earnedTotal,lifetime_approved:approvedTotal,badges,
   approved_last_30_days:calendar.reduce((sum,r)=>sum+r.total,0),
   earned_last_30_days:calendar.reduce((sum,r)=>sum+r.points_earned,0),
   active_days_last_30_days:calendar.length,
   current_streak_days:streak(calendar.map(r=>r.occurrence_date),today),
   points_balance:balance?.balance??0,
   recent_activity:history.results||[],
   activity_by_day:calendar.map(r=>({date:r.occurrence_date,completed:r.total}))});
 }
 return {as_of:today,window_days:30,children:data};
}
export async function parentProgress(req,env){
 const actor=await authorizedParent(req,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 try{return respond(await metrics(env,actor.family_id,null,actor.timezone))}
 catch{return respond({detail:'Could not load progress'},503)}
}
export async function childProgress(req,env){
 const actor=await authorizedChild(req,env);
 if(!actor)return respond({detail:'Not authenticated'},401);
 try{
  const data=await metrics(env,actor.family_id,actor.child_id,actor.timezone);
  return respond({as_of:data.as_of,window_days:30,progress:data.children[0]??null});
 }catch{return respond({detail:'Could not load progress'},503)}
}
