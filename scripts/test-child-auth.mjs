import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const childId='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const habitId='11111111-2222-3333-4444-555555555555';
const parentCookie='__Host-hh_session='+'P'.repeat(43);
const childCookie='__Host-hh_child='+'C'.repeat(32);
const assets={fetch:async()=>new Response('asset')};
let audit=[];
const env={ASSETS:assets,DB:{
 prepare:(sql)=>({bind:(...args)=>{
  audit.push({sql,args});
  return{
   first:async()=>{
    if(sql.includes('FROM auth_sessions s') && sql.includes("s.role='parent'"))
      return {parent_id:'p1',family_id:'f1',display_name:'Parent',family_name:'Family'};
    if(sql.includes('FROM auth_sessions s') && sql.includes("s.role='child'"))
      return {family_id:'f1',child_id:childId,child_name:'Kid',session_id:'s1'};
    if(sql.includes('SELECT id FROM child_profiles'))return {id:childId};
    if(sql.includes('SELECT h.id,h.frequency_type FROM habit_assignments'))return {id:habitId,frequency_type:'daily'};
    return null;
   },
   all:async()=>({results:[{habit_id:habitId,habit_name:'Reading',points:10}]}),
   run:async()=>({meta:{changes:1}})
  };
 }}),
 batch:async(queries)=>[{meta:{changes:1}},{meta:{changes:1}}]
}};
const request=(path,method='GET',headers={},body)=>new Request(base+path,{method,headers,body:body?JSON.stringify(body):undefined});
const post=(path,body,extra={})=>worker.fetch(request(path,'POST',{'content-type':'application/json',origin:base,...extra},body),env);
let r=await worker.fetch(request('/habit-hero/child/'),env);
assert.equal(r.status,200);
const html=await r.text();
assert.match(html,/pairForm/);assert.match(html,/\/api\/child\/activities/);
r=await worker.fetch(request('/api/child/me'),env);assert.equal(r.status,401);
r=await worker.fetch(request('/api/child/activities'),env);assert.equal(r.status,401);
r=await post('/api/child/pairing',{child_id:childId});assert.equal(r.status,401);
r=await post('/api/child/pairing',{child_id:childId},{cookie:parentCookie});
assert.equal(r.status,201);
const pair=await r.json();assert.match(pair.pairing_code,/^[\w-]{32}$/);
assert(!audit.some(x=>x.args.includes(pair.pairing_code)), 'No raw pairing code in D1');
r=await post('/api/child/pair',{code:'invalid'});assert.equal(r.status,400);
r=await post('/api/child/pair',{code:pair.pairing_code});
assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/__Host-hh_child=.*HttpOnly; Secure; SameSite=Lax/);
r=await worker.fetch(request('/api/child/me','GET',{cookie:childCookie}),env);assert.equal(r.status,200);
assert.equal((await r.json()).role,'child');
r=await worker.fetch(request('/api/child/activities','GET',{cookie:childCookie}),env);
assert.equal(r.status,200);assert.equal((await r.json()).activities[0].habit_name,'Reading');
r=await post('/api/child/activities',{habit_id:habitId},{cookie:childCookie});
assert.equal(r.status,201);
assert(audit.some(x=>x.sql.includes('INSERT INTO completion_submissions')&&x.args[1]==='f1'&&x.args[2]===childId));
r=await post('/api/child/activities',{habit_id:habitId},{cookie:parentCookie});
assert.equal(r.status,401,'Parent cookie alone never authorizes child routes');
r=await worker.fetch(request('/api/family/overview','GET',{cookie:childCookie}),env);
assert.equal(r.status,401,'Child cookie never authorizes parent family access');
r=await post('/api/approvals/review',{completion_id:habitId,decision:'approved'},{cookie:childCookie});
assert.equal(r.status,401,'Child session cannot approve points');
r=await post('/api/child/revoke',{child_id:childId},{cookie:childCookie});assert.equal(r.status,401);
r=await post('/api/child/revoke',{child_id:childId},{cookie:parentCookie});assert.equal(r.status,200);
r=await worker.fetch(request('/api/child/logout','POST',{origin:base,cookie:childCookie}),env);
assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
r=await worker.fetch(request('/api/child/logout','POST',{origin:'https://evil.invalid',cookie:childCookie}),env);
assert.equal(r.status,403);
console.log('PASS parent pairing, child-only session, assignment, privilege isolation and revocation');
