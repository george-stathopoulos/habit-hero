// Development-only observer: layout metadata, no user records or UI mutations.
const report=()=>{
 const status=document.getElementById('loadStatus');if(!status||!status.hidden)return;
 const box=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r?{x:Math.round(r.x),y:Math.round(r.y),width:Math.round(r.width),height:Math.round(r.height)}:null;};
 const targets=Array.from(document.querySelectorAll('.bottom-nav button')).map(b=>({width:b.offsetWidth,height:b.offsetHeight}));
 const metrics={width:innerWidth,viewport:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,scene:box('.world'),content:box('.home-content'),navigation:box('.bottom-nav'),targetsOK:targets.every(t=>t.width>=44&&t.height>=44),icons:document.querySelectorAll('#homeMissions .habit-icon').length};
 const messageLayout=Array.from(document.querySelectorAll('.message-card')).filter(card=>card.getBoundingClientRect().height>0).map(card=>{const text=card.querySelector('p')?.getBoundingClientRect(),time=card.querySelector('time')?.getBoundingClientRect(),button=card.querySelector('button')?.getBoundingClientRect();return {textBottom:text?.bottom,timeBottom:time?.bottom,buttonTop:button?.top,buttonHeight:button?.height,overlap:!!button&&((text&&button.top<text.bottom)||(time&&button.top<time.bottom))}});
 metrics.messages=messageLayout;metrics.missionFont=getComputedStyle(document.querySelector('.mission-copy strong')).fontSize;metrics.childCategorySelectors=document.querySelectorAll('[data-hero]').length;metrics.headerActionHeight=document.querySelector('.icon-button').getBoundingClientRect().height;
 parent.postMessage({type:'habit-hero-layout',...metrics},location.origin);clearInterval(timer);
};
const timer=setInterval(report,200);addEventListener('load',report);setTimeout(()=>clearInterval(timer),8000);
