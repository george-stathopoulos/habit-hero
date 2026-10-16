import assert from 'node:assert/strict';
import {parentPage} from '../cloudflare/parent-page.mjs';
import {childPage} from '../cloudflare/child-page.mjs';
for(const [name,render] of [['parent',parentPage],['child',childPage]]){
 const response=render();
 assert.equal(response.status,200);
 const html=await response.text();
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert(script,'embedded '+name+' app script must exist');
 new Function(script[1]);
 assert(html.includes('data-tab='),'tab navigation should exist');
 if(name==='parent')for(const id of ['familySnapshot','snapshotKids','snapshotHabits','snapshotPending','homeActions'])assert(html.includes('id="'+id+'"'));
 if(name==='parent'){assert(html.includes('id="goalWizard"'));assert(html.includes('id="releaseInfo"'));assert(html.includes("['community','🌍'"),'20th goal present');}
 if(name==='child'){assert(html.includes('grid-area:1/1'),'card backs must size to card content');assert(!html.includes('position:absolute;inset:0;backface-visibility'),'absolute card faces cause mobile overlap');}
 if(name==='child')for(const id of ['questOverview','questMeterFill','questCount'])assert(html.includes('id="'+id+'"'));
}
console.log('PASS mobile-first parent and child app render and embedded scripts parse');
