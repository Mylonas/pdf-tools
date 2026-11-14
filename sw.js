/* meldpdf service worker — offline support.
   IMPORTANT: bump VERSION alongside app.js?v=N so a deploy replaces the
   cached app.js. skipWaiting()+clients.claim() make the new SW take over
   promptly, so a second reload after a deploy serves the new assets. */
'use strict';
var VERSION = 'v9';
var CACHE = 'meldpdf-' + VERSION;      // precache + same-origin runtime
var RUNTIME = 'meldpdf-cdn-' + VERSION; // cross-origin engines (tesseract/qpdf)

/* Core assets + every page (clean URLs, as served by Cloudflare Pages). */
var CORE = [
  '/', '/manifest.json',
  '/app.js?v=9', '/theme.js', '/style.css',
  '/vendor/pdf-lib.min.js', '/vendor/pdf.min.js', '/vendor/pdf.worker.min.js',
  '/vendor/fflate.min.js', '/vendor/docx.min.js',
  '/icon-192.png', '/icon-512.png',
  '/404.html',
  '/about', '/add-page-numbers-to-pdf', '/combine-bank-statements', '/compress-pdf',
  '/contact', '/cookie-policy', '/delete-pages-from-pdf', '/extract-text-from-pdf',
  '/guides', '/how-ocr-works', '/how-to-merge-pdfs', '/how-to-password-protect-pdf',
  '/how-to-reduce-pdf-size', '/is-it-safe-to-upload-pdf', '/jpg-to-pdf', '/merge-pdf',
  '/ocr-pdf', '/organize-pdf', '/pdf-accessibility-guide', '/pdf-file-naming-best-practices',
  '/pdf-or-jpg', '/pdf-privacy', '/pdf-to-jpg', '/pdf-to-png', '/pdf-to-word',
  '/pdf-vs-docx', '/privacy', '/protect-pdf', '/remove-pdf-metadata', '/rotate-pdf',
  '/sign-pdf', '/split-pdf', '/terms', '/watermark-pdf'
];

async function precache(){
  var c = await caches.open(CACHE);
  // Add in small chunks so a single 404 can't abort the install and we don't
  // open ~46 parallel connections at once (which a flaky static host may drop).
  for(var i=0;i<CORE.length;i+=4){
    var chunk = CORE.slice(i, i+4);
    await Promise.allSettled(chunk.map(function(u){ return c.add(new Request(u, {cache:'reload'})); }));
  }
  // Verify + retry once (sequentially): a busy host can drop a large request,
  // and the offline tools need every vendored lib present.
  for(var j=0;j<CORE.length;j++){
    var u2 = CORE[j];
    if(!(await c.match(u2))){ try{ await c.add(new Request(u2, {cache:'reload'})); }catch(e){} }
  }
}
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(precache());
});

self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    var keys = await caches.keys();
    await Promise.all(keys.filter(function(k){ return k!==CACHE && k!==RUNTIME; }).map(function(k){ return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);

  // Cross-origin (tesseract/qpdf CDNs): runtime cache-first, never precached.
  if(url.origin !== self.location.origin){
    e.respondWith(caches.open(RUNTIME).then(async function(c){
      var hit = await c.match(req);
      if(hit) return hit;
      try{ var res = await fetch(req); if(res && (res.ok || res.type==='opaque')) c.put(req, res.clone()); return res; }
      catch(err){ return hit || Response.error(); }
    }));
    return;
  }

  // Vendored libraries: cache-first (immutable, versioned by path).
  if(url.pathname.indexOf('/vendor/') === 0){
    e.respondWith(caches.open(CACHE).then(async function(c){
      var hit = await c.match(req);
      if(hit) return hit;
      var res = await fetch(req); if(res && res.ok) c.put(req, res.clone()); return res;
    }));
    return;
  }

  // HTML navigations: network-first, fall back to cache (then '/') when offline.
  var isHTML = req.mode === 'navigate' || (req.headers.get('accept')||'').indexOf('text/html') > -1;
  if(isHTML){
    e.respondWith((async function(){
      try{
        var res = await fetch(req);
        var c = await caches.open(CACHE); c.put(req, res.clone());
        return res;
      }catch(err){
        var c2 = await caches.open(CACHE);
        var hit = await c2.match(req) || await c2.match(url.pathname) || await c2.match('/');
        return hit || new Response('You are offline and this page has not been cached yet.', {status:503, headers:{'Content-Type':'text/plain'}});
      }
    })());
    return;
  }

  // Everything else same-origin (app.js, theme.js, style.css, icons): cache-first.
  e.respondWith(caches.open(CACHE).then(async function(c){
    var hit = await c.match(req);
    if(hit) return hit;
    var res = await fetch(req); if(res && res.ok) c.put(req, res.clone()); return res;
  }));
});
