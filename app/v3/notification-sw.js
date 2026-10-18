self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
// Empty Web Push payloads keep names, habits and family details out of push providers.
self.addEventListener('push',event=>event.waitUntil(self.registration.showNotification('Habit Hero',{body:'Μια μικρή υπενθύμιση από την οικογένειά σου. Άνοιξε την εφαρμογή.',icon:'/habit-hero/app/icon-192.png',badge:'/habit-hero/app/icon-192.png',tag:'habit-hero-reminder',data:{url:'/habit-hero/welcome/'}})));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow(new URL('/habit-hero/welcome/',self.location.origin).href))});
