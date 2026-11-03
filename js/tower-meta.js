// ================= 2.4: «ЗАЩИТА БАШЕН» — МЕТА =================
// Кубки и арены, прокачка карт 1–15 (копии + Руны), Руны, сундуки (4 слота с таймером) и магазин с видимыми шансами,
// сезонная дорога кубков, эмодзи в бою, ежедневные задания, бот вместо соперника и лидерборд.
// Руны зарабатываются ТОЛЬКО в «Защите башен». Реальных денег в игре нет и не будет.
const TWM = {
  // арены по кубкам: на каждой открываются новые карты (герои доступны всегда)
  arenas: [
    { n: 'Лес Radiant', ic: '🌳', cups: 0, cards: ['creeps', 'ranged', 'catapult', 'sunstrike', 'chrono', 'blackhole'] },
    { n: 'Река', ic: '🌊', cups: 300, cards: ['kobolds', 'arrow'] },
    { n: 'Секретная лавка', ic: '🛒', cups: 600, cards: ['wolves', 'mekansm'] },
    { n: 'Лагерь древних', ic: '🗿', cups: 1000, cards: ['treants', 'healward'] },
    { n: 'Логово Рошана', ic: '🦍', cups: 1400, cards: ['spiders', 'meteor'] },
    { n: 'Мид', ic: '⚔', cups: 1800, cards: ['sentry', 'mega'] },
    { n: 'Святилище Dire', ic: '🩸', cups: 2300, cards: ['ravage'] },
    { n: 'Цитадель Dire', ic: '🏯', cups: 2800, cards: ['tombstone'] },
    { n: 'Трон Древних', ic: '🏛', cups: 3500, cards: ['golem', 'freezing'] },
    { n: 'Арена Бессмертных', ic: '👑', cups: 4200, cards: [] }
  ],
  // прокачка: копии и Руны на переход L → L+1 (индекс 0 — с 1 на 2). Каждый уровень +4% к здоровью и урону.
  copies: [2, 4, 6, 10, 15, 20, 30, 40, 50, 70, 90, 120, 150, 200],
  runes: [20, 50, 100, 200, 350, 550, 800, 1100, 1500, 2000, 2700, 3500, 4500, 6000],
  lvlMax: 15, lvlStep: 0.04,
  pvpLvlCap: 11,               // в PvP уровень карты считается не выше 11: максимум +40%, разница уровней не решает всё
  cups: { win: 15, loss: 30, botAfterSec: 25 },
  runeGain: { floorWin: 8, pvpWin: 20, pvpLoss: 4 },
  // бесплатные сундуки за победы: 4 слота, открывается по одному
  chests: {
    wood: { n: 'Деревянный', ic: '📦', sec: 300, cards: 6, runes: [10, 25], arenaPct: 15 },
    silver: { n: 'Серебряный', ic: '🎁', sec: 1800, cards: 15, runes: [30, 70], arenaPct: 25 },
    gold: { n: 'Золотой', ic: '💰', sec: 10800, cards: 40, runes: [100, 220], arenaPct: 35 },
    magic: { n: 'Магический', ic: '🔮', sec: 28800, cards: 100, runes: [300, 600], arenaPct: 50 }
  },
  slotDrop: { wood: 55, silver: 30, gold: 12, magic: 3 },   // шанс типа сундука за победу, %
  shop: [{ t: 'silver', cost: 120 }, { t: 'gold', cost: 450 }, { t: 'magic', cost: 1300 }],
  // сезонная дорога кубков (лучший результат за сезон)
  road: [
    { c: 100, r: { runes: 40 } }, { c: 250, r: { chest: 'silver' } }, { c: 400, r: { runes: 80 } }, { c: 600, r: { chest: 'gold' } },
    { c: 800, r: { runes: 150 } }, { c: 1000, r: { chest: 'gold' } }, { c: 1300, r: { runes: 250 } }, { c: 1600, r: { chest: 'magic' } },
    { c: 2000, r: { runes: 400 } }, { c: 2500, r: { chest: 'magic' } }, { c: 3000, r: { runes: 700 } }, { c: 3500, r: { chest: 'magic' } },
    { c: 4200, r: { runes: 1200, title: 1 } }
  ],
  season: { days: 28, keepFrom: 1000, keep: 0.5 },   // конец сезона: кубки выше 1000 → 1000 + половина остатка
  emotes: ['👍', '😂', '😡', '😱', '🤝', '🔥', '😴', 'GG'],
  quests: [
    { id: 'win', t: 'Выиграй {n} боя', n: 3, r: 40 },
    { id: 'play', t: 'Сыграй {n} боёв', n: 5, r: 30 },
    { id: 'crowns', t: 'Разрушь {n} башен', n: 5, r: 40 },
    { id: 'spells', t: 'Примени {n} заклинаний', n: 8, r: 30 },
    { id: 'card', t: 'Сыграй картой «{c}» {n} раз', n: 6, r: 35 },
    { id: 'pvp', t: 'Сыграй {n} PvP-боя', n: 2, r: 45 }
  ]
};
// роль и контра каждой новой карты (для подсказок в колоде)
const TW_CARD_INFO = {
  creeps: 'Мясо для линии. Контра: заклинания по площади', ranged: 'Дешёвый урон издалека. Контра: Sun Strike, кобольды',
  catapult: 'Бьёт только здания издалека. Контра: волки, быстрые юниты', sunstrike: 'Урон по точке с задержкой. Контра: разбегающиеся юниты',
  chrono: 'Замораживает всех в круге. Контра: юниты вне круга', blackhole: 'Держит и бьёт группу. Контра: одиночные танки',
  kobolds: 'Рой из 5 слабых. Контра: Ravage, Freezing Field', wolves: 'Быстрые, догоняют лучников и катапульты. Контра: танки',
  treants: 'Дешёвые танки ×3. Контра: Chaos Meteor', spiders: 'Рой из 6 крошек. Контра: любой АоЕ',
  mega: 'Два сильных крипа. Контра: Black Hole, Голем', golem: 'Огромный танк, идёт на здания. Контра: рой, Chronosphere',
  arrow: 'Дешёвый урон + оглушение на 2 с. Контра: рой', ravage: 'Оглушает всех в большом круге. Контра: разделить пуш на две линии',
  meteor: 'Сильный удар, бьёт и здания. Контра: быстрые юниты уходят из-под удара', freezing: 'Урон по площади и замедление. Контра: танки',
  mekansm: 'Лечит своих в круге на 35%. Контра: мгновенный урон', sentry: 'Стоящая башенка на 35 с. Контра: катапульта, Голем',
  healward: 'Стоит и лечит своих рядом. Контра: лучники, Sacred Arrow', tombstone: 'Каждые 3 с поднимает зомби. Контра: Sun Strike, Meteor'
};

