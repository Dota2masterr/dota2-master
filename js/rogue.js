// ================= «ПУТЬ ДРЕВНЕГО» — РОГАЛИК =================
// Забег: 3 акта × (5 рядов узлов + босс). Пошаговый бой с очередью по инициативе и намерениями врагов.
// Состояние — S.rogue (поля добавляет migrateRogue). Данные — js/rogue-data.js.
HAPTIC.rhit = [12]; HAPTIC.rwin = [30, 30, 70];

function rogueDefaults() {
  return { run: null, shards: 0, unlocked: [], starts: ['branches', 'circlet'], abyss: {}, wins: 0, runs: 0, stats: { hero: {}, item: {} }, builds: [], day: { d: '', n: 0 }, daily: '', tut: false, best: 0 };
}
function migrateRogue(st) {
  const d = rogueDefaults();
  if (!st.rogue || typeof st.rogue !== 'object') st.rogue = d;
  for (const k in d) if (st.rogue[k] == null) st.rogue[k] = d[k];
  // 2.4.2: облако теряет пустые {} и [] — возвращаем
  const R = st.rogue, A = v => Array.isArray(v) ? v : v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(i => v[i]) : [];
  ['unlocked', 'starts', 'builds'].forEach(k => { R[k] = A(R[k]); });
  if (!R.stats || typeof R.stats !== 'object') R.stats = { hero: {}, item: {} }; if (!R.stats.hero) R.stats.hero = {}; if (!R.stats.item) R.stats.item = {};
  if (!R.abyss || typeof R.abyss !== 'object') R.abyss = {};
  const run = R.run;
  if (run && typeof run === 'object') {
    run.items = A(run.items); run.skillLv = [0, 1, 2, 3].map(i => (run.skillLv && run.skillLv[i]) || 0);
    if (!run.bonus) run.bonus = { atk: 0, hp: 0 }; if (run.log == null) run.log = '';
    if (run.map) { run.map = A(run.map).map(row => A(row).map(n => n ? Object.assign(n, { next: A(n.next) }) : n)); }
  }
}
function RS() { if (!S.rogue) migrateRogue(S); return S.rogue; }
function rgPool() { return ROGUE_POOL0.concat(RS().unlocked).filter(id => HERO_BY_ID[id]); }
function rgHash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rgItemName(id) { return (RG_ITEMS[id] || RG_COMP[id] || RG_NEUTRAL[id] || [id])[0]; }
function rgItemIcon(id) { return [ITEM_ICON(id), CSM + 'items/' + id + '_png.png']; }
function rgLog(r, s) { if (r && r.log.length < ROGUE.dailyLogMax) r.log += s + ';'; }

// ---------- стартовый бонус от основной игры (не больше +12%) ----------
function rogueMetaBonus(id) {
  const h = S.heroes[id] || { level: 1 };
  const lv = 0.06 * Math.min(1, (h.level - 1) / 49);
  const eq = 0.03 * Math.min(1, (typeof setCount === 'function' ? setCount(id) : 0) / 3);
  const tal = 0.03 * Math.min(1, Object.keys(h.talents || {}).length / 4);
  return Math.min(ROGUE.metaCap, lv + eq + tal);
}

// ---------- карта акта ----------
function rgGenMap(seed, act, abyss) {
  const r = seeded(seed + act * 1013);
  const rows = [];
  const eliteW = 0.14 + (abyss >= 3 ? 0.08 : 0);
  let shops = 0;
  for (let i = 0; i < ROGUE.rows; i++) {
    const k = 2 + (r() < 0.55 ? 1 : 0);
    const row = [];
    for (let j = 0; j < k; j++) {
      let t;
      if (i === 0) t = 'fight';
      else if (i === ROGUE.rows - 1) t = j === 0 ? 'rest' : r() < 0.5 ? 'shop' : 'rest';
      else { const x = r(); t = x < 0.42 ? 'fight' : x < 0.42 + eliteW && i >= 2 ? 'elite' : x < 0.7 ? 'event' : x < 0.85 ? 'shop' : 'chest'; }
      if (t === 'shop') shops++;
      row.push({ t, next: [] });
    }
    rows.push(row);
  }
  // 12–15 узлов: если вышло мало — добавляем узел в средний ряд
  while (rows.reduce((x, row) => x + row.length, 0) < 11) { const i = 1 + Math.floor(r() * 3); if (rows[i].length < 3) rows[i].push({ t: r() < 0.5 ? 'fight' : 'event', next: [] }); }
  if (!rows.some(row => row.some(n => n.t === 'shop'))) rows[2][0].t = 'shop';
  rows.push([{ t: 'boss', next: [] }]);
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i], b = rows[i + 1];
    a.forEach((n, j) => {
      const c = Math.round(j * (b.length - 1) / Math.max(1, a.length - 1));
      n.next = [c];
      if (r() < 0.5 && b.length > 1) n.next.push(Math.min(b.length - 1, Math.max(0, c + (r() < 0.5 ? 1 : -1))));
      n.next = [...new Set(n.next)].sort();
    });
    b.forEach((n, j) => { if (!a.some(x => x.next.includes(j))) a[Math.min(a.length - 1, Math.round(j * (a.length - 1) / Math.max(1, b.length - 1)))].next.push(j); });
  }
  return rows;
}

// ---------- характеристики героя в забеге ----------
function rgStats(run) {
  const H = ROGUE.hero, hero = HERO_BY_ID[run.hero], A = ROGUE.attr[hero.attr] || {};
  const st = { hp: H.hp + (A.hp || 0), atk: H.atk + (A.atk || 0), init: H.init + (A.init || 0), armor: 2, crit: 0.1 + (A.crit || 0), critMul: H.critMul, ls: 0, eva: 0, amp: A.amp || 0, manaRegen: H.manaRegen + (A.manaRegen || 0), manaStart: H.manaStart, hpRegen: 0, hpRegenPct: 0, mres: 0, pierce: 0, sres: 0, cdr: 0, ult: 0, bash: 0, cleave: 0, burn: 0, chain: 0, block: 0, reflect: 0, slowHit: 0, trueHit: 0, ctrl: 0, hpPct: 0, goldBonus: 0 };
  const add = m => { for (const k in m) st[k] = (st[k] || 0) + m[k]; };
  // пассивные навыки героя
  getSkills(run.hero).filter(s => s.kind === 'passive').forEach(s => {
    if (s.extra === 'atk') st.atk *= 1 + s.pow; else if (s.extra === 'lifesteal') st.ls += s.pow; else if (s.extra === 'armor') st.armor += Math.round(s.pow * 30);
    else if (s.extra === 'evasion') st.eva += s.pow; else if (s.extra === 'crit') st.crit += s.pow; else if (s.extra === 'bash') st.bash += s.pow; else if (s.extra === 'mana') st.manaRegen += 5;
  });
  const items = run.items.slice(); if (run.neutral) items.push(run.neutral);
  items.forEach(id => {
    if (RG_COMP[id]) add(RG_COMP[id][2]);
    else if (RG_ITEMS[id]) { RG_ITEMS[id][1].forEach(c => add(RG_COMP[c][2])); add(RG_ITEMS[id][3]); }
    else if (RG_NEUTRAL[id]) add(RG_NEUTRAL[id][1]);
  });
  const paths = rgActivePaths(run); paths.forEach(p => add(RG_PATHS[p].m));
  st.atk += run.bonus.atk || 0; st.hp += run.bonus.hp || 0;
  const meta = 1 + (run.meta || 0);
  st.hp = Math.round(st.hp * (1 + st.hpPct) * meta); st.atk = Math.round(st.atk * meta);
  st.eva = Math.min(0.5, st.eva); st.crit = Math.min(0.75, st.crit); st.sres = Math.min(0.6, st.sres);
  return st;
}
function rgActivePaths(run) {
  const cnt = {}; run.items.forEach(id => { if (RG_ITEMS[id]) RG_ITEMS[id][4].forEach(p => cnt[p] = (cnt[p] || 0) + 1); });
  return Object.keys(cnt).filter(p => cnt[p] >= 3);
}
function rgPathCounts(run) { const cnt = {}; run.items.forEach(id => { if (RG_ITEMS[id]) RG_ITEMS[id][4].forEach(p => cnt[p] = (cnt[p] || 0) + 1); }); return cnt; }
function rgBuildable(run) {
  return Object.keys(RG_ITEMS).filter(id => { const need = RG_ITEMS[id][1].slice(); const have = run.items.slice(); return need.every(c => { const i = have.indexOf(c); if (i < 0) return false; have.splice(i, 1); return true; }); });
}
function rgPrice(run, id) { const base = RG_COMP[id] ? RG_COMP[id][1] : 100; let p = 0; for (let i = 1; i <= run.abyss; i++) p += RG_ABYSS[i].price || 0; return Math.round(base * (1 + p)); }
function rgAbyssSum(lv, key) { let s = 0; for (let i = 1; i <= lv; i++) s += RG_ABYSS[i][key] || 0; return s; }

