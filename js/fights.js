// ================= ФАЙТЫ (2.3) =================
// Особые бои на локациях Dota: тройка, пятёрка, Торментор, Рошпит, Винсдум, «5 за активки».
// 2.7: каждый файт — раздел арены на 50 уровней с ростом сложности; бонус дня — за первую победу в файте.
const FIGHTS = [
  { id: 'trio', n: 'Тройка', ic: '⚔', g: 'g-top', d: 'Твои 3 сильнейших героя против трёх врагов подряд.', team: 3, waves: 3, pow: 0.62, rw: 1 },
  { id: 'five', n: 'Пятёрка', ic: '🛡', g: 'g-mid', d: 'Полный стак 5 на 5.', team: 5, waves: 5, pow: 1.05, rw: 1.4 },
  { id: 'tormentor', n: 'Торментор', ic: '💠', g: 'g-torm', d: 'Кристальный страж. Отражает часть урона в твою команду. Награда — Aghanim\'s Shard: +5% силы ульт главного героя навсегда (до 5 раз).', team: 5, boss: 'tormentor', pow: 1.1, rw: 1.6 },
  { id: 'roshpit', n: 'Рошпит', ic: '🦍', g: 'g-pit', d: 'Драка у логова: 4 врага, а за ними сам Рошан. Награда — Aegis.', team: 5, waves: 4, rosh: 1, pow: 1.25, rw: 2 },
  { id: 'wisdom', n: 'Винсдум', ic: '📘', g: 'g-wis', d: 'Бой за руну мудрости 3 на 3. Награда — +1 уровень случайному герою стака.', team: 3, waves: 3, pow: 0.7, rw: 0.8, xp: 1 },
  { id: 'actives', n: '5 за активки', ic: '⚡', g: 'g-bot', d: 'Файт на ультах: у всех ульта каждые 3 действия.', team: 5, waves: 5, pow: 1.15, rw: 1.4, fast: 1 }
];
function fightsDay() { const d = typeof arenaCycle === 'function' ? arenaCycle() : todayStr(); if (!S.fights || S.fights.d !== d) S.fights = { d, done: {} }; if (!S.fights.done) S.fights.done = {}; return S.fights; }
// 2.7: каждый файт — отдельный раздел арены на 50 уровней (CONFIG.fightsLadder).
// Уровень L файта по сложности = уровень арены L × step (50-й ≈ 100-й арены). Награда за первое прохождение — доля награды арены,
// каждые 10 уровней — особая награда файта. Плюс раз в день бонус за первую победу в файте (как раньше).
function fightProg() { S.fl = (S.fl && typeof S.fl === 'object' && !Array.isArray(S.fl)) ? S.fl : {}; return S.fl; }
function fightCleared(id) { return Math.max(0, Math.min(CONFIG.fightsLadder.levels, Math.floor(fightProg()[id] || 0))); }
function fightEqL(L) { return Math.max(1, Math.min(100, Math.round(L * CONFIG.fightsLadder.step))); }
function fightLevelReward(f, L) { return Math.round(lvlReward(fightEqL(L)) * f.rw * CONFIG.fightsLadder.rwMul); }
function fightDef(f, L) {
  L = Math.max(1, Math.min(CONFIG.fightsLadder.levels, L || fightCleared(f.id) + 1));
  const eqL = fightEqL(L), R = Math.round(reqPower(eqL) * f.pow * CONFIG.fightsLadder.powMul * (CONFIG.fightsLadder.lp[f.id] || 1));
  const loc = locOf(eqL), r = seeded(L * 131 + f.id.length * 7);
  const pool = loc.pool.filter(id => HERO_BY_ID[id]);
  const waves = [];
  // с 26-го уровня у обычных файтов на одну волну больше
  const n = f.boss ? 1 : f.waves + (L > 25 ? 1 : 0);
  const parts = n + (f.rosh ? 1.6 : 0);
  for (let i = 0; i < n; i++) { const id = pool[Math.floor(r() * pool.length)]; waves.push({ id, power: Math.round(R / parts), boss: i === n - 1 && !f.rosh, name: HERO_BY_ID[id].name }); }
  if (f.boss) { waves[0] = { id: 'tormentor', power: R, boss: true, name: 'Торментор', mech: 'tormentor', hpMul: 1.3 }; }
  if (f.rosh) waves.push({ id: 'roshan', power: Math.round(R * 1.6 / parts), boss: true, name: 'Рошан', hpMul: 1.4 });
  const K = CONFIG.arena.kBase * (1 + CONFIG.arena.kGrowth * (eqL - 1)) / waves.reduce((a, w) => a + Math.pow(w.power / R, 2), 0) * (f.boss ? 0.6 : 1);
  return { L: 0, fl: L, loc: Object.assign({}, loc, { g: f.g, name: f.n + ' · уровень ' + L }), waves, R, K, reward: fightLevelReward(f, L), fight: f.id, back: 'arena', teamSize: f.team, fastUlt: !!f.fast };
}
function startFight(id, L) {
  const f = FIGHTS.find(x => x.id === id); if (!f || busy.battle) return;
  L = L || fightCleared(id) + 1;
  if (L > fightCleared(id) + 1) return;
  startBattle(0, false, fightDef(f, L));
}
// особая награда каждые 10 уровней
function fightMilestone(f, L) {
  if (f.boss === 'tormentor') { if ((S.shards || 0) < 5) { S.shards = (S.shards || 0) + 1; return 'Aghanim\'s Shard (' + S.shards + '/5)'; } const g = Math.round(rewardScale() * 2); addGems(g); return '+' + fmt(g) + ' 🔶 (все Shard уже собраны)'; }
  if (f.rosh) { S.cons = S.cons || { aegis: 0, cheese: 0 }; S.cons.aegis++; S.cons.cheese = (S.cons.cheese || 0) + 1; return 'Aegis + Cheese'; }
  if (f.xp) { const ids = getStack().filter(x => S.heroes[x].level < CONFIG.maxLevel); if (ids.length) { const h = pick(ids); S.heroes[h].level = Math.min(CONFIG.maxLevel, S.heroes[h].level + 2); return HERO_BY_ID[h].name + ' +2 ур.'; } return ''; }
  const rar = L >= 50 ? 'arcana' : L >= 40 ? 'immortal' : L >= 20 ? 'mythical' : 'rare';
  const it = addEquipment(mainHeroId(), rar); return it.name + ' (' + RARITY_NAMES[it.rarity] + ')';
}
function endFightBattle(def, result, st) {
  const f = FIGHTS.find(x => x.id === def.fight), day = fightsDay(), L = def.fl || 1;
  let msg = f.n + ' · уровень ' + L + ': ' + (result.win ? 'ПОБЕДА' : 'поражение');
  st.textContent = result.win ? '🏆 ПОБЕДА' : '💀 ПОРАЖЕНИЕ'; st.style.color = result.win ? 'var(--ok)' : 'var(--danger)'; sfx(result.win ? 'win' : 'lose');
  if (result.win) {
    const first = L === fightCleared(f.id) + 1;
    if (first) {
      fightProg()[f.id] = L; fightSel[f.id] = Math.min(CONFIG.fightsLadder.levels, L + 1);
      const g = fightLevelReward(f, L); addGems(g); msg += ' · уровень пройден! +' + fmt(g) + ' 🔶';
      if (L % 10 === 0) { const m = fightMilestone(f, L); if (m) msg += ' · 🎁 ' + m; }
    }
    if (!day.done[f.id]) {
      day.done[f.id] = 1;
      const g = Math.round(rewardScale() * f.rw * CONFIG.fightsLadder.dailyMul); addGems(g); msg += ' · бонус цикла +' + fmt(g) + ' 🔶';
    } else if (!first) msg += ' · повтор (награды уже получены)';
    track('fightsWon'); msg += hodWin(BT.team.map(t => t.id));
  }
  arenaLog(result.win ? 'win' : 'lose', msg); feed(msg, result.win ? 'var(--ok)' : 'var(--danger)');
  save(); updateTop();
  const btn = document.getElementById('bt-skip'); btn.textContent = 'Закрыть'; btn.onclick = () => closeBattle();
}
// старая панель «Файты» больше не нужна — файты стали разделами арены
function renderFights() { const box = document.getElementById('fights-box'); if (box) box.innerHTML = ''; }
// вкладки файтов и сетка 50 уровней (вызывается из renderArena)
function fightTabsHTML(cur) {
  return FIGHTS.map(f => { const c = fightCleared(f.id); return '<div class="loc-tab fight-tab ' + f.g + (cur === 'f:' + f.id ? ' active' : '') + '" data-click="setArenaLoc(\'f:' + f.id + '\')"><div>' + f.ic + ' ' + f.n + '<small>' + c + '/' + CONFIG.fightsLadder.levels + (fightsDay().done[f.id] ? ' · ✓ бонус' : ' · 🎁 бонус') + '</small></div></div>'; }).join('');
}
let fightSel = {};
function setFightSel(id, L) { fightSel[id] = L; renderArena(); }
function renderFightGrid(id) {
  const f = FIGHTS.find(x => x.id === id), c = fightCleared(id), N = CONFIG.fightsLadder.levels;
  if (!fightSel[id] || fightSel[id] > c + 1) fightSel[id] = Math.min(N, c + 1);
  const lg = document.getElementById('levels-grid'); lg.innerHTML = '';
  for (let L = 1; L <= N; L++) {
    const st = L <= c ? 'done' : L === c + 1 ? 'current' : 'locked';
    const b = document.createElement('div');
    b.className = 'lvl ' + st + (L === fightSel[id] ? ' sel' : '');
    const R = Math.round(reqPower(fightEqL(L)) * f.pow * CONFIG.fightsLadder.powMul * (CONFIG.fightsLadder.lp[f.id] || 1));
    b.innerHTML = L + '<small>' + (st === 'done' ? '✓' : fmtShort(R)) + '</small>' + (L % 10 === 0 ? '<span class="rw">🎁</span>' : '');
    b.title = f.n + ' · уровень ' + L + ' · сила врагов ' + fmt(R);
    if (st !== 'locked') b.onclick = () => setFightSel(id, L);
    lg.appendChild(b);
  }
  renderFightInfo(id);
}
function renderFightInfo(id) {
  const f = FIGHTS.find(x => x.id === id), L = fightSel[id], def = fightDef(f, L), c = fightCleared(id);
  const ch = winChanceEstimate(Object.assign({}, def, { L: L * 7 + 3 }));
  const chCol = ch > 0.75 ? 'var(--ok)' : ch > 0.4 ? 'var(--gold2)' : 'var(--danger)';
  const first = L === c + 1, ms = L % 10 === 0;
  const msName = f.boss === 'tormentor' ? 'Aghanim\'s Shard' : f.rosh ? 'Aegis + Cheese' : f.xp ? '+2 уровня герою стака' : 'снаряжение главному герою';
  const box = document.getElementById('level-info');
  box.innerHTML = '<div style="min-width:200px;flex:1"><div class="cinzel" style="font-size:1.2rem;color:#fff;font-weight:700">' + f.ic + ' ' + f.n + ' · уровень ' + L + '</div><div class="muted" style="font-size:.8rem">' + esc(f.d) + '</div>' +
    '<div style="font-size:.85rem;margin-top:4px">Сила врагов: <b style="color:var(--dire)">' + fmt(def.R) + '</b> · твои ' + f.team + ' героя: <b style="color:var(--radiant)">' + fmt(getStack().slice(0, f.team).reduce((a, x) => a + heroPower(x), 0)) + '</b> · волн: ' + def.waves.length + '</div>' +
    '<div style="font-size:.85rem">Шанс победы ≈ <b style="color:' + chCol + '">' + Math.round(ch * 100) + '%</b></div>' + rolePanelHTML(def) + '</div>' +
    '<div style="flex:1;min-width:180px;font-size:.82rem">' + (first ? '<div>За прохождение: ' + gemHTML(def.reward) + '</div>' + (ms ? '<div>🎁 Каждые 10 уровней: ' + msName + '</div>' : '<div class="muted">🎁 На 10, 20, 30, 40, 50 уровнях: ' + msName + '</div>') : '<div class="muted">Уровень уже пройден — повтор без награды за уровень</div>') +
    '<div>' + (fightsDay().done[f.id] ? '<span class="muted">Бонус цикла за этот файт получен (обновится через ' + arenaCycleText() + ')</span>' : 'Бонус цикла (раз в 36 ч) за первую победу: ' + gemHTML(Math.round(rewardScale() * f.rw * CONFIG.fightsLadder.dailyMul))) + '</div></div>' +
    '<div style="display:flex;flex-direction:column;gap:6px"><button class="btn green big" data-click="startFight(\'' + f.id + '\',' + L + ')">⚔ В БОЙ</button></div>';
}
