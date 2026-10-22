// The shell cache is named after the app version (version.js, raised on every commit), so each release
// installs fresh; page images live in their own cache and survive shell updates.
importScripts('version.js');
const SHELL = 'warsh-shell-v' + self.APP_VERSION;
const PAGE_CACHE = 'warsh-pages-v2';
const ASSETS = ['./', './index.html', './version.js', './data.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png', './icons/icon-maskable-512.png', './icons/icon-monochrome-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(ASSETS)));   // no skipWaiting: the page offers the update
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== PAGE_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function broadcast(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

// Offline reading is opt-in: the page cache exists only while the reader has it switched on.
// Each switch bumps `gen`, so a download still running from an earlier "on" stops by itself.
let gen = 0;
async function precache(urls) {
  const my = ++gen;
  const cache = await caches.open(PAGE_CACHE);
  let done = 0;
  const total = urls.length;
  for (const u of urls) {
    if (my !== gen) return;
    if (!(await cache.match(u))) {
      try { await cache.add(u); } catch (_) { /* offline or flaky: retried next visit */ }
    }
    if (await cache.match(u)) done++;
    if (my === gen) await broadcast({ type: 'progress', done, total });
  }
}

async function dropPages() {
  gen++;
  await caches.delete(PAGE_CACHE);
}

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'skip-waiting') self.skipWaiting();
  else if (d.type === 'precache' && Array.isArray(d.pages)) e.waitUntil(precache(d.pages));
  else if (d.type === 'drop-pages') e.waitUntil(dropPages());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(e.request, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      // pages read while offline saving is on are kept too; with it off nothing is stored
      if (res.ok && url.pathname.includes('/pages/') && await caches.has(PAGE_CACHE)) {
        const copy = res.clone();
        caches.open(PAGE_CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    } catch (err) {
      if (e.request.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      throw err;
    }
  })());
});