// ---------- начало забега ----------
function rogueNewRun(hero, abyss, daily, start) {
  const R = RS();
  const seed = daily ? rgHash('daily-' + todayStr()) : (Math.floor(Math.random() * 1e9) >>> 0);
  const run = { v: 1, seed, daily: !!daily, hero, abyss: daily ? 0 : abyss, act: 0, row: -1, col: -1, map: null, hp: 0, gold: ROGUE.gold.start, items: [], neutral: null, skillLv: [0, 0, 0, 0], bonus: { atk: 0, hp: 0 }, nodes: 0, time: 0, tick: nowMs(), state: 'map', log: '', meta: rogueMetaBonus(hero), pending: null };
  if (start && R.starts.includes(start) && RG_COMP[start]) run.items.push(start);
  run.map = rgGenMap(seed, 0, run.abyss);
  const st = rgStats(run); run.hp = Math.round(st.hp * (1 - rgAbyssSum(run.abyss, 'startHp')));
  rgLog(run, 'h' + hero + 'a' + run.abyss);
  R.run = run; R.runs++;
  if (daily) R.daily = todayStr();
  save();
  rogueShowLine('🗣 ' + HERO_BY_ID[hero].name, RG_LINES.intro[heroRole(hero)] || RG_LINES.intro.carry, () => renderRogue());
}
function rogueTime(run) { const n = nowMs(); run.time += Math.min(60000, Math.max(0, n - (run.tick || n))); run.tick = n; }

// ---------- выбор узла ----------
function rogueGo(row, col) {
  const R = RS(), run = R.run; if (!run || run.state !== 'map') return;
  const ok = run.row < 0 ? row === 0 : row === run.row + 1 && run.map[run.row][run.col].next.includes(col);
  if (!ok || !run.map[row] || !run.map[row][col]) return;
  run.row = row; run.col = col; run.nodes++;
  rgLog(run, 'n' + row + col);
  rogueTime(run);
  const node = run.map[row][col];
  const r = seeded(run.seed + run.act * 97 + row * 13 + col);
  if (node.t === 'fight' || node.t === 'elite' || node.t === 'boss') return rogueStartNodeFight(node.t, r);
  if (node.t === 'shop') { run.state = 'shop'; run.pending = { shop: rgShopStock(run, r) }; }
  else if (node.t === 'rest') run.state = 'rest';
  else if (node.t === 'chest') { const g = Math.round((ROGUE.gold.chest[0] + r() * (ROGUE.gold.chest[1] - ROGUE.gold.chest[0])) * (1 + rgStats(run).goldBonus)); run.gold += g; run.state = 'reward'; run.pending = { title: 'Сундук: +' + g + ' 💰', choices: rgRewardChoices(run, r, 'chest') }; }
  else if (node.t === 'event') { run.state = 'event'; run.pending = { ev: Math.floor(r() * RG_EVENTS.length) }; }
  save(); renderRogue();
}
function rogueStartNodeFight(type, r) {
  const run = RS().run, act = RG_ACT[run.act];
  const elite = type === 'elite';
  const group = type === 'boss' ? [act.boss] : (elite ? act.elites : act.fights)[Math.floor(r() * (elite ? act.elites : act.fights).length)];
  run.state = 'fight'; run.pending = { type, group, hp0: run.hp };
  save();
  if (type === 'boss') { const L = RG_LINES.boss[act.boss]; rogueShowLine('⚠ ' + RG_ENEMY[act.boss].n, L[0] + '\n\n' + L[1], () => rogueFight()); }
  else rogueFight();
}

