// ================= СУНДУКИ, КРАФТ, ЗВУК, НАСТРОЙКИ, ЯЗЫК, ОБУЧЕНИЕ, PWA =================
// ---------- настройки (общие для устройства) ----------
const SET_KEY = 'd2m_settings';
let SETTINGS = Object.assign({ vol: 0.6, sfx: true, voice: true, noanim: false, lang: 'ru' }, lsGet(SET_KEY, {}));
function saveSettings() { lsSet(SET_KEY, SETTINGS); applySettings(); }
function applySettings() { document.body.classList.toggle('noanim', !!SETTINGS.noanim); applyLang(); }

// ---------- звук (WebAudio) ----------
let AC = null, lastTick = 0;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume().catch(() => {}); return AC; }
function tone(freq, dur, type, vol, when, slide) {
  const a = ac(); if (!a) return;
  const t0 = a.currentTime + (when || 0);
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, (vol || 0.2) * SETTINGS.vol), t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function sfx(n) {
  if (!SETTINGS.sfx || SETTINGS.vol <= 0) return;
  try {
    if (n === 'tick') { const now = performance.now(); if (now - lastTick < 60) return; lastTick = now; tone(1800, 0.03, 'square', 0.05); }
    else if (n === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.09)); }
    else if (n === 'lose') { tone(220, 0.35, 'sawtooth', 0.12, 0, 90); }
    else if (n === 'coin') { tone(988, 0.08, 'square', 0.1); tone(1319, 0.2, 'square', 0.1, 0.08); }
    else if (n === 'start') { tone(110, 0.4, 'sawtooth', 0.12, 0, 220); tone(165, 0.4, 'triangle', 0.1, 0.05); }
    else if (n === 'open') { [392, 494, 587, 784, 988].forEach((f, i) => tone(f, 0.25, 'sine', 0.15, i * 0.07)); }
    else if (n === 'hit') { tone(140, 0.08, 'square', 0.08, 0, 60); }
    else if (n === 'click') { tone(660, 0.04, 'sine', 0.06); }
  } catch (e) {}
}
function announce(text, opts) {
  if (!SETTINGS.voice || SETTINGS.vol <= 0 || !window.speechSynthesis) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    const ru = opts && opts.lang === 'ru';
    const v = speechSynthesis.getVoices().find(x => (ru ? /^ru/i : /^en/i).test(x.lang)); if (v) u.voice = v;
    u.lang = ru ? 'ru-RU' : 'en-US'; u.pitch = (opts && opts.pitch) || 0.55; u.rate = (opts && opts.rate) || 0.9; u.volume = SETTINGS.vol;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch (e) {}
}

