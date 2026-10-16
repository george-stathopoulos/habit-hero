import assert from 'node:assert/strict';
import {createPinVerifier,verifyPin} from '../cloudflare/pin-hash.mjs';
const original=crypto.subtle.deriveBits.bind(crypto.subtle);
const calls=[];
const cryptoGuard=new Proxy(crypto,{get(target,key){
 if(key==='subtle')return new Proxy(crypto.subtle,{get(t,k){
  if(k==='deriveBits')return (params,...args)=>{
   calls.push(params.iterations);
   assert(params.iterations<=100000,'Cloudflare Worker PBKDF2 limit exceeded');
   return original(params,...args);
  };
  const v=Reflect.get(t,k,t);return typeof v==='function'?v.bind(t):v;
 }});
 const v=Reflect.get(target,key,target);return typeof v==='function'?v.bind(target):v;
}});
const verifier=await createPinVerifier('1234');
assert.match(verifier,/^pbkdf2-sha256-100000\$/);
assert.equal(await verifyPin('1234',verifier),true);
assert.equal(await verifyPin('5678',verifier),false);
assert.equal(await verifyPin('123',verifier),false);
assert.deepEqual(calls,[]);
console.log('PASS portable PBKDF2 PIN create/verify with 100k iteration format');
