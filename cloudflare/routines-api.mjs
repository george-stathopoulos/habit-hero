import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const uuid=v=>typeof v==='string'&&/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(v);
export async function routineDefinitions(req,env,isChild=false){const actor=await (isChild?authorizedChild:authorizedParent)(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{const routines=await env.DB.prepare('SELECT id,name FROM custom_routines WHERE family_id=? ORDER BY created_at').bind(actor.family_id).all();const steps=await env.DB.prepare('SELECT child_id,habit_id,routine_key,step_order FROM child_routine_steps WHERE family_id=?'+(isChild?' AND child_id=?':'')).bind(actor.family_id,...(isChild?[actor.child_id]:[])).all();return reply({routines:routines.results||[],steps:steps.results||[]})}catch{return reply({detail:'Could not load routines'},503)}}
export async function saveRoutines(req,env){
 if(req.headers.get('origin')!==origin)return reply({detail:'Forbidden'},403);if(!(req.headers.get('content-type')||'').startsWith('application/json'))return reply({detail:'JSON required'},415);
 const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);let data;try{const raw=await req.text();if(raw.length>16000)return reply({detail:'Too many routine steps'},413);data=JSON.parse(raw);if(!data||Array.isArray(data))throw Error()}catch{return reply({detail:'Invalid JSON'},400)}
 try{const now=new Date().toISOString();if(data.action==='create'||data.action==='rename'){
  const name=typeof data.name==='string'?data.name.trim():'';if(!name||name.length>60||/[\u0000-\u001f]/.test(name)||(data.action==='rename'&&!uuid(data.id)))return reply({detail:'Invalid routine name'},400);
  const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM custom_routines WHERE family_id=?').bind(actor.family_id).first();if(data.action==='create'&&count.n>=30)return reply({detail:'Maximum 30 custom routines per family'},400);
  const id=data.action==='create'?crypto.randomUUID():data.id;const result=data.action==='create'?await env.DB.prepare('INSERT INTO custom_routines(id,family_id,name,created_at,updated_at) VALUES(?,?,?,?,?)').bind(id,actor.family_id,name,now,now).run():await env.DB.prepare('UPDATE custom_routines SET name=?,updated_at=? WHERE family_id=? AND id=?').bind(name,now,actor.family_id,id).run();if(!result.meta?.changes)return reply({detail:'Routine not found'},404);return reply({id,name},data.action==='create'?201:200);
 }
 if(data.action!=='assign'||!uuid(data.child_id)||!Array.isArray(data.steps)||!data.steps.length||data.steps.length>100||new Set(data.steps.map(s=>s.habit_id)).size!==data.steps.length)return reply({detail:'Invalid routine steps'},400);
 const child=await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL').bind(actor.family_id,data.child_id).first();if(!child)return reply({detail:'Child not found'},404);
 const definitions=await env.DB.prepare('SELECT id FROM custom_routines WHERE family_id=?').bind(actor.family_id).all(),keys=new Set(['','morning','afterschool','bedtime',...(definitions.results||[]).map(r=>r.id)]);
 const habits=await env.DB.prepare('SELECT habit_id FROM habit_assignments WHERE family_id=? AND child_id=?').bind(actor.family_id,data.child_id).all(),assigned=new Set((habits.results||[]).map(h=>h.habit_id));
 const statements=[];for(const step of data.steps){if(!uuid(step.habit_id)||!assigned.has(step.habit_id)||!keys.has(step.routine_key)||!Number.isInteger(step.step_order)||step.step_order<1||step.step_order>100)return reply({detail:'Invalid routine or assignment'},400);
 statements.push(env.DB.prepare(`INSERT INTO child_routine_steps(family_id,child_id,habit_id,routine_key,step_order,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(family_id,child_id,habit_id) DO UPDATE SET routine_key=excluded.routine_key,step_order=excluded.step_order,updated_at=excluded.updated_at`).bind(actor.family_id,data.child_id,step.habit_id,step.routine_key,step.step_order,now))}
 await env.DB.batch(statements);return reply({ok:true});
 }catch{return reply({detail:'Could not save routines'},503)}
}
