// ================= АККАУНТ: удаление, «Что нового», аналитика без персональных данных =================

// ---------- «Что нового» ----------
function openChangelog() {
  showModal('📜', 'Что нового', '<div style="text-align:left;max-height:60vh;overflow:auto;font-size:.88rem">' + CHANGELOG.slice(0, 4).map(c =>
    '<div style="margin-bottom:10px"><b style="color:var(--gold2)">Версия ' + esc(c.v) + '</b> <span class="muted">· ' + esc(c.date) + '</span><ul style="margin:4px 0 0 18px">' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('') +
    '<a href="roadmap.html" target="_blank" rel="noopener">Роадмап и вся история →</a></div>', '', { html: true });
}
function checkWhatsNew() {
  const seen = lsGet('d2m_seen_ver', null);
  lsSet('d2m_seen_ver', APP_VERSION);
  if (seen && seen !== APP_VERSION && CHANGELOG[0] && CHANGELOG[0].v === APP_VERSION) setTimeout(openChangelog, 1200);
  const v = document.getElementById('app-ver'); if (v) v.textContent = 'версия ' + APP_VERSION;
}

// ---------- удаление аккаунта и всех данных ----------
function openDeleteAccount() {
  showModal('🗑', 'Удалить аккаунт и данные', '<div style="text-align:left;font-size:.88rem"><p>Будут <b>безвозвратно</b> удалены: прогресс, предметы, самоцветы, строка в рейтинге, стак для PvP, ник, друзья, код восстановления, облачный аккаунт и всё на этом устройстве.</p>' +
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
    [10, 25, 50, 75, 100].forEach(m => { if (done < m && S.arena.cleared >= m) { S.statArena = m; if (S.arena.cleared - m < 3) statEvent('arena_' + m); } });
  };
  const _claimSeason = claimSeason; claimSeason = function () { _claimSeason(); statEvent('season_claim'); };
  const _start = startGame;
  startGame = function () { _start(); statEvent('start', true); checkWhatsNew(); };
  const _tut = showTutStep;
  showTutStep = function () { _tut(); if (tutStep < 0 || tutStep >= TUTORIAL.length) statEvent('tutorial_done', true); };
  const _onb = claimOnb;
  claimOnb = function (id) { _onb(id); if (S.onb && S.onb.done) statEvent('onb_done', true); };
})();