// ---------- СУНДУКИ ----------
// 2.4: цена сундука растёт вместе с базовой наградой (rewardScale × scaleMul), но не ниже cost
function chestCost(id) { const x = CONFIG.chests[id]; const rs = typeof rewardScale === 'function' && typeof S !== 'undefined' && S && S.arena ? rewardScale() : 0; return Math.max(x.cost, Math.round(rs * (x.scaleMul || 0) / 100) * 100); }
const CHESTS = [
  { id: 'ancient', name: 'Treasure of the Ancients', get cost() { return chestCost('ancient'); }, color: '#5e98d9', w: CONFIG.chests.ancient.w },
  { id: 'immortal', name: 'Immortal Treasure', get cost() { return chestCost('immortal'); }, color: '#e4ae39', w: CONFIG.chests.immortal.w },
  { id: 'arcana', name: 'Arcana Treasure', get cost() { return chestCost('arcana'); }, color: '#ade55c', w: CONFIG.chests.arcana.w }
];
function chestPool(rarity) {
  return CS_ITEMS.filter(x => x.rarity === rarity).map(x => ({ kind: 'eq', c: x }))
    .concat(CS_SETS.filter(x => x.rarity === rarity).map(x => ({ kind: 'set', c: x })));
}
function chestRoll(ch) { const r = weightedRarity(ch.w); const pool = chestPool(r); return pool.length ? pick(pool) : { kind: 'eq', c: pickCatalog(r) }; }
function giveChestItem(x) {
  if (x.kind === 'eq') { const it = eqFromCatalog(x.c, S.uid++); S.items.unshift(it); autoEquip(it, it.heroId); noteDrop(it); return it; }
  const it = { uid: S.uid++, type: 'skin', heroId: x.c.hero, rarity: x.c.rarity, name: x.c.name, path: x.c.path, ts: Date.now() };
  S.items.unshift(it); noteDrop(it); return it;
}
// 2.4.6: сокровищницы в стиле арсенала Dota — карточка с картинкой, название, «сокровищница», зелёная кнопка цены
function chestArt(c, id) {
  const gem = id === 'arcana' ? '#b6ff6a' : id === 'immortal' ? '#ffcf5a' : '#8ec8ff';
  return '<svg viewBox="0 0 200 130" class="tr-svg" aria-hidden="true"><defs>' +
    '<radialGradient id="g' + id + '" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="' + c + '" stop-opacity=".75"/><stop offset="1" stop-color="#0b0d12" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="w' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a4a26"/><stop offset="1" stop-color="#3a2010"/></linearGradient>' +
    '<linearGradient id="m' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c0"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="#6a4a10"/></linearGradient></defs>' +
    '<rect width="200" height="130" fill="url(#g' + id + ')"/>' +
    Array.from({ length: 14 }, (_, k) => '<circle cx="' + (20 + (k * 53) % 165) + '" cy="' + (12 + (k * 37) % 100) + '" r="' + (1 + k % 3 * 0.6) + '" fill="' + gem + '" opacity=".7"/>').join('') +
    '<ellipse cx="100" cy="114" rx="62" ry="8" fill="#000" opacity=".45"/>' +
    '<path d="M48 64 h104 v44 a6 6 0 0 1 -6 6 h-92 a6 6 0 0 1 -6 -6z" fill="url(#w' + id + ')" stroke="#1a0c04" stroke-width="2"/>' +
    '<path d="M44 64 q56 -46 112 0 z" fill="url(#w' + id + ')" stroke="#1a0c04" stroke-width="2"/>' +
    '<path d="M44 64 q56 -46 112 0" fill="none" stroke="url(#m' + id + ')" stroke-width="5"/>' +
    '<rect x="44" y="62" width="112" height="7" fill="url(#m' + id + ')"/>' +
    '<rect x="62" y="40" width="9" height="74" fill="url(#m' + id + ')" opacity=".9"/><rect x="129" y="40" width="9" height="74" fill="url(#m' + id + ')" opacity=".9"/>' +
    '<rect x="48" y="104" width="104" height="5" fill="url(#m' + id + ')"/>' +
    '<path d="M100 70 l14 12 -14 16 -14 -16z" fill="' + gem + '" stroke="#fff" stroke-width="1.5" style="filter:drop-shadow(0 0 6px ' + gem + ')"/>' +
    '<path d="M100 70 l6 12 -6 16" fill="#fff" opacity=".35"/></svg>';
}
function renderChests() {
  const host = document.getElementById('chests-host');
  host.innerHTML = '<div class="tr-head"><h2 class="cinzel">Сокровищницы</h2><span class="muted">Шансы выпадения указаны на каждой</span></div><div class="tr-grid">' + CHESTS.map(ch =>
    '<div class="tr-card" style="--cc:' + ch.color + '"><div class="tr-art" data-click="previewChest(\'' + ch.id + '\')" title="Содержимое">' + chestArt(ch.color, ch.id) + '</div>' +
    '<div class="tr-name">' + esc(ch.name) + '</div><div class="tr-sub">сокровищница</div>' +
    '<div class="odds">' + Object.keys(ch.w).reverse().map(r => '<span style="color:' + RARITY_COLOR[r] + '">' + RARITY_NAMES[r] + ' ' + ch.w[r] + '%</span>').join(' · ') + '</div>' +
    '<button class="tr-buy" ' + (canPay(ch.cost) ? '' : 'disabled') + ' data-click="openChest(\'' + ch.id + '\')">' + fmt(ch.cost) + ' 🔶</button>' +
    '<button class="tr-look" data-click="previewChest(\'' + ch.id + '\')">Содержимое сокровищницы</button></div>').join('') + '</div>' +
    '<div id="chest-stage"></div><div class="sec-title">Крафт · 10 → 1</div><div class="panel panel-b" id="craft-box"></div>';
  renderCraft();
}
function previewChest(id) {
  const ch = CHESTS.find(x => x.id === id);
  const parts = Object.keys(ch.w).reverse().map(r => {
    const pool = chestPool(r);
    return '<div style="margin:6px 0"><b style="color:' + RARITY_COLOR[r] + '">' + RARITY_NAMES[r] + ' — ' + ch.w[r] + '%</b> <span class="muted">(' + pool.length + ' предм.)</span><div class="prev-row">' +
      pool.slice(0, 14).map(x => '<img title="' + esc(x.c.name) + '" src="' + itemImg(x.c.path) + '" referrerpolicy="no-referrer" style="border-color:' + RARITY_COLOR[r] + '">').join('') + '</div></div>';
  }).join('');
  showModal('🎁', ch.name, '<div style="text-align:left;max-height:60vh;overflow:auto">' + parts + '</div>', '', { html: true, buttons: [{ t: 'Закрыть', c: 'ghost', f: closeModal }] });
}
let chestBusy = false;
function openChest(id) {
  const ch = CHESTS.find(x => x.id === id);
  if (chestBusy || !canPay(ch.cost)) return;
  chestBusy = true; addGems(-ch.cost); track('chests');
  const win = chestRoll(ch);
  const stage = document.getElementById('chest-stage');
  const N = 46, WIN = 40;
  const cards = [];
  for (let i = 0; i < N; i++) cards.push(i === WIN ? win : chestRoll(ch));
  stage.innerHTML = '<div class="case-wrap panel"><div class="case-line"></div><div class="case-strip" id="case-strip">' +
    cards.map(x => '<div class="case-card" style="--rc:' + RARITY_COLOR[x.c.rarity] + '"><img src="' + itemImg(x.c.path) + '" referrerpolicy="no-referrer"><span>' + esc(x.c.name) + '</span></div>').join('') + '</div></div>';
  const strip = document.getElementById('case-strip');
  const cw = 132;
  const wrapW = strip.parentNode.clientWidth;
  const target = WIN * cw - wrapW / 2 + cw / 2 + rnd(-40, 40);
  const ms = speed === 'fast' || SETTINGS.noanim ? 1500 : 5200;
  strip.style.transition = 'none'; strip.style.transform = 'translateX(0)'; void strip.offsetWidth;
  strip.style.transition = 'transform ' + ms + 'ms cubic-bezier(.08,.6,.12,1)';
  strip.style.transform = 'translateX(' + (-target) + 'px)';
  let t = 0; const iv = setInterval(() => { t += 110; sfx('tick'); if (t > ms * 0.8) clearInterval(iv); }, 110);
  setTimeout(() => {
    const it = giveChestItem(win); save(); updateTop(); sfx('open');
    if (it.rarity === 'arcana') hype('НИШТЯК'); else if (rarityIdx(it.rarity) >= 4) announce('Godlike!');
    strip.children[WIN].classList.add('won');
    showModal('🎁', RARITY_NAMES[it.rarity] + '!', it.name + ' (' + (HERO_BY_ID[it.heroId] ? HERO_BY_ID[it.heroId].name : '') + ')', 'ok', { auto: true });
    chestBusy = false; renderChestsButtons();
  }, ms + 80);
}
function renderChestsButtons() { document.querySelectorAll('.tr-card .tr-buy').forEach((b, i) => b.disabled = !canPay(CHESTS[i].cost)); }

