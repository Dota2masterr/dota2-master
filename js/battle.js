// ================= ДВИЖОК БОЯ 2.2 =================
// Бой идёт по ходам. У каждого героя: здоровье, мана, 3 навыка (из js/data-skills.js) и ульта.
// createBattle(...) — пошаговый бой: step(inputs) делает один ход и возвращает события для анимации.
// simulateBattle(...) — тот же бой, прогнанный до конца сразу (шанс победы, симуляции, тесты).
// Ульта копится как раньше: срабатывает на каждое 6-е действие героя (у врага — 5-е, у босса — 4-е).
// В ручном режиме полная ульта ждёт нажатия на иконку героя.
const ULT_EVERY = 6, ENEMY_ULT_EVERY = 5, BOSS_ULT_EVERY = 4;
const ULT_MULT = { nuke: 3.2, crit: 4, aoe: 2, stun: 1.5, heal: 1, shield: 1, buff: 1.5, execute: 2 };
const STATUS_ICON = { stun: '💫', slow: '🐌', silence: '🤐', poison: '☠', shield: '🛡', buff: '⚡', amp: '🔻', summon: '👥' };

// ---------- 2.4: роли, линии, контр-пики ----------
// Роль героя выводится из его ульты и атрибута — так она есть у всех 127 героев.
const ROLE_INFO = {
  carry: { n: 'Керри', i: '🗡', d: 'много урона по одной цели' },
  nuker: { n: 'Нюкер', i: '🔥', d: 'взрывной урон навыками' },
  initiator: { n: 'Инициатор', i: '💥', d: 'прыгает в заднюю линию, оглушает' },
  tank: { n: 'Танк', i: '🛡', d: 'держит удар в передней линии' },
  support: { n: 'Саппорт', i: '💚', d: 'лечит и усиливает своих' }
};
function heroRole(id) {
  if (id === 'roshan' || id === 'creeps') return 'tank';
  const t = ultOf(id).type, a = HERO_BY_ID[id] ? HERO_BY_ID[id].attr : '';
  if (t === 'crit' || t === 'execute') return 'carry';
  if (t === 'nuke') return a === 'agi' ? 'carry' : 'nuker';
  if (t === 'aoe') return 'nuker';
  if (t === 'stun') return a === 'str' ? 'tank' : 'initiator';
  if (t === 'shield') return 'tank';
  if (t === 'heal') return 'support';
  if (t === 'buff') return a === 'agi' ? 'carry' : a === 'str' ? 'tank' : 'support';
  return 'carry';
}
// множитель урона атакующей роли по защищающейся (CONFIG.combat.counter)
function roleMul(a, d) { const c = CONFIG.combat.counter; return (c && c[a] && c[a][d]) || 1; }
function roleLine(role) { return (CONFIG.combat.frontRoles || []).includes(role) ? 'front' : 'back'; }
// кого контрит роль и кто контрит её
function roleBeats(r) { const c = CONFIG.combat.counter[r] || {}; return Object.keys(c).filter(k => c[k] > 1); }
function roleWeakTo(r) { return Object.keys(CONFIG.combat.counter).filter(a => roleMul(a, r) > 1); }

function battleName(u) { return u.name || (HERO_BY_ID[u.id] ? HERO_BY_ID[u.id].name : u.id); }