// ================= ПОШАГОВЫЙ БОЙ =================
let RF = null;   // текущий бой
function rgMkEnemy(key, run, type) {
  const d = RG_ENEMY[key], ab = run ? run.abyss : 0, act = run ? run.act : 0, row = run ? Math.max(0, run.row) : 0;
  const mul = ROGUE.actMul[act] * (d.boss || type === 'summon' ? 1 : 1 + ROGUE.rowMul * row) * (type === 'elite' ? 1.12 : 1);
  const hpM = mul * (1 + rgAbyssSum(ab, 'hp')) * (d.boss ? 1 + rgAbyssSum(ab, 'boss') : 1);
  const atkM = mul * (1 + rgAbyssSum(ab, 'atk'));
  const hp = Math.round(d.hp * hpM);
  return { key, n: d.n, ic: d.ic, img: d.img, boss: d.boss, hp, max: hp, atk: Math.round(d.atk * atkM), init: d.init + rgAbyssSum(ab, 'init'), pat: d.p.slice(), pi: 0, armor: d.boss ? 4 : d.elite ? 3 : 1, mres: 0,
    st: { stun: 0, silence: 0, slow: 0, poison: [], shield: 0, buff: 0, amp: 0, ampT: 0 }, alive: true, aegis: d.boss === 'roshan', phase: 0 };
}
function rgHeroUnit(run) {
  const s = rgStats(run);
  const skills = getSkills(run.hero).filter(x => x.kind !== 'passive');
  return { hero: true, id: run.hero, n: HERO_BY_ID[run.hero].name, hp: Math.min(run.hp, s.hp), max: s.hp, atk: s.atk, init: s.init, s, mana: Math.min(ROGUE.hero.mana, s.manaStart), skills, cd: {}, icd: {}, alive: true,
    st: { stun: 0, silence: 0, slow: 0, poison: [], shield: 0, buff: 0, buffT: 0, dodge: 0, bkb: 0, amp: 0, ampT: 0, pet: null, illu: 0 } };
}
// opts: { test, onEnd }
function rogueFight(opts) {
  opts = opts || {};
  const R = RS(), run = opts.test ? opts.run : R.run;
  const p = opts.test ? { type: 'fight', group: opts.group } : run.pending;
  const r = seeded((run.seed || 1) + run.act * 31 + run.row * 7 + run.nodes * 101);
  RF = { run, test: !!opts.test, type: p.type, r, hero: rgHeroUnit(run), foes: p.group.map(k => rgMkEnemy(k, run, p.type)), round: 0, order: [], turn: -1, wait: null, target: 0, sel: null, auto: !!R.autoFight, mult: R.rgMult || 1, over: false, onEnd: opts.onEnd, log: [] };
  RF.foes.forEach((f, i) => { f.pi = Math.floor(r() * f.pat.length); });
  renderRogueFight();
  rgTip(0);
  rgLoop();
}
const rgSleep = ms => new Promise(res => setTimeout(res, SETTINGS.noanim ? 0 : ms / ((RF && RF.mult) || 1)));
function rgAlive() { return RF.foes.filter(f => f.alive); }
function rgIntent(f) { return f.pat[f.pi % f.pat.length]; }
function rgIntentText(f) {
  const t = rgIntent(f), I = RG_INTENT[t];
  const est = t === 'atk' ? f.atk : t === 'heavy' ? f.atk * 1.8 : t === 'aoe' ? f.atk * 1.3 : t === 'stun' || t === 'silence' ? f.atk * 0.6 : 0;
  return { i: I.i, n: I.n, c: I.c, v: est ? Math.round(est * (1 + f.st.buff * 0.3) * (f.st.slow > 0 ? 0.8 : 1)) : '' };
}
async function rgLoop() {
  const F = RF;
  while (RF === F && !F.over) {
    F.round++;
    if (F.round > 30) { rgAlive().forEach(f => { f.atk = Math.round(f.atk * 1.25); }); if (F.round === 31) rgLogLine('🔥 Бой затянулся: враги звереют с каждым ходом', '#ff8a3a'); }
    const units = [F.hero].concat(rgAlive());
    F.order = units.slice().sort((a, b) => (b.init * (b.st.slow > 0 ? 0.7 : 1)) - (a.init * (a.st.slow > 0 ? 0.7 : 1)) || (a.hero ? -1 : 1));
    for (let i = 0; i < F.order.length && !F.over && RF === F; i++) {
      const u = F.order[i]; F.turn = i;
      if (!u.alive) continue;
      rgRenderQueue();
      if (rgTickStart(u)) { rgCheckEnd(); continue; }
      if (u.st.stun > 0) { u.st.stun--; rgFloat(u, '💫', '#7ad3ff'); rgLogLine((u.hero ? u.n : u.n) + ' оглушён и пропускает ход'); await rgSleep(450); rgEndTurn(u); continue; }
      if (u.hero) await rgHeroTurn(); else await rgEnemyTurn(u);
      rgEndTurn(u);
      rgCheckEnd();
      await rgSleep(220);
    }
  }
}
function rgTickStart(u) {
  // яд и регенерация в начале хода
  let died = false;
  if (u.st.poison.length) {
    let d = 0; u.st.poison.forEach(p => { d += p.d; p.t--; }); u.st.poison = u.st.poison.filter(p => p.t > 0);
    rgDamage(u, d, { pure: true, tag: '☠' }); if (!u.alive) died = true;
  }
  if (u.hero && u.alive) {
    const s = u.s; const heal = s.hpRegen + u.max * s.hpRegenPct; if (heal > 0) rgHeal(u, heal, true);
    u.mana = Math.min(ROGUE.hero.mana, u.mana + s.manaRegen);
    if (s.burn) rgAlive().forEach(f => rgDamage(f, s.burn * (1 + s.amp), { magic: true, tag: '🔥' }));
  }
  rgRenderUnits();
  return died;
}
function rgEndTurn(u) {
  ['silence', 'slow', 'bkb', 'dodge', 'ampT', 'buffT', 'illu'].forEach(k => { if (u.st[k] > 0) u.st[k]--; });
  if (u.st.ampT <= 0) u.st.amp = 0;
  if (u.hero) { for (const k in u.cd) if (u.cd[k] > 0) u.cd[k]--; for (const k in u.icd) if (u.icd[k] > 0) u.icd[k]--; if (u.st.buffT <= 0) u.st.buff = 0; }
  rgRenderUnits();
}
function rgCheckEnd() {
  if (RF.over) return;
  if (!RF.hero.alive) return rgFinish(false);
  if (!rgAlive().length) return rgFinish(true);
}

// ---------- урон и лечение ----------
function rgDamage(t, raw, o) {
  o = o || {};
  if (!t || !t.alive || !(raw > 0)) return 0;
  let d = raw;
  if (!o.pure) {
    const arm = o.magic ? 0 : Math.max(-10, t.armor != null ? t.armor - (o.pierce || 0) : (t.s ? t.s.armor : 0) - (o.pierce || 0));
    d *= 1 - (0.06 * arm) / (1 + 0.06 * Math.abs(arm));
    if (o.magic && t.s) d *= 1 - t.s.mres;
  }
  if (t.st.amp) d *= 1 + t.st.amp;
  if (t.boss === 'treant' && RF.foes.some(f => f.alive && f.key === 'treant_s')) d *= 0.7;
  if (t.hero && t.s.block && !o.pure) d = Math.max(d * 0.3, d - t.s.block);
  d = Math.round(d);
  if (t.st.shield > 0) { const a = Math.min(t.st.shield, d); t.st.shield -= a; d -= a; if (a) rgFloat(t, '🛡' + a, '#ffd36a'); }
  t.hp = Math.max(0, t.hp - d);
  if (d) rgFloat(t, (o.tag || '') + '-' + d, o.crit ? '#ffd36a' : t.hero ? '#ff7a6a' : '#fff', o.crit);
  if (t.hero && d) { haptic('rhit'); if (t.s.reflect && o.src) rgDamage(o.src, d * t.s.reflect, { pure: true, tag: '↩' }); }
  if (t.hp <= 0) rgDeath(t);
  return d;
}
function rgHeal(t, v, quiet) { if (!t || !t.alive) return; const b = t.hp; t.hp = Math.min(t.max, t.hp + Math.round(v)); if (!quiet || t.hp - b > 5) rgFloat(t, '+' + (t.hp - b), '#6cff7a'); }
function rgDeath(t) {
  if (t.aegis) {
    // Рошан: Aegis — воскресает с полным здоровьем, снимает все дебафы и звереет
    t.aegis = false; t.hp = t.max; t.st.stun = 0; t.st.silence = 0; t.st.slow = 0; t.st.poison = []; t.st.amp = 0; t.st.ampT = 0; t.atk = Math.round(t.atk * 1.2);
    rgLogLine('🛡 Aegis! Рошан воскресает, сбрасывает все дебафы и звереет', '#ffd36a'); rgFloat(t, 'AEGIS', '#ffd36a', true); return;
  }
  t.alive = false; t.hp = 0;
  rgLogLine('☠ ' + t.n + (t.hero ? ' пал' : ' повержен'), t.hero ? 'var(--danger)' : 'var(--ok)');
}
function rgCtrl(t, kind, dur) {
  if (!t || !t.alive) return false;
  if (t.hero) { if (t.st.bkb > 0) { rgFloat(t, 'BKB', '#ffd36a'); return false; } if (RF.r() < t.s.sres) { rgFloat(t, 'устоял', '#aaa'); return false; } }
  else dur += RF.hero.s.ctrl || 0;
  if (t.boss && kind === 'stun') dur = Math.min(dur, 1);
  t.st[kind] = Math.max(t.st[kind], dur);
  return true;
}

