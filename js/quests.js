// ================= QUESTS / ACHIEVEMENTS / DAILY LOGIN / SAVE TRANSFER =================
function todayStr() { return dayStrOf(nowMs()); }
// новый день наступил? (если часы телефона перевели назад — день не «откатывается»)
function isNewDay(stored, today) { return stored !== today && !(stored && stored > today); }
function dayDiff(a, b) { return Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000); }
function rewardScale() { return Math.max(CONFIG.rewardScale.min, Math.round(lvlReward(Math.min(CONFIG.rewardScale.capLevel || 100, S.arena.cleared + 1)) * CONFIG.rewardScale.mul)); }
const QUEST_POOL = [
  { id: 'heroSpins', t: 'Сделай {n} круток в рулетке героев', n: [10, 20, 30], icon: '🎯', mult: 1 },
  { id: 'slotSpins', t: 'Прокрути слоты {n} раз', n: [15, 30, 50], icon: '🎰', mult: 1 },
  { id: 'arenaWins', t: 'Выиграй {n} боя на арене', n: [2, 3, 5], icon: '⚔️', mult: 1.4 },
  { id: 'upgradesTry', t: 'Попробуй апгрейд {n} раз', n: [2, 3, 5], icon: '🔧', mult: 1 },
  { id: 'invokerRuns', t: 'Пройди Invoker Game {n} раз', n: [1, 2], icon: '🔮', mult: 1.2 },
  { id: 'itemsSold', t: 'Продай {n} предметов', n: [5, 10, 20], icon: '💰', mult: 0.8 },
  { id: 'nishtyak', t: 'Поймай НИШТЯК {n} раз', n: [1], icon: '🌈', mult: 2 },
  { id: 'heroLevels', t: 'Подними героям {n} уровней', n: [10, 20, 40], icon: '⬆️', mult: 1.2 }
];
const ACHIEVEMENTS = [
  { id: 'spin1', icon: '🎯', name: 'Первая крутка', d: 'Крутни рулетку героев', ok: () => st('heroSpins') >= 1, r: 300 },
  { id: 'spin100', icon: '🎯', name: 'Рулеточник', d: '100 круток героев', ok: () => st('heroSpins') >= 100, r: 3000 },
  { id: 'spin1000', icon: '🎯', name: 'Колесо судьбы', d: '1000 круток героев', ok: () => st('heroSpins') >= 1000, r: 30000 },
  { id: 'slot50', icon: '🎰', name: 'Азартный', d: '50 прокрутов слотов', ok: () => st('slotSpins') >= 50, r: 1500 },
  { id: 'slot500', icon: '🎰', name: 'Король слотов', d: '500 прокрутов слотов', ok: () => st('slotSpins') >= 500, r: 15000 },
  { id: 'nish1', icon: '🌈', name: 'НИШТЯК!', d: 'Поймай первый НИШТЯК', ok: () => st('nishtyak') >= 1, r: 1000 },
  { id: 'nish10', icon: '🌈', name: 'Вечный НИШТЯК', d: '10 раз НИШТЯК', ok: () => st('nishtyak') >= 10, r: 10000 },
  { id: 'arena10', icon: '🛤', name: 'Лайнер', d: 'Пройди 10 уровней арены', ok: () => S.arena.cleared >= 10, r: 2000 },
  { id: 'arena25', icon: '🗼', name: 'Хозяин топа', d: 'Захвати верхний лайн (25)', ok: () => S.arena.cleared >= 25, r: 6000, item: 'mythical' },
  { id: 'arena50', icon: '🗼', name: 'Хозяин бота', d: 'Захвати нижний лайн (50)', ok: () => S.arena.cleared >= 50, r: 30000, item: 'immortal' },
  { id: 'arena75', icon: '🌲', name: 'Властелин леса', d: 'Пройди лес (75)', ok: () => S.arena.cleared >= 75, r: 60000, item: 'immortal' },
  { id: 'arena100', icon: '🏛', name: 'Древний пал', d: 'Пройди все 100 уровней', ok: () => S.arena.cleared >= 100, r: 250000, item: 'arcana' },
  { id: 'lvl25', icon: '⭐', name: 'Опытный', d: 'Подними героя до 25 уровня', ok: () => HEROES.some(h => S.heroes[h.id].level >= 25), r: 5000 },
  { id: 'lvl50', icon: '🌟', name: 'Максимум', d: 'Подними героя до 50 уровня', ok: () => HEROES.some(h => S.heroes[h.id].level >= 50), r: 50000, item: 'immortal' },
  { id: 'all10', icon: '👥', name: 'Весь пул', d: 'Все герои 10+ уровня', ok: () => HEROES.every(h => S.heroes[h.id].level >= 10), r: 40000 },
  { id: 'stack10k', icon: '⚔️', name: 'Сильный стак', d: 'Сила стака 10 000', ok: () => stackPower() >= 10000, r: 8000 },
  { id: 'stack50k', icon: '⚔️', name: 'Непобедимые', d: 'Сила стака 50 000', ok: () => stackPower() >= 50000, r: 80000 },
  { id: 'items50', icon: '🎨', name: 'Коллекционер', d: '50 предметов в коллекции', ok: () => S.items.length >= 50, r: 3000 },
  { id: 'arcana1', icon: '💚', name: 'Arcana!', d: 'Получи первую Arcana', ok: () => S.items.some(x => x.rarity === 'arcana'), r: 5000 },
  { id: 'loadout6', icon: '🛡', name: 'Полный комплект', d: 'Заполни все 6 слотов снаряжения героя', ok: () => Object.values(S.loadout).some(l => Object.keys(l).length >= 6), r: 6000 },
  { id: 'ug10', icon: '🔧', name: 'Кузнец', d: '10 успешных апгрейдов', ok: () => st('upgradesOk') >= 10, r: 5000 },
  { id: 'inv20', icon: '🔮', name: 'Карл', d: 'Invoker Race быстрее 20 с', ok: () => S.invBest && S.invBest < 20, r: 3000 },
  { id: 'inv12', icon: '🔮', name: 'Арсенал магии', d: 'Invoker Race быстрее 12 с', ok: () => S.invBest && S.invBest < 12, r: 15000, item: 'mythical' },
  { id: 'sell100', icon: '💰', name: 'Торговец', d: 'Продай 100 предметов', ok: () => st('itemsSold') >= 100, r: 5000 },
  { id: 'streak7', icon: '📅', name: 'Неделя в игре', d: 'Заходи 7 дней подряд', ok: () => S.daily && S.daily.login && S.daily.login.streak >= 7, r: 10000, item: 'immortal' },
  // 2.3: новые достижения
  { id: 'bich10', icon: '🤬', name: 'BITCH!', d: '10 раз поймай БИЧ', ok: () => st('bich') >= 10, r: 1500 },
  { id: 'tw21', icon: '🃏', name: 'Twenty One', d: '21 раз выпадет «21»', ok: () => st('twentyone') >= 21, r: 2100 },
  { id: 'spin5000', icon: '🎡', name: 'Вечный двигатель', d: '5000 круток героев', ok: () => st('heroSpins') >= 5000, r: 150000, item: 'arcana' },
  { id: 'slot2000', icon: '🎰', name: 'Однорукий бандит', d: '2000 прокрутов слотов', ok: () => st('slotSpins') >= 2000, r: 60000 },
  { id: 'lvl50x5', icon: '🌟', name: 'Пятёрка максимумов', d: '5 героев 50 уровня', ok: () => HEROES.filter(h => S.heroes[h.id].level >= 50).length >= 5, r: 200000, item: 'arcana' },
  { id: 'arcana10', icon: '💚', name: 'Коллекция Arcana', d: '10 предметов Arcana', ok: () => S.items.filter(x => x.rarity === 'arcana').length >= 10, r: 50000 },
  { id: 'items500', icon: '📦', name: 'Склад', d: '500 предметов в коллекции', ok: () => S.items.length >= 500, r: 20000 },
  { id: 'pvp10', icon: '🥊', name: 'Боец', d: '10 побед в PvP', ok: () => S.pvp && S.pvp.w >= 10, r: 10000 },
  { id: 'pvp100', icon: '🏆', name: 'Гладиатор', d: '100 побед в PvP', ok: () => S.pvp && S.pvp.w >= 100, r: 100000, item: 'immortal' },
  { id: 'rosh5', icon: '🦍', name: 'Охотник на Рошана', d: 'Убей Рошана 5 раз', ok: () => st('roshanKills') >= 5, r: 25000 },
  { id: 'fights6', icon: '⚔', name: 'Файтер', d: 'Выиграй 6 файтов', ok: () => st('fightsWon') >= 6, r: 15000 },
  { id: 'rogue1', icon: '🌀', name: 'Путь пройден', d: 'Победи Древнего в «Пути Древнего»', ok: () => S.rogue && S.rogue.wins >= 1, r: 20000, item: 'mythical' },
  { id: 'rogue5', icon: '🌀', name: 'Бездна зовёт', d: 'Открой 5-й уровень Бездны', ok: () => S.rogue && Object.values(S.rogue.abyss || {}).some(v => v >= 5), r: 60000, item: 'immortal' },
  { id: 'tower10', icon: '🏰', name: 'Штурмовик', d: 'Пройди 10 этажей Башни', ok: () => S.tower && S.tower.best >= 10, r: 15000 },
  { id: 'tower50', icon: '🏯', name: 'Покоритель Башни', d: 'Пройди все 50 этажей Башни', ok: () => S.tower && S.tower.best >= 50, r: 300000, item: 'arcana' },
  { id: 'craft10', icon: '⚒', name: 'Ремесленник', d: '10 крафтов', ok: () => st('crafts') >= 10, r: 8000 },
  { id: 'gift5', icon: '🎁', name: 'Щедрый', d: 'Отправь 5 подарков', ok: () => st('gifts') >= 5, r: 5000 },
  { id: 'fav5', icon: '⭐', name: 'Любимчики', d: 'Добавь 5 героев в избранное', ok: () => (S.fav || []).length >= 5, r: 1000 },
  { id: 'ss10', icon: '☀', name: 'Exort-мастер', d: 'Попади всеми 10 Sun Strike', ok: () => S.gameBest && S.gameBest.sunstrike >= 10, r: 10000 },
  { id: 'streak30', icon: '📅', name: 'Месяц в игре', d: 'Заходи 30 дней подряд', ok: () => S.daily && S.daily.login && S.daily.login.streak >= 30, r: 100000, item: 'arcana' }
];
function st(k) { return (S.stats && S.stats[k]) || 0; }
function ensureMeta() {
  S.stats = S.stats || {}; S.ach = S.ach || {};
  S.daily = S.daily || { day: '', quests: [], login: { last: '', streak: 0, claimed: '' } };
  const today = todayStr();
  if (isNewDay(S.daily.day, today)) {
    S.daily.day = today;
    const r = seeded(dayDiff('2026-01-01', today) * 131 + (USER ? USER.key.length * 7 : 0));
    const pool = QUEST_POOL.slice();
    S.daily.quests = [];
    for (let i = 0; i < 3; i++) {
      const q = pool.splice(Math.floor(r() * pool.length), 1)[0];
      const n = q.n[Math.floor(r() * q.n.length)];
      S.daily.quests.push({ id: q.id, n, prog: 0, claimed: false, reward: Math.round(rewardScale() * q.mult * (0.6 + n / q.n[q.n.length - 1] * 0.6)) });
    }
  }
  const lg = S.daily.login;
  if (isNewDay(lg.last, today)) {
    const gap = lg.last ? dayDiff(lg.last, today) : 99;
    lg.streak = gap === 1 ? lg.streak + 1 : 1;
    lg.last = today;
  }
}
function track(key, n) {
  if (!S) return;
  n = n || 1;
  ensureMeta();
  S.stats[key] = (S.stats[key] || 0) + n;
  S.daily.quests.forEach(q => { if (q.id === key && !q.claimed) q.prog = Math.min(q.n, q.prog + n); });
  checkAch();
  updateQuestBadge();
}
let achSeen = null;
function checkAch() {
  if (!achSeen) achSeen = new Set(ACHIEVEMENTS.filter(a => safeOk(a)).map(a => a.id));
  ACHIEVEMENTS.forEach(a => { if (!achSeen.has(a.id) && safeOk(a)) { achSeen.add(a.id); toast('🏆 Достижение: ' + a.name, a.d + ' — забери награду во вкладке «Задания»'); } });
}
function safeOk(a) { try { return !!a.ok(); } catch (e) { return false; } }
function questBadgeCount() {
  if (!S || !S.daily) return 0;
  let c = S.daily.quests.filter(q => q.prog >= q.n && !q.claimed).length;
  c += ACHIEVEMENTS.filter(a => !S.ach[a.id] && safeOk(a)).length;
  if (S.daily.login.claimed !== S.daily.day) c++;
  return c;
}
function updateQuestBadge() {
  const b = document.querySelector('#nav button[data-tab=quests]'); if (!b) return;
  const c = questBadgeCount();
  b.innerHTML = (typeof SETTINGS !== 'undefined' && SETTINGS.lang === 'en' ? 'Quests' : 'Задания') + (c ? ' <span class="nbadge">' + c + '</span>' : '');
}
function toast(title, text) {
  let box = document.getElementById('toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const t = document.createElement('div'); t.className = 'toast panel';
  t.innerHTML = '<b>' + esc(title) + '</b><div>' + esc(text) + '</div>';
  t.onclick = () => { switchTab('quests'); t.remove(); };
  box.appendChild(t); setTimeout(() => t.classList.add('out'), 4200); setTimeout(() => t.remove(), 4700);
}
function loginReward(day) { const d = ((day - 1) % 7) + 1; return { gems: Math.round(rewardScale() * (CONFIG.login.base + CONFIG.login.perDay * d)), item: d === 7 ? 'immortal' : d === 4 ? 'mythical' : null }; }

function renderQuests() {
  ensureMeta();
  const host = document.getElementById('quests-host');
  const lg = S.daily.login;
  const claimedToday = lg.claimed === S.daily.day;
  let html = '<div class="sec-title" style="margin-top:0">Награда за вход <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">серия: ' + lg.streak + ' дн.</span></div><div class="login-row">';
  const cur = ((lg.streak - 1) % 7) + 1;
  for (let d = 1; d <= 7; d++) {
    const rw = loginReward(d);
    const state = d < cur || (d === cur && claimedToday) ? 'got' : d === cur ? 'today' : '';
    html += '<div class="lday panel ' + state + '"><div class="dn">День ' + d + '</div><div class="ic">' + (rw.item ? (rw.item === 'immortal' ? '👑' : '🎁') : '🔶') + '</div><div>' + gemHTML(rw.gems) + '</div>' + (rw.item ? '<div style="font-size:.7rem;color:' + RARITY_COLOR[rw.item] + '">+ ' + RARITY_NAMES[rw.item] + '</div>' : '') + (state === 'got' ? '<div class="ok">✓</div>' : '') + '</div>';
  }
  html += '</div><div style="text-align:center;margin:10px 0 4px"><button class="btn green" ' + (claimedToday ? 'disabled' : '') + ' data-click="claimLogin()">' + (claimedToday ? 'Получено — приходи завтра' : 'Забрать награду дня') + '</button></div>';
  html += '<div class="sec-title">Задания на сегодня <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">обновятся в полночь</span></div><div class="quest-list">';
  S.daily.quests.forEach((q, i) => {
    const t = QUEST_POOL.find(x => x.id === q.id);
    const done = q.prog >= q.n;
    html += '<div class="quest panel' + (q.claimed ? ' claimed' : done ? ' done' : '') + '"><div class="qi">' + t.icon + '</div><div style="flex:1"><div class="qt">' + t.t.replace('{n}', q.n) + '</div><div class="xpbar"><div style="width:' + (q.prog / q.n * 100) + '%"></div></div><div class="muted" style="font-size:.75rem">' + q.prog + '/' + q.n + '</div></div><div style="text-align:right">' + gemHTML(q.reward) + '<br>' +
      (q.claimed ? '<span class="muted">✓ получено</span>' : '<button class="btn sm ' + (done ? 'green' : '') + '" ' + (done ? '' : 'disabled') + ' data-click="claimQuest(' + i + ')">Забрать</button>') + '</div></div>';
  });
  html += '</div>';
  const got = ACHIEVEMENTS.filter(a => S.ach[a.id]).length;
  html += '<div class="sec-title">Достижения <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">' + got + '/' + ACHIEVEMENTS.length + '</span></div><div class="ach-grid">';
  ACHIEVEMENTS.forEach(a => {
    const ok = safeOk(a), cl = !!S.ach[a.id];
    html += '<div class="ach panel' + (cl ? ' claimed' : ok ? ' done' : '') + '"><div class="ai">' + a.icon + '</div><div style="flex:1"><div class="qt">' + esc(a.name) + '</div><div class="muted" style="font-size:.75rem">' + esc(a.d) + '</div><div style="font-size:.75rem;margin-top:2px">' + gemHTML(a.r) + (a.item ? ' + <span style="color:' + RARITY_COLOR[a.item] + '">' + RARITY_NAMES[a.item] + '</span>' : '') + '</div></div>' +
      (cl ? '<span class="ok">✓</span>' : ok ? '<button class="btn sm green" data-click="claimAch(\'' + a.id + '\')">Забрать</button>' : '<span class="muted">🔒</span>') + '</div>';
  });
  html += '</div>';
  host.innerHTML = html;
  updateQuestBadge();
}
async function claimLogin() {
  if (typeof cloud === 'function' && cloud() && !TIME_OK) { try { await syncServerTime(); } catch (e) {} if (!TIME_OK) return showModal('🕒', 'Нет связи с сервером', 'Награда за вход выдаётся по времени сервера. Проверь интернет и попробуй ещё раз.', 'bad'); }
  ensureMeta();
  const lg = S.daily.login; if (lg.claimed === S.daily.day) return;
  const rw = loginReward(lg.streak);
  lg.claimed = S.daily.day; addGems(rw.gems);
  let msg = '+' + fmt(rw.gems) + ' 🔶';
  if (rw.item) { const it = addEquipment(mainHeroId(), rw.item); msg += ' · ' + it.name + ' (' + RARITY_NAMES[it.rarity] + ')'; }
  save(); renderQuests(); showModal('📅', 'День ' + (((lg.streak - 1) % 7) + 1), msg, 'ok', { auto: true });
}
function claimQuest(i) {
  const q = S.daily.quests[i]; if (!q || q.claimed || q.prog < q.n) return;
  q.claimed = true; addGems(q.reward); save(); renderQuests();
  showModal('✅', 'Задание выполнено', '+' + fmt(q.reward) + ' 🔶', 'ok', { auto: true });
}
function claimAch(id) {
  const a = ACHIEVEMENTS.find(x => x.id === id); if (!a || S.ach[id] || !safeOk(a)) return;
  S.ach[id] = Date.now(); addGems(a.r);
  let msg = '+' + fmt(a.r) + ' 🔶';
  if (a.item) { const it = addEquipment(mainHeroId(), a.item); msg += ' · ' + it.name; }
  save(); renderQuests(); showModal(a.icon, a.name, msg, 'ok', { auto: true });
  if (a.item === 'arcana') hype('НИШТЯК');
}

// ---------- экспорт / импорт сохранения ----------
function exportCode() { return 'D2M1:' + btoa(unescape(encodeURIComponent(JSON.stringify({ nick: USER.nick, at: Date.now(), state: S })))); }
function openTransfer() {
  const code = exportCode();
  showModal('💾', 'Перенос сохранения', '<div style="text-align:left;font-size:.85rem">' +
    '<p style="margin-bottom:6px">Скачай файл или скопируй код — на другом устройстве открой игру, войди и нажми «Импорт».</p>' +
    '<textarea id="tr-code" style="width:100%;height:90px;background:#05070a;color:#bfe3ff;border:1px solid var(--line2);font-size:.65rem;word-break:break-all">' + code + '</textarea>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px"><button class="btn sm gold" data-click="downloadSave()">⬇ Скачать файл</button><button class="btn sm" data-click="copySave()">📋 Копировать код</button></div>' +
    '<p style="margin-bottom:6px"><b>Импорт</b> (заменит текущий прогресс аккаунта):</p>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap"><label class="btn sm" style="cursor:pointer">📂 Из файла<input type="file" accept=".json,.txt,application/json" style="display:none" data-change="importFile(this)"></label><button class="btn sm" data-click="importFromBox()">Из кода выше</button></div>' +
    '<div class="auth-err" id="tr-err" style="margin-top:6px"></div></div>', '', { html: true, buttons: [{ t: 'Закрыть', c: 'ghost', f: closeModal }] });
}
function downloadSave() {
  try {
    const blob = new Blob([exportCode()], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'dota2master-' + USER.nick + '-' + todayStr() + '.txt';
    document.body.appendChild(a); a.click(); a.remove();
  } catch (e) { document.getElementById('tr-err').textContent = 'Скачивание не удалось — скопируй код.'; }
}
function copySave() {
  const ta = document.getElementById('tr-code');
  const done = () => { document.getElementById('tr-err').style.color = 'var(--ok)'; document.getElementById('tr-err').textContent = 'Код скопирован'; };
  try { navigator.clipboard.writeText(ta.value).then(done, () => { ta.select(); document.execCommand('copy'); done(); }); }
  catch (e) { ta.select(); try { document.execCommand('copy'); done(); } catch (x) {} }
}
function importFile(inp) { const f = inp.files && inp.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => applyImport(String(r.result)); r.readAsText(f); }
function importFromBox() { applyImport(document.getElementById('tr-code').value); }
function applyImport(txt) {
  const err = document.getElementById('tr-err');
  try {
    txt = txt.trim();
    let data;
    if (txt.startsWith('D2M1:')) data = JSON.parse(decodeURIComponent(escape(atob(txt.slice(5)))));
    else data = JSON.parse(txt);
    const st0 = data.state || data;
    const chk = validateSave(st0);
    if (!chk.ok || !st0.heroes || !Array.isArray(st0.items)) throw new Error('bad');
    if (JSON.stringify(st0) === JSON.stringify(S)) { err.textContent = 'Это и есть текущее сохранение.'; return; }
    S = chk.st; delete S.cloud; migrate(S); save(); closeModal(); startGame();
    showModal('💾', 'Импорт выполнен', 'Прогресс загружен' + (data.nick ? ' (сохранение игрока ' + data.nick + ')' : '') + '.', 'ok');
  } catch (e) { err.style.color = ''; err.textContent = 'Не похоже на сохранение Dota 2 Master.'; }
}
