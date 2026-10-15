const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const script=fs.readFileSync('app/app.js','utf8');
assert.doesNotMatch(script,/\\b(?:function|const|let|class)\\s+top\\b/, 'Avoid declaring browser-reserved top global');
const handlers={}, storage=new Map(), root={innerHTML:''};
const document={
 getElementById:()=>root,
 addEventListener:(name,fn)=>{handlers[name]=fn},
 createElement:()=>({click(){},remove(){}}),
 body:{appendChild(){}}
};
const window={addEventListener(){}},localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
const context={document,window,localStorage,navigator:{},console,setTimeout:()=>{},confirm:()=>true,Blob,URL:{createObjectURL:()=>'',revokeObjectURL(){}},FormData:class{}};
vm.runInNewContext(script,context,{filename:'app/app.js'});
assert.match(root.innerHTML,/Today’s habits/);
const click=dataset=>handlers.click({target:{closest:()=>({dataset,id:''})}});
for(const tab of ['habits','rewards','progress','history','profiles','today']){click({nav:tab});assert.ok(root.innerHTML.length>500,'render '+tab);}
click({toggle:'h1'});
let state=JSON.parse(storage.get('habit-hero-pwa-v1'));
assert.equal(state.completions.length,1);
click({toggle:'h1'});
state=JSON.parse(storage.get('habit-hero-pwa-v1'));
assert.equal(state.completions.length,0);
console.log('PASS: app initializes, 6 screens render, habit toggling persists');