// ---------- КРАФТ ----------
let craftR = 'common';
function craftable(r) { return S.items.filter(x => x.rarity === r && !equippedOn(x.uid) && x.uid !== ugMain && !ugFuel.includes(x.uid)).sort((a, b) => a.ts - b.ts); }
function renderCraft() {
  const box = document.getElementById('craft-box'); if (!box) return;
  const list = craftable(craftR);
  const nx = RARITIES[rarityIdx(craftR) + 1];
  box.innerHTML = '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="muted">Сжечь 10 предметов редкости</span><select id="craft-r" data-change="setCraftR(this.value)">' +
    RARITIES.slice(0, 5).map(r => '<option value="' + r + '"' + (r === craftR ? ' selected' : '') + '>' + RARITY_NAMES[r] + '</option>').join('') + '</select>' +
    '<span>→ 1 предмет <b style="color:' + RARITY_COLOR[nx] + '">' + RARITY_NAMES[nx] + '</b></span><span class="muted">(есть ' + list.length + '/10, надетые не трогаем, сжигаются самые старые)</span>' +
    '<button class="btn gold" ' + (list.length >= 10 ? '' : 'disabled') + ' data-click="doCraft()">⚒ Скрафтить</button></div>' +
    '<div class="craft-row" id="craft-row"></div>';
  // 2.3: картинки крафта — с запасными адресами (раньше битая ссылка оставляла пустой квадрат) и стрелкой к результату
  const row = document.getElementById('craft-row');
  for (let i = 0; i < 10; i++) {
    const x = list[i], c = document.createElement('div'); c.className = 'craft-cell' + (x ? '' : ' empty');
    if (x) { c.style.borderColor = RARITY_COLOR[x.rarity]; c.title = x.name; c.appendChild(mkImg(itemImgChain(x), x.name)); } else c.textContent = '?';
    row.appendChild(c);
  }
  const ar = document.createElement('div'); ar.className = 'craft-arrow'; ar.textContent = '⚒ →'; row.appendChild(ar);
  const res = document.createElement('div'); res.className = 'craft-cell result'; res.style.borderColor = RARITY_COLOR[nx]; res.innerHTML = '<span style="color:' + RARITY_COLOR[nx] + '">' + RARITY_NAMES[nx] + '</span>'; row.appendChild(res);
}
function doCraft() {
  const list = craftable(craftR).slice(0, 10); if (list.length < 10) return;
  const nx = RARITIES[rarityIdx(craftR) + 1];
  const hero = pick(list).heroId;
  list.forEach(x => removeItem(x.uid));
  const it = Math.random() < 0.5 ? addEquipment(HERO_BY_ID[hero] ? hero : pick(HEROES).id, nx) : addSkin(HERO_BY_ID[hero] ? hero : pick(HEROES).id, nx);
  track('crafts'); save(); sfx('open'); renderCraft(); updateTop();
  if (nx === 'arcana') hype('НИШТЯК');
  showModal('⚒', 'Крафт: ' + RARITY_NAMES[nx], '<div class="craft-won" style="border-color:' + RARITY_COLOR[nx] + '"><img src="' + itemImgChain(it)[0] + '" referrerpolicy="no-referrer" alt=""></div><b style="color:' + RARITY_COLOR[nx] + '">' + esc(it.name) + '</b>', 'ok', { html: true });
  const im = document.querySelector('.craft-won img'); if (im) setImg(im, itemImgChain(it), it.name);
}

