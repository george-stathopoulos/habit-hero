import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const env={ASSETS:{fetch:async()=>new Response('asset')},DB:{prepare:()=>({bind:()=>({first:async()=>null})})}};
let response=await worker.fetch(new Request(origin+'/habit-hero/welcome/'),env);
assert.equal(response.status,200);
const html=await response.text();
for(const label of ['profiles','parentPinSetup','unlockForm','entryPin'])assert(html.includes('id="'+label+'"'));
response=await worker.fetch(new Request(origin+'/api/household'),env);
assert.equal(response.status,200);
assert.equal((await response.json()).google_required,true);
const post=(url,body,headers={})=>worker.fetch(new Request(origin+url,{method:'POST',
 headers:{origin,'content-type':'application/json',...headers},body:JSON.stringify(body)}),env);
response=await post('/api/household/parent-pin',{pin:'1234'});
assert.equal(response.status,401,'Cannot register parent PIN without verified Google session');
response=await post('/api/household/unlock',{pin:'1234'});
assert.equal(response.status,401,'Cannot unlock without verified household session');
response=await post('/api/household/unlock',{pin:'1234'},{origin:'https://bad.invalid'});
assert.equal(response.status,403,'Cross-origin PIN attempts are rejected');
response=await post('/api/household/exit',{});
assert.equal(response.status,401,'Cannot lock someone else\'s household');
response=await worker.fetch(new Request(origin+'/habit-hero/'),env);
assert.equal(response.status,302);
assert.equal(response.headers.get('location'),origin+'/habit-hero/welcome/');
for(const route of ['/habit-hero/welcome/parent/','/habit-hero/welcome/child/']){
 const view=await worker.fetch(new Request(origin+route),env);
 assert.equal(view.status,200,route+' should load inside installed app path');
}
console.log('PASS shared-device launcher, PIN gate, CSRF and app entry');
