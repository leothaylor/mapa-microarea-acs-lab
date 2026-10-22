/* Atualização network-first para que modificações no GitHub Pages apareçam. */
const CACHE='rotina-acs-lab-v4';
const LOCAL=['./','./index.html','./app.js','./domain.js','./styles.css','./vendor/leaflet.markercluster.js','./vendor/MarkerCluster.css','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(LOCAL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('rotina-acs-lab-')&&x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
  event.respondWith(fetch(req).then(response=>{
    if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put(req,clone));}
    return response;
  }).catch(()=>caches.match(req).then(r=>r||Response.error())));
});
