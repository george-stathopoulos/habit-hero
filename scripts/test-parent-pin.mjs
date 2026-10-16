import assert from 'node:assert/strict';
import {setupParentPin} from '../cloudflare/household-auth.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const cookie='__Host-hh_session='+'A'.repeat(43);
let stored=null,sqls=[];
const env={DB:{prepare(sql){sqls.push(sql);return {bind(...values){return {
 first:async()=>({session_id:'s1',parent_id:'p1',family_id:'f1',display_name:'Parent',pin_hash:null,pin_attempts:0}),
 run:async()=>{stored={sql,values};return {meta:{changes:1}}}
 }}}}}};
const call=pin=>setupParentPin(new Request(base+'/api/household/parent-pin',{method:'POST',headers:{origin:base,'content-type':'application/json',cookie},body:JSON.stringify({pin})}),env);
let r=await call('1234');assert.equal(r.status,200,await r.text());
assert.equal(stored.values[1],'p1');
assert.match(stored.values[0],/^pbkdf2-sha256-100000\$/);
assert(!stored.values[0].includes('1234'));
r=await call('123');assert.equal(r.status,400);
r=await setupParentPin(new Request(base+'/api/household/parent-pin',{method:'POST',headers:{origin:'https://unsafe.invalid','content-type':'application/json',cookie},body:'{"pin":"1234"}'}),env);
assert.equal(r.status,403);
console.log('PASS Google-session parent PIN setup stores PBKDF2 verifier and rejects bad PIN/CSRF');
