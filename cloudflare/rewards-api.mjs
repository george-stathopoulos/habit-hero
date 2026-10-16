// Reward catalog and redemption workflow. Family identity comes only from verified sessions.
// Development batch: requires consolidated database, security and browser QA before release.
import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
const ORIGIN='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
const stamp=()=>new Date().toISOString();
async function readBody(req) {
 if(req.headers.get('origin')!==ORIGIN)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try {
  const raw=await req.text();
  if(raw.length>2048)return {error:json({detail:'Request too large'},413)};
  const body=JSON.parse(raw);
  if(!body||Array.isArray(body)||typeof body!=='object')throw Error('Invalid JSON');
  return {body};
 }catch{return {error:json({detail:'Invalid JSON'},400)}}
}
async function familyRows(env,family) {
 return env.DB.prepare(`SELECT r.id,r.name_el AS name,r.description_el AS description,
     r.points_cost,r.emoji,r.active,r.recurring,
     e.child_id,c.display_name AS child_name
     FROM reward_catalog r LEFT JOIN reward_eligibility e
      ON e.reward_id=r.id AND e.family_id=r.family_id
     LEFT JOIN child_profiles c ON c.id=e.child_id AND c.family_id=r.family_id AND c.deleted_at IS NULL
     WHERE r.family_id=? ORDER BY r.created_at DESC LIMIT 200`).bind(family).all();
}
function collectRewards(rows) {
 const map=new Map();
 for(const row of rows.results||[]){
  if(!map.has(row.id))map.set(row.id,{
   id:row.id,name:row.name,description:row.description,points_cost:row.points_cost,
   emoji:row.emoji,active:row.active===1,recurring:row.recurring===1,children:[]
  });
  if(row.child_id&&row.child_name)map.get(row.id).children.push({id:row.child_id,name:row.child_name});
 }
 return [...map.values()];
}
export async function parentRewards(req,env) {
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 try{return json({rewards:collectRewards(await familyRows(env,actor.family_id))})}
 catch{return json({detail:'Could not retrieve rewards'},503)}
}
export async function createReward(req,env) {
 const input=await readBody(req);if(input.error)return input.error;
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 const value=input.body,name=typeof value.name==='string'?value.name.trim():'',
  cost=value.points_cost,childId=value.child_id,
  description=typeof value.description==='string'?value.description.trim():'',
  recurring=value.recurring!==false;
 if(name.length<1||name.length>100||description.length>500||
    /[\u0000-\u001f\u007f]/.test(name+description)||
    !Number.isInteger(cost)||cost<1||cost>100000||
    !uuid(childId))return json({detail:'Invalid reward details'},400);
 try {
  const child=await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL')
   .bind(actor.family_id,childId).first();
  if(!child)return json({detail:'Child not found'},404);
  const id=crypto.randomUUID(),now=stamp();
  const changes=await env.DB.batch([
   env.DB.prepare(`INSERT INTO reward_catalog
     (id,family_id,name_el,name_en,description_el,points_cost,recurring,created_at,updated_at)
     VALUES (?,?,?,'',?,?, ?,?,?)`)
    .bind(id,actor.family_id,name,description||null,cost,recurring?1:0,now,now),
   env.DB.prepare('INSERT INTO reward_eligibility (family_id,reward_id,child_id) VALUES (?,?,?)')
    .bind(actor.family_id,id,childId)
  ]);
  if(changes.some(x=>x.success===false))return json({detail:'Could not create reward'},503);
  return json({id,name,points_cost:cost,child_id:childId},201);
 }catch{return json({detail:'Could not create reward'},503)}
}
export async function childRewards(req,env) {
 const actor=await authorizedChild(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 try{
  const results=await env.DB.prepare(`SELECT r.id,r.name_el AS name,r.description_el AS description,
    r.points_cost,r.emoji,r.recurring,
    EXISTS(SELECT 1 FROM reward_redemptions rr
     WHERE rr.family_id=r.family_id AND rr.reward_id=r.id AND rr.child_id=? 
     AND rr.status IN ('requested','approved','fulfilled')) AS previously_requested
    FROM reward_catalog r JOIN reward_eligibility e ON e.reward_id=r.id AND e.family_id=r.family_id
    WHERE r.family_id=? AND e.child_id=? AND r.active=1 ORDER BY r.points_cost,r.name_el LIMIT 100`)
    .bind(actor.child_id,actor.family_id,actor.child_id).all();
  const balance=await env.DB.prepare(`SELECT COALESCE(SUM(delta),0) AS points
    FROM point_ledger WHERE family_id=? AND child_id=?`).bind(actor.family_id,actor.child_id).first();
  return json({rewards:results.results||[],balance:balance?.points??0});
 }catch{return json({detail:'Could not load rewards'},503)}
}
export async function childRequestReward(req,env) {
 const input=await readBody(req);if(input.error)return input.error;
 const actor=await authorizedChild(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 const rewardId=input.body.reward_id;
 if(!uuid(rewardId))return json({detail:'Invalid reward'},400);
 try{
  const reward=await env.DB.prepare(`SELECT r.id,r.points_cost,r.recurring
    FROM reward_catalog r JOIN reward_eligibility e
      ON e.family_id=r.family_id AND e.reward_id=r.id
    WHERE r.family_id=? AND r.id=? AND e.child_id=? AND r.active=1`)
    .bind(actor.family_id,rewardId,actor.child_id).first();
  if(!reward)return json({detail:'Reward unavailable'},404);
  if(!reward.recurring){
   const exists=await env.DB.prepare(`SELECT id FROM reward_redemptions
    WHERE family_id=? AND child_id=? AND reward_id=? AND status IN ('requested','approved','fulfilled') LIMIT 1`)
    .bind(actor.family_id,actor.child_id,rewardId).first();
   if(exists)return json({detail:'This reward is available once only'},409);
  }
  const id=crypto.randomUUID(),now=stamp();
  await env.DB.prepare(`INSERT INTO reward_redemptions
    (id,family_id,reward_id,child_id,points_spent,status,requested_at,idempotency_key)
    VALUES (?,?,?,?,?,'requested',?,?)`)
    .bind(id,actor.family_id,rewardId,actor.child_id,reward.points_cost,now,
      'child-request-'+id).run();
  return json({id,status:'requested',points_cost:reward.points_cost},201);
 }catch{return json({detail:'Could not request reward'},503)}
}
export async function parentRedemptions(req,env) {
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 try{
  const result=await env.DB.prepare(`SELECT x.id,x.child_id,c.display_name AS child_name,
   x.reward_id,r.name_el AS reward_name,x.points_spent,x.status,x.requested_at
   FROM reward_redemptions x
   JOIN child_profiles c ON c.id=x.child_id AND c.family_id=x.family_id
   JOIN reward_catalog r ON r.id=x.reward_id AND r.family_id=x.family_id
   WHERE x.family_id=? ORDER BY x.requested_at DESC LIMIT 150`)
   .bind(actor.family_id).all();
  return json({redemptions:result.results||[]});
 }catch{return json({detail:'Could not load redemptions'},503)}
}
export async function reviewReward(req,env) {
 const input=await readBody(req);if(input.error)return input.error;
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 const id=input.body.redemption_id,decision=input.body.decision;
 if(!uuid(id)||!['approved','rejected','fulfilled'].includes(decision))
  return json({detail:'Invalid redemption decision'},400);
 try{
  const redemption=await env.DB.prepare(`SELECT id,child_id,points_spent,status FROM reward_redemptions
   WHERE family_id=? AND id=?`).bind(actor.family_id,id).first();
  if(!redemption)return json({detail:'Reward request not found'},404);
  if(decision==='fulfilled'){
   if(redemption.status!=='approved')return json({detail:'Must approve first'},409);
   const result=await env.DB.prepare(`UPDATE reward_redemptions SET status='fulfilled',resolved_at=?,resolved_by=?
     WHERE family_id=? AND id=? AND status='approved'`)
    .bind(stamp(),actor.parent_id,actor.family_id,id).run();
   return result.meta?.changes===1?json({id,status:'fulfilled'}):json({detail:'Already resolved'},409);
  }
  if(redemption.status!=='requested')return json({detail:'Already reviewed'},409);
  const now=stamp();
  if(decision==='rejected'){
   const result=await env.DB.prepare(`UPDATE reward_redemptions SET status='rejected',resolved_at=?,resolved_by=?
     WHERE family_id=? AND id=? AND status='requested'`)
    .bind(now,actor.parent_id,actor.family_id,id).run();
   return result.meta?.changes===1?json({id,status:'rejected'}):json({detail:'Already reviewed'},409);
  }
  // The approval UPDATE atomically checks available points. The next statement
  // credits exactly one negative ledger entry if approval actually occurred.
  // D1 batch runs both statements as a transaction.
  const changes=await env.DB.batch([
   env.DB.prepare(`UPDATE reward_redemptions SET status='approved',resolved_at=?,resolved_by=?
     WHERE family_id=? AND id=? AND status='requested'
     AND points_spent <= (SELECT COALESCE(SUM(delta),0) FROM point_ledger
      WHERE family_id=? AND child_id=?)`)
    .bind(now,actor.parent_id,actor.family_id,id,actor.family_id,redemption.child_id),
   env.DB.prepare(`INSERT INTO point_ledger
     (id,family_id,child_id,delta,reason,redemption_id,actor_parent_id,idempotency_key,created_at)
     SELECT ?,x.family_id,x.child_id,-x.points_spent,'reward_redemption',x.id,?,
        'redemption-'+x.id,?
     FROM reward_redemptions x WHERE x.family_id=? AND x.id=? 
     AND x.status='approved' AND x.resolved_at=? AND x.resolved_by=?`)
    .bind(crypto.randomUUID(),actor.parent_id,now,actor.family_id,id,now,actor.parent_id)
  ]);
  if(changes[0]?.meta?.changes!==1||changes[1]?.meta?.changes!==1)
   return json({detail:'Insufficient points or already reviewed'},409);
  return json({id,status:'approved',points_spent:redemption.points_spent});
 }catch(e){
  if(/UNIQUE|constraint/i.test(String(e)))return json({detail:'Already reviewed'},409);
  return json({detail:'Could not review reward'},503);
 }
}

export async function editReward(req,env){
 const input=await readBody(req);if(input.error)return input.error;
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 const v=input.body,id=v.reward_id,name=typeof v.name==='string'?v.name.trim():'',
  description=typeof v.description==='string'?v.description.trim():'';
 if(!uuid(id)||!name||name.length>100||description.length>500||
    /[\u0000-\u001f\u007f]/.test(name+description)||
    !Number.isInteger(v.points_cost)||v.points_cost<1||v.points_cost>100000||
    typeof v.recurring!=='boolean')return json({detail:'Invalid reward'},400);
 try{
  const now=stamp();
  const result=await env.DB.prepare(`UPDATE reward_catalog
   SET name_el=?,description_el=?,points_cost=?,recurring=?,updated_at=?
   WHERE family_id=? AND id=? AND active=1`)
    .bind(name,description||null,v.points_cost,v.recurring?1:0,now,actor.family_id,id).run();
  if(result.meta?.changes!==1)return json({detail:'Reward not found'},404);
  return json({id,status:'updated'});
 }catch{return json({detail:'Could not edit reward'},503)}
}
export async function archiveReward(req,env){
 const input=await readBody(req);if(input.error)return input.error;
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 const id=input.body.reward_id;
 if(!uuid(id))return json({detail:'Invalid reward'},400);
 try{
  const result=await env.DB.prepare(`UPDATE reward_catalog SET active=0,updated_at=?
   WHERE family_id=? AND id=? AND active=1`)
   .bind(stamp(),actor.family_id,id).run();
  if(result.meta?.changes!==1)return json({detail:'Reward not found'},404);
  return json({id,status:'archived'});
 }catch{return json({detail:'Could not archive reward'},503)}
}
