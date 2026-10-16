import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {v2Page} from '../cloudflare/v2-page.mjs';
import worker from '../cloudflare/worker.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const js=readFileSync(new URL('../app/v2/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../app/v2/app.css',import.meta.url),'utf8');
new Function(js);
for(const required of ['hh2-theme','mission-scene','heroChoices','messagesList','openChildBuilder','openHabitBuilder','parentGoals'])assert(js.includes(required)||css.includes(required),required+' must exist');
assert(css.includes('env(safe-area-inset-bottom)'));
assert(css.includes('prefers-reduced-motion'));
assert(js.includes('v2-hero-'),'App should construct theme-specific hero URLs');
for(const gender of ['boy','girl'])for(const theme of ['playful','adventure','minimal','youth'])assert(existsSync(new URL('../app/v2-hero-'+gender+'-'+theme+'.svg',import.meta.url)),'Missing themed hero art: '+gender+'/'+theme);
for(const asset of ['v2-world-playful.svg','v2-world-adventure.svg','v2-world-minimal.svg','v2-world-youth.svg']){
 assert(css.includes(asset)||js.includes(asset),'Missing reference to '+asset);
 assert(existsSync(new URL('../app/'+asset,import.meta.url)),'Missing asset: '+asset);
}
for(const role of ['child','parent']){
 const page=v2Page(role),html=await page.text();
 assert.equal(page.status,200);
 assert(html.includes('data-role="'+role+'"'));
 assert(html.includes('/habit-hero/app/v2/app.js'));
 assert(html.includes('/habit-hero/app/v2/app.css'));
 assert(html.includes('HABIT HERO · V2'));
 const route='/habit-hero/welcome/v2/'+role+'/';
 const result=await worker.fetch(new Request(base+route),{});
 assert.equal(result.status,200);
 assert((await result.text()).includes('data-role="'+role+'"'));
}
console.log('PASS modular illustrated Habit Hero v2: scripts, all assets, iOS routes and roles');