function migrateTowerMeta(t) {
  if (t.cups == null) t.cups = 0;
  if (t.cupsBest == null) t.cupsBest = t.cups;
  if (t.runes == null) t.runes = 0;
  if (!t.cards || typeof t.cards !== 'object') t.cards = {};
  if (!Array.isArray(t.chests) || t.chests.length !== 4) t.chests = [null, null, null, null];
  if (!t.road || typeof t.road !== 'object') t.road = { s: twSeasonId(), best: t.cups, got: {} };
  if (!t.q || typeof t.q !== 'object') t.q = { d: '', list: [] };
  if (t.mute == null) t.mute = false;
}
function twSeasonId() { return Math.floor((typeof nowMs === 'function' ? nowMs() : Date.now()) / 864e5 / TWM.season.days); }
function twSeasonLeft() { const d = (typeof nowMs === 'function' ? nowMs() : Date.now()) / 864e5; return Math.ceil(TWM.season.days - (d % TWM.season.days)); }
// конец сезона: частичный сброс кубков выше порога, дорога начинается заново
function twSeasonCheck() {
  const T = TS(), id = twSeasonId();
  if (T.road.s === id) return '';
  const old = T.cups;
  if (T.cups > TWM.season.keepFrom) T.cups = Math.round(TWM.season.keepFrom + (T.cups - TWM.season.keepFrom) * TWM.season.keep);
  T.road = { s: id, best: T.cups, got: {} };
  return old !== T.cups ? 'Новый сезон Башни: кубки ' + old + ' → ' + T.cups : '';
}
function twArenaIdx(cups) { let k = 0; TWM.arenas.forEach((a, i) => { if (cups >= a.cups) k = i; }); return k; }
function twUnlocked(c) {
  if (c.startsWith('h:')) return !!HERO_BY_ID[c.slice(2)];
  const k = twArenaIdx(TS().cupsBest);
  return TWM.arenas.slice(0, k + 1).some(a => a.cards.includes(c));
}
function twCardArena(c) { const i = TWM.arenas.findIndex(a => a.cards.includes(c)); return i < 0 ? 0 : i; }
function twCard(c) { const T = TS(); return T.cards[c] || { l: 1, c: 0 }; }
// множитель силы карты от уровня (в PvP — с потолком TWM.pvpLvlCap)
function twCardMul(c, pvp) { const l = Math.min(twCard(c).l, pvp ? TWM.pvpLvlCap : TWM.lvlMax); return 1 + TWM.lvlStep * (l - 1); }
function twCanLevel(c) { const k = twCard(c); if (k.l >= TWM.lvlMax) return false; return k.c >= TWM.copies[k.l - 1] && TS().runes >= TWM.runes[k.l - 1]; }
function twLevelUp(c) {
  if (!twCanLevel(c)) return;
  const T = TS(), k = Object.assign({ l: 1, c: 0 }, T.cards[c]);
  k.c -= TWM.copies[k.l - 1]; T.runes -= TWM.runes[k.l - 1]; k.l++; T.cards[c] = k;
  save(); sfx('coin'); twMetaTab('cards');
}
function twAddCopies(c, n) { const T = TS(); const k = Object.assign({ l: 1, c: 0 }, T.cards[c]); k.c = Math.min(99999, k.c + n); T.cards[c] = k; }
function twRunes(n) { const T = TS(); T.runes = Math.max(0, Math.min(1e7, Math.round(T.runes + n))); }

