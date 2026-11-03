// ================= «БИТВА ЗА БАШНЮ» (карточная стратегия в реальном времени) =================
// Поле 360×640 (логические единицы), снизу — игрок (сторона 0), сверху — соперник (сторона 1).
// Симуляция детерминированная: шаг 1/30 сек, свой генератор случайных чисел, без sin/cos —
// поэтому один и тот же бой с одинаковыми действиями даёт одинаковый результат на любом устройстве
// (нужно для «призраков» и живого PvP: по сети передаются только действия игроков).
const TW = {
  W: 360, H: 640, RIVER: 320, FPS: 30, TIME: 180, DOUBLE: 60, OVERTIME: 60,
  manaMax: 10, manaEvery: 2.8, manaStart: 5,
  tower: { hp: 1500, dmg: 62, range: 125, cd: 0.8, r: 22 }, throne: { hp: 2600, dmg: 80, range: 115, cd: 1.0, r: 30 },
  floors: 50, rewardedPerDay: 10,
  reward: { base: 0.5, perFloor: 0.03, replay: 0.12, pvpWin: 0.6 },
  delay: 30, lead: 20                                     // живой PvP: действие срабатывает через 30 тиков (1 с); можно убежать вперёд не больше чем на 20
};
// ---------- карты ----------
// роли героев → параметры юнита; сила умножается на уровень героя (с потолком)
const TW_ROLE = {
  carry: { cost: 4, hp: 900, dmg: 125, range: 24, spd: 46, cd: 1.0, r: 14 },
  tank: { cost: 5, hp: 2100, dmg: 85, range: 24, spd: 34, cd: 1.3, r: 17 },
  support: { cost: 3, hp: 520, dmg: 70, range: 105, spd: 44, cd: 1.1, r: 13, heal: 30 },
  nuker: { cost: 4, hp: 480, dmg: 150, range: 120, spd: 42, cd: 1.6, r: 13, splash: 38 },
  initiator: { cost: 4, hp: 1150, dmg: 90, range: 24, spd: 56, cd: 1.1, r: 15, stunFirst: 1 }
};
const TW_CARDS = {
  creeps: { n: 'Крипы ×3', cost: 3, ic: '🗡', u: { hp: 300, dmg: 45, range: 20, spd: 50, cd: 1.0, r: 10 }, count: 3 },
  ranged: { n: 'Лучники ×2', cost: 2, ic: '🏹', u: { hp: 170, dmg: 42, range: 100, spd: 46, cd: 1.1, r: 9 }, count: 2 },
  catapult: { n: 'Катапульта', cost: 4, ic: '🪨', u: { hp: 720, dmg: 190, range: 190, spd: 28, cd: 3, r: 15, bld: 1 }, count: 1 },
  sunstrike: { n: 'Sun Strike', cost: 3, ic: '☀', spell: { r: 45, dmg: 460, delay: 0.8, bldMul: 0.3 }, key: 'invoker_sun_strike' },
  chrono: { n: 'Chronosphere', cost: 5, ic: '⏳', spell: { r: 70, freeze: 3 }, key: 'faceless_void_chronosphere' },
  blackhole: { n: 'Black Hole', cost: 6, ic: '🌀', spell: { r: 80, dps: 130, dur: 3, stun: 1 }, key: 'enigma_black_hole' }
};
const TW_EXTRA = ['creeps', 'ranged', 'catapult', 'sunstrike', 'chrono', 'blackhole'];

function migrateTower(st) {
  if (!st.tower || typeof st.tower !== 'object') st.tower = {};
  const t = st.tower;
  if (t.best == null) t.best = 0; if (t.floor == null) t.floor = 1; if (!t.deck) t.deck = null;
  if (!t.day) t.day = { d: '', n: 0 }; if (t.mmr == null) t.mmr = 1000; if (t.w == null) t.w = 0; if (t.l == null) t.l = 0;
}
function TS() { if (!S.tower) migrateTower(S); return S.tower; }

// сила героя в «Башне»: уровень и снаряжение дают до +60%, дальше потолок (новичок тоже может победить)
function twHeroMul(id) {
  const h = S.heroes[id] || { level: 1 };
  return 1 + Math.min(0.5, (h.level - 1) * 0.012) + Math.min(0.1, (typeof setCount === 'function' ? setCount(id) : 0) * 0.03);
}
function twDefaultDeck() {
  const ids = HEROES.map(h => h.id).sort((a, b) => (S.heroes[b] ? S.heroes[b].level : 1) - (S.heroes[a] ? S.heroes[a].level : 1)).slice(0, 4);
  return ids.map(id => 'h:' + id).concat(['creeps', 'ranged', 'sunstrike', 'catapult']);
}
function twDeck() { const T = TS(); const d = T.deck && T.deck.length === 8 ? T.deck : twDefaultDeck(); return d.filter(c => twCardOk(c)).length === 8 ? d : twDefaultDeck(); }
function twCardOk(c) { return TW_CARDS[c] || (c.startsWith('h:') && HERO_BY_ID[c.slice(2)]); }
// полное описание карты для боя: mul — сила (герой игрока, бот этажа, призрак)
function twCardSpec(c, mul) {
  if (TW_CARDS[c]) { const x = TW_CARDS[c]; return { c, n: x.n, cost: x.cost, ic: x.ic, key: x.key, u: x.u ? Object.assign({}, x.u) : null, count: x.count || 1, spell: x.spell ? Object.assign({}, x.spell) : null, mul }; }
  const id = c.slice(2), role = heroRole(id), R = TW_ROLE[role] || TW_ROLE.carry;
  return { c, n: HERO_BY_ID[id].name, cost: R.cost, hero: id, u: Object.assign({}, R), count: 1, ult: ultOf(id).type, mul };
}

