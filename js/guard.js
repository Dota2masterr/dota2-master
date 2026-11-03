// ================= ЗАЩИТА: проверка сохранений + серверное время =================
// Подключается после js2_core.js. Ничего не удаляет из нормальных сейвов —
// только чинит битые поля и отбрасывает явно подделанные/сломанные предметы.

const SAVE_LIMITS = {
  gems: 1e15,          // больше этого честно не набрать
  items: 200000,       // предметов в коллекции (защита от мусора; честно столько не набрать)
  heroLevel: CONFIG.maxLevel,
  arena: 100,
  mmr: 5000,
  bytes: 2.5e6         // ~2.5 МБ — больше в облако не отправляем
};
const PATH_RE = /^[A-Za-z0-9_\-\/.]{1,200}$/;
function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
function num(v, lo, hi, def) { v = +v; if (!isFinite(v)) return def; return Math.min(hi, Math.max(lo, v)); }

// Проверяет и чинит сохранение. Возвращает { ok, st, fixes:[...], fatal }
// ok=false — сейв настолько сломан, что брать его нельзя.
function validateSave(raw) {
  const fixes = [];
  if (!isObj(raw)) return { ok: false, fatal: 'не объект', fixes };
  let st;
  try { st = JSON.parse(JSON.stringify(raw)); } catch (e) { return { ok: false, fatal: 'не читается', fixes }; }
  if (!isObj(st.heroes) && !Array.isArray(st.items)) return { ok: false, fatal: 'нет героев и предметов', fixes };
  if (!isObj(st.heroes)) { st.heroes = {}; fixes.push('heroes'); }
  if (!Array.isArray(st.items)) { st.items = []; fixes.push('items'); }

  // самоцветы
  const g = num(st.gems, 0, SAVE_LIMITS.gems, NaN);
  if (!isFinite(g)) { st.gems = CONFIG.startGems; fixes.push('gems'); }
  else if (g !== st.gems) { st.gems = Math.floor(g); fixes.push('gems'); }

  // герои
  Object.keys(st.heroes).forEach(id => {
    if (!HERO_BY_ID[id]) { delete st.heroes[id]; fixes.push('hero ' + id); return; }
    const h = st.heroes[id];
    if (!isObj(h)) { st.heroes[id] = { level: 1, bonus: 0 }; fixes.push('hero ' + id); return; }
    const L = Math.floor(num(h.level, 1, SAVE_LIMITS.heroLevel, 1)); if (L !== h.level) { h.level = L; fixes.push('lvl ' + id); }
    const B = num(h.bonus, 0, 1e9, 0); if (B !== h.bonus) { h.bonus = B; fixes.push('bonus ' + id); }
    if (h.talents != null && !isObj(h.talents)) { delete h.talents; fixes.push('talents ' + id); }
  });

  // предметы: битые выбрасываем, остальное не трогаем
  if (st.items.length > SAVE_LIMITS.items) { st.items.length = SAVE_LIMITS.items; fixes.push('items>max'); }
  const seen = new Set();
  st.items = st.items.filter(it => {
    const bad = !isObj(it) || !RARITIES.includes(it.rarity) || !HERO_BY_ID[it.heroId] ||
      typeof it.name !== 'string' || it.name.length > 120 || !(it.uid > 0) || seen.has(it.uid) ||
      (it.path != null && (typeof it.path !== 'string' || !PATH_RE.test(it.path)));
    if (bad) { fixes.push('item'); return false; }
    seen.add(it.uid); return true;
  });
  const maxUid = st.items.reduce((m, x) => Math.max(m, x.uid), 0);
  if (!(st.uid > maxUid)) { st.uid = maxUid + 1; fixes.push('uid'); }

  // снаряжение: ссылки только на существующие предметы
  if (!isObj(st.loadout)) { st.loadout = {}; if (raw.loadout != null) fixes.push('loadout'); }
  Object.keys(st.loadout).forEach(hid => {
    const l = st.loadout[hid];
    if (!isObj(l) || !HERO_BY_ID[hid]) { delete st.loadout[hid]; fixes.push('loadout'); return; }
    Object.keys(l).forEach(sl => { if (!seen.has(l[sl])) { delete l[sl]; fixes.push('loadout'); } });
  });

  // арена / pvp
  if (!isObj(st.arena)) { st.arena = { cleared: 0, replays: 0, wins: 0, losses: 0 }; fixes.push('arena'); }
  const c = Math.floor(num(st.arena.cleared, 0, SAVE_LIMITS.arena, 0)); if (c !== st.arena.cleared) { st.arena.cleared = c; fixes.push('arena'); }
  if (st.pvp != null) {
    if (!isObj(st.pvp)) { delete st.pvp; fixes.push('pvp'); }
    else { const m = Math.round(num(st.pvp.mmr, 0, SAVE_LIMITS.mmr, 1000)); if (m !== st.pvp.mmr) { st.pvp.mmr = m; fixes.push('mmr'); } }
  }
  ['stats', 'ach', 'daily', 'shop', 'cons', 'useCons', 'gameDay', 'gameBest', 'roshan', 'cloud'].forEach(k => {
    if (st[k] != null && !isObj(st[k])) { delete st[k]; fixes.push(k); }
  });
  if (st.shop && (!Array.isArray(st.shop.owned) || !Array.isArray(st.shop.slots))) { delete st.shop; fixes.push('shop'); }
  if (st.invBest != null && !(st.invBest > 0 && st.invBest < 1e6)) { st.invBest = null; fixes.push('invBest'); }
  if (st.mainHero != null && !HERO_BY_ID[st.mainHero]) { st.mainHero = null; fixes.push('mainHero'); }
  if (st.avatar != null && !HERO_BY_ID[st.avatar]) { st.avatar = 'invoker'; fixes.push('avatar'); }
  if (st.powerHist != null && !Array.isArray(st.powerHist)) { st.powerHist = []; fixes.push('powerHist'); }
  return { ok: true, st, fixes };
}
// для локальной загрузки: чиним молча, ломаный — новый сейв, но старый сохраняем в резерв
function loadSafe(k) {
  const raw = lsGet(saveKey(k), null);
  if (raw == null) return freshState();
  const r = validateSave(raw);
  if (!r.ok) { lsSet(saveKey(k) + '_broken_' + Date.now(), raw); console.warn('save broken:', r.fatal); return freshState(); }
  if (r.fixes.length) console.warn('save fixed:', r.fixes.slice(0, 20));
  return r.st;
}

// ---------- серверное время ----------
// Пока есть облако — время берётся с сервера Firebase ({".sv":"timestamp"}).
// Без облака (офлайн) — время телефона, но «назад во времени» прогресс не откатывается.
let SRV_OFF = lsGet('d2m_srvoff', 0) || 0;   // разница «сервер − телефон», мс
let TIME_OK = false;                           // в этой сессии время сверено с сервером
function nowMs() { return Date.now() + SRV_OFF; }
const DAY_TZ = 3;                              // сутки по Москве (UTC+3) — у всех одинаковые
function dayStrOf(ms) { const d = new Date(ms + DAY_TZ * 3600e3); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); }
