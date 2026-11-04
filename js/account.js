// ================= АККАУНТ: удаление, «Что нового», аналитика без персональных данных =================

// ---------- «Что нового» ----------
function openChangelog() {
  showModal('📜', 'Что нового', '<div style="text-align:left;max-height:60vh;overflow:auto;font-size:.88rem">' + CHANGELOG.slice(0, 4).map(c =>
    '<div style="margin-bottom:10px"><b style="color:var(--gold2)">Версия ' + esc(c.v) + '</b> <span class="muted">· ' + esc(c.date) + '</span><ul style="margin:4px 0 0 18px">' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('') +
    '<a href="roadmap.html" target="_blank" rel="noopener">Роадмап и вся история →</a></div>', '', { html: true });
}
// 2.4: окно «Что нового в 2.4» с цифрами «было → стало»
function openWhatsNew24() {
  const row = (a, b, c) => '<tr><td>' + a + '</td><td class="was">' + b + '</td><td class="now">' + c + '</td></tr>';
  const tb = (title, rows) => '<div class="wn-h">' + title + '</div><table class="wn-t"><tr><th></th><th>было</th><th>стало</th></tr>' + rows.join('') + '</table>';
  showModal('🆕', 'Что нового в 2.4', '<div class="wn">' +
    '<p>Главное: в бою теперь решает тактика, а не только сила, а кристаллы снова чего-то стоят.</p>' +
    tb('⚔ Боёвка арены', [row('Урон героев и врагов', '100%', '85%'), row('Длина боя (x1)', '22–35 с', '25–40 с'), row('Контр-пик роли', '—', '+15% / −10% урона'), row('Ульта в удачный момент', '—', '×1.4'), row('Враги сзади', 'по одному', 'второй бьёт из задней линии'), row('Подбор врагов против стака', '—', 'с 30 уровня: 15% → 60%')]) +
    tb('📊 Арена: шанс победы при силе ×1.0 / ×1.2', [row('Уровень 1', '72% / 100%', '64% / 100%'), row('Уровень 25', '52% / 91%', '45% / 87%'), row('Уровень 50', '28% / 73%', '31% / 75%'), row('Уровень 75', '29% / 77%', '28% / 63%'), row('Уровень 100', '27% / 60%', '15% / 61%')]) +
    '<div class="muted" style="font-size:.74rem">С ульты вручную в удачный момент шанс выше: на 1–50 уровне +12…19%.</div>' +
    tb('🔶 Экономика', [row('Рост награды после 40 ур.', '×1.085 за уровень', '×1.03'), row('Награда арены, 100 ур.', '226 000', '≈ 9 900'), row('Повтор уровня', '×0.4, без лимита', '×0.15, 30 в день'), row('Утешение за поражение', '8%, без лимита', '2%, 10 в день'), row('Мини-игры / PvP / бесплатные', '100%', '40% / 50% / 50%'), row('Сундук Immortal / Arcana', '20 000 / 80 000', '≈ 2 / 3 дня дохода'), row('Кристаллы на руках', 'сколько было', 'не больше 20 000')]) +
    tb('🏆 Ранги', [row('Шаг ранга', '150–200 MMR', '1000 MMR, 5 ступеней'), row('Подбор', '±150…1000', '±1000, иначе бот 🤖 с рейтингом')]) +
    '<div class="wn-h">Новое</div><ul><li>🤝 Пати-боссы на двоих (Арена → под Рошаном)</li><li>🏯 Защита башен: кубки, арены, прокачка карт, Руны, сундуки, дорога кубков</li><li>🛒 12 новых предметов в лавке</li><li>🎯 Кнопка «Фокус» и роли героев в бою</li></ul>' +
    '</div>', '', { html: true });
}
function whenModalClosed(fn) { const t = setInterval(() => { if (!document.getElementById('modal').classList.contains('show')) { clearInterval(t); fn(); } }, 700); }
function checkWhatsNew() {
  const seen = lsGet('d2m_seen_ver', null);
  lsSet('d2m_seen_ver', APP_VERSION);
  if (seen && !/^2\.4/.test(seen) && /^2\.4/.test(APP_VERSION)) setTimeout(() => whenModalClosed(openWhatsNew24), 1500);
  else if (seen && seen !== APP_VERSION && CHANGELOG[0] && CHANGELOG[0].v === APP_VERSION) setTimeout(() => whenModalClosed(openChangelog), 1200);
  const v = document.getElementById('app-ver'); if (v) v.textContent = 'версия ' + APP_VERSION;
}

// ---------- удаление аккаунта и всех данных ----------
function openDeleteAccount() {
  showModal('🗑', 'Удалить аккаунт и данные', '<div style="text-align:left;font-size:.88rem"><p>Будут <b>безвозвратно</b> удалены: прогресс, предметы, кристаллы, строка в рейтинге, стак для PvP, ник, друзья, код восстановления, облачный аккаунт и всё на этом устройстве.</p>' +
    '<div class="field"><label>Для подтверждения введи свой ник: <b>' + esc(USER.nick) + '</b></label><input type="text" id="del-nick" autocomplete="off"></div>' +
    '<div class="field"><label>Пароль</label><input type="password" id="del-pass" autocomplete="current-password"></div><div class="auth-err" id="del-err"></div></div>', 'bad', { html: true, buttons: [
      { t: 'Удалить навсегда', c: 'red', f: deleteAccount }, { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
async function deleteAccount() {
  const err = document.getElementById('del-err'); err.style.color = '';
  if (document.getElementById('del-nick').value.trim() !== USER.nick) { err.textContent = 'Ник не совпадает'; return; }
  const pass = document.getElementById('del-pass').value, acc = lsGet(ACC_KEY, {})[USER.key];
  if (!acc || await hashPass(pass, acc.salt) !== acc.hash) { err.textContent = 'Неверный пароль'; return; }
  err.style.color = 'var(--muted)'; err.textContent = 'Удаляю…';
  const c = cloud();
  if (c) {
    try {
      const email = c.email || await resolveEmail(USER.key);
      const fresh = await fbAuth('signInWithPassword', email, pass);
      storeCloud(USER.key, fresh);
      const uid = fresh.uid, k = dbKey(USER.key);
      const recov = await db('GET', 'recovIdx/' + uid).catch(() => null);
      const friends = await db('GET', 'friends/' + uid).catch(() => null);
      const upd = { ['saves/' + uid]: null, ['board/' + uid]: null, ['stacks/' + uid]: null, ['time/' + uid]: null, ['gifts/' + uid]: null,
        ['giftmeta/' + uid]: null, ['giftlog/' + uid]: null, ['recovIdx/' + uid]: null, ['friends/' + uid]: null, ['reportmeta/' + uid]: null };
      if (recov) upd['recov/' + recov] = null;
      const owner = await nickOwner(USER.key);
      if (owner === uid) { upd['nicks/' + k] = null; upd['login/' + k] = null; }
      await dbMulti(upd);
    } catch (e) { err.style.color = ''; err.textContent = 'Не удалось удалить облачные данные: ' + e.message + '. Ничего не удалено — попробуй ещё раз.'; return; }
    // сам облачный аккаунт (данные уже удалены — даже если вход не удалится, в нём ничего нет)
    try { await fetch('https://identitytoolkit.googleapis.com/v1/accounts:delete?key=' + FB.apiKey, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken: (lsGet(CLOUD_KEY, {})[USER.key] || {}).id }) }); } catch (e) { }
  }
  // локальные данные
  const k = USER.key;
  const accs = lsGet(ACC_KEY, {}); delete accs[k]; lsSet(ACC_KEY, accs);
  const cl = lsGet(CLOUD_KEY, {}); delete cl[k]; lsSet(CLOUD_KEY, cl);
  lsDel(saveKey(k)); lsDel(SES_KEY);
  USER = null; S = null; closeModal(); showAuth();
  showModal('🗑', 'Аккаунт удалён', 'Все данные этого аккаунта удалены. Спасибо, что играл!', '');
}

// ---------- аналитика без персональных данных ----------
// Только обезличенные счётчики по дням: stats/<дата>/<событие> += 1. Никаких ников, uid, устройств.
const STAT_EVENTS = ['start', 'register', 'tutorial_done', 'onb_done', 'arena_10', 'arena_25', 'arena_50', 'arena_75', 'arena_100', 'pvp', 'season_claim', 'weekly_done', 'share', 'bug_report'];
function statEvent(ev, oncePerDay) {
  try {
    if (window.SIM_MODE || !fbOn() || !STAT_EVENTS.includes(ev) || (typeof LIVE !== 'undefined' && LIVE.cfg.analytics === false)) return;
    const day = todayStr(), mark = 'd2m_stat_' + ev;
    if (oncePerDay) { if (localStorage.getItem(mark) === day) return; localStorage.setItem(mark, day); }
    db('PATCH', '', { ['stats/' + day + '/' + ev]: { '.sv': { increment: 1 } } }, true).catch(() => { });
  } catch (e) { }
}
(function hookAccount() {
  const _reg = authSubmit;
  authSubmit = async function (e) { const was = authModeCur; await _reg(e); if (was === 'register' && USER) statEvent('register'); };
  const _track = track;
  track = function (k, n) { _track(k, n); if (k === 'pvp') statEvent('pvp'); };
  // вехи арены: проверяем при каждом сохранении (уровень записывается после победы)
  const _save = save;
  save = function () {
    _save();
    if (!S || !S.arena) return;
    const done = S.statArena || 0;
    [10, 25, 50, 75, 100, 150, 200].forEach(m => { if (done < m && S.arena.cleared >= m) { S.statArena = m; if (S.arena.cleared - m < 3) statEvent('arena_' + m); } });
  };
  const _claimSeason = claimSeason; claimSeason = function () { _claimSeason(); statEvent('season_claim'); };
  const _start = startGame;
  startGame = function () { _start(); statEvent('start', true); checkWhatsNew(); };
  const _tut = showTutStep;
  showTutStep = function () { _tut(); if (tutStep < 0 || tutStep >= TUTORIAL.length) statEvent('tutorial_done', true); };
  const _onb = claimOnb;
  claimOnb = function (id) { _onb(id); if (S.onb && S.onb.done) statEvent('onb_done', true); };
})();