// ---------- ход героя ----------
function rgHeroTurn() {
  const h = RF.hero;
  rgRenderActions(true);
  if (RF.auto) return rgSleep(380).then(() => rgDoAction(rgAutoPick()));
  rgTip(1);
  return new Promise(res => { RF.wait = act => { RF.wait = null; res(rgDoAction(act)); }; });
}
function rgSkillCd(s, lv) { const base = s.ult ? ROGUE.hero.ultCd : s.cd; return Math.max(1, base - (lv >= 2 ? 1 : 0) - (RF ? RF.hero.s.cdr : 0)); }
function rgSkillMana(s) { return s.ult ? ROGUE.hero.ultMana : s.mana; }
function rgCanUse(i) {
  const h = RF.hero, s = h.skills[i]; if (!s) return false;
  return !(h.cd[s.key] > 0) && h.mana >= rgSkillMana(s) && !(h.st.silence > 0);
}
function rgItemActives(run) { return run.items.filter(id => RG_ITEMS[id] && RG_ITEMS[id][5]); }
function rgCanItem(id) { return RG_ITEMS[id] && RG_ITEMS[id][5] && !(RF.hero.icd[id] > 0); }
// нажатие кнопки действия; для навыков по врагу — затем выбор цели (или текущая цель)
function rgAct(kind, i) {
  if (!RF || !RF.wait) return;
  if (kind === 'skill' && !rgCanUse(i)) return;
  if (kind === 'item') { const id = rgItemActives(RF.run)[i]; if (!id || !rgCanItem(id)) return; return RF.wait({ k: 'item', id, t: RF.target }); }
  RF.wait({ k: kind, i, t: RF.target });
}
function rgSetTarget(i) { if (!RF) return; if (RF.foes[i] && RF.foes[i].alive) { RF.target = i; rgRenderUnits(); } }
function rgTargetFoe(t) { let f = RF.foes[t]; if (!f || !f.alive) { f = rgAlive()[0]; RF.target = RF.foes.indexOf(f); } return f; }
function rgAutoPick() {
  const h = RF.hero, foes = rgAlive();
  const danger = foes.some(f => ['heavy', 'stun', 'aoe', 'silence'].includes(rgIntent(f)));
  let tgt = foes.slice().sort((a, b) => a.hp - b.hp)[0];
  const t = RF.foes.indexOf(tgt);
  for (const id of rgItemActives(RF.run)) {
    if (!rgCanItem(id)) continue; const a = RG_ITEMS[id][5].a;
    if ((a === 'heal' && h.hp < h.max * 0.45) || (a === 'bkb' && foes.some(f => ['stun', 'silence'].includes(rgIntent(f)))) || (a === 'dodge' && danger) || ['illusions', 'aoe', 'hex', 'silence'].includes(a) || (a === 'refresh' && h.skills.some(s => h.cd[s.key] > 1))) return { k: 'item', id, t };
  }
  const usable = h.skills.map((s, i) => [s, i]).filter(([s, i]) => rgCanUse(i));
  const by = k => usable.find(([s]) => s.kind === k);
  const ult = usable.find(([s]) => s.ult);
  if (ult && (tgt.hp > tgt.max * 0.25 || tgt.boss || ult[0].kind === 'execute')) return { k: 'skill', i: ult[1], t };
  if (h.hp < h.max * 0.45 && by('heal')) return { k: 'skill', i: by('heal')[1], t };
  if (h.hp < h.max * 0.7 && by('shield')) return { k: 'skill', i: by('shield')[1], t };
  if (danger) { const c = by('stun') || by('silence') || by('slow'); if (c) return { k: 'skill', i: c[1], t: RF.foes.indexOf(foes.find(f => ['heavy', 'stun', 'aoe', 'silence'].includes(rgIntent(f)))) }; }
  const dmg = usable.find(([s]) => !['heal', 'shield'].includes(s.kind) && !s.ult);
  if (dmg) return { k: 'skill', i: dmg[1], t };
  return { k: 'atk', t };
}
async function rgDoAction(a) {
  const h = RF.hero, s = h.s, run = RF.run;
  rgRenderActions(false);
  rgLog(run, a.k === 'atk' ? 'a' + a.t : a.k === 'skill' ? 's' + a.i + 't' + a.t : 'i' + a.id);
  if (a.k === 'atk') {
    const f = rgTargetFoe(a.t);
    rgLunge(h);
    await rgSleep(160);
    const hits = rgAttack(f, 1);
    if (h.st.illu > 0) rgAttack(f, run.items.includes('manta') ? 0.4 : 0.3, true);
    if (h.st.pet) { rgDamage(rgTargetFoe(a.t), h.st.pet.d * (1 + s.amp), { magic: true, tag: '👥' }); if (--h.st.pet.t <= 0) h.st.pet = null; }
    return hits;
  }
  if (a.k === 'item') return rgUseItem(a.id, a.t);
  const sk = h.skills[a.i], lv = run.skillLv[a.i] || 0;
  h.mana -= rgSkillMana(sk); h.cd[sk.key] = rgSkillCd(sk, lv);
  const f = rgTargetFoe(a.t);
  rgPopSkill(h, sk);
  rgLogLine('✨ ' + h.n + ': ' + sk.name, '#9ad8ff');
  await rgSleep(260);
  rgSkillEffect(sk, lv, f);
  if (h.st.pet && sk.kind !== 'summon') { const f2 = rgTargetFoe(a.t); if (f2) rgDamage(f2, h.st.pet.d * (1 + s.amp), { magic: true, tag: '👥' }); if (--h.st.pet.t <= 0) h.st.pet = null; }
}
function rgAttack(f, mul, illu) {
  const h = RF.hero, s = h.s;
  if (!f || !f.alive) return;
  const crit = RF.r() < s.crit;
  const atk = h.atk * (1 + h.st.buff) * (h.st.slow > 0 ? 0.8 : 1) * mul * (0.9 + RF.r() * 0.2);
  const d = rgDamage(f, atk * (crit ? s.critMul : 1), { pierce: s.pierce, crit, src: h, tag: illu ? '👤' : crit ? '💥' : '' });
  if (s.ls && d) rgHeal(h, d * s.ls, true);
  if (illu) return;
  if (s.cleave) rgAlive().filter(x => x !== f).forEach(x => rgDamage(x, atk * s.cleave, { pierce: s.pierce }));
  if (s.chain && RF.r() < s.chain) { rgLogLine('⚡ Молния Mjollnir!', '#9ad8ff'); rgAlive().forEach(x => rgDamage(x, 60 * ROGUE.actMul[RF.run.act || 0] * (1 + s.amp), { magic: true, tag: '⚡' })); }
  if (s.bash && f.alive && RF.r() < s.bash && rgCtrl(f, 'stun', 1)) rgLogLine('💫 ' + f.n + ' оглушён ударом', '#7ad3ff');
  if (s.slowHit && f.alive) f.st.slow = Math.max(f.st.slow, 1);
}
function rgSkillEffect(sk, lv, f) {
  const h = RF.hero, s = h.s;
  const pw = sk.pow * (1 + ROGUE.skillUpPow * lv);
  const amp = 1 + s.amp;
  const base = h.atk * pw * amp * (sk.ult ? 1 + s.ult : 1);
  const all = rgAlive();
  if (sk.ult) {
    const type = ultOf(h.id).type; const M = ULT_MULT[type] || 2;
    if (type === 'aoe') { all.forEach(x => rgDamage(x, h.atk * M * 0.75 * amp * (1 + s.ult), { magic: true, tag: '💥' })); rgShake(); return; }
    if (type === 'heal') { rgHeal(h, h.max * 0.4 * (1 + s.ult)); return; }
    if (type === 'shield') { h.st.shield += Math.round(h.max * 0.45 * (1 + s.ult)); rgFloat(h, '🛡', '#ffd36a'); return; }
    if (type === 'buff') { h.st.buff = 0.5 * (1 + s.ult); h.st.buffT = 4; rgFloat(h, '⚡', '#ffb84a'); return; }
    if (type === 'execute') { if (f.hp < f.max * 0.35 && !f.boss) { rgDamage(f, f.hp, { pure: true, tag: '☠' }); return; } rgDamage(f, h.atk * (f.boss && f.hp < f.max * 0.35 ? 3.5 : 2) * amp * (1 + s.ult), { magic: true }); return; }
    rgDamage(f, h.atk * M * amp * (1 + s.ult), { magic: type !== 'crit', crit: type === 'crit', pierce: s.pierce });
    if (type === 'stun' && rgCtrl(f, 'stun', 2)) rgLogLine('💫 ' + f.n + ' оглушён', '#7ad3ff');
    rgShake(); return;
  }
  switch (sk.kind) {
    case 'dmg': rgDamage(f, base, { magic: true }); break;
    case 'aoe': all.forEach(x => rgDamage(x, base * 0.8, { magic: true })); break;
    case 'stun': rgDamage(f, base, { magic: true }); if (rgCtrl(f, 'stun', sk.dur)) rgLogLine('💫 ' + h.n + ' оглушил ' + f.n, '#7ad3ff'); break;
    case 'slow': rgDamage(f, base, { magic: true }); rgCtrl(f, 'slow', sk.dur + 1); rgLogLine('🐌 ' + h.n + ' замедлил ' + f.n, '#7ab8ff'); break;
    case 'silence': rgDamage(f, base, { magic: true }); if (rgCtrl(f, 'silence', sk.dur)) rgLogLine('🤐 Безмолвие на ' + f.n, '#c8a4ff'); break;
    case 'dot': f.st.poison.push({ d: Math.round(base), t: sk.dur }); rgFloat(f, '☠', '#7ad35a'); rgLogLine('☠ ' + f.n + ' отравлен', '#7ad35a'); break;
    case 'debuff': f.st.amp = pw - 1 + 0.1; f.st.ampT = sk.dur + 1; rgDamage(f, h.atk * 0.5 * amp, { magic: true }); rgLogLine('🔻 ' + f.n + ' получает больше урона', '#d07aff'); break;
    case 'heal': rgHeal(h, h.max * pw); break;
    case 'shield': h.st.shield += Math.round(h.max * pw); rgFloat(h, '🛡+' + Math.round(h.max * pw), '#ffd36a'); break;
    case 'buff': h.st.buff = pw - 1; h.st.buffT = sk.dur + 2; rgFloat(h, '⚡', '#ffb84a'); break;
    case 'summon': h.st.pet = { d: Math.round(h.atk * pw), t: sk.dur + 1 }; rgFloat(h, '👥', '#9ad8ff'); break;
    default: rgDamage(f, base, { magic: true });
  }
}
async function rgUseItem(id, t) {
  const h = RF.hero, a = RG_ITEMS[id][5];
  h.icd[id] = a.cd;
  rgLogLine('🎒 ' + RG_ITEMS[id][0], '#ffd36a');
  rgPopItem(h, id);
  await rgSleep(220);
  const f = rgTargetFoe(t);
  if (a.a === 'dodge') { h.st.dodge = 2; rgFloat(h, 'Blink', '#9ad8ff'); }
  else if (a.a === 'bkb') { h.st.bkb = a.dur + 1; h.st.stun = 0; h.st.silence = 0; rgFloat(h, 'BKB', '#ffd36a'); }
  else if (a.a === 'heal') rgHeal(h, h.max * a.pow);
  else if (a.a === 'refresh') { h.cd = {}; rgFloat(h, '♻', '#9ad8ff'); }
  else if (a.a === 'hex') { if (rgCtrl(f, 'stun', a.dur)) rgLogLine('🐑 ' + f.n + ' превращён в овцу', '#c8a4ff'); }
  else if (a.a === 'silence') { if (rgCtrl(f, 'silence', a.dur)) rgLogLine('🤐 ' + f.n + ' в безмолвии', '#c8a4ff'); rgDamage(f, h.atk * 0.8 * (1 + h.s.amp), { magic: true }); }
  else if (a.a === 'illusions') { h.st.illu = a.dur + 1; rgFloat(h, '👤👤', '#9ad8ff'); }
  else if (a.a === 'aoe') { rgAlive().forEach(x => { rgDamage(x, h.atk * a.pow * (1 + h.s.amp), { magic: true, tag: '❄' }); rgCtrl(x, 'slow', a.slow); }); }
}

