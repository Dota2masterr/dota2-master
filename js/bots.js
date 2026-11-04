// ================= 2.4: РАНГИ ПО 1000 MMR И БОТЫ С РЕЙТИНГОМ =================
// Ранг = 1000 MMR, внутри — 5 ступеней по 200 (Archon I … Archon V). Immortal — от 7000, дальше просто число.
// 2.5: боты делятся на уровни (CONFIG.botTiers), на высоких рангах встречаются только сильные; набор MMR медленнее (CONFIG.mmr).
// Соперник ищется среди людей в окне ±1000 MMR. Если людей нет — бот из узла bots/ (у бота ник, значок 🤖,
// свой MMR и ранг). Боты тоже играют между собой раз в день, а сильные боты (от 3000) берут контр-пики.
const RANK_STEP = 1000, SUB_STEP = 200, SUB_NAMES = ['I', 'II', 'III', 'IV', 'V'];
function rankName(mmr) {
  mmr = Math.max(0, Math.round(mmr || 0));
  const r = rankOf(mmr);
  if (r === RANKS[RANKS.length - 1]) return r[0] + ' · ' + mmr;
  return r[0] + ' ' + SUB_NAMES[Math.min(4, Math.floor((mmr - r[1]) / SUB_STEP))];
}
// до следующей ступени
function rankNext(mmr) { const r = rankOf(mmr); if (r === RANKS[RANKS.length - 1]) return null; const base = r[1] + (Math.floor((mmr - r[1]) / SUB_STEP) + 1) * SUB_STEP; return base - mmr; }

const BOT_NICKS = ['NightWalker', 'MidOrFeed', 'xX_Pudge_Xx', 'SilentCarry', 'GankMaster', 'RoshanSnack', 'Techies4Life', 'BlinkDagger', 'ManaVoid', 'HexedFrog',
  'FountainDiver', 'CreepDenier', 'WardBuyer', 'FiveStack', 'TPtoBottom', 'BKBtimer', 'SmokeGank', 'StackThatCamp', 'Ракшас', 'КерриНаЛайне',
  'ПудгоХук', 'Невидимка', 'ТихийМид', 'Лесник228', 'ВардыКупи', 'ДайМид', 'ТапокАнтимага', 'КрипДенай', 'ЭгидаМоя', 'СаппортБезВардов',
  'Арканщик', 'ЛегендарныйАрхонт', 'Ш4рмер', 'CourierSniper', 'AegisThief', 'RapierDrop', 'CheeseEater', 'TowerHugger', 'BackdoorKing', 'RampageHunter',
  'Morph_Main', 'InvokerGod', 'QWERtyuiop', 'Sunstrike99', 'MeepoTeam', 'ChronoTime', 'VoidSphere', 'DoomBringer', 'FlameLina', 'IceMaiden',
  'ЗолотойВепрь', 'Мидер2007', 'Хардлейн', 'Оффлейнер', 'ДжаггерСпин', 'МиранаСтрела', 'ЛионПальчик', 'ВисаджКрик', 'ТинкерРефреш', 'ЗевсУльта',
  // 2.5: ещё 30 ботов
  'ShadowShaman', 'TrueSight', 'GlimmerCape', 'SpiritVessel', 'WardTheRiver', 'DeepDiver', 'PushMid', 'HighGround', 'MegaCreeps', 'ComebackKing',
  'StunLock', 'ManaBurn', 'NoFeedPls', 'LastPick', 'DraftGod', 'Пятёрка', 'ЛиняяЛиния', 'ЭнигмаБХ', 'ШейкерЭхо', 'ДазлГрейв',
  'КоролевскийДром', 'МагнусРП', 'ВойдХрон', 'ТерорБлейд', 'ЛинаЛагуна', 'КоролевскийСпирит', 'ТрентЛес', 'ЧенПоддержка', 'ОракулФейт', 'ИоТетер'];
