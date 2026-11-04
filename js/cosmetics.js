// ================= 2.4.9: СВОИ ШМОТКИ У КАЖДОГО ГЕРОЯ, СОКРОВИЩНИЦЫ КАК В DOTA =================
// Данные — js/data-cosmetics.js (COS_DATA, COS_TREASURES, собраны с wiki.cs.money).
const COS_R = { c: 'common', u: 'uncommon', r: 'rare', m: 'mythical', i: 'immortal', l: 'immortal', a: 'arcana' };
const COS_HEROES = new Set();
(function buildCosmetics() {
  if (typeof COS_DATA === 'undefined') return;
  const items = [], sets = [];
  for (const h in COS_DATA) {
    if (!HERO_BY_ID[h]) continue;
    COS_HEROES.add(h);
    const d = COS_DATA[h];
    (d.i || '').split('\n').forEach(l => { if (!l) return; const [name, r, slot, p] = l.split('|'); items.push({ name, hero: h, path: p + '_png.png', rarity: COS_R[r] || 'common', slot, real: 1 }); });
    (d.s || '').split('\n').forEach(l => { if (!l) return; const [name, r, p] = l.split('|'); sets.push({ name, hero: h, path: p + '_png.png', rarity: COS_R[r] || 'common', model: /^sets\//.test(p) }); });
  }
  // герои, которых нет в новых данных, оставляют старый каталог
  const oldI = CS_ITEMS.filter(x => !COS_HEROES.has(x.hero)), oldS = CS_SETS.filter(x => !COS_HEROES.has(x.hero));
  CS_ITEMS.length = 0; items.concat(oldI).forEach(x => CS_ITEMS.push(x));
  CS_SETS.length = 0; sets.concat(oldS).forEach(x => CS_SETS.push(x));
})();
const COS_BY_HERO = {};
CS_ITEMS.forEach(x => (COS_BY_HERO[x.hero] = COS_BY_HERO[x.hero] || []).push(x));
const SETS_BY_HERO = {};
CS_SETS.forEach(x => (SETS_BY_HERO[x.hero] = SETS_BY_HERO[x.hero] || []).push(x));

// «моделька» героя в полный рост (рендер Dota)
function heroRender(id) { return CSM + 'heroes/renders/images/' + id + '.png'; }
function heroModelChain(id) { return [heroRender(id)].concat(heroTallChain(id)); }

// если у героя нет вещи нужной редкости — берём его вещь ближайшей редкости в особом стиле (как Exalted/Golden в Dota)
const COS_STYLE = { common: 'Inscribed', uncommon: 'Inscribed', rare: 'Heroic', mythical: 'Genuine', immortal: 'Golden', arcana: 'Exalted' };
function nearestOwn(list, rarity) {
  const want = rarityIdx(rarity);
  let best = null, bd = 99;
  list.forEach(x => { const d = Math.abs(rarityIdx(x.rarity) - want) + (rarityIdx(x.rarity) > want ? 0.5 : 0); if (d < bd) { bd = d; best = x; } });
  if (!best) return null;
  const same = list.filter(x => x.rarity === best.rarity && (!best.slot || x.slot === best.slot));
  const b = pick(same.length ? same : [best]);
  return Object.assign({}, b, { name: COS_STYLE[rarity] + ' ' + b.name.replace(/^The /, ''), rarity });
}
function ownEq(heroId, rarity, slot) {
  const all = COS_BY_HERO[heroId] || [];
  if (!all.length) return null;
  let own = all.filter(x => x.rarity === rarity);
  const os = slot ? own.filter(x => x.slot === slot) : [];
  if (os.length) own = os;
  if (own.length) return pick(own);
  const bySlot = slot ? all.filter(x => x.slot === slot) : [];
  return nearestOwn(bySlot.length ? bySlot : all, rarity);
}
function ownSet(heroId, rarity) {
  const all = SETS_BY_HERO[heroId] || [];
  if (!all.length) return null;
  let own = all.filter(x => x.rarity === rarity);
  const models = own.filter(x => x.model);                 // наборы с картинкой героя в полный рост
  if (models.length) own = models;
  if (own.length) return pick(own);
  const m = all.filter(x => x.model);
  return nearestOwn(m.length ? m : all, rarity);
}
// у каждого героя — только свои вещи
pickCatalog = (function (orig) {
  return function (rarity, slot, heroId, strict) {
    if (heroId && HERO_BY_ID[heroId]) { const o = ownEq(heroId, rarity, slot); if (o) return o; }
    return strict && heroId && HERO_BY_ID[heroId] ? genHeroEq(heroId, rarity, slot) : orig(rarity, slot, heroId, strict);
  };
})(pickCatalog);
pickSet = function (heroId, rarity) { return ownSet(heroId, rarity); };

// 2.4.9: разовая замена выдуманных вещей у игроков на настоящие вещи их героев (uid, слот и редкость сохраняются)
function cosMigrate(st) {
  if (!st || st.cos249 || !Array.isArray(st.items)) return;
  st.items.forEach(it => {
    if (!HERO_BY_ID[it.heroId]) return;
    if (it.type === 'eq') {
      const real = it.path && (COS_BY_HERO[it.heroId] || []).some(x => x.path === it.path);
      if (real) return;
      const own = (COS_BY_HERO[it.heroId] || []).filter(x => x.slot === it.slot);
      if (!own.length) return;
      const exact = own.filter(x => x.rarity === it.rarity);
      const c = exact.length ? pick(exact) : nearestOwn(own, it.rarity);
      if (!c) return;
      it.name = c.name; it.path = c.path; delete it.art;
    } else if (it.type === 'skin' && !it.path) {
      const s = ownSet(it.heroId, it.rarity);
      if (s) { it.name = s.name; it.path = s.path; }
    }
  });
  st.cos249 = 1;
}

// ---------- СОКРОВИЩНИЦЫ ----------
// Как в Dota: обычные предметы сокровищницы выпадают без повторов (пока не соберёшь все),
// плюс «Редкий бонус» — шанс растёт с каждым открытием без него и гарантирован на N-м.
const TR_TIER = {
  r: { cost: 3000, scale: 8, color: '#4b69ff', bonus: ['mythical', 'immortal'], base: 4, step: 1, guar: 30 },
  m: { cost: 12000, scale: 40, color: '#8847ff', bonus: ['immortal'], base: 3, step: 0.75, guar: 40 },
  i: { cost: 30000, scale: 110, color: '#e4ae39', bonus: ['arcana'], base: 2, step: 0.5, guar: 50 }
};
function trKey(n) { return n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
const TREASURES = (typeof COS_TREASURES === 'undefined' ? [] : COS_TREASURES).map(t => {
  const tier = TR_TIER[t.r] || TR_TIER.r;
  const items = t.c.filter(e => HERO_BY_ID[e[3]]).map(e => ({ kind: e[0] === 's' ? 'set' : 'eq', c: { name: e[1], rarity: COS_R[e[2]] || 'rare', hero: e[3], path: e[4] + '_png.png', slot: e[5] || (ownEq(e[3], 'rare') || { slot: 'weapon' }).slot } }));
  return { id: trKey(t.n), name: t.n, img: t.img + '_png.png', date: t.d, tier: t.r, color: tier.color, items };
}).filter(t => t.items.length);
function trCost(t) { const x = TR_TIER[t.tier]; const rs = typeof rewardScale === 'function' && typeof S !== 'undefined' && S && S.arena ? rewardScale() : 0; return Math.max(x.cost, Math.round(rs * x.scale / 100) * 100); }
// бонусные вещи: настоящие вещи героев из этой сокровищницы нужной редкости (если нет — любых героев)
function trBonusPool(t) {
  const want = TR_TIER[t.tier].bonus;
  const heroes = [...new Set(t.items.map(x => x.c.hero))];
  let pool = CS_ITEMS.filter(x => want.includes(x.rarity) && heroes.includes(x.hero) && x.real);
  if (pool.length < 4) pool = pool.concat(CS_ITEMS.filter(x => want.includes(x.rarity) && x.real && !heroes.includes(x.hero)));
  return pool;
}
const TR_BONUS_CACHE = {};
function trBonus(t) { return TR_BONUS_CACHE[t.id] || (TR_BONUS_CACHE[t.id] = trBonusPool(t)); }
function trState(id) { S.trs = S.trs || {}; return S.trs[id] = S.trs[id] || { n: 0, miss: 0, got: [] }; }
function trBonusChance(t) {
  const x = TR_TIER[t.tier], st = trState(t.id);
  if (st.miss + 1 >= x.guar) return 100;
  return Math.min(100, x.base + x.step * st.miss);
}
function trOwned(t, c) { return S.items.some(it => it.name === c.name && it.heroId === c.hero); }
function trRoll(t, real) {
  const st = trState(t.id);
  const chance = trBonusChance(t);
  if (Math.random() * 100 < chance) {
    const b = pick(trBonus(t));
    if (b) { if (real) st.miss = 0; return { kind: 'eq', c: b, bonus: 1 }; }
  }
  if (real) st.miss++;
  // без повторов: сначала то, чего ещё нет
  const fresh = t.items.filter(x => !trOwned(t, x.c));
  return pick(fresh.length ? fresh : t.items);
}

// совместимость: старые сундуки по id (тесты, лайв-опс)
const CHESTS = TREASURES.map(t => ({ id: t.id, name: t.name, get cost() { return trCost(t); }, color: t.color, w: null, tr: t }));
// облик героя: надетый скин (картинка набора) или обычный портрет / моделька
function heroLookTall(id) { const sk = typeof heroSkin === 'function' ? heroSkin(id) : null; return sk && sk.path ? [itemImg(sk.path)].concat(heroTallChain(id)) : heroTallChain(id); }
function heroLookModel(id) { const sk = typeof heroSkin === 'function' ? heroSkin(id) : null; return sk && sk.path ? [itemImg(sk.path)].concat(heroModelChain(id)) : heroModelChain(id); }