// ---------- ход врага ----------
async function rgEnemyTurn(f) {
  const h = RF.hero;
  let t = rgIntent(f);
  if (f.st.silence > 0 && !['atk', 'heavy'].includes(t)) { t = 'atk'; rgFloat(f, '🤐', '#c8a4ff'); }
  rgLunge(f);
  await rgSleep(200);
  const atk = f.atk * (1 + f.st.buff * 0.3) * (f.st.slow > 0 ? 0.8 : 1) * (0.9 + RF.r() * 0.2);
  const dodge = () => { if (h.st.dodge > 0) { rgFloat(h, 'промах', '#aaa'); rgLogLine('💨 ' + f.n + ' промахнулся'); return true; } if (RF.r() < h.s.eva) { rgFloat(h, 'уклон', '#aaa'); return true; } return false; };
  const hit = m => { if (!dodge()) rgDamage(h, atk * m, { src: f }); };
  switch (t) {
    case 'atk': hit(1); break;
    case 'heavy': rgLogLine('🗡 ' + f.n + ': сильный удар', '#ff8a6a'); hit(1.8); break;
    case 'aoe': rgLogLine('💥 ' + f.n + ' бьёт по площади', '#ff8a6a'); rgDamage(h, atk * 1.3, { magic: true, src: f }); h.st.illu = 0; rgShake(); break;
    case 'stun': if (!dodge()) { rgDamage(h, atk * 0.6, { src: f }); if (rgCtrl(h, 'stun', 1)) rgLogLine('💫 ' + f.n + ' оглушил ' + h.n, '#ff9a8a'); } break;
    case 'silence': rgDamage(h, atk * 0.6, { magic: true, src: f }); if (rgCtrl(h, 'silence', 2)) rgLogLine('🤐 ' + f.n + ' наложил безмолвие', '#ff9a8a'); break;
    case 'poison': h.st.poison.push({ d: Math.round(f.atk * 0.5), t: 3 }); rgFloat(h, '☠', '#7ad35a'); rgLogLine('☠ ' + f.n + ' отравил тебя', '#ff9a8a'); break;
    case 'buff':
      f.st.buff = Math.min(2, f.st.buff + 1); rgFloat(f, '⬆', '#ffb84a');
      if (f.boss === 'roshan') { f.st.poison = []; f.st.slow = 0; f.st.amp = 0; rgLogLine('🦍 Рошан ревёт и сбрасывает дебафы', '#ffb84a'); } else rgLogLine('⬆ ' + f.n + ' усиливается', '#ffb84a');
      break;
    case 'shield': f.st.shield += Math.round(f.max * 0.25); rgFloat(f, '🛡', '#ffd36a'); break;
    case 'heal': { const tg = rgAlive().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; rgHeal(tg, tg.max * 0.25); rgLogLine('💚 ' + f.n + ' лечит ' + tg.n, '#ff9a8a'); break; }
    case 'summon': {
      const kind = f.boss === 'treant' ? 'treant_s' : 'skeleton';
      if (rgAlive().length < 3) { const m = rgMkEnemy(kind, RF.run, 'summon'); m.pi = 0; RF.foes.push(m); }
      rgLogLine('👥 ' + f.n + ' призывает подмогу' + (f.boss === 'treant' ? ': пока тренты живы, древень получает −30% урона' : ''), '#ff9a8a');
      renderRogueFight(); break;
    }
  }
  f.pi++;
  // Древний Dire: фазы на 66% и 33% здоровья
  if (f.boss === 'ancient' && f.alive) {
    const ph = f.hp < f.max * 0.33 ? 2 : f.hp < f.max * 0.66 ? 1 : 0;
    if (ph > f.phase) {
      f.phase = ph; f.atk = Math.round(f.atk * 1.2); f.pi = 0;
      f.pat = ph === 1 ? ['aoe', 'heavy', 'stun', 'atk'] : ['heavy', 'aoe', 'silence', 'heavy', 'summon'];
      rgLogLine(ph === 1 ? '🏛 Древний во 2-й фазе: камень трескается, удары тяжелее' : '🏛 Последняя фаза! Древний зовёт скелетов и бьёт без жалости', '#ffb84a');
      rgShake();
    }
  }
  rgRenderUnits();
}

