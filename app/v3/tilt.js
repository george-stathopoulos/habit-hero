// Relative to the comfortable starting pose; rotate axes with the screen.
export function tiltVector(beta,gamma,baseline,angle=0){
 if(!Number.isFinite(beta)||!Number.isFinite(gamma))return null;
 const radians=angle*Math.PI/180,x=gamma-baseline.gamma,y=beta-baseline.beta;
 const clamp=value=>Math.max(-1,Math.min(1,value/22));
 return {x:clamp(x*Math.cos(radians)+y*Math.sin(radians)),y:clamp(y*Math.cos(radians)-x*Math.sin(radians))};
}
export function enableTilt({button,world,motion,onMove,notify,isActive}){
 const orientation=globalThis.DeviceOrientationEvent;
 if(!orientation||!isSecureContext||!matchMedia('(any-pointer: coarse)').matches)return;
 let enabled=false,baseline=null,smooth={x:0,y:0};
 const needsPermission=typeof orientation.requestPermission==='function';
 const reset=()=>{baseline=null;smooth={x:0,y:0};};
 const updateButton=()=>{button.hidden=motion.matches;button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Κλίση: ενεργή':'Κίνηση με κλίση';};
 const listener=event=>{
  if(!enabled||motion.matches||!isActive()||document.visibilityState!=='visible')return;
  if(!Number.isFinite(event.beta)||!Number.isFinite(event.gamma))return;
  if(!baseline)baseline={beta:event.beta,gamma:event.gamma};
  const angle=screen.orientation?.angle??globalThis.orientation??0;
  const target=tiltVector(event.beta,event.gamma,baseline,angle);
  smooth.x+=(target.x-smooth.x)*.18;smooth.y+=(target.y-smooth.y)*.18;
  onMove(smooth.x,smooth.y);
 };
 const start=()=>{enabled=true;reset();addEventListener('deviceorientation',listener,{passive:true});updateButton();};
 const stop=()=>{enabled=false;removeEventListener('deviceorientation',listener);reset();onMove(0,0);updateButton();};
 button.onclick=async()=>{
  if(enabled){stop();return;}
  try{if(needsPermission&&(await orientation.requestPermission())!=='granted'){notify('Η κλίση δεν ενεργοποιήθηκε. Η κίνηση με κύλιση παραμένει διαθέσιμη.');return;}start();}
  catch{notify('Η συσκευή δεν επέτρεψε την κλίση. Μπορείς να συνεχίσεις με κύλιση.');}
 };
 addEventListener('orientationchange',reset,{passive:true});screen.orientation?.addEventListener?.('change',reset);
 document.addEventListener('visibilitychange',reset);
 motion.addEventListener('change',()=>{if(motion.matches)stop();updateButton();});
 updateButton();if(!needsPermission&&!motion.matches)start();
}
