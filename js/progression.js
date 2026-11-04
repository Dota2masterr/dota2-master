// ================= ПРОГРЕСС: недельные задания, сезон, лиги PvP, первые шаги =================
// Все числа — в CONFIG.progression (config.js).

// ---------- служебное ----------
function weekKey(day) {   // ISO-неделя по московской дате 'YYYY-MM-DD' → '2026-W45'
  const d = new Date(day + 'T00:00:00Z'); const wd = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - wd + 3);
  const y = d.getUTCFullYear(), jan4 = new Date(Date.UTC(y, 0, 4));
  const w = 1 + Math.round(((d - jan4) / 864e5 - 3 + (jan4.getUTCDay() + 6) % 7) / 7);
  return y + '-W' + String(w).padStart(2, '0');
}
const MONTHS_RU = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
function seasonId() { return todayStr().slice(0, 7); }                       // сезон = календарный месяц (по Москве)
function seasonName(id) { const [y, m] = (id || seasonId()).split('-'); return MONTHS_RU[+m - 1] + ' ' + y; }
function daysLeftInSeason() { const t = todayStr(); const [y, m] = t.split('-').map(Number); const end = new Date(Date.UTC(y, m, 1)); return Math.max(1, Math.round((end - new Date(t + 'T00:00:00Z')) / 864e5)); }
function giveRewardItem(r) { return addEquipment(mainHeroId(), r); }   // 2.9: вернёт null — предметов вне сундуков нет

// ---------- недельные задания ----------
const WEEKLY_POOL = [
  { id: 'arenaWins', t: 'Выиграй {n} боёв на арене', n: 30, icon: '⚔️' },
  { id: 'heroSpins', t: 'Сделай {n} круток героев', n: 150, icon: '🎯' },
  { id: 'slotSpins', t: 'Прокрути слоты {n} раз', n: 100, icon: '🎰' },
  { id: 'questsDone', t: 'Выполни {n} ежедневных заданий', n: 12, icon: '📋' },
  { id: 'gameRounds', t: 'Сыграй {n} наградных раундов мини-игр', n: 25, icon: '🎮' },
  { id: 'roshanHits', t: 'Сразись с Рошаном {n} раз', n: 8, icon: '🐲' },
  { id: 'pvp', t: 'Проведи {n} PvP-боёв', n: 15, icon: '🛡' },
  { id: 'heroLevels', t: 'Подними героям {n} уровней', n: 120, icon: '⬆️' }
];
function ensureWeekly() {
  const wk = weekKey(todayStr());
  if (!S.weekly || S.weekly.week !== wk) {
    if (S.weekly && S.weekly.week > wk) return S.weekly;              // часы назад — не откатываем
    const r = seeded(+wk.replace(/\D/g, '') * 977 + 5);
    const pool = WEEKLY_POOL.slice(); const q = [];
    for (let i = 0; i < 3; i++) q.push(Object.assign({ prog: 0, claimed: false }, pool.splice(Math.floor(r() * pool.length), 1)[0]));
    S.weekly = { week: wk, quests: q.map(x => ({ id: x.id, n: x.n, prog: 0, claimed: false })), bonus: false };
  }
  return S.weekly;
}
function weeklyReward() { return Math.round(rewardScale() * CONFIG.progression.weeklyMul); }
function claimWeekly(i) {
  const w = ensureWeekly(), q = w.quests[i]; if (!q || q.claimed || q.prog < q.n) return;
  q.claimed = true; addGems(weeklyReward()); seasonXp(CONFIG.progression.xp.weekly, 'weekly');
  let msg = '+' + fmt(weeklyReward()) + ' 🔶 · +' + CONFIG.progression.xp.weekly + ' XP сезона';
  if (!w.bonus && w.quests.every(x => x.claimed)) { w.bonus = true; const g2 = Math.round(rewardScale() * 3); addGems(g2); msg += ' · все 3 выполнены: +' + fmt(g2) + ' 🔶'; hype('НИШТЯК'); }
  save(); renderQuests(); showModal('📆', 'Недельное задание', msg, 'ok', { auto: true });
}