// ---------- конец боя ----------
async function rgFinish(win) {
  const fight = RF; if (!fight || fight.over) return;
  fight.over = true; fight.wait = null;
  const run = fight.run;
  await rgSleep(500);
  if (fight.test) { showModal(win ? '🏆' : '💀', win ? 'Победа' : 'Поражение', 'Тестовый бой окончен.', win ? 'ok' : 'bad'); if (RF === fight) RF = null; renderRogue(); return; }
  run.hp = Math.max(0, fight.hero.hp);
  rogueTime(run);
  if (!win) { if (RF === fight) RF = null; return rogueEnd(false); }
  sfx('win'); haptic('rwin');
  RS().tut = true;
  const r = seeded(run.seed + run.nodes * 77);
  const type = fight.type;
  if (type === 'boss') {
    if (run.act >= ROGUE.acts - 1) { if (RF === fight) RF = null; return rogueEnd(true); }
    run.act++; run.row = -1; run.col = -1; run.map = rgGenMap(run.seed, run.act, run.abyss);
    run.hp = Math.min(rgStats(run).hp, run.hp + Math.round(rgStats(run).hp * 0.5));
    const g = ROGUE.gold.boss; run.gold += g;
    run.state = 'reward'; run.pending = { title: 'Акт ' + run.act + ' пройден! +' + g + ' 💰. Здоровье частично восстановлено.', choices: rgRewardChoices(run, r, 'boss'), neutral: rgRollNeutral(run, r, 1) };
  } else {
    const G = type === 'elite' ? ROGUE.gold.elite : ROGUE.gold.fight;
    const g = Math.round((G[0] + r() * (G[1] - G[0])) * (1 + rgStats(run).goldBonus)); run.gold += g;
    run.state = 'reward'; run.pending = { title: (type === 'elite' ? 'Элита повержена! ' : 'Победа! ') + '+' + g + ' 💰', choices: rgRewardChoices(run, r, type), neutral: type === 'elite' && r() < ROGUE.neutralChance.elite ? rgRollNeutral(run, r) : null };
  }
  if (RF === fight) RF = null; save(); renderRogue();
}
function rgRollNeutral(run, r) { const ks = Object.keys(RG_NEUTRAL).filter(k => k !== run.neutral); return ks[Math.floor(r() * ks.length)]; }
// 3 варианта награды: компоненты (дороже в поздних актах) и улучшение навыка
function rgRewardChoices(run, r, type) {
  const comps = Object.keys(RG_COMP);
  const lim = [80, 150, 220][run.act] + (type === 'elite' || type === 'boss' ? 60 : 0);
  const pool = comps.filter(c => RG_COMP[c][1] <= lim);
  const out = [];
  while (out.length < 2) { const c = pool[Math.floor(r() * pool.length)]; if (!out.some(x => x.c === c)) out.push({ c }); }
  const ups = [0, 1, 2, 3].filter(i => getSkills(run.hero).filter(x => x.kind !== 'passive')[i] && (run.skillLv[i] || 0) < ROGUE.maxSkillLv);
  if (ups.length && (type !== 'chest' || r() < 0.5)) out.push({ up: ups[Math.floor(r() * ups.length)] });
  else { const c = pool[Math.floor(r() * pool.length)]; out.push({ c }); }
  if (type === 'boss') { const b = Object.keys(RG_ITEMS); out[0] = { it: b[Math.floor(r() * b.length)] }; }
  return out;
}
function rogueTake(i) {
  const run = RS().run; if (!run || run.state !== 'reward') return;
  const ch = run.pending.choices[i]; if (!ch) return;
  rgLog(run, 'r' + i);
  if (ch.c || ch.it) { const id = ch.c || ch.it; if (run.items.length >= 6) { const g = Math.round((RG_COMP[id] ? RG_COMP[id][1] : 200) * 0.5); run.gold += g; showModal('🎒', 'Инвентарь полон', 'Предмет продан за ' + g + ' 💰. Продавай лишнее в лавке.', ''); } else run.items.push(id); }
  if (ch.up != null) run.skillLv[ch.up] = (run.skillLv[ch.up] || 0) + 1;
  if (run.pending.neutral) run.neutral = run.pending.neutral;
  run.state = 'map'; run.pending = null; save(); renderRogue();
}
function rogueSkipReward() { const run = RS().run; if (!run || run.state !== 'reward') return; if (run.pending.neutral) run.neutral = run.pending.neutral; run.gold += 15; run.state = 'map'; run.pending = null; save(); renderRogue(); }

