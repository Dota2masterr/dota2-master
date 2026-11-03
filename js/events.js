// ================= СОБЫТИЯ, КОЛЛЕКЦИИ, ПРОЗРАЧНЫЕ ШАНСЫ =================
// Шаблон события: чтобы добавить новое (Хэллоуин, годовщина, выход патча), достаточно описать его в EVENTS —
// код трогать не нужно. Включение/выключение без перезаливки — в admin.html (config/events/<id>).
const EVENTS = [
  {
    id: 'newyear', name: 'Новогодний Фестиваль', from: '12-15', to: '01-14', enabled: true, theme: 'snow',
    cur: { name: 'Снежинки', icon: '❄' },
    earn: { arenaWins: 2, questsDone: 10, gameRounds: 1, pvp: 3, roshanHits: 4, login: 15, weekly: 40 },   // сколько валюты за действие
    chest: { name: 'Морозный сундук', price: 25, w: { rare: 40, mythical: 34, immortal: 21, arcana: 5 } },
    shop: [
      { id: 'gems', kind: 'gems', name: 'Мешок кристаллов', mul: 6, price: 30 },
      { id: 'imm', kind: 'item', rarity: 'immortal', name: 'Immortal для главного героя', price: 120 },
      { id: 'arc', kind: 'item', rarity: 'arcana', name: 'Arcana для главного героя', price: 450, limit: 1 },
      { id: 'title', kind: 'title', name: 'Титул «Дед Мороз Древних»', title: { id: 'ev-newyear', name: 'Дед Мороз Древних', color: '#9ad8ff', icon: '🎅' }, price: 300, limit: 1 },
      { id: 'cheese', kind: 'cons', cons: 'cheese', name: 'Cheese (для Рошана и арены)', price: 60, limit: 3 }
    ]
  },
  {
    id: 'halloween', name: 'Ночь Диретайда', from: '10-25', to: '11-05', enabled: false, theme: 'pumpkin',   // шаблон: включить в админке
    cur: { name: 'Конфеты', icon: '🍬' },
    earn: { arenaWins: 2, questsDone: 10, gameRounds: 1, pvp: 3, roshanHits: 6, login: 15, weekly: 40 },
    chest: { name: 'Тыквенный сундук', price: 25, w: { rare: 40, mythical: 34, immortal: 21, arcana: 5 } },
    shop: [
      { id: 'gems', kind: 'gems', name: 'Мешок кристаллов', mul: 6, price: 30 },
      { id: 'imm', kind: 'item', rarity: 'immortal', name: 'Immortal для главного героя', price: 120 },
      { id: 'title', kind: 'title', name: 'Титул «Повелитель Диретайда»', title: { id: 'ev-halloween', name: 'Повелитель Диретайда', color: '#ff8a3a', icon: '🎃' }, price: 300, limit: 1 }
    ]
  }
];
function mmdd(day) { return day.slice(5); }
function eventActive(ev, day) {
  day = day || todayStr();
  const on = (typeof LIVE !== 'undefined' && LIVE.cfg.events && LIVE.cfg.events[ev.id] !== undefined) ? LIVE.cfg.events[ev.id] : ev.enabled;
  if (!on) return false;
  const d = mmdd(day);
  return ev.from <= ev.to ? (d >= ev.from && d <= ev.to) : (d >= ev.from || d <= ev.to);   // через Новый год
}
function currentEvent() { return EVENTS.find(e => eventActive(e)) || null; }
function eventEndsIn(ev) {
  const t = todayStr(), [y, m, d] = t.split('-').map(Number);
  let [em, ed] = ev.to.split('-').map(Number), ey = y;
  if (em < m || (em === m && ed < d)) ey++;
  return Math.max(0, Math.round((Date.UTC(ey, em - 1, ed) - Date.UTC(y, m - 1, d)) / 864e5)) + 1;
}
// состояние события в сейве; валюта прошлого события сгорает
function evState() {
  const ev = currentEvent(); if (!ev || !S) return null;
  const key = ev.id + '-' + (mmdd(todayStr()) >= ev.from ? todayStr().slice(0, 4) : (+todayStr().slice(0, 4) - 1));
  if (!S.event || S.event.key !== key) S.event = { key, id: ev.id, cur: 0, earned: 0, bought: {} };
  return S.event;
}
function evEarn(kind, n) {
  const ev = currentEvent(); if (!ev) return;
  const per = ev.earn[kind]; if (!per) return;
  const st = evState(); const g = Math.floor(per * (n || 1));
  if (g > 0) { st.cur += g; st.earned += g; }
}
function evBuy(id) {
  const ev = currentEvent(), st = evState(); if (!ev || !st) return;
  const it = ev.shop.find(x => x.id === id); if (!it) return;
  if (it.limit && (st.bought[id] || 0) >= it.limit) return;
  if (st.cur < it.price) return showModal(ev.cur.icon, 'Не хватает', 'Нужно ' + it.price + ' ' + ev.cur.icon, 'bad');
  st.cur -= it.price; st.bought[id] = (st.bought[id] || 0) + 1;
  let msg = '';
  if (it.kind === 'gems') { const g = Math.round(rewardScale() * it.mul); addGems(g); msg = '+' + fmt(g) + ' 🔶'; }
  else if (it.kind === 'item') { const x = addEquipment(mainHeroId(), it.rarity); msg = x.name + ' (' + RARITY_NAMES[x.rarity] + ')'; }
  else if (it.kind === 'title') { grantTitle(it.title); msg = 'Титул «' + it.title.name + '» — выбери его в профиле'; hype('НИШТЯК'); }
  else if (it.kind === 'cons') { ensureShop(); S.cons[it.cons] = (S.cons[it.cons] || 0) + 1; msg = '+1 ' + it.cons; }
  save(); updateTop(); renderEventBox(); showModal(ev.cur.icon, it.name, msg, 'ok', { auto: it.kind !== 'title' });
}
function evChest() {
  const ev = currentEvent(), st = evState(); if (!ev || !st) return;
  if (st.cur < ev.chest.price) return showModal(ev.cur.icon, 'Не хватает', 'Нужно ' + ev.chest.price + ' ' + ev.cur.icon, 'bad');
  st.cur -= ev.chest.price;
  const r = weightedRarity(ev.chest.w); const x = addEquipment(mainHeroId(), r);
  sfx('open'); save(); renderEventBox();
  showModal('🎁', ev.chest.name, x.name + ' (' + RARITY_NAMES[x.rarity] + ')', 'ok', { auto: true });
}
function oddsLine(w) { const t = Object.values(w).reduce((a, b) => a + b, 0); return Object.keys(w).reverse().map(r => '<span style="color:' + RARITY_COLOR[r] + '">' + RARITY_NAMES[r] + ' ' + (Math.round(w[r] / t * 1000) / 10) + '%</span>').join(' · '); }
function renderEventBox() {
  const host = document.getElementById('event-host'); if (!host) return;
  const ev = currentEvent(); if (!ev) { host.innerHTML = ''; return; }
  const st = evState();
  host.innerHTML = '<div class="panel panel-b event-box theme-' + ev.theme + '"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;align-items:center"><div><div class="cinzel" style="font-size:1.2rem;color:#fff">' + esc(ev.name) + '</div><div class="muted" style="font-size:.8rem">ещё ' + eventEndsIn(ev) + ' дн. · ' + esc(ev.cur.name) + ' сгорят после окончания</div></div><div class="ev-cur">' + ev.cur.icon + ' <b>' + st.cur + '</b></div></div>' +
    '<div class="muted" style="font-size:.78rem;margin:6px 0">' + esc(ev.cur.name) + ' дают: победа на арене +' + ev.earn.arenaWins + ', задание дня +' + ev.earn.questsDone + ', вход +' + ev.earn.login + ', задание недели +' + ev.earn.weekly + ', раунд мини-игры +' + ev.earn.gameRounds + ', PvP +' + ev.earn.pvp + ', Рошан +' + ev.earn.roshanHits + '</div>' +
    '<div class="ev-shop"><div class="ev-item"><b>' + esc(ev.chest.name) + '</b><div class="odds">Шансы: ' + oddsLine(ev.chest.w) + '</div><button class="btn green sm" data-click="evChest()" ' + (st.cur >= ev.chest.price ? '' : 'disabled') + '>Открыть · ' + ev.chest.price + ' ' + ev.cur.icon + '</button></div>' +
    ev.shop.map(it => { const left = it.limit ? it.limit - (st.bought[it.id] || 0) : null;
      return '<div class="ev-item"><b>' + esc(it.name) + '</b>' + (it.kind === 'gems' ? '<div>' + gemHTML(Math.round(rewardScale() * it.mul)) + '</div>' : '') + (left != null ? '<div class="muted" style="font-size:.72rem">осталось: ' + left + '</div>' : '') +
        '<button class="btn sm gold" data-click="evBuy(\'' + it.id + '\')" ' + (st.cur >= it.price && left !== 0 ? '' : 'disabled') + '>' + it.price + ' ' + ev.cur.icon + '</button></div>'; }).join('') + '</div></div>';
}
function renderEventBanner() {
  const ev = currentEvent(); let b = document.getElementById('ev-banner');
  document.body.classList.toggle('snow-on', !!(ev && ev.theme === 'snow'));
  setSnow(!!(ev && ev.theme === 'snow'));
  if (!ev) { if (b) b.remove(); return; }
  const host = document.getElementById('tab-home'); if (!host) return;
  if (!b) { b = document.createElement('div'); b.id = 'ev-banner'; b.className = 'panel ev-banner'; host.prepend(b); }
  const st = evState();
  b.innerHTML = '<span>' + ev.cur.icon + ' <b>' + esc(ev.name) + '</b> — ещё ' + eventEndsIn(ev) + ' дн. · у тебя ' + st.cur + ' ' + ev.cur.icon + '</span><button class="btn sm gold" data-click="switchTab(\'chests\')">К обмену</button>';
}
// снег: лёгкий, отключается вместе с анимациями
function setSnow(on) {
  let s = document.getElementById('snow');
  if (!on || (typeof motionOK === 'function' && !motionOK())) { if (s) s.remove(); return; }
  if (s) return;
  s = document.createElement('div'); s.id = 'snow'; s.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 28; i++) { const f = document.createElement('i'); f.textContent = '❄'; f.style.cssText = 'left:' + Math.random() * 100 + '%;animation-duration:' + (8 + Math.random() * 10) + 's;animation-delay:' + (-Math.random() * 15) + 's;font-size:' + (8 + Math.random() * 10) + 'px;opacity:' + (0.3 + Math.random() * 0.5); s.appendChild(f); }
  document.body.appendChild(s);
}

