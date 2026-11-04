// ================= СИМУЛЯТОР ЭКОНОМИКИ =================
// Запускается внутри игры (после входа в тестовый аккаунт). Использует НАСТОЯЩИЕ функции игры:
// бои (simulateBattle), рулетку (SEGMENTS/applySegment), награды, задания. Анимация и окна отключены.
// Время считается по модели живого игрока (SIM_TIME — секунды на действие).
const SIM_TIME = { heroSpin: 1.6, battle: 20, slot: 2.2, minigameRound: 40, chest: 4, claim: 2, roshan: 20, pvp: 20 };
function simMuteUI() {
  const noop = () => {};
  ['heroLog', 'hype', 'showModal', 'toast', 'sfx', 'announce', 'renderPreview', 'renderHeroList', 'updateTop', 'updateProfileChip', 'arenaLog', 'feed', 'updateQuestBadge', 'renderQuests', 'save', 'renderArena', 'renderHome', 'updateFreeBtn', 'noteDrop', 'schedulePush']
    .forEach(n => { if (typeof window[n] === 'function') window[n] = noop; });
}
// учёт самоцветов по источникам: оборачиваем addGems и смотрим, кто вызвал
function simTrackGems(book) {
  const orig = addGems;
  window.addGems = function (n) {
    const tag = window.__simTag || 'прочее';
    const b = book[tag] = book[tag] || { in: 0, out: 0, n: 0 };
    if (n >= 0) b.in += n; else b.out -= n; b.n++;
    return orig(n);
  };
}
function simSlotEV(machineId, spins) {
  const m = MACHINES.find(x => x.id === machineId); let gems = 0, items = 0;
  const one = () => slotLineWins(m, rollGrid(m)).reduce((a, w) => a + w.mult, 0);
  for (let k = 0; k < spins; k++) {
    const wins = slotLineWins(m, rollGrid(m));
    gems += wins.reduce((a, w) => a + w.mult, 0);
    // 2.7.2: бонусные спины — бесплатные крутки по той же ставке
    if (CONFIG.slotsBonus && typeof rollFsCount === 'function' && Math.random() < CONFIG.slotsBonus.chance) { const n = rollFsCount(); for (let j = 0; j < n; j++) gems += one(); }
    wins.filter(w => w.drop).slice(0, 2).forEach(w => { items += (m.kind === 'eq' && w.n === 5 ? 2 : 1) * CONFIG.sell[w.rarity] * (m.kind === 'eq' ? CONFIG.sellEqMul : 1); });
  }
  return { gemsPerBet: gems / spins, itemValuePerBet: items / spins };
}
function simChestEV(ch) {
  const tot = Object.values(ch.w).reduce((a, b) => a + b, 0);
  const v = Object.entries(ch.w).reduce((a, [r, w]) => a + w / tot * CONFIG.sell[r] * CONFIG.sellEqMul, 0);
  return { cost: ch.cost, avgSellValue: Math.round(v), returnPct: Math.round(v / ch.cost * 100) };
}
// Один «игрок»: days дней, sessions сессий по minutes минут в день
function simPlayer(o) {
  o = Object.assign({ days: 30, sessions: 2, minutes: 30, minigameRounds: 5, slotsShare: 0 }, o);
  const book = {}; simTrackGems(book);
  const tag = t => { window.__simTag = t; };
  const timeline = []; const milestones = {};
  let t = 0;                        // игровое время, с
  const day0 = Date.now();
  const fight = (L, replay) => {
    const def = levelDef(L); const bt = buildTeam({ noCons: true }); def.team = bt.tm;
    const r = simulateBattle(bt.team, def, null, {});
    tag(replay ? 'арена: повторы' : 'арена: новые уровни');
    if (r.win) {
      addGems(replay ? Math.round(def.reward * CONFIG.arena.replayMul * replayFactor()) : def.reward); S.arena.wins++; track('arenaWins');
      if (!replay) { S.arena.cleared = L; const ri = Math.max(0, Math.min(5, Math.floor(L / 17))); if (def.eq) addEquipment(bt.team[0].id, RARITIES[ri]); if (def.skin) addSkin(def.waves[def.waves.length - 1].id, RARITIES[Math.min(5, ri + 1)]); }
    } else { tag('арена: утешение'); const pd = todayStr(); if (!S.pityDay || S.pityDay.d !== pd) S.pityDay = { d: pd, n: 0 }; addGems(S.pityDay.n++ < CONFIG.arena.pityPerDay ? Math.round(def.reward * CONFIG.arena.pity) : 0); S.arena.losses++; }
    return r.win;
  };
  for (let d = 0; d < o.days; d++) {
    SRV_OFF = d * 86400000 + (day0 - Date.now());     // «перематываем» дни через серверное время игры
    ensureMeta();
    // вход
    tag('награда за вход'); const lg = S.daily.login; if (lg.claimed !== S.daily.day) { const rw = loginReward(lg.streak); lg.claimed = S.daily.day; addGems(rw.gems); if (rw.item) addEquipment(mainHeroId(), rw.item); if (typeof seasonXp === 'function') seasonXp(CONFIG.progression.xp.login, 'login'); }
    for (let s = 0; s < o.sessions; s++) {
      let left = o.minutes * 60;
      // бесплатные самоцветы: между сессиями таймер успевает
      tag('бесплатные самоцветы'); addGems(freeAmount()); left -= SIM_TIME.claim;
      let nextFree = CONFIG.free.cooldownMs / 1000;
      // мини-игры — в первой сессии дня
      if (s === 0) {
        const perf = { lasthit: 6, hook: 5, guess: 6, invoker: 15 };
        for (const g of Object.keys(perf)) for (let k = 0; k < Math.min(o.minigameRounds, CONFIG.minigames.dailyCap); k++) { tag('мини-игры'); addGems(Math.round(perf[g] * rewardScale() * CONFIG.minigames.pay[g])); left -= SIM_TIME.minigameRound; track('gameRounds'); }
        // Рошан и PvP (средний результат)
        tag('Рошан'); for (let k = 0; k < CONFIG.roshan.tries; k++) left -= SIM_TIME.roshan;
        if (Math.random() < 0.5) addGems(Math.round(rewardScale() * CONFIG.roshan.rewardMul));
        tag('PvP'); for (let k = 0; k < CONFIG.pvp.rewardedPerDay; k++) { addGems(Math.round(rewardScale() * (CONFIG.pvp.winMul + CONFIG.pvp.lossMul) / 2)); track('pvp'); left -= SIM_TIME.pvp; }
        for (let k = 0; k < CONFIG.roshan.tries; k++) track('roshanHits');
      }
      while (left > 0) {
        if (left < o.minutes * 60 - nextFree) { tag('бесплатные самоцветы'); addGems(freeAmount()); nextFree += CONFIG.free.cooldownMs / 1000; }
        const L = S.arena.cleared + 1;
        // 1) пробуем следующий уровень, если сила близка
        if (L <= 100 && stackPower() >= reqPower(L) * 0.9) {
          const win = fight(L, false); left -= SIM_TIME.battle;
          if (win && !milestones[L] && [10, 25, 50, 75, 100].includes(L)) milestones[L] = { day: d + 1, hours: +((t + o.minutes * 60 - left) / 3600).toFixed(1) };
          if (win) continue;
        }
        // 2) слоты (если игрок их любит)
        if (o.slotsShare && Math.random() < o.slotsShare) { const m = MACHINES[1]; const bet = Math.max(m.minBet, Math.round(S.gems * 0.02)); if (S.gems >= bet) { tag('слоты'); addGems(-bet); const ev = simSlotEV(m.id, 1); addGems(Math.round(bet * ev.gemsPerBet)); left -= SIM_TIME.slot; continue; } }
        // 3) крутим самого дешёвого героя из стака
        const ids = getStack(); const id = ids.slice().sort((a, b) => heroSpinCost(a) - heroSpinCost(b))[0];
        if (S.heroes[id].level < CONFIG.maxLevel && S.gems >= heroSpinCost(id)) {
          selectedHero = id; const cost = heroSpinCost(id); tag('рулетка героев'); addGems(-cost); S.spins++; track('heroSpins');
          const seg = SEGMENTS[pickSegment()]; tag('рулетка: возврат 💎'); applySegment(seg, cost); left -= SIM_TIME.heroSpin; continue;
        }
        // 4) денег нет — фармим повтор последнего уровня
        if (S.arena.cleared > 0) { fight(S.arena.cleared, true); left -= SIM_TIME.battle; continue; }
        left -= 10;
      }
      t += o.minutes * 60;
      // продажа мусора и задания/ачивки
      tag('продажа предметов'); S.items.filter(x => (x.rarity === 'common' || x.rarity === 'uncommon') && !equippedOn(x.uid)).forEach(x => { addGems(sellPrice(x)); removeItem(x.uid); });
      tag('задания'); S.daily.quests.forEach(q => { if (!q.claimed && q.prog >= q.n) { q.claimed = true; addGems(q.reward); track('questsDone'); seasonXp(CONFIG.progression.xp.daily, 'daily'); } });
      tag('недельные задания'); if (typeof ensureWeekly === 'function') { const w = ensureWeekly(); w.quests.forEach(q => { if (!q.claimed && q.prog >= q.n) { q.claimed = true; addGems(weeklyReward()); seasonXp(CONFIG.progression.xp.weekly, 'weekly'); } }); }
      tag('сезонный пропуск'); if (typeof ensureSeason === 'function') { const s2 = ensureSeason(), lv = seasonLevel(); for (let L = s2.claimed + 1; L <= lv; L++) { const r = seasonLevelReward(L); addGems(r.gems); if (r.item) addEquipment(mainHeroId(), r.item); } s2.claimed = lv; }
            tag('достижения'); ACHIEVEMENTS.forEach(a => { if (!S.ach[a.id] && safeOk(a)) { S.ach[a.id] = Date.now(); addGems(a.r); if (a.item) addEquipment(mainHeroId(), a.item); } });
    }
    timeline.push({ day: d + 1, arena: S.arena.cleared, gems: S.gems, stack: stackPower(), hours: +(t / 3600).toFixed(1), inc: Object.values(book).reduce((a, v) => a + v.in, 0) });
  }
  SRV_OFF = 0;
  return { book, timeline, milestones };
}
// подготовка чистого тестового игрока (для tools/sim.html и tests.html)
function simSetup(over) {
  USER = { key: '__sim__', nick: 'Sim' };
  S = freshState(); migrate(S);
  simMuteUI();
  if (over) applyConfig(over);
  return true;
}
// доступ к внутренним переменным игры для tests.html (const/let не видны снаружи окна)
function simEnv() { return { CONFIG, S, SEGMENTS, CHESTS, RARITIES, CS_ITEMS, COS_HEROES, TR_TIER, trBonus, trState, trBonusChance, EVENTS, SAVE_VERSION, APP_VERSION: self.APP_VERSION, HEROES, ROLE_INFO, SHOP, TW_EXTRA, TW_CARDS, TW_CARD_INFO }; }
function simSetUg(main, fuel) { ugMain = main; ugFuel = fuel || []; }
