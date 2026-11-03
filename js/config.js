// ================= CONFIG — ВСЕ ЧИСЛА БАЛАНСА В ОДНОМ МЕСТЕ =================
// Меняешь баланс — меняй только здесь. На этапе 8 эти же значения можно будет
// переопределять из базы (узел config/) без перезаливки сайта — через applyConfig().
const CONFIG = {
  startGems: 2000,               // самоцветы новому игроку
  maxLevel: 50,                  // максимальный уровень героя
  rewardScale: { min: 300, mul: 0.6 },   // «базовая награда» = max(min, награда_след_уровня_арены × mul) — от неё считаются задания, вход, мини-игры, PvP
  free: { cooldownMs: 10 * 60 * 1000, min: 500, mul: 0.5 },   // бесплатные самоцветы
  power: { base: 10, growth: 1.16, perLevel: 5 },              // сила героя = base·growth^(ур-1) + perLevel·ур
  spin: { base: 100, perLevel: 28, growth: 1.055 },            // цена крутки = (base + perLevel·ур)·growth^(ур-1)
  heroOfDay: { spinMul: 0.5, powerMul: 1.2 },
  arena: {
    reqBase: 55, reqGrowth: 1.0755,         // требуемая сила уровня
    rewardBase: 70, rewardGrowth: 1.085,    // награда за уровень
    kBase: 1.5, kGrowth: 0.0035,            // сложность врагов
    replayMul: 0.4,                         // повтор пройденного уровня
    bossMechPowerMul: 1,                    // сила боссов 25/50/75/100 (с механиками) относительно обычных
    replayRewardedPerDay: 1e9,              // сколько повторов в день дают полную награду (1e9 = без лимита, как сейчас)
    replayOverMul: 1                        // множитель награды за повторы сверх лимита
  },
  sell: { common: 30, uncommon: 70, rare: 180, mythical: 450, immortal: 1100, arcana: 3000 },
  sellEqMul: 1.2,
  upgrade: {
    cost: { common: 150, uncommon: 350, rare: 800, mythical: 1800, immortal: 4000 },
    base: { common: 0.55, uncommon: 0.45, rare: 0.35, mythical: 0.27, immortal: 0.2 },
    fuelBase: 0.03, fuelPerRarity: 0.025, maxChance: 0.85
  },
  login: { base: 0.5, perDay: 0.35 },       // награда за вход = rewardScale·(base + perDay·день)
  minigames: { dailyCap: 15, pay: { lasthit: 0.06, hook: 0.07, guess: 0.05, invoker: 0.03 } },
  pvp: { rewardedPerDay: 5, winMul: 1.2, lossMul: 0.3, eloK: 50 },
  roshan: { powerMul: 1.1, minPower: 400, poolMul: 32, tries: 3, rewardMul: 4 },
  chests: {
    ancient: { cost: 3000, w: { common: 38, uncommon: 30, rare: 20, mythical: 9, immortal: 3 } },
    immortal: { cost: 20000, w: { rare: 42, mythical: 36, immortal: 19, arcana: 3 } },
    arcana: { cost: 80000, w: { mythical: 40, immortal: 45, arcana: 15 } }
  },
  shop: { black_king_bar: 6000, heart: 8000, butterfly: 9000, greater_crit: 9000, satanic: 10000, assault: 11000, pipe: 8000, ultimate_scepter: 12000, refresher: 14000, rapier: 25000 },
  slotPairDropsItem: true,       // 3-барабанные слоты: пара даёт предмет (true = как сейчас)
  slots: {
    imm3: { minBet: 50, full: { arcana: 45, immortal: 20, mythical: 10, rare: 6, uncommon: 4, common: 3 }, multi: { 2: 1.2 }, arcAny: 0.5 },
    arc5: { minBet: 100, full: { arcana: 1000, immortal: 300, mythical: 120, rare: 60, uncommon: 30, common: 20 }, multi: { 4: 5, 3: 1.15, 2: 0.3 }, boost: 0.3 },
    cos3: { minBet: 50, full: { arcana: 35, immortal: 16, mythical: 8, rare: 5, uncommon: 3.5, common: 2.5 }, multi: { 2: 1.1 }, arcAny: 0.4 },
    cos5: { minBet: 100, full: { arcana: 800, immortal: 250, mythical: 100, rare: 50, uncommon: 25, common: 16 }, multi: { 4: 4, 3: 1.0, 2: 0.3 } }
  },
  // прогресс: сезонный пропуск, недельные задания, лиги PvP (этап 3)
  progression: {
    levels: 30, xpPerLevel: 300, levelGemsMul: 1.5,          // награда уровня пропуска = rewardScale × levelGemsMul
    itemLevels: { 5: 'rare', 10: 'mythical', 15: 'immortal', 20: 'mythical', 25: 'immortal', 30: 'arcana' },
    xp: { daily: 60, weekly: 300, login: 40, arenaWin: 8, gameRound: 4, pvp: 12, roshan: 15 },
    dailyCap: { arena: 150, game: 80 },                      // XP в сутки за арену и мини-игры не больше этого
    weeklyMul: 6,                                            // награда недельного задания = rewardScale × 6
    leagueMul: [2, 3, 4, 6, 8, 11, 15, 20],                  // награда лиги в конце сезона (Herald … Immortal) × rewardScale
    mmrKeep: 0.5,                                            // мягкий сброс: MMR = 1000 + (MMR − 1000) × 0.5
    pvp: { minRatio: 0.6, maxRatio: 1.7, weakWinMul: 0.5 }   // соперник по силе 60–170% твоей; победа над слабым (<80%) — половина MMR
  },
  // сообщество: «пригласи друга», коллекции (этапы 9–10)
  social: { refMul: 10, refFriendMul: 5, refMax: 20, collectionBonus: 0.05 },
  // лимиты онлайна (подарки — те же числа стоят в database.rules.json!)
  gifts: { min: 100, maxOne: 500000, daySum: 2000000, dayCount: 10, cooldownMs: 20000 },
  cloud: { debounceMs: 4000, perMinute: 6, boardCacheMs: 60000, staleStackDays: 30 }
};
// глубокое слияние переопределений (этап 8: config/ из базы) + пересинхронизация таблиц
function applyConfig(over) {
  const merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } };
  if (over && typeof over === 'object') merge(CONFIG, over);
  if (typeof syncConfigTables === 'function') syncConfigTables();
}
// таблицы, которые хранят копию чисел (сундуки, лавка, слоты) — обновить из CONFIG
function syncConfigTables() {
  if (typeof CHESTS !== 'undefined') CHESTS.forEach(c => { const x = CONFIG.chests[c.id]; if (x) { c.cost = x.cost; c.w = x.w; } });
  if (typeof SHOP !== 'undefined') SHOP.forEach(s => { if (CONFIG.shop[s.id] != null) s.cost = CONFIG.shop[s.id]; });
  if (typeof MACHINES !== 'undefined') MACHINES.forEach(m => Object.assign(m, CONFIG.slots[m.id] || {}));
}
