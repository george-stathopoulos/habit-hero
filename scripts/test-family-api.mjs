import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const assets={fetch:async()=>new Response('static')};
const env={ASSETS:assets,DB:{prepare:(sql)=>({
 bind:(...args)=>({
  first:async()=> sql.includes('FROM auth_sessions s')?{parent_id:'parent-id',family_id:'family-id',display_name:'Parent',family_name:'Family'}:null,
  all:async()=>({results:[{id:'c1',display_name:'Child one',age_band:'6-8'}]}),
  run:async()=>({meta:{changes:1}})
 })
})}};
let r=await worker.fetch(new Request(base+'/habit-hero/parent/'),{ASSETS:assets});
assert.equal(r.status,200);
let html=await r.text();
assert.ok(html.includes('/api/family/overview'));
assert.ok(html.includes('/api/children'));
assert.ok(html.includes('textContent'));
r=await worker.fetch(new Request(base+'/api/family/overview'),{ASSETS:assets,DB:{prepare:()=>{throw Error('should not query without session')}}});
assert.equal(r.status,401,'No family data without session');
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{"name":"test"}'}),env);
assert.equal(r.status,403,'Reject CSRF before DB actions');
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{"name":"test"}'}),env);
assert.equal(r.status,401,'Reject unauthenticated creation');
const token='A'.repeat(43),cookie='__Host-hh_session='+token;
r=await worker.fetch(new Request(base+'/api/family/overview',{headers:{cookie}}),env);
assert.equal(r.status,200);
let data=await r.json();
assert.equal(data.family.id,'family-id');
assert.equal(data.children[0].display_name,'Child one');
let captured;
const authenticatedEnv={ASSETS:assets,DB:{prepare:(sql)=>({bind:(...args)=>({
 first:async()=>({parent_id:'parent-id',family_id:'family-id',display_name:'Parent',family_name:'Family'}),
 run:async()=>{captured={sql,args};return {meta:{changes:1}}}
})})}};
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',
 headers:{origin:base,cookie,'content-type':'application/json'},
 body:JSON.stringify({name:'Sample Kid',age_band:'9-11',family_id:'attacker-family'})}),authenticatedEnv);
assert.equal(r.status,201);
assert.ok(captured.sql.includes('FROM family_memberships'));
assert.deepEqual(captured.args.slice(-2),['family-id','parent-id']);
assert.equal(captured.args[1],'Sample Kid');
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',
 headers:{origin:base,cookie,'content-type':'application/json'},
 body:JSON.stringify({name:'<bad>',age_band:'invalid'})}),authenticatedEnv);
assert.equal(r.status,400);
r=await worker.fetch(new Request(base+'/api/children',{method:'GET',headers:{cookie}}),authenticatedEnv);
assert.equal(r.status,503,'Unimplemented child listing route remains disabled');
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify({name:'Girl profile',age_band:'6-8',avatar_id:'hero-girl'})}),authenticatedEnv);assert.equal(r.status,201);assert.equal((await r.json()).avatar_id,'hero-girl');assert.equal(captured.args[4],'hero-girl');
r=await worker.fetch(new Request(base+'/api/children',{method:'POST',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify({name:'Invalid',avatar_id:'unvalidated-category'})}),authenticatedEnv);assert.equal(r.status,400);
r=await worker.fetch(new Request(base+'/api/children/update',{method:'POST',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify({child_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',name:'Boy profile',age_band:'9-11',avatar_id:'hero-boy'})}),authenticatedEnv);assert.equal(r.status,200);assert.equal(captured.args[2],'hero-boy');
r=await worker.fetch(new Request(base+'/api/children/update',{method:'POST',headers:{origin:base,cookie,'content-type':'application/json'},body:JSON.stringify({child_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',name:'Invalid',avatar_id:'unknown'})}),authenticatedEnv);assert.equal(r.status,400);
console.log('PASS parent dashboard, protected overview, CSRF and child creation scoping');