// ---------- сундуки ----------
// что выпадает (видно игроку): cards копий, из них arenaPct% — карты твоей текущей арены, остальное — любые открытые карты и герои колоды
function twChestOdds(t) {
  const x = TWM.chests[t];
  return x.n + ' сундук: ' + x.cards + ' копий карт (' + x.arenaPct + '% — карты твоей арены, ' + (100 - x.arenaPct) + '% — любые открытые карты и герои твоей колоды) + ' + x.runes[0] + '–' + x.runes[1] + ' Рун. Открывается ' + twDur(x.sec) + '.';
}
function twDur(sec) { return sec >= 3600 ? Math.round(sec / 3600) + ' ч' : Math.round(sec / 60) + ' мин'; }
function twRollChest(t, rnd) {
  rnd = rnd || Math.random;
  const x = TWM.chests[t], T = TS(), ai = twArenaIdx(T.cupsBest);
  const arenaCards = TWM.arenas[ai].cards.length ? TWM.arenas[ai].cards : TWM.arenas[0].cards;
  const open = TW_EXTRA.filter(c => twUnlocked(c)).concat(twDeck().filter(c => c.startsWith('h:')));
  const got = {};
  let left = x.cards;
  while (left > 0) {
    const part = Math.min(left, Math.max(1, Math.ceil(x.cards / 4)));
    const pool = rnd() * 100 < x.arenaPct ? arenaCards : open;
    const c = pool[Math.floor(rnd() * pool.length)];
    got[c] = (got[c] || 0) + part; left -= part;
  }
  const runes = Math.round(x.runes[0] + rnd() * (x.runes[1] - x.runes[0]));
  return { got, runes };
}
function twApplyChest(res) { Object.keys(res.got).forEach(c => twAddCopies(c, res.got[c])); twRunes(res.runes); }
function twChestText(res) { return Object.keys(res.got).map(c => (twSpecName(c)) + ' ×' + res.got[c]).join(', ') + ' · +' + res.runes + ' ᚱ'; }
function twSpecName(c) { return c.startsWith('h:') ? (HERO_BY_ID[c.slice(2)] || { name: c }).name : (TW_CARDS[c] || { n: c }).n; }
// бесплатный сундук за победу — в свободный слот
function twDropChest() {
  const T = TS(), i = T.chests.findIndex(x => !x); if (i < 0) return '';
  let r = Math.random() * 100, t = 'wood';
  for (const k of Object.keys(TWM.slotDrop)) { r -= TWM.slotDrop[k]; if (r < 0) { t = k; break; } }
  T.chests[i] = { t, start: 0 };
  return ' · ' + TWM.chests[t].ic + ' ' + TWM.chests[t].n + ' сундук в слот ' + (i + 1);
}
function twChestState(ch) { if (!ch) return 'empty'; if (!ch.start) return 'locked'; return nowMs() >= ch.start + TWM.chests[ch.t].sec * 1000 ? 'ready' : 'opening'; }
function twChestTap(i) {
  const T = TS(), ch = T.chests[i]; if (!ch) return;
  const st = twChestState(ch);
  if (st === 'locked') {
    if (T.chests.some(x => x && twChestState(x) === 'opening')) return showModal('⏳', 'Уже открывается', 'Сундуки открываются по одному. Дождись, пока откроется текущий.', '');
    ch.start = nowMs(); save(); return twMetaTab('chests');
  }
  if (st === 'ready') {
    const res = twRollChest(ch.t); twApplyChest(res); T.chests[i] = null; save(); sfx('coin');
    showModal(TWM.chests[ch.t].ic, TWM.chests[ch.t].n + ' сундук открыт', twChestText(res), 'ok');
    return twMetaTab('chests');
  }
}
function twShopBuy(k) {
  const s = TWM.shop[k]; if (!s) return; const T = TS();
  if (T.runes < s.cost) return showModal('ᚱ', 'Мало Рун', 'Нужно ' + s.cost + ' Рун. Руны дают победы, задания и дорога кубков в «Защите башен».', 'bad');
  T.runes -= s.cost; const res = twRollChest(s.t); twApplyChest(res); save(); sfx('coin');
  showModal(TWM.chests[s.t].ic, TWM.chests[s.t].n + ' сундук', twChestText(res), 'ok'); twMetaTab('shop');
}
// ---------- дорога кубков ----------
function twRoadClaim(i) {
  const T = TS(), m = TWM.road[i]; if (!m || T.road.got[i] || T.road.best < m.c) return;
  T.road.got[i] = 1; let msg = '';
  if (m.r.runes) { twRunes(m.r.runes); msg += '+' + m.r.runes + ' Рун '; }
  if (m.r.chest) { const res = twRollChest(m.r.chest); twApplyChest(res); msg += TWM.chests[m.r.chest].n + ' сундук: ' + twChestText(res); }
  if (m.r.title && typeof grantTitle === 'function') { grantTitle({ id: 'tower-s' + T.road.s, name: 'Бессмертный Башни', color: '#ff6a3a', icon: '🏯' }); msg += ' · титул «Бессмертный Башни»'; }
  save(); showModal('🏆', 'Дорога кубков: ' + m.c, msg, 'ok'); twMetaTab('road');
}
// ---------- задания ----------
function twQuests() {
  const T = TS(), d = todayStr();
  if (T.q.d !== d) {
    const r = seeded(d.split('-').join('') * 1 + 17), pool = TWM.quests.slice(), list = [];
    const deck = twDeck();
    while (list.length < 3 && pool.length) {
      const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
      list.push({ id: q.id, n: 0, need: q.n, r: q.r, c: q.id === 'card' ? deck[Math.floor(r() * deck.length)] : null, done: false });
    }
    T.q = { d, list };
  }
  return T.q.list;
}
function twQuestText(q) { const P = TWM.quests.find(x => x.id === q.id); return P.t.replace('{n}', q.need).replace('{c}', q.c ? twSpecName(q.c) : ''); }
function twQuestAdd(id, n, card) { twQuests().forEach(q => { if (q.id === id && !q.done && (!q.c || q.c === card)) q.n = Math.min(q.need, q.n + n); }); }
function twQuestClaim(i) { const q = twQuests()[i]; if (!q || q.done || q.n < q.need) return; q.done = true; twRunes(q.r); save(); sfx('coin'); twMetaTab('quests'); }

