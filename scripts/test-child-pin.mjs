import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const env={DB:{prepare:()=>({bind:()=>({first:async()=>null})})},ASSETS:{fetch:async()=>new Response('ok')}};
const post=(url,payload,headers={})=>worker.fetch(new Request(origin+url,{
 method:'POST',headers:{'content-type':'application/json',origin,...headers},body:JSON.stringify(payload)}),env);
let r=await post('/api/children/pin',{child_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',pin:'1234'});
assert.equal(r.status,401,'Anonymous users must not set a child PIN');
r=await post('/api/children/pin',{child_id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',pin:'1234'},{origin:'https://evil.invalid'});
assert.equal(r.status,403,'Cross-origin PIN updates must fail');
r=await post('/api/child/pin/unlock',{pin:'1234'});
assert.equal(r.status,401,'Child PIN alone must never grant access without pairing');
r=await worker.fetch(new Request(origin+'/api/child/pin/status'),env);
assert.equal(r.status,401,'PIN status must require a paired child session');
console.log('PASS: anonymous/cross-origin PIN configuration and PIN-only login blocked');