// ================= ДВИЖОК =================
function twNew(o) {
  // o: { seed, deck0:[spec], deck1:[spec], bot: {lvl, floor, manaMul}, boss, mode }
  const rng = seeded(o.seed >>> 0);
  const g = { tick: 0, rng, units: [], fx: [], spells: [], over: false, win: -1, crowns: [0, 0], mana: [TW.manaStart, TW.manaStart], manaMul: [1, (o.bot && o.bot.manaMul) || 1],
    deck: [o.deck0, o.deck1], hand: [[0, 1, 2, 3], [0, 1, 2, 3]], queue: [[4, 5, 6, 7], [4, 5, 6, 7]], acts: [], log: [], uid: 1, o };
  // перемешать колоды одинаково на обоих устройствах
  for (let s = 0; s < 2; s++) { const ord = [0, 1, 2, 3, 4, 5, 6, 7]; for (let i = 7; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [ord[i], ord[j]] = [ord[j], ord[i]]; } g.hand[s] = ord.slice(0, 4); g.queue[s] = ord.slice(4); }
  g.bld = [];
  for (let s = 0; s < 2; s++) {
    const y = v => s === 0 ? v : TW.H - v;
    const tm = s === 1 ? (o.towerMul || 1) : 1;
    g.bld.push({ id: g.uid++, side: s, kind: 'tower', lane: 0, x: 80, y: y(510), hp: TW.tower.hp * tm, max: TW.tower.hp * tm, cd: 0, r: TW.tower.r, dmg: TW.tower.dmg * tm, range: TW.tower.range, rate: TW.tower.cd, alive: true });
    g.bld.push({ id: g.uid++, side: s, kind: 'tower', lane: 1, x: 280, y: y(510), hp: TW.tower.hp * tm, max: TW.tower.hp * tm, cd: 0, r: TW.tower.r, dmg: TW.tower.dmg * tm, range: TW.tower.range, rate: TW.tower.cd, alive: true });
    g.bld.push({ id: g.uid++, side: s, kind: 'throne', lane: -1, x: 180, y: y(585), hp: TW.throne.hp * tm, max: TW.throne.hp * tm, cd: 0, r: TW.throne.r, dmg: TW.throne.dmg * tm, range: TW.throne.range, rate: TW.throne.cd, alive: true });
  }
  if (o.boss) twSpawnUnit(g, 1, { n: 'Рошан', boss: 1, ic: '🦍', u: { hp: 5200, dmg: 210, range: 30, spd: 22, cd: 1.6, r: 24, splash: 45 }, mul: o.boss }, 180, TW.H - 470);
  return g;
}
function twSpawnUnit(g, side, spec, x, y) {
  const u = spec.u, m = spec.mul || 1;
  const n = { id: g.uid++, side, x, y, hp: u.hp * m, max: u.hp * m, dmg: u.dmg * m, range: u.range, spd: u.spd, rate: u.cd, cd: 0.5, r: u.r, bld: !!u.bld, splash: u.splash || 0, heal: (u.heal || 0) * m,
    stunFirst: u.stunFirst || 0, hero: spec.hero || null, ic: spec.ic || null, boss: !!spec.boss, ult: spec.ult || null, ultCd: 6, stun: 0, alive: true, lane: x < 180 ? 0 : 1, tgt: 0, hit: 0, buff: 0, shield: 0 };
  g.units.push(n);
  return n;
}
// игровое действие (карта на поле). Возвращает true, если принято.
function twCanPlay(g, side, slot, x, y) {
  const ci = g.hand[side][slot]; if (ci == null) return false;
  const sp = g.deck[side][ci];
  if (g.mana[side] < sp.cost) return false;
  if (x < 12 || x > TW.W - 12 || y < 12 || y > TW.H - 12) return false;
  if (!sp.spell) { const own = side === 0 ? y > TW.RIVER + 20 : y < TW.RIVER - 20; if (!own) return false; }
  return true;
}
function twPlay(g, side, slot, x, y) {
  if (!twCanPlay(g, side, slot, x, y)) return false;
  const ci = g.hand[side][slot], sp = g.deck[side][ci];
  g.mana[side] -= sp.cost;
  g.hand[side][slot] = g.queue[side].shift(); g.queue[side].push(ci);
  g.acts.push({ t: g.tick, s: side, c: ci, x: Math.round(x), y: Math.round(y) });
  if (sp.spell) g.spells.push({ side, x, y, sp: sp.spell, mul: sp.mul, t: 0, key: sp.c, done: false });
  else for (let k = 0; k < sp.count; k++) twSpawnUnit(g, side, sp, x + (k - (sp.count - 1) / 2) * 16, y + (k % 2) * 8);
  return true;
}
const twD2 = (a, b) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y);
function twDmg(g, t, d, src) {
  if (!t.alive) return;
  if (t.shield > 0) d *= 0.6;
  t.hp -= d; g.fx.push({ k: 'num', x: t.x, y: t.y - 10, v: Math.round(d), side: t.side, life: 20 });
  if (src && src.side !== t.side && t.kind) t.hitBy = src.side;
  if (t.hp <= 0) {
    t.hp = 0; t.alive = false;
    if (t.kind) {
      g.crowns[1 - t.side] += t.kind === 'throne' ? 3 - g.crowns[1 - t.side] : 1;
      g.fx.push({ k: 'boom', x: t.x, y: t.y, life: 30 });
      if (t.kind === 'throne') twEnd(g, 1 - t.side);
      else if (g.tick >= TW.TIME * TW.FPS) twEnd(g, 1 - t.side);   // овертайм: первая разрушенная башня решает
    }
  }
}
function twEnd(g, win) { if (g.over) return; g.over = true; g.win = win; }
function twTargetBld(g, u) {
  const foes = g.bld.filter(b => b.alive && b.side !== u.side);
  const lane = foes.find(b => b.kind === 'tower' && b.lane === u.lane);
  if (lane) return lane;
  return foes.find(b => b.kind === 'throne') || foes[0];
}
function twStep(g, inputs) {
  if (g.over) return;
  const dt = 1 / TW.FPS, T = g.tick / TW.FPS;
  (inputs || []).forEach(a => twPlay(g, a.s, a.slot, a.x, a.y));
  // мана
  const dbl = T >= TW.TIME - TW.DOUBLE ? 2 : 1;
  for (let s = 0; s < 2; s++) g.mana[s] = Math.min(TW.manaMax, g.mana[s] + dt / TW.manaEvery * dbl * g.manaMul[s]);
  // заклинания
  g.spells.forEach(sp => {
    sp.t += dt;
    const foes = g.units.filter(u => u.alive && u.side !== sp.side && twD2(u, sp) <= (sp.sp.r + u.r) * (sp.sp.r + u.r));
    if (sp.sp.dmg && !sp.done && sp.t >= sp.sp.delay) {
      sp.done = true; foes.forEach(u => twDmg(g, u, sp.sp.dmg * sp.mul, sp));
      g.bld.filter(b => b.alive && b.side !== sp.side && twD2(b, sp) <= (sp.sp.r + b.r) * (sp.sp.r + b.r)).forEach(b => twDmg(g, b, sp.sp.dmg * sp.mul * sp.sp.bldMul, sp));
      g.fx.push({ k: 'sun', x: sp.x, y: sp.y, r: sp.sp.r, life: 18 });
    }
    if (sp.sp.freeze && !sp.done) { sp.done = true; foes.forEach(u => { u.stun = Math.max(u.stun, sp.sp.freeze); }); }
    if (sp.sp.dps && sp.t <= sp.sp.dur) foes.forEach(u => { twDmg(g, u, sp.sp.dps * sp.mul * dt, sp); u.stun = Math.max(u.stun, dt * 2); });
  });
  g.spells = g.spells.filter(sp => sp.t < Math.max(sp.sp.freeze || 0, sp.sp.dur || 0, (sp.sp.delay || 0) + 0.4));
  // юниты
  const all = g.units;
  for (const u of all) {
    if (!u.alive) continue;
    u.cd -= dt; u.ultCd -= dt; if (u.buff > 0) u.buff -= dt; if (u.shield > 0) u.shield -= dt;
    if (u.stun > 0) { u.stun -= dt; continue; }
    // цель: ближайший враг в радиусе 120 (если юнит не «по зданиям»), иначе здание своей линии
    let tgt = null, best = 120 * 120;
    if (!u.bld) for (const e of all) { if (!e.alive || e.side === u.side) continue; const d = twD2(u, e); if (d < best) { best = d; tgt = e; } }
    if (!tgt) for (const b of g.bld) { if (!b.alive || b.side === u.side) continue; const d = twD2(u, b); if (d < (u.range + b.r + 40) * (u.range + b.r + 40) && d < best * 4) { tgt = b; best = d; } }
    if (!tgt) tgt = twTargetBld(g, u);
    if (!tgt) continue;
    const reach = u.range + u.r + (tgt.r || 10);
    const d2 = twD2(u, tgt);
    if (d2 > reach * reach) {
      const d = Math.sqrt(d2), sp = u.spd * dt;
      u.x += (tgt.x - u.x) / d * sp; u.y += (tgt.y - u.y) / d * sp;
    } else if (u.cd <= 0) {
      u.cd = u.rate;
      const dmg = u.dmg * (u.buff > 0 ? 1.4 : 1);
      if (u.splash) { const r2 = u.splash * u.splash; all.filter(e => e.alive && e.side !== u.side && twD2(e, tgt) <= r2).forEach(e => twDmg(g, e, dmg, u)); if (tgt.kind) twDmg(g, tgt, dmg, u); }
      else twDmg(g, tgt, dmg, u);
      if (u.stunFirst && !u.hit && !tgt.kind) tgt.stun = Math.max(tgt.stun || 0, u.stunFirst);
      u.hit++;
      if (u.range > 40) g.fx.push({ k: 'shot', x: u.x, y: u.y, x2: tgt.x, y2: tgt.y, side: u.side, life: 6 });
      // ульта героя раз в 8 сек в бою
      if (u.ult && u.ultCd <= 0) { u.ultCd = 8; twUlt(g, u, tgt); }
    }
    if (u.heal && g.tick % 15 === 0) all.forEach(a => { if (a.alive && a.side === u.side && twD2(a, u) < 90 * 90) a.hp = Math.min(a.max, a.hp + u.heal * 0.5); });
  }
  // мягкое расталкивание своих
  for (let i = 0; i < all.length; i++) { const a = all[i]; if (!a.alive) continue; for (let j = i + 1; j < all.length; j++) { const b = all[j]; if (!b.alive || b.side !== a.side) continue; const rr = a.r + b.r, d2 = twD2(a, b); if (d2 > 0 && d2 < rr * rr) { const d = Math.sqrt(d2), p = (rr - d) / 2 / d; const dx = (b.x - a.x) * p, dy = (b.y - a.y) * p; a.x -= dx; a.y -= dy; b.x += dx; b.y += dy; } } }
  all.forEach(u => { u.x = Math.max(10, Math.min(TW.W - 10, u.x)); u.y = Math.max(10, Math.min(TW.H - 10, u.y)); });
  // здания
  for (const b of g.bld) {
    if (!b.alive) continue; b.cd -= dt;
    if (b.cd > 0) continue;
    let tgt = null, best = (b.range) * (b.range);
    for (const e of all) { if (!e.alive || e.side === b.side) continue; const d = twD2(b, e); if (d < best) { best = d; tgt = e; } }
    if (tgt) { b.cd = b.rate; twDmg(g, tgt, b.dmg, b); g.fx.push({ k: 'shot', x: b.x, y: b.y, x2: tgt.x, y2: tgt.y, side: b.side, life: 6, big: 1 }); }
  }
  g.units = all.filter(u => u.alive);
  g.fx.forEach(f => f.life--); g.fx = g.fx.filter(f => f.life > 0);
  g.tick++;
  // время
  const t = g.tick / TW.FPS;
  if (!g.over && t >= TW.TIME && g.crowns[0] !== g.crowns[1]) twEnd(g, g.crowns[0] > g.crowns[1] ? 0 : 1);
  if (!g.over && t >= TW.TIME + TW.OVERTIME) {
    const hpOf = s => g.bld.filter(b => b.side === s).reduce((a, b) => a + b.hp / b.max, 0);
    const a = hpOf(0), b = hpOf(1);
    twEnd(g, a > b + 0.001 ? 0 : b > a + 0.001 ? 1 : 2);   // 2 — ничья
  }
}
function twUlt(g, u, tgt) {
  const t = u.ult;
  if (t === 'nuke' || t === 'crit' || t === 'execute') twDmg(g, tgt, u.dmg * 2.5, u);
  else if (t === 'aoe') g.units.filter(e => e.alive && e.side !== u.side && twD2(e, tgt) < 70 * 70).forEach(e => twDmg(g, e, u.dmg * 1.6, u));
  else if (t === 'stun') { if (!tgt.kind) tgt.stun = Math.max(tgt.stun || 0, 2); twDmg(g, tgt, u.dmg, u); }
  else if (t === 'heal') g.units.forEach(a => { if (a.alive && a.side === u.side && twD2(a, u) < 110 * 110) a.hp = Math.min(a.max, a.hp + a.max * 0.3); });
  else if (t === 'shield') g.units.forEach(a => { if (a.alive && a.side === u.side && twD2(a, u) < 110 * 110) a.shield = 4; });
  else if (t === 'buff') g.units.forEach(a => { if (a.alive && a.side === u.side && twD2(a, u) < 110 * 110) a.buff = 4; });
  g.fx.push({ k: 'ult', x: u.x, y: u.y, life: 20, side: u.side });
}

