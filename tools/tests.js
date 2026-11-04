const results = [];
function T(name, fn) { try { const r = fn(); results.push({ name, ok: r === true, info: r === true ? '' : String(r) }); } catch (e) { results.push({ name, ok: false, info: 'ошибка: ' + e.message }); } }
const f = document.getElementById('game');
f.onload = () => {
  const w = f.contentWindow, s = w.document.createElement('script'); s.src = 'tools/econ-sim.js';
  s.onload = () => { w.simSetup(); run(w); show(); };
  w.document.body.appendChild(s);
};
f.src = '../index.html?sim=1';
function run(w) {
  const E = w.simEnv(), C = E.CONFIG;
  // формулы
  T('calcPower(1) = 15, растёт с уровнем', () => w.calcPower(1) === 15 && w.calcPower(10) > w.calcPower(9) && w.calcPower(50) > 10000 || 'calcPower(1)=' + w.calcPower(1));
  T('spinCost(1) = 128 и растёт', () => w.spinCost(1) === 128 && w.spinCost(30) > w.spinCost(29) || 'spinCost(1)=' + w.spinCost(1));
  T('reqPower(1) = 55, lvlReward(1) = 70', () => w.reqPower(1) === 55 && w.lvlReward(1) === 70);
  T('награда арены растёт монотонно 1…100', () => { for (let L = 2; L <= 100; L++) if (w.lvlReward(L) <= w.lvlReward(L - 1)) return 'L' + L; return true; });
  T('rewardScale не меньше минимума', () => w.rewardScale() >= C.rewardScale.min);
  T('freeAmount ≥ 500', () => w.freeAmount() >= 500);
  T('цена продажи: снаряжение дороже скина в sellEqMul раз', () => w.sellPrice({ rarity: 'rare', type: 'eq' }) === Math.round(C.sell.rare * C.sellEqMul));
  // апгрейдер
  T('ugChance: база по редкости и потолок 85%', () => {
    E.S.items = [{ uid: 1, type: 'skin', heroId: 'pudge', rarity: 'common', name: 'a' }]; for (let i = 2; i < 8; i++) E.S.items.push({ uid: i, type: 'skin', heroId: 'pudge', rarity: 'immortal', name: 'b' });
    w.simSetUg(1, []); const base = w.ugChance(); w.simSetUg(1, [2, 3, 4, 5, 6, 7]); const max = w.ugChance(); w.simSetUg(null, []);
    return (Math.abs(base - C.upgrade.base.common) < 1e-9 && max <= C.upgrade.maxChance) || base + ' / ' + max;
  });
  // шансы
  T('рулетка героя: сумма весов 100', () => E.SEGMENTS.reduce((a, s) => a + s.weight, 0) === 100);
  T('2.4.9: сокровищницы Dota: ≥15 штук, у каждой есть предметы и бонусы', () => E.CHESTS.length >= 15 && E.CHESTS.every(c => c.tr.items.length >= 3 && E.trBonus(c.tr).length >= 3));
  T('2.4.9: свои шмотки есть у 115+ героев', () => [...E.COS_HEROES].filter(h => E.CS_ITEMS.some(x => x.hero === h && x.real)).length >= 115);
  T('2.4.9: редкий бонус гарантирован на последнем открытии', () => { const t = E.CHESTS[0].tr; const st = E.trState(t.id); st.miss = E.TR_TIER[t.tier].guar - 1; const ok = E.trBonusChance(t) === 100; st.miss = 0; return ok; });
  T('слоты: возврат самоцветами < 100% ставки (без предметов)', () => { const ev = ['imm3', 'arc5', 'cos3', 'cos5'].map(id => w.simSlotEV(id, 40000).gemsPerBet); return ev.every(x => x > 0.4 && x < 1) || ev.join(', '); });
  T('weightedRarity выдаёт только известные редкости', () => { for (let i = 0; i < 500; i++) if (!E.RARITIES.includes(w.weightedRarity())) return false; return true; });
  // миграции и проверка сейва
  T('миграция v2 → v3 без потерь', () => { const st = { v: 2, gems: 777, spins: 5, heroes: {}, items: [], wipe: C.wipe.id }; w.migrate(st); return (st.version === E.SAVE_VERSION && st.v === undefined && st.gems === 777 && st.firstSpinDone === true) || JSON.stringify(st).slice(0, 80); });
  T('сейв из будущей версии не трогается', () => { const st = { version: 999, gems: 1, heroes: {}, items: [] }; w.migrate(st); return st._newer === true && st.version === 999; });
  T('validateSave: чинит подделку и выбрасывает мусор', () => { const r = w.validateSave({ heroes: { pudge: { level: 9999 } }, items: [{ uid: 1, rarity: 'arcana', heroId: 'pudge', name: 'x' }, 'junk', { uid: 2, rarity: 'god', heroId: 'pudge', name: 'y' }], gems: -5, arena: { cleared: 300 } }); return (r.ok && r.st.heroes.pudge.level === C.maxLevel && r.st.items.length === 1 && r.st.gems === 0 && r.st.arena.cleared === 100) || JSON.stringify(r).slice(0, 120); });
  T('validateSave: нормальный сейв не меняется', () => { const st = w.freshState(); w.migrate(st); return w.validateSave(st).fixes.length === 0 || w.validateSave(st).fixes.join(','); });
  T('validateSave отвергает мусор', () => w.validateSave('hello').ok === false && w.validateSave(null).ok === false);
  // время и дни
  T('weekKey: 2 ноября 2026 — неделя 45', () => w.weekKey('2026-11-02') === '2026-W45' || w.weekKey('2026-11-02'));
  T('isNewDay: перевод часов назад не даёт новый день', () => w.isNewDay('2026-11-02', '2026-11-03') === true && w.isNewDay('2026-11-05', '2026-11-03') === false);
  // кнопки без eval
  T('parseCall разбирает аргументы', () => { const c = w.parseCall("fn('a b',-3,true,this.value,null)"); return c.name === 'fn' && c.args[0].v === 'a b' && c.args[1].v === -3 && c.args[2].v === true && c.args[3].t === 'prop' && c.args[4].v === null; });
  T('parseCall не выполняет произвольный код', () => { try { w.parseCall('fn(alert(1))'); return 'разобрал опасный вызов'; } catch (e) { return true; } });
  // фильтр ников
  T('фильтр ников: нормальные проходят', () => ['Dendi', 'Dranik', 'Миракл', 'Pudge_228', 'Solo Mid'].every(n => w.nickProblem(n) === '') || ['Dendi', 'Dranik', 'Миракл', 'Pudge_228', 'Solo Mid'].map(n => n + ':' + w.nickProblem(n)).join('; '));
  T('фильтр ников: мат и обходы ловятся', () => ['хуй228', 'xуй', 'п1здец', 'fuck_you', 'f.u.c.k', 'cyka'].every(n => w.nickProblem(n) !== '') || ['хуй228', 'xуй', 'п1здец', 'fuck_you', 'f.u.c.k', 'cyka'].filter(n => !w.nickProblem(n)).join(', '));
  T('фильтр ников: «админ» запрещён', () => ['Admin', 'Модератор', 'Valve_Official'].every(n => w.nickProblem(n) !== ''));
  // онлайн-данные
  T('cleanStack отбрасывает мусор', () => w.cleanStack({ team: [{ id: 'not_hero', p: 1 }] }) === null && w.cleanStack({ nick: 'a', mmr: 1000, team: [{ id: 'pudge', p: 100 }] }).team.length === 1);
  T('titleHTML не пропускает HTML в цвете', () => !/onerror/.test(w.titleHTML({ name: 'x', color: 'red"><img src=x onerror=1>' })));
  T('cleanBalance пропускает только известные числа', () => { const r = w.cleanBalance({ startGems: 5, hack: 1, arena: { replayMul: 'x', kBase: 2 } }, C); return r.startGems === 5 && r.hack === undefined && r.arena.replayMul === undefined && r.arena.kBase === 2; });
  // прогресс и события
  T('сезон: 30-й уровень даёт Arcana и титул', () => { w.ensureSeason(); const r = w.seasonLevelReward(30); return r.item === 'arcana' && !!r.title; });
  T('Новый год активен 20 декабря, не активен 3 ноября', () => { const ev = E.EVENTS.find(e => e.id === 'newyear'); return w.eventActive(ev, '2026-12-20') && w.eventActive(ev, '2027-01-10') && !w.eventActive(ev, '2026-11-03'); });
  T('коллекция редкостей: 6 редкостей = +5% силы', () => { E.S.items = E.RARITIES.map((r, i) => ({ uid: 100 + i, type: 'skin', heroId: 'axe', rarity: r, name: r })); E.S.uid = 200; return w.collectionMul('axe') === 1 + C.social.collectionBonus && w.collectionMul('pudge') === 1; });
  T('боссы 25/50/75/100 имеют механики', () => [25, 50, 75, 100].every(L => { const d = w.levelDef(L); return d.waves[d.waves.length - 1].mech && d.mechText; }));
  T('бой детерминирован при одинаковом генераторе', () => { const def = w.levelDef(10), team = [{ id: 'axe', p: def.R }]; const g = () => { let a = 1; return () => (a = (a * 16807) % 2147483647) / 2147483647; }; return JSON.stringify(w.simulateBattle(team, def, g(), {}).win) === JSON.stringify(w.simulateBattle(team, def, g(), {}).win); });
  T('версия игры задана', () => /^\d+\.\d+\.\d+$/.test(E.APP_VERSION) || E.APP_VERSION);
  // ---------- 2.4 ----------
  T('2.4: у всех героев есть роль, все 5 ролей встречаются', () => { const c = {}; E.HEROES.forEach(h => { c[w.heroRole(h.id)] = 1; }); return Object.keys(c).length === 5 && E.HEROES.every(h => E.ROLE_INFO[w.heroRole(h.id)]) || JSON.stringify(c); });
  T('2.4: каждая роль сильна против двух и слаба против двух', () => Object.keys(E.ROLE_INFO).every(r => w.roleBeats(r).length === 2 && w.roleWeakTo(r).length === 2));
  T('2.4: после 40 уровня награда растёт на 3%', () => Math.abs(w.lvlReward(60) / w.lvlReward(59) - C.arena.rewardGrowthAfter) < 0.01 && w.lvlReward(100) < 20000 || w.lvlReward(100));
  T('2.4: rewardScale не растёт после уровня capLevel', () => { const c0 = E.S.arena.cleared; E.S.arena.cleared = 60; const a = w.rewardScale(); E.S.arena.cleared = 99; const b = w.rewardScale(); E.S.arena.cleared = c0; return a === b; });
  T('2.4: сундуки и лавка не дешевле базовой цены', () => E.CHESTS.every(c => c.cost >= E.TR_TIER[c.tr.tier].cost) && E.SHOP.every(i => i.cost >= C.shop[i.id]) && E.SHOP.length >= 22);
  T('2.4: ранги по 1000 MMR со ступенями', () => w.rankName(0) === 'Herald I' && w.rankName(3450) === 'Archon III' && w.rankName(999) === 'Herald V' && /Immortal · 7200/.test(w.rankName(7200)) || [w.rankName(0), w.rankName(3450), w.rankName(7200)].join(' / '));
  T('2.4: сезонный сброс кристаллов не трогает героев и предметы', () => { const st = w.freshState(); st.wipe = C.wipe.id; st.gems = 5e6; st.heroes.axe = { level: 33, bonus: 0 }; st.items = [{ uid: 1, type: 'skin', heroId: 'axe', rarity: 'rare', name: 'x' }]; delete st.season24; w.migrate(st); return st.gems === C.seasonReset.keep && st.heroes.axe.level === 33 && st.items.length === 1 && st.season24.vet === true; });
  T('2.4: кооп-бой детерминирован по сиду и действиям', () => { const team = ['axe', 'lina', 'lion', 'sven', 'zuus', 'pudge'].map((id, i) => ({ id, p: 1000, mods: {}, owner: i < 3 ? 0 : 1 })); const run = () => { const def = w.coopDef(0, team); const e = w.createBattle(team, def, w.seeded(42), { maxTicks: 60, manualUlt: true, smartSet: [0, 1, 2, 3, 4, 5] }); let k = 0; while (!e.done) e.step(k++ % 4 === 0 ? ['taunt:0'] : []); return JSON.stringify(e.result().enemyHp) + e.result().win; }; return run() === run(); });
  T('2.4: босс на двоих не проходится тремя героями', () => { let w0 = 0; for (let n = 0; n < 20; n++) { const team = ['axe', 'lina', 'lion', 'sven', 'zuus', 'pudge'].map((id, i) => ({ id, p: 1000, mods: {}, owner: i < 3 ? 0 : 1 })); const def = w.coopDef(0, team); const solo = team.slice(0, 3); if (w.createBattle(solo, def, w.seeded(n), { maxTicks: 60, smartUlt: true }).finish().win) w0++; } return w0 <= 2 || w0 + '/20'; });
  T('2.4: Защита башен — 20 карт, у каждой есть описание роли и контры', () => E.TW_EXTRA.length >= 20 && E.TW_EXTRA.every(c => E.TW_CARDS[c] && E.TW_CARD_INFO[c]));
  T('2.4: в PvP уровень карты не даёт больше +40%', () => { const T0 = w.TS(); T0.cards.creeps = { l: 15, c: 0 }; const r = w.twCardMul('creeps', true) <= 1.4001 && w.twCardMul('creeps', false) > 1.5; delete T0.cards.creeps; return r; });
  T('2.4: новые карты работают в бою (бой заканчивается)', () => { const d0 = ['kobolds', 'wolves', 'treants', 'spiders', 'mega', 'golem', 'sentry', 'tombstone'].map(c => w.twCardSpec(c, 1)), d1 = ['arrow', 'ravage', 'meteor', 'freezing', 'mekansm', 'healward', 'creeps', 'ranged'].map(c => w.twCardSpec(c, 1)); const g = w.twNew({ seed: 3, deck0: d0, deck1: d1 }); let n = 0; while (!g.over && n < 30 * 260) { const a = w.twBot(g, 1, 2); w.twStep(g, a ? [a] : []); n++; } return g.over || 'не закончился'; });
  T('2.4: релизный сброс обнуляет прогресс один раз', () => { const st = w.freshState(); delete st.wipe; st.gems = 9e6; st.arena.cleared = 100; st.items = [{ uid: 1, type: 'skin', heroId: 'axe', rarity: 'arcana', name: 'x' }]; st.heroes.axe = { level: 50, bonus: 0 }; st.titlesWon = [{ id: 'x', name: 'x' }]; w.migrate(st); const ok1 = st.gems === C.startGems && st.arena.cleared === 0 && st.items.length === 0 && st.heroes.axe.level === 1 && !st.titlesWon && st.wipe === C.wipe.id && !!st._wipeBackup; st.gems = 5000; delete st._wipeBackup; delete st._wiped; w.migrate(st); return ok1 && st.gems === 5000 || 'gems ' + st.gems; });
  T('2.5: поражение снимает на ~25% больше, чем раньше (на среднем ранге)', () => { const d = w.mmrDelta(false, 0.5, 3500, 0).delta; return d === -Math.round(30 * 1.25 * C.mmr.lossByRank[3]) || d; });
  T('2.5: чем выше ранг, тем меньше MMR за победу', () => { const a = w.mmrDelta(true, 0.5, 500, 0, '1'.repeat(50)).delta, b = w.mmrDelta(true, 0.5, 6500, 0, '1'.repeat(50)).delta; return a > b || [a, b].join('/'); });
  T('2.5: после дневного лимита прирост резко меньше', () => { const a = w.mmrDelta(true, 0.5, 1000, 0).delta, b = w.mmrDelta(true, 0.5, 1000, C.mmr.dailyCap).delta; return b < a / 4 || [a, b].join('/'); });
  T('2.5: на высоком ранге без винрейта >50% повышения нет', () => { const d = w.mmrDelta(true, 0.5, 4995, 0, '10'.repeat(25)); const d2 = w.mmrDelta(true, 0.5, 4995, 0, '110'.repeat(17)); return (4995 + d.delta < 5000 && 4995 + d2.delta >= 5000) || [d.delta, d2.delta].join('/'); });
  T('2.5: на высоких рангах только сильные боты', () => { const t = E.CONFIG.botMinTier; return t[0] === 0 && t[t.length - 1] === 3 && w.botTier(6500).id === 'elite'; });
  T('2.4: кубки — победа +15, поражение −30, не ниже начала арены', () => { const T0 = w.TS(), keep = [T0.cups, T0.cupsBest, T0.mmr]; T0.cups = 1010; w.twCupsChange(true, false); const a = T0.cups; w.twCupsChange(false, false); const b = T0.cups; T0.cups = keep[0]; T0.cupsBest = keep[1]; T0.mmr = keep[2]; return a === 1025 && b === 1000 || a + ' / ' + b; });
}
function show() {
  const ok = results.filter(r => r.ok).length;
  document.getElementById('sum').innerHTML = (ok === results.length ? '<b class="ok">✅ Все тесты пройдены: ' : '<b class="bad">❌ Пройдено ') + ok + ' из ' + results.length + '</b>';
  document.getElementById('list').innerHTML = results.map(r => '<div class="t"><span class="' + (r.ok ? 'ok' : 'bad') + '">' + (r.ok ? '✔' : '✘') + '</span> ' + r.name + (r.info ? ' <span class="muted">— ' + r.info.replace(/</g, '&lt;') + '</span>' : '') + '</div>').join('');
  window.TEST_RESULTS = results;
}