// ---------- НАСТРОЙКИ ----------
function openSettings() {
  showModal('⚙', 'Настройки', '<div style="text-align:left;font-size:.9rem;display:grid;gap:10px">' +
    '<label>Громкость <input type="range" min="0" max="1" step="0.05" value="' + SETTINGS.vol + '" data-input="setSetting(\'vol\',this)" style="width:100%"></label>' +
    '<label><input type="checkbox" ' + (SETTINGS.sfx ? 'checked' : '') + ' data-change="setSetting(\'sfx\',this)"> Звуковые эффекты</label>' +
    '<label><input type="checkbox" ' + (SETTINGS.voice ? 'checked' : '') + ' data-change="setSetting(\'voice\',this)"> Голос диктора (First Blood, Rampage…)</label>' +
    '<label><input type="checkbox" ' + (SETTINGS.noanim ? 'checked' : '') + ' data-change="setSetting(\'noanim\',this)"> Отключить анимации (для слабых устройств)</label>' +
    '<label><input type="checkbox" ' + (SETTINGS.shake ? 'checked' : '') + ' data-change="setSetting(\'shake\',this)"> Тряска экрана на редких дропах</label>' +
    '<label><input type="checkbox" ' + (SETTINGS.particles ? 'checked' : '') + ' data-change="setSetting(\'particles\',this)"> Частицы и вспышки</label>' +
    '<label><input type="checkbox" ' + (SETTINGS.haptics ? 'checked' : '') + ' data-change="setSetting(\'haptics\',this)"> Вибрация на телефоне</label>' +
    (typeof REDUCED_MOTION !== 'undefined' && REDUCED_MOTION ? '<div class="muted" style="font-size:.75rem">В системе включено «уменьшить движение» — анимации приглушены.</div>' : '') +
    '<label>Язык / Language <select data-change="setSetting(\'lang\',this)"><option value="ru"' + (SETTINGS.lang === 'ru' ? ' selected' : '') + '>Русский</option><option value="en"' + (SETTINGS.lang === 'en' ? ' selected' : '') + '>English</option></select></label>' +
    '<button class="btn" data-click="restartTutorial()">Пройти обучение заново</button>' +
    '<button class="btn" data-click="rogueTestFight()">⚔ Тестовый бой «Путь Древнего» (герой против 3 крипов)</button></div>', '', { html: true, buttons: [{ t: 'Готово', c: 'green', f: closeModal }] });
}