// ================= БОТЫ (3 уровня) =================
function twBot(g, side, lvl) {
  const B = g.bot = g.bot || { next: 45 };
  if (g.tick < B.next) return null;
  const hand = g.hand[side], deck = g.deck[side], mana = g.mana[side], r = g.rng;
  const my = y => side === 0 ? y : TW.H - y;              // координаты даны для нижней стороны; для верхней — зеркально
  const foes = g.units.filter(u => u.side !== side);
  const threat = [0, 1].map(l => foes.filter(u => u.lane === l && (side === 1 ? u.y < TW.RIVER + 40 : u.y > TW.RIVER - 40)).reduce((a, u) => a + u.hp, 0));
  const pick = f => { const c = hand.map((ci, i) => [deck[ci], i]).filter(([sp]) => sp.cost <= mana && f(sp)); return c.length ? c[Math.floor(r() * c.length)] : null; };
  const place = (i, lane, yy) => ({ s: side, slot: i, x: lane === 0 ? 70 + r() * 40 : 250 + r() * 40, y: my(yy) });
  B.next = g.tick + (lvl === 0 ? 75 + Math.floor(r() * 75) : lvl === 1 ? 40 : 25);
  if (lvl === 0) { const p = pick(sp => !sp.spell || r() < 0.3); if (!p || r() < 0.35) return null; if (p[0].spell) { const t = foes[0]; return t ? { s: side, slot: p[1], x: t.x, y: t.y } : null; } return place(p[1], r() < 0.5 ? 0 : 1, 470 + r() * 100); }
  const lane = threat[0] >= threat[1] ? 0 : 1, danger = Math.max(threat[0], threat[1]);
  if (danger > 0) {
    // заклинание по самой плотной группе врагов (средний и сложный)
    const sp = pick(s => s.spell && s.spell.dmg || s.spell && s.spell.freeze);
    if (sp && (lvl === 2 || r() < 0.5)) { let bestU = null, bc = 0; foes.forEach(u => { const c = foes.filter(v => twD2(u, v) < 60 * 60).length; if (c > bc) { bc = c; bestU = u; } }); if (bestU && (bc >= 2 || lvl === 1)) return { s: side, slot: sp[1], x: bestU.x, y: bestU.y }; }
    const p = pick(s => !s.spell); if (p) return place(p[1], lane, 470);
    return null;
  }
  if (lvl === 2 && mana < 9) return null;                 // сложный копит ману для пуша
  if (lvl === 1 && mana < 6) return null;
  // атака: танк впереди, за ним дальнобойные
  const tank = pick(s => !s.spell && s.u && s.u.hp >= 900);
  const any = tank || pick(s => !s.spell);
  if (!any) return null;
  B.push = B.push != null && r() < 0.7 ? B.push : (r() < 0.5 ? 0 : 1);
  if (lvl === 2 && tank) B.follow = { t: g.tick + 45, lane: B.push };
  return place(any[1], B.push, tank ? 380 : 470);
}
function twBotFollow(g, side) {
  const B = g.bot; if (!B || !B.follow || g.tick < B.follow.t) return null;
  const hand = g.hand[side], deck = g.deck[side];
  const i = hand.findIndex(ci => !deck[ci].spell && deck[ci].u.range > 60 && deck[ci].cost <= g.mana[side]);
  const lane = B.follow.lane; B.follow = null;
  if (i < 0) return null;
  return { s: side, slot: i, x: lane === 0 ? 85 : 275, y: side === 1 ? 140 : TW.H - 140 };
}
// колода бота этажа
function twBotDeck(floor, seed) {
  const r = seeded(seed * 31 + floor);
  const pool = HEROES.map(h => h.id);
  const ids = []; while (ids.length < 4) { const id = pool[Math.floor(r() * pool.length)]; if (!ids.includes(id)) ids.push(id); }
  const extra = TW_EXTRA.slice().sort(() => r() - 0.5).slice(0, 4);
  return ids.map(id => 'h:' + id).concat(extra);
}
function twBotMul(floor) { return 0.8 + floor * 0.009; }
function twBotLvl(floor) { return floor <= 10 ? 0 : floor <= 30 ? 1 : 2; }

