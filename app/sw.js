// Ads KDP: tiene l'app disponibile anche offline. I dati si scaricano sempre freschi.
var CACHE = 'adskdp-v2';
var SHELL = ['./', './index.html', './manifest.json', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.pathname.indexOf('data.enc.json') !== -1) return; // dati: sempre dalla rete
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok && url.origin === location.origin) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, cp); }); }
    return r;
  }).catch(function () { return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); }); }));
});

// notifiche push del bot: {t: titolo, b: testo, c: tipo}
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { t: 'Ads KDP', b: e.data ? e.data.text() : '' }; }
  var titolo = (d.t || 'Ads KDP').replace(/^\[(KDP)\]\s*/, '');
  e.waitUntil(self.registration.showNotification(titolo, {
    body: d.b || '', tag: d.c === 'vendita' || d.c === 'budget' ? undefined : (d.c || 'bot'),
    icon: './icon-192.png', badge: './icon-192.png', data: { c: d.c || '' }
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var vista = { vendita: 'oggi', budget: 'avv', spesa: 'oggi', modifiche: 'oggi', riepilogo: 'oggi', errori: 'avv' }[(e.notification.data || {}).c] || 'oggi';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if ('focus' in cs[i]) { cs[i].postMessage({ vista: vista }); return cs[i].focus(); } }
    return self.clients.openWindow('./?v=' + vista);
  }));
});