// ---------- коллекция редкостей: предметы героя всех 6 редкостей → +5% силы ----------
let collCache = { k: '', map: {} };
function collectionMap() {
  const k = S.items.length + ':' + S.uid;
  if (collCache.k !== k) { const m = {}; S.items.forEach(it => { (m[it.heroId] = m[it.heroId] || new Set()).add(it.rarity); }); collCache = { k, map: m }; }
  return collCache.map;
}
function collectionCount(id) { const s = collectionMap()[id]; return s ? s.size : 0; }
function collectionMul(id) { return collectionCount(id) >= 6 ? 1 + CONFIG.social.collectionBonus : 1; }

// ---------- прозрачные шансы ----------
function slotOddsHTML(m) {
  const tot = Object.values(SLOT_W).reduce((a, b) => a + b, 0);
  const ev = Object.keys(SLOT_W).reduce((e, r) => { const p = SLOT_W[r] / tot; return e + (m.reels === 3 ? p * p * p * m.full[r] + p * p * (1 - p) * m.pair[r] : Math.pow(p, 5) * m.p5[r] + Math.pow(p, 4) * (1 - p) * m.p4[r] + Math.pow(p, 3) * (1 - p) * m.p3[r]); }, 0);
  return '<div style="text-align:left;font-size:.85rem"><p class="muted">Каждая клетка сетки 3×' + m.reels + ' выбирает редкость независимо. Ставка делится на ' + m.lines + ' линий, совпадения считаются слева направо.</p><table class="board">' +
    '<tr><th>Редкость</th><th>Шанс символа</th><th>' + (m.reels === 3 ? '3 в линию' : '5 в линию') + '</th><th>Выплата линии</th></tr>' +
    Object.keys(SLOT_W).reverse().map(r => { const p = SLOT_W[r] / tot; return '<tr><td style="color:' + RARITY_COLOR[r] + '">' + RARITY_NAMES[r] + '</td><td>' + (p * 100).toFixed(1) + '%</td><td>' + (Math.pow(p, m.reels) * 100).toFixed(m.reels > 3 ? 4 : 2) + '%</td><td>×' + (m.reels === 3 ? m.full[r] : m.p5[r]) + '</td></tr>'; }).join('') + '</table>' +
    '<p style="margin-top:6px">Средний возврат кристаллами: ' + Math.round(ev * 100) + '% ставки' + (m.boost ? '; шанс повысить редкость выигрышного скина ' + Math.round(m.boost * 100) + '%' : '') + '. Плюс предметы за полные линии.</p>' +
    '<p class="muted">Слоты — развлечение, а не заработок. Всё только на игровую валюту.</p></div>';
}
function openSlotOdds() { showModal('🎰', 'Шансы и выплаты · ' + curMachine.name, slotOddsHTML(curMachine), '', { html: true }); }
function openWheelOdds() {
  const t = SEGMENTS.reduce((a, s) => a + s.weight, 0);
  showModal('🎯', 'Шансы рулетки героя', '<table class="board" style="text-align:left">' + SEGMENTS.map(s => '<tr><td>' + esc(s.label) + (s.sub ? ' <span class="muted">' + esc(s.sub) + '</span>' : '') + '</td><td>' + (s.weight / t * 100).toFixed(0) + '%</td></tr>').join('') + '</table><p class="muted" style="font-size:.8rem;margin-top:6px">Плюс 12% шанс бонусного скина при любом исходе, кроме «БИЧ».</p>', '', { html: true });
}

