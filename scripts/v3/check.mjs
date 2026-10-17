// A focused release contract, not a second backend test suite.
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import worker from '../../cloudflare/worker.mjs';
for(const [path,preview] of [['child',false],['preview',true],['parent',false],['parent-preview',true]]){
 const response=await worker.fetch(new Request(`https://example.com/habit-hero/v3/${path}/`),{});
 assert.equal(response.status,200);assert.match(await response.text(),new RegExp(`data-preview="${preview}"`));
 const post=await worker.fetch(new Request(`https://example.com/habit-hero/v3/${path}/`,{method:'POST'}),{});assert.equal(post.status,405);
}
for(const name of ['world-reference','hero-girl-reference','hero-boy-reference','foreground-reference','mission-bed-action','mission-brush-action','mission-read-action']){const file=`app/v3/assets/${name}.webp`;assert.ok(statSync(file).size>1000);assert.ok(statSync(file).size<500000);}
for(const filename of ['app.css','app.js','icons.js','manifest.webmanifest','preview.js','tilt.js','parent.js','parent.css','parent-preview.js'])assert.ok(statSync('app/v3/'+filename).isFile());
console.log('PASS v3 GET-only routes, isolated preview and deployable local assets');