// ---------- ЯЗЫК (интерфейс) ----------
const I18N = {
  en: {
    'nav:home': 'Home', 'nav:heroes': 'Heroes', 'nav:slots': 'Slots', 'nav:collection': 'Collection', 'nav:upgrade': 'Upgrader', 'nav:arena': 'Arena', 'nav:invoker': 'Invoker Game', 'nav:quests': 'Quests', 'nav:chests': 'Treasures', 'nav:games': 'Mini-games', 'nav:online': 'Online',
    'st:stack': '⚔ Stack power', 'st:power': 'Σ Total power', 'st:items': '🎨 Items', 'st:spins': '🎰 Spins', 'st:arena': '🏟 Arena',
    'spd:slow': '🐢 Slow', 'spd:fast': '⚡ Fast', 'btn:upall': '⬆ Upgrade all', 'spin': 'SPIN', 'fight': '⚔ FIGHT'
  }
};
const I18N_RU = {};
function applyLang() {
  const L = SETTINGS.lang === 'en' ? I18N.en : null;
  document.documentElement.lang = SETTINGS.lang;
  document.querySelectorAll('#nav button').forEach(b => {
    const k = 'nav:' + b.dataset.tab;
    if (!I18N_RU[k]) I18N_RU[k] = b.childNodes[0] ? b.childNodes[0].textContent : b.textContent;
    const badge = b.querySelector('.nbadge');
    b.textContent = L && L[k] ? L[k] : I18N_RU[k];
    if (badge) b.appendChild(badge);
  });
  const stats = document.querySelectorAll('.subbar .stat');
  ['st:stack', 'st:power', 'st:items', 'st:spins', 'st:arena'].forEach((k, i) => {
    const el = stats[i]; if (!el) return;
    const tn = el.childNodes[0];
    if (!I18N_RU[k]) I18N_RU[k] = tn.textContent;
    tn.textContent = (L && L[k] ? L[k] : I18N_RU[k].trim()) + ' ';
  });
  [['spd-slow', 'spd:slow'], ['spd-fast', 'spd:fast']].forEach(([id, k]) => { const el = document.getElementById(id); if (!I18N_RU[k]) I18N_RU[k] = el.textContent; el.textContent = L ? L[k] : I18N_RU[k]; });
  const sb = document.getElementById('spin-btn'); if (sb) { if (!I18N_RU.spin) I18N_RU.spin = sb.textContent; sb.textContent = L ? L.spin : I18N_RU.spin; }
}