// ================= ЭКРАН И УПРАВЛЕНИЕ =================
let TB = null;                                          // текущий бой: { g, mode, floor, raf, acc, last, imgs, drag, sel, online }
function twImg(id) {
  TB.imgs = TB.imgs || {};
  if (TB.imgs[id] !== undefined) return TB.imgs[id];
  const im = new Image(); im.referrerPolicy = 'no-referrer'; TB.imgs[id] = null;
  const urls = [STEAM + 'heroes/icons/' + id + '.png', heroIcon(id), STEAM + 'heroes/' + id + '.png']; let i = 0;
  im.onload = () => { TB && (TB.imgs[id] = im); }; im.onerror = () => { i++; if (i < urls.length) im.src = urls[i]; };
  im.src = urls[0];
  return null;
}
function twStart(mode, opts) {
  opts = opts || {};
  if (TB) twStop();
  const T = TS(), seed = opts.seed != null ? opts.seed : (Math.floor(Math.random() * 1e9) >>> 0);
  let deck0 = opts.deck0 || twDeck().map(c => twCardSpec(c, c.startsWith('h:') ? twHeroMul(c.slice(2)) : 1));
  let deck1 = opts.deck1, bot = null, boss = 0, floor = opts.floor || T.floor, towerMul = 1;
  if (mode === 'floor') {
    const m = twBotMul(floor);
    deck1 = twBotDeck(floor, 7).map(c => twCardSpec(c, m));
    bot = { lvl: twBotLvl(floor), manaMul: 1 + floor * 0.004 };
    if (floor % 10 === 0) boss = 0.5 + floor * 0.01;
    towerMul = 0.9 + floor * 0.006;
  } else if (mode === 'ghost') {
    deck1 = opts.ghost.deck.map(c => twCardSpec(c.c, c.m));
  }
  const g = twNew({ seed, deck0, deck1, bot, boss, towerMul });
  TB = { g, me: opts.me || 0, mode, floor, bot, ghost: opts.ghost || null, online: opts.online || null, acc: 0, last: 0, sel: -1, drag: null, imgs: {}, pending: [], startedAt: Date.now() };
  twRenderShell();
  TB.last = performance.now();
  TB.raf = requestAnimationFrame(twFrame);
}
function twStop() { if (!TB) return; cancelAnimationFrame(TB.raf); if (TB.online && TB.online.timer) clearInterval(TB.online.timer); TB = null; }
function twFrame(now) {
  if (!TB) return;
  const g = TB.g;
  TB.acc += Math.min(0.25, (now - TB.last) / 1000); TB.last = now;
  const dt = 1 / TW.FPS;
  while (TB.acc >= dt && !g.over) {
    if (TB.online && !twOnlineCanStep()) { TB.acc = 0; break; }
    const inputs = [];
    // мои действия (в живом PvP — по расписанию)
    TB.pending = TB.pending.filter(a => { if (a.t <= g.tick) { inputs.push(a); return false; } return true; });
    if (TB.mode === 'floor') { const a = twBot(g, 1, TB.bot.lvl) || twBotFollow(g, 1); if (a) inputs.push(a); }
    if (TB.mode === 'ghost') TB.ghost.acts.forEach(a => { if (a.t === g.tick) inputs.push(Object.assign({}, a, { s: 1, slot: g.hand[1].indexOf(a.c), x: a.x, y: TW.H - a.y })); });
    twStep(g, inputs.filter(a => a.slot >= 0).sort((a, b) => a.s - b.s || a.slot - b.slot));
    TB.acc -= dt;
  }
  twDraw();
  twRenderHand();
  if (g.over) return twFinish();
  TB.raf = requestAnimationFrame(twFrame);
}
// игрок кладёт карту: в обычном бою — на следующий тик, в живом PvP — через TW.delay тиков (обе стороны применят одновременно)
function twPlace(slot, x, y) {
  if (!TB || TB.g.over) return false;
  const g = TB.g, me = TB.me;
  if (me === 1) { x = TW.W - x; y = TW.H - y; }          // экран игрока b повёрнут
  if (!twCanPlay(g, me, slot, x, y)) { twFlash('Сюда нельзя: только на своей половине (или не хватает маны)'); return false; }
  if (TB.online) return twOnlineSend(slot, x, y);
  TB.pending.push({ t: g.tick, s: me, slot, x, y });
  if (navigator.vibrate && SETTINGS.haptics) try { navigator.vibrate(10); } catch (e) { }
  return true;
}
function twFlash(t) { const f = document.getElementById('tw-msg'); if (!f) return; f.textContent = t; f.classList.add('on'); clearTimeout(twFlash.t); twFlash.t = setTimeout(() => f.classList.remove('on'), 1600); }

