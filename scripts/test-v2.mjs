import assert from 'node:assert/strict';
import {v2Page} from '../cloudflare/v2-page.mjs';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
for(const role of ['child','parent']){
 const page=v2Page(role),html=await page.text();
 assert.equal(page.status,200);
 const match=html.match(/<script>([\s\S]*?)<\/script>/);
 assert(match,'Embedded app JS required');
 new Function(match[1]);
 assert(html.includes('hh2-theme'),'Theme storage must be profile scoped');
 assert(html.includes('env(safe-area-inset-bottom)'),'iPhone safe area required');
 assert(html.includes('prefers-reduced-motion'),'Accessibility fallback required');
 const result=await worker.fetch(new Request(base+'/habit-hero/v2/'+role+'/'),{});
 assert.equal(result.status,200);
 assert((await result.text()).includes('HABIT HERO · V2'));
}
console.log('PASS v2 standalone presentation, protected-API frontend shell, iPhone safe area and routing');