// ---------- ОБУЧЕНИЕ ----------
const TUTORIAL = [
  { sel: '#gems-chip', t: 'Это кристаллы — валюта игры. Они нужны для круток, слотов, лавки и сундуков.' },
  { sel: '[data-tab=heroes]', t: 'Во вкладке «Герои» прокачивай героев на рулетке. С 10 уровня открываются таланты.' },
  { sel: '[data-tab=arena]', t: 'Арена: главный герой + 4 сильнейших сражаются с волнами врагов. 100 уровней, Рошан, лавка и режимы.' },
  { sel: '[data-tab=slots]', t: 'Слоты и сундуки дают скины и снаряжение. Снаряжение повышает силу героя.' },
  { sel: '[data-tab=quests]', t: 'Каждый день — награда за вход и три задания. Забирай награды здесь.' },
  { sel: '#free-btn', t: 'Бесплатные кристаллы раз в 10 минут. Удачи, и пусть будет НИШТЯК!' }
];
let tutStep = -1;
function startTutorial(force) {
  if (!force && S.tutDone) return;
  tutStep = 0; showTutStep();
}
function showTutStep() {
  let ov = document.getElementById('tut');
  if (!ov) { ov = document.createElement('div'); ov.id = 'tut'; document.body.appendChild(ov); }
  if (tutStep < 0 || tutStep >= TUTORIAL.length) { ov.remove(); S.tutDone = true; save(); return; }
  const st = TUTORIAL[tutStep];
  const el = document.querySelector(st.sel);
  const r = el ? el.getBoundingClientRect() : { left: innerWidth / 2, top: 120, width: 0, height: 0 };
  ov.innerHTML = '<div class="tut-hole" style="left:' + (r.left - 6) + 'px;top:' + (r.top - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px"></div>' +
    '<div class="tut-box panel" style="left:' + Math.min(innerWidth - 330, Math.max(10, r.left)) + 'px;top:' + (r.top + r.height + 16) + 'px"><div style="margin-bottom:10px">' + esc(st.t) + '</div><div style="display:flex;gap:6px;justify-content:space-between"><span class="muted">' + (tutStep + 1) + '/' + TUTORIAL.length + '</span><span><button class="btn ghost sm" data-click="tutSkip()">Пропустить</button> <button class="btn green sm" data-click="tutNext()">' + (tutStep === TUTORIAL.length - 1 ? 'Начать игру' : 'Далее') + '</button></span></div></div>';
}

// ---------- PWA ----------
(function pwa() {
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.json'; document.head.appendChild(l);
  const a = document.createElement('link'); a.rel = 'apple-touch-icon'; a.href = 'icon-192.png'; document.head.appendChild(a);
  if ('serviceWorker' in navigator) window.addEventListener('load', registerSW);
})();
// ---------- обновления: плашка «Доступно обновление» ----------
function registerSW() {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(reg => {
    const ask = w => showUpdateBar(() => w.postMessage('SKIP_WAITING'));
    if (reg.waiting && navigator.serviceWorker.controller) ask(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing; if (!w) return;
      w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); });
    });
    // проверять обновления раз в 30 минут и при возврате в приложение
    setInterval(() => reg.update().catch(() => {}), 30 * 60000);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading) return; reloading = true; try { save(); } catch (e) { } location.reload(); });
}
function showUpdateBar(apply) {
  if (document.getElementById('upd-bar')) return;
  const b = document.createElement('div'); b.id = 'upd-bar';
  b.innerHTML = '<span>⬆ Доступно обновление игры</span>';
  const go = document.createElement('button'); go.className = 'btn sm green'; go.textContent = 'Перезагрузить';
  go.onclick = () => { go.disabled = true; go.textContent = 'Обновляю…'; try { save(); } catch (e) { } apply(); setTimeout(() => location.reload(), 3000); };
  const x = document.createElement('button'); x.className = 'btn sm ghost'; x.textContent = 'Позже'; x.onclick = () => b.remove();
  b.appendChild(go); b.appendChild(x); document.body.appendChild(b);
}
let deferredInstall = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = document.getElementById('install-btn'); if (b) b.style.display = ''; });
function installApp() { if (deferredInstall) { deferredInstall.prompt(); deferredInstall = null; document.getElementById('install-btn').style.display = 'none'; } else showModal('📱', 'Установка', 'На телефоне: открой меню браузера → «Добавить на главный экран». На ПК: значок установки в адресной строке.', ''); }

