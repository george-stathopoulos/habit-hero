import {authorizedParent} from './family-api.mjs';
import {dayBoundary} from './history-api.mjs';
import {localDay} from './timezone.mjs';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
export async function familyAnalytics(req,env){
 const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);
 const q=new URL(req.url).searchParams,days=Number(q.get('days')||30),child=q.get('child')||'';
 if(![7,30,90].includes(days)||child.length>80)return reply({detail:'Invalid analytics period'},400);
 try{
  const end=localDay(actor.timezone),start=new Date(end+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-days+1);const from=start.toISOString().slice(0,10),utc=dayBoundary(from,actor.timezone);
  const childClause=alias=>child?' AND '+alias+'.child_id=?':'',args=[actor.family_id,utc,...(child?[child]:[])];
  const specs=[
   `SELECT s.child_id,c.display_name AS child_name,s.habit_id,h.name_el AS habit_name,s.status,s.submitted_at AS at,s.points_awarded FROM completion_submissions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id JOIN habits h ON h.id=s.habit_id AND h.family_id=s.family_id WHERE s.family_id=? AND s.submitted_at>=?${childClause('s')} ORDER BY s.submitted_at LIMIT 20001`,
   `SELECT l.child_id,l.delta,l.reason,l.created_at AS at FROM point_ledger l WHERE l.family_id=? AND l.created_at>=?${childClause('l')} LIMIT 20001`,
   `SELECT r.child_id,r.habit_id,r.status,r.created_at AS at FROM habit_help_requests r WHERE r.family_id=? AND r.created_at>=?${childClause('r')} LIMIT 20001`,
   `SELECT e.child_id,e.habit_id,e.created_at AS at FROM habit_lifecycle_events e WHERE e.family_id=? AND e.created_at>=? AND e.action='postpone'${childClause('e')} LIMIT 20001`
  ];
  const data=await Promise.all(specs.map(sql=>env.DB.prepare(sql).bind(...args).all()));
  if(data.some(x=>x.results?.length>20000))return reply({detail:'Too many records; choose a shorter period or one child'},413);
  const [attempts,ledger,help,postponements]=data.map(x=>x.results||[]),daily=new Map(),habits=new Map(),children=new Map();
  for(let i=0;i<days;i++){const d=new Date(from+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+i);daily.set(d.toISOString().slice(0,10),{date:d.toISOString().slice(0,10),attempts:0,approved:0,pending:0,rejected:0,earned:0,spent:0,help:0,postponed:0})}
  for(const a of attempts){const day=daily.get(localDay(actor.timezone,new Date(a.at)));if(!day)continue;day.attempts++;day[a.status]++;if(!habits.has(a.habit_id))habits.set(a.habit_id,{id:a.habit_id,name:a.habit_name,attempts:0,approved:0,pending:0,rejected:0,help:0,postponed:0,first_half:0,second_half:0});const h=habits.get(a.habit_id);h.attempts++;h[a.status]++;if(a.status==='approved'){const offset=Math.round((Date.parse(day.date)-Date.parse(from))/86400000);h[offset<days/2?'first_half':'second_half']++}
   if(!children.has(a.child_id))children.set(a.child_id,{id:a.child_id,name:a.child_name,attempts:0,approved:0,pending:0,rejected:0});const c=children.get(a.child_id);c.attempts++;c[a.status]++;
  }
  for(const l of ledger){const d=daily.get(localDay(actor.timezone,new Date(l.at)));if(d)d[l.delta>0?'earned':'spent']+=Math.abs(l.delta)}
  for(const [rows,key]of [[help,'help'],[postponements,'postponed']])for(const row of rows){const d=daily.get(localDay(actor.timezone,new Date(row.at)));if(d)d[key]++;const h=habits.get(row.habit_id);if(h)h[key]++}
  const totals=[...daily.values()].reduce((t,d)=>{for(const k of ['attempts','approved','pending','rejected','earned','spent','help','postponed'])t[k]=(t[k]||0)+d[k];return t},{});
  const recap={effort:totals.attempts,active_days:[...daily.values()].filter(d=>d.attempts).length,help_requests:totals.help,prompts:['Ποια μικρή προσπάθεια σου άρεσε περισσότερο;','Ποια αποστολή χρειάζεται να κάνουμε πιο εύκολη;',totals.help?'Σε ποιο σημείο θα βοηθούσε να το κάνουμε μαζί;':'Τι θα ήθελες να δοκιμάσουμε μαζί την επόμενη εβδομάδα;']};
  return reply({days,from,to:end,timezone:actor.timezone,totals,daily:[...daily.values()],habits:[...habits.values()],children:[...children.values()],recap});
 }catch{return reply({detail:'Could not load analytics'},503)}
}
