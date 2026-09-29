/* Académie Sérénaissance — appli (service worker).
   Toujours la version la plus récente quand il y a Internet ; les pages déjà ouvertes
   restent disponibles sans connexion. Supabase et Stripe ne passent jamais par le cache. */
var VERSION = 'sere-v1';
var DE_BASE = ['/', '/index.html', '/espace.html', '/hors-ligne.html', '/adresse.js', '/logo.jpg',
  '/icones/icone-192.png', '/icones/icone-512.png', '/manifest.webmanifest'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(DE_BASE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (l) {
    return Promise.all(l.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
function cachable(url) {
  if (url.origin === self.location.origin) return true;
  return /^(cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com)$/.test(url.hostname);
}
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (!cachable(url)) return;                       // Supabase, Stripe, YouTube… : réseau direct
  if (url.origin === self.location.origin && url.search.indexOf('token_hash') >= 0) return;
  e.respondWith(
    fetch(req).then(function (rep) {
      if (rep && (rep.ok || rep.type === 'opaque')) {
        var copie = rep.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copie); });
      }
      return rep;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(function (r) {
        return r || (req.mode === 'navigate' ? caches.match('/hors-ligne.html') : Response.error());
      });
    })
  );
});
