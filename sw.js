const V='dispatcher-v48',F=['./','index.html','manifest.webmanifest','css/app.css','js/app.js','js/fb.js','js/h2i.js','js/firebase-config.js','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-180.png'];
addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)).then(()=>skipWaiting()))});
addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>clients.claim()))});
addEventListener('fetch',e=>{if(e.request.method!='GET'||new URL(e.request.url).origin!=location.origin)return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).catch(()=>e.request.mode=='navigate'?caches.match('index.html'):Response.error())))});