// ---------- сезонный пропуск (бесплатный, 30 уровней) ----------
function ensureSeason() {
  const id = seasonId();
  if (!S.season) S.season = { id, xp: 0, claimed: 0, dayXp: {} };
  if (S.season.id !== id && !(S.season.id > id)) seasonRollover(id);
  return S.season;
}
function seasonLevel() { return Math.min(CONFIG.progression.levels, Math.floor(S.season.xp / CONFIG.progression.xpPerLevel)); }
function seasonLevelReward(L) {
  const P = CONFIG.progression;
  const r = { gems: Math.round(rewardScale() * P.levelGemsMul), item: null, title: null };   // 2.9: без предметов
  if (L === 15) r.title = { id: 'season-' + S.season.id + '-15', name: 'Ветеран ' + seasonName(S.season.id), color: '#7ad3ff', icon: '🎖' };
  if (L === P.levels) r.title = { id: 'season-' + S.season.id + '-30', name: 'Чемпион ' + seasonName(S.season.id), color: '#ffd36a', icon: '🏆' };
  return r;
}
function grantTitle(t) { S.titlesWon = S.titlesWon || []; if (!S.titlesWon.some(x => x.id === t.id)) S.titlesWon.push(t); }
// XP за действия; arena/game ограничены в сутки, чтобы гриндом не закрыть сезон за день
function seasonXp(n, src) {
  if (!S || !n) return;
  const s = ensureSeason(), cap = CONFIG.progression.dailyCap[src];
  if (cap) { const k = todayStr() + ':' + src; s.dayXp = s.dayXp || {}; Object.keys(s.dayXp).forEach(x => { if (!x.startsWith(todayStr())) delete s.dayXp[x]; }); const used = s.dayXp[k] || 0; n = Math.min(n, cap - used); if (n <= 0) return; s.dayXp[k] = used + n; }
  const before = seasonLevel(); s.xp += n;
  if (seasonLevel() > before) toast('🎫 Сезон: уровень ' + seasonLevel(), 'Забери награду во вкладке «Задания»');
}
function claimSeason() {
  const s = ensureSeason(), lvl = seasonLevel(); if (s.claimed >= lvl) return;
  let gems = 0; const got = [];
  for (let L = s.claimed + 1; L <= lvl; L++) {
    const r = seasonLevelReward(L); gems += r.gems;
    if (r.item) { const it = giveRewardItem(r.item); if (it) got.push(it.name + ' (' + RARITY_NAMES[it.rarity] + ')'); }
    if (r.title) { grantTitle(r.title); got.push('титул «' + r.title.name + '»'); }
  }
  s.claimed = lvl; addGems(gems); save(); renderQuests();
  if (got.some(x => /Arcana|титул/.test(x))) hype('НИШТЯК');
  showModal('🎫', 'Награды сезона', '+' + fmt(gems) + ' 🔶' + (got.length ? ' · ' + got.join(', ') : ''), 'ok');
}
// смена сезона: невыданные награды выдаются автоматически, MMR мягко сбрасывается, лига даёт награду
function seasonRollover(newId) {
  const s = S.season, old = s.id;
  const lines = [];
  // невыданные уровни пропуска
  const lvl = Math.min(CONFIG.progression.levels, Math.floor(s.xp / CONFIG.progression.xpPerLevel));
  let g = 0;
  for (let L = s.claimed + 1; L <= lvl; L++) { const r = seasonLevelReward(L); g += r.gems; if (r.item) giveRewardItem(r.item); if (r.title) grantTitle(r.title); }
  if (g) { addGems(g); lines.push('Невыданные награды пропуска: +' + fmt(g) + ' 🔶'); }
  // лига PvP
  if (S.pvp && (S.pvp.w + S.pvp.l) > 0) {
    const peak = Math.max(S.pvp.peak || 0, S.pvp.mmr), rk = rankOf(peak), ri = RANKS.indexOf(rk);
    const lg = Math.round(rewardScale() * CONFIG.progression.leagueMul[ri]);
    addGems(lg); lines.push('Лига ' + rk[0] + ': +' + fmt(lg) + ' 🔶');
    if (ri >= 4) { grantTitle({ id: 'league-' + old, name: rk[0] + ' · ' + seasonName(old), color: rk[2], icon: '🏅' }); lines.push('титул «' + rk[0] + ' · ' + seasonName(old) + '»'); }
    const nm = Math.round(S.pvp.mmr * CONFIG.progression.mmrKeep);
    lines.push('MMR: ' + S.pvp.mmr + ' → ' + nm + ' (мягкий сброс)');
    S.pvp.mmr = nm; S.pvp.peak = nm; S.pvp.seasonW = 0; S.pvp.seasonL = 0;
  }
  S.season = { id: newId, xp: 0, claimed: 0, dayXp: {} };
  // 2.9: топ-3 по MMR прошлого сезона — награды на выбор
  if (typeof leagueTopReward === 'function') setTimeout(() => leagueTopReward(old).catch(() => {}), 4000);
  if (lines.length) setTimeout(() => showModal('🏁', 'Сезон «' + seasonName(old) + '» завершён', lines.join(' · '), 'ok'), 1500);
}

