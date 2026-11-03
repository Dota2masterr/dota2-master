// ================= ФАЙТЫ (2.3) =================
// Особые бои на локациях Dota: тройка, пятёрка, Торментор, Рошпит, Винсдум, «5 за активки».
// Каждый файт даёт награду один раз в день (повторять можно без награды). Сложность — от твоего уровня арены.
const FIGHTS = [
  { id: 'trio', n: 'Тройка', ic: '⚔', g: 'g-top', d: 'Твои 3 сильнейших героя против трёх врагов подряд.', team: 3, waves: 3, pow: 0.62, rw: 1 },
  { id: 'five', n: 'Пятёрка', ic: '🛡', g: 'g-mid', d: 'Полный стак 5 на 5.', team: 5, waves: 5, pow: 1.05, rw: 1.4 },
  { id: 'tormentor', n: 'Торментор', ic: '💠', g: 'g-torm', d: 'Кристальный страж. Отражает часть урона в твою команду. Награда — Aghanim\'s Shard: +5% силы ульт главного героя навсегда (до 5 раз).', team: 5, boss: 'tormentor', pow: 1.1, rw: 1.6 },
  { id: 'roshpit', n: 'Рошпит', ic: '🦍', g: 'g-pit', d: 'Драка у логова: 4 врага, а за ними сам Рошан. Награда — Aegis.', team: 5, waves: 4, rosh: 1, pow: 1.25, rw: 2 },
  { id: 'wisdom', n: 'Винсдум', ic: '📘', g: 'g-wis', d: 'Бой за руну мудрости 3 на 3. Награда — +1 уровень случайному герою стака.', team: 3, waves: 3, pow: 0.7, rw: 0.8, xp: 1 },
  { id: 'actives', n: '5 за активки', ic: '⚡', g: 'g-bot', d: 'Файт на ультах: у всех ульта каждые 3 действия.', team: 5, waves: 5, pow: 1.15, rw: 1.4, fast: 1 }
];
function fightsDay() { const d = todayStr(); if (!S.fights || S.fights.d !== d) S.fights = { d, done: {} }; return S.fights; }
function fightDef(f) {
  const L = Math.min(100, S.arena.cleared + 1), R = Math.round(reqPower(L) * f.pow);
  const loc = locOf(L), r = seeded(L * 131 + f.id.length * 7 + new Date().getDate());
  const pool = loc.pool.filter(id => HERO_BY_ID[id]);
  const waves = [];
  const n = f.boss ? 1 : f.waves;
  const parts = n + (f.rosh ? 1.6 : 0);
  for (let i = 0; i < n; i++) { const id = pool[Math.floor(r() * pool.length)]; waves.push({ id, power: Math.round(R / parts), boss: i === n - 1 && !f.rosh, name: HERO_BY_ID[id].name }); }
  if (f.boss) { waves[0] = { id: 'tormentor', power: R, boss: true, name: 'Торментор', mech: 'tormentor', hpMul: 1.3 }; }
  if (f.rosh) waves.push({ id: 'roshan', power: Math.round(R * 1.6 / parts), boss: true, name: 'Рошан', hpMul: 1.4 });
  const K = CONFIG.arena.kBase * (1 + CONFIG.arena.kGrowth * (L - 1)) / waves.reduce((a, w) => a + Math.pow(w.power / R, 2), 0) * (f.boss ? 0.6 : 1);
  return { L: 0, loc: Object.assign({}, loc, { g: f.g }), waves, R, K, reward: 0, fight: f.id, back: 'arena', teamSize: f.team, fastUlt: !!f.fast };
}
function startFight(id) {
  const f = FIGHTS.find(x => x.id === id); if (!f || busy.battle) return;
  startBattle(0, false, fightDef(f));
}
function endFightBattle(def, result, st) {
  const f = FIGHTS.find(x => x.id === def.fight), day = fightsDay();
  let msg = f.n + ': ' + (result.win ? 'ПОБЕДА' : 'поражение');
  st.textContent = result.win ? '🏆 ПОБЕДА' : '💀 ПОРАЖЕНИЕ'; st.style.color = result.win ? 'var(--ok)' : 'var(--danger)'; sfx(result.win ? 'win' : 'lose');
  if (result.win && !day.done[f.id]) {
    day.done[f.id] = 1;
    const g = Math.round(rewardScale() * f.rw); addGems(g); msg += ' · +' + fmt(g) + ' 🔶';
    if (f.boss === 'tormentor') { S.shards = Math.min(5, (S.shards || 0) + 1); msg += ' · Aghanim\'s Shard (' + S.shards + '/5)'; }
    if (f.rosh) { S.cons = S.cons || { aegis: 0, cheese: 0 }; S.cons.aegis++; msg += ' · Aegis'; }
    if (f.xp) { const ids = getStack().slice(0, 3).filter(x => S.heroes[x].level < CONFIG.maxLevel); if (ids.length) { const h = pick(ids); S.heroes[h].level++; msg += ' · ' + HERO_BY_ID[h].name + ' +1 ур.'; } }
    track('fightsWon'); msg += hodWin(BT.team.map(t => t.id));
  } else if (result.win) msg += ' · награда за этот файт сегодня уже получена';
  arenaLog(result.win ? 'win' : 'lose', msg); feed(msg, result.win ? 'var(--ok)' : 'var(--danger)');
  save(); updateTop();
  const btn = document.getElementById('bt-skip'); btn.textContent = 'Закрыть'; btn.onclick = () => closeBattle();
}
function renderFights() {
  const box = document.getElementById('fights-box'); if (!box) return;
  const day = fightsDay();
  box.innerHTML = '<div class="fights">' + FIGHTS.map(f => '<button class="fight-card ' + f.g + '" data-click="startFight(\'' + f.id + '\')"><span class="fi">' + f.ic + '</span><b>' + f.n + '</b><small>' + esc(f.d) + '</small><em>' + (day.done[f.id] ? '✓ награда получена' : '🎁 ' + fmt(Math.round(rewardScale() * f.rw)) + ' 🔶') + '</em></button>').join('') + '</div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:6px">Награда за каждый файт — раз в день. Сила врагов зависит от твоего уровня арены.' + (S.shards ? ' Aghanim\'s Shard: ' + S.shards + '/5 (+' + S.shards * 5 + '% к ультам главного героя).' : '') + '</div>';
}
