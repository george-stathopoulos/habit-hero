self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Empty Web Push payloads keep names, habits and family details out of push providers.
self.addEventListener('push',event=>event.waitUntil(self.registration.showNotification('Habit Hero',{body:'Μια μικρή υπενθύμιση από την οικογένειά σου. Άνοιξε την εφαρμογή.',icon:'/habit-hero/app/icon-192.png',badge:'/habit-hero/app/icon-192.png',tag:'habit-hero-reminder',data:{url:'/habit-hero/welcome/'}})));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(new URL('/habit-hero/welcome/',self.location.origin).href))});
// Cache only public static assets and data-free v3 shells. Never cache API responses.
const SHELL_CACHE='hh3-static-v1';
const PUBLIC_ASSETS=["/habit-hero/app/v3/app.js", "/habit-hero/app/v3/app.css", "/habit-hero/app/v3/parent.js", "/habit-hero/app/v3/parent.css", "/habit-hero/app/v3/history.js", "/habit-hero/app/v3/history.css", "/habit-hero/app/v3/icons.js", "/habit-hero/app/v3/routines.js", "/habit-hero/app/v3/goals.js", "/habit-hero/app/v3/offline.js", "/habit-hero/app/v3/notifications.js", "/habit-hero/app/v3/tilt.js", "/habit-hero/app/v3/type.css", "/habit-hero/app/v3/worlds/playful.js", "/habit-hero/app/v3/worlds/playful.css", "/habit-hero/app/v3/fonts/noto-sans-greek-latin.woff2", "/habit-hero/app/v3/assets/mission-brush-action.webp", "/habit-hero/app/v3/assets/mission-bed-action.webp", "/habit-hero/app/v3/assets/mission-read-action.webp", "/habit-hero/app/v3/assets/foreground-reference.webp", "/habit-hero/app/v3/assets/hero-girl-reference.webp", "/habit-hero/app/v3/assets/world-reference.webp", "/habit-hero/app/v3/assets/hero-boy-reference.webp"];
const shells=['/habit-hero/v3/child/','/habit-hero/v3/parent/'];
self.addEventListener('install',event=>event.waitUntil(caches.open(SHELL_CACHE).then(cache=>Promise.all([...shells,...PUBLIC_ASSETS].map(path=>fetch(path,{credentials:'omit'}).then(response=>response.ok?cache.put(path,response):undefined).catch(()=>{}))))));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin)return;
 const asset=url.pathname.startsWith('/habit-hero/app/v3/')&&/\.(js|css|webp|png|svg|woff2)$/.test(url.pathname),shell=shells.includes(url.pathname);
 if(!asset&&!shell)return;
 event.respondWith((async()=>{const cache=await caches.open(SHELL_CACHE);try{const response=await fetch(req);if(response.ok)await cache.put(shell?url.pathname:req,response.clone());return response}catch{return await cache.match(shell?url.pathname:req)||Response.error()}})());
});
