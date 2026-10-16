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
 for(const asset of ['v2-world-playful.svg','v2-world-adventure.svg','v2-world-minimal.svg','v2-world-youth.svg','v2-hero-boy.svg','v2-hero-girl.svg']){
  assert(html.includes(asset),'Missing visual asset: '+asset);
 }
 assert(html.includes('mission-scene'),'Mission details must have illustrated treatment');
 assert(html.includes('heroChoices'),'Both hero choices must exist');
 assert(html.includes('messagesList'),'Dedicated inbox must exist');
 assert(html.includes('openChildBuilder'),'V2 parent onboarding must be implemented');
 assert(html.includes('openHabitBuilder'),'Full custom habit builder must be available');
 const result=await worker.fetch(new Request(base+'/habit-hero/v2/'+role+'/'),{});
 assert.equal(result.status,200);
 assert((await result.text()).includes('HABIT HERO · V2'));
}
console.log('PASS v2 standalone presentation, protected-API frontend shell, iPhone safe area and routing');
