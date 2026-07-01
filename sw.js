/* NEET Physics service worker — offline app shell.
   Cache-first for same-origin static assets; network passthrough for
   everything else (the remote bank.json is cross-origin and untouched). */
const CACHE = 'neet-physics-v20260701b';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=20260629b',
  './config.js?v=20260627',
  './notes-bundle.js?v=20260628173638',
  './js/curriculum.js?v=20260627',
  './js/search.js?v=20260627',
  './js/analytics.js?v=20260627',
  './js/coach.js?v=20260627',
  './js/views.js?v=20260627',
  './js/flags.js?v=20260627',
  './js/notes.js?v=20260627',
  './js/revise.js?v=20260627',
  './js/exam.js?v=20260627',
  './js/glassbox.js?v=20260630d',
  './app.js?v=20260629',
  './glassbox/vector_solver_app.html',
  './glassbox/calculus_physics_solver.html',
  './glassbox/trig_waveforms.html',
  './glassbox/significant_digits.html',
  './glassbox/kinematics.html',
  './glassbox/forces.html',
  './glassbox/newtons_laws.html',
  './favicon.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // let cross-origin (remote bank, CDN) pass through
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(resp => {
      if (resp && resp.status === 200) {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      }
      return resp;
    }).catch(() => cached))
  );
});