// team: [{id, p, mods}] ; mods: atk, hp, crit, critMul, ultEvery, ultMul, stunImmune, taken, lifesteal, refresher, aegis, cheese, rapier
// def.team: командные модификаторы {atk, taken, stunExtra, aoe, hp}
// opts: maxTicks, manualUlt, noSkills (старая боёвка — для сравнения баланса)
function createBattle(team, def, rand, opts) {
  rand = rand || Math.random; opts = opts || {};
  const C = CONFIG.combat;
  const TM = Object.assign({ atk: 1, taken: 1, stunExtra: 0, aoe: 1, hp: 1 }, def.team || {});
  const form = 0.85 + rand() * 0.3;
  const useSkills = !opts.noSkills && typeof getSkills === 'function';
  const skillsOf = id => useSkills && SKILL_DB[id] ? getSkills(id) : [];
  const passive = (list, kind) => list.filter(s => s.kind === 'passive' && s.extra === kind).reduce((a, s) => a + s.pow, 0);
  const T = team.map(t => {
    const m = Object.assign({ atk: 1, hp: 1, crit: 0, critMul: 1.9, ultEvery: def.fastUlt ? 3 : ULT_EVERY, ultMul: 1, taken: 1, lifesteal: 0 }, t.mods || {});
    const sk = skillsOf(t.id);
    const max = t.p * 10 * m.hp * TM.hp;
    return {
      id: t.id, owner: t.owner || 0, name: battleName(t), p: t.p, hp: max, max, m, n: 0, alive: true, stun: 0, ult: ultOf(t.id), role: heroRole(t.id), line: roleLine(heroRole(t.id)),
      atk: t.p * form * m.atk * TM.atk * (1 + passive(sk, 'atk')),
      crit: (HERO_BY_ID[t.id] && HERO_BY_ID[t.id].attr === 'agi' ? 0.22 : 0.1) + m.crit + passive(sk, 'crit'),
      ls: m.lifesteal + passive(sk, 'lifesteal'), armor: 1 - passive(sk, 'armor'), eva: passive(sk, 'evasion'), bash: passive(sk, 'bash'),
      regen: C.manaRegen * (1 + passive(sk, 'mana') * 3),
      aegis: !!m.aegis, cheese: !!m.cheese, refresher: !!m.refresher,
      skills: sk.filter(s => !s.ult && s.kind !== 'passive'), cd: {}, mana: C.manaStart, charge: 0,
      silence: 0, slow: 0, shield: 0, shieldT: 0, buff: 1, buffT: 0, amp: 1, ampT: 0, poison: [], summon: null
    };
  });
  const E = def.waves.map(w => {
    const sk = skillsOf(w.id);
    const mode = def.pvp ? 'pvp' : def.roshan ? 'roshan' : def.survival ? 'survival' : null;
    const hpK = opts.noSkills || mode ? 1 : C.enemyHpMul * (C.hpByWaves[def.waves.length] || 1) * ((w.mech && C.mechHp[w.mech]) || 1);
    const hp = w.power * 10 * (w.hpMul || 1) * hpK;
    return {
      id: w.id, name: w.name, p: w.power, hp, max: hp, atk: w.power * def.K * (1 + passive(sk, 'atk')), alive: true, boss: w.boss, stun: 0, n: 0,
      ult: ultOf(w.id), role: heroRole(w.id), rage: 0, mech: w.mech, phase: 0, noExec: w.mech === 'ancient', wt: 0,
      armor: 1 - passive(sk, 'armor'), eva: passive(sk, 'evasion'), ls: passive(sk, 'lifesteal'),
      skills: sk.filter(s => !s.ult && s.kind !== 'passive'), cd: {},
      silence: 0, slow: 0, shield: 0, shieldT: 0, buff: 1, buffT: 0, amp: 1, ampT: 0, poison: [], summon: null, stunImm: 0
    };
  });
  const used = { aegis: false, cheese: false, rapierLost: false };
  const ticks = [];
  let wi = 0, guard = 0, shield = 0, buff = 0;
  let focus = opts.focus || 'auto';           // auto | front | back
  // 2.4: кооп-босс на двоих (def.coop): агро, удар в спину, щит двух ульт, ярость, лечащие помощники, смена агро
  const CO = def.coop ? { aggro: 0, phase: -1, m: [], shield: false, broke: false, ult: [-99, -99], focus: ['auto', 'auto'], pStart: 0, pin: 0, dealt: [0, 0], casts: [] } : null;
  const coAgg = () => coHas('aggro') || coHas('swap');
  const coHas = k => CO && CO.m.includes(k);
  const coopMul = (t, e) => {
    if (!CO || e !== E[0]) return 1;
    let k = CO.shield ? C.coop.shieldMul : 1;
    if (coAgg() && CO.pin > 0) k *= t.owner === CO.aggro ? C.coop.holderMul : C.coop.backstab;
    return k;
  };
  const DM = opts.noSkills ? 1 : (C.dmgMul || 1);
  const backIdx = () => { for (let j = wi + 1; j < E.length; j++) if (E[j].alive) return j; return -1; };
  const backOn = () => !def.roshan && E.length > 1;
  const eEvery = e => def.fastUlt ? 3 : e.boss ? BOSS_ULT_EVERY : ENEMY_ULT_EVERY;
  const eUltSoon = e => (e.n + 1) % eEvery(e) === 0;
  // цель героя: прыгуны (инициаторы) в авто-режиме бьют заднего врага, фокус меняет цель всем
  const targetOf = t => {
    const bi = backOn() ? backIdx() : -1;
    const f = CO ? CO.focus[t.owner] : focus;
    if (bi < 0 || f === 'front') return E[wi];
    if (f === 'back' || t.role === 'initiator') return E[bi];
    return E[wi];
  };
  // идеальный момент для ульты (ручной режим и «умный» бот симуляции)
  const goodTiming = (t, e) => {
    const type = t.ult.type;
    if (type === 'aoe') return backIdx() >= 0;
    if (type === 'stun') return eUltSoon(e) && !(e.stun > 0);
    if (type === 'heal') return T.some(a => a.alive && pct(a) < 0.4);
    if (type === 'shield') return eUltSoon(e);
    if (type === 'execute') return pct(e) < 0.35 && !e.noExec;
    return e.stun > 0 || e.ampT > 0 || e.slow > 0 || pct(e) < 0.3;
  };
  const maxTicks = opts.maxTicks || 400;
  const H = C.heroSkillMul, EM = C.enemySkillMul;
  const pct = u => u.hp / u.max;

  const hurt = (ti, d, ev) => {
    const t = T[ti]; if (!t.alive) return;
    t.hp = Math.max(0, t.hp - d);
    t.mana = Math.min(100, t.mana + C.manaOnHit);
    if (t.hp <= 0) {
      if (t.aegis) { t.aegis = false; used.aegis = true; t.hp = t.max; ev.push({ k: 'aegis', to: ti }); return; }
      t.alive = false; ev.push({ k: 'tkill', to: ti });
      if (ti === 0 && t.m.rapier) { used.rapierLost = true; ev.push({ k: 'rapier' }); }
    } else if (t.cheese && t.hp < t.max * 0.25) { t.cheese = false; used.cheese = true; t.hp = t.max; ev.push({ k: 'cheese', to: ti }); }
  };
  const heroTaken = ti => (shield > 0 ? 0.45 : 1) * TM.taken * T[ti].m.taken * T[ti].armor * (T[ti].shieldT > 0 ? 1 - T[ti].shield : 1) * (T[ti].ampT > 0 ? T[ti].amp : 1);
  const OUT = opts.noSkills ? 1 : (C.modeOut[def.pvp ? 'pvp' : def.roshan ? 'roshan' : def.survival ? 'survival' : 'arena'] || 1);
  const hitE = (e, dmg) => { const d = dmg * OUT * e.armor * (e.ampT > 0 ? e.amp : 1) * (e.shieldT > 0 ? 1 - e.shield : 1); e.hp = Math.max(0, e.hp - d); return d; };
  // боссы устойчивее: оглушение не больше 1 хода и дольше иммунитет
  const stunEnemy = (e, dur) => { if (e.stunImm > 0) return false; if (e.boss) dur = 1; e.stun = Math.max(e.stun, dur); e.stunImm = dur + C.stunImmune + (e.boss ? C.bossResist : 0); return true; };
  const tickDown = u => { ['silence', 'slow', 'shieldT', 'buffT', 'ampT'].forEach(k => { if (u[k] > 0) u[k]--; }); if (u.stunImm > 0) u.stunImm--; for (const k in u.cd) if (u.cd[k] > 0) u.cd[k]--; };
  const statusOf = u => {
    const s = [];
    if (u.stun > 0) s.push('stun'); if (u.slow > 0) s.push('slow'); if (u.silence > 0) s.push('silence'); if (u.poison.length) s.push('poison');
    if (u.shieldT > 0) s.push('shield'); if (u.buffT > 0) s.push('buff'); if (u.ampT > 0) s.push('amp'); if (u.summon) s.push('summon');
    return s;
  };
  // выбор навыка: лечение — если кто-то ранен, щит — если сам ранен, остальное — по порядку
  const pickSkill = (u, allies) => {
    if (u.silence > 0) return null;
    const ready = u.skills.filter(s => !(u.cd[s.key] > 0) && (u.mana == null || u.mana >= s.mana));
    if (!ready.length) return null;
    const low = pct(u) < 0.6;                    // 2.4.5: навык лечения лечит только самого героя
    for (const s of ready) {
      if (s.kind === 'heal' && !low) continue;
      if (s.kind === 'shield' && pct(u) > 0.85) continue;
      if (s.kind === 'summon' && u.summon) continue;
      if (s.kind === 'buff' && u.buffT > 0) continue;
      return s;
    }
    return null;
  };

  // ---------- ход героя ----------
  function heroAct(i, e0, ev, night, inputs) {
    const t = T[i];
    let e = targetOf(t);
    if (t.stun > 0) { t.stun--; ev.push({ k: 'stunned', who: i }); return; }
    t.mana = Math.min(100, t.mana + t.regen);
    const ready = t.charge >= t.m.ultEvery - 1 && !(t.doom > 0);
    if (ready && (opts.smartUlt || (opts.smartSet && opts.smartSet.includes(i))) && !inputs.includes(i)) { t.wait = (t.wait || 0) + 1; if (goodTiming(t, E[wi]) || t.wait > 2) inputs.push(i); }
    const pressed = inputs.includes(i);
    const isUlt = ready && t.silence <= 0 && (!(opts.manualUlt || opts.smartUlt) || pressed);
    // ульта всегда бьёт переднего врага (АоЕ задевает остальных)
    if (isUlt) e = E[wi];
    const ew = E.indexOf(e);
    const atk = DM * coopMul(t, e) * roleMul(t.role, e.role) * (ew !== wi && (CO ? CO.focus[t.owner] : focus) === 'back' && t.role !== 'initiator' ? C.backReach : 1) * t.atk * (buff > 0 ? 1.3 : 1) * (t.buffT > 0 ? t.buff : 1) * (t.slow > 0 ? 0.8 : 1) * (night ? 0.7 : 1) * (0.8 + rand() * 0.4);
    let dealt = 0;
    if (isUlt) {
      t.charge = 0; t.n++; t.wait = 0; if (CO) { CO.ult[t.owner] = guard; CO.casts.push(i); }
      const timing = (opts.manualUlt || opts.smartUlt) && goodTiming(t, e);
      if (timing && t.ult.type === 'stun') e.n -= e.n % eEvery(e);        // сбили ульту врага
      const casts = t.refresher ? 2 : 1; if (t.refresher) t.refresher = false;
      for (let c = 0; c < casts && e.alive; c++) {
        const type = t.ult.type;
        let mult = (type === 'aoe' ? ULT_MULT.aoe * TM.aoe : (ULT_MULT[type] || 2)) * t.m.ultMul;
        let exec = false;
        if (type === 'execute' && pct(e) < 0.35 && !e.noExec) { exec = true; mult = 0; }
        if (timing && !exec) mult *= C.ultTiming;
        const d = exec ? e.hp : hitE(e, atk * mult);
        if (exec) e.hp = 0;
        dealt += d;
        const x = { k: 'ult', from: i, type, dmg: Math.round(d), exec, hp: pct(e), wave: wi, refresh: c > 0, timing };
        if (type === 'aoe') { x.splash = []; for (let j = wi + 1; j < E.length; j++) { if (!E[j].alive) continue; const sd = atk * 0.7 * TM.aoe * (timing ? C.ultTiming : 1); E[j].hp = Math.max(E[j].max * 0.05, E[j].hp - sd); x.splash.push(j); } }
        if (type === 'stun') { e.stun = Math.max(e.stun, 2 + TM.stunExtra); e.stunImm = 0; }
        if (type === 'heal') { x.heal = []; T.forEach((a, ai) => { if (a.alive) { a.hp = Math.min(a.max, a.hp + a.max * 0.2 * t.m.ultMul * (timing ? C.ultTiming : 1)); x.heal.push([ai, pct(a)]); } }); }
        if (type === 'shield') shield = timing ? 3 : 2;
        if (type === 'buff') buff = 3;
        x.log = t.name + ': ' + t.ult.name + (exec ? ' — добивание!' : d ? ' (' + Math.round(d) + ')' : '') + (timing ? ' — идеальный момент! ×' + C.ultTiming : '');
        ev.push(x);
        afterHit(e, ev);
      }
    } else {
      if (!ready) t.charge++; else if (!opts.manualUlt) t.charge++;
      t.n++;
      const s = pickSkill(t, T);
      if (s) {
        t.cd[s.key] = s.cd; t.mana -= s.mana;
        dealt = heroSkill(i, s, e, atk, ev);
      } else {
        const crit = rand() < t.crit;
        const miss = (e.mech === 'void' && rand() < 0.2) || (e.eva && rand() < e.eva);
        const d = miss ? 0 : hitE(e, atk * (crit ? t.m.critMul : 1));
        dealt = d;
        ev.push({ k: 'hit', from: i, dmg: Math.round(d), crit, miss, hp: pct(e), wave: ew });
        if (t.bash && !miss && e.alive && rand() < t.bash && stunEnemy(e, 1)) ev.push({ k: 'log', text: t.name + ' оглушил ' + e.name + ' ударом' });
      }
      afterHit(e, ev);
    }
    if (t.summon && e.alive) {
      const d = hitE(e, t.summon.d); dealt += d;
      ev.push({ k: 'hit', from: i, dmg: Math.round(d), summon: true, hp: pct(e), wave: E.indexOf(e) });
      if (--t.summon.t <= 0) t.summon = null;
      afterHit(e, ev);
    }
    if (t.ls && dealt) t.hp = Math.min(t.max, t.hp + dealt * t.ls);
    if (CO) t.dealtT = (t.dealtT || 0) + dealt;
  }
  function heroSkill(i, s, e, atk, ev) {
    const t = T[i];
    const x = { k: 'skill', from: i, key: s.key, name: s.name, kind: s.kind, wave: E.indexOf(e), dmg: 0 };
    let d = 0;
    const base = atk * s.pow * H;
    // Войд уклоняется и от навыков (20%), на него не действует безмолвие
    if (e.mech === 'void' && rand() < 0.2 && !['heal', 'shield', 'buff', 'summon'].includes(s.kind)) { x.miss = true; x.hp = pct(e); x.log = t.name + ': ' + s.name + ' — промах по Войду'; ev.push(x); return 0; }
    switch (s.kind) {
      case 'dmg': d = hitE(e, base); x.log = t.name + ': ' + s.name + ' по ' + e.name; break;
      case 'aoe':
        d = hitE(e, base); x.splash = [];
        { const j = backIdx(); if (j >= 0 && E[j] !== e) { E[j].hp = Math.max(E[j].max * 0.05, E[j].hp - base * 0.35); x.splash.push(j); } }
        x.log = t.name + ': ' + s.name + ' — удар по всем'; break;
      case 'stun': d = hitE(e, base); x.stun = stunEnemy(e, s.dur + TM.stunExtra); x.log = x.stun ? t.name + ' оглушил ' + e.name + ' (' + s.name + ')' : t.name + ': ' + s.name + ' — ' + e.name + ' устоял'; break;
      case 'slow': d = hitE(e, base); e.slow = Math.max(e.slow, s.dur); x.log = t.name + ' замедлил ' + e.name + ' (' + s.name + ')'; break;
      case 'silence': d = hitE(e, base); if (e.mech !== 'void') e.silence = Math.max(e.silence, e.boss ? 1 : s.dur); x.log = t.name + ' наложил безмолвие на ' + e.name; break;
      case 'dot': e.poison.push({ d: base, t: s.dur }); x.log = t.name + ' отравил ' + e.name + ' (' + s.name + ')'; break;
      case 'debuff': e.amp = s.pow; e.ampT = s.dur; d = hitE(e, atk * 0.6 * H); x.log = t.name + ' ослабил ' + e.name + ': урон по нему ×' + s.pow; break;
      case 'heal': {
        // 2.4.5: обычный навык лечит только самого героя; всю команду лечит ульта (type 'heal')
        t.hp = Math.min(t.max, t.hp + t.max * s.pow); x.to = i; x.thp = pct(t);
        x.log = t.name + ' лечит себя (' + s.name + ')'; break;
      }
      case 'shield': t.shield = s.pow; t.shieldT = s.dur + 1; x.log = t.name + ': ' + s.name + ' — щит'; break;
      case 'buff': t.buff = s.pow; t.buffT = s.dur + 1; x.log = t.name + ' усиливается (' + s.name + ')'; break;
      case 'summon': t.summon = { d: base, t: s.dur }; x.log = t.name + ' призывает помощника (' + s.name + ')'; break;
      default: d = hitE(e, base); x.log = t.name + ': ' + s.name;
    }
    x.dmg = Math.round(d); x.hp = pct(e);
    ev.push(x);
    return d;
  }
  function afterHit(e, ev) {
    if (e.alive && e.hp <= 0) { e.alive = false; ev.push({ k: 'ekill', wave: E.indexOf(e) }); }
    if (e.alive && e.mech === 'ancient' && !e.phase && e.hp < e.max * 0.5) {
      e.phase = 1; e.hp = e.max * 0.75; e.atk *= 1.3;
      T.forEach(a => { if (a.alive && !a.m.stunImmune) a.stun = Math.max(a.stun, 1); });
      ev.push({ k: 'mech', text: '🏛 Древний во 2-й фазе: лечится, оглушает команду и звереет!', ehp: pct(e) });
    }
  }

  // враг выбирает цель: обычно передняя линия, прыгуны (инициаторы) — задняя
  function pickHero(e, alive) {
    if (CO && e === E[0] && coAgg()) { const hold = alive.filter(i => T[i].owner === CO.aggro); if (hold.length) alive = hold; }
    const front = alive.filter(i => T[i].line === 'front'), back = alive.filter(i => T[i].line === 'back');
    let pool;
    if (e.role === 'initiator') pool = back.length && rand() < C.jumpBack ? back : (front.length ? front : back);
    else pool = front.length && rand() < C.frontShare ? front : (back.length ? back : front);
    return pool[Math.floor(rand() * pool.length)];
  }
  // задний враг бьёт издалека слабее и реже
  function backAct(ev) {
    const j = backIdx(); if (j < 0) return;
    const b = E[j]; if (b.stun > 0) { b.stun--; return; }
    b.bt = (b.bt || 0) + 1; if (b.bt % 2) return;
    const alive = T.map((t, i) => i).filter(i => T[i].alive); if (!alive.length) return;
    const ti = pickHero(b, alive);
    const d = b.atk * C.backPoke * (0.8 + rand() * 0.4) * DM * roleMul(b.role, T[ti].role) * heroTaken(ti);
    const x = { k: 'ehit', to: ti, dmg: Math.round(d), hp: 0, wave: j, back: true };
    ev.push(x); hurt(ti, d, ev); x.hp = pct(T[ti]);
  }
  // ---------- ход врага ----------
  function enemyAct(e, ev, night) {
    // яд на враге
    if (e.poison.length) {
      let pd = 0; e.poison.forEach(p => { pd += hitE(e, p.d); p.t--; }); e.poison = e.poison.filter(p => p.t > 0);
      ev.push({ k: 'poison', dmg: Math.round(pd), hp: pct(e), wave: wi });
      afterHit(e, ev); if (!e.alive) return;
    }
    const alive = T.map((t, i) => i).filter(i => T[i].alive);
    if (!alive.length) return;
    // яд на героях
    alive.forEach(ti => { const t = T[ti]; if (t.poison.length) { let pd = 0; t.poison.forEach(p => { pd += p.d; p.t--; }); t.poison = t.poison.filter(p => p.t > 0); hurt(ti, pd * heroTaken(ti), ev); ev.push({ k: 'tpoison', to: ti, dmg: Math.round(pd), hp: pct(t) }); } });
    const alive2 = alive.filter(i => T[i].alive); if (!alive2.length) return;
    if (e.stun > 0) { e.stun--; ev.push({ k: 'estunned' }); return; }
    e.n++;
    const every = def.fastUlt ? 3 : e.boss ? BOSS_ULT_EVERY : ENEMY_ULT_EVERY;
    const dm = (e.rage > 0 ? 1.4 : 1) * (night ? 1.6 : 1) * (e.slow > 0 ? 0.8 : 1) * (e.buffT > 0 ? e.buff : 1);
    const tk = ti => DM * roleMul(e.role, T[ti].role) * dm * heroTaken(ti) * (CO && coAgg() && e === E[0] ? (CO.pin > 0 && T[ti].owner === CO.aggro ? C.coop.holderTaken : CO.pin > 0 ? 1 : C.coop.loose) : 1);
    const dodge = ti => T[ti].eva && rand() < T[ti].eva;
    const rndT = () => pickHero(e, alive2);
    if (e.boss && e.mech === 'doom' && (e.n === 1 || e.n % 3 === 0)) {
      const cand = alive2.filter(ti => !(T[ti].doom > 0)).sort((a, b) => T[b].atk - T[a].atk);
      if (cand.length) { T[cand[0]].doom = 4; ev.push({ k: 'mech', text: '🔥 Doom проклинает ' + T[cand[0]].name + ': 4 хода без ульты' }); }
    }
    let didSkill = false;
    if (e.n % every === 0 && e.silence <= 0) {
      const type = e.ult.type;
      const x = { k: 'eult', type, hits: [], log: e.name + ': ' + e.ult.name };
      ev.push(x);
      if (e.boss && e.mech === 'void') { alive2.forEach(ti => { T[ti].stun = Math.max(T[ti].stun, 1); }); ev.push({ k: 'mech', text: '⏳ Хроносфера! Команда замерла' }); }
      const after = [];
      if (type === 'aoe' || (e.boss && type !== 'heal')) {
        alive2.forEach(ti => { const d = e.atk * (0.8 + rand() * 0.4) * 0.6 * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]); });
      } else if (type === 'stun') {
        const ti = rndT();
        if (!T[ti].m.stunImmune) { T[ti].stun = 2; x.stunned = ti; } else x.bkb = ti;
        const d = e.atk * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
      } else if (type === 'heal') {
        e.hp = Math.min(e.max, e.hp + e.max * 0.15); x.ehp = pct(e);
      } else if (type === 'buff' || type === 'shield') {
        e.rage = 2; const ti = rndT(); const d = e.atk * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
      } else {
        const ti = rndT(); const d = e.atk * 2.5 * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
      }
      after.forEach(([ti, d], hi) => { hurt(ti, d, ev); x.hits[hi][2] = pct(T[ti]); });
    } else {
      const s = pickSkill(e, null);
      if (s && e.n % 2 === 0) { didSkill = true; e.cd[s.key] = s.cd + C.enemySkillCdAdd; enemySkill(e, s, ev, tk, rndT, alive2, dodge); }
      else {
        const ti = rndT();
        const miss = dodge(ti);
        const dmg = miss ? 0 : e.atk * (0.8 + rand() * 0.4) * tk(ti);
        const x = { k: 'ehit', to: ti, dmg: Math.round(dmg), miss, hp: 0, wave: wi };
        ev.push(x); hurt(ti, dmg, ev); x.hp = pct(T[ti]);
        if (e.ls && dmg) e.hp = Math.min(e.max, e.hp + dmg * e.ls);
      }
    }
    if (e.summon) {
      const ti = alive2.filter(i => T[i].alive)[0];
      if (ti != null) { const d = e.summon.d * tk(ti); hurt(ti, d, ev); ev.push({ k: 'ehit', to: ti, dmg: Math.round(d), summon: true, hp: pct(T[ti]), wave: wi }); }
      if (--e.summon.t <= 0) e.summon = null;
    }
    if (e.rage > 0) e.rage--;
    return didSkill;
  }
  function enemySkill(e, s, ev, tk, rndT, alive, dodge) {
    const base = e.atk * s.pow * EM;
    const x = { k: 'eskill', key: s.key, name: s.name, kind: s.kind, hits: [] };
    const hit = (ti, mul) => { if (dodge(ti)) { x.hits.push([ti, 0, pct(T[ti])]); return; } const d = base * (mul || 1) * tk(ti); hurt(ti, d, ev); x.hits.push([ti, Math.round(d), pct(T[ti])]); };
    const ti = rndT(), tn = T[ti].name;
    switch (s.kind) {
      case 'aoe': alive.forEach(a => hit(a, 0.3)); x.log = e.name + ': ' + s.name + ' по всей команде'; break;
      case 'stun': hit(ti); if (!T[ti].m.stunImmune && T[ti].alive) { T[ti].stun = Math.max(T[ti].stun, 1); x.stunned = ti; x.log = e.name + ' оглушил ' + tn + ' (' + s.name + ')'; } else { x.bkb = ti; x.log = tn + ' не поддался оглушению'; } break;
      case 'slow': hit(ti); T[ti].slow = Math.max(T[ti].slow, s.dur + 1); x.st = ti; x.log = e.name + ' замедлил ' + tn; break;
      case 'silence': hit(ti); T[ti].silence = Math.max(T[ti].silence, s.dur + 1); x.st = ti; x.log = e.name + ' наложил безмолвие на ' + tn; break;
      case 'dot': T[ti].poison.push({ d: base * 0.6, t: s.dur }); x.st = ti; x.hits.push([ti, 0, pct(T[ti])]); x.log = e.name + ' отравил ' + tn; break;
      case 'debuff': T[ti].amp = s.pow; T[ti].ampT = s.dur + 1; x.st = ti; hit(ti, 0.5); x.log = e.name + ' ослабил ' + tn; break;
      case 'heal': e.hp = Math.min(e.max, e.hp + e.max * s.pow * 0.5); x.ehp = pct(e); x.log = e.name + ' лечится (' + s.name + ')'; break;
      case 'shield': e.shield = s.pow; e.shieldT = s.dur + 1; x.log = e.name + ': ' + s.name + ' — щит'; break;
      case 'buff': e.buff = s.pow; e.buffT = s.dur + 1; x.log = e.name + ' усиливается (' + s.name + ')'; break;
      case 'summon': e.summon = { d: e.atk * s.pow * EM * 0.6, t: s.dur }; x.log = e.name + ' призывает помощника'; break;
      default: hit(ti); x.log = e.name + ': ' + s.name + ' по ' + tn;
    }
    ev.push(x);
  }

  // ---------- один ход боя ----------
  // фазы и механики кооп-босса
  function coopTick(ev) {
    const b = E[0]; if (!b.alive) return;
    const ph = def.coop.phases; let p = 0; ph.forEach((x, k) => { if (pct(b) <= x.at) p = k; });
    if (p !== CO.phase) {
      CO.phase = p; CO.m = ph[p].m.slice(); CO.pStart = guard; CO.broke = false;
      CO.shield = coHas('shield');
      if (coHas('enrage') && !b.enraged) { b.enraged = true; b.atk *= C.coop.enrageAtk; }
      ev.push({ k: 'mech', text: '⚠ ' + b.name + ' — фаза ' + (p + 1) + ': ' + ph[p].t, co: 1 });
    }
    if (coHas('swap') && guard > 0 && guard % 5 === 4) ev.push({ k: 'mech', text: '🔄 Через ход ' + b.name + ' сменит цель!', co: 1 });
    if (coHas('swap') && guard > 0 && guard % 5 === 0) { CO.aggro ^= 1; CO.pin = 0; ev.push({ k: 'mech', text: '🔄 Агро на игроке ' + (CO.aggro + 1) + ': второй бьёт в спину ×' + C.coop.backstab, co: 1 }); }
    if (coHas('heal')) { let n = 0; for (let j = 1; j < E.length; j++) if (E[j].alive) n++; if (n) { b.hp = Math.min(b.max, b.hp + b.max * C.coop.addHeal * n); if (guard % 3 === 0) ev.push({ k: 'mech', text: '💚 Помощники лечат босса (' + n + '). Один из вас — фокус на задних!', ehp: pct(b), co: 1 }); } }
    if (coHas('enrage') && guard % 3 === 0) { const al = T.map((t, i) => i).filter(i => T[i].alive); al.forEach(ti => hurt(ti, b.atk * 0.35 * DM * heroTaken(ti), ev)); ev.push({ k: 'eult', type: 'aoe', hits: al.map(ti => [ti, Math.round(b.atk * 0.35), pct(T[ti])]), log: b.name + ': ярость — удар по всем' }); }
  }
  function coopAfterHeroes(ev) {
    const casts = CO.casts; CO.casts = [];
    // без «держателя» агро цель босса — тот, кто больше нанёс урона за ход (угроза)
    const d0 = T.filter(t => t.owner === 0).reduce((a, t) => a + (t.dealtT || 0), 0), d1 = T.filter(t => t.owner === 1).reduce((a, t) => a + (t.dealtT || 0), 0);
    T.forEach(t => { t.dealtT = 0; });
    if (CO.pin > 0) CO.pin--; else if (coHas('aggro') && d0 !== d1) CO.aggro = d0 > d1 ? 0 : 1;
    if (!CO.shield || CO.broke) return;
    const own = [0, 1].map(o => casts.some(i => T[i].owner === o));
    if (own[0] && own[1]) { CO.shield = false; CO.broke = true; ev.push({ k: 'mech', text: '💥 Ульты обоих игроков в один ход — щит босса сломан!', co: 1 }); return; }
    // ульта одного игрока бьёт в щит и отражается в кастующего
    casts.forEach(i => { if (T[i].alive) { hurt(i, T[i].max * C.coop.reflect, ev); ev.push({ k: 'mech', text: '🔁 Щит отразил ульту ' + T[i].name + ' — жмите вместе!', co: 1 }); } });
  }
  function step(inputs) {
    inputs = inputs || [];
    if (api.done) return null;
    const ev = [];
    if (CO) {
      inputs.filter(x => typeof x === 'string').forEach(x => { const p = x.split(':'); if (p[0] === 'taunt' && coAgg()) { const o = +p[1] ? 1 : 0; if (coHas('aggro') || o === CO.aggro) { const was = CO.pin > 0 && CO.aggro === o; CO.aggro = o; CO.pin = C.coop.tauntTicks; if (!was) ev.push({ k: 'mech', text: '🛡 Игрок ' + (o + 1) + ' держит агро ' + C.coop.tauntTicks + ' хода: второй бьёт в спину', co: 1 }); } } if (p[0] === 'focus') CO.focus[+p[1] ? 1 : 0] = ['auto', 'front', 'back'].includes(p[2]) ? p[2] : 'auto'; });
      inputs = inputs.filter(x => typeof x === 'number');
      coopTick(ev);
    }
    const e = E[wi];
    e.wt++;
    const night = e.mech === 'night' && e.wt <= 10;
    if (e.mech === 'night' && e.wt === 1) ev.push({ k: 'mech', text: '🌙 Наступила ночь: Night Stalker сильнее, твои атаки слабее' });
    if (e.mech === 'night' && e.wt === 11) ev.push({ k: 'mech', text: '☀ Рассвет! Ночь кончилась' });
    T.forEach((t, ti) => { if (t.alive && t.doom > 0) { t.doom--; hurt(ti, t.max * 0.08, ev); } });
    for (let i = 0; i < T.length && e.alive; i++) if (T[i].alive) heroAct(i, e, ev, night, inputs);
    if (CO) coopAfterHeroes(ev);
    // Торментор: 12% полученного за ход урона возвращается случайному герою
    if (e.mech === 'tormentor') { const lost = (e.prevHp != null ? e.prevHp : e.max) - e.hp; e.prevHp = e.hp; const al = T.map((t, i) => i).filter(i => T[i].alive); if (lost > 0 && al.length) { const ti = al[Math.floor(rand() * al.length)]; hurt(ti, lost * 0.12, ev); ev.push({ k: 'ehit', to: ti, dmg: Math.round(lost * 0.12), hp: pct(T[ti]), wave: wi }); } }
    if (e.alive) { enemyAct(e, ev, night); if (backOn() && T.some(t => t.alive)) backAct(ev); }
    else { wi++; while (wi < E.length && !E[wi].alive) wi++; if (wi < E.length) { ev.push({ k: 'wave', wave: wi, hp: pct(E[wi]), back: backIdx() }); if (E[wi].mech) ev.push({ k: 'mech', text: '⚠ БОСС: ' + E[wi].name }); } }
    if (shield > 0) shield--; if (buff > 0) buff--;
    T.forEach(tickDown); if (wi < E.length) tickDown(E[wi]);
    // снимок состояния для полосок маны, ульты и значков статусов
    ev.push({
      k: 'st', m: T.map(t => t.mana / 100), c: T.map(t => Math.min(1, t.charge / (t.m.ultEvery - 1))), r: T.map(t => t.alive && t.charge >= t.m.ultEvery - 1 && !(t.doom > 0)),
      s: T.map(t => t.alive ? statusOf(t) : []), es: wi < E.length ? statusOf(E[wi]) : [], ehp: wi < E.length ? pct(E[wi]) : 0,
      eu: wi < E.length ? (E[wi].n % eEvery(E[wi])) / (eEvery(E[wi]) - 1) : 0, bi: backOn() && wi < E.length ? backIdx() : -1,
      bhp: backOn() && backIdx() >= 0 ? pct(E[backIdx()]) : 0, co: CO ? { a: CO.aggro, p: CO.phase, sh: CO.shield, m: CO.m, pin: CO.pin } : null, g: T.map(t => t.alive && t.charge >= t.m.ultEvery - 1 && wi < E.length && goodTiming(t, E[wi]))
    });
    ticks.push(ev);
    guard++;
    if (wi >= E.length || !T.some(t => t.alive) || guard >= maxTicks) api.done = true;
    return ev;
  }
  function result() {
    const dmgDealt = E.reduce((a, x) => a + (x.max - x.hp), 0);
    return { win: wi >= E.length, cleared: E.filter(x => !x.alive).length, ticks, alive: T.filter(t => t.alive).length, used, wavesCleared: wi, dmgDealt, enemyHp: E.map(x => pct(x)) };
  }
  // до конца без ручного управления (кнопка «Пропустить»)
  function finish() { opts.manualUlt = false; opts.smartUlt = false; while (!api.done) step([]); return result(); }
  const api = { done: false, step, result, finish, T, E, setManual(v) { opts.manualUlt = !!v; }, setFocus(f) { focus = ['auto', 'front', 'back'].includes(f) ? f : 'auto'; }, setSmart(list) { opts.smartSet = list; }, get co() { return CO; }, get focus() { return focus; }, get wave() { return wi; } };
  if (!E.length || !T.length) api.done = true;
  return api;
}
function simulateBattle(team, def, rand, opts) {
  const b = createBattle(team, def, rand, Object.assign({}, opts || {}, { manualUlt: false }));
  while (!b.done) b.step([]);
  return b.result();
}
