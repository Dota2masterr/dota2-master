// ================= CONFIG — ВСЕ ЧИСЛА БАЛАНСА В ОДНОМ МЕСТЕ =================
// Меняешь баланс — меняй только здесь. На этапе 8 эти же значения можно будет
// переопределять из базы (узел config/) без перезаливки сайта — через applyConfig().
const CONFIG = {
  startGems: 2000,               // кристаллы новому игроку
  maxLevel: 50,                  // максимальный уровень героя
  rewardScale: { min: 300, mul: 0.6, capLevel: 40 },   // «базовая награда» = max(min, награда_след_уровня_арены × mul); 2.4: уровень арены для неё не выше capLevel — дальше не растёт
  free: { cooldownMs: 10 * 60 * 1000, min: 500, mul: 0.25 },   // бесплатные кристаллы
  power: { base: 10, growth: 1.16, perLevel: 5 },              // сила героя = base·growth^(ур-1) + perLevel·ур
  spin: { base: 100, perLevel: 28, growth: 1.055 },            // цена крутки = (base + perLevel·ур)·growth^(ур-1)
  // 2.4: «Герой дня» переделан в «Испытание дня»: без скидки на крутки и без бонуса силы в бою.
  // Возьми героя дня в стак и выиграй wins боёв — награда: скин этого героя + кристаллы (rewardScale × rewardMul).
  heroOfDay: { spinMul: 1, powerMul: 1, wins: 3, rewardMul: 1.5 },
  arena: {
    reqBase: 55, reqGrowth: 1.0755,         // требуемая сила уровня
    rewardBase: 70, rewardGrowth: 1.085,    // награда за уровень
    rewardCapLevel: 40, rewardGrowthAfter: 1.03,   // 2.4: с 40-го уровня награда растёт на 3% за уровень (было 8.5%)
    kBase: 1.5, kGrowth: 0.0035,            // сложность врагов
    replayMul: 0.15,                        // повтор пройденного уровня (2.4: было 0.4)
    bossMechPowerMul: 1,                    // сила боссов 25/50/75/100 (с механиками) относительно обычных
    replayRewardedPerDay: 30,               // 2.4: наградных повторов в день (было без лимита)
    replayOverMul: 0.1,                     // повторы сверх лимита — 10% от и так уменьшенной награды
    pity: 0.02, pityPerDay: 10              // 2.4: утешение за поражение 2% награды (было 8%) и не больше 10 раз в день
  },
  seasonReset: { keep: 20000, vetFrom: 300000 },
  // 2.4: релизный сброс прогресса у всех (один раз). Таблицы рекордов показывают только записи после at.
  wipe: { id: 'release-2.4', at: 1793734800000 },   // 2.4: у всех кристаллов не больше keep; у кого было ≥ vetFrom — титул «Ветеран 2.3» и Rare-скин
  // 2.4: боты с рейтингом (узел bots/): окно поиска ±window, сильные боты (от counterFrom) берут контр-пики,
  // за 1 бой MMR бота меняется не больше maxStep, каждый день боты играют между собой и растут на dailyGrowth
  bots: { window: 1000, startMax: 6400, mmrMax: 9000, counterFrom: 3000, maxStep: 60, dailyGrowth: 4, powerPerMmr: 5000 },
  // 2.5: набор MMR медленнее. Победа +15…+20 и поражение −25…−50 (−20…−40 ×1.25) умножаются на коэффициент ранга:
  // чем выше ранг, тем меньше за победу и больше за поражение (нужный винрейт плавно растёт: ~56% в Herald → ~83% в Immortal).
  // Дневной лимит считается по чистому приросту за день (поражения его уменьшают): после dailyCap прирост ×afterCap,
  // после hardCap — ×afterHard (защита от марафонов по 15+ часов: высший ранг за один день недостижим).
  // На рангах от promoFrom повышение в следующий ранг — только при винрейте выше 50% за последние 50 матчей (минимум promoMin матчей).
  mmr: { lossMul: 1.25, winByRank: [1, 0.95, 0.88, 0.8, 0.72, 0.64, 0.56, 0.48], lossByRank: [0.6, 0.7, 0.8, 0.9, 0.95, 1, 1.05, 1.1],
    dailyCap: 500, afterCap: 0.5, hardCap: 1500, afterHard: 0.1, promoFrom: 4, promoWindow: 50, promoMin: 20, promoWr: 0.5 },
  // 2.5: уровни ботов (по их MMR) — сила стака, бонус атаки и ИИ (0 — простой, 3 — элитный)
  botTiers: [
    { id: 'easy', n: 'Лёгкий', from: 0, pow: 0.95, atk: 1, ai: 0, c: '#8ac26a' },
    { id: 'mid', n: 'Средний', from: 2000, pow: 1, atk: 1, ai: 1, c: '#6ab8e0' },
    { id: 'hard', n: 'Сложный', from: 4000, pow: 1.015, atk: 1.01, ai: 2, c: '#c88aff' },
    { id: 'elite', n: 'Элитный', from: 6000, pow: 1.03, atk: 1.02, ai: 3, c: '#ff7a4a' }
  ],
  botMinTier: [0, 0, 1, 1, 2, 2, 3, 3],
  botHardEvery: 4,                          // 2.5.1: каждый 4-й бот — «Сложный» даже на низком MMR (чтобы и на малых рангах были сильные соперники)      // по рангу игрока: на высоких рангах — только сильные боты
  sell: { common: 30, uncommon: 70, rare: 180, mythical: 450, immortal: 1100, arcana: 3000 },
  sellEqMul: 1.2,
  sellSkinMul: 2,
  talentReset: { freePerWeek: 1, baseMul: 1, growth: 2 },   // 2.4: сброс талантов: 1 бесплатно в неделю, потом rewardScale × 1, ×2, ×4…                // 2.3: скины продаются дороже
  upgrade: {
    cost: { common: 150, uncommon: 350, rare: 800, mythical: 1800, immortal: 4000 },
    base: { common: 0.55, uncommon: 0.45, rare: 0.35, mythical: 0.27, immortal: 0.2 },
    fuelBase: 0.03, fuelPerRarity: 0.025, maxChance: 0.85
  },
  login: { base: 0.35, perDay: 0.25 },       // награда за вход = rewardScale·(base + perDay·день)
  minigames: { dailyCap: 15, pay: { lasthit: 0.024, hook: 0.028, guess: 0.02, invoker: 0.012, sunstrike: 0.028 } },   // 2.4: ×0.4
  pvp: { rewardedPerDay: 5, winMul: 0.6, lossMul: 0.15, eloK: 50 },
  // боёвка 2.2: навыки, мана, статусы. Множители подобраны так, чтобы нужная сила уровней 1/25/50/100 осталась прежней (±5%)
  combat: { heroSkillMul: 0.7, enemySkillMul: 1, enemyHpMul: 1.02, hpByWaves: { 4: 1.31, 5: 1.24, 6: 1.17 }, modeOut: { pvp: 0.79, roshan: 0.72, survival: 0.77 }, mechHp: { doom: 0.95, void: 1.03, night: 0.9, ancient: 0.95 }, manaStart: 40, manaRegen: 12, manaOnHit: 3, enemySkillCdAdd: 1, stunImmune: 2, bossResist: 2,
    // 2.4: общий урон обеих сторон (бой длиннее, решает тактика), контр-пики ролей, линии, фокус, тайминг ульты
    dmgMul: 0.85, ultTiming: 1.4, frontShare: 0.75, jumpBack: 0.65, backPoke: 0.15, backReach: 0.75,
    frontRoles: ['carry', 'tank', 'initiator'],
    counter: {
      carry: { support: 1.15, initiator: 1.15, nuker: 0.9, tank: 0.9 },
      support: { initiator: 1.15, nuker: 1.15, tank: 0.9, carry: 0.9 },
      initiator: { nuker: 1.15, tank: 1.15, carry: 0.9, support: 0.9 },
      nuker: { tank: 1.15, carry: 1.15, support: 0.9, initiator: 0.9 },
      tank: { carry: 1.15, support: 1.15, initiator: 0.9, nuker: 0.9 }
    },
    counterFrom: 30, counterChanceMin: 0.15, counterChanceMax: 0.6,
    // 2.4: кооп-боссы: щит режет урон до 10% (ломают 2 ульты разных игроков за ≤1 ход), удар в спину ×1.5, держащий агро бьёт ×0.7 и получает ×0.75
    coop: { shieldMul: 0.1, backstab: 1.5, holderMul: 0.7, holderTaken: 0.75, loose: 1.25, tauntTicks: 4, reflect: 0.12, enrageAtk: 1.5, addHeal: 0.012 } },
  roshan: { powerMul: 1.1, minPower: 400, poolMul: 32, tries: 3, rewardMul: 4 },
  chests: {
    ancient: { cost: 3000, scaleMul: 8, w: { common: 32, uncommon: 30, rare: 22, mythical: 11, immortal: 5 } },
    immortal: { cost: 20000, scaleMul: 90, w: { rare: 38, mythical: 36, immortal: 22, arcana: 4 } },
    arcana: { cost: 80000, scaleMul: 140, w: { mythical: 36, immortal: 46, arcana: 18 } }
  },
  shop: { black_king_bar: 6000, heart: 8000, butterfly: 9000, greater_crit: 9000, satanic: 10000, assault: 11000, pipe: 8000, ultimate_scepter: 12000, refresher: 14000, rapier: 25000,
    abyssal_blade: 12000, monkey_king_bar: 9000, skadi: 11000, bloodthorn: 12000, shivas_guard: 10000, sphere: 9000, manta: 10000, radiance: 11000, octarine_core: 10000, aeon_disk: 7000, desolator: 8000, vladmir: 9000 },
  shopRef: 250,                  // 2.4: цена лавки = база × rewardScale / shopRef (при rewardScale 1000 — ×4)
  slotPairDropsItem: true,       // 3-барабанные слоты: пара даёт предмет (true = как сейчас)
  // 2.3: слоты 3×3 (5 линий) и 3×5 (10 линий). Ставка делится поровну между линиями.
  // 3×3: full — 3 одинаковых на линии, pair — 2 одинаковых слева. 3×5: p5/p4/p3 — 5/4/3 одинаковых подряд слева.
  // Отдача (RTP) как у старых автоматов: 86% / 88% / 76% / 76% плюс выпадающие предметы.
  slotsMaxBet: 1000000,
  slots: {
    imm3: { minBet: 50, lines: 5, full: { arcana: 300, immortal: 90, mythical: 40, rare: 20, uncommon: 13, common: 8 }, pair: { arcana: 5, immortal: 2.5, mythical: 1.6, rare: 1, uncommon: 0.7, common: 0.5 } },
    arc5: { minBet: 100, lines: 10, p5: { arcana: 9000, immortal: 2250, mythical: 680, rare: 280, uncommon: 135, common: 80 }, p4: { arcana: 680, immortal: 225, mythical: 90, rare: 45, uncommon: 22, common: 13.5 }, p3: { arcana: 68, immortal: 28, mythical: 13.5, rare: 8, uncommon: 5, common: 3.4 }, boost: 0.3 },
    cos3: { minBet: 50, lines: 5, full: { arcana: 260, immortal: 78, mythical: 35, rare: 17, uncommon: 11, common: 7 }, pair: { arcana: 4.4, immortal: 2.2, mythical: 1.4, rare: 0.9, uncommon: 0.6, common: 0.44 } },
    cos5: { minBet: 100, lines: 10, p5: { arcana: 7800, immortal: 1950, mythical: 580, rare: 240, uncommon: 117, common: 68 }, p4: { arcana: 580, immortal: 195, mythical: 78, rare: 39, uncommon: 19, common: 11.7 }, p3: { arcana: 58, immortal: 24, mythical: 11.7, rare: 6.8, uncommon: 4.4, common: 2.9 } }
  },
  // прогресс: сезонный пропуск, недельные задания, лиги PvP (этап 3)
  progression: {
    levels: 30, xpPerLevel: 300, levelGemsMul: 1.05,         // награда уровня пропуска = rewardScale × levelGemsMul
    itemLevels: { 5: 'rare', 10: 'mythical', 15: 'immortal', 20: 'mythical', 25: 'immortal', 30: 'arcana' },
    xp: { daily: 60, weekly: 300, login: 40, arenaWin: 8, gameRound: 4, pvp: 12, roshan: 15 },
    dailyCap: { arena: 150, game: 80 },                      // XP в сутки за арену и мини-игры не больше этого
    weeklyMul: 4.2,                                           // награда недельного задания = rewardScale × 6
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
  if (typeof CHESTS !== 'undefined') CHESTS.forEach(c => { const x = CONFIG.chests[c.id]; if (x) { c.w = x.w; } });
  if (typeof MACHINES !== 'undefined') MACHINES.forEach(m => Object.assign(m, CONFIG.slots[m.id] || {}));
}