function twRenderShell() {
  const host = document.getElementById('games-host'); if (!host) return;
  host.innerHTML = '<div class="tw-wrap"><div class="tw-top"><span id="tw-crowns">👑 0 : 0</span><span id="tw-time">3:00</span><button class="btn sm ghost" data-click="twQuit()">✕</button></div>' +
    '<div class="tw-cv-box"><canvas id="tw-cv"></canvas><div class="tw-msg" id="tw-msg"></div></div>' +
    '<div class="tw-mana"><div id="tw-mana-bar"></div><span id="tw-mana-n">5</span></div><div class="tw-hand" id="tw-hand"></div></div>';
  const cv = document.getElementById('tw-cv');
  const box = cv.parentElement;
  const maxH = Math.max(360, window.innerHeight - 190);
  const w = Math.min(box.clientWidth || 360, 440, Math.floor(maxH * TW.W / TW.H));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * dpr); cv.height = Math.round(w * TW.H / TW.W * dpr);
  cv.style.width = w + 'px'; cv.style.height = Math.round(w * TW.H / TW.W) + 'px';
  TB.scale = cv.width / TW.W; TB.cv = cv; TB.ctx = cv.getContext('2d');
  // перетаскивание карты на поле / касание карты и потом поля
  const toField = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * TW.W, y: (e.clientY - r.top) / r.height * TW.H, inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom }; };
  cv.addEventListener('pointerdown', e => { if (TB && TB.sel >= 0) { const p = toField(e); if (twPlace(TB.sel, p.x, p.y)) TB.sel = -1; } });
  const hand = document.getElementById('tw-hand');
  hand.addEventListener('pointerdown', e => {
    const b = e.target.closest('.tw-card'); if (!b || !TB) return;
    const slot = +b.dataset.slot; TB.drag = { slot, moved: false }; TB.sel = slot;
    try { b.setPointerCapture(e.pointerId); } catch (x) { }
  });
  hand.addEventListener('pointermove', e => { if (!TB || !TB.drag) return; const p = toField(e); TB.drag.moved = TB.drag.moved || p.inside; TB.drag.p = p; });
  hand.addEventListener('pointerup', e => { if (!TB || !TB.drag) return; const p = toField(e); const d = TB.drag; TB.drag = null; if (p.inside && twPlace(d.slot, p.x, p.y)) TB.sel = -1; });
  hand.addEventListener('pointercancel', () => { if (TB) TB.drag = null; });
}
function twRenderHand() {
  const g = TB.g, h = document.getElementById('tw-hand'); if (!h) return;
  const me = TB.me;
  const key = g.hand[me].join(',');
  if (h.dataset.k !== key && !TB.drag) {                   // во время перетаскивания карты не пересоздаём
    h.dataset.k = key;
    h.innerHTML = g.hand[me].map((ci, i) => { const sp = g.deck[me][ci]; return '<button class="tw-card" data-slot="' + i + '">' + twCardFace(sp) + '<b>' + sp.cost + '</b><small>' + esc(sp.n) + '</small></button>'; }).join('') +
      '<div class="tw-next">след.<br>' + twCardFace(g.deck[me][g.queue[me][0]]) + '</div>';
  }
  h.querySelectorAll('.tw-card').forEach((b, i) => { const ci = g.hand[me][i]; const sp = ci != null && g.deck[me][ci]; b.classList.toggle('off', !sp || g.mana[me] < sp.cost); b.classList.toggle('sel', TB.sel === i); });
  const m = document.getElementById('tw-mana-bar'); if (m) m.style.width = (g.mana[me] * 10) + '%';
  const mn = document.getElementById('tw-mana-n'); if (mn) mn.textContent = Math.floor(g.mana[me]);
  const t = Math.max(0, TW.TIME - g.tick / TW.FPS), ot = g.tick / TW.FPS > TW.TIME;
  const tm = document.getElementById('tw-time'); if (tm) tm.textContent = ot ? 'Овертайм ' + Math.ceil(TW.TIME + TW.OVERTIME - g.tick / TW.FPS) : Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0') + (t <= TW.DOUBLE ? ' ×2' : '');
  const cr = document.getElementById('tw-crowns'); if (cr) cr.textContent = '👑 ' + g.crowns[me] + ' : ' + g.crowns[1 - me];
}
function twCardFace(sp) {
  if (sp.hero) return '<img src="' + STEAM + 'heroes/icons/' + sp.hero + '.png" referrerpolicy="no-referrer" alt="">';
  return '<span class="tw-ic">' + sp.ic + '</span>';
}
function twDraw() {
  const g = TB.g, c = TB.ctx, k = TB.scale; if (!c) return;
  const me = TB.me, mine = s => s === me;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = '#20331b'; c.fillRect(0, 0, TW.W, TW.H);
  if (me === 1) c.setTransform(-k, 0, 0, -k, TW.W * k, TW.H * k);
  // поле
  c.fillStyle = '#20331b'; c.fillRect(0, 0, TW.W, TW.H);
  c.fillStyle = '#2a4022'; c.fillRect(0, me === 1 ? 0 : TW.RIVER + 20, TW.W, TW.RIVER - 20);
  c.fillStyle = '#1d3a52'; c.fillRect(0, TW.RIVER - 14, TW.W, 28);
  c.fillStyle = '#5a4a32'; c.fillRect(64, TW.RIVER - 16, 32, 32); c.fillRect(264, TW.RIVER - 16, 32, 32);
  if (TB.sel >= 0 || TB.drag) { const sp = g.deck[me][g.hand[me][TB.sel >= 0 ? TB.sel : TB.drag.slot]]; if (sp && !sp.spell) { c.fillStyle = 'rgba(255,211,106,.08)'; c.fillRect(0, me === 1 ? 0 : TW.RIVER + 20, TW.W, TW.RIVER - 20); } }
  // здания
  g.bld.forEach(b => {
    c.globalAlpha = b.alive ? 1 : 0.25;
    c.fillStyle = mine(b.side) ? '#2e6b2a' : '#7a2a20'; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.2832); c.fill();
    c.strokeStyle = '#000'; c.lineWidth = 2; c.stroke();
    c.fillStyle = '#fff'; c.font = (b.kind === 'throne' ? 22 : 16) + 'px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; twText(c, b.kind === 'throne' ? '🏛' : '🗼', b.x, b.y);
    if (b.alive) twBar(c, b.x, b.y - b.r - 7, b.r * 2, b.hp / b.max, mine(b.side) ? 0 : 1);
    c.globalAlpha = 1;
  });
  // юниты
  g.units.forEach(u => {
    c.beginPath(); c.arc(u.x, u.y, u.r, 0, 6.2832);
    const im = u.hero ? twImg(u.hero) : null;
    if (im) { c.save(); if (me === 1) { c.setTransform(k, 0, 0, k, (TW.W - u.x) * k, (TW.H - u.y) * k); c.beginPath(); c.arc(0, 0, u.r, 0, 6.2832); c.clip(); c.drawImage(im, -u.r, -u.r, u.r * 2, u.r * 2); } else { c.clip(); c.drawImage(im, u.x - u.r, u.y - u.r, u.r * 2, u.r * 2); } c.restore(); }
    else { c.fillStyle = mine(u.side) ? '#3f8f3a' : '#a0392a'; c.fill(); if (u.ic) { c.font = (u.r * 1.2) + 'px sans-serif'; twText(c, u.ic, u.x, u.y + 1); } else if (!u.hero) { c.fillStyle = '#fff'; c.font = '9px sans-serif'; twText(c, u.bld ? '🪨' : '•', u.x, u.y); } }
    c.beginPath(); c.arc(u.x, u.y, u.r, 0, 6.2832); c.lineWidth = 2; c.strokeStyle = mine(u.side) ? '#6cff7a' : '#ff5a4a'; c.stroke();
    if (u.stun > 0) { c.font = '10px sans-serif'; twText(c, '💫', u.x, u.y - u.r - 10); }
    twBar(c, u.x, u.y - u.r - 4, u.r * 2, u.hp / u.max, mine(u.side) ? 0 : 1);
  });
  // заклинания и эффекты
  g.spells.forEach(sp => { c.beginPath(); c.arc(sp.x, sp.y, sp.sp.r, 0, 6.2832); c.fillStyle = sp.sp.freeze ? 'rgba(160,120,255,.25)' : sp.sp.dps ? 'rgba(80,0,120,.35)' : 'rgba(255,200,60,.25)'; c.fill(); });
  g.fx.forEach(f => {
    c.globalAlpha = Math.min(1, f.life / 10);
    if (f.k === 'shot') { c.strokeStyle = mine(f.side) ? '#bfffb0' : '#ffb0a0'; c.lineWidth = f.big ? 2 : 1; c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.stroke(); }
    else if (f.k === 'num') { c.fillStyle = mine(f.side) ? '#ff8a7a' : '#fff'; c.font = 'bold 10px sans-serif'; twText(c, f.v, f.x, f.y - (20 - f.life)); }
    else if (f.k === 'sun' || f.k === 'boom') { c.beginPath(); c.arc(f.x, f.y, (f.r || 40) * (1.2 - f.life / 30), 0, 6.2832); c.fillStyle = f.k === 'sun' ? 'rgba(255,220,80,.5)' : 'rgba(255,120,40,.5)'; c.fill(); }
    else if (f.k === 'ult') { c.strokeStyle = '#ffd36a'; c.lineWidth = 3; c.beginPath(); c.arc(f.x, f.y, 30 - f.life, 0, 6.2832); c.stroke(); }
    c.globalAlpha = 1;
  });
  // призрак карты при перетаскивании
  c.setTransform(k, 0, 0, k, 0, 0);
  if (TB.drag && TB.drag.p && TB.drag.p.inside) { c.globalAlpha = 0.5; c.fillStyle = '#ffd36a'; c.beginPath(); c.arc(TB.drag.p.x, TB.drag.p.y, 16, 0, 6.2832); c.fill(); c.globalAlpha = 1; }
}
function twText(c, t, x, y) {
  if (TB.me !== 1) return c.fillText(t, x, y);
  const k = TB.scale; c.save(); c.setTransform(k, 0, 0, k, (TW.W - x) * k, (TW.H - y) * k); c.fillText(t, 0, 0); c.restore();
}
function twBar(c, x, y, w, v, side) { c.fillStyle = '#000'; c.fillRect(x - w / 2, y - 2, w, 4); c.fillStyle = side === 0 ? '#6cc53f' : '#e0452f'; c.fillRect(x - w / 2, y - 2, w * Math.max(0, v), 4); }

