import assert from 'node:assert/strict';
import worker from '../cloudflare/worker.mjs';
const url='https://habit-hero-cloudflare.example.workers.dev';
const assets={fetch:async()=>new Response('static asset')};
let r=await worker.fetch(new Request(url+'/'),{ASSETS:assets});
assert.equal(r.status,302);
assert.equal(r.headers.get('location'),url+'/habit-hero/');
r=await worker.fetch(new Request(url+'/_health'),{ASSETS:assets});
assert.deepEqual(await r.json(),{service:'habit-hero-edge',status:'ok',apiConfigured:false});
r=await worker.fetch(new Request(url+'/api/child/tasks'),{ASSETS:assets});
assert.equal(r.status,503);
assert.equal(r.headers.get('cache-control'),'no-store');
r=await worker.fetch(new Request(url+'/habit-hero/original-preview/'),{ASSETS:assets});
assert.equal(await r.text(),'static asset');
r=await worker.fetch(new Request(url+'/api/health'),{ASSETS:assets});
assert.equal(r.status,503);
const dbOk={prepare:(statement)=>{
  assert.equal(statement,'SELECT 1 AS ready');
  return {first:async()=>({ready:1})};
}};
r=await worker.fetch(new Request(url+'/api/health'),{ASSETS:assets,DB:dbOk});
assert.equal(r.status,200);
assert.deepEqual(await r.json(),{service:'habit-hero-api',status:'ok',database:'connected',featuresEnabled:false});
const dbFail={prepare:()=>({first:async()=>{throw Error('do not leak internal SQL error')}})};
r=await worker.fetch(new Request(url+'/api/health'),{ASSETS:assets,DB:dbFail});
assert.equal(r.status,503);
assert.equal((await r.text()).includes('internal SQL error'),false);
r=await worker.fetch(new Request(url+'/api/health'),{ASSETS:assets,DB:dbOk,API_ORIGIN:'https://old-backend.example'});
assert.equal(r.status,200);
r=await worker.fetch(new Request(url+'/api/auth/me'),{ASSETS:assets,DB:dbOk});
assert.equal(r.status,401);

// The Google callback landing URL must be handled by the Worker rather than
// falling through to Expo static asset paths (404 on direct navigation).
r=await worker.fetch(new Request(url+'/habit-hero/original-preview/auth/google-callback'),{ASSETS:assets});
assert.equal(r.status,200);
assert.match(r.headers.get('content-type'),/text\/html/);
assert.match(r.headers.get('cache-control'),/no-store/);
let landing=await r.text();
assert.ok(landing.includes("fetch('/api/auth/me'"),'landing checks the HttpOnly session through a same-origin request');
assert.ok(landing.includes('textContent'),'untrusted profile data is rendered as text');
assert.ok(!landing.includes('session_token='));
r=await worker.fetch(new Request(url+'/habit-hero/original-preview/auth/google-callback/'),{ASSETS:assets});
assert.equal(r.status,200);
r=await worker.fetch(new Request(url+'/habit-hero/original-preview/auth/google-callback',{method:'POST'}),{ASSETS:assets});
assert.equal(r.status,405);

console.log('PASS Cloudflare Worker routing, D1 probe and safe-unconfigured API behavior');
