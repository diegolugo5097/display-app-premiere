/* public/sw.js */
const SW_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${SW_VERSION}`;
const MEDIA_CACHE = `media-${SW_VERSION}`;

// Opcional: si quieres precachear algunos assets estáticos del build
const PRECACHE = [
  // '/favicon.ico',
  // '/logo192.png',
  // '/index.html',
];

// Utilidad: guardar una Response clonada en cache
async function cachePut(cacheName, request, response) {
  try {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  } catch (e) {
    // Si falla (cuotas o respuesta no-cacheable), ignora
  }
}

// Manejo de Range para videos mp4 desde cache (o red si hace falta)
async function handleRangeRequest(event) {
  const request = event.request;
  const url = new URL(request.url);

  // Usaremos la URL sin cabecera Range como clave de cache
  const simpleRequest = new Request(url.toString(), { method: 'GET' });
  const cache = await caches.open(MEDIA_CACHE);

  // 1) Intentar leer del cache (recurso completo)
  let fullResp = await cache.match(simpleRequest);

  // 2) Si no está cacheado, bajarlo completo de red y cachearlo
  if (!fullResp) {
    // Ojo: pedimos SIN header Range para guardar el archivo completo
    const networkResp = await fetch(simpleRequest, { mode: 'cors' });
    if (!networkResp || !networkResp.ok) return networkResp;
    await cachePut(MEDIA_CACHE, simpleRequest, networkResp);
    fullResp = await cache.match(simpleRequest);
    if (!fullResp) return networkResp;
  }

  // 3) Construir la respuesta parcial (206) a partir del ArrayBuffer
  const rangeHeader = request.headers.get('Range');
  const m = /bytes=(\d+)-(\d+)?/i.exec(rangeHeader || '');
  const buffer = await fullResp.arrayBuffer();
  const total = buffer.byteLength;

  let start = 0;
  let end = total - 1;
  if (m) {
    start = parseInt(m[1], 10);
    if (m[2] != null) {
      end = Math.min(parseInt(m[2], 10), end);
    }
  }
  if (start >= total) {
    return new Response(null, {
      status: 416,
      statusText: 'Requested Range Not Satisfiable',
      headers: { 'Content-Range': `bytes */${total}` },
    });
  }

  const chunk = buffer.slice(start, end + 1);
  const contentType =
    fullResp.headers.get('Content-Type') || 'video/mp4';

  return new Response(chunk, {
    status: 206,
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(chunk.byteLength),
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      await cache.addAll(PRECACHE);
      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, MEDIA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      self.clients.claim();
    })()
  );
});

// Pre-cache bajo demanda (el cliente nos manda URLs)
self.addEventListener('message', async (event) => {
  const { type, payload } = event.data || {};
  if (type === 'CACHE_URLS' && Array.isArray(payload)) {
    const cache = await caches.open(MEDIA_CACHE);
    for (const rawUrl of payload) {
      try {
        const url = new URL(rawUrl, self.location.origin).toString();
        const req = new Request(url, { method: 'GET' });
        const exists = await cache.match(req);
        if (!exists) {
          const resp = await fetch(req, { mode: 'cors' });
          if (resp && resp.ok) {
            await cache.put(req, resp.clone());
          }
        }
      } catch (_) {}
    }
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const isMp4 = url.pathname.toLowerCase().endsWith('.mp4');

  // SOLO intervenimos videos mp4
  if (!isMp4) return;

  // Soporte de Range
  if (request.headers.has('Range')) {
    event.respondWith(handleRangeRequest(event));
    return;
  }

  // Cache-first para mp4 sin Range
  event.respondWith(
    (async () => {
      const cache = await caches.open(MEDIA_CACHE);
      const cached = await cache.match(request);
      if (cached) return cached;

      const resp = await fetch(request, { mode: 'cors' });
      if (resp && resp.ok) {
        cachePut(MEDIA_CACHE, request, resp);
      }
      return resp;
    })()
  );
});