// ---------- конец боя и награды ----------
// Награда за этаж (первое прохождение) = rewardScale × (0.5 + 0.03·этаж). Повтор — ×0.12. Наградных боёв в день — 10.
function twReward(floor, first) { return Math.round(rewardScale() * (first ? TW.reward.base + TW.reward.perFloor * floor : TW.reward.replay)); }
function twFinish() {
  const g = TB.g, mode = TB.mode, floor = TB.floor, T = TS();
  const win = g.win === TB.me, draw = g.win === 2;
  let msg = (win ? '🏆 Победа ' : draw ? '🤝 Ничья ' : '💀 Поражение ') + g.crowns[TB.me] + ':' + g.crowns[1 - TB.me];
  const d = todayStr(); if (T.day.d !== d) T.day = { d, n: 0 };
  if (mode === 'floor' && win) {
    const first = floor >= T.floor;
    T.day.n++;
    const g2 = T.day.n <= TW.rewardedPerDay ? twReward(floor, first) : 0;
    if (g2) addGems(g2);
    msg += ' · этаж ' + floor + (g2 ? ' · +' + fmt(g2) + ' 🔶' : ' · дневной лимит наград исчерпан');
    if (first) {
      T.floor = Math.min(TW.floors, floor + 1); T.best = Math.max(T.best, floor);
      if (floor % 10 === 0 && typeof addEquipment === 'function') { const rar = floor >= 40 ? 'immortal' : floor >= 20 ? 'mythical' : 'rare'; const it = addEquipment(mainHeroId(), rar); msg += ' · 🎁 ' + it.name; }
      if (floor === TW.floors) msg += ' · Башня покорена!';
    }
    twSaveGhost(g);
  }
  if (mode === 'ghost') msg += twGhostResult(win);
  if (mode === 'live' && typeof twLiveResult === 'function') msg += twLiveResult(win, draw);
  if (typeof track === 'function') { track('towerGames'); if (win) track('towerWins'); }
  save(); updateTop();
  const host = document.getElementById('games-host');
  const ov = document.createElement('div'); ov.className = 'tw-over';
  ov.innerHTML = '<div class="cinzel">' + esc(msg) + '</div><div class="rg-row2">' + (mode === 'floor' ? '<button class="btn green" data-click="twAgain()">' + (win ? 'Следующий этаж ➜' : 'Ещё раз') + '</button>' : '') + '<button class="btn" data-click="twQuit()">В меню</button></div>';
  const box = host && host.querySelector('.tw-cv-box'); if (box) box.appendChild(ov);
  sfx(win ? 'win' : 'lose');
  TB.done = true;
}
function twAgain() { const f = TS().floor; twStop(); twStart('floor', { floor: f }); }
function twQuit() {
  if (TB && !TB.done && !TB.g.over && TB.mode !== 'live') { if (!confirmQuit()) return; }
  if (TB && TB.mode === 'live' && !TB.done) twLiveLeave();
  twStop(); startGame_('tower');
}
function confirmQuit() { return TB.g.tick < 90 || window.confirm('Выйти из боя? Это будет поражение.'); }

