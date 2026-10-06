// XRPet active-development service worker cleanup.
// Remove older cached UI/runtime assets so companion and interface changes always come from the network.
self.addEventListener('install',event=>{
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    try{
      const keys=await caches.keys();
      await Promise.all(keys.filter(key=>key.startsWith('xrpet-')).map(key=>caches.delete(key)));
    }catch{}
    try{await self.clients.claim()}catch{}
    try{await self.registration.unregister()}catch{}
  })());
});
self.addEventListener('fetch',()=>{});
