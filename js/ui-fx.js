// ================= ЭТАП 4: «сочность», скелетоны, постраничная отрисовка, вибро =================
// Всё отключается в настройках; при системной настройке «уменьшить движение» эффекты выключены по умолчанию.
const REDUCED_MOTION = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
if (!localStorage.getItem('d2m_settings') && REDUCED_MOTION) SETTINGS.noanim = true;
SETTINGS = Object.assign({ shake: true, particles: true, haptics: true }, SETTINGS);
function motionOK() { return !SETTINGS.noanim && !REDUCED_MOTION; }

// ---------- вибрация (телефоны) ----------
const HAPTIC = { mythical: [20], immortal: [30, 40, 30], arcana: [60, 40, 120], nishtyak: [40, 30, 80], bich: [15] };
function haptic(kind) { try { if (SETTINGS.haptics && navigator.vibrate && HAPTIC[kind]) navigator.vibrate(HAPTIC[kind]); } catch (e) { } }

// ---------- тряска экрана ----------
function shakeScreen(power) {
  if (!motionOK() || !SETTINGS.shake) return;
  const w = document.querySelector('.wrap'); if (!w) return;
  w.style.setProperty('--shk', (power || 6) + 'px');
  w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake');
  setTimeout(() => w.classList.remove('shake'), 500);
}
// ---------- частицы ----------
function particles(color, n, x, y) {
  if (!motionOK() || !SETTINGS.particles) return;
  const box = document.createElement('div'); box.className = 'fx-burst';
  box.style.left = (x == null ? innerWidth / 2 : x) + 'px'; box.style.top = (y == null ? innerHeight * 0.35 : y) + 'px';
  for (let i = 0; i < (n || 24); i++) {
    const p = document.createElement('i'); const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 140;
    p.style.cssText = '--dx:' + Math.cos(a) * d + 'px;--dy:' + Math.sin(a) * d + 'px;background:' + color + ';animation-delay:' + (Math.random() * 80) + 'ms';
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 1200);
}
// ---------- плашка выпадения по редкости ----------
let fxQueue = null, fxTimer = null;
function dropFx(it) {
  if (!it || !RARITIES.includes(it.rarity)) return;
  const ri = rarityIdx(it.rarity); if (ri < 3) return;          // от Mythical и выше
  if (fxQueue && rarityIdx(fxQueue.rarity) >= ri) return;        // в пачке круток показываем лучшее
  fxQueue = it; clearTimeout(fxTimer); fxTimer = setTimeout(showDropFx, 120);
}
function showDropFx() {
  const it = fxQueue; fxQueue = null; if (!it) return;
  const ri = rarityIdx(it.rarity), col = RARITY_COLOR[it.rarity];
  haptic(it.rarity);
  if (ri >= 4) sfx('open');
  if (ri >= 4) particles(col, ri === 5 ? 40 : 22);
  if (ri === 5) shakeScreen(8);
  const old = document.getElementById('drop-pop'); if (old) old.remove();
  const d = document.createElement('div'); d.id = 'drop-pop'; d.className = 'drop-pop r-' + it.rarity;
  d.style.setProperty('--rc', col);
  d.innerHTML = '<b>' + RARITY_NAMES[it.rarity].toUpperCase() + '</b><span></span>';
  d.querySelector('span').textContent = it.name;
  document.body.appendChild(d); setTimeout(() => d.classList.add('out'), 2200); setTimeout(() => d.remove(), 2700);
}
// ---------- постраничная отрисовка больших списков (инвентарь, апгрейдер) ----------
// Сначала 60 карточек, следующие — когда долистал до конца. DOM не разрастается до тысяч узлов.
function renderChunked(grid, list, make, chunk) {
  chunk = chunk || 60; let i = 0;
  if (grid._io) { grid._io.disconnect(); grid._io = null; }
  const sentinel = document.createElement('div'); sentinel.className = 'chunk-more'; sentinel.style.gridColumn = '1/-1';
  const more = () => {
    const frag = document.createDocumentFragment();
    list.slice(i, i + chunk).forEach(it => frag.appendChild(make(it))); i += chunk;
    sentinel.before(frag);
    if (i >= list.length) { sentinel.remove(); if (grid._io) grid._io.disconnect(); }
    else sentinel.textContent = 'Показано ' + Math.min(i, list.length) + ' из ' + list.length + ' — листай дальше';
  };
  grid.appendChild(sentinel); more();
  if (i < list.length && 'IntersectionObserver' in window) { grid._io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) more(); }, { rootMargin: '400px' }); grid._io.observe(sentinel); }
  else if (i < list.length) { sentinel.onclick = more; }
}
// ---------- хуки ----------
(function hookFx() {
  const _note = noteDrop;
  noteDrop = function (it) { _note(it); dropFx(it); };
  const _hype = hype;
  hype = function (t) { _hype(t); if (t === 'НИШТЯК') { haptic('nishtyak'); shakeScreen(5); particles('#ffd36a', 30); } else if (t === 'БИЧ') haptic('bich'); };
})();