// ---------- меню «Башни» и колода ----------
function renderTowerMenu() {
  const host = document.getElementById('tower-menu'); if (!host) return;
  const T = TS(), deck = twDeck();
  const f = T.floor;
  host.innerHTML = '<div class="tw-menu"><div class="tw-floor">Этаж <b>' + f + '</b> / ' + TW.floors + (f % 10 === 0 ? ' · 👑 БОСС: Рошан' : '') + '<div class="muted">Бот: ' + ['простой', 'средний', 'сложный'][twBotLvl(f)] + ' · лучший этаж ' + T.best + ' · наградных боёв сегодня ' + (T.day.d === todayStr() ? T.day.n : 0) + '/' + TW.rewardedPerDay + '</div><div>Награда: ' + fmt(twReward(f, true)) + ' 🔶' + (f % 10 === 0 ? ' + предмет' : '') + '</div></div>' +
    '<div class="rg-row2"><button class="btn green big" data-click="twStartFloor()">⚔ Бой за этаж ' + f + '</button></div>' +
    '<div class="rg-row2"><button class="btn" data-click="twGhostFight()">👻 PvP с призраком</button><button class="btn" data-click="twLiveQueue()">⚡ Живой PvP (бета)</button></div>' +
    '<div class="muted" style="font-size:.75rem">MMR Башни: ' + T.mmr + ' · победы ' + T.w + ' / поражения ' + T.l + '</div>' +
    '<div class="sec-sub">Колода (8 карт) — нажми карту, чтобы заменить</div><div class="tw-deck">' + deck.map((c, i) => { const sp = twCardSpec(c, 1); return '<button class="tw-card" data-click="twDeckSwap(' + i + ')">' + twCardFace(sp) + '<b>' + sp.cost + '</b><small>' + esc(sp.n) + '</small></button>'; }).join('') + '</div>' +
    '<div class="muted" style="font-size:.75rem">Как играть: перетащи карту (или нажми карту, потом поле) на свою половину. Юниты сами идут по линиям. Сломай Трон или больше башен за 3 минуты. Последняя минута — мана ×2. Уровень героя даёт до +60% силы карты.</div><div id="tw-board" class="muted"></div></div>';
  twLoadBoard();
}
function twStartFloor() { twStart('floor', { floor: TS().floor }); }
let twSwapI = -1;
function twDeckSwap(i) {
  twSwapI = i;
  const deck = twDeck();
  const heroes = HEROES.map(h => h.id).filter(id => !deck.includes('h:' + id)).sort((a, b) => S.heroes[b].level - S.heroes[a].level).slice(0, 40);
  const extra = TW_EXTRA.filter(c => !deck.includes(c));
  showModal('🃏', 'Заменить карту', '<div class="tw-deck">' + extra.map(c => '<button class="tw-card" data-click="twDeckSet(\'' + c + '\')">' + twCardFace(twCardSpec(c, 1)) + '<b>' + TW_CARDS[c].cost + '</b><small>' + esc(TW_CARDS[c].n) + '</small></button>').join('') +
    heroes.map(id => { const sp = twCardSpec('h:' + id, 1); return '<button class="tw-card" data-click="twDeckSet(\'h:' + id + '\')">' + twCardFace(sp) + '<b>' + sp.cost + '</b><small>' + esc(sp.n) + ' ур.' + S.heroes[id].level + '</small></button>'; }).join('') + '</div>', '', { html: true });
}
function twDeckSet(c) { if (!twCardOk(c) || twSwapI < 0) return; const d = twDeck().slice(); if (d.includes(c)) return; d[twSwapI] = c; TS().deck = d; save(); closeModal(); renderTowerMenu(); }

