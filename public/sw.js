const CACHE='xrpet-v5.5.21';
const CORE=['/','/styles.css?v=5.5.21','/app.js?v=5.5.21','/ecosystem.js?v=5.5.21','/music-player.js?v=5.5.21','/timeline.js?v=5.5.21','/xrp-history.json','/ripplet2d.js?v=5.5.21','/manifest.webmanifest','/xrpet-icon.svg','/xrpet-cursor.svg','/xrpet-pointer.svg','/games.js?v=5.5.21','/media/xrpet-launch-bg.mp4?v=5.5.21'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin!==location.origin || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;}).catch(()=>caches.match(e.request)));
});

self.addEventListener('push',event=>{
  let data={title:'XRPet',body:'A new signal is available.',data:{}};
  try{data=event.data?.json()||data}catch{}
  event.waitUntil(self.registration.showNotification(data.title||'XRPet',{
    body:data.body||'A new signal is available.',
    icon:'/xrpet-icon.svg',badge:'/xrpet-icon.svg',data:data.data||{}
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus'in c)return c.focus()}
    return clients.openWindow('/');
  }));
});