// ---------- кубки ----------
function twCupsChange(win, draw) {
  const T = TS();
  const floor = TWM.arenas[twArenaIdx(T.cups)].cups;                     // ниже начала своей арены не падаешь
  const d = draw ? 0 : win ? TWM.cups.win : -TWM.cups.loss;
  const before = T.cups;
  T.cups = Math.max(win || draw ? 0 : floor, T.cups + d); T.mmr = T.cups;
  T.cupsBest = Math.max(T.cupsBest, T.cups); T.road.best = Math.max(T.road.best, T.cups);
  const ai0 = twArenaIdx(before), ai1 = twArenaIdx(T.cups);
  let msg = ' · 🏆 ' + (T.cups - before >= 0 ? '+' : '') + (T.cups - before) + ' → ' + T.cups;
  if (ai1 > ai0) msg += ' · Новая арена: ' + TWM.arenas[ai1].ic + ' ' + TWM.arenas[ai1].n + (TWM.arenas[ai1].cards.length ? ' (карты: ' + TWM.arenas[ai1].cards.map(twSpecName).join(', ') + ')' : '');
  return msg;
}
// проигравший «призрак» тоже теряет кубки: запись tower_hits/{хозяин}/{победитель}
async function twHit(uid) { try { if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return; await db('PUT', 'tower_hits/' + uid + '/' + cloud().uid, { d: TWM.cups.loss, n: USER.nick, at: SV_TIME }); } catch (e) { } }
async function twCheckHits() {
  const c = typeof cloud === 'function' ? cloud() : null; if (!c) return;
  try {
    const hits = await db('GET', 'tower_hits/' + c.uid); if (!hits) return;
    const T = TS(); T.hitSeen = T.hitSeen || {}; let lost = 0; const who = [];
    for (const [from, h] of Object.entries(hits)) {
      if (!isObj(h) || !(h.at > (T.hitSeen[from] || 0))) continue;
      T.hitSeen[from] = h.at; lost += Math.max(0, Math.min(TWM.cups.loss, h.d | 0)); who.push(String(h.n || '?').slice(0, 20));
      db('DELETE', 'tower_hits/' + c.uid + '/' + from).catch(() => { });
    }
    if (!lost) return;
    const floor = TWM.arenas[twArenaIdx(T.cups)].cups;
    T.cups = Math.max(floor, T.cups - lost); T.mmr = T.cups; T.l++; save();
    toast('🏯 Твоего призрака победили', who.join(', ') + ' — кубки −' + lost + ' → ' + T.cups);
  } catch (e) { }
}

