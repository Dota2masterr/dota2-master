// ================= ARENA: 100 уровней, 4 локации, All Pick =================
const LOCS = [
  { id: 'top', name: 'Верхний лайн', from: 1, to: 25, tab: 'loc-top', g: 'g-top',
    pool: ['axe','centaur','tidehunter','mars','bristleback','dark_seer','beastmaster','magnataur','primal_beast','sand_king','slardar','legion_commander','abyssal_underlord','batrider','brewmaster','pangolier','timbersaw','shredder','visage','omniknight'],
    boss: 'doom_bringer', bossName: 'Doom — хозяин верхнего лайна',
    mech: 'doom', mechText: 'Проклятие Doom: с первого хода и потом каждые 3 хода самый сильный твой герой на 4 хода теряет ульту и горит (−8% здоровья за ход).' },
  { id: 'bot', name: 'Нижний лайн', from: 26, to: 50, tab: 'loc-bot', g: 'g-bot',
    pool: ['phantom_assassin','juggernaut','antimage','spectre','medusa','luna','drow_ranger','sven','terrorblade','lion','crystal_maiden','witch_doctor','lich','jakiro','gyrocopter','troll_warlord','naga_siren','phantom_lancer','vengefulspirit','dazzle'],
    boss: 'faceless_void', bossName: 'Faceless Void — хранитель времени',
    mech: 'void', mechText: 'Хроносфера: раз в 4 хода вся команда замирает на ход (BKB не спасает). 20% обычных атак по Войду — промах.' },
  { id: 'jungle', name: 'Лес', from: 51, to: 75, tab: 'loc-jungle', g: 'g-jungle',
    pool: ['lycan','ursa','enchantress','chen','broodmother','lone_druid','life_stealer','bloodseeker','furion','treant','riki','nyx_assassin','bounty_hunter','hoodwink','night_stalker','slark','weaver','clinkz','undying','venomancer'],
    boss: 'night_stalker', bossName: 'Night Stalker — ужас леса',
    mech: 'night', mechText: 'Ночь: первые 10 ходов боя с ним его удары ×1.6, а твои атаки −30%. Продержись до рассвета.' },
  { id: 'mid', name: 'Мид', from: 76, to: 100, tab: 'loc-mid', g: 'g-mid',
    pool: ['invoker','nevermore','queenofpain','storm_spirit','ember_spirit','void_spirit','puck','templar_assassin','zuus','lina','obsidian_destroyer','tinker','kunkka','morphling','arc_warden','huskar','leshrac','monkey_king','kez','muerta'],
    boss: 'elder_titan', bossName: 'The Ancient — Древний',
    mech: 'ancient', mechText: 'Две фазы: на 50% здоровья Древний лечится до 75%, оглушает команду на ход и бьёт на 30% сильнее. Добивание не действует.' }
];
function locOf(L) { return LOCS.find(l => L >= l.from && L <= l.to); }
function reqPower(L) { const A = CONFIG.arena; return Math.round(A.reqBase * Math.pow(A.reqGrowth, L - 1)); }
function lvlReward(L) { const A = CONFIG.arena; return Math.round(A.rewardBase * Math.pow(A.rewardGrowth, L - 1)); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function levelDef(L) {
  const loc = locOf(L), r = seeded(L * 7919 + 13);
  const n = 3 + Math.floor((L - 1) / 25);           // 3..6 волн
  const w = []; for (let i = 0; i < n - 1; i++) w.push(1 + 0.15 * i); w.push(2.2);
  const sw = w.reduce((a, b) => a + b, 0);
  const R = reqPower(L);
  const pool = loc.pool.filter(id => HERO_BY_ID[id]);
  const used = new Set();
  const waves = w.map((x, i) => {
    let id;
    if (i === n - 1 && L % 25 === 0) id = loc.boss;
    else { do { id = pool[Math.floor(r() * pool.length)]; } while (used.has(id) && used.size < pool.length); }
    used.add(id);
    const big = i === n - 1 && L % 25 === 0;
    return { id, power: Math.round(R * x / sw * (big ? CONFIG.arena.bossMechPowerMul : 1)), boss: i === n - 1, name: big ? loc.bossName : HERO_BY_ID[id].name, mech: big ? loc.mech : undefined };
  });
  const K = CONFIG.arena.kBase * (1 + CONFIG.arena.kGrowth * (L - 1)) / w.reduce((a, x) => a + (x / sw) * (x / sw), 0);
  return { L, loc, waves, R, K, reward: lvlReward(L), skin: L % 4 === 0, eq: L % 2 === 0, mechText: L % 25 === 0 ? loc.mechText : '' };
}

// лимит наградных повторов в сутки (CONFIG.arena.replayRewardedPerDay)
function replayFactor() {
  const d = todayStr(); if (!S.replayDay || S.replayDay.d !== d) S.replayDay = { d, n: 0 };
  S.replayDay.n++;
  return S.replayDay.n > CONFIG.arena.replayRewardedPerDay ? CONFIG.arena.replayOverMul : 1;
}
// ---- чистая симуляция боя (результат считается заранее, анимация его проигрывает) ----
// у каждого героя своя ульта (ULTS): копится 6 атак, затем срабатывает её эффект
const ULT_EVERY = 6, ENEMY_ULT_EVERY = 5, BOSS_ULT_EVERY = 4;
// team: [{id, p, mods}] ; mods (необязательно): atk, hp, crit, critMul, ultEvery, ultMul, stunImmune, taken, lifesteal, refresher, aegis, cheese
// def.team (необязательно): командные модификаторы {atk, taken, stunExtra, aoe}
function simulateBattle(team, def, rand, opts) {
  rand = rand || Math.random; opts = opts || {};
  const TM = Object.assign({ atk: 1, taken: 1, stunExtra: 0, aoe: 1, hp: 1 }, def.team || {});
  const form = 0.85 + rand() * 0.3;            // «форма» команды в этом матче
  const T = team.map(t => {
    const m = Object.assign({ atk: 1, hp: 1, crit: 0, critMul: 1.9, ultEvery: ULT_EVERY, ultMul: 1, taken: 1, lifesteal: 0 }, t.mods || {});
    const max = t.p * 10 * m.hp * TM.hp;
    return { id: t.id, p: t.p, hp: max, max, atk: t.p * form * m.atk * TM.atk, crit: (HERO_BY_ID[t.id] && HERO_BY_ID[t.id].attr === 'agi' ? 0.22 : 0.1) + m.crit, m, n: 0, alive: true, stun: 0, ult: ultOf(t.id), aegis: !!m.aegis, cheese: !!m.cheese, refresher: !!m.refresher };
  });
  const E = def.waves.map(w => ({ id: w.id, name: w.name, p: w.power, hp: w.power * 10 * (w.hpMul || 1), max: w.power * 10 * (w.hpMul || 1), atk: w.power * def.K, alive: true, boss: w.boss, stun: 0, n: 0, ult: ultOf(w.id), rage: 0, mech: w.mech, phase: 0, noExec: w.mech === 'ancient', wt: 0 }));
  const ticks = [];
  let wi = 0, guard = 0, shield = 0, buff = 0;
  const maxTicks = opts.maxTicks || 400;
  const used = { aegis: false, cheese: false, rapierLost: false };
  const hitE = (e, dmg) => { e.hp = Math.max(0, e.hp - dmg); };
  const hurt = (ti, d, ev) => {
    const t = T[ti]; t.hp = Math.max(0, t.hp - d);
    if (t.hp <= 0 && t.alive) {
      if (t.aegis) { t.aegis = false; used.aegis = true; t.hp = t.max; ev.push({ k: 'aegis', to: ti }); return; }
      t.alive = false; ev.push({ k: 'tkill', to: ti });
      if (ti === 0 && t.m.rapier) { used.rapierLost = true; ev.push({ k: 'rapier' }); }
    } else if (t.cheese && t.alive && t.hp < t.max * 0.25) { t.cheese = false; used.cheese = true; t.hp = t.max; ev.push({ k: 'cheese', to: ti }); }
  };
  while (wi < E.length && T.some(t => t.alive) && guard++ < maxTicks) {
    const ev = [];
    const e = E[wi];
    // ---- механики боссов 25/50/75/100 ----
    e.wt++;
    const night = e.mech === 'night' && e.wt <= 10;
    if (e.mech === 'night' && e.wt === 1) ev.push({ k: 'mech', text: '🌙 Наступила ночь: Night Stalker сильнее, твои атаки слабее' });
    if (e.mech === 'night' && e.wt === 11) ev.push({ k: 'mech', text: '☀ Рассвет! Ночь кончилась' });
    T.forEach((t, ti) => { if (t.alive && t.doom > 0) { t.doom--; hurt(ti, t.max * 0.08, ev); } });
    for (let i = 0; i < T.length && e.alive; i++) {
      const t = T[i]; if (!t.alive) continue;
      if (t.stun > 0) { t.stun--; ev.push({ k: 'stunned', who: i }); continue; }
      t.n++;
      const isUlt = t.n % t.m.ultEvery === 0 && !(t.doom > 0);
      const atk = t.atk * (buff > 0 ? 1.3 : 1) * (night ? 0.7 : 1) * (0.8 + rand() * 0.4);
      const casts = isUlt && t.refresher ? 2 : 1;
      if (isUlt && t.refresher) t.refresher = false;
      for (let c = 0; c < casts && e.alive; c++) {
        let dealt = 0;
        if (isUlt) {
          const type = t.ult.type;
          let mult = ({ nuke: 3.2, crit: 4, aoe: 2 * TM.aoe, stun: 1.5, heal: 1, shield: 1, buff: 1.5, execute: 2 }[type] || 2) * t.m.ultMul;
          let exec = false;
          if (type === 'execute' && e.hp / e.max < 0.35 && !e.noExec) { exec = true; mult = 0; }
          const dmg = exec ? e.hp : atk * mult;
          hitE(e, dmg); dealt = dmg;
          const x = { k: 'ult', from: i, type, dmg: Math.round(dmg), exec, hp: e.hp / e.max, wave: wi, refresh: c > 0 };
          if (type === 'aoe') { x.splash = []; for (let j = wi + 1; j < E.length; j++) { const sd = atk * 0.7 * TM.aoe; E[j].hp = Math.max(E[j].max * 0.05, E[j].hp - sd); x.splash.push(j); } }
          if (type === 'stun') e.stun = 2 + TM.stunExtra;
          if (type === 'heal') { x.heal = []; T.forEach((a, ai) => { if (a.alive) { a.hp = Math.min(a.max, a.hp + a.max * 0.2 * t.m.ultMul); x.heal.push([ai, a.hp / a.max]); } }); }
          if (type === 'shield') shield = 2;
          if (type === 'buff') buff = 3;
          ev.push(x);
        } else {
          const crit = rand() < t.crit;
          const miss = e.mech === 'void' && rand() < 0.2;
          const dmg = miss ? 0 : atk * (crit ? t.m.critMul : 1);
          hitE(e, dmg); dealt = dmg;
          ev.push({ k: 'hit', from: i, dmg: Math.round(dmg), crit, hp: e.hp / e.max, wave: wi });
        }
        if (t.m.lifesteal && dealt) t.hp = Math.min(t.max, t.hp + dealt * t.m.lifesteal * 10 * 0.1);
        if (e.hp <= 0) { e.alive = false; ev.push({ k: 'ekill', wave: wi }); }
        if (e.alive && e.mech === 'ancient' && !e.phase && e.hp < e.max * 0.5) {
          e.phase = 1; e.hp = e.max * 0.75; e.atk *= 1.3;
          T.forEach(a => { if (a.alive && !a.m.stunImmune) a.stun = Math.max(a.stun, 1); });
          ev.push({ k: 'mech', text: '🏛 Древний во 2-й фазе: лечится, оглушает команду и звереет!', ehp: e.hp / e.max });
        }
      }
    }
    if (e.alive) {
      const alive = T.map((t, i) => i).filter(i => T[i].alive);
      if (e.stun > 0) { e.stun--; ev.push({ k: 'estunned' }); }
      else if (alive.length) {
        e.n++;
        const every = e.boss ? BOSS_ULT_EVERY : ENEMY_ULT_EVERY;
        const dm = (shield > 0 ? 0.45 : 1) * (e.rage > 0 ? 1.4 : 1) * (night ? 1.6 : 1) * TM.taken;
        const tk = ti => dm * T[ti].m.taken;
        if (e.boss && e.mech === 'doom' && (e.n === 1 || e.n % 3 === 0)) {
          const cand = alive.filter(ti => !(T[ti].doom > 0)).sort((a, b) => T[b].atk - T[a].atk);
          if (cand.length) { T[cand[0]].doom = 4; ev.push({ k: 'mech', text: '🔥 Doom проклинает ' + HERO_BY_ID[T[cand[0]].id].name + ': 4 хода без ульты' }); }
        }
        if (e.n % every === 0) {
          const type = e.ult.type;
          const x = { k: 'eult', type, hits: [] };
          ev.push(x);
          if (e.boss && e.mech === 'void') {
            alive.forEach(ti => { T[ti].stun = Math.max(T[ti].stun, 1); });
            ev.push({ k: 'mech', text: '⏳ Хроносфера! Команда замерла' });
          }
          const after = [];
          if (type === 'aoe' || (e.boss && type !== 'heal')) {
            alive.forEach(ti => { const d = e.atk * (0.8 + rand() * 0.4) * 0.6 * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]); });
          } else if (type === 'stun') {
            const ti = alive[Math.floor(rand() * alive.length)];
            if (!T[ti].m.stunImmune) { T[ti].stun = 2; x.stunned = ti; } else x.bkb = ti;
            const d = e.atk * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
          } else if (type === 'heal') {
            e.hp = Math.min(e.max, e.hp + e.max * 0.15); x.ehp = e.hp / e.max;
          } else if (type === 'buff' || type === 'shield') {
            e.rage = 2; const ti = alive[Math.floor(rand() * alive.length)]; const d = e.atk * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
          } else {
            const ti = alive[Math.floor(rand() * alive.length)]; const d = e.atk * 2.5 * tk(ti); x.hits.push([ti, Math.round(d), 0]); after.push([ti, d]);
          }
          after.forEach(([ti, d], hi) => { hurt(ti, d, ev); x.hits[hi][2] = T[ti].hp / T[ti].max; });
        } else {
          const ti = alive[Math.floor(rand() * alive.length)];
          const dmg = e.atk * (0.8 + rand() * 0.4) * tk(ti);
          const x = { k: 'ehit', to: ti, dmg: Math.round(dmg), hp: 0, wave: wi };
          ev.push(x); hurt(ti, dmg, ev); x.hp = T[ti].hp / T[ti].max;
        }
        if (e.rage > 0) e.rage--;
      }
    } else { wi++; if (wi < E.length) { ev.push({ k: 'wave', wave: wi, hp: E[wi].hp / E[wi].max }); if (E[wi].mech) ev.push({ k: 'mech', text: '⚠ БОСС: ' + E[wi].name }); } }
    if (shield > 0) shield--; if (buff > 0) buff--;
    ticks.push(ev);
  }
  const dmgDealt = E.reduce((a, x) => a + (x.max - x.hp), 0);
  return { win: wi >= E.length, ticks, alive: T.filter(t => t.alive).length, used, wavesCleared: wi, dmgDealt, enemyHp: E.map(x => x.hp / x.max) };
}

