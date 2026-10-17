import assert from 'node:assert/strict';
import {enableTilt,tiltVector} from '../../app/v3/tilt.js';
assert.deepEqual(tiltVector(35,0,{beta:35,gamma:0}),{x:0,y:0});
assert.equal(tiltVector(35,200,{beta:35,gamma:0}).x,1);
assert.equal(tiltVector(null,0,{beta:0,gamma:0}),null);
const landscape=tiltVector(22,0,{beta:0,gamma:0},90);assert.equal(landscape.x,1);assert.ok(Math.abs(landscape.y)<1e-8);
const preferences=new Map();let permissionCalls=0,permission='granted';
globalThis.localStorage={getItem:key=>preferences.get(key)??null,setItem:(key,value)=>preferences.set(key,value)};
globalThis.matchMedia=()=>({matches:true});globalThis.isSecureContext=true;
globalThis.screen={orientation:{angle:0,addEventListener(){}}};
globalThis.DeviceOrientationEvent={requestPermission:async()=>{permissionCalls++;return permission;}};
function setup(){
 const events=new EventTarget();globalThis.addEventListener=events.addEventListener.bind(events);globalThis.removeEventListener=events.removeEventListener.bind(events);
 globalThis.document=Object.assign(new EventTarget(),{visibilityState:'visible'});
 const attributes=new Map(),button={hidden:true,setAttribute:(key,value)=>attributes.set(key,value)};
 const motion={matches:false,addEventListener(){}};
 enableTilt({button,motion,onMove(){},notify(){},isActive:()=>true});
 return {button,attributes};
}
const flush=()=>new Promise(resolve=>setTimeout(resolve,0));
let instance=setup();await flush();
assert.equal(instance.attributes.get('aria-pressed'),'true','An existing grant reconnects without tapping');
assert.equal(preferences.get('hh3-device-tilt'),'on');
instance=setup();await flush();assert.equal(instance.attributes.get('aria-pressed'),'true','Reload resumes the saved choice');
await instance.button.onclick();assert.equal(preferences.get('hh3-device-tilt'),'off');
const callsBefore=permissionCalls;instance=setup();await flush();assert.equal(permissionCalls,callsBefore,'Explicitly disabled tilt stays off on reload');
preferences.set('hh3-device-tilt','on');permission='denied';instance=setup();await flush();assert.equal(instance.attributes.get('aria-pressed'),'false','A revoked grant must not be reported active');
console.log('PASS tilt calibration, clamp, landscape axes, remembered permission, explicit opt-out and revoked access');