// ---------- первые шаги (онбординг) ----------
const ONBOARDING = [
  { id: 'spin', t: 'Крутни рулетку любого героя', ok: () => st('heroSpins') >= 1, gems: 1000, tab: 'heroes' },
  { id: 'arena1', t: 'Пройди 1-й уровень арены', ok: () => S.arena.cleared >= 1, gems: 1500, tab: 'arena' },
  { id: 'claim', t: 'Забери награду за вход в «Заданиях»', ok: () => S.daily && S.daily.login.claimed === S.daily.day, gems: 500, tab: 'quests' },
  { id: 'slot', t: 'Прокрути слоты', ok: () => st('slotSpins') >= 1, gems: 800, tab: 'slots' },
  { id: 'arena5', t: 'Пройди 5-й уровень арены', ok: () => S.arena.cleared >= 5, gems: 2000, tab: 'arena' }
];
function onboardingActive() { return S && !(S.onb && S.onb.done) && !(S.arena.cleared > 15); }
function claimOnb(id) {
  S.onb = S.onb || { got: {} }; S.onb.got = S.onb.got || {};
  const st0 = ONBOARDING.find(x => x.id === id); if (!st0 || S.onb.got[id] || !st0.ok()) return;
  S.onb.got[id] = true; addGems(st0.gems);
  let msg = '+' + fmt(st0.gems) + ' 🔶';
  if (st0.item) { const it = addSkin(mainHeroId(), st0.item); if (it) { msg += ' · ' + it.name + ' (' + RARITY_NAMES[it.rarity] + ')'; hype('НИШТЯК'); } }
  if (ONBOARDING.every(x => S.onb.got[x.id])) { S.onb.done = true; msg += ' · Первые шаги пройдены!'; }
  save(); renderHome(); updateTop(); showModal('🚀', 'Первые шаги', msg, 'ok', { auto: !st0.item });
}
function onboardingHTML() {
  if (!onboardingActive()) return '';
  const got = (S.onb && S.onb.got) || {};
  const n = ONBOARDING.filter(x => got[x.id]).length;
  return '<div class="panel panel-b onb"><div class="cinzel" style="color:var(--gold2);letter-spacing:1px">🚀 Первые шаги <span class="muted" style="font-family:Roboto Condensed;font-size:.8rem">' + n + '/' + ONBOARDING.length + '</span></div>' +
    ONBOARDING.map(x => { const ok = x.ok(), g = got[x.id];
      return '<div class="onb-row' + (g ? ' got' : '') + '"><span>' + (g ? '✅' : ok ? '🎁' : '⬜') + ' ' + esc(x.t) + '</span><span>' + gemHTML(x.gems) + (x.item ? ' + <b style="color:' + RARITY_COLOR[x.item] + '">Immortal</b>' : '') + ' ' +
        (g ? '' : ok ? '<button class="btn sm green" data-click="claimOnb(\'' + x.id + '\')">Забрать</button>' : '<button class="btn sm ghost" data-click="switchTab(\'' + x.tab + '\')">Перейти</button>') + '</span></div>'; }).join('') + '</div>';
}

