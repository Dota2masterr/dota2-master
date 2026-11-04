// ================= АДМИНКА =================
// Работает только если uid администратора записан в базе: admins/<uid> = true (вручную в консоли Firebase).
const FB = Object.assign({ apiKey: 'AIzaSyB6ZBeX-OYMukmfN_QpqF0PH40rHRBW1SY', dbUrl: 'https://dota2-master-default-rtdb.europe-west1.firebasedatabase.app' }, JSON.parse(localStorage.getItem('d2m_fb') || '{}'));
const SV = { '.sv': 'timestamp' };
let A = null;   // { uid, id }
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const nickKey = n => n.trim().toLowerCase();
const dbKey = k => encodeURIComponent(k.replace(/\./g, ','));
function nickEmail(n) { let h = ''; for (const ch of unescape(encodeURIComponent(nickKey(n)))) h += ch.charCodeAt(0).toString(16).padStart(2, '0'); return 'p' + h + '@dota2master.game'; }
const say = (el, t, bad) => { $(el).className = 'log' + (bad ? ' err' : ''); $(el).textContent = t; };
async function db(method, path, body, params) {
  const qs = A ? ['auth=' + A.id] : [];
  for (const k in (params || {})) qs.push(k + '=' + encodeURIComponent(JSON.stringify(params[k])));
  const r = await fetch(FB.dbUrl.replace(/\/$/, '') + '/' + path + '.json?' + qs.join('&'), { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status === 401 ? 'нет доступа (правила)' : 'ошибка ' + r.status);
  return r.json();
}
const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 10);

$('a-go').onclick = async () => {
  try {
    say('a-msg', 'Вхожу…');
    const nick = $('a-nick').value, al = await fetch(FB.dbUrl + '/login/' + dbKey(nickKey(nick)) + '.json').then(r => r.json()).catch(() => null);
    const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB.apiKey, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: (al && al.email) || nickEmail(nick), password: $('a-pass').value, returnSecureToken: true }) });
    const j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || 'вход не удался');
    A = { uid: j.localId, id: j.idToken };
    const isAdmin = await db('GET', 'admins/' + A.uid).catch(() => null);
    if (!isAdmin) { say('a-msg', 'Вход выполнен, но прав администратора нет. Твой uid: ' + A.uid + ' — добавь его в консоли Firebase: Realtime Database → Данные → узел admins → ключ ' + A.uid + ', значение true.', true); return; }
    $('login').classList.add('hide'); $('panel').classList.remove('hide'); loadConfig();
  } catch (e) { say('a-msg', e.message, true); }
};

