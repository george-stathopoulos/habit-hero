import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const token='A'.repeat(43),cookie='__Host-hh_session='+token,uuid='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',other='11111111-2222-3333-4444-555555555555';
const assets={fetch:async()=>new Response('asset')};
const queries=[];
const bindable=(sql)=>({bind:(...args)=>{queries.push({sql,args});return {
 first:async()=>{
  if(sql.includes('FROM auth_sessions'))return {parent_id:'parent1',family_id:'family1',display_name:'Parent',family_name:'Family'};
  if(sql.includes('SELECT h.id,h.frequency_type,h.frequency_count'))return {id:uuid,frequency_type:'daily'};
  if(sql.includes('SELECT s.id,s.child_id,s.status,h.points'))return {id:other,child_id:uuid,status:'pending',points:15};
  return null;
 },
 all:async()=>{
  if(sql.includes('LEFT JOIN completion_submissions'))return {results:[{child_id:uuid,child_name:'Kid',habit_id:other,habit_name:'Read',points:15,submission_status:null}]};
  if(sql.includes('WHERE s.family_id=? AND s.status'))return {results:[{id:other,child_name:'Kid',habit_name:'Read',points:15}]};
  if(sql.includes('SUM(l.delta)'))return {results:[{child_id:uuid,child_name:'Kid',points:15}]};
  return {results:[]}
 },
 run:async()=>({meta:{changes:1}})
 }}});
const db={prepare:bindable,batch:async(statements)=>[{meta:{changes:1}},{meta:{changes:1}}]};
const env={ASSETS:assets,DB:db};
const get=(p,headers={})=>worker.fetch(new Request(base+p,{headers}),env);
const post=(p,payload,headers={})=>worker.fetch(new Request(base+p,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(payload)}),env);
for(const route of ['/api/activities','/api/approvals','/api/points']){
 const r=await get(route);assert.equal(r.status,401,'unauthenticated '+route);
}
let r=await get('/api/activities',{cookie});assert.equal(r.status,200);
assert.equal((await r.json()).activities[0].habit_name,'Read');
r=await get('/api/approvals',{cookie});assert.equal(r.status,200);
assert.equal((await r.json()).pending.length,1);
r=await get('/api/points',{cookie});assert.equal(r.status,200);
assert.equal((await r.json()).balances[0].points,15);
r=await post('/api/activities',{child_id:uuid,habit_id:other},{cookie,origin:'https://evil.invalid'});assert.equal(r.status,403);
r=await post('/api/activities',{child_id:uuid,habit_id:other},{cookie,origin:base});assert.equal(r.status,201);
assert(queries.some(q=>q.sql.includes('FROM habit_assignments')&&q.args[0]==='family1'&&q.args[1]===uuid));
r=await post('/api/activities',{child_id:'invalid',habit_id:other},{cookie,origin:base});assert.equal(r.status,400);
r=await post('/api/approvals/review',{completion_id:other,decision:'approved'},{cookie,origin:'https://evil.invalid'});assert.equal(r.status,403);
r=await post('/api/approvals/review',{completion_id:other,decision:'approved'},{cookie,origin:base});assert.equal(r.status,200);
assert.equal((await r.json()).points_awarded,15);
assert(queries.some(q=>q.sql.includes('UPDATE completion_submissions')&&q.args[4]==='family1'&&q.args[5]===other));
r=await post('/api/approvals/review',{completion_id:other,decision:'rejected'},{cookie,origin:base});assert.equal(r.status,200);
assert.equal((await r.json()).points_awarded,0);
r=await post('/api/approvals/review',{completion_id:other,decision:'anything'},{cookie,origin:base});assert.equal(r.status,400);
r=await get('/habit-hero/parent/');assert.equal(r.status,200);
const html=await r.text();
for(const id of ['activitiesPanel','approvalsPanel','pointsPanel'])assert(html.includes('id="'+id+'"'));
assert(!html.includes('innerHTML'));
console.log('PASS supervised submissions, family-scoped approvals, CSRF and ledger paths');