// ================= PvP: асинхронный «призрак» =================
// После победы на этаже твоя колода и действия сохраняются как «призрак» (tower_ghosts/{uid}).
// Другие игроки сражаются с ним: призрак повторяет твои ходы в те же секунды.
async function twSaveGhost(g) {
  try {
    const c = typeof cloud === 'function' ? cloud() : null; if (!c) return;
    const acts = g.acts.filter(a => a.s === 0).slice(0, 120).map(a => ({ t: a.t, c: a.c, x: a.x, y: a.y }));
    if (acts.length < 3) return;
    const deck = g.deck[0].map(sp => ({ c: sp.c, m: Math.round(sp.mul * 100) / 100 }));
    const T = TS();
    await dbMulti({ ['tower_ghosts/' + c.uid]: { n: USER.nick, deck, acts, seed: g.o.seed, at: SV_TIME }, ['tower_board/' + c.uid]: { n: USER.nick, f: Math.min(TW.floors, T.best), mmr: T.mmr, at: SV_TIME } });
  } catch (e) { console.warn('twSaveGhost', e); }
}
function twCleanGhost(v) {
  if (!v || !Array.isArray(v.deck) || v.deck.length !== 8 || !Array.isArray(v.acts)) return null;
  const deck = v.deck.map(x => ({ c: String(x.c), m: Math.max(0.5, Math.min(1.6, +x.m || 1)) }));
  if (!deck.every(x => twCardOk(x.c))) return null;
  // призрак ходит картами по индексу колоды: действия, которые не совпадут с рукой, просто пропустятся
  const acts = v.acts.filter(a => a && a.t >= 0 && a.c >= 0 && a.c < 8).slice(0, 120).map(a => ({ t: a.t | 0, c: a.c | 0, x: +a.x, y: +a.y }));
  return { n: String(v.n || '???').slice(0, 20), deck, acts, seed: v.seed >>> 0 };
}
async function twGhostFight() {
  const c = typeof cloud === 'function' ? cloud() : null;
  if (!c) return showModal('☁', 'Нужен онлайн', 'PvP доступен после входа в облачный аккаунт.', '');
  try {
    const T = TS();
    const part = await db('GET', 'tower_board', undefined, false, { orderBy: 'mmr', startAt: T.mmr - 300, endAt: T.mmr + 300, limitToFirst: 20 }) || {};
    const ids = Object.keys(part).filter(u => u !== c.uid);
    if (!ids.length) return showModal('👻', 'Нет соперников', 'Пока никто рядом по рейтингу не оставил призрака. Пройди пару этажей — и твой призрак появится для других.', '');
    const uid = ids[Math.floor(Math.random() * ids.length)];
    const gh = twCleanGhost(await db('GET', 'tower_ghosts/' + uid));
    if (!gh) return showModal('👻', 'Призрак повреждён', 'Попробуй ещё раз.', '');
    gh.uid = uid; gh.mmr = part[uid].mmr || 1000;
    twStart('ghost', { ghost: gh, seed: gh.seed });
    twFlash('Против призрака ' + gh.n + ' (MMR ' + gh.mmr + ')');
  } catch (e) { showModal('☁', 'Нет связи', 'Не удалось загрузить соперника: ' + e.message, 'bad'); }
}
function twGhostResult(win) {
  const T = TS(), gh = TB.ghost;
  const exp = 1 / (1 + Math.pow(10, (gh.mmr - T.mmr) / 400));
  const delta = Math.round(30 * ((win ? 1 : 0) - exp));
  T.mmr = Math.max(0, Math.min(5000, T.mmr + delta)); win ? T.w++ : T.l++;
  const d = todayStr(); if (T.day.d !== d) T.day = { d, n: 0 };
  let gems = 0; if (win) { T.day.n++; if (T.day.n <= TW.rewardedPerDay) { gems = Math.round(rewardScale() * TW.reward.pvpWin); addGems(gems); } }
  twBoardPut();
  return ' · MMR ' + (delta >= 0 ? '+' : '') + delta + (gems ? ' · +' + fmt(gems) + ' 🔶' : '');
}
async function twBoardPut() { try { const c = cloud(); if (!c) return; const T = TS(); await db('PATCH', 'tower_board/' + c.uid, { n: USER.nick, f: Math.min(TW.floors, T.best), mmr: T.mmr, at: SV_TIME }); } catch (e) { } }
async function twLoadBoard() {
  const b = document.getElementById('tw-board'); if (!b) return;
  try {
    const d = await db('GET', 'tower_board', undefined, false, { orderBy: 'f', limitToLast: 15 }) || {};
    const rows = Object.values(d).filter(x => x && typeof x.f === 'number').sort((x, y) => y.f - x.f || y.mmr - x.mmr);
    b.innerHTML = rows.length ? '<div class="sec-sub">🏆 Рейтинг Башни</div><table class="rg-tab"><tr><th>#</th><th>Игрок</th><th>Этаж</th><th>MMR</th></tr>' + rows.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.n) + '</td><td>' + x.f + '</td><td>' + x.mmr + '</td></tr>').join('') + '</table>' : '';
  } catch (e) { b.textContent = ''; }
}
