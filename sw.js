// Dota 2 Master — service worker.
// Версия кэша берётся из js/version.js (одна константа на всю игру).
// Список файлов игры берётся из index.html (все <script src> и <link href>) — отдельно вести его не нужно.
importScripts('js/version.js');
const CACHE = 'd2m-' + self.APP_VERSION;
const BASE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

async function coreList() {
  const html = await fetch('./index.html', { cache: 'no-cache' }).then(r => r.text());
  const found = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => './' + m[1]);
  return BASE.concat(found);
}
self.addEventListener('install', e => {
  // НЕ активируемся сами: страница покажет плашку «Доступно обновление», игрок нажмёт — тогда SKIP_WAITING
  e.waitUntil(caches.open(CACHE).then(async c => c.addAll((await coreList()).map(u => new Request(u, { cache: 'no-cache' })))));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('d2m-') && k !== CACHE && k !== 'd2m-img').map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // онлайн-сервер никогда не кэшируем
  if (/googleapis\.com|firebaseio|firebasedatabase|spotify/.test(url.hostname)) return;
  if (url.origin === location.origin) {
    // свои файлы: сначала сеть (свежая версия), без сети за 4 с — кэш
    e.respondWith(new Promise(resolve => {
      let done = false;
      const fromCache = () => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'));
      const t = setTimeout(() => { fromCache().then(r => { if (!done && r) { done = true; resolve(r); } }); }, 4000);
      fetch(req, { cache: 'no-cache' }).then(r => {
        if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); }
        clearTimeout(t); if (!done) { done = true; resolve(r); }
      }).catch(() => { clearTimeout(t); fromCache().then(r => { if (!done) { done = true; resolve(r || Response.error()); } }); });
    }));
  } else if (req.destination === 'image' || /\.(png|jpg|webp)$/.test(url.pathname) || url.hostname.includes('fonts.g')) {
    // картинки и шрифты: из кэша, иначе сеть
    e.respondWith(caches.open('d2m-img').then(c => c.match(req).then(r => r || fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()).then(() => trimImages(c)); return res; }).catch(() => r || Response.error()))));
  }
});
// не даём кэшу картинок расти бесконечно
let trimBusy = false;
function trimImages(c) {
  if (trimBusy) return; trimBusy = true;
  c.keys().then(ks => Promise.all(ks.length > 500 ? ks.slice(0, ks.length - 450).map(k => c.delete(k)) : [])).finally(() => { trimBusy = false; });
}
