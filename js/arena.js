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
// 2.4: после уровня rewardCapLevel награда растёт медленно (rewardGrowthAfter), а не ×1.085 за уровень
function lvlReward(L) { const A = CONFIG.arena, c = A.rewardCapLevel || 1e9; return Math.round(A.rewardBase * Math.pow(A.rewardGrowth, Math.min(L, c) - 1) * Math.pow(A.rewardGrowthAfter || A.rewardGrowth, Math.max(0, L - c))); }
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
// ---- бой считается движком js/battle.js (createBattle / simulateBattle) ----
// ---------- UI ----------
let arenaLoc = null, arenaSel = null;
function initArena() { arenaLoc = null; arenaSel = null; }
function setMainHero(id) { S.mainHero = id === 'auto' ? null : id; if (S.customStack && HERO_BY_ID[id]) { const cs = S.customStack.filter(x => x !== id); cs.unshift(id); S.customStack = cs.slice(0, 5); } save(); renderArena(); updateTop(); }
// ---------- 2.3: свой стак ----------
let stackDraft = null;
function openStackPicker() {
  stackDraft = (S.customStack && S.customStack.length === 5 ? S.customStack : getStack()).slice();
  renderStackPicker();
}
function renderStackPicker() {
  const fav = S.fav || [];
  const list = HEROES.slice().sort((a, b) => (fav.includes(b.id) - fav.includes(a.id)) || heroPower(b.id) - heroPower(a.id));
  const html = '<div class="muted" style="font-size:.8rem;margin-bottom:6px">Выбери 5 героев. Первый — главный (👑). Нажми на выбранного, чтобы убрать. ⭐ — избранные.</div>' +
    '<div class="sp-sel">' + [0, 1, 2, 3, 4].map(i => { const id = stackDraft[i]; return '<div class="sp-slot">' + (id ? '<img src="' + STEAM + 'heroes/' + id + '.png" referrerpolicy="no-referrer" alt=""><small>' + (i === 0 ? '👑 ' : '') + esc(HERO_BY_ID[id].name) + '</small>' : '<small>пусто</small>') + '</div>'; }).join('') + '</div>' +
    '<div class="sp-grid">' + list.map(h => '<button class="sp-h' + (stackDraft.includes(h.id) ? ' on' : '') + '" data-click="stackToggle(\'' + h.id + '\')"><img src="' + STEAM + 'heroes/' + h.id + '.png" referrerpolicy="no-referrer" alt=""><small>' + (fav.includes(h.id) ? '⭐' : '') + esc(h.name) + '<br>⚔' + fmtShort(heroPower(h.id)) + '</small></button>').join('') + '</div>';
  showModal('🧩', 'Свой стак', html, '', { html: true, buttons: [{ t: 'Сохранить', c: 'green', f: () => { if (stackDraft.length !== 5) return; S.customStack = stackDraft.slice(); S.mainHero = stackDraft[0]; save(); closeModal(); renderArena(); updateTop(); } }, { t: 'Авто (сильнейшие)', f: () => { S.customStack = null; save(); closeModal(); renderArena(); updateTop(); } }] });
}
function stackToggle(id) {
  if (!stackDraft) return;
  if (stackDraft.includes(id)) stackDraft = stackDraft.filter(x => x !== id);
  else if (stackDraft.length < 5) stackDraft.push(id);
  renderStackPicker();
}
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
    d.appendChild(n); d.onclick = openStackPicker; d.style.cursor = 'pointer'; pr.appendChild(d);
  });
  document.getElementById('stack-power').textContent = fmt(stackPower());
  renderShopPanel(); renderSynergyBox(); renderRoshan(); if (typeof renderCoop === 'function') renderCoop(); if (typeof renderFights === 'function') renderFights();
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
// 2.4: панель перед боем — роли врагов, кого контрит твой стак и кто контрит тебя
function rolePanelHTML(def) {
  const mine = getStack().map(heroRole), foes = def.waves.map(w => heroRole(w.id));
  const tag = (r, cls) => '<span class="rt ' + (cls || '') + '" title="' + ROLE_INFO[r].d + '">' + ROLE_INFO[r].i + ' ' + ROLE_INFO[r].n + '</span>';
  const uniq = a => [...new Set(a)];
  const good = uniq(foes.filter(f => mine.some(m => roleMul(m, f) > 1)));
  const bad = uniq(foes.filter(f => mine.some(m => roleMul(f, m) > 1)));
  return '<div class="role-row"><span class="muted">Враги:</span>' + uniq(foes).map(r => tag(r, good.includes(r) && !bad.includes(r) ? 'good' : bad.includes(r) && !good.includes(r) ? 'bad' : '')).join('') + '</div>' +
    (def.counterRole ? '<div class="muted" style="font-size:.74rem">⚠ Часть врагов подобрана против твоих «' + ROLE_INFO[def.counterRole].n + '». Смени стак, чтобы контрить их.</div>' : '') +
    '<details style="font-size:.74rem"><summary class="muted" style="cursor:pointer">Как работают роли</summary>' + Object.keys(ROLE_INFO).map(r => '<div>' + ROLE_INFO[r].i + ' <b>' + ROLE_INFO[r].n + '</b> (' + (roleLine(r) === 'front' ? 'перед' : 'зад') + ') — ' + ROLE_INFO[r].d + '. Сильнее против: ' + roleBeats(r).map(x => ROLE_INFO[x].i).join(' ') + ' (+15%)</div>').join('') + '<div class="muted">Зелёная роль — у тебя есть ответ, красная — она контрит кого-то в твоём стаке.</div></details>';
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
    '<div style="font-size:.85rem">Шанс победы ≈ <b style="color:' + chCol + '">' + Math.round(ch * 100) + '%</b></div>' + rolePanelHTML(def) + '</div>' +
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
    d.title = w.name + ' · ' + ROLE_INFO[heroRole(w.id)].n + ' · ⚔ ' + fmt(w.power) + (w.counter ? ' · подобран против твоего стака' : '');
    if (w.counter) d.classList.add('counter');
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
  const bt = def.coop ? { team: def.coopTeam, tm: {}, ids: def.coopTeam.map(t => t.id) } : buildTeam({ noCons: !!def.roshan, size: def.teamSize });
  def.team = bt.tm;
  const team = bt.team;
  // 2.4 античит PvP: бой идёт от сида, все действия пишутся в лог — в конце бой переигрывается и сверяется
  const pvpSeed = def.pvp ? (Math.floor(Math.random() * 4294967295) >>> 0) : null;
  const engine = def.coop ? createBattle(team, def, seeded(def.coopNet.seed), { maxTicks: COOP.maxTicks, manualUlt: true }) : createBattle(team, def, def.pvp ? seeded(pvpSeed) : null, { maxTicks: def.roshan ? 14 : 400, manualUlt: !!S.manualUlt });
  busy.battle = true;
  BT = { L, def, team, engine, result: null, chain, tick: 0, skip: false, timer: null, wave: 0, prevSpeed: speed, inputs: [], mult: S.btMult || 1, focus: 'auto', back: null };
  if (def.coop) coopInit(def);
  if (def.pvp) { BT.seed = pvpSeed; BT.log = []; BT.man0 = !!S.manualUlt; }
  if (def.turbo) speed = 'fast';
  sfx('start');
  const stage = document.getElementById('bt-stage');
  document.getElementById('bt-ground').className = 'ground ' + def.loc.g;
  document.getElementById('bt-title').textContent = def.coop ? 'Кооп · ' + COOP_BOSSES[def.coop.bi].n + ' · ' + def.coopNet.names.join(' + ') : def.pvp ? 'PvP · против ' + def.pvp.nick : def.roshan ? 'Логово Рошана' : def.survival ? 'Выживание · ' + def.loc.name : 'Уровень ' + L + ' · ' + def.loc.name + (def.turbo ? ' · TURBO' : '');
  document.getElementById('bt-sub').textContent = 'Сила стака ' + fmt(stackPower()) + ' vs ' + fmt(def.R) + ' · ' + def.waves.length + ' волн';
  document.getElementById('bt-status').textContent = '⚔';
  document.getElementById('bt-status').style.color = '';
  document.getElementById('bt-feed').innerHTML = '';
  document.getElementById('bt-log').innerHTML = '';
  renderBtControls();
  document.getElementById('bt-skip').textContent = def.coop ? 'Выйти' : 'Пропустить ⏩';
  document.getElementById('bt-skip').onclick = def.coop ? () => { if (BT && !BT.ended && window.confirm('Выйти из кооп-боя? Напарника заменит бот.')) { coopLeave(); BT.skip = true; clearTimeout(BT.timer); BT.result = { win: false, ticks: [], alive: 0, used: {}, wavesCleared: 0, dmgDealt: 0 }; endBattle(); } } : battleSkip;
  // towers
  stage.querySelectorAll('.tower').forEach(t => t.remove());
  [['8%', '#3fbf4f'], ['88%', '#d0402e']].forEach(([x, c]) => {
    const t = document.createElement('div'); t.className = 'tower'; t.style.left = x;
    t.innerHTML = '<svg viewBox="0 0 34 70" width="34" height="70"><path d="M6 70 L10 22 L4 22 L17 2 L30 22 L24 22 L28 70Z" fill="#2a2e33" stroke="#000"/><circle cx="17" cy="20" r="5" fill="' + c + '" style="filter:drop-shadow(0 0 6px ' + c + ')"/></svg>';
    stage.appendChild(t);
  });
  const left = document.getElementById('bt-left'); left.innerHTML = '';
  team.forEach((t, i) => { const mine = !BT.coop || BT.coop.myIdx.includes(i); const u = unitEl(t.id, HERO_BY_ID[t.id].name, t.p, (i === 0 && !BT.coop ? 'main ' : '') + roleLine(heroRole(t.id)) + (BT.coop ? ' coop p' + (t.owner || 0) + (mine ? ' mine' : ' mate') : ''), false, mine); u.dataset.i = i; u.onclick = () => queueUlt(i); left.appendChild(u); });
  if (BT.coop) { left.classList.add('six'); const s = document.createElement('div'); s.id = 'bt-coop-st'; s.className = 'bt-coop-st'; stage.appendChild(s); } else { left.classList.remove('six'); const s = document.getElementById('bt-coop-st'); if (s) s.remove(); }
  const right = document.getElementById('bt-right'); right.innerHTML = '';
  showWave(0, false);
  renderQueue(0);
  document.getElementById('battle').classList.add('show');
  const syn = activeSynergies(bt.ids);
  feed(def.coop ? COOP_BOSSES[def.coop.bi].d + ' Твои герои — с золотой рамкой.' : def.roshan ? 'Рошан проснулся! У тебя 14 ходов.' : def.survival ? 'Выживание: держись как можно дольше!' : 'Бой начинается! Против тебя ' + def.waves.length + ' противников подряд.' + (syn.length ? ' Синергии: ' + syn.map(x => x.name).join(', ') : ''));
  BT.timer = setTimeout(playTick, btDelay(speed === 'fast' ? 300 : 700));
}
// ---------- управление боем: скорость x1/x2/x4, ручная ульта, лог ----------
function btDelay(ms) { return Math.round(ms / ((BT && BT.mult) || 1)); }
function renderBtControls() {
  const box = document.getElementById('bt-ctrl'); if (!box) return;
  const m = (BT && BT.mult) || S.btMult || 1;
  if (BT && BT.coop) { box.innerHTML = '<button class="btn sm gold" data-click="coopTaunt()" title="Босс бьёт того, у кого агро. Твои герои получают меньше урона, но и бьют слабее — второй игрок бьёт в спину ×' + CONFIG.combat.coop.backstab + '">🛡 Забрать агро</button><button class="btn sm ' + (BT.focus !== 'auto' ? 'gold' : 'ghost') + '" data-click="coopFocus()">🎯 ' + FOCUS_NAME[BT.focus || 'auto'] + '</button><span class="muted" style="font-size:.72rem;align-self:center">Ульты — нажатием на своего героя</span>'; return; }
  box.innerHTML = [1, 2, 4].map(x => '<button class="btn sm ' + (m === x ? 'gold' : 'ghost') + '" data-click="setBtMult(' + x + ')">x' + x + '</button>').join('') +
    '<button class="btn sm ' + (S.manualUlt ? 'gold' : 'ghost') + '" data-click="toggleManualUlt()" title="Вручную: нажми на героя в удачный момент (он светится золотом) — ульта сильнее ×' + CONFIG.combat.ultTiming + '. Сами: без бонуса, для лёгких боёв">' + (S.manualUlt ? '✋ Ульты вручную' : '🤖 Ульты сами') + '</button>' +
    '<button class="btn sm ' + (BT && BT.focus !== 'auto' ? 'gold' : 'ghost') + '" data-click="cycleFocus()" title="Кого бить: авто — прыгуны бьют заднего, остальные переднего; передний — все по переднему; задний — все по заднему (не прыгуны слабее)">🎯 ' + FOCUS_NAME[(BT && BT.focus) || 'auto'] + '</button>';
}
const FOCUS_NAME = { auto: 'Фокус: авто', front: 'Фокус: передний', back: 'Фокус: задний' };
function cycleFocus() {
  if (!BT || !BT.engine || BT.engine.done) return;
  const order = ['auto', 'front', 'back'];
  BT.focus = order[(order.indexOf(BT.focus || 'auto') + 1) % 3];
  BT.engine.setFocus(BT.focus); renderBtControls();
  feed('🎯 ' + FOCUS_NAME[BT.focus], 'var(--gold2)');
}
function setBtMult(x) { x = [1, 2, 4].includes(+x) ? +x : 1; S.btMult = x; if (BT) BT.mult = x; save(); renderBtControls(); }
function toggleManualUlt() {
  if (BT && BT.coop) return;
  S.manualUlt = !S.manualUlt; save(); renderBtControls();
  if (BT && BT.engine && !BT.engine.done) { BT.engine.setManual(S.manualUlt); }
  if (BT) feed(S.manualUlt ? '✋ Ульты вручную: нажми на героя, когда его шкала светится' : '🤖 Ульты срабатывают сами', 'var(--gold2)');
}
function queueUlt(i) {
  if (!BT || !BT.engine || BT.engine.done || !(S.manualUlt || BT.coop)) return;
  if (BT.coop && !BT.coop.myIdx.includes(i)) return;
  const u = document.getElementById('bt-left').children[i];
  if (!u || !u.classList.contains('ult-ready')) return;
  if (!BT.inputs.includes(i)) BT.inputs.push(i);
  u.classList.add('ult-queued');
}
function btLog(text, col) {
  const l = document.getElementById('bt-log'); if (!l || !text) return;
  const d = document.createElement('div'); d.textContent = text; if (col) d.style.color = col;
  l.prepend(d); while (l.children.length > 40) l.lastChild.remove();
}
function setStatus(el, list) {
  if (!el) return; let s = el.querySelector('.ustat');
  if (!s) { s = document.createElement('div'); s.className = 'ustat'; el.appendChild(s); }
  s.textContent = (list || []).map(k => STATUS_ICON[k] || '').join('');
}
// 2.3: облик (скин) героя заменяет его картинку в бою
function heroSkin(id) {
  if (!S || !S.items) return null;
  const sel = S.skinSel && S.skinSel[id];
  const chosen = sel && S.items.find(x => x.uid === sel && x.heroId === id && x.type === 'skin');
  if (chosen) return chosen;
  return S.items.filter(x => x.type === 'skin' && x.heroId === id && x.path).sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity))[0] || null;
}
function heroLookChain(id) { const sk = heroSkin(id); return sk && sk.path ? [itemImg(sk.path)].concat(heroImgChain(id)) : heroImgChain(id); }
function unitEl(id, name, p, cls, enemy, mine) {
  const u = document.createElement('div'); u.className = 'unit ' + (enemy ? 'enemy ' : '') + cls;
  u.appendChild(mkImg(mine ? heroLookChain(id) : unitImgChain(id), name, 'uimg'));
  const nm = document.createElement('div'); nm.className = 'uname'; nm.textContent = (HERO_BY_ID[id] || id === 'roshan' ? ROLE_INFO[heroRole(id)].i + ' ' : '') + name + ' ⚔' + fmtShort(p); u.appendChild(nm);
  const ul = ultOf(id);
  const ic = mkImg(ultIconChain(id), ul.name, 'uult'); ic.title = ul.name + ' — ' + EFFECT_NAME[ul.type]; u.appendChild(ic);
  const b = document.createElement('div'); b.className = 'ubar'; b.innerHTML = '<div style="width:100%"></div>'; u.appendChild(b);
  const m = document.createElement('div'); m.className = 'umana'; m.innerHTML = '<div style="width:0%"></div>'; u.appendChild(m);
  const c = document.createElement('div'); c.className = 'ucharge'; c.innerHTML = '<div style="width:0%"></div>'; u.appendChild(c);
  const st = document.createElement('div'); st.className = 'ustat'; u.appendChild(st);
  return u;
}
function showWave(i, animate, hp) {
  if (!BT) return;                                         // бой уже закрыт (отложенная анимация)
  const w = BT.def.waves[i];
  const right = document.getElementById('bt-right'); right.innerHTML = '';
  const u = unitEl(w.id, w.name, w.power, w.boss ? 'boss' : '', true);
  u.dataset.w = i;
  if (hp != null) u.querySelector('.ubar div').style.width = (hp * 100) + '%';
  if (animate) u.classList.add('enter');
  right.appendChild(u);
  BT.back = null;
  let bi = -1; const E = BT.engine && BT.engine.E;
  if (E && !BT.def.roshan) for (let j = i + 1; j < E.length; j++) if (E[j].alive) { bi = j; break; }
  showBack(bi, E && bi >= 0 ? E[bi].hp / E[bi].max : 1);
}
// 2.4: задний враг (вторая линия) — виден справа сзади и бьёт издалека
function showBack(bi, hp) {
  if (!BT) return;
  const right = document.getElementById('bt-right');
  const old = right.querySelector('.unit.back'); if (old) old.remove();
  BT.back = bi; if (bi == null || bi < 0) return;
  const w = BT.def.waves[bi]; if (!w) return;
  const u = unitEl(w.id, w.name, w.power, 'back' + (w.boss ? ' boss' : ''), true);
  u.dataset.w = bi; u.title = 'Задняя линия: бьёт издалека слабее. Фокус «по заднему» — бить его';
  setBar(u, '.ubar div', hp);
  right.appendChild(u);
}
function enemyElFor(w) { const r = document.getElementById('bt-right'); return (w != null && r.querySelector('.unit[data-w="' + w + '"]')) || r.firstChild; }
// роль героя значком
function roleBadge(id) { const r = ROLE_INFO[heroRole(id)]; return '<span class="role-b" title="' + r.n + ': ' + r.d + '">' + r.i + '</span>'; }
function renderQueue(cur) {
  if (!BT) return;
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
  t.innerHTML = '<div>' + esc(ul.name.toUpperCase()) + '</div><div style="font-family:Roboto Condensed;font-size:.8rem;letter-spacing:1px;color:#fff">' + esc(hero ? hero.name : (BT && BT.def.waves[BT.wave] ? BT.def.waves[BT.wave].name : id)) + ' · ' + EFFECT_NAME[ul.type] + '</div>';
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
  if (!BT || BT.ended) return;
  if (BT.engine.done) { BT.result = BT.engine.result(); return endBattle(); }
  const inp = BT.coop ? coopTickInputs() : BT.inputs.splice(0);
  if (inp === null) { BT.timer = setTimeout(playTick, 250); return; }   // кооп: ждём ход напарника
  if (BT.log) BT.log.push([BT.tick, inp.slice(), !!S.manualUlt, BT.focus || 'auto']);
  const ev = BT.engine.step(inp);
  BT.tick++;
  if (!ev) { BT.result = BT.engine.result(); return endBattle(); }
  const left = document.getElementById('bt-left').children;
  const step = btDelay(speed === 'fast' ? 70 : 120);
  const late = btDelay(speed === 'fast' ? 150 : 280);
  let delay = 0;
  ev.forEach(e => {
    setTimeout(() => {
      if (!BT || BT.skip) return;
      const enemyEl = enemyElFor(e.wave);
      if (e.k === 'hit' || e.k === 'ult') {
        const id = BT.team[e.from].id, hero = HERO_BY_ID[id];
        if (e.log) btLog('⚡ ' + e.log, EFFECT_COLOR[e.type]);
        if (e.k === 'hit' && e.miss) floatDmg(enemyEl || left[e.from], 'промах', '', '#aaa');
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
        if (e.timing) { floatDmg(left[e.from], '✨ ИДЕАЛЬНО ×' + CONFIG.combat.ultTiming, 'crit', '#ffe36a'); feed('✨ Идеальный момент для ульты: ×' + CONFIG.combat.ultTiming, '#ffe36a'); }
        if (e.splash) e.splash.forEach(j => { const be = enemyElFor(j); if (be && be !== enemyEl && BT.engine) { const x = BT.engine.E[j]; setBar(be, '.ubar div', x.hp / x.max); } });
      } else if (e.k === 'skill') {
        const id = BT.team[e.from].id, hero = HERO_BY_ID[id], k = SKILL_KIND[e.kind] || SKILL_KIND.dmg;
        btLog(k.i + ' ' + e.log, k.c);
        skillPop(left[e.from], e.key, id, e.name, k.c);
        if (e.miss) { if (enemyEl) floatDmg(enemyEl, 'промах', '', '#aaa'); }
        else if (e.kind === 'heal' && e.to != null) { setBar(left[e.to], '.ubar div', e.thp); stageFx('healfx', left[e.to]); }
        else if (e.kind === 'shield' || e.kind === 'buff' || e.kind === 'summon') { left[e.from].classList.add(e.kind === 'shield' ? 'shielded' : 'buffed'); setTimeout(() => left[e.from] && left[e.from].classList.remove('shielded', 'buffed'), btDelay(1200)); }
        else if (enemyEl) {
          if (e.dmg > 0) heroFx(left[e.from], enemyEl, hero, { crit: false, ulti: false, dmg: e.dmg });
          if (e.stun) stageFx('stunfx', enemyEl);
          if (e.kind === 'aoe') stageFx('shock', enemyEl, k.c);
          setTimeout(() => setBar(enemyEl, '.ubar div', e.hp), late);
        }
      } else if (e.k === 'eskill') {
        const w = BT.def.waves[BT.wave], k = SKILL_KIND[e.kind] || SKILL_KIND.dmg;
        btLog(k.i + ' ' + e.log, '#ff9a8a');
        if (enemyEl) skillPop(enemyEl, e.key, w.id, e.name, k.c);
        if (e.ehp != null && enemyEl) { setBar(enemyEl, '.ubar div', e.ehp); stageFx('healfx', enemyEl); }
        e.hits.forEach(([ti, d, hp]) => setTimeout(() => { const t = left[ti]; if (!t) return; setBar(t, '.ubar div', hp); if (d > 0) { t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); floatDmg(t, '-' + fmtShort(d), '', '#ff7a6a'); } else if (!e.st) floatDmg(t, 'уклон', '', '#aaa'); }, 150));
        if (e.stunned != null) setTimeout(() => stageFx('stunfx', left[e.stunned]), 200);
      } else if (e.k === 'poison') {
        if (enemyEl) { floatDmg(enemyEl, '☠' + fmtShort(e.dmg), '', '#7ad35a'); setBar(enemyEl, '.ubar div', e.hp); }
      } else if (e.k === 'tpoison') {
        const t = left[e.to]; if (t) { floatDmg(t, '☠' + fmtShort(e.dmg), '', '#7ad35a'); setBar(t, '.ubar div', e.hp); }
      } else if (e.k === 'log') {
        btLog(e.text);
      } else if (e.k === 'st') {
        e.m.forEach((v, i) => { const u = left[i]; if (!u) return; setBar(u, '.umana div', v); setBar(u, '.ucharge div', e.c[i]); setStatus(u, e.s[i]); u.classList.toggle('ult-ready', !!e.r[i]); u.classList.toggle('ult-good', !!((S.manualUlt || BT.coop) && e.g && e.g[i])); if (e.co) u.classList.toggle('aggro', (BT.team[i].owner || 0) === e.co.a && (e.co.m.includes('aggro') || e.co.m.includes('swap'))); u.classList.toggle('manual', !!S.manualUlt); if (!e.r[i]) u.classList.remove('ult-queued'); });
        const fr = document.getElementById('bt-right').firstChild;
        if (fr) { setStatus(fr, e.es); setBar(fr, '.ucharge div', e.eu); fr.classList.toggle('eult-soon', e.eu >= 0.99); }
        if (e.bi !== undefined && e.bi !== BT.back) showBack(e.bi, e.bhp);
        else if (e.bi >= 0) { const be = enemyElFor(e.bi); if (be && be.classList.contains('back')) setBar(be, '.ubar div', e.bhp); }
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
        if (e.log) btLog('⚡ ' + e.log, '#ff9a8a');
        if (e.ehp != null) { setBar(enemyEl, '.ubar div', e.ehp); if (enemyEl) stageFx('healfx', enemyEl); feed('💚 ' + w.name + ' лечится', '#ff9a8a'); }
        e.hits.forEach(([ti, d, hp]) => setTimeout(() => { const t = left[ti]; if (!t) return; t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setBar(t, '.ubar div', hp); floatDmg(t, '-' + fmtShort(d), 'crit', '#ff5a3a'); }, 200));
        if (e.bkb != null) feed('🟡 BKB: ' + HERO_BY_ID[BT.team[e.bkb].id].name + ' не оглушён', '#ffd36a');
        if (e.stunned != null) { setTimeout(() => stageFx('stunfx', left[e.stunned]), 200); feed('💫 ' + HERO_BY_ID[BT.team[e.stunned].id].name + ' оглушён', '#ff9a8a'); }
        else if (e.hits.length > 1) feed('💥 ' + ultOf(w.id).name + ' бьёт по всей команде', '#ff9a8a');
      } else if (e.k === 'ehit') {
        const t = left[e.to];
        if (e.back) { const be = enemyElFor(e.wave); if (be) { be.classList.remove('lunge-l'); void be.offsetWidth; be.classList.add('lunge-l'); } setTimeout(() => { if (!t) return; t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setBar(t, '.ubar div', e.hp); floatDmg(t, '🏹-' + fmtShort(e.dmg), '', '#ff9a6a'); }, 150); return; }
        if (enemyEl) { enemyEl.classList.remove('lunge-l'); void enemyEl.offsetWidth; enemyEl.classList.add('lunge-l'); }
        setTimeout(() => { t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); setBar(t, '.ubar div', e.hp); floatDmg(t, e.miss ? 'уклон' : '-' + fmtShort(e.dmg), '', e.miss ? '#aaa' : '#ff7a6a'); }, 150);
      } else if (e.k === 'aegis') {
        const t = left[e.to]; setBar(t, '.ubar div', 1); stageFx('healfx', t); floatDmg(t, 'AEGIS', 'crit', '#ffd36a'); feed('🛡 Aegis! ' + HERO_BY_ID[BT.team[e.to].id].name + ' возрождается', '#ffd36a');
      } else if (e.k === 'cheese') {
        const t = left[e.to]; setBar(t, '.ubar div', 1); stageFx('healfx', t); floatDmg(t, '🧀 +100%', 'crit', '#ffe34a'); feed('🧀 Cheese! Полное лечение', '#ffe34a');
      } else if (e.k === 'rapier') {
        feed('⚔ Divine Rapier выпала!', 'var(--danger)');
      } else if (e.k === 'ekill') {
        btLog('☠ ' + BT.def.waves[e.wave].name + ' повержен', 'var(--ok)');
        setTimeout(() => { if (!BT) return; const de = enemyElFor(e.wave); if (de) de.classList.add('dead'); feed('☠ ' + BT.def.waves[e.wave].name + ' повержен!', 'var(--ok)'); }, 250);
      } else if (e.k === 'tkill') {
        btLog('💀 ' + HERO_BY_ID[BT.team[e.to].id].name + ' погиб', 'var(--danger)');
        setTimeout(() => { if (!BT || !left[e.to]) return; left[e.to].classList.add('dead'); feed('💀 ' + HERO_BY_ID[BT.team[e.to].id].name + ' погиб', 'var(--danger)'); }, 300);
      } else if (e.k === 'wave') {
        BT.wave = e.wave;
        setTimeout(() => { if (!BT || BT.skip) return; showWave(e.wave, true, e.hp); renderQueue(e.wave); feed('Следующий противник: ' + BT.def.waves[e.wave].name + (BT.def.waves[e.wave].boss ? ' (БОСС)' : '')); }, 350);
      }
    }, delay);
    delay += e.k === 'st' || e.k === 'log' ? 0 : e.k === 'hit' ? step : e.k === 'ult' || e.k === 'eult' ? step * 4 : e.k === 'skill' || e.k === 'eskill' ? step * 2.2 : step * 1.4;
  });
  BT.timer = setTimeout(playTick, delay + btDelay(speed === 'fast' ? 240 : 460));
}
function battleSkip() { if (!BT) return; if (BT.log) BT.log.skip = BT.tick; BT.skip = true; clearTimeout(BT.timer); BT.result = BT.engine.finish(); endBattle(); }
// всплывающая иконка навыка над героем
function skillPop(el, key, heroId, name, col) {
  if (!el) return;
  const p = relPos(el), d = document.createElement('div'); d.className = 'skpop';
  d.style.left = (p.x - 18) + 'px'; d.style.top = (p.y - 70) + 'px'; d.style.borderColor = col;
  d.appendChild(mkImg(skillIconChain(key, heroId), name));
  document.getElementById('bt-stage').appendChild(d); setTimeout(() => d.remove(), btDelay(900));
}
function endBattle() {
  if (!BT || BT.ended) return;
  BT.ended = true; clearTimeout(BT.timer);
  if (!BT.result) BT.result = BT.engine.finish();
  const { L, def, result } = BT;
  const st = document.getElementById('bt-status');
  const replay = L <= S.arena.cleared;
  let msg;
  speed = BT.prevSpeed;
  consumeAfterBattle(result.used);
  if (def.fight) { endFightBattle(def, result, st); return; }
  if (def.roshan || def.survival || def.pvp || def.coop) { endSpecialBattle(def, result, st); return; }
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
    msg = 'Уровень ' + L + ' пройден! +' + fmt(g) + ' 🔶' + (got.length ? ' · ' + got.map(x => x.name + ' (' + RARITY_NAMES[x.rarity] + ')').join(', ') : '') + hodWin(BT.team.map(t => t.id));
    arenaLog('win', '🏆 ' + msg);
    feed(msg, 'var(--ok)');
  } else {
    st.textContent = '💀 ПОРАЖЕНИЕ'; st.style.color = 'var(--danger)'; sfx('lose'); S.winStreak = 0;
    const pd = todayStr(); if (!S.pityDay || S.pityDay.d !== pd) S.pityDay = { d: pd, n: 0 };
    const pity = S.pityDay.n++ < CONFIG.arena.pityPerDay ? Math.round(def.reward * CONFIG.arena.pity) : 0;
    addGems(pity); S.arena.losses++;
    msg = 'Поражение на уровне ' + L + ' (дошёл до волны ' + (Math.min(def.waves.length, result.ticks.filter(t => t.some(e => e.k === 'wave')).length + 1)) + '/' + def.waves.length + '). Утешение +' + fmt(pity) + ' 🔶';
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
  if (def.coop) msg = coopResult(def, result, st);
  else if (def.pvp) {
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
      msg = 'Рошан повержен! Aegis + Cheese + ' + fmt(g) + ' 🔶 + ' + it.name; track('roshanKills');
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
    msg = 'Выживание: пройдено ' + n + ' волн' + (rec ? ' — НОВЫЙ РЕКОРД!' : '') + ' · +' + fmt(g) + ' 🔶';
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
  if (id === 'tormentor') return [ITEM_ICON('aghanims_shard'), spellIcon('miniboss_reflect')];
  return heroImgChain(id);
}
function closeBattle(keep) {
  document.getElementById('battle').classList.remove('show');
  if (BT && BT.prevSpeed) speed = BT.prevSpeed;
  const back = BT && BT.def && BT.def.back;
  busy.battle = false; BT = null;
  if (back) { switchTab(back); return; }                 // 2.3: после PvP/дуэли/файтов — обратно туда, откуда пришёл
  if (!keep) { const c = Math.min(100, S.arena.cleared + 1); arenaSel = c; arenaLoc = locOf(c).id; cmBan = -1; renderArena(); }
}
