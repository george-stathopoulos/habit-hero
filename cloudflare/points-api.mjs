// Parent-authorized manual point adjustment. Every change is an immutable ledger entry.
import {authorizedParent} from './family-api.mjs';
const ORIGIN='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
const uuid=x=>typeof x==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(x);
export async function adjustPoints(req,env){
 if(req.headers.get('origin')!==ORIGIN)return json({detail:'Forbidden'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return json({detail:'JSON required'},415);
 const actor=await authorizedParent(req,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 let v;
 try{const raw=await req.text();if(raw.length>600)return json({detail:'Request too large'},413);v=JSON.parse(raw)}
 catch{return json({detail:'Invalid JSON'},400)}
 if(!uuid(v?.child_id)||!uuid(v?.request_id)||!Number.isInteger(v?.delta)||
   v.delta===0||v.delta< -1000||v.delta>1000)return json({detail:'Invalid point adjustment'},400);
 try{
  const id=crypto.randomUUID(),now=new Date().toISOString();
  const result=await env.DB.prepare(`INSERT INTO point_ledger
    (id,family_id,child_id,delta,reason,actor_parent_id,idempotency_key,created_at)
    SELECT ?,c.family_id,c.id,?,'manual_adjustment',?, ?,?
    FROM child_profiles c
    WHERE c.family_id=? AND c.id=? AND c.deleted_at IS NULL
    AND (SELECT COALESCE(SUM(l.delta),0) FROM point_ledger l
         WHERE l.family_id=c.family_id AND l.child_id=c.id)+? >= 0`)
    .bind(id,v.delta,actor.parent_id,'manual-'+v.request_id,now,
      actor.family_id,v.child_id,v.delta).run();
  if(result.meta?.changes!==1)return json({detail:'Child missing or insufficient points'},409);
  return json({id,delta:v.delta,status:'recorded'},201);
 }catch(e){
  if(/UNIQUE|constraint/i.test(String(e)))return json({detail:'Adjustment already processed'},409);
  return json({detail:'Could not adjust points'},503);
 }
}
