const CACHE='habit-hero-pwa-v4';
const ASSETS=['./','./index.html','./style.css','./app.js','./advanced.js','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('habit-hero-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location.href).pathname))return;
 event.respondWith((async()=>{
   try{const response=await fetch(req);
     if(response.ok){const cache=await caches.open(CACHE);await cache.put(req,response.clone());}
     return response;
   }catch(err){
     const cache=await caches.open(CACHE);
     return await cache.match(req)||await cache.match(url.pathname)||await cache.match('./')||Response.error();
   }
 })());
});