// ---------- после боя: награды, задания, античит ----------
function twMetaAfter(mode, win, draw, g, me) {
  const T = TS(); let msg = '';
  const secs = g.tick / TW.FPS;
  const pvp = mode === 'ghost' || mode === 'live' || mode === 'cupbot';
  // античит: победа быстрее 20 с невозможна честно (у трона 2600 здоровья) — не засчитывается
  if (win && secs < 20) return ' · ⚠ бой слишком быстрый — результат не засчитан';
  twQuestAdd('play', 1); if (pvp) twQuestAdd('pvp', 1);
  if (win) twQuestAdd('win', 1);
  twQuestAdd('crowns', g.crowns[me]);
  g.acts.filter(a => a.s === me).forEach(a => { const sp = g.deck[me][a.c]; if (!sp) return; if (sp.spell) twQuestAdd('spells', 1); twQuestAdd('card', 1, sp.c); });
  if (mode === 'floor' && win) { twRunes(TWM.runeGain.floorWin); msg += ' · +' + TWM.runeGain.floorWin + ' ᚱ'; }
  if (pvp) { const r = win ? TWM.runeGain.pvpWin : draw ? 0 : TWM.runeGain.pvpLoss; if (r) { twRunes(r); msg += ' · +' + r + ' ᚱ'; } }
  if (win) msg += twDropChest();
  return msg;
}

