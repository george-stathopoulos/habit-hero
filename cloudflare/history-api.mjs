import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
// Convert a family-local calendar boundary to UTC, including DST offset changes.
export function dayBoundary(day,timezone){
 let value=Date.parse(day+'T00:00:00Z');
 for(let i=0;i<4;i++){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(value));
  const get=k=>parts.find(x=>x.type===k).value;
  const local=Date.parse(`${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`);
  value+=Date.parse(day+'T00:00:00Z')-local;
 }
 return new Date(value).toISOString();
}
const sources={
 points:`SELECT l.id,l.child_id,c.display_name AS child_name,l.created_at AS at,l.reason AS status,l.delta AS points,COALESCE(h.name_el,r.name_el,l.reason) AS title FROM point_ledger l JOIN child_profiles c ON c.id=l.child_id AND c.family_id=l.family_id LEFT JOIN completion_submissions s ON s.id=l.completion_id AND s.family_id=l.family_id LEFT JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id LEFT JOIN reward_redemptions d ON d.id=l.redemption_id AND d.family_id=l.family_id LEFT JOIN reward_catalog r ON r.id=d.reward_id AND r.family_id=d.family_id WHERE l.family_id=?`,
 attempts:`SELECT s.id,s.child_id,c.display_name AS child_name,s.submitted_at AS at,s.status,s.points_awarded AS points,h.name_el AS title,s.reviewed_at,s.occurrence_date,s.slot_index FROM completion_submissions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id WHERE s.family_id=?`,
 approvals:`SELECT s.id,s.child_id,c.display_name AS child_name,s.reviewed_at AS at,s.status,s.points_awarded AS points,h.name_el AS title,s.submitted_at,s.occurrence_date,s.slot_index FROM completion_submissions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id WHERE s.family_id=? AND s.reviewed_at IS NOT NULL`,
 rewards:`SELECT d.id,d.child_id,c.display_name AS child_name,d.requested_at AS at,d.status,d.points_spent AS points,r.name_el AS title,d.resolved_at FROM reward_redemptions d JOIN child_profiles c ON c.id=d.child_id AND c.family_id=d.family_id JOIN reward_catalog r ON r.id=d.reward_id AND r.family_id=d.family_id WHERE d.family_id=?`,
 lifecycle:`SELECT e.id,e.child_id,c.display_name AS child_name,e.created_at AS at,e.action AS status,0 AS points,h.name_el AS title,e.detail FROM habit_lifecycle_events e LEFT JOIN child_profiles c ON c.id=e.child_id AND c.family_id=e.family_id JOIN habits h ON h.id=e.habit_id AND h.family_id=e.family_id WHERE e.family_id=?`
};
export async function familyHistory(req,env,isChild=false){
 const actor=await (isChild?authorizedChild:authorizedParent)(req,env);if(!actor)return reply({detail:'Not authenticated'},401);
 const q=new URL(req.url).searchParams,kind=q.get('kind')||'points',child=isChild?actor.child_id:q.get('child')||'',from=q.get('from')||'',to=q.get('to')||'',status=q.get('status')||'',search=q.get('q')||'';
 const validDay=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!sources[kind]||(from&&!validDay(from))||(to&&!validDay(to))||(from&&to&&from>to)||search.length>100||status.length>40||child.length>80)return reply({detail:'Invalid history filters'},400);
 let cursor;try{if(q.get('cursor')){cursor=JSON.parse(atob(q.get('cursor')));if(!Array.isArray(cursor)||cursor.length!==2||typeof cursor[0]!=='string'||typeof cursor[1]!=='string'||cursor[0].length>30||cursor[1].length>80)throw Error()}}catch{return reply({detail:'Invalid page cursor'},400)}
 try{
  let sql='SELECT * FROM ('+sources[kind]+') WHERE 1=1',args=[actor.family_id];
  if(child){sql+=' AND child_id=?';args.push(child)}if(from){sql+=' AND at>=?';args.push(dayBoundary(from,actor.timezone))}
  if(to){const next=new Date(to+'T12:00:00Z');next.setUTCDate(next.getUTCDate()+1);sql+=' AND at<?';args.push(dayBoundary(next.toISOString().slice(0,10),actor.timezone))}
  if(status){sql+=' AND status=?';args.push(status)}if(search){sql+=" AND title LIKE ? ESCAPE '\\'";args.push('%'+search.replace(/[\\%_]/g,'\\$&')+'%')}
  if(cursor){sql+=' AND (at<? OR (at=? AND id<?))';args.push(cursor[0],cursor[0],cursor[1])}
  sql+=' ORDER BY at DESC,id DESC LIMIT 31';
  const rows=(await env.DB.prepare(sql).bind(...args).all()).results||[],items=rows.slice(0,30),last=items.at(-1);
  return reply({kind,items,next_cursor:rows.length>30?btoa(JSON.stringify([last.at,last.id])):null,timezone:actor.timezone||'UTC'});
 }catch{return reply({detail:'Could not load history'},503)}
}
