import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const token='A'.repeat(43),cookie='__Host-hh_session='+token;
const assets={fetch:async()=>new Response('static')};
let r=await worker.fetch(new Request(base+'/api/habits'),{ASSETS:assets,DB:{prepare:()=>{throw Error('no query should run')}}});
assert.equal(r.status,401);
r=await worker.fetch(new Request(base+'/api/habits',{method:'POST',headers:{origin:'https://other.example','content-type':'application/json'},body:'{}'}),{ASSETS:assets});
assert.equal(r.status,403);
let calls=[];
const env={ASSETS:assets,DB:{prepare:(sql)=>({bind:(...args)=>({
 first:async()=>sql.includes('SELECT id FROM child_profiles')?{id:'child'}:{parent_id:'parent',family_id:'family',display_name:'Parent',family_name:'Fam'},
 all:async()=>({results:[{id:'habit',name_el:'Διάβασμα',points:15,emoji:'⭐',frequency_type:'daily',child_id:'child',child_name:'Kid'}]}),
 run:async()=>({success:true}),
}) ,sql} ),batch:async(statements)=>{calls.push(statements);return[{success:true},{success:true}]}}};
r=await worker.fetch(new Request(base+'/api/habits',{headers:{cookie}}),env);
assert.equal(r.status,200);
const body=await r.json();assert.equal(body.habits.length,1);assert.equal(body.habits[0].children[0].name,'Kid');
const childId='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
r=await worker.fetch(new Request(base+'/api/habits',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},
 body:JSON.stringify({name:'Clean room',points:10,frequency:'daily',child_id:childId,family_id:'attacker'})}),env);
assert.equal(r.status,201);
assert.equal(calls.length,1);
r=await worker.fetch(new Request(base+'/api/habits',{method:'POST',headers:{cookie,origin:base,'content-type':'application/json'},
 body:JSON.stringify({name:'Bad',points:-1,child_id:childId})}),env);
assert.equal(r.status,400);
r=await worker.fetch(new Request(base+'/habit-hero/parent/'),{ASSETS:assets});
assert.equal(r.status,200);
const html=await r.text();
assert.match(html,/id="habitForm"/);assert.match(html,/\/api\/habits/);
console.log('PASS protected habits, assignment, validation and dashboard');