// ---------- бот вместо соперника (если живого нет 20–30 с) ----------
function twCupBotStart() {
  const T = TS(), cups = T.cups, ai = twArenaIdx(cups);
  const open = TWM.arenas.slice(0, ai + 1).reduce((a, x) => a.concat(x.cards), []);
  const r = seeded(Math.floor(Math.random() * 1e9));
  const ids = []; const pool = HEROES.map(h => h.id);
  while (ids.length < 4) { const id = pool[Math.floor(r() * pool.length)]; if (!ids.includes(id)) ids.push(id); }
  const extra = open.slice().sort(() => r() - 0.5).slice(0, 4);
  const nick = '🤖 ' + (typeof BOT_NICKS !== 'undefined' ? BOT_NICKS[Math.floor(r() * BOT_NICKS.length)] : 'Бот');
  const mul = 0.95 + Math.min(0.5, cups / 8000);
  const deck1 = ids.map(id => 'h:' + id).concat(extra).map(c => twCardSpec(c, mul));
  twStart('cupbot', { deck1, bot: { lvl: cups < 600 ? 0 : cups < 2000 ? 1 : 2, manaMul: 1 }, botName: nick });
  twFlash('Соперник: ' + nick + ' (бот, ~' + cups + ' 🏆)');
}

// ---------- эмодзи ----------
function twEmote(i) {
  if (!TB || TB.done) return; const e = TWM.emotes[i]; if (!e) return;
  if (TB.emoAt && Date.now() - TB.emoAt < 1500) return; TB.emoAt = Date.now();
  twShowEmote(TB.me, e);
  if (TB.online) db('POST', 'tower_rooms/' + TB.online.id + '/emo', { u: TB.online.uid, e: i, at: SV_TIME }).catch(() => { });
  else if (Math.random() < 0.35) setTimeout(() => TB && !TB.done && twShowEmote(1 - TB.me, TWM.emotes[Math.floor(Math.random() * TWM.emotes.length)]), 900 + Math.random() * 900);
}
function twShowEmote(side, e) {
  if (!TB) return; if (side !== TB.me && TS().mute) return;
  const box = document.querySelector('.tw-cv-box'); if (!box) return;
  const d = document.createElement('div'); d.className = 'tw-emo ' + (side === TB.me ? 'me' : 'opp'); d.textContent = e;
  box.appendChild(d); setTimeout(() => d.remove(), 2200);
}
function twMute() { const T = TS(); T.mute = !T.mute; save(); const b = document.getElementById('tw-mute'); if (b) b.textContent = T.mute ? '🔇' : '🔊'; twFlash(T.mute ? 'Эмодзи соперника скрыты' : 'Эмодзи соперника видны'); }
function twEmoteBar() {
  return '<div class="tw-emobar">' + TWM.emotes.map((e, i) => '<button class="tw-emob" data-click="twEmote(' + i + ')" aria-label="Эмодзи ' + e + '">' + e + '</button>').join('') +
    '<button class="tw-emob" id="tw-mute" data-click="twMute()" title="Заглушить эмодзи соперника">' + (TS().mute ? '🔇' : '🔊') + '</button></div>';
}

