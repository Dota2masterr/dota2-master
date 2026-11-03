// Dota 2 Master — service worker: игра работает без интернета, картинки кэшируются по мере загрузки
const CACHE = 'd2m-v4';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // онлайн-сервер никогда не кэшируем
  if (/googleapis\.com|firebaseio|firebasedatabase|spotify/.test(url.hostname)) return;
  if (url.origin === location.origin) {
    // свои файлы: сначала сеть (чтобы обновления приходили), при оффлайне — кэш
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
  } else if (req.destination === 'image' || /\.(png|jpg|webp)$/.test(url.pathname) || url.hostname.includes('fonts.g')) {
    // картинки и шрифты: из кэша, иначе сеть
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return res; }).catch(() => r)));
  }
});