// ---------- PvP: защита новичков, лиги ----------
// соперник должен быть сопоставим по силе: от minRatio до maxRatio твоей силы стака
function pvpEligible(opp) {
  const P = CONFIG.progression.pvp, mine = Math.max(1, stackPower());
  const op = opp.team.reduce((a, t) => a + t.p, 0);
  return op >= mine * P.minRatio && op <= mine * P.maxRatio;
}
function pvpBot() {
  const mine = stackPower(), ids = []; const pool = HEROES.map(h => h.id);
  while (ids.length < 5) { const id = pick(pool); if (!ids.includes(id)) ids.push(id); }
  const w = [0.3, 0.2, 0.18, 0.16, 0.16], k = 0.9 + Math.random() * 0.2;
  return { nick: 'Тренировочный бот', mmr: S.pvp.mmr, team: ids.map((id, i) => ({ id, p: Math.max(10, Math.round(mine * k * w[i])) })), tm: { atk: 1 }, bot: true };
}
function leagueHTML() {
  ensurePvp();
  const P = CONFIG.progression;
  return '<div class="sec-title">Лиги сезона «' + esc(seasonName()) + '» <span class="muted" style="font-size:.75rem;font-family:Roboto Condensed;letter-spacing:0;text-transform:none">до конца ' + daysLeftInSeason() + ' дн. · награда за лучший ранг сезона, затем MMR уменьшается на ' + Math.round((1 - P.mmrKeep) * 100) + '%</span></div>' +
    '<div class="league-row">' + RANKS.map((r, i) => '<div class="lg' + (rankOf(Math.max(S.pvp.peak || 0, S.pvp.mmr))[0] === r[0] ? ' cur' : '') + '" style="--c:' + r[2] + '"><b>' + r[0] + '</b><span>' + r[1] + '+</span><span>' + gemHTML(Math.round(rewardScale() * P.leagueMul[i])) + '</span>' + (i >= 4 ? '<span>🏅 титул</span>' : '') + '</div>').join('') + '</div>';
}