// ---------- меню: вкладки ----------
let twTab = 'battle';
function twMetaTab(t) { twTab = t; renderTowerMenu(); }
function twMetaTabs() {
  const T = TS(), ai = twArenaIdx(T.cups), A = TWM.arenas[ai], next = TWM.arenas[ai + 1];
  const ready = T.chests.filter(x => twChestState(x) === 'ready').length, qn = twQuests().filter(q => !q.done && q.n >= q.need).length;
  const roadN = TWM.road.filter((m, i) => !T.road.got[i] && T.road.best >= m.c).length;
  return '<div class="tw-arena"><span class="tw-aic">' + A.ic + '</span><div><b>' + A.n + '</b><div class="muted">🏆 ' + T.cups + (next ? ' · до «' + next.n + '» ' + (next.cups - T.cups) : ' · высшая арена') + ' · ᚱ ' + T.runes + ' Рун</div></div></div>' +
    '<div class="seg tw-tabs">' + [['battle', '⚔ Бой'], ['cards', '🃏 Карты'], ['chests', '📦 Сундуки' + (ready ? ' •' : '')], ['shop', 'ᚱ Магазин'], ['road', '🏆 Дорога' + (roadN ? ' •' : '')], ['quests', '📋 Задания' + (qn ? ' •' : '')], ['top', '📊 Топ']]
      .map(([k, n]) => '<button class="' + (twTab === k ? 'active' : '') + '" data-click="twMetaTab(\'' + k + '\')">' + n + '</button>').join('') + '</div>';
}
function twMetaBody() {
  const T = TS();
  if (twTab === 'cards') {
    const all = TW_EXTRA.concat(twDeck().filter(c => c.startsWith('h:')));
    return '<div class="muted" style="font-size:.78rem">Уровень карты: +' + Math.round(TWM.lvlStep * 100) + '% здоровья и урона за уровень (до ' + TWM.lvlMax + '). В PvP уровень считается не выше ' + TWM.pvpLvlCap + ' — сила не решает всё. Копии карт — из сундуков, Руны — за победы и задания.</div><div class="tw-cards">' +
      all.map(c => {
        const sp = twCardSpec(c, 1), k = twCard(c), un = twUnlocked(c), need = k.l < TWM.lvlMax ? TWM.copies[k.l - 1] : 0;
        return '<div class="tw-ccard' + (un ? '' : ' lock') + '"><div class="tw-card">' + twCardFace(sp) + '<b>' + sp.cost + '</b></div><div class="tw-cinfo"><b>' + esc(sp.n) + '</b> · ур. ' + k.l + (un ? '' : ' · 🔒 ' + TWM.arenas[twCardArena(c)].n) +
          '<div class="muted">' + esc(TW_CARD_INFO[c] || ('Герой · ' + ROLE_INFO[heroRole(c.slice(2))].n)) + '</div>' +
          (k.l < TWM.lvlMax ? '<div class="tw-prog"><div style="width:' + Math.min(100, k.c / need * 100) + '%"></div><span>' + k.c + '/' + need + '</span></div><button class="btn sm ' + (twCanLevel(c) ? 'gold' : 'ghost') + '" ' + (twCanLevel(c) ? '' : 'disabled') + ' data-click="twLevelUp(\'' + c + '\')">⬆ ' + TWM.runes[k.l - 1] + ' ᚱ</button>' : '<div class="muted">максимум</div>') + '</div></div>';
      }).join('') + '</div>' + twLevelTable();
  }
  if (twTab === 'chests') {
    return '<div class="muted" style="font-size:.78rem">Сундук за каждую победу (если есть свободный слот). Открываются по одному: нажми — запустится таймер, потом забери.</div><div class="tw-slots">' +
      T.chests.map((ch, i) => {
        const st = twChestState(ch);
        if (st === 'empty') return '<div class="tw-slot empty">пусто</div>';
        const x = TWM.chests[ch.t], left = ch.start ? Math.max(0, ch.start + x.sec * 1000 - nowMs()) / 1000 : x.sec;
        return '<button class="tw-slot ' + st + '" data-click="twChestTap(' + i + ')" title="' + esc(twChestOdds(ch.t)) + '"><span class="tw-sic">' + x.ic + '</span><b>' + x.n + '</b><small>' + (st === 'ready' ? 'Открыть!' : st === 'opening' ? '⏳ ' + twDur(left) : 'Нажми: ' + twDur(x.sec)) + '</small></button>';
      }).join('') + '</div><div class="sec-sub">Шансы выпадения</div>' + Object.keys(TWM.chests).map(t => '<div class="tw-odds">' + TWM.chests[t].ic + ' ' + esc(twChestOdds(t)) + ' Шанс получить за победу: ' + TWM.slotDrop[t] + '%.</div>').join('');
  }
  if (twTab === 'shop') {
    return '<div class="muted" style="font-size:.78rem">Магазин Башни — только за Руны (ᚱ). Руны нельзя купить: их дают победы, задания и дорога кубков. У тебя: <b>' + T.runes + ' ᚱ</b></div><div class="tw-shop">' +
      TWM.shop.map((s, i) => { const x = TWM.chests[s.t]; return '<div class="tw-shopi"><span class="tw-sic">' + x.ic + '</span><b>' + x.n + ' сундук</b><div class="muted">' + esc(twChestOdds(s.t)).replace('Открывается', 'Из магазина открывается сразу, а в слоте —') + '</div><button class="btn sm ' + (T.runes >= s.cost ? 'gold' : 'ghost') + '" data-click="twShopBuy(' + i + ')">' + s.cost + ' ᚱ</button></div>'; }).join('') + '</div>';
  }
  if (twTab === 'road') {
    return '<div class="muted" style="font-size:.78rem">Сезон Башни: осталось ' + twSeasonLeft() + ' дн. Лучший результат сезона: 🏆 ' + T.road.best + '. В конце сезона кубки выше ' + TWM.season.keepFrom + ' уменьшаются вдвое (сверх ' + TWM.season.keepFrom + ').</div><div class="tw-road">' +
      TWM.road.map((m, i) => { const got = T.road.got[i], ok = T.road.best >= m.c; const r = m.r.runes ? m.r.runes + ' ᚱ' : TWM.chests[m.r.chest].ic + ' ' + TWM.chests[m.r.chest].n; return '<div class="tw-rstep' + (got ? ' got' : ok ? ' ok' : '') + '"><b>🏆 ' + m.c + '</b><span>' + r + (m.r.title ? ' + титул' : '') + '</span>' + (got ? '✅' : ok ? '<button class="btn sm gold" data-click="twRoadClaim(' + i + ')">Забрать</button>' : '🔒') + '</div>'; }).join('') + '</div>' +
      '<div class="sec-sub">Арены</div><div class="tw-road">' + TWM.arenas.map((a, i) => '<div class="tw-rstep' + (T.cupsBest >= a.cups ? ' got' : '') + '"><b>' + a.ic + ' ' + a.n + '</b><span>от 🏆 ' + a.cups + '</span><span class="muted">' + (a.cards.map(twSpecName).join(', ') || 'престиж') + '</span></div>').join('') + '</div>';
  }
  if (twTab === 'quests') {
    return '<div class="muted" style="font-size:.78rem">Новые задания каждый день. Награда — Руны.</div>' + twQuests().map((q, i) => '<div class="tw-quest' + (q.done ? ' got' : '') + '"><span>' + esc(twQuestText(q)) + '</span><span class="muted">' + q.n + '/' + q.need + '</span>' + (q.done ? '✅' : q.n >= q.need ? '<button class="btn sm gold" data-click="twQuestClaim(' + i + ')">+' + q.r + ' ᚱ</button>' : '<span>' + q.r + ' ᚱ</span>') + '</div>').join('');
  }
  if (twTab === 'top') { setTimeout(twLoadBoard, 0); return '<div id="tw-board" class="muted">Загрузка…</div>'; }
  return null;
}
function twLevelTable() {
  let h = '<details style="margin-top:8px"><summary class="muted" style="cursor:pointer;font-size:.78rem">Таблица прокачки</summary><table class="rg-tab"><tr><th>Уровень</th><th>Копий</th><th>Рун</th><th>Сила</th></tr>';
  for (let l = 1; l < TWM.lvlMax; l++) h += '<tr><td>' + l + ' → ' + (l + 1) + '</td><td>' + TWM.copies[l - 1] + '</td><td>' + TWM.runes[l - 1] + '</td><td>+' + Math.round(TWM.lvlStep * l * 100) + '%</td></tr>';
  return h + '</table></details>';
}
