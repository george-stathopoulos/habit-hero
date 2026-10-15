'use strict';
/* Habit Hero: extended family experience. Uses state and rendering from app.js. */
data.settings??={mode:'parent',pin:'',approval:false,theme:'violet'};
data.pending??=[];
const originalNav=nav;
const originalRender=render;
const originalToday=todayPage;
const originalProgress=progressPage;
const originalDialog=dialog;
const dayLabels=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let parentUnlock=false;
const isParentMode=()=>data.settings.mode==='parent';
const pendingFor=h=>data.pending.some(p=>p.habit===h.id&&p.date===today());
const scheduledFor=h=>!Array.isArray(h.days)||!h.days.length||h.days.includes(new Date().getDay());
const extendedSave=()=>{save()};
const childScore=()=>earned()-spent();
const daysOld=(n)=>{let d=new Date();d.setDate(d.getDate()-n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function longestStreak(){let n=0;for(let i=0;i<365;i++){if(!data.completions.some(c=>c.profile===hero().id&&c.date===daysOld(i)))break;n++}return n}
function extendedNav(){return [['today','🏠','Today'],['habits','✅','Habits'],['rewards','🎁','Rewards'],['progress','📊','Progress'],['history','🧾','History'],['profiles','🦸','Heroes'],['family-settings','⚙️','Parent tools']].filter(([id])=>isParentMode()||!['habits','history','profiles','family-settings'].includes(id)).map(([id,ico,name])=>'<button data-nav="'+id+'" class="'+(tab===id?'active':'')+'">'+ico+' <span>'+name+'</span></button>').join('')}
nav=extendedNav;
function familySettings(){return '<div class="top"><div><p class="eyebrow">PARENT CONTROL CENTER</p><h1>Family Settings ⚙️</h1><p>Customize how your heroes complete and celebrate their quests.</p></div></div>'+
'<div class="panel"><h2>Parent access</h2><p>Set a 4-digit PIN for switching from Child to Parent mode. This is a device-level convenience lock, not secure authentication.</p><label class="field">New PIN <input id="family-pin" type="password" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" placeholder="'+(data.settings.pin?'PIN already set':'Enter four digits')+'"></label><button class="btn" data-fam-pin="1">Save PIN</button> <button class="btn secondary" data-fam-pin-clear="1">Remove PIN</button><label class="field"><input type="checkbox" id="fam-approval" '+(data.settings.approval?'checked':'')+'> Require parent approval for child quests</label></div>'+
'<div class="panel"><h2>Awaiting approval ('+data.pending.length+')</h2>'+(data.pending.map(p=>'<div class="task"><span class="ico">⏳</span><div class="info"><b>'+safe(data.habits.find(h=>h.id===p.habit)?.name||'Habit')+'</b><small>'+safe(data.profiles.find(x=>x.id===p.profile)?.name||'Hero')+' · '+safe(p.date)+'</small></div><button class="btn" data-fam-approve="'+p.id+'">Approve</button><button class="chip" data-fam-deny="'+p.id+'">Reject</button></div>').join('')||'<p>Nothing to approve. Nice!</p>')+'</div>'+
'<div class="panel"><h2>Choose a theme</h2><div class="tabs">'+[['violet','💜 Violet'],['ocean','🌊 Ocean'],['forest','🌿 Forest'],['sunset','🌅 Sunset']].map(([id,label])=>'<button class="chip '+(data.settings.theme===id?'active':'')+'" data-fam-theme="'+id+'">'+label+'</button>').join('')+'</div></div>'+
'<div class="panel"><h2>Starter habit ideas</h2><p>Add a ready-made habit to the selected hero.</p><div class="tabs">'+[['💧','Drink water','Health',10],['🧸','Put toys away','Home',10],['📖','Read a story','Learning',15],['🌻','Go outside','Health',15],['🛏️','Make my bed','Home',10],['🎨','Practice creativity','Learning',15]].map((x,i)=>'<button class="chip" data-fam-template="'+i+'">'+x[0]+' '+x[1]+'</button>').join('')+'</div></div>'+
'<div class="panel"><h2>Family analytics</h2><p>Daily completions across all hero profiles.</p>'+data.profiles.map(p=>'<div class="task"><span class="ico">'+safe(p.avatar)+'</span><div class="info"><b>'+safe(p.name)+'</b><small>'+data.completions.filter(c=>c.profile===p.id).length+' completed quests · ⭐ '+data.completions.filter(c=>c.profile===p.id).reduce((n,c)=>n+c.points,0)+' earned</small></div></div>').join('')+'</div>'}
function unlockDialog(){return '<div class="modal-back"><form class="modal" id="family-unlock"><h2>🔒 Parent PIN</h2><p>Enter the PIN to manage the family account.</p><label class="field">PIN<input type="password" name="pin" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" required autofocus></label><div class="actions"><button class="btn secondary" type="button" data-fam-cancel="1">Cancel</button><button class="btn" type="submit">Unlock</button></div></form></div>'}
function extendedToday(){return originalToday().replace('Small steps make big heroes.','Small steps make big heroes. '+(isParentMode()?'Manage your family quests here.':'Earn stars for every victory!'))}
todayPage=extendedToday;
function extendedProgress(){return originalProgress()+'<div class="panel"><h2>Consistency</h2><div class="stats"><div class="stat"><span>🔥 Current active streak</span><b>'+longestStreak()+' days</b></div><div class="stat"><span>📆 This week</span><b>'+data.completions.filter(c=>c.profile===hero().id&&c.date>=daysOld(6)).length+'</b></div><div class="stat"><span>⭐ Available</span><b>'+childScore()+'</b></div></div><p>Complete a quest every day to grow your streak.</p></div>'}
progressPage=extendedProgress;
function extendedDialog(){let base=originalDialog();if(modal==='habit'){base=base.replace('<div class="actions"><button type="button"', '<fieldset class="field"><legend>Repeat on (none selected means daily)</legend>'+dayLabels.map((x,i)=>'<label style="display:inline-block;margin:5px"><input type="checkbox" name="repeatDay" value="'+i+'"> '+x+'</label>').join('')+'</fieldset><div class="actions"><button type="button"')}return base}
dialog=extendedDialog;
function extendedRender(){
 if(!isParentMode()&&!['today','rewards','progress'].includes(tab))tab='today';
 if(tab==='family-settings'){const old=tab;tab='today';originalRender();tab=old;const main=document.querySelector('.main');if(main){const utility=main.querySelector('.app-utility')?.outerHTML||'';main.innerHTML=utility+familySettings()}}
 else originalRender();
 const shell=document.querySelector('.shell');
 if(shell)shell.dataset.theme=data.settings.theme;
 for(const navEl of document.querySelectorAll('.nav,.bottom-nav'))navEl.innerHTML=extendedNav();
 const utility=document.querySelector('.app-utility');
 if(utility){utility.insertAdjacentHTML('beforeend',' <button class="chip" data-fam-mode="1">'+(isParentMode()?'👨‍👧 Parent mode':'🦸 Child mode')+'</button>')}
 if(tab==='today'){
  for(const entry of document.querySelectorAll('.task')){
   const toggle=entry.querySelector('[data-toggle]');
   if(!toggle)continue;
   const h=data.habits.find(x=>x.id===toggle.dataset.toggle);
   if(h&&!scheduledFor(h)){entry.remove();continue}
   if(h&&pendingFor(h)){toggle.textContent='⏳';toggle.setAttribute('aria-label','Awaiting parent approval');}
  }
 }
 if(!isParentMode()){
   document.querySelectorAll('[data-open],[data-delhabit],[data-delreward],[data-delprofile],[data-export],[data-import]').forEach(el=>el.remove());
 }
 if(parentUnlock)document.body.insertAdjacentHTML('beforeend',unlockDialog());
}
render=extendedRender;
document.addEventListener('click',e=>{
 const b=e.target.closest('button');if(!b)return;
 const d=b.dataset;
 if(!isParentMode()&&(d.open||d.delhabit||d.delreward||d.delprofile||d.export||d.import)){e.preventDefault();e.stopImmediatePropagation();notify('Parent mode is required');return}
 if(!isParentMode()&&d.toggle&&data.settings.approval){
   e.preventDefault();e.stopImmediatePropagation();
   const h=data.habits.find(x=>x.id===d.toggle);if(!h)return;
   if(pendingFor(h)){data.pending=data.pending.filter(p=>!(p.habit===h.id&&p.date===today()));notify('Request withdrawn')}
   else if(!done(h)){data.pending.push({id:id(),habit:h.id,profile:h.profile,date:today(),points:h.points});notify('Sent for parent approval ⏳')}
   extendedSave();render();return
 }
 if(d.nav==='family-settings'){e.preventDefault();e.stopImmediatePropagation();tab='family-settings';render();return}
 if(d.famMode){return}
 if(d.famCancel){parentUnlock=false;render();return}
 if(d.famMode!==undefined){
  e.preventDefault();e.stopImmediatePropagation();
  if(isParentMode()){data.settings.mode='child';tab='today';extendedSave();render()}
  else if(data.settings.pin){parentUnlock=true;render()}
  else{data.settings.mode='parent';extendedSave();render()}
  return;
 }
 if(d.famPin){const input=document.querySelector('#family-pin');const value=input?.value||'';if(/^[0-9]{4}$/.test(value)){data.settings.pin=value;extendedSave();notify('Parent PIN saved')}else notify('PIN must contain exactly 4 digits');render();return}
 if(d.famPinClear){if(confirm('Remove the parent PIN?')){data.settings.pin='';extendedSave();render()}return}
 if(d.famApprove){const p=data.pending.find(p=>p.id===d.famApprove);if(p&&!data.completions.some(c=>c.habit===p.habit&&c.date===p.date)){data.completions.push({id:id(),habit:p.habit,profile:p.profile,date:p.date,points:p.points})}data.pending=data.pending.filter(p=>p.id!==d.famApprove);extendedSave();render();notify('Quest approved +⭐');return}
 if(d.famDeny){data.pending=data.pending.filter(p=>p.id!==d.famDeny);extendedSave();render();return}
 if(d.famTheme){data.settings.theme=d.famTheme;extendedSave();render();return}
 if(d.famTemplate){const samples=[['💧','Drink water','Health',10],['🧸','Put toys away','Home',10],['📖','Read a story','Learning',15],['🌻','Go outside','Health',15],['🛏️','Make my bed','Home',10],['🎨','Practice creativity','Learning',15]];const x=samples[Number(d.famTemplate)];if(x){data.habits.push({id:id(),profile:hero().id,name:x[1],icon:x[0],category:x[2],points:x[3]});extendedSave();render();notify('Starter habit added')}return}
},true);
document.addEventListener('submit',e=>{
 if(e.target.id==='family-unlock'){e.preventDefault();e.stopImmediatePropagation();const attempt=String(new FormData(e.target).get('pin'));if(attempt===data.settings.pin){data.settings.mode='parent';parentUnlock=false;tab='family-settings';extendedSave();render();notify('Parent mode unlocked')}else notify('Incorrect PIN')}
},true);
document.addEventListener('submit',e=>{
 if(e.target.id!=='newitem'||modal!=='habit')return;
 const days=Array.from(e.target.querySelectorAll('input[name="repeatDay"]:checked')).map(el=>Number(el.value));
 const current=hero().id;
 queueMicrotask(()=>{const h=data.habits.filter(h=>h.profile===current).at(-1);if(h){h.days=days;extendedSave();render()}});
});
document.addEventListener('change',e=>{if(e.target.id==='fam-approval'){data.settings.approval=e.target.checked;extendedSave();notify('Approval settings updated')}});
render();