// ---------- лавка, отдых, события ----------
function rgShopStock(run, r) {
  const lim = [110, 170, 230][run.act];
  const pool = Object.keys(RG_COMP).filter(c => RG_COMP[c][1] <= lim);
  const out = []; while (out.length < 6) { const c = pool[Math.floor(r() * pool.length)]; if (!out.includes(c)) out.push(c); }
  // подсказка: компоненты для ближайшего рецепта
  const near = Object.keys(RG_ITEMS).map(id => [id, RG_ITEMS[id][1].filter(c => !run.items.includes(c))]).filter(x => x[1].length === 1).map(x => x[1][0]);
  near.slice(0, 2).forEach(c => { if (!out.includes(c)) out.push(c); });
  return out.map(c => ({ c, sold: false }));
}
function rogueBuy(i) {
  const run = RS().run; if (!run || run.state !== 'shop') return;
  const s = run.pending.shop[i]; if (!s || s.sold) return;
  const p = rgPrice(run, s.c);
  if (run.gold < p) return showModal('💰', 'Мало золота', 'Нужно ' + p + ' 💰', 'bad');
  if (run.items.length >= 6) return showModal('🎒', 'Инвентарь полон', '6 слотов заняты. Продай что-нибудь или собери предмет.', '');
  run.gold -= p; s.sold = true; run.items.push(s.c); rgLog(run, 'b' + s.c); sfx('coin'); save(); renderRogue();
}
function rogueSell(i) {
  const run = RS().run; if (!run || run.state !== 'shop') return;
  const id = run.items[i]; if (!id) return;
  const base = RG_COMP[id] ? RG_COMP[id][1] : RG_ITEMS[id][1].reduce((a, c) => a + RG_COMP[c][1], RG_ITEMS[id][2]);
  run.gold += Math.round(base * 0.5); run.items.splice(i, 1); rgLog(run, 'x' + id); save(); renderRogue();
}
function roguePotion() { const run = RS().run; if (!run || run.state !== 'shop' || run.pending.potion) return; const p = rgPrice(run, 'ring_of_regen') + 10; if (run.gold < p) return; run.gold -= p; run.pending.potion = 1; run.hp = Math.min(rgStats(run).hp, run.hp + Math.round(rgStats(run).hp * 0.3)); save(); renderRogue(); }
function rogueBuild(id) {
  const run = RS().run; if (!run || !RG_ITEMS[id] || !['map', 'shop', 'reward', 'rest'].includes(run.state)) return;
  if (!rgBuildable(run).includes(id)) return;
  const fee = RG_ITEMS[id][2]; if (run.gold < fee) return showModal('💰', 'Мало золота', 'Рецепт стоит ' + fee + ' 💰', 'bad');
  const before = rgStats(run).hp;
  RG_ITEMS[id][1].forEach(c => run.items.splice(run.items.indexOf(c), 1));
  run.items.push(id); run.gold -= fee; rgLog(run, 'c' + id);
  run.hp = Math.min(rgStats(run).hp, run.hp + Math.max(0, rgStats(run).hp - before));
  sfx('open'); haptic('mythical'); save(); renderRogue();
  showModal('🔨', 'Собран ' + RG_ITEMS[id][0], RG_ITEMS[id][6], 'ok');
}
function rogueLeave() { const run = RS().run; if (!run || !['shop', 'rest'].includes(run.state)) return; run.state = 'map'; run.pending = null; save(); renderRogue(); }
function rogueRest(kind, i) {
  const run = RS().run; if (!run || run.state !== 'rest') return;
  if (kind === 'heal') { const m = rgStats(run).hp; run.hp = Math.min(m, run.hp + Math.round(m * ROGUE.restHeal * (1 - rgAbyssSum(run.abyss, 'rest')))); }
  else { if ((run.skillLv[i] || 0) >= ROGUE.maxSkillLv) return; run.skillLv[i] = (run.skillLv[i] || 0) + 1; }
  rgLog(run, 'R' + (kind === 'heal' ? 'h' : i));
  run.state = 'map'; save(); renderRogue();
}
function rogueEvent(i) {
  const run = RS().run; if (!run || run.state !== 'event') return;
  const ev = RG_EVENTS[run.pending.ev], c = ev.c[i]; if (!c) return;
  if (c.cost && run.gold < c.cost) return showModal('💰', 'Мало золота', 'Нужно ' + c.cost + ' 💰', 'bad');
  if (c.cost) run.gold -= c.cost;
  const r = seeded(run.seed + run.nodes * 53 + i);
  let eff = c.e, txt = c.okT || '';
  if (c.ch != null) { const win = r() < c.ch; eff = win ? c.ok : c.no; txt = win ? c.okT : c.noT; }
  rgLog(run, 'e' + i);
  const out = rgApply(run, eff || {}, r);
  if (run.hp <= 0) { run.hp = 1; }
  if (eff && (eff.fight || eff.elite)) {
    run.pending = { type: eff.elite ? 'elite' : 'fight', group: (eff.elite ? RG_ACT[run.act].elites : RG_ACT[run.act].fights)[Math.floor(r() * 3)], hp0: run.hp };
    run.state = 'fight'; save();
    return showModal('⚔', ev.t, (txt ? txt + ' ' : '') + out.join(' · '), '', { buttons: [{ t: 'В бой', c: 'green', f: () => { closeModal(); rogueFight(); } }] });
  }
  run.state = 'map'; run.pending = null; save(); renderRogue();
  showModal('📜', ev.t, (txt ? txt + ' ' : '') + (out.length ? out.join(' · ') : 'Ничего не изменилось.'), '');
}
function rgApply(run, e, r) {
  const out = [], m = rgStats(run).hp;
  if (e.gold) { run.gold = Math.max(0, run.gold + e.gold); out.push((e.gold > 0 ? '+' : '') + e.gold + ' 💰'); }
  if (e.hp) { run.hp = Math.max(1, Math.min(m, run.hp + Math.round(m * e.hp))); out.push((e.hp > 0 ? '+' : '') + Math.round(e.hp * 100) + '% здоровья'); }
  if (e.maxhp) { run.bonus.hp += e.maxhp; run.hp += e.maxhp; out.push('+' + e.maxhp + ' к макс. здоровью'); }
  if (e.atk) { run.bonus.atk += e.atk; out.push('+' + e.atk + ' атаки'); }
  if (e.curse) { run.bonus.atk -= e.curse; out.push('−' + e.curse + ' атаки'); }
  for (let k = 0; k < (e.comp || 0); k++) { const pool = Object.keys(RG_COMP).filter(c => RG_COMP[c][1] <= [100, 160, 220][run.act]); const c = pool[Math.floor(r() * pool.length)]; if (run.items.length < 6) { run.items.push(c); out.push('🎒 ' + RG_COMP[c][0]); } else { run.gold += 40; out.push('+40 💰 (нет места)'); } }
  if (e.item) { const ks = Object.keys(RG_ITEMS); const it = ks[Math.floor(r() * ks.length)]; if (run.items.length < 6) { run.items.push(it); out.push('🎁 ' + RG_ITEMS[it][0]); } else { run.gold += 120; out.push('+120 💰 (нет места)'); } }
  if (e.neutral) { const n = rgRollNeutral(run, r); run.neutral = n; out.push('🌿 ' + RG_NEUTRAL[n][0]); }
  if (e.skill) { const ups = [0, 1, 2, 3].filter(i => (run.skillLv[i] || 0) < ROGUE.maxSkillLv && getSkills(run.hero).filter(x => x.kind !== 'passive')[i]); if (ups.length) { const i = ups[Math.floor(r() * ups.length)]; run.skillLv[i]++; out.push('📈 ' + getSkills(run.hero).filter(x => x.kind !== 'passive')[i].name + ' ур.' + run.skillLv[i]); } }
  return out;
}