// ---------- игрок ----------
let P = null;
$('p-find').onclick = async () => {
  try {
    $('p-acts').classList.add('hide'); $('p-json').classList.add('hide');
    const k = nickKey($('p-nick').value), uid = await db('GET', 'nicks/' + dbKey(k));
    if (!uid) { $('p-info').innerHTML = '<p class="err">Ник не найден</p>'; return; }
    const [sv, bd, ban] = await Promise.all([db('GET', 'saves/' + uid).catch(() => null), db('GET', 'board/' + uid).catch(() => null), db('GET', 'banned/' + uid).catch(() => null)]);
    P = { uid, k, nick: $('p-nick').value.trim(), save: sv };
    const st = sv && sv.state || {};
    $('p-info').innerHTML = '<table><tr><td>uid</td><td>' + esc(uid) + '</td></tr><tr><td>Кристаллы</td><td>' + esc((st.gems || 0).toLocaleString('ru-RU')) + '</td></tr><tr><td>Арена</td><td>' + esc(st.arena && st.arena.cleared) + '/200</td></tr><tr><td>Предметов</td><td>' + esc(st.items && st.items.length) + '</td></tr><tr><td>MMR</td><td>' + esc(st.pvp && st.pvp.mmr) + '</td></tr><tr><td>Версия сейва</td><td>' + esc(st.version || st.v) + '</td></tr><tr><td>Сохранён</td><td>' + (sv ? new Date(sv.at).toLocaleString('ru-RU') : '—') + '</td></tr><tr><td>В рейтинге</td><td>' + (bd ? 'да' : 'нет') + '</td></tr><tr><td>Бан</td><td>' + (ban ? '⛔ ' + esc(ban.reason || '') : 'нет') + '</td></tr></table>';
    $('p-acts').classList.remove('hide');
  } catch (e) { say('p-log', e.message, true); }
};
$('p-gift').onclick = async () => {
  const n = Math.trunc(+$('p-amount').value); if (!n) return say('p-log', 'Укажи сумму (минус — забрать)', true);
  try { await db('PUT', 'gifts/' + P.uid + '/' + rid(), { fromUid: 'admin', from: 'Администрация', kind: 'admin', amount: n, note: $('p-note').value.slice(0, 120), at: SV }); say('p-log', 'Готово: ' + n + ' 🔶 придут игроку при следующем входе (или в течение 2 минут)'); }
  catch (e) { say('p-log', e.message, true); }
};
$('p-ban').onclick = async () => {
  if (!confirm('Забанить ' + P.nick + '? Он пропадёт из рейтинга и PvP.')) return;
  try { const u = {}; u['banned/' + P.uid] = { reason: $('p-reason').value.slice(0, 200), at: SV }; u['board/' + P.uid] = null; u['stacks/' + P.uid] = null; await db('PATCH', '', u); say('p-log', 'Забанен: убран из рейтинга и PvP'); }
  catch (e) { say('p-log', e.message, true); }
};
$('p-unban').onclick = async () => { try { await db('DELETE', 'banned/' + P.uid); say('p-log', 'Бан снят. В рейтинге появится после следующего сохранения игрока.'); } catch (e) { say('p-log', e.message, true); } };
$('p-resetnick').onclick = async () => {
  if (!confirm('Запретить ник «' + P.nick + '» навсегда? Игрок должен будет выбрать новый.')) return;
  try { const u = {}; u['nicks/' + P.k.replace(/\./g, ',')] = null; u['bannedNicks/' + P.k.replace(/\./g, ',')] = true; u['board/' + P.uid] = null; await db('PATCH', '', u); say('p-log', 'Ник запрещён. Игрок увидит просьбу сменить ник.'); }
  catch (e) { say('p-log', e.message, true); }
};
$('p-save').onclick = () => { $('p-json').textContent = JSON.stringify(P.save, null, 1); $('p-json').classList.remove('hide'); };

// ---------- подарок всем ----------
$('b-send').onclick = async () => {
  const n = Math.trunc(+$('b-amount').value); if (!(n > 0)) return say('b-log', 'Укажи положительную сумму', true);
  if (!confirm('Разослать ' + n + ' 🔶 всем игрокам из рейтинга?')) return;
  try {
    const uids = Object.keys(await db('GET', 'board', undefined, { shallow: true }) || {});
    for (let i = 0; i < uids.length; i += 100) {
      const u = {}; uids.slice(i, i + 100).forEach(x => { u['gifts/' + x + '/' + rid()] = { fromUid: 'admin', from: 'Администрация', kind: 'admin', amount: n, note: $('b-note').value.slice(0, 120), at: SV }; });
      await db('PATCH', '', u); say('b-log', 'Отправлено ' + Math.min(uids.length, i + 100) + ' из ' + uids.length);
    }
  } catch (e) { say('b-log', e.message, true); }
};