// ---------- CSS ----------
(function () {
  const st = document.createElement('style');
  st.textContent = `
body.noanim *,body.noanim *::before,body.noanim *::after{animation:none!important;transition:none!important}
.chest-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px}
.chest{text-align:center;padding:16px;border-top:3px solid var(--cc)!important}
.chest h3{color:var(--cc);letter-spacing:2px;font-size:1rem;margin:8px 0 4px}
.chest .odds{font-size:.72rem}
.chest-ic{width:110px;height:80px;margin:0 auto;position:relative}
.chest-ic .box{position:absolute;bottom:0;left:5px;right:5px;height:48px;background:linear-gradient(180deg,#6b4a1e,#3a260c);border:3px solid var(--cc);border-radius:4px;box-shadow:0 0 22px var(--cc)}
.chest-ic .lid{position:absolute;top:6px;left:0;right:0;height:30px;background:linear-gradient(180deg,#8a6228,#5a3c14);border:3px solid var(--cc);border-radius:14px 14px 3px 3px;animation:lid 2.4s ease-in-out infinite}
@keyframes lid{50%{transform:translateY(-4px) rotate(-3deg)}}
.case-wrap{position:relative;overflow:hidden;margin:16px 0;padding:10px 0;background:#05070a}
.case-line{position:absolute;left:50%;top:0;bottom:0;width:3px;background:var(--gold2);box-shadow:0 0 12px var(--gold2);z-index:3;transform:translateX(-50%)}
.case-strip{display:flex;gap:0;will-change:transform}
.case-card{flex:0 0 128px;margin:0 2px;height:120px;background:linear-gradient(180deg,#1a2028,#0d1116);border-bottom:4px solid var(--rc);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:4px;text-align:center}
.case-card img{max-width:110px;max-height:76px;object-fit:contain}
.case-card span{font-size:.62rem;color:#c3ccd5;margin-top:4px;line-height:1.1;max-height:2.2em;overflow:hidden}
.case-card.won{box-shadow:0 0 0 2px var(--rc),0 0 30px var(--rc);transform:scale(1.05)}
.prev-row{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.prev-row img{width:54px;height:40px;object-fit:contain;background:#0b0e12;border:1px solid;border-radius:2px}
#tut{position:fixed;inset:0;z-index:600}
.tut-hole{position:fixed;border-radius:6px;box-shadow:0 0 0 9999px rgba(0,0,0,.72),0 0 0 3px var(--gold2),0 0 24px var(--gold2);pointer-events:none;transition:all .3s}
.tut-box{position:fixed;width:320px;padding:14px;font-size:.9rem;line-height:1.4}
`;
  document.head.appendChild(st);
})();