// ---------- конец забега и награды ----------
// Кристаллы: rewardScale × (1.2 за акт + 10.2 за победу) × (1 + 0.12·Бездна), за победу не больше 14 000. Полная награда — 3 забега в день, дальше ×0.25.
function rogueGemReward(acts, win, abyss, nth) {
  const R = ROGUE.reward;
  let g = rewardScale() * (R.perAct * acts + (win ? R.win : 0)) * (1 + R.abyss * abyss);
  if (win && R.winCap) g = Math.min(R.winCap, g);   // 2.8: полное прохождение — не больше 14 000
  return Math.round(g * (nth > R.fullPerDay ? R.overMul : 1));
}
function rogueEnd(win) {
  const R = RS(), run = R.run; if (!run) return;
  rogueTime(run);
  const acts = win ? 3 : run.act;
  const d = todayStr(); if (R.day.d !== d) R.day = { d, n: 0 }; R.day.n++;
  const gems = rogueGemReward(acts, win, run.abyss, R.day.n);
  const shards = ROGUE.shards.perAct * acts + (win ? ROGUE.shards.win + ROGUE.shards.abyss * run.abyss : 0);
  addGems(gems); R.shards += shards;
  if (win) { R.wins++; R.abyss[run.hero] = Math.max(R.abyss[run.hero] || 0, Math.min(10, run.abyss + 1)); }
  const depth = run.act * (ROGUE.rows + 1) + Math.max(0, run.row + 1) + (win ? 1 : 0);
  R.best = Math.max(R.best || 0, depth);
  const hs = R.stats.hero[run.hero] = R.stats.hero[run.hero] || { w: 0, l: 0 }; win ? hs.w++ : hs.l++;
  run.items.concat(run.neutral ? [run.neutral] : []).forEach(id => { const s = R.stats.item[id] = R.stats.item[id] || { w: 0, l: 0 }; win ? s.w++ : s.l++; });
  const res = { win, acts, gems, shards, depth, hero: run.hero, items: run.items.slice(), neutral: run.neutral, abyss: run.abyss, time: Math.round(run.time / 1000), daily: run.daily, seed: run.seed, log: run.log };
  R.last = { hero: res.hero, items: res.items, neutral: res.neutral, abyss: res.abyss, win, acts, at: Date.now() };
  R.run = null;
  if (typeof track === 'function') { track('rogueRuns'); if (win) track('rogueWins'); }
  save(); updateTop();
  if (typeof rogueSubmit === 'function') rogueSubmit(res);
  rogueShowLine(win ? '🏆 ПОБЕДА' : '💀 Путь оборвался', (win ? RG_LINES.win : RG_LINES.lose) + '\n\nПройдено актов: ' + acts + ' · глубина ' + depth + '\nНаграда: +' + fmt(gems) + ' 🔶 · +' + shards + ' осколков' + (R.day.n > ROGUE.reward.fullPerDay ? '\n(сегодня уже ' + ROGUE.reward.fullPerDay + ' забега с полной наградой — дальше награда ×0.25)' : '') + (win ? '\n🎁 Выбери предмет-награду (1 из 5)' : ''), () => { renderRogue(); if (win && typeof rogueRewardPick === 'function') rogueRewardPick(); }, win);
}
function rogueAbandon() {
  showModal('⚠', 'Сдаться?', 'Забег закончится, награда — за пройденные акты.', 'bad', { buttons: [{ t: 'Сдаться', c: 'red', f: () => { closeModal(); if (RF) { RF.over = true; RF = null; } rogueEnd(false); } }, { t: 'Отмена', f: closeModal }] });
}

// ---------- мета: разблокировки и билды ----------
function rogueUnlockHero(id) {
  const R = RS(); if (!HERO_BY_ID[id] || rgPool().includes(id)) return;
  if (R.shards < ROGUE.unlockHero) return showModal('💠', 'Мало осколков', 'Нужно ' + ROGUE.unlockHero + ' Осколков Древнего', 'bad');
  R.shards -= ROGUE.unlockHero; R.unlocked.push(id); save(); renderRogue();
}
const RG_STARTS = ['branches', 'circlet', 'gauntlets', 'slippers', 'mantle', 'ring_of_regen', 'sobi_mask', 'blades_of_attack', 'wind_lace', 'ring_of_protection'];
function rogueUnlockStart(c) {
  const R = RS(); if (!RG_STARTS.includes(c) || R.starts.includes(c)) return;
  if (R.shards < ROGUE.unlockStart) return showModal('💠', 'Мало осколков', 'Нужно ' + ROGUE.unlockStart + ' Осколков Древнего', 'bad');
  R.shards -= ROGUE.unlockStart; R.starts.push(c); save(); renderRogue();
}
function rogueSaveBuild() {
  const R = RS(); if (!R.last) return;
  R.builds.unshift(Object.assign({}, R.last)); R.builds = R.builds.slice(0, 20); R.last = null; save(); rgView = 'builds'; renderRogue();
}
function rogueDelBuild(i) { const R = RS(); R.builds.splice(i, 1); save(); renderRogue(); }

// ---------- обучение (4 подсказки в первом бою) ----------
const RG_TIPS = [
  'Над врагом — его НАМЕРЕНИЕ: что он сделает в свой ход (⚔ атака и число урона, 💫 оглушение, ⬆ усиление…). Планируй ход по нему.',
  'Твой ход: выбери цель касанием по врагу, потом нажми «Атака» или навык. Навыки тратят ману (синяя полоска) и уходят на перезарядку.',
  'Ульта — 4-я кнопка: сильнее всего, но перезарядка 5 ходов. Предметы с активной способностью (Blink, BKB…) появятся отдельными кнопками.',
  'Слабые бои можно отдать «Автоходу», а анимации ускорить x2/x4. Удачи на Пути Древнего!'
];
function rgTip(n) {
  const R = RS(); if (R.tut || !RF || RF.test) return;
  R.tipN = R.tipN || 0; if (n < R.tipN || n > R.tipN) return;
  const box = document.getElementById('rg-tip'); if (!box) return;
  box.innerHTML = '<div class="rg-tip"><div>' + esc(RG_TIPS[R.tipN]) + '</div><button class="btn sm gold" data-click="rgTipNext()">Понятно (' + (R.tipN + 1) + '/4)</button></div>';
}
function rgTipNext() { const R = RS(); R.tipN = (R.tipN || 0) + 1; const box = document.getElementById('rg-tip'); if (box) box.innerHTML = ''; if (R.tipN < RG_TIPS.length) setTimeout(() => { if (RF) { const b = document.getElementById('rg-tip'); if (b) b.innerHTML = '<div class="rg-tip"><div>' + esc(RG_TIPS[R.tipN]) + '</div><button class="btn sm gold" data-click="rgTipNext()">Понятно (' + (R.tipN + 1) + '/4)</button></div>'; } }, 300); else R.tut = true; save(); }

// ---------- тестовый бой (кнопка в настройках) ----------
function rogueTestFight() {
  closeModal(); switchTab('rogue');
  const run = { seed: 7, act: 0, row: 0, nodes: 0, abyss: 0, hero: 'juggernaut', items: [], neutral: null, bonus: {}, skillLv: [0, 0, 0, 0], meta: 0, hp: 9999, log: '' };
  run.hp = rgStats(run).hp;
  rogueFight({ test: true, run, group: ['kobold', 'kobold', 'kobold'] });
}