const BOT_COUNT = BOT_NICKS.length;
const BOT_ID_RE = /^b[0-9]{1,3}$/;
let botCache = null, botAt = 0;
// стартовый MMR бота: от 0 до ~6000, поровну по рангам
function botSeedMmr(i) { return Math.min(6400, Math.round((i / BOT_COUNT) * CONFIG.bots.startMax + seeded(i * 97 + 5)() * 300)); }
function botRow(i, v) {
  v = isObj(v) ? v : {};
  return { id: 'b' + i, i, nick: BOT_NICKS[i] || ('Bot' + i), mmr: Math.round(num(v.mmr, 0, CONFIG.bots.mmrMax, botSeedMmr(i))), w: Math.floor(num(v.w, 0, 1e6, 0)), l: Math.floor(num(v.l, 0, 1e6, 0)), bot: true };
}
// список ботов: из базы, а если узла ещё нет — создаём (один раз) и пользуемся локальными значениями
async function loadBots(force) {
  if (!force && botCache && Date.now() - botAt < 120000) return botCache;
  let raw = null;
  try { raw = typeof db === 'function' && cloud() ? await db('GET', 'bots') : null; } catch (e) { raw = null; }
  const list = []; for (let i = 0; i < BOT_COUNT; i++) list.push(botRow(i, raw && raw['b' + i]));
  botCache = list; botAt = Date.now();
  if (cloud() && (!raw || Object.keys(raw).length < BOT_COUNT)) {
    const up = {}; list.forEach(b => { if (!raw || !raw[b.id]) up['bots/' + b.id] = { mmr: b.mmr, w: 0, l: 0, at: SV_TIME }; });
    try { await dbMulti(up); } catch (e) { console.warn('bots seed', e); }
  }
  return list;
}
// 2.5: уровень бота по его MMR: лёгкий / средний / сложный / элитный
// 2.5.1: часть ботов (каждый CONFIG.botHardEvery-й) — «Сложные» и на низком MMR
function botTier(mmr, i) { let t = CONFIG.botTiers[0]; CONFIG.botTiers.forEach(x => { if (mmr >= x.from) t = x; }); if (i != null && CONFIG.botHardEvery && i % CONFIG.botHardEvery === CONFIG.botHardEvery - 1 && CONFIG.botTiers.indexOf(t) < 2) t = CONFIG.botTiers[2]; return t; }
function botTierIdx(mmr, i) { return CONFIG.botTiers.indexOf(botTier(mmr, i)); }
function rankIdx(mmr) { return RANKS.indexOf(rankOf(mmr)); }
// стак бота: герои по номеру бота, сила — около твоей и растёт с уровнем бота и твоим рангом
function botStack(b) {
  const r = seeded(b.i * 7919 + Math.floor(b.mmr / 100));
  const pool = HEROES.map(h => h.id), ids = [];
  const mine = getStack(), C = CONFIG.bots;
  // сильные боты подбирают героев против самой частой роли твоего стака
  let want = null;
  if (b.mmr >= C.counterFrom) {
    const cnt = {}; mine.forEach(id => { const ro = heroRole(id); cnt[ro] = (cnt[ro] || 0) + 1; });
    const top = Object.keys(cnt).sort((a, c) => cnt[c] - cnt[a])[0]; want = roleWeakTo(top);
  }
  while (ids.length < 5) {
    const cand = want && ids.length < 3 ? pool.filter(id => want.includes(heroRole(id))) : pool;
    const id = cand[Math.floor(r() * cand.length)]; if (!ids.includes(id)) ids.push(id);
  }
  const tier = botTier(b.mmr, b.i), rk = rankIdx(S.pvp.mmr);
  // сила: около твоей, × уровень бота, +0.4% за каждый твой ранг; разброс у сильных ботов меньше (они стабильнее)
  const spread = tier.ai >= 2 ? 0.08 : 0.16;
  const power = Math.max(50, stackPower()) * (1 + Math.max(-0.2, Math.min(0.2, (b.mmr - S.pvp.mmr) / C.powerPerMmr))) * tier.pow * (1 + 0.004 * rk) * (1 - spread / 2 + r() * spread);
  // сильные боты вкладывают больше силы в главного героя (билд «керри»), слабые — ровно
  const w = tier.ai >= 2 ? [0.31, 0.2, 0.17, 0.16, 0.16] : [0.3, 0.2, 0.18, 0.16, 0.16];
  return { nick: '🤖 ' + b.nick, mmr: b.mmr, team: ids.map((id, k) => ({ id, p: Math.max(10, Math.round(power * w[k])) })), tm: { atk: tier.atk }, bot: true, botId: b.id, ranked: true, counter: !!want, ai: tier.ai, tier: tier.n };
}
// ближайший по MMR бот в окне ±1000 (если такого нет — самый близкий)
async function pickBotOpponent() {
  const list = await loadBots();
  // 2.5: на высоких рангах — только сильные боты (CONFIG.botMinTier по рангу игрока)
  const minT = CONFIG.botMinTier[rankIdx(S.pvp.mmr)] || 0;
  let pool = list.filter(b => botTierIdx(b.mmr, b.i) >= minT); if (!pool.length) pool = list.slice().sort((a, b) => b.mmr - a.mmr).slice(0, 6);
  const near = pool.filter(b => Math.abs(b.mmr - S.pvp.mmr) <= CONFIG.bots.window).sort((a, b) => Math.abs(a.mmr - S.pvp.mmr) - Math.abs(b.mmr - S.pvp.mmr));
  const cand = near.length ? near.slice(0, 6) : pool.slice().sort((a, b) => Math.abs(a.mmr - S.pvp.mmr) - Math.abs(b.mmr - S.pvp.mmr)).slice(0, 1);
  return botStack(pick(cand));
}
// после боя с ботом его MMR меняется в обратную сторону
async function botAfterFight(botId, delta, botWon) {
  if (!BOT_ID_RE.test(botId || '') || !cloud()) return;
  const b = (botCache || []).find(x => x.id === botId); if (!b) return;
  const d = Math.max(-CONFIG.bots.maxStep, Math.min(CONFIG.bots.maxStep, Math.round(delta)));
  b.mmr = Math.max(0, Math.min(CONFIG.bots.mmrMax, b.mmr + d)); if (botWon) b.w++; else b.l++;
  try { await db('PUT', 'bots/' + botId, { mmr: b.mmr, w: b.w, l: b.l, at: SV_TIME }); } catch (e) { console.warn('bot mmr', e); }
}
// раз в сутки первый зашедший игрок проводит матчи ботов между собой (детерминированно по дню)
async function botDailyMatches() {
  if (!cloud()) return;
  const day = Math.floor(nowMs() / 864e5);
  let last = 0; try { last = +(await db('GET', 'bots_meta/day')) || 0; } catch (e) { return; }
  if (last >= day) return;
  const list = await loadBots(true), r = seeded(day * 131 + 7), C = CONFIG.bots;
  const order = list.slice().sort((a, b) => a.mmr - b.mmr);
  const up = { 'bots_meta/day': day };
  for (let k = 0; k + 1 < order.length; k += 2) {
    const a = order[k], b = order[k + 1];
    const pa = 1 / (1 + Math.pow(10, (b.mmr - a.mmr) / 400));
    const aWin = r() < pa, d = Math.round(18 + 4 * r());
    const win = aWin ? a : b, lose = aWin ? b : a;
    win.mmr = Math.min(C.mmrMax, win.mmr + d + C.dailyGrowth); win.w++;
    lose.mmr = Math.max(0, lose.mmr - d + C.dailyGrowth); lose.l++;
  }
  list.forEach(b => { up['bots/' + b.id] = { mmr: b.mmr, w: b.w, l: b.l, at: SV_TIME }; });
  try { await dbMulti(up); botAt = Date.now(); } catch (e) { console.warn('bot day', e); }
}