// ---------- UI ----------
let arenaLoc = null, arenaSel = null;
function initArena() { arenaLoc = null; arenaSel = null; }
function setMainHero(id) { S.mainHero = id === 'auto' ? null : id; save(); renderArena(); updateTop(); }
function renderArena() {
  const sel = document.getElementById('main-hero');
  sel.innerHTML = '<option value="auto">Авто (сильнейший)</option>' + sortedByPower().map(h => '<option value="' + h.id + '">' + esc(h.name) + ' · ур.' + S.heroes[h.id].level + ' · ⚔' + fmt(heroPower(h.id)) + '</option>').join('');
  sel.value = S.mainHero || 'auto';
  const pr = document.getElementById('pick-row'); pr.innerHTML = '';
  getStack().forEach((id, i) => {
    const d = document.createElement('div'); d.className = 'pick' + (i === 0 ? ' main' : '');
    d.appendChild(mkImg(heroTallChain(id), HERO_BY_ID[id].name));
    if (i === 0) { const c = document.createElement('div'); c.className = 'crown'; c.textContent = 'MAIN'; d.appendChild(c); }
    const ul = ultOf(id); const ui = mkImg(ultIconChain(id), ul.name, 'pult'); ui.title = ul.name + ' — ' + EFFECT_NAME[ul.type]; d.appendChild(ui);
    const n = document.createElement('div'); n.className = 'pn'; n.innerHTML = esc(HERO_BY_ID[id].name) + '<b>⚔ ' + fmt(heroPower(id)) + '</b><span style="color:' + EFFECT_COLOR[ul.type] + ';font-size:.6rem">' + esc(ul.name) + '</span>';
    d.appendChild(n); pr.appendChild(d);
  });
  document.getElementById('stack-power').textContent = fmt(stackPower());
  renderShopPanel(); renderSynergyBox(); renderRoshan();
  const cur = Math.min(100, S.arena.cleared + 1);
  if (!arenaLoc) arenaLoc = locOf(cur).id;
  if (!arenaSel) arenaSel = cur;
  const lt = document.getElementById('loc-tabs'); lt.innerHTML = '';
  LOCS.forEach(l => {
    const d = document.createElement('div');
    d.className = 'loc-tab ' + l.tab + (l.id === arenaLoc ? ' active' : '') + (cur < l.from ? ' locked' : '');
    const done = Math.max(0, Math.min(25, S.arena.cleared - l.from + 1));
    d.innerHTML = '<div>' + l.name + '<small>ур. ' + l.from + '–' + l.to + ' · ' + done + '/25</small></div>';
    d.onclick = () => { arenaLoc = l.id; renderArena(); };
    lt.appendChild(d);
  });
  const L0 = LOCS.find(l => l.id === arenaLoc);
  const lg = document.getElementById('levels-grid'); lg.innerHTML = '';
  for (let L = L0.from; L <= L0.to; L++) {
    const b = document.createElement('div');
    const st = L <= S.arena.cleared ? 'done' : L === cur ? 'current' : 'locked';
    b.className = 'lvl ' + st + (L === arenaSel ? ' sel' : '');
    b.innerHTML = L + '<small>' + (st === 'done' ? '✓' : fmtShort(reqPower(L))) + '</small>' + (L % 4 === 0 ? '<span class="rw">🎨</span>' : L % 2 === 0 ? '<span class="rw">🛡</span>' : '');
    b.title = 'Уровень ' + L + ' · рекомендуемая сила ' + fmt(reqPower(L));
    if (st !== 'locked') b.onclick = () => { arenaSel = L; renderArena(); };
    lg.appendChild(b);
  }
  renderLevelInfo();
}
function fmtShort(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'k' : String(n); }
function winChanceEstimate(def) {
  const bt = buildTeam({ noCons: true });
  const d = Object.assign({}, def, { team: bt.tm });
  let w = 0; const N = 160, r = seeded(def.L * 31 + Math.round(stackPower()));
  for (let i = 0; i < N; i++) if (simulateBattle(bt.team, d, r).win) w++;
  return w / N;
}
function renderLevelInfo() {
  const L = arenaSel, def = modeDef(levelDef(L));
  const replay = L <= S.arena.cleared;
  const modeRow = '<div class="mode-row" style="width:100%">' + Object.keys(MODES).map(m => '<button class="btn sm ' + (arenaMode === m ? 'gold' : 'ghost') + '" title="' + esc(MODES[m].d) + '" data-click="setArenaMode(\'' + m + '\')">' + MODES[m].name + '</button>').join('') + '<span class="muted" style="font-size:.75rem;align-self:center;margin-left:6px">' + esc(MODES[arenaMode].d) + '</span></div>';
  if (arenaMode === 'survival') {
    document.getElementById('level-info').innerHTML = modeRow + '<div style="flex:1"><div class="cinzel" style="font-size:1.2rem;color:#fff">Выживание</div><div class="muted" style="font-size:.85rem">Волны идут без конца, каждая на 13% сильнее. Награда за каждую пройденную волну.</div><div style="font-size:.85rem;margin-top:4px">Рекорд: <b style="color:var(--gold2)">' + (S.survivalBest || 0) + '</b> волн · Твой стак: <b style="color:var(--radiant)">' + fmt(stackPower()) + '</b></div></div><button class="btn green big" data-click="startSurvival()">⚔ НАЧАТЬ</button>';
    return;
  }
  const ch = winChanceEstimate(def);
  const chCol = ch > 0.75 ? 'var(--ok)' : ch > 0.4 ? 'var(--gold2)' : 'var(--danger)';
  const box = document.getElementById('level-info');
  box.innerHTML = modeRow + '<div style="min-width:170px"><div class="cinzel" style="font-size:1.2rem;color:#fff;font-weight:700">Уровень ' + L + '</div><div class="muted" style="font-size:.8rem">' + def.loc.name + ' · ' + def.waves.length + ' волн подряд</div>' + (def.mechText ? '<div class="boss-mech">⚠ ' + esc(def.mechText) + '</div>' : '') +
    '<div style="font-size:.85rem;margin-top:4px">Сила врагов: <b style="color:var(--dire)">' + fmt(def.R) + '</b> · твой стак: <b style="color:var(--radiant)">' + fmt(stackPower()) + '</b></div>' +
    '<div style="font-size:.85rem">Шанс победы ≈ <b style="color:' + chCol + '">' + Math.round(ch * 100) + '%</b></div></div>' +
    '<div class="wave-strip" id="wave-strip"></div>' +
    '<div style="flex:1;min-width:180px;font-size:.82rem"><div>Награда: ' + gemHTML(replay ? Math.round(def.reward * CONFIG.arena.replayMul) : def.reward) + (replay ? ' <span class="muted">(повтор, без предметов)</span>' : '') + '</div>' +
    (!replay ? '<div>' + (def.skin ? '🎨 Скин за босса' : '') + (def.skin && def.eq ? ' + ' : '') + (def.eq ? '🛡 Снаряжение' : '') + (!def.skin && !def.eq ? '<span class="muted">Скин — каждый 4-й босс, снаряжение — каждый 2-й</span>' : '') + '</div>' : '') + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px"><button class="btn green big" data-click="startBattle(' + L + ',false)">⚔ В БОЙ</button>' +
    (!replay && L < 100 && arenaMode === 'normal' ? '<button class="btn sm" data-click="startBattle(' + L + ',true)" title="Сражаться с уровнями подряд, пока не проиграешь">▶ Цепочка уровней</button>' : '') + '</div>';
  const ws = document.getElementById('wave-strip');
  def.waves.forEach((w, i) => {
    if (i) { const a = document.createElement('span'); a.className = 'arr'; a.textContent = '›'; ws.appendChild(a); }
    const d = document.createElement('div'); d.className = 'w' + (w.boss ? ' boss' : '') + (arenaMode === 'cm' ? ' cm' : '') + (arenaMode === 'cm' && cmBan === i ? ' banned' : '');
    if (arenaMode === 'cm') d.onclick = () => { cmBan = cmBan === i ? -1 : i; renderLevelInfo(); };
    d.appendChild(mkImg(unitImgChain(w.id), w.name));
    const s = document.createElement('span'); s.textContent = (w.boss ? '👑 ' : '') + fmtShort(w.power); d.appendChild(s);
    d.title = w.name + ' · ⚔ ' + fmt(w.power);
    ws.appendChild(d);
  });
}
function arenaLog(cls, txt) {
  const l = document.getElementById('arena-log');
  const d = document.createElement('div'); d.className = cls; d.textContent = txt; l.prepend(d);
  while (l.children.length > 60) l.lastChild.remove();
}