// ---------- встраивание во вкладку «Задания» и главную ----------
function weeklyHTML() {
  const w = ensureWeekly();
  const days = 7 - ((new Date(todayStr() + 'T00:00:00Z').getUTCDay() + 6) % 7);
  return '<div class="sec-title">Задания недели <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">обновятся через ' + days + ' дн. · все 3 = Immortal</span></div><div class="quest-list">' +
    w.quests.map((q, i) => { const t = WEEKLY_POOL.find(x => x.id === q.id), done = q.prog >= q.n;
      return '<div class="quest panel weekly' + (q.claimed ? ' claimed' : done ? ' done' : '') + '"><div class="qi">' + t.icon + '</div><div style="flex:1"><div class="qt">' + t.t.replace('{n}', q.n) + '</div><div class="xpbar"><div style="width:' + Math.min(100, q.prog / q.n * 100) + '%"></div></div><div class="muted" style="font-size:.75rem">' + q.prog + '/' + q.n + ' · +' + CONFIG.progression.xp.weekly + ' XP</div></div><div style="text-align:right">' + gemHTML(weeklyReward()) + '<br>' +
        (q.claimed ? '<span class="muted">✓ получено</span>' : '<button class="btn sm ' + (done ? 'green' : '') + '" ' + (done ? '' : 'disabled') + ' data-click="claimWeekly(' + i + ')">Забрать</button>') + '</div></div>'; }).join('') + '</div>';
}
function seasonHTML() {
  const s = ensureSeason(), P = CONFIG.progression, lvl = seasonLevel();
  const into = s.xp - lvl * P.xpPerLevel, frac = lvl >= P.levels ? 1 : into / P.xpPerLevel;
  let cells = '';
  for (let L = 1; L <= P.levels; L++) {
    const r = seasonLevelReward(L), got = L <= s.claimed, open = L <= lvl;
    cells += '<div class="sp-cell' + (got ? ' got' : open ? ' open' : '') + (r.item || r.title ? ' big' : '') + '" title="' + esc('Ур. ' + L + ': ' + fmt(r.gems) + ' 🔶' + (r.item ? ' + ' + RARITY_NAMES[r.item] : '') + (r.title ? ' + титул «' + r.title.name + '»' : '')) + '"><b>' + L + '</b>' +
      (r.title ? '<span>' + r.title.icon + '</span>' : r.item ? '<span style="color:' + RARITY_COLOR[r.item] + '">◆</span>' : '<span>🔶</span>') + '</div>';
  }
  return '<div class="sec-title">🎫 Сезон «' + esc(seasonName()) + '» <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">бесплатный пропуск · осталось ' + daysLeftInSeason() + ' дн.</span></div>' +
    '<div class="panel panel-b season"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><div>Уровень <b style="color:#fff;font-size:1.2rem">' + lvl + '</b>/' + P.levels + ' · XP ' + fmt(s.xp) + '</div>' +
    (s.claimed < lvl ? '<button class="btn green sm" data-click="claimSeason()">Забрать награды (' + (lvl - s.claimed) + ')</button>' : '<span class="muted" style="font-size:.8rem">награды забраны</span>') + '</div>' +
    '<div class="xpbar" style="margin:6px 0"><div style="width:' + Math.round(frac * 100) + '%"></div></div>' +
    '<div class="muted" style="font-size:.75rem;margin-bottom:6px">XP: задание дня +' + P.xp.daily + ', недели +' + P.xp.weekly + ', вход +' + P.xp.login + ', победа на арене +' + P.xp.arenaWin + ' (до ' + P.dailyCap.arena + '/день), раунд мини-игры +' + P.xp.gameRound + ', PvP +' + P.xp.pvp + ', Рошан +' + P.xp.roshan + '</div>' +
    '<div class="sp-grid">' + cells + '</div></div>';
}
(function hookProgression() {
  // счётчики → недельные задания и XP сезона
  const _track = track;
  track = function (key, n) {
    _track(key, n);
    if (!S) return; n = n || 1;
    const w = ensureWeekly(); w.quests.forEach(q => { if (q.id === key && !q.claimed) q.prog = Math.min(q.n, q.prog + n); });
    const X = CONFIG.progression.xp;
    if (key === 'arenaWins') seasonXp(X.arenaWin * n, 'arena');
    else if (key === 'gameRounds') seasonXp(X.gameRound * n, 'game');
    else if (key === 'pvp') seasonXp(X.pvp * n, 'pvp');
    else if (key === 'roshanHits') seasonXp(X.roshan * n, 'roshan');
  };
  const _claimQuest = claimQuest;
  claimQuest = function (i) { const q = S.daily.quests[i]; const ok = q && !q.claimed && q.prog >= q.n; _claimQuest(i); if (ok) { track('questsDone'); seasonXp(CONFIG.progression.xp.daily, 'daily'); save(); } };
  const _claimLogin = claimLogin;
  claimLogin = async function () { const before = S.daily && S.daily.login.claimed; await _claimLogin(); if (S.daily.login.claimed !== before) { seasonXp(CONFIG.progression.xp.login, 'login'); save(); if (currentTab === 'quests') renderQuests(); } };
  const _gamePay = gamePay;
  gamePay = function (g, amount) { const v = _gamePay(g, amount); if (v) track('gameRounds'); return v; };
  const _fightRoshan = fightRoshan;
  fightRoshan = function () { const r = roshanState(); const t0 = r.tries; _fightRoshan(); if (roshanState().tries < t0) track('roshanHits'); };
  // вкладка «Задания»: сезон сверху, недельные — после дневных
  const _renderQuests = renderQuests;
  renderQuests = function () {
    ensureSeason(); ensureWeekly();
    _renderQuests();
    const host = document.getElementById('quests-host'); if (!host) return;
    const secs = host.querySelectorAll('.sec-title');
    if (secs[1]) secs[1].insertAdjacentHTML('beforebegin', seasonHTML());
    const lists = host.querySelectorAll('.quest-list');
    if (lists[0]) lists[0].insertAdjacentHTML('afterend', weeklyHTML());
    updateQuestBadge();
  };
  const _badge = questBadgeCount;
  questBadgeCount = function () {
    let c = _badge(); if (!S) return c;
    const w = ensureWeekly(); c += w.quests.filter(q => q.prog >= q.n && !q.claimed).length;
    const s = ensureSeason(); if (s.claimed < seasonLevel()) c++;
    return c;
  };
  // главная: «Первые шаги»
  const _renderHome = renderHome;
  renderHome = function () {
    _renderHome();
    let box = document.getElementById('onb-box');
    if (!box) { const h = document.getElementById('hod-home'); if (!h) return; h.insertAdjacentHTML('afterend', '<div id="onb-box"></div>'); box = document.getElementById('onb-box'); }
    box.innerHTML = onboardingHTML();
  };
})();
