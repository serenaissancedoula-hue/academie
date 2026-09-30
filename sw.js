/* Académie Sérénaissance — appli (service worker).
   Toujours la version la plus récente quand il y a Internet ; les pages déjà ouvertes
   restent disponibles sans connexion. Supabase et Stripe ne passent jamais par le cache. */
var VERSION = 'sere-v4';
var DE_BASE = ['/', '/index.html', '/espace.html', '/hors-ligne.html', '/en/', '/en/espace.html', '/en/hors-ligne.html', '/langue.js', '/adresse.js', '/logo.jpg',
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
        return r || (req.mode === 'navigate' ? caches.match(url.pathname.indexOf('/en/') === 0 ? '/en/hors-ligne.html' : '/hors-ligne.html') : Response.error());
      });
    })
  );
});

/* ---------- Notifications (appli Admin) ---------- */
function compteur(delta) {
  return caches.open('sere-badge').then(function (c) {
    return c.match('/__badge').then(function (r) { return r ? r.text() : '0'; }).then(function (t) {
      var n = delta === null ? 0 : Math.max(0, (parseInt(t, 10) || 0) + delta);
      return c.put('/__badge', new Response(String(n))).then(function () { return n; });
    });
  });
}
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { titre: 'Académie Sérénaissance', message: e.data ? e.data.text() : '' }; }
  e.waitUntil(compteur(1).then(function (n) {
    var badge = self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(n).catch(function () {}) : Promise.resolve();
    var admin = !d.url || d.url.indexOf('/admin') === 0;
    var icone = admin ? '/icones/admin-192.png' : '/icones/icone-192.png';
    var options = {
      body: d.message || '', icon: icone, badge: icone,
      data: { url: d.url || '/admin.html' }, tag: d.tag || undefined, renotify: !!d.tag,
      silent: d.son === false                               // réglage « son » de cet appareil
    };
    if (d.vibration !== false) options.vibrate = [120, 60, 120]; // réglage « vibration »
    // prévient l'appli ouverte (pour jouer le son au volume choisi et rafraîchir le chat)
    var avis = self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
      l.forEach(function (c) { c.postMessage({ type: 'push', donnees: d }); });
    });
    return Promise.all([badge, avis, self.registration.showNotification(d.titre || 'Académie Sérénaissance', options)]);
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/admin.html';
  var page = url.split('#')[0];
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (l) {
    for (var i = 0; i < l.length; i++) { if (l[i].url.indexOf(page) >= 0 && 'focus' in l[i]) { l[i].navigate(url); return l[i].focus(); } }
    return self.clients.openWindow(url);
  }));
});
self.addEventListener('message', function (e) {
  if (e.data === 'badge-zero') compteur(null).then(function () { if (self.navigator.clearAppBadge) self.navigator.clearAppBadge().catch(function () {}); });
});