// ---------- BATTLE ANIMATION ----------
let BT = null;
function startBattle(L, chain, customDef) {
  if (busy.battle) return;
  const def = customDef || modeDef(levelDef(L));
  const bt = buildTeam({ noCons: !!def.roshan });
  def.team = bt.tm;
  const team = bt.team;
  const result = simulateBattle(team, def, null, def.roshan ? { maxTicks: 14 } : {});
  busy.battle = true;
  BT = { L, def, team, result, chain, tick: 0, skip: false, timer: null, charge: [0, 0, 0, 0, 0], wave: 0, prevSpeed: speed };
  if (def.turbo) speed = 'fast';
  sfx('start');
  const stage = document.getElementById('bt-stage');
  document.getElementById('bt-ground').className = 'ground ' + def.loc.g;
  document.getElementById('bt-title').textContent = def.pvp ? 'PvP · против ' + def.pvp.nick : def.roshan ? 'Логово Рошана' : def.survival ? 'Выживание · ' + def.loc.name : 'Уровень ' + L + ' · ' + def.loc.name + (def.turbo ? ' · TURBO' : '');
  document.getElementById('bt-sub').textContent = 'Сила стака ' + fmt(stackPower()) + ' vs ' + fmt(def.R) + ' · ' + def.waves.length + ' волн';
  document.getElementById('bt-status').textContent = '⚔';
  document.getElementById('bt-status').style.color = '';
  document.getElementById('bt-feed').innerHTML = '';
  document.getElementById('bt-skip').textContent = 'Пропустить ⏩';
  document.getElementById('bt-skip').onclick = battleSkip;
  // towers
  stage.querySelectorAll('.tower').forEach(t => t.remove());
  [['8%', '#3fbf4f'], ['88%', '#d0402e']].forEach(([x, c]) => {
    const t = document.createElement('div'); t.className = 'tower'; t.style.left = x;
    t.innerHTML = '<svg viewBox="0 0 34 70" width="34" height="70"><path d="M6 70 L10 22 L4 22 L17 2 L30 22 L24 22 L28 70Z" fill="#2a2e33" stroke="#000"/><circle cx="17" cy="20" r="5" fill="' + c + '" style="filter:drop-shadow(0 0 6px ' + c + ')"/></svg>';
    stage.appendChild(t);
  });
  const left = document.getElementById('bt-left'); left.innerHTML = '';
  team.forEach((t, i) => left.appendChild(unitEl(t.id, HERO_BY_ID[t.id].name, t.p, i === 0 ? 'main' : '', false)));
  const right = document.getElementById('bt-right'); right.innerHTML = '';
  showWave(0, false);
  renderQueue(0);
  document.getElementById('battle').classList.add('show');
  const syn = activeSynergies(bt.ids);
  feed(def.roshan ? 'Рошан проснулся! У тебя 14 ходов.' : def.survival ? 'Выживание: держись как можно дольше!' : 'Бой начинается! Против тебя ' + def.waves.length + ' противников подряд.' + (syn.length ? ' Синергии: ' + syn.map(x => x.name).join(', ') : ''));
  BT.timer = setTimeout(playTick, speed === 'fast' ? 300 : 700);
}
function unitEl(id, name, p, cls, enemy) {
  const u = document.createElement('div'); u.className = 'unit ' + (enemy ? 'enemy ' : '') + cls;
  u.appendChild(mkImg(unitImgChain(id), name, 'uimg'));
  const nm = document.createElement('div'); nm.className = 'uname'; nm.textContent = name + ' ⚔' + fmtShort(p); u.appendChild(nm);
  const ul = ultOf(id);
  const ic = mkImg(ultIconChain(id), ul.name, 'uult'); ic.title = ul.name + ' — ' + EFFECT_NAME[ul.type]; u.appendChild(ic);
  const b = document.createElement('div'); b.className = 'ubar'; b.innerHTML = '<div style="width:100%"></div>'; u.appendChild(b);
  const m = document.createElement('div'); m.className = 'umana'; m.innerHTML = '<div style="width:0%"></div>'; u.appendChild(m);
  return u;
}
function showWave(i, animate, hp) {
  const w = BT.def.waves[i];
  const right = document.getElementById('bt-right'); right.innerHTML = '';
  const u = unitEl(w.id, w.name, w.power, w.boss ? 'boss' : '', true);
  if (hp != null) u.querySelector('.ubar div').style.width = (hp * 100) + '%';
  if (animate) u.classList.add('enter');
  right.appendChild(u);
}
function renderQueue(cur) {
  const q = document.getElementById('bt-queue'); q.innerHTML = '<span>Волны:</span>';
  BT.def.waves.forEach((w, i) => { const im = mkImg(unitImgChain(w.id), w.name); if (i < cur) im.className = 'done'; else if (i === cur) im.className = 'cur'; if (w.boss) im.style.borderColor = '#ff8a3a'; q.appendChild(im); });
}
function feed(t, col) {
  const f = document.getElementById('bt-feed');
  const d = document.createElement('div'); d.textContent = t; if (col) d.style.color = col;
  f.prepend(d); while (f.children.length > 2) f.lastChild.remove();
}
function relPos(el) {
  const s = document.getElementById('bt-stage').getBoundingClientRect(), r = el.getBoundingClientRect();
  return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 - 6 };
}
function floatDmg(el, txt, cls, color) {
  const p = relPos(el), d = document.createElement('div');
  d.className = 'dmg ' + (cls || ''); d.textContent = txt; d.style.left = (p.x - 20 + rnd(-20, 20)) + 'px'; d.style.top = (p.y - 20) + 'px';
  if (color) d.style.color = color;
  document.getElementById('bt-stage').appendChild(d); setTimeout(() => d.remove(), 950);
}
function heroFx(fromEl, toEl, hero, ev) {
  const stage = document.getElementById('bt-stage');
  const col = 'hsl(' + hero.hue + ',85%,60%)';
  const a = relPos(fromEl), b = relPos(toEl);
  const dur = speed === 'fast' ? 160 : 300;
  if (hero.ranged) {
    // снаряд своего цвета у каждого героя; у INT — магическая сфера, у AGI — стрела
    const p = document.createElement('div'); p.className = 'proj';
    const big = hero.attr === 'int' || hero.attr === 'uni';
    p.style.width = p.style.height = (big ? 20 : 12) + 'px';
    p.style.background = 'radial-gradient(circle,#fff,' + col + ' 45%,transparent 72%)';
    p.style.boxShadow = '0 0 14px ' + col + ',0 0 28px ' + col;
    if (hero.attr === 'agi') { p.style.width = '26px'; p.style.height = '5px'; p.style.borderRadius = '3px'; p.style.background = 'linear-gradient(90deg,transparent,' + col + ',#fff)'; }
    stage.appendChild(p);
    p.animate([{ left: a.x + 'px', top: a.y + 'px' }, { left: b.x + 'px', top: (b.y + rnd(-10, 10)) + 'px' }], { duration: dur, easing: 'ease-in' }).onfinish = () => p.remove();
  } else {
    fromEl.classList.remove('lunge-r'); void fromEl.offsetWidth; fromEl.classList.add('lunge-r');
  }
  setTimeout(() => {
    if (!hero.ranged || ev.ulti) {
      const s = document.createElement('div'); s.className = 'slash'; s.style.borderColor = col; s.style.left = (b.x - 45) + 'px'; s.style.top = (b.y - 45) + 'px'; s.style.boxShadow = '0 -6px 12px -6px ' + col;
      stage.appendChild(s); setTimeout(() => s.remove(), 320);
    }
    if (hero.attr === 'str' || ev.ulti) {
      const sh = document.createElement('div'); sh.className = 'shock'; sh.style.borderColor = col; sh.style.left = b.x + 'px'; sh.style.top = b.y + 'px';
      stage.appendChild(sh); setTimeout(() => sh.remove(), 520);
    }
    toEl.classList.remove('hit'); void toEl.offsetWidth; toEl.classList.add('hit');
    floatDmg(toEl, (ev.crit ? '💥' : '') + fmtShort(ev.dmg), ev.crit || ev.ulti ? 'crit' : '', ev.crit || ev.ulti ? null : col);
  }, dur * 0.9);
}
function ultiFlash(id, enemy) {
  const hero = HERO_BY_ID[id], ul = ultOf(id);
  const st = document.getElementById('bt-stage');
  const u = document.createElement('div'); u.className = 'ulti';
  const col = EFFECT_COLOR[ul.type];
  u.innerHTML = '<div class="ub" style="color:' + col + ';text-shadow:0 0 18px ' + col + (enemy ? ';flex-direction:row-reverse' : '') + '"></div>';
  const ub = u.firstChild;
  const ic = mkImg(ultIconChain(id), ul.name); ic.style.cssText = 'height:64px;width:64px;border-radius:4px;border:2px solid ' + col + ';box-shadow:0 0 20px ' + col;
  ub.appendChild(ic);
  const t = document.createElement('div'); t.style.textAlign = enemy ? 'right' : 'left';
  t.innerHTML = '<div>' + esc(ul.name.toUpperCase()) + '</div><div style="font-family:Roboto Condensed;font-size:.8rem;letter-spacing:1px;color:#fff">' + esc(hero.name) + ' · ' + EFFECT_NAME[ul.type] + '</div>';
  ub.appendChild(t);
  st.appendChild(u); setTimeout(() => u.remove(), 1000);
}
function stageFx(cls, el, color, extra) {
  const p = relPos(el), d = document.createElement('div');
  d.className = cls; d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
  if (color) d.style.borderColor = color;
  if (extra) Object.assign(d.style, extra);
  document.getElementById('bt-stage').appendChild(d); setTimeout(() => d.remove(), 900);
}
function setBar(el, sel, v) { if (el) { const b = el.querySelector(sel); if (b) b.style.width = Math.max(0, v * 100) + '%'; } }
function playTick() {
  if (!BT) return;
  const ev = BT.result.ticks[BT.tick++];
  if (!ev) return endBattle();
  const left = document.getElementById('bt-left').children;
  const step = speed === 'fast' ? 70 : 120;
  const late = speed === 'fast' ? 150 : 280;
  let delay = 0;
  ev.forEach(e => {
    setTimeout(() => {
      if (!BT || BT.skip) return;
      const enemyEl = document.getElementById('bt-right').firstChild;
      if (e.k === 'hit' || e.k === 'ult') {
        const id = BT.team[e.from].id, hero = HERO_BY_ID[id];
        BT.charge[e.from] = e.k === 'ult' ? 0 : BT.charge[e.from] + 1;
        setBar(left[e.from], '.umana div', BT.charge[e.from] / (ULT_EVERY - 1));
        if (e.k === 'ult') {
          ultiFlash(id, false);
          left[e.from].classList.add('casting'); setTimeout(() => left[e.from] && left[e.from].classList.remove('casting'), 700);
          const col = EFFECT_COLOR[e.type];
          if (enemyEl) {
            if (e.type === 'stun') { stageFx('stunfx', enemyEl); feed('💫 ' + BT.def.waves[e.wave].name + ' оглушён', col); }
            if (e.type === 'aoe') { stageFx('shock', enemyEl, col, { animationDuration: '.8s' }); if (e.splash && e.splash.length) feed('🔥 ' + ultOf(id).name + ' задевает ещё ' + e.splash.length + ' волн(ы)', col); }
            if (e.exec) { stageFx('execfx', enemyEl); feed('☠ ' + ultOf(id).name + ': добивание!', col); }
          }
          if (e.type === 'heal') { (e.heal || []).forEach(([ai, hp]) => { setBar(left[ai], '.ubar div', hp); stageFx('healfx', left[ai]); }); feed('💚 ' + ultOf(id).name + ': команда лечится', col); }
          if (e.type === 'shield') { [...left].forEach(u => { if (!u.classList.contains('dead')) { u.classList.add('shielded'); setTimeout(() => u.classList.remove('shielded'), speed === 'fast' ? 900 : 1800); } }); feed('🛡 ' + ultOf(id).name + ': защита команды', col); }
          if (e.type === 'buff') { [...left].forEach(u => { if (!u.classList.contains('dead')) { u.classList.add('buffed'); setTimeout(() => u.classList.remove('buffed'), speed === 'fast' ? 1200 : 2400); } }); feed('⚡ ' + ultOf(id).name + ': атака команды +30%', col); }
        }
        if (enemyEl && e.dmg > 0) heroFx(left[e.from], enemyEl, hero, { crit: e.crit || e.type === 'crit', ulti: e.k === 'ult', dmg: e.dmg });
        setTimeout(() => setBar(enemyEl, '.ubar div', e.hp), late);
      } else if (e.k === 'mech') {
        setTimeout(() => { feed(e.text, '#ffb84a'); if (e.ehp != null) { const en = document.getElementById('bt-right').firstChild; if (en) setBar(en, '.ubar div', e.ehp); } }, 0);
      } else if (e.k === 'stunned') {
        floatDmg(left[e.who], '💫', '', '#7ad3ff');
      } else if (e.k === 'estunned') {
        if (enemyEl) floatDmg(enemyEl, '💫 оглушён', '', '#7ad3ff');
      } else if (e.k === 'eult') {
        const w = BT.def.waves[BT.wave];
        ultiFlash(w.id, true);
        if (enemyEl) { enemyEl.classList.add('casting'); setTimeout(() => enemyEl.classList.remove('casting'), 700); }
        if (e.ehp != null) { setBar(enemyEl, '.ubar div', e.ehp); if (enemyEl) stageFx('healfx', enemyEl); feed('💚 ' + w.name + ' лечится', '#ff9a8a'); }
        e.hits.forEach(([ti, d, hp]) => setTimeout(() => { const t = left[ti]; if (!t) return; t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setBar(t, '.ubar div', hp); floatDmg(t, '-' + fmtShort(d), 'crit', '#ff5a3a'); }, 200));
        if (e.bkb != null) feed('🟡 BKB: ' + HERO_BY_ID[BT.team[e.bkb].id].name + ' не оглушён', '#ffd36a');
        if (e.stunned != null) { setTimeout(() => stageFx('stunfx', left[e.stunned]), 200); feed('💫 ' + HERO_BY_ID[BT.team[e.stunned].id].name + ' оглушён', '#ff9a8a'); }
        else if (e.hits.length > 1) feed('💥 ' + ultOf(w.id).name + ' бьёт по всей команде', '#ff9a8a');
      } else if (e.k === 'ehit') {
        const t = left[e.to];
        if (enemyEl) { enemyEl.classList.remove('lunge-l'); void enemyEl.offsetWidth; enemyEl.classList.add('lunge-l'); }
        setTimeout(() => { t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setBar(t, '.ubar div', e.hp); floatDmg(t, '-' + fmtShort(e.dmg), '', '#ff7a6a'); }, 150);
      } else if (e.k === 'aegis') {
        const t = left[e.to]; setBar(t, '.ubar div', 1); stageFx('healfx', t); floatDmg(t, 'AEGIS', 'crit', '#ffd36a'); feed('🛡 Aegis! ' + HERO_BY_ID[BT.team[e.to].id].name + ' возрождается', '#ffd36a');
      } else if (e.k === 'cheese') {
        const t = left[e.to]; setBar(t, '.ubar div', 1); stageFx('healfx', t); floatDmg(t, '🧀 +100%', 'crit', '#ffe34a'); feed('🧀 Cheese! Полное лечение', '#ffe34a');
      } else if (e.k === 'rapier') {
        feed('⚔ Divine Rapier выпала!', 'var(--danger)');
      } else if (e.k === 'ekill') {
        setTimeout(() => { if (enemyEl) enemyEl.classList.add('dead'); feed('☠ ' + BT.def.waves[e.wave].name + ' повержен!', 'var(--ok)'); }, 250);
      } else if (e.k === 'tkill') {
        setTimeout(() => { left[e.to].classList.add('dead'); feed('💀 ' + HERO_BY_ID[BT.team[e.to].id].name + ' погиб', 'var(--danger)'); }, 300);
      } else if (e.k === 'wave') {
        BT.wave = e.wave;
        setTimeout(() => { showWave(e.wave, true, e.hp); renderQueue(e.wave); feed('Следующий противник: ' + BT.def.waves[e.wave].name + (BT.def.waves[e.wave].boss ? ' (БОСС)' : '')); }, 350);
      }
    }, delay);
    delay += e.k === 'hit' ? step : e.k === 'ult' || e.k === 'eult' ? step * 4 : step * 1.4;
  });
  BT.timer = setTimeout(playTick, delay + (speed === 'fast' ? 240 : 460));
}
function battleSkip() { if (!BT) return; BT.skip = true; clearTimeout(BT.timer); endBattle(); }
function endBattle() {
  if (!BT || BT.ended) return;
  BT.ended = true; clearTimeout(BT.timer);
  const { L, def, result } = BT;
  const st = document.getElementById('bt-status');
  const replay = L <= S.arena.cleared;
  let msg;
  speed = BT.prevSpeed;
  consumeAfterBattle(result.used);
  if (def.roshan || def.survival || def.pvp) { endSpecialBattle(def, result, st); return; }
  if (result.win) {
    st.textContent = '🏆 ПОБЕДА'; st.style.color = 'var(--ok)';
    const right = document.getElementById('bt-right').firstChild; if (right) right.classList.add('dead');
    const g = replay ? Math.round(def.reward * CONFIG.arena.replayMul * replayFactor()) : def.reward;
    addGems(g); S.arena.wins++; track('arenaWins'); sfx('win');
    S.winStreak = (S.winStreak || 0) + 1;
    if (S.arena.wins === 1) announce('First Blood!'); else if (S.winStreak === 5) announce('Rampage!'); else if (S.winStreak === 3) announce('Killing spree!');
    const got = [];
    if (!replay) {
      S.arena.cleared = L;
      const ri = Math.max(0, Math.min(5, Math.floor(L / 17) + (Math.random() < 0.3 ? 1 : 0) - (Math.random() < 0.25 ? 1 : 0)));
      if (def.eq) got.push(addEquipment(BT.team[0].id, RARITIES[ri]));
      if (L % 10 === 0 && Math.random() < 0.5) { S.cons = S.cons || { aegis: 0, cheese: 0 }; S.cons.cheese++; got.push({ name: 'Cheese', rarity: 'immortal' }); }
      if (def.skin) got.push(addSkin(def.waves[def.waves.length - 1].id, RARITIES[Math.min(5, ri + 1)]));
    } else S.arena.replays++;
    msg = 'Уровень ' + L + ' пройден! +' + fmt(g) + ' 💎' + (got.length ? ' · ' + got.map(x => x.name + ' (' + RARITY_NAMES[x.rarity] + ')').join(', ') : '');
    arenaLog('win', '🏆 ' + msg);
    feed(msg, 'var(--ok)');
  } else {
    st.textContent = '💀 ПОРАЖЕНИЕ'; st.style.color = 'var(--danger)'; sfx('lose'); S.winStreak = 0;
    const pity = Math.round(def.reward * 0.08);
    addGems(pity); S.arena.losses++;
    msg = 'Поражение на уровне ' + L + ' (дошёл до волны ' + (Math.min(def.waves.length, result.ticks.filter(t => t.some(e => e.k === 'wave')).length + 1)) + '/' + def.waves.length + '). Утешение +' + fmt(pity) + ' 💎';
    arenaLog('lose', '💀 ' + msg); feed(msg, 'var(--danger)');
  }
  save(); updateTop(); updateProfileChip();
  const chainNext = BT.chain && result.win && L < 100;
  const btn = document.getElementById('bt-skip');
  btn.textContent = chainNext ? 'Стоп цепочки' : 'Закрыть';
  let auto = null;
  btn.onclick = () => { clearTimeout(auto); closeBattle(); };
  if (chainNext) {
    feed('Цепочка: следующий уровень ' + (L + 1) + '…', 'var(--gold2)');
    auto = setTimeout(() => { closeBattle(true); arenaSel = L + 1; arenaLoc = locOf(L + 1).id; startBattle(L + 1, true); }, speed === 'fast' ? 1200 : 2200);
  } else if (result.win && L % 25 === 0 && !replay) {
    setTimeout(() => showModal('👑', def.loc.name + ' захвачен!', 'Босс повержен. ' + (L === 100 ? 'Ты прошёл всю арену — Древний пал!' : 'Открыта локация: ' + locOf(L + 1).name), 'ok'), 600);
  }
}
function endSpecialBattle(def, result, st) {
  let msg;
  if (def.pvp) {
    msg = pvpResult(def, result);
    st.textContent = result.win ? '🏆 ПОБЕДА' : '💀 ПОРАЖЕНИЕ'; st.style.color = result.win ? 'var(--ok)' : 'var(--danger)'; sfx(result.win ? 'win' : 'lose');
  } else if (def.roshan) {
    const r = roshanState();
    r.dealt += result.dmgDealt;
    const killed = result.win || r.dealt >= r.pool;
    if (killed) {
      r.killed = true;
      S.cons = S.cons || { aegis: 0, cheese: 0 }; S.cons.aegis++; S.cons.cheese++;
      const g = Math.round(rewardScale() * CONFIG.roshan.rewardMul); addGems(g);
      const it = addEquipment(mainHeroId(), 'immortal');
      st.textContent = '🏆 РОШАН ПОВЕРЖЕН'; st.style.color = 'var(--ok)'; sfx('win'); announce('Roshan has fallen to the Radiant!');
      msg = 'Рошан повержен! Aegis + Cheese + ' + fmt(g) + ' 💎 + ' + it.name; track('roshanKills');
    } else {
      st.textContent = '⏳ РОШАН ЖИВ'; st.style.color = 'var(--gold2)';
      msg = 'Нанесено ' + fmt(result.dmgDealt) + ' урона. У Рошана осталось ' + Math.round((1 - r.dealt / r.pool) * 100) + '% здоровья. Попыток: ' + r.tries;
    }
  } else {
    const n = result.wavesCleared;
    const g = Math.round(def.waves.slice(0, n).reduce((a, w) => a + w.power, 0) * 0.25);
    addGems(g);
    const rec = n > (S.survivalBest || 0); if (rec) S.survivalBest = n;
    st.textContent = '🌊 ВОЛН: ' + n; st.style.color = 'var(--gold2)'; sfx(n ? 'win' : 'lose');
    msg = 'Выживание: пройдено ' + n + ' волн' + (rec ? ' — НОВЫЙ РЕКОРД!' : '') + ' · +' + fmt(g) + ' 💎';
    if (rec && n >= 10) hype('НИШТЯК');
    track('survivalRuns');
  }
  arenaLog('gold', msg); feed(msg, 'var(--gold2)');
  save(); updateTop();
  const btn = document.getElementById('bt-skip'); btn.textContent = 'Закрыть'; btn.onclick = () => closeBattle();
}
function unitImgChain(id) {
  if (id === 'roshan') return [spellIcon('roshan_slam'), ITEM_ICON('aegis')];
  if (id === 'creeps') return [ITEM_ICON('tango')];
  return heroImgChain(id);
}
function closeBattle(keep) {
  document.getElementById('battle').classList.remove('show');
  if (BT && BT.prevSpeed) speed = BT.prevSpeed;
  busy.battle = false; BT = null;
  if (!keep) { const c = Math.min(100, S.arena.cleared + 1); arenaSel = c; arenaLoc = locOf(c).id; cmBan = -1; renderArena(); }
}
