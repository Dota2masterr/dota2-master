// ================= СООБЩЕСТВО: фильтр ников, жалобы, друзья, «пригласи друга» =================

// ---------- фильтр ников ----------
// Нормализуем «хитрые» написания: латиница-двойники → кириллица, цифры → буквы, убираем разделители.
const NICK_MAP = { i: 'и', a: 'а', b: 'в', c: 'с', e: 'е', h: 'н', k: 'к', m: 'м', o: 'о', p: 'р', t: 'т', x: 'х', y: 'у', u: 'и', '0': 'о', '3': 'з', '4': 'ч', '6': 'б', '@': 'а', 'ё': 'е' };
const NICK_BAD_RU = ['хуй', 'хуе', 'хуя', 'хуи', 'пизд', 'пезд', 'ебат', 'ебан', 'ебал', 'еблан', 'ебло', 'уеб', 'выеб', 'заеб', 'наеб', 'бляд', 'бля', 'сука', 'суки', 'сучк', 'мудак', 'мудил', 'пидор', 'пидр', 'педик', 'гандон', 'гондон', 'шлюх', 'залуп', 'дроч', 'манда', 'хер', 'жопа', 'даун', 'дебил', 'чмо', 'нацист', 'гитлер', 'зиг'];
const NICK_BAD_EN = ['fuck', 'fuk', 'shit', 'bitch', 'cunt', 'nigg', 'niga', 'fag', 'dick', 'cock', 'whore', 'slut', 'rape', 'nazi', 'hitler', 'porn', 'sex'];
const NICK_RESERVED = ['admin', 'админ', 'moder', 'модер', 'support', 'поддержк', 'administr', 'администр', 'valve', 'вальв', 'developer', 'разработч', 'official', 'официал', 'claude', 'anthropic', 'system', 'систем', 'gm', 'гм'];
function nickNorm(n, toCyr) {
  let s = String(n).toLowerCase().replace(/[\s_.\-]+/g, '');
  s = s.replace(/1/g, 'i').replace(/\$/g, 's');
  return toCyr ? [...s].map(ch => NICK_MAP[ch] || ch).join('') : s.replace(/0/g, 'o').replace(/3/g, 'e').replace(/4/g, 'a').replace(/@/g, 'a').replace(/5/g, 's');
}
// возвращает текст проблемы или '' если ник нормальный
function nickProblem(n) {
  n = String(n || '').trim();
  if (!validNick(n)) return 'Ник: 3–20 символов — буквы, цифры, пробел, _ - .';
  if (/(.)\1{4,}/.test(n)) return 'Слишком много одинаковых символов подряд';
  const cyr = nickNorm(n, true), lat = nickNorm(n, false);
  if (NICK_BAD_RU.some(w => cyr.includes(w)) || NICK_BAD_EN.some(w => lat.includes(w))) return 'Такой ник нельзя: в нём грубое слово';
  const plain = n.toLowerCase().replace(/[\s_.\-]+/g, '');
  if (NICK_RESERVED.some(w => (w.length <= 2 ? plain === w : plain.includes(w) || lat.includes(w)))) return 'Такой ник нельзя: похоже на администрацию или разработчиков';
  return '';
}