(function hookEvents() {
  const _track = track;
  track = function (k, n) { _track(k, n); if (S) evEarn(k, n); };
  const _cl = claimLogin;
  claimLogin = async function () { const b = S.daily && S.daily.login.claimed; await _cl(); if (S.daily.login.claimed !== b) { evEarn('login'); save(); } };
  const _cw = claimWeekly;
  claimWeekly = function (i) { const q = S.weekly && S.weekly.quests[i]; const ok = q && !q.claimed && q.prog >= q.n; _cw(i); if (ok) { evEarn('weekly'); save(); } };
  const _sb = setBonusMul;
  setBonusMul = function (id) { return _sb(id) * collectionMul(id); };
  const _rc = renderChests;
  renderChests = function () { _rc(); renderEventBox(); document.querySelectorAll('.chest .odds').forEach(o => { if (!/Шансы/.test(o.textContent)) o.insertAdjacentHTML('afterbegin', '<b>Шансы:</b> '); }); };
  const _rh = renderHome;
  renderHome = function () { _rh(); renderEventBanner(); };
  // кнопки «Шансы» у слотов и у рулетки
  const _is = initSlots;
  initSlots = function () { _is(); addOddsBtn('#slot-machine-host', 'openSlotOdds()', 'Шансы и выплаты'); };
  const _ih = initHeroes;
  initHeroes = function () { _ih(); addOddsBtn('#spin-status', 'openWheelOdds()', 'Шансы рулетки', true); };
})();
function addOddsBtn(sel, act, label, after) {
  const host = document.querySelector(sel); if (!host || host.parentNode.querySelector('.odds-btn[data-click="' + act + '"]')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn ghost sm odds-btn'; b.setAttribute('data-click', act); b.textContent = '📊 ' + label;
  if (after) host.after(b); else host.before(b);
}
