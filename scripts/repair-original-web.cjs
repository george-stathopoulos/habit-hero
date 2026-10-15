#!/usr/bin/env node
/* Expo SDK 54 + Zustand can emit import.meta.env in a classic web script.
 * Browsers reject import.meta outside a module, so normalize at export time.
 * Do not patch other import.meta syntax without investigating its semantics.
 */
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve('dist/_expo/static/js/web');
if(!fs.existsSync(root))throw Error('Missing Expo browser bundle: '+root);
let count=0;
for(const file of fs.readdirSync(root).filter(x=>x.endsWith('.js'))){
  const location=path.join(root,file);
  const source=fs.readFileSync(location,'utf8');
  const matches=source.match(/\bimport\.meta\.env\b/g)||[];
  const patched=source.replace(/\bimport\.meta\.env\b/g,'({MODE:"production"})');
  if(/\bimport\.meta\b/.test(patched))throw Error('Unresolved import.meta in '+location);
  if(matches.length){fs.writeFileSync(location,patched);count+=matches.length}
}
console.log('Normalized import.meta.env in browser bundles:',count);
