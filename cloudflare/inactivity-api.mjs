import {authorizedParent} from './family-api.mjs';
import {scheduleStatus} from './schedule.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
export async function inactivitySettings(req,env){const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{return reply({rules:(await env.DB.prepare('SELECT child_id,enabled,points,hours,updated_at FROM inactivity_rules WHERE family_id=?').bind(actor.family_id).all()).results||[]})}catch{return reply({detail:'Could not load optional rules'},503)}}
export async function saveInactivity(req,env){if(req.headers.get('origin')!==origin)return reply({detail:'Forbidden'},403);if(!(req.headers.get('content-type')||'').startsWith('application/json'))return reply({detail:'JSON required'},415);const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);let data;try{const text=await req.text();if(text.length>1000)throw Error();data=JSON.parse(text)}catch{return reply({detail:'Invalid JSON'},400)}
 if(!data||typeof data.enabled!=='boolean'||!Number.isInteger(data.points)||data.points<1||data.points>100||![24,48,72,168].includes(data.hours)||typeof data.child_id!=='string')return reply({detail:'Invalid inactivity rule'},400);
 try{if(!await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL').bind(actor.family_id,data.child_id).first())return reply({detail:'Child not found'},404);
 const now=new Date().toISOString();await env.DB.prepare(`INSERT INTO inactivity_rules(family_id,child_id,enabled,points,hours,configured_by,updated_at,checked_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(family_id,child_id) DO UPDATE SET enabled=excluded.enabled,points=excluded.points,hours=excluded.hours,configured_by=excluded.configured_by,updated_at=excluded.updated_at,checked_at=excluded.checked_at`).bind(actor.family_id,data.child_id,data.enabled?1:0,data.points,data.hours,actor.parent_id,now,now).run();return reply({ok:true})}catch{return reply({detail:'Could not save optional rule'},503)}}
export async function applyInactivityRules(env){
 const now=new Date(),at=now.toISOString();const rules=(await env.DB.prepare(`SELECT r.*,COALESCE(s.timezone,'UTC') AS timezone FROM inactivity_rules r JOIN child_profiles c ON c.id=r.child_id AND c.family_id=r.family_id JOIN families f ON f.id=r.family_id LEFT JOIN family_settings s ON s.family_id=r.family_id WHERE r.enabled=1 AND c.deleted_at IS NULL AND f.deleted_at IS NULL ORDER BY r.checked_at LIMIT 20`).bind().all()).results||[];
 for(const rule of rules){try{
  await env.DB.prepare('UPDATE inactivity_rules SET checked_at=? WHERE family_id=? AND child_id=? AND updated_at=?').bind(at,rule.family_id,rule.child_id,rule.updated_at).run();
  const habits=(await env.DB.prepare('SELECT h.frequency_days_json FROM habits h JOIN habit_assignments a ON a.family_id=h.family_id AND a.habit_id=h.id WHERE a.family_id=? AND a.child_id=? AND h.active=1 AND h.deleted_at IS NULL').bind(rule.family_id,rule.child_id).all()).results||[];
  if(!habits.some(h=>scheduleStatus(h.frequency_days_json,rule.timezone,now).schedule_available))continue;
  const activity=await env.DB.prepare(`SELECT MAX(at) AS at FROM (SELECT submitted_at AS at FROM completion_submissions WHERE family_id=? AND child_id=? UNION ALL SELECT created_at AS at FROM habit_help_requests WHERE family_id=? AND child_id=?)`).bind(rule.family_id,rule.child_id,rule.family_id,rule.child_id).first();
  const anchor=activity?.at>rule.updated_at?activity.at:rule.updated_at,period=rule.hours*3600000,elapsed=now-Date.parse(anchor);if(elapsed<period)continue;
  const bucket=Math.floor(elapsed/period),key='inactivity-'+rule.updated_at+'-'+anchor+'-'+bucket;
  // Balance, current rule and latest effort are checked inside the conditional write.
  await env.DB.prepare(`INSERT OR IGNORE INTO point_ledger(id,family_id,child_id,delta,reason,actor_parent_id,idempotency_key,created_at)
   SELECT ?,r.family_id,r.child_id,-MIN(r.points,(SELECT COALESCE(SUM(delta),0) FROM point_ledger l WHERE l.family_id=r.family_id AND l.child_id=r.child_id)),'inactivity_penalty',r.configured_by,?,?
   FROM inactivity_rules r WHERE r.family_id=? AND r.child_id=? AND r.enabled=1 AND r.updated_at=?
    AND (SELECT COALESCE(SUM(delta),0) FROM point_ledger l WHERE l.family_id=r.family_id AND l.child_id=r.child_id)>0
    AND NOT EXISTS(SELECT 1 FROM point_ledger recent WHERE recent.family_id=r.family_id AND recent.child_id=r.child_id AND recent.reason='inactivity_penalty' AND recent.created_at>?)
    AND NOT EXISTS(SELECT 1 FROM completion_submissions s WHERE s.family_id=r.family_id AND s.child_id=r.child_id AND s.submitted_at>?)
    AND NOT EXISTS(SELECT 1 FROM habit_help_requests h WHERE h.family_id=r.family_id AND h.child_id=r.child_id AND h.created_at>?)`)
   .bind(crypto.randomUUID(),key,at,rule.family_id,rule.child_id,rule.updated_at,new Date(now.getTime()-period).toISOString(),anchor,anchor).run();
 }catch{/* A failed child rule must not stop the scheduler. */}}
}
