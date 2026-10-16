import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {chromium} from 'playwright';
import {v2Page} from '../cloudflare/v2-page.mjs';
const root=resolve('.');
const activity=(id,name,emoji,status=null)=>({habit_id:id,habit_name:name,emoji,points:10,slot_index:1,slot_total:1,submission_status:status,description_el:'Μια ξεκάθαρη περιγραφή που μπορεί να διαβαστεί εύκολα από κάθε παιδί.',why_important_el:'Σε βοηθά να γίνεις πιο υπεύθυνος.'});
const fixtures={
 '/api/child/me':{id:'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',name:'Αλεξάνδρα',avatar_id:'hero-girl'},
 '/api/child/activities':{activities:[activity('11111111-1111-1111-1111-111111111111','Βουρτσίζω τα δόντια μου','🪥'),activity('22222222-2222-2222-2222-222222222222','Ολοκληρώνω την πολύ μεγάλη αποστολή δημιουργικότητας','🎨'),activity('33333333-3333-3333-3333-333333333333','Βγαίνω έξω να παίξω','🌳','approved')]},
 '/api/child/help':{requests:[{id:'help-1',created_at:'2026-10-16T12:00:00Z',status:'helping',parent_message:'Πιστεύω σε σένα!'}]},
 '/api/child/rewards':{balance:75,rewards:[{id:'r1',name:'Μια ξεχωριστή οικογενειακή εκδρομή',emoji:'🎁',points_cost:100}],redemption_history:[]},
 '/api/child/progress':{progress:{level:3,current_streak_days:9,recent_activity:[]}},
 '/api/family/overview':{parent:{id:'parent1',name:'Ελένη'},children:[{id:'child1',display_name:'Αλεξάνδρα'}]},
 '/api/habits':{habits:[{id:'h1',name:'Βουρτσίζω τα δόντια μου',emoji:'🪥',frequency:'daily',points:10,children:[{name:'Αλεξάνδρα'}]}]},
 '/api/approvals':{pending:[{id:'11111111-1111-1111-1111-111111111111',child_name:'Αλεξάνδρα',habit_name:'Κάνω μια καλή πράξη',points:12,submitted_at:'2026-10-16T12:00:00Z'}]},
 '/api/parent/help':{requests:[{id:'22222222-2222-2222-2222-222222222222',child_name:'Αλεξάνδρα',habit_name:'Διάβασμα',created_at:'2026-10-16T12:00:00Z'}]}
};
const mime=p=>p.endsWith('.svg')?'image/svg+xml':p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html';
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 if(path.startsWith('/api/')){res.setHeader('content-type','application/json');res.end(JSON.stringify(fixtures[path]||{}));return}
 if(path.includes('/v2/child/')){const page=v2Page('child');res.writeHead(200,Object.fromEntries(page.headers));res.end(await page.text());return}
 if(path.includes('/v2/parent/')){const page=v2Page('parent');res.writeHead(200,Object.fromEntries(page.headers));res.end(await page.text());return}
 if(path.startsWith('/habit-hero/app/')){
  const asset=join(root,'app',path.slice('/habit-hero/app/'.length));
  if(!asset.startsWith(join(root,'app'))||!existsSync(asset)){res.writeHead(404);res.end();return}
  res.setHeader('content-type',mime(asset));res.end(readFileSync(asset));return
 }
 res.writeHead(404);res.end();
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
mkdirSync('v2-layout-shots',{recursive:true});
try{
 for(const role of ['child','parent']){
  for(const width of [320,375,390,430,768]){
   const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));
   await page.goto(base+'/habit-hero/welcome/v2/'+role+'/',{waitUntil:'networkidle'});
   await page.locator('#greeting').waitFor();
   const horizontal=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert(horizontal.scroll<=horizontal.viewport+1,role+' '+width+'px horizontal overflow '+JSON.stringify(horizontal));
   const artwork=await page.evaluate(async()=>{
    const hero=document.querySelector('#heroArt');
    const bg=new Image();bg.src='/habit-hero/app/v2-world-'+document.body.dataset.theme+'.svg';
    try{await bg.decode()}catch{}
    return {hero:hero.naturalWidth,background:bg.naturalWidth}
   });
   assert(artwork.hero>0&&artwork.background>0,role+' '+width+'px artwork blocked or missing: '+JSON.stringify(artwork));
   const labels=await page.locator('.nav button span:last-child').evaluateAll(items=>items.map(x=>Number.parseFloat(getComputedStyle(x).fontSize)));
   assert(labels.every(px=>px<=12),role+' navigation labels are too large: '+JSON.stringify(labels));
   const heroLayout=await page.evaluate(()=>{
    const stage=document.querySelector('.stage'),heading=document.querySelector('#heroHeading'),art=document.querySelector('#heroArt');
    const a=heading.getBoundingClientRect(),b=art.getBoundingClientRect(),c=stage.getBoundingClientRect();
    return {stage:c.height,headingTop:a.top,headingBottom:a.bottom,artBottom:b.bottom,headingInStage:a.bottom<=c.bottom+1}
   });
   assert(heroLayout.headingInStage,role+' hero headline escapes artwork card: '+JSON.stringify(heroLayout));

   assert.equal(errors.length,0,role+' '+width+'px errors '+errors.join('; '));
   await page.screenshot({path:'v2-layout-shots/'+role+'-'+width+'.png',fullPage:true});
   if(width===390)await page.screenshot({path:'v2-layout-shots/preview-'+role+'.jpg',type:'jpeg',quality:30});
   if(role==='child'){
    await page.getByRole('button',{name:/Ο ήρωας/}).click();
    for(const theme of ['playful','adventure','minimal','youth']){
     await page.locator('.theme[data-value="'+theme+'"]').click();
     assert.equal(await page.locator('body').getAttribute('data-theme'),theme);
     const hero=await page.locator('#heroArt').getAttribute('src');
     assert(hero.includes('v2-hero-girl-'+theme),theme+' has matching hero art');
    }
   }
   await page.close();
  }
 }
 console.log('PASS real Chromium iPhone-size v2 layout and four-theme visual checks');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