// ---------- config/ ----------
async function loadConfig() {
  try {
    const c = await db('GET', 'config') || {};
    $('c-maint').checked = !!(c.maintenance && c.maintenance.on); $('c-maint-text').value = (c.maintenance && c.maintenance.text) || '';
    $('c-ann').value = (c.announce && c.announce.text) || '';
    ['pvp', 'gifts', 'slots', 'chests'].forEach(k => $('c-k-' + k).checked = !!(c.kill && c.kill[k]));
    $('c-e-newyear').checked = !(c.events && c.events.newyear === false); $('c-e-halloween').checked = !!(c.events && c.events.halloween);
    $('c-analytics').checked = c.analytics !== false;
    $('c-bal').value = c.balance ? JSON.stringify(c.balance) : '';
    say('c-log', 'Загружено');
  } catch (e) { say('c-log', e.message, true); }
}
$('c-load').onclick = loadConfig;
$('c-save').onclick = async () => {
  let bal = null; try { bal = $('c-bal').value.trim() ? JSON.parse($('c-bal').value) : null; } catch (e) { return say('c-log', 'В JSON баланса ошибка', true); }
  const ann = $('c-ann').value.trim();
  const cfg = { maintenance: { on: $('c-maint').checked, text: $('c-maint-text').value.slice(0, 300) }, announce: ann ? { id: rid(), text: ann.slice(0, 300) } : null,
    kill: { pvp: $('c-k-pvp').checked, gifts: $('c-k-gifts').checked, slots: $('c-k-slots').checked, chests: $('c-k-chests').checked },
    events: { newyear: $('c-e-newyear').checked, halloween: $('c-e-halloween').checked }, analytics: $('c-analytics').checked, balance: bal, at: SV };
  try { await db('PUT', 'config', cfg); say('c-log', 'Сохранено. Игроки получат изменения в течение 10 минут (или после перезапуска).'); } catch (e) { say('c-log', e.message, true); }
};

// ---------- чистка ----------
$('cl-run').onclick = async () => {
  const cut = Date.now() - 30 * 864e5;
  if (!confirm('Удалить стаки и строки рейтинга, не обновлявшиеся 30+ дней?')) return;
  try {
    let n = 0;
    for (const node of ['stacks', 'board']) {
      const old = await db('GET', node, undefined, { orderBy: 'at', endAt: cut, limitToFirst: 500 }) || {};
      const u = {}; Object.keys(old).forEach(k => { u[node + '/' + k] = null; n++; });
      if (Object.keys(u).length) await db('PATCH', '', u);
    }
    say('cl-log', 'Удалено записей: ' + n + ' (сейвы игроков не тронуты; при входе они вернутся в рейтинг)');
  } catch (e) { say('cl-log', e.message, true); }
};

// ---------- жалобы ----------
$('r-load').onclick = async () => {
  try {
    const r = await db('GET', 'reports', undefined, { orderBy: 'at', limitToLast: 100 }) || {};
    const rows = Object.entries(r).sort((a, b) => (b[1].at || 0) - (a[1].at || 0));
    $('r-list').innerHTML = rows.length ? rows.map(([id, x]) => '<div class="card"><b>' + (x.kind === 'bug' ? '🐞 Баг' : '⚑ Жалоба') + '</b> от ' + esc(x.fromNick) + (x.targetNick ? ' на <b>' + esc(x.targetNick) + '</b>' : '') + ' · ' + new Date(x.at).toLocaleString('ru-RU') + '<br>' + esc(x.reason) + '<pre>' + esc(x.text) + '</pre><button class="red" data-del="' + esc(id) + '">Удалить</button>' + (x.targetNick ? ' <button data-find="' + esc(x.targetNick) + '">Открыть игрока</button>' : '') + '</div>').join('') : '<p class="muted">Пусто</p>';
    $('r-list').querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await db('DELETE', 'reports/' + b.dataset.del); b.closest('.card').remove(); });
    $('r-list').querySelectorAll('[data-find]').forEach(b => b.onclick = () => { $('p-nick').value = b.dataset.find; $('p-find').click(); scrollTo(0, 0); });
  } catch (e) { $('r-list').innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
};

// ---------- статистика ----------
$('s-load').onclick = async () => {
  try {
    const st = await db('GET', 'stats', undefined, { orderBy: '$key', limitToLast: 14 }) || {};
    const evs = [...new Set(Object.values(st).flatMap(d => Object.keys(d)))].sort();
    $('s-list').innerHTML = '<div style="overflow:auto"><table><tr><th>День</th>' + evs.map(e => '<th>' + esc(e) + '</th>').join('') + '</tr>' + Object.keys(st).sort().reverse().map(d => '<tr><td>' + esc(d) + '</td>' + evs.map(e => '<td>' + (st[d][e] || '') + '</td>').join('') + '</tr>').join('') + '</table></div><p class="muted">start — уникальные запуски за день на устройство, register — регистрации, arena_N — дошли до уровня N, tutorial_done — прошли обучение.</p>';
  } catch (e) { $('s-list').innerHTML = '<p class="err">' + esc(e.message) + '</p>'; }
};