// ---------- жалобы ----------
const REPORT_REASONS = ['Оскорбительный ник', 'Читы / нечестный рейтинг', 'Спам подарками', 'Другое'];
function openReport(uid, nick) {
  if (!cloud()) return;
  showModal('⚑', 'Пожаловаться на ' + nick, '<div style="text-align:left"><div class="field"><label>Причина</label><select id="rp-reason">' + REPORT_REASONS.map(r => '<option>' + r + '</option>').join('') + '</select></div>' +
    '<div class="field"><label>Комментарий (необязательно)</label><input type="text" id="rp-text" maxlength="200"></div><div class="auth-err" id="rp-err"></div></div>', '', { html: true, buttons: [
      { t: 'Отправить', c: 'red', f: () => sendReport({ kind: 'player', target: uid, targetNick: nick, reason: document.getElementById('rp-reason').value, text: document.getElementById('rp-text').value }) },
      { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
async function sendReport(r) {
  const c = cloud(), err = document.getElementById('rp-err') || document.getElementById('bug-err');
  try {
    const m = await db('GET', 'reportmeta/' + c.uid).catch(() => null);
    if (m && nowMs() - m.last < 60000) throw new Error('не чаще раза в минуту');
    const id = Date.now().toString(36) + randId(8);
    const rep = { kind: r.kind, from: c.uid, fromNick: USER.nick, reason: String(r.reason || '').slice(0, 60), text: String(r.text || '').slice(0, r.kind === 'bug' ? 3500 : 300), at: SV_TIME };
    if (r.target) { rep.target = r.target; rep.targetNick = String(r.targetNick || '').slice(0, 20); }
    await dbMulti({ ['reports/' + id]: rep, ['reportmeta/' + c.uid]: { last: SV_TIME } });
    closeModal(); toast(r.kind === 'bug' ? '🐞 Отчёт отправлен' : '⚑ Жалоба отправлена', 'Спасибо! Модератор посмотрит.');
    return true;
  } catch (e) { if (err) err.textContent = 'Не отправлено: ' + e.message; return false; }
}

// ---------- друзья ----------
// friends/<мой uid>/<uid друга> = { nick, at }. Подарки — только ВЗАИМНЫМ друзьям (проверяют и правила базы).
let FRIENDS = null;
async function loadFriends() {
  const c = cloud(); if (!c) return {};
  FRIENDS = await db('GET', 'friends/' + c.uid).catch(() => null) || {};
  // взаимность: добавил ли друг меня
  await Promise.all(Object.keys(FRIENDS).map(async f => {
    FRIENDS[f].mutual = !!(await db('GET', 'friends/' + f + '/' + c.uid).catch(() => null));
    // 2.8: аватар и титул друга — из таблицы лидеров
    const bd = await db('GET', 'board/' + f).catch(() => null);
    if (isObj(bd)) { FRIENDS[f].ava = bd.ava; FRIENDS[f].title = bd.title; FRIENDS[f].arena = bd.arena; FRIENDS[f].mmr = bd.mmr; }
  }));
  return FRIENDS;
}
async function addFriend() {
  const inp = document.getElementById('fr-nick'), err = document.getElementById('fr-err'), c = cloud();
  const nick = inp.value.trim(); err.style.color = ''; err.textContent = '';
  const uid = await nickOwner(nickKey(nick));
  if (!uid) { err.textContent = 'Игрок не найден (он должен хоть раз войти онлайн)'; return; }
  if (uid === c.uid) { err.textContent = 'Это ты :)'; return; }
  if (Object.keys(FRIENDS || {}).length >= 100) { err.textContent = 'Не больше 100 друзей'; return; }
  try { await db('PUT', 'friends/' + c.uid + '/' + uid, { nick: nick.slice(0, 20), at: SV_TIME }); inp.value = ''; await loadFriends(); renderFriends(); toast('👥 Друг добавлен', nick + ' — попроси добавить тебя в ответ, чтобы обмениваться подарками'); }
  catch (e) { err.textContent = 'Ошибка: ' + e.message; }
}
async function removeFriend(uid) { const c = cloud(); await db('DELETE', 'friends/' + c.uid + '/' + uid).catch(() => {}); await loadFriends(); renderFriends(); }
function giftToFriend(nick) { const g = document.getElementById('gift-nick'); if (g) { g.value = nick; g.scrollIntoView({ behavior: 'smooth', block: 'center' }); g.focus(); } }
// дружеская дуэль: стак друга без MMR и без награды
async function duelFriend(uid) {
  const v = cleanStack(await db('GET', 'stacks/' + uid).catch(() => null));
  if (!v) return showModal('⚔', 'Нет стака', 'Друг ещё не сохранял стак онлайн.', '');
  const sum = v.team.reduce((a, t) => a + t.p, 0);
  const def = { L: 0, loc: pick(LOCS), waves: v.team.map((t, i) => ({ id: t.id, power: Math.round(t.p * v.tm.atk), boss: i === 0, name: (i === 0 ? '👑 ' : '') + HERO_BY_ID[t.id].name + ' (' + v.nick + ')' })), R: sum, reward: 0, back: 'online', pvp: { uid, nick: v.nick, mmr: v.mmr, bot: true, duel: true, power: sum } };
  def.K = 1.5 / v.team.reduce((a, t) => a + Math.pow(t.p / sum, 2), 0);
  switchTab('arena'); startBattle(0, false, def);
}
function friendsHTML() {
  return '<div class="sec-title">Друзья</div><div class="panel panel-b"><div style="display:flex;gap:6px;flex-wrap:wrap"><input type="text" id="fr-nick" placeholder="Ник друга" maxlength="20" style="flex:1;min-width:150px"><button class="btn gold" data-click="addFriend()">Добавить</button></div><div class="auth-err" id="fr-err"></div><div id="fr-list" class="muted" style="margin-top:8px">Загрузка…</div>' +
    '<div class="muted" style="font-size:.75rem;margin-top:6px">Подарки — только взаимным друзьям (вы добавили друг друга). Дуэль с другом — без рейтинга и наград.</div></div>' + referralHTML();
}
function renderFriends() {
  const box = document.getElementById('fr-list'); if (!box) return;
  const list = Object.entries(FRIENDS || {});
  box.innerHTML = list.length ? list.map(([uid, f]) => '<div class="fr-row"><span class="fr-who">' + avaHTML(f.ava) + (f.mutual ? '🤝' : '⏳') + ' <b>' + esc(String(f.nick || '?')) + '</b>' + titleHTML(f.title) + (f.mmr != null ? ' <span class="muted" style="font-size:.72rem">' + (+f.mmr || 0) + ' MMR · арена ' + (+f.arena || 0) + '</span>' : '') + (f.mutual ? '' : ' <span class="muted" style="font-size:.75rem">ждёт взаимности</span>') + '</span><span>' +
    '<button class="btn sm" data-click="duelFriend(\'' + uid + '\')" aria-label="Дуэль">⚔ Дуэль</button> ' + (f.mutual ? '<button class="btn sm gold" data-click="giftToFriend(\'' + esc(String(f.nick || '')).replace(/'/g, '') + '\')">🎁</button> ' : '') +
    '<button class="btn sm ghost" data-click="removeFriend(\'' + uid + '\')" aria-label="Удалить из друзей">✕</button></span></div>').join('') : 'Пока никого. Добавь друга по нику.';
}

// ---------- пригласи друга ----------
// Ссылка ?ref=<ник>. Награда обоим, когда приглашённый пройдёт 10-й уровень арены (защита от твинков:
// правила базы проверяют арену ≥ 10 в рейтинге, у каждого аккаунта может быть только один пригласивший).
(function captureRef() { try { const r = new URLSearchParams(location.search).get('ref'); if (r && validNick(r)) localStorage.setItem('d2m_ref', r.trim()); } catch (e) { } })();
function inviteLink() { return location.origin + location.pathname.replace(/[^/]*$/, '') + '?ref=' + encodeURIComponent(USER.nick); }
function referralHTML() {
  const S2 = S.ref || {};
  return '<div class="sec-title">Пригласи друга</div><div class="panel panel-b"><div style="font-size:.88rem">Друг заходит по твоей ссылке → проходит <b>10-й уровень арены</b> → вы оба получаете награду: тебе ' + gemHTML(Math.round(rewardScale() * CONFIG.social.refMul)) + ' + <b style="color:' + RARITY_COLOR.immortal + '">Immortal</b>, другу ' + gemHTML(Math.round(rewardScale() * CONFIG.social.refFriendMul)) + '.</div>' +
    '<div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap"><input type="text" readonly value="' + esc(inviteLink()) + '" id="ref-link" style="flex:1;min-width:180px"><button class="btn gold" data-click="shareInvite()">📤 Поделиться</button></div>' +
    '<div class="muted" style="font-size:.75rem;margin-top:6px">Приглашено с наградой: ' + (S2.claimed || 0) + '/' + CONFIG.social.refMax + '</div></div>';
}
function shareInvite() {
  const url = inviteLink(), text = 'Залетай в Dota 2 Master — фан-игру по Доте прямо в браузере!';
  if (navigator.share) navigator.share({ title: 'Dota 2 Master', text, url }).catch(() => {});
  else { try { navigator.clipboard.writeText(url).then(() => toast('🔗 Ссылка скопирована', url)); } catch (e) { document.getElementById('ref-link').select(); } }
}
// у приглашённого: при регистрации запоминаем, кто пригласил; на арене 10 — сообщаем в базу
async function referralTick() {
  const c = cloud(); if (!c || !S) return;
  S.ref = S.ref || {};
  if (!S.ref.by && !S.ref.byDone) { const r = localStorage.getItem('d2m_ref'); if (r && nickKey(r) !== USER.key && (S.created || 0) > Date.now() - 864e5 * 2) S.ref.by = r; else S.ref.byDone = true; }
  if (S.ref.by && !S.ref.byDone && S.arena.cleared >= 10) {
    try {
      const refUid = await nickOwner(nickKey(S.ref.by));
      if (refUid && refUid !== c.uid) {
        await savePush();                                    // рейтинг с ареной ≥ 10 должен быть в базе
        await dbMulti({ ['refBy/' + c.uid]: refUid, ['refs/' + refUid + '/' + c.uid]: { nick: USER.nick, at: SV_TIME, claimed: false } });
        addGems(Math.round(rewardScale() * CONFIG.social.refFriendMul));
        toast('🎉 Бонус приглашения', 'Ты прошёл 10-й уровень — награда тебе и ' + S.ref.by);
      }
    } catch (e) { }
    S.ref.byDone = true; save();
  }
  // у пригласившего: забрать награды за друзей
  try {
    const refs = await db('GET', 'refs/' + c.uid).catch(() => null) || {};
    for (const [fuid, r] of Object.entries(refs)) {
      if (!isObj(r) || r.claimed || (S.ref.claimed || 0) >= CONFIG.social.refMax) continue;
      await db('PUT', 'refs/' + c.uid + '/' + fuid + '/claimed', true);
      S.ref.claimed = (S.ref.claimed || 0) + 1;
      addGems(Math.round(rewardScale() * CONFIG.social.refMul)); const it = addEquipment(mainHeroId(), 'immortal');
      save(); toast('🎉 Друг ' + String(r.nick || '').slice(0, 20) + ' прошёл 10-й уровень', '+' + fmt(Math.round(rewardScale() * CONFIG.social.refMul)) + ' 🔶 и ' + it.name);
    }
  } catch (e) { }
}
setInterval(() => { if (USER && cloud()) referralTick(); }, 5 * 60000);

(function hookSocial() {
  // фильтр ников: регистрация и смена ника
  const _auth = authSubmit;
  authSubmit = async function (e) {
    if (authModeCur === 'register') { const p = nickProblem(document.getElementById('auth-nick').value); if (p) { if (e && e.preventDefault) e.preventDefault(); document.getElementById('auth-err').textContent = p; return; } }
    return _auth(e);
  };
  const _prof = saveProfile;
  saveProfile = async function () {
    const nick = document.getElementById('pf-nick').value.trim();
    if (nickKey(nick) !== USER.key) { const p = nickProblem(nick); if (p) { document.getElementById('pf-err').textContent = p; return; } }
    return _prof();
  };
  // онлайн-вкладка: друзья и приглашения
  const _ro = renderOnline;
  renderOnline = async function (force) {
    const p = _ro(force);
    const grid = document.querySelector('#online-host .online-grid');
    if (grid && !document.getElementById('fr-list')) { grid.insertAdjacentHTML('afterend', friendsHTML()); loadFriends().then(renderFriends); }
    return p;
  };
  // подарок: только взаимным друзьям
  const _gift = sendGift;
  sendGift = async function () {
    const err = document.getElementById('gift-err'), nick = document.getElementById('gift-nick').value.trim();
    if (!FRIENDS) await loadFriends();
    const f = Object.entries(FRIENDS || {}).find(([, v]) => nickKey(String(v.nick || '')) === nickKey(nick));
    if (!f) { err.textContent = 'Подарки — только друзьям: добавь ' + (nick || 'игрока') + ' в друзья, и пусть он добавит тебя'; return; }
    if (!f[1].mutual) { err.textContent = nick + ' ещё не добавил тебя в друзья — подарок станет доступен после этого'; return; }
    return _gift();
  };
  // дуэль: без MMR и наград
  const _pr = pvpResult;
  pvpResult = function (def, result) {
    if (def.pvp && def.pvp.duel) return 'Дуэль с ' + def.pvp.nick + ': ' + (result.win ? 'ПОБЕДА' : 'поражение') + ' · дружеский бой без рейтинга';
    return _pr(def, result);
  };
  const _start = startGame; startGame = function () { _start(); if (typeof cloud === 'function' && cloud()) setTimeout(referralTick, 4000); };
})();
