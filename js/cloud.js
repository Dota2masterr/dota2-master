// ================= ОНЛАЙН (Firebase Auth + Realtime Database через REST) =================
// Схема базы и правила доступа — в файле database.rules.json (вставляется в консоль Firebase).
const FB_DEFAULT = { apiKey: 'AIzaSyB6ZBeX-OYMukmfN_QpqF0PH40rHRBW1SY', dbUrl: 'https://dota2-master-default-rtdb.europe-west1.firebasedatabase.app' };
let FB = Object.assign({}, FB_DEFAULT, lsGet('d2m_fb', {}));
function fbOn() { return !!(FB.apiKey && FB.dbUrl); }
const CLOUD_KEY = 'd2m_cloud';           // { [nickKey]: { uid, refresh, id, exp, email } }
const SV_TIME = { '.sv': 'timestamp' };  // «время сервера» — подставляет сам Firebase


function dbKey(k) { return k.replace(/\./g, ','); }   // точка запрещена в ключах Firebase
function enc(k) { return encodeURIComponent(dbKey(k)); }
function nickEmail(nick) {
  // ник → безопасный e-mail для Firebase Auth (кириллица кодируется)
  const k = nickKey(nick); let hex = '';
  for (const ch of unescape(encodeURIComponent(k))) hex += ch.charCodeAt(0).toString(16).padStart(2, '0');
  return 'p' + hex + '@dota2master.game';
}
function fbErr(j) { return new Error((j && j.error && j.error.message) || 'auth'); }
function tok(j, email) { return { uid: j.localId, id: j.idToken, refresh: j.refreshToken, exp: Date.now() + (+j.expiresIn - 60) * 1000, email: email || j.email }; }
async function fbAuth(kind, email, pass) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:' + kind + '?key=' + FB.apiKey, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password: pass, returnSecureToken: true }) });
  const j = await r.json(); if (!r.ok) throw fbErr(j);
  return tok(j, email);
}
// смена пароля в Firebase (нужен свежий idToken)
async function fbSetPassword(idToken, pass, email) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + FB.apiKey, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken, password: pass, returnSecureToken: true }) });
  const j = await r.json(); if (!r.ok) throw fbErr(j);
  return tok(j, email);
}
async function fbToken() {
  const c = lsGet(CLOUD_KEY, {})[USER.key]; if (!c) return null;
  if (c.exp > Date.now()) return c;
  const r = await fetch('https://securetoken.googleapis.com/v1/token?key=' + FB.apiKey, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(c.refresh) });
  const j = await r.json(); if (!r.ok) return null;
  Object.assign(c, { id: j.id_token, refresh: j.refresh_token, exp: Date.now() + (+j.expires_in - 60) * 1000 });
  const all = lsGet(CLOUD_KEY, {}); all[USER.key] = c; lsSet(CLOUD_KEY, all);
  return c;
}
// path — уже закодированный путь ('' = корень, для multi-path PATCH)
async function db(method, path, body, noAuth, params) {
  const base = FB.dbUrl.replace(/\/$/, '');
  const qs = [];
  if (!noAuth) { const t = await fbToken(); if (!t) throw new Error('no-cloud'); qs.push('auth=' + t.id); }
  // запросы по индексу: { orderBy: 'mmr', startAt: 900, endAt: 1100, limitToFirst: 20 } — значения кодируются как JSON
  for (const k in (params || {})) qs.push(k + '=' + encodeURIComponent(JSON.stringify(params[k])));
  const r = await fetch(base + '/' + path + '.json' + (qs.length ? '?' + qs.join('&') : ''), { method, headers: { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'доступ запрещён правилами' : 'db ' + r.status);
  return r.json();
}
// атомарная запись в несколько мест: либо всё, либо ничего
function dbMulti(upd) { return db('PATCH', '', upd); }
function cloud() { return USER && lsGet(CLOUD_KEY, {})[USER.key]; }
function storeCloud(k, c) { const all = lsGet(CLOUD_KEY, {}); all[k] = c; lsSet(CLOUD_KEY, all); }
function randId(n) { const a = new Uint8Array(n || 16); crypto.getRandomValues(a); return Array.from(a, b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); }

// ---------- серверное время ----------
async function syncServerTime() {
  const c = cloud(); if (!c) return;
  const t0 = Date.now();
  const v = await db('PUT', 'time/' + c.uid, SV_TIME);
  const t1 = Date.now();
  if (typeof v === 'number') { SRV_OFF = Math.round(v - (t0 + t1) / 2); lsSet('d2m_srvoff', SRV_OFF); TIME_OK = true; }
}
setInterval(() => { if (USER && cloud()) syncServerTime().catch(() => {}); }, 10 * 60000);

// ---------- вход / регистрация в облаке ----------
async function resolveEmail(k) {
  try { const a = await db('GET', 'login/' + enc(k), undefined, true); if (a && a.email) return a.email; } catch (e) { }
  return nickEmail(k);
}
async function nickOwner(k) { try { return await db('GET', 'nicks/' + enc(k), undefined, true); } catch (e) { return null; } }
// вызывается из authSubmit: при регистрации — создаёт облачный аккаунт, при входе — входит
async function cloudAfterAuth(mode, nick, pass) {
  if (!fbOn() || pass.length < 6) return;
  const k = nickKey(nick);
  try {
    const saved = lsGet(CLOUD_KEY, {})[k];
    let email = (saved && saved.email) || await resolveEmail(k), c, isNew = false;
    try { c = await fbAuth('signInWithPassword', email, pass); }
    catch (e) {
      const owner = await nickOwner(k);
      if (owner) throw new Error('ник в онлайне занят другим игроком или облачный пароль другой. Если это твой аккаунт — восстанови его по коду');
      email = nickEmail(k);
      try { c = await fbAuth('signUp', email, pass); }
      catch (e2) { if (!/EMAIL_EXISTS/.test(e2.message)) throw e2; email = email.replace('@', '.' + randId(6) + '@'); c = await fbAuth('signUp', email, pass); }
      isNew = true;
    }
    storeCloud(k, c);
    const owner = await nickOwner(k);
    if (!owner) await dbMulti({ ['nicks/' + dbKey(k)]: c.uid, ['login/' + dbKey(k)]: { uid: c.uid, email } });
    else if (owner !== c.uid) toast('☁ Облако', 'Ник «' + nick + '» в онлайне занят — смени ник в профиле, чтобы попасть в рейтинг');
    await syncServerTime().catch(() => {});
    await cloudSync();
    toast('☁ Облако', 'Аккаунт синхронизирован');
    if (isNew) setTimeout(() => setupRecovery(pass, true).catch(e => console.warn('recov', e)), 800);
  } catch (e) { console.warn('cloud', e); toast('☁ Облако', 'Не удалось войти в облако: ' + e.message); }
}
// вход на новом устройстве: локального аккаунта нет, но есть облачный
async function cloudLoginNew(nick, pass) {
  if (!fbOn()) return false;
  const k = nickKey(nick);
  const email = await resolveEmail(k);
  const c = await fbAuth('signInWithPassword', email, pass);
  const accs = lsGet(ACC_KEY, {});
  const salt = newSalt();
  accs[k] = { nick, salt, hash: await hashPass(pass, salt), created: Date.now() };
  lsSet(ACC_KEY, accs); storeCloud(k, c);
  lsSet(saveKey(k), freshState());
  return true;
}

let updNoticeShown = false;
function needUpdateNotice() {
  if (updNoticeShown) return; updNoticeShown = true;
  showModal('⬆', 'Нужно обновить игру', 'Твой прогресс сохранён более новой версией игры (на другом устройстве). Обнови страницу, чтобы его не потерять.', 'bad', { buttons: [{ t: 'Обновить', c: 'green', f: () => location.reload() }] });
}
// старые игроки: закрепить ник в базе, если его там нет (без этого рейтинг не пропустят правила)
async function ensureNickClaim() {
  const c = cloud(); if (!c) return;
  const k = USER.key, owner = await nickOwner(k);
  if (!owner) {
    const email = c.email || await resolveEmail(k);
    await dbMulti({ ['nicks/' + dbKey(k)]: c.uid, ['login/' + dbKey(k)]: { uid: c.uid, email } });
  } else if (owner !== c.uid) toast('☁ Облако', 'Ник «' + USER.nick + '» в онлайне занят другим игроком — смени ник в профиле, чтобы попасть в рейтинг');
}

// ---------- синхронизация сейва (с защитой от конфликтов) ----------
// S.cloud = { at, h } — метка последней синхронизации и «отпечаток» сейва в тот момент
function stateHash(st) {
  const o = Object.assign({}, st); delete o.cloud; delete o.savedAt;
  const j = JSON.stringify(o); let h = 2166136261;
  for (let i = 0; i < j.length; i++) h = Math.imul(h ^ j.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36) + ':' + j.length;
}
function isDirty() { return !S.cloud || S.cloud.h !== stateHash(S); }
function isFreshState(st) { return !(st.items && st.items.length) && !(st.spins > 0) && !(st.arena && st.arena.cleared > 0); }
let cloudBusy = false, conflictOpen = false, pushTimer = null, pushTimes = [];
function schedulePush(delay) {
  if (!USER || !cloud()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => cloudPush(), delay == null ? CONFIG.cloud.debounceMs : delay);
}
function pushWait() { const t = Date.now(); pushTimes = pushTimes.filter(x => t - x < 60000); return pushTimes.length < CONFIG.cloud.perMinute ? 0 : 60000 - (t - pushTimes[0]) + 50; }
function applyRemote(st, at) {
  S = st; migrate(S); S.savedAt = at; S.cloud = { at, h: '' };
  startGame();
  S.cloud.h = stateHash(S);   // правки при запуске игры — не повод слать сейв обратно
  lsSet(saveKey(USER.key), S);
  toast('☁ Облако', 'Загружено сохранение из облака');
}
// Сверка с облаком. Возвращает 'same' | 'pulled' | 'pushed' | 'conflict' | 'busy'
async function cloudSync() {
  const c = cloud(); if (!c) return 'none';
  if (conflictOpen) return 'conflict';
  const rAt = await db('GET', 'saves/' + c.uid + '/at');
  const meta = S.cloud || {};
  if (rAt == null) return (await savePush()) ? 'pushed' : 'busy';
  if (meta.at && rAt === meta.at) return isDirty() ? ((await savePush()) ? 'pushed' : 'busy') : 'same';
  const remote = await db('GET', 'saves/' + c.uid);
  if (remote && remote.state && saveVersionOf(remote.state) > SAVE_VERSION) { needUpdateNotice(); return 'newer'; }
  const chk = remote && validateSave(remote.state);
  if (!chk || !chk.ok) { toast('☁ Облако', 'Сохранение в облаке повреждено — оставляю то, что на устройстве'); S.cloud = { at: rAt, h: '' }; return (await savePush()) ? 'pushed' : 'busy'; }
  if (stateHash(chk.st) === stateHash(S)) { S.cloud = { at: rAt, h: stateHash(S) }; save(); return 'same'; }
  if (!meta.at) {
    // первый запуск после обновления или новое устройство — старое правило «кто новее»
    if (isFreshState(S) || (remote.at || 0) > (S.savedAt || 0)) { applyRemote(chk.st, rAt); return 'pulled'; }
    S.cloud = { at: rAt, h: '' }; return (await savePush()) ? 'pushed' : 'busy';
  }
  if (!isDirty()) { applyRemote(chk.st, rAt); return 'pulled'; }
  askConflict(chk.st, rAt);
  return 'conflict';
}
function savePreview(st, at, title) {
  const lv = Object.values(st.heroes || {}).reduce((a, h) => a + (h.level || 1), 0);
  return '<div class="panel panel-b" style="flex:1;min-width:150px"><div class="cinzel" style="color:var(--gold2)">' + title + '</div>' +
    '<div class="muted" style="font-size:.75rem">' + (at ? new Date(at).toLocaleString('ru-RU') : '—') + '</div>' +
    '<div>⚔ Арена: <b>' + ((st.arena && st.arena.cleared) || 0) + '/' + ARENA_MAX + '</b></div><div>' + gemHTML(st.gems || 0) + '</div>' +
    '<div>🎨 Предметов: <b>' + ((st.items && st.items.length) || 0) + '</b></div><div>⬆ Сумма уровней: <b>' + lv + '</b></div></div>';
}
function askConflict(remoteSt, rAt) {
  conflictOpen = true;
  showModal('☁', 'Какой прогресс оставить?', '<div style="text-align:left;font-size:.85rem"><p style="margin-bottom:8px">Ты играл на двух устройствах, и прогресс разошёлся. Выбери, какой оставить — второй будет заменён.</p><div style="display:flex;gap:8px;flex-wrap:wrap">' +
    savePreview(S, S.savedAt, '📱 Это устройство') + savePreview(remoteSt, rAt, '☁ Облако') + '</div></div>', '', { html: true, buttons: [
      { t: 'Оставить это устройство', c: 'gold', f: () => { conflictOpen = false; closeModal(); S.cloud = { at: rAt, h: '' }; savePush(); } },
      { t: 'Взять из облака', c: 'green', f: () => { conflictOpen = false; closeModal(); applyRemote(remoteSt, rAt); } }] });
}
// запись сейва + рейтинга + стака. Сейв пишется отдельно, чтобы ошибка рейтинга его не блокировала.
async function savePush() {
  const c = cloud(); if (!c || cloudBusy || conflictOpen) return false;
  if (S._newer) { needUpdateNotice(); return false; }   // старая версия игры не перезапишет новый сейв
  const wait = pushWait(); if (wait) { schedulePush(wait); return false; }
  cloudBusy = true; pushTimes.push(Date.now());
  const prev = S.cloud;
  try {
    const at = Math.max(nowMs(), ((prev && prev.at) || 0) + 1);
    S.savedAt = at; S.cloud = { at, h: stateHash(S) };
    const json = JSON.stringify(S);
    if (json.length > SAVE_LIMITS.bytes) { S.cloud = prev; toast('☁ Облако', 'Сохранение слишком большое для облака — продай лишние предметы'); return false; }
    await db('PUT', 'saves/' + c.uid, { at, nick: USER.nick, state: S });
    lsSet(saveKey(USER.key), S);
    try { await dbMulti(publicRows(c)); } catch (e) { console.warn('board', e); }
    return true;
  } catch (e) { S.cloud = prev; console.warn('push', e); return false; }
  finally { cloudBusy = false; }
}
function publicRows(c) {
  const ct = currentTitle(), mmr = (S.pvp && S.pvp.mmr) || 0;
  const bt = buildTeam({ noCons: true });
  return {
    ['board/' + c.uid]: { nick: USER.nick, title: ct ? { name: String(ct.name).slice(0, 24), color: ct.color, icon: ct.icon || null } : null, ava: HERO_BY_ID[S.avatar] && /^[a-z_]{2,32}$/.test(S.avatar) ? S.avatar : null, arena: S.arena.cleared, stack: Math.round(stackPower()), inv: S.invBest || null, surv: invSurvBest() || null, mmr, items: S.items.length, at: SV_TIME },
    ['stacks/' + c.uid]: { nick: USER.nick, mmr, team: bt.team.map(t => ({ id: t.id, p: Math.round(t.p), mods: t.mods })), tm: bt.tm, at: SV_TIME }
  };
}
// публичная функция «сохранить в облако» (с учётом конфликтов и лимита)
async function cloudPush() {
  if (!USER || !cloud() || cloudBusy) return;
  try { await cloudSync(); } catch (e) { console.warn('sync', e); }
}
setInterval(() => { if (USER && cloud() && !conflictOpen && isDirty()) cloudPush(); }, 90000);

// ---------- PvP ----------
// 2.4: каждый ранг = 1000 MMR, внутри 5 ступеней по 200 (см. js/bots.js: rankName)
const RANKS = [['Herald', 0, '#8a7a5a'], ['Guardian', 1000, '#7a8a9a'], ['Crusader', 2000, '#4a9a6a'], ['Archon', 3000, '#3a8aca'], ['Legend', 4000, '#9a6aca'], ['Ancient', 5000, '#ca9a3a'], ['Divine', 6000, '#e8c77a'], ['Immortal', 7000, '#e0452f']];
function rankOf(mmr) { let r = RANKS[0]; RANKS.forEach(x => { if (mmr >= x[1]) r = x; }); return r; }
function ensurePvp() { S.pvp = S.pvp || { mmr: 0, w: 0, l: 0, day: '', fights: 0, reset: 1 }; if (S.pvp.reset !== 1) { S.pvp.mmr = 0; S.pvp.peak = 0; S.pvp.reset = 1; } if (isNewDay(S.pvp.day, todayStr())) { S.pvp.day = todayStr(); S.pvp.fights = 0; S.pvp.gain = 0; } if (typeof S.pvp.hist !== 'string') S.pvp.hist = ''; if (!isFinite(S.pvp.gain)) S.pvp.gain = 0; }
// 2.5: винрейт за последние N матчей (история — строка из 1/0, новые справа)
function pvpWinrate(n) { const h = (S.pvp.hist || '').slice(-(n || CONFIG.mmr.promoWindow)); return h.length ? (h.split('').filter(c => c === '1').length / h.length) : 0; }
// 2.5: изменение MMR. exp — ожидаемый шанс победы (Эло). Возвращает { delta, note }
function mmrDelta(win, exp, mmr, gainToday, hist) {
  hist = String(hist || '');
  const M = CONFIG.mmr, rk = RANKS.indexOf(rankOf(mmr));
  if (!win) return { delta: -Math.round((20 + 20 * exp) * M.lossMul * (M.lossByRank[rk] || 1)), note: '' };
  let d = (15 + 5 * (1 - exp)) * (M.winByRank[rk] || 1), note = '';
  // дневной лимит: после dailyCap прирост резко падает до завтра
  // кусочно: до dailyCap — полный прирост, до hardCap — ×afterCap, дальше — ×afterHard
  const seg = [[M.dailyCap, 1], [M.hardCap || 1e9, M.afterCap], [1e9, M.afterHard != null ? M.afterHard : M.afterCap]];
  let raw = d, g = gainToday, got = 0;
  for (const [lim, k] of seg) { if (raw <= 0) break; if (g >= lim) continue; const room = (lim - g) / k; const use = Math.min(raw, room); got += use * k; g += use * k; raw -= use; }
  if (got < d - 0.01) note = gainToday + got > (M.hardCap || 1e9) ? ' · сегодня набрано больше ' + M.hardCap + ' MMR — прирост ×' + M.afterHard + ' до завтра' : ' · дневной лимит MMR (' + M.dailyCap + ') — дальше прирост ×' + M.afterCap;
  d = got;
  d = Math.max(1, Math.round(d));
  // высокие ранги: повышение в следующий ранг — только при винрейте > 50% за последние 50 матчей
  if (rk >= M.promoFrom && rk < RANKS.length - 1) {
    const next = RANKS[rk + 1][1];
    if (mmr + d >= next) {
      const h = hist.slice(-M.promoWindow), games = h.length, wr = games ? h.split('').filter(c => c === '1').length / games : 0;
      if (games < M.promoMin || wr <= M.promoWr) { d = Math.max(0, next - 1 - mmr); note += ' · для повышения до ' + RANKS[rk + 1][0] + ' нужен винрейт выше 50% за последние ' + M.promoWindow + ' матчей (сейчас ' + Math.round(wr * 100) + '% за ' + games + ', минимум ' + M.promoMin + ' матчей)'; }
    }
  }
  return { delta: d, note };
}
// чужой стак из базы — только проверенные поля
function cleanStack(v) {
  if (!isObj(v) || !Array.isArray(v.team)) return null;
  const team = v.team.filter(t => isObj(t) && HERO_BY_ID[t.id] && isFinite(+t.p) && +t.p > 0).slice(0, 5).map(t => ({ id: t.id, p: Math.min(1e9, +t.p) }));
  if (!team.length) return null;
  const atk = num(v.tm && v.tm.atk, 0.5, 5, 1);
  return { nick: String(v.nick || '???').slice(0, 20), mmr: Math.round(num(v.mmr, 0, CONFIG.bots.mmrMax, 0)), team, tm: { atk } };
}
async function pvpFight() {
  ensurePvp();
  const c = cloud(); if (!c) return;
  // не качаем весь узел stacks: только 20 ближайших по MMR (индекс .indexOn mmr), окно расширяется, если пусто
  const fresh = Date.now() - CONFIG.cloud.staleStackDays * 864e5;
  let opps = [];
  for (const span of [150, 400, CONFIG.bots.window]) {
    const part = await db('GET', 'stacks', undefined, false, { orderBy: 'mmr', startAt: S.pvp.mmr - span, endAt: S.pvp.mmr + span, limitToFirst: 20 }) || {};
    opps = Object.entries(part).filter(([uid, v]) => uid !== c.uid && v && (v.at || 0) > Math.max(fresh, CONFIG.wipe.at) && !(LIVE.banned && LIVE.banned[uid])).map(([uid, v]) => [uid, cleanStack(v)]).filter(x => x[1]);
    if (opps.filter(x => pvpEligible(x[1])).length >= 3) break;
  }
  // защита новичков: только соперники сопоставимой силы и MMR в окне ±1000; иначе — рейтинговый бот из bots/
  const fair = opps.filter(x => pvpEligible(x[1]) && Math.abs(x[1].mmr - S.pvp.mmr) <= CONFIG.bots.window);
  fair.sort((a, b) => Math.abs(a[1].mmr - S.pvp.mmr) - Math.abs(b[1].mmr - S.pvp.mmr));
  let ouid, opp;
  // 2.8: подбор — не только люди: с шансом CONFIG.bots.mix (или если людей мало) соперником будет рейтинговый бот твоего MMR
  const useBot = !fair.length || Math.random() < (fair.length >= 3 ? CONFIG.bots.mix : CONFIG.bots.mixFew);
  if (!useBot) [ouid, opp] = pick(fair.slice(0, 5));
  else { try { opp = await pickBotOpponent(); ouid = opp.botId; } catch (e) { opp = pvpBot(); ouid = 'bot'; } }
  const sum = opp.team.reduce((a, t) => a + t.p, 0);
  const def = { L: 0, loc: pick(LOCS), waves: opp.team.map((t, i) => ({ id: t.id, power: Math.round(t.p * opp.tm.atk), boss: i === 0, name: (i === 0 ? '👑 ' : '') + HERO_BY_ID[t.id].name + ' (' + opp.nick + ')' })), R: sum, reward: 0, back: 'online', pvp: { uid: ouid, nick: opp.nick + (opp.tier ? ' · ' + opp.tier : ''), mmr: opp.mmr, ai: Math.max(opp.ai || 0, CONFIG.botMinTier[rankIdx(S.pvp.mmr)] || 0), bot: !!opp.bot && !opp.ranked, rbot: opp.ranked ? opp.botId : null, power: sum } };
  def.K = 1.5 / opp.team.reduce((a, t) => a + Math.pow(t.p / sum, 2), 0);
  switchTab('arena');
  startBattle(0, false, def);
}
// 2.4 античит: переиграть бой по сиду и логу действий — итог должен совпасть
function pvpVerify(def, result) {
  if (!BT || BT.seed == null || !BT.log) return true;
  try {
    const e = createBattle(BT.team, def, seeded(BT.seed), { maxTicks: 400, manualUlt: BT.man0 });
    for (const [t, inp, man, foc] of BT.log) { if (BT.log.skip != null && t >= BT.log.skip) break; e.setManual(man); e.setFocus(foc); e.step(inp.slice()); }
    if (!e.done) e.finish();
    return e.result().win === result.win;
  } catch (err) { return false; }
}
function pvpSuspicious(def, result) {
  const mine = BT ? BT.team.reduce((a, t) => a + t.p, 0) : stackPower();
  if (result.win && def.pvp.power > 0 && mine / def.pvp.power < 0.4) return 'невозможная сила';
  if (result.win && result.ticks && result.ticks.length < 3) return 'слишком быстрый бой';
  if (!pvpVerify(def, result)) return 'итог не совпал с переигровкой';
  return '';
}
async function pvpLog(def, result, bad) {
  try { const c = cloud(); if (!c || !BT) return; await db('POST', 'pvp_log/' + c.uid, { o: String(def.pvp.uid || 'bot').slice(0, 128), s: BT.seed >>> 0, n: Math.min(9999, (BT.log || []).length), w: !!result.win, p: Math.round(Math.min(1e12, BT.team.reduce((a, t) => a + t.p, 0))), q: Math.round(Math.min(1e12, def.pvp.power || 0)), ok: !bad, at: SV_TIME }); } catch (e) { }
}
function pvpResult(def, result) {
  ensurePvp();
  const bad = def.pvp.duel ? '' : pvpSuspicious(def, result);
  pvpLog(def, result, bad);
  if (bad) { save(); return 'PvP против ' + def.pvp.nick + ': ⚠ результат не засчитан (' + bad + '). MMR не изменился.'; }
  // 2.3: победа +15…+20 (больше — за сильного соперника), поражение −20…−40 (больше — от слабого)
  const exp = 1 / (1 + Math.pow(10, ((def.pvp.mmr || 0) - S.pvp.mmr) / 400));
  const md = mmrDelta(result.win, exp, S.pvp.mmr, S.pvp.gain || 0, S.pvp.hist);
  let delta = md.delta, mmrNote = md.note;
  if (def.pvp.bot || def.pvp.duel) { delta = 0; mmrNote = ''; }
  else { S.pvp.hist = ((S.pvp.hist || '') + (result.win ? '1' : '0')).slice(-CONFIG.mmr.promoWindow); S.pvp.gain = (S.pvp.gain || 0) + delta; }                                                   // бот и дуэль с другом: без рейтинга
  if (result.win && !def.pvp.bot && !def.pvp.duel && !def.pvp.rbot && def.pvp.uid) pvpHit(def.pvp.uid, Math.round(15 + 5 * (1 - exp)));   // сопернику снимаем MMR
  if (def.pvp.rbot) botAfterFight(def.pvp.rbot, -delta, !result.win);                                       // рейтинговый бот: MMR в обратную сторону
  S.pvp.mmr = Math.max(0, Math.min(CONFIG.bots.mmrMax, S.pvp.mmr + delta)); S.pvp.fights++;
  if (result.win) S.pvp.w++; else S.pvp.l++;
  S.pvp.peak = Math.max(S.pvp.peak || 0, S.pvp.mmr);
  let g = 0;
  if (S.pvp.fights <= CONFIG.pvp.rewardedPerDay) { g = Math.round(rewardScale() * (result.win ? CONFIG.pvp.winMul : CONFIG.pvp.lossMul)); addGems(g); }
  track('pvp');
  const hodMsg = result.win && !def.pvp.bot ? hodWin(BT ? BT.team.map(t => t.id) : getStack()) : '';
  save(); schedulePush();
  return 'PvP против ' + def.pvp.nick + ': ' + (result.win ? 'ПОБЕДА' : 'поражение') + (def.pvp.bot ? ' · тренировка, рейтинг не меняется · MMR ' : ' · MMR ' + (delta >= 0 ? '+' : '') + delta + ' → ') + S.pvp.mmr + ' (' + rankName(S.pvp.mmr) + ')' + mmrNote + (def.pvp.rbot ? ' · соперник — бот 🤖' : '') + (g ? ' · +' + fmt(g) + ' 🔶' : '') + hodMsg;
}

// ---------- подарки (двойная запись в одной транзакции) ----------
function cleanGiftItem(it) {
  if (!isObj(it) || !RARITIES.includes(it.rarity) || !HERO_BY_ID[it.heroId] || typeof it.name !== 'string' || it.name.length > 120) return null;
  if (it.path != null && (typeof it.path !== 'string' || !PATH_RE.test(it.path))) return null;
  const r = { type: it.type === 'eq' ? 'eq' : 'skin', heroId: it.heroId, rarity: it.rarity, name: it.name };
  if (it.path) r.path = it.path;
  if (r.type === 'eq') { if (!EQ_SLOTS.some(s => s.id === it.slot)) return null; r.slot = it.slot; }
  return r;
}
async function nextGiftMeta(c, amount) {
  const m = await db('GET', 'giftmeta/' + c.uid);
  const now = nowMs();
  if (m && now - m.last < CONFIG.gifts.cooldownMs) throw new Error('подожди ' + Math.ceil((CONFIG.gifts.cooldownMs - (now - m.last)) / 1000) + ' с между подарками');
  const fresh = !m || now - m.win >= 86400000;
  const meta = fresh ? { win: SV_TIME, n: 1, sum: amount, last: SV_TIME } : { win: m.win, n: m.n + 1, sum: m.sum + amount, last: SV_TIME };
  if (meta.n > CONFIG.gifts.dayCount) throw new Error('не больше ' + CONFIG.gifts.dayCount + ' подарков в сутки');
  if (meta.sum > CONFIG.gifts.daySum) throw new Error('за сутки можно подарить не больше ' + fmt(CONFIG.gifts.daySum) + ' 🔶' + (fresh ? '' : ' (осталось ' + fmt(Math.max(0, CONFIG.gifts.daySum - m.sum)) + ')'));
  return meta;
}
async function sendGift() {
  const nick = document.getElementById('gift-nick').value.trim();
  const kind = document.getElementById('gift-kind').value;
  const err = document.getElementById('gift-err'); err.style.color = ''; err.textContent = '';
  const c = cloud(); if (!c) return;
  const snap = JSON.stringify(S);
  try {
    const to = await nickOwner(nickKey(nick));
    if (!to) { err.textContent = 'Игрок не найден (он должен войти онлайн хотя бы раз)'; return; }
    if (to === c.uid) { err.textContent = 'Себе дарить нельзя'; return; }
    if (await cloudSync() === 'conflict') { err.textContent = 'Сначала выбери, какой прогресс оставить'; return; }
    let gift, amount = 0;
    if (kind === 'gems') {
      amount = Math.floor(+document.getElementById('gift-amount').value || 0);
      if (amount < CONFIG.gifts.min || amount > CONFIG.gifts.maxOne) { err.textContent = 'От ' + fmt(CONFIG.gifts.min) + ' до ' + fmt(CONFIG.gifts.maxOne) + ' за раз'; return; }
      if (!canPay(amount)) { err.textContent = 'У тебя столько нет'; return; }
      gift = { fromUid: c.uid, from: USER.nick, kind, amount, at: SV_TIME };
    } else {
      const it = S.items.find(x => x.uid === +document.getElementById('gift-item').value);
      const copy = it && cleanGiftItem(it); if (!copy) { err.textContent = 'Выбери предмет'; return; }
      gift = { fromUid: c.uid, from: USER.nick, kind, item: copy, at: SV_TIME };
    }
    const meta = await nextGiftMeta(c, amount);
    // меняем сейв локально, но фиксируем только если сервер принял ВСЁ сразу
    if (kind === 'gems') addGems(-amount); else removeItem(+document.getElementById('gift-item').value);
    const id = Date.now().toString(36) + randId(10);
    const at = Math.max(nowMs(), ((S.cloud && S.cloud.at) || 0) + 1);
    S.savedAt = at; S.cloud = { at, h: stateHash(S) };
    await dbMulti({
      ['gifts/' + to + '/' + id]: gift,
      ['giftlog/' + c.uid + '/' + id]: { to, kind, amount, at: SV_TIME },
      ['giftmeta/' + c.uid]: meta,
      ['saves/' + c.uid]: { at, nick: USER.nick, state: S }
    });
    save(); updateTop(); track('gifts');
    await renderOnline(true);
    toast('🎁 Подарок отправлен', 'Игрок ' + nick + ' получит его при следующем входе');
  } catch (e) {
    S = JSON.parse(snap); updateTop();   // откат: ничего не списано
    err.textContent = 'Не отправлено: ' + e.message;
  }
}
let giftsBusy = false;
async function checkGifts() {
  const c = cloud(); if (!c || giftsBusy || conflictOpen) return;
  giftsBusy = true;
  try {
    const gifts = await db('GET', 'gifts/' + c.uid); if (!gifts) return;
    if (await cloudSync() === 'conflict') return;
    for (const [gid, g] of Object.entries(gifts)) {
      if (!isObj(g) || (g.kind !== 'gems' && g.kind !== 'item')) continue;   // подарки администрации — в liveops.js
      const snap = JSON.stringify(S);
      let what = null;
      if (isObj(g) && g.kind === 'gems' && g.amount >= 1 && g.amount <= CONFIG.gifts.maxOne) { addGems(Math.floor(g.amount)); what = fmt(g.amount) + ' кристаллов'; }
      else if (isObj(g) && g.kind === 'item') { const it = cleanGiftItem(g.item); if (it) { it.uid = S.uid++; it.ts = Date.now(); S.items.unshift(it); what = it.name; } }
      const at = Math.max(nowMs(), ((S.cloud && S.cloud.at) || 0) + 1);
      S.savedAt = at; S.cloud = { at, h: stateHash(S) };
      try {
        // забрать подарок и записать сейв — одной транзакцией (дважды забрать нельзя)
        await dbMulti({ ['gifts/' + c.uid + '/' + gid]: null, ['saves/' + c.uid]: { at, nick: USER.nick, state: S } });
        save();
        if (what) toast('🎁 Подарок от ' + String((g && g.from) || '?').slice(0, 20), what);
      } catch (e) { S = JSON.parse(snap); }
    }
    updateTop();
  } catch (e) { } finally { giftsBusy = false; }
}
setInterval(() => { if (USER && cloud()) { checkGifts(); checkPvpHits(); } }, 120000);
// ---------- 2.3: если тебя победили в PvP — снимаем MMR ----------
// Победитель пишет pvp_hits/{проигравший}/{победитель} = {d, n, at}; проигравший при входе применяет и удаляет.
async function pvpHit(uid, d) { try { if (!/^[A-Za-z0-9_-]{1,128}$/.test(uid)) return; await db('PUT', 'pvp_hits/' + uid + '/' + cloud().uid, { d: Math.max(1, Math.min(40, d | 0)), n: USER.nick, at: SV_TIME }); } catch (e) { } }
async function checkPvpHits() {
  const c = cloud(); if (!c || !S) return;
  try {
    const hits = await db('GET', 'pvp_hits/' + c.uid); if (!hits) return;
    ensurePvp(); S.pvp.hitSeen = S.pvp.hitSeen || {};
    let lost = 0; const who = [];
    for (const [from, h] of Object.entries(hits)) {
      if (!isObj(h) || !(h.at > (S.pvp.hitSeen[from] || 0))) continue;
      S.pvp.hitSeen[from] = h.at; const d = Math.max(0, Math.min(40, h.d | 0)); lost += d; who.push(String(h.n || '?').slice(0, 20));
      db('DELETE', 'pvp_hits/' + c.uid + '/' + from).catch(() => { });
    }
    if (!lost) return;
    S.pvp.mmr = Math.max(0, S.pvp.mmr - lost); S.pvp.l++;
    save(); schedulePush();
    toast('⚔ Тебя победили в PvP', who.join(', ') + ' — MMR −' + lost + ' → ' + S.pvp.mmr);
  } catch (e) { }
}

// ---------- код восстановления ----------
// Код (100 бит случайности) шифрует данные для входа. В базе лежит только шифровка
// по адресу «хэш кода» — без самого кода её не найти и не расшифровать.
const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newRecoveryCode() { const a = new Uint8Array(20); crypto.getRandomValues(a); const s = Array.from(a, b => B32[b % 32]).join(''); return s.match(/.{5}/g).join('-'); }
function normCode(c) { return String(c).toUpperCase().replace(/[^A-Z0-9]/g, ''); }
async function sha256hex(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join(''); }
const b64 = u8 => btoa(String.fromCharCode(...u8)), unb64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
async function codeKey(code) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(normCode(code)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: new TextEncoder().encode('d2m-recov-v1'), iterations: 100000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function recovKey(code) { return 'recov/' + (await sha256hex('d2m-recov-path:' + normCode(code))); }
async function sealRecovery(code, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await codeKey(code), new TextEncoder().encode(JSON.stringify(data)));
  return { iv: b64(iv), ct: b64(new Uint8Array(ct)) };
}
async function openRecoveryBlob(code, blob) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, await codeKey(code), unb64(blob.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
async function setupRecovery(pass, auto) {
  const c = cloud(); if (!c) throw new Error('облако не подключено');
  const code = newRecoveryCode(), path = await recovKey(code);
  const old = await db('GET', 'recovIdx/' + c.uid);
  const upd = { [path]: Object.assign({ uid: c.uid }, await sealRecovery(code, { email: c.email || nickEmail(USER.nick), pass, nick: USER.nick })), ['recovIdx/' + c.uid]: path.slice(6) };
  if (old && 'recov/' + old !== path) upd['recov/' + old] = null;
  await dbMulti(upd);
  showRecoveryCode(code, auto);
}
function showRecoveryCode(code, auto) {
  showModal('🔑', 'Код восстановления', '<div style="font-size:.85rem"><p>' + (auto ? 'Облачный аккаунт создан. ' : '') + 'Если забудешь пароль — этот код вернёт аккаунт. <b>Он показывается один раз.</b> Сохрани его (скриншот или заметки).</p>' +
    '<div id="rc-code" style="font:700 1.25rem monospace;letter-spacing:2px;color:#bfe3ff;background:#05070a;border:1px solid var(--line2);padding:10px;margin:10px 0;user-select:all;word-break:break-all">' + esc(code) + '</div>' +
    '<p class="muted" style="font-size:.75rem">Старый код (если был) больше не работает. Никому не показывай код — с ним можно войти в аккаунт.</p></div>', '', { html: true, buttons: [
      { t: '📋 Скопировать', c: 'gold', f: () => { try { navigator.clipboard.writeText(code).then(() => toast('🔑', 'Код скопирован')); } catch (e) { } } },
      { t: 'Я сохранил', c: 'green', f: closeModal }] });
}
async function askNewRecovery() {
  if (!cloud()) return showModal('🔑', 'Нужно облако', 'Код восстановления работает только для облачного аккаунта. Включи онлайн во вкладке «Онлайн».', 'bad');
  showModal('🔑', 'Новый код восстановления', '<div style="text-align:left"><p style="font-size:.85rem;margin-bottom:6px">Введи текущий пароль — старый код перестанет работать.</p><div class="field"><label>Пароль</label><input type="password" id="rc-pass"></div><div class="auth-err" id="rc-err"></div></div>', '', { html: true, buttons: [
    { t: 'Создать код', c: 'green', f: async () => {
      const pass = document.getElementById('rc-pass').value, err = document.getElementById('rc-err');
      const acc = lsGet(ACC_KEY, {})[USER.key];
      if (await hashPass(pass, acc.salt) !== acc.hash) { err.textContent = 'Неверный пароль'; return; }
      try { await setupRecovery(pass); } catch (e) { err.textContent = 'Ошибка: ' + e.message; }
    } }, { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
function openRecovery() {
  if (!fbOn()) return showModal('🔑', 'Нет сервера', 'Восстановление работает только с онлайн-сервером.', 'bad');
  showModal('🔑', 'Восстановить аккаунт', '<div style="text-align:left"><div class="field"><label>Код восстановления</label><input type="text" id="rv-code" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" autocomplete="off"></div>' +
    '<div class="field"><label>Новый пароль (от 6 символов)</label><input type="password" id="rv-pass" autocomplete="new-password"></div><div class="field"><label>Повтори пароль</label><input type="password" id="rv-pass2" autocomplete="new-password"></div><div class="auth-err" id="rv-err"></div></div>', '', { html: true, buttons: [
      { t: 'Восстановить', c: 'green', f: doRecovery }, { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
async function doRecovery() {
  const code = document.getElementById('rv-code').value, pass = document.getElementById('rv-pass').value;
  const err = document.getElementById('rv-err'); err.style.color = '';
  if (normCode(code).length !== 20) { err.textContent = 'Код — 20 символов (дефисы можно не писать)'; return; }
  if (pass.length < 6) { err.textContent = 'Пароль минимум 6 символов'; return; }
  if (pass !== document.getElementById('rv-pass2').value) { err.textContent = 'Пароли не совпадают'; return; }
  err.style.color = 'var(--muted)'; err.textContent = 'Проверяю код…';
  try {
    const path = await recovKey(code);
    const blob = await db('GET', path, undefined, true);
    if (!blob) throw new Error('код не найден или уже заменён новым');
    const data = await openRecoveryBlob(code, blob);
    const c0 = await fbAuth('signInWithPassword', data.email, data.pass);
    const c = await fbSetPassword(c0.id, pass, data.email);
    let nick = data.nick;
    try { const n = await fetch(FB.dbUrl.replace(/\/$/, '') + '/saves/' + c.uid + '/nick.json?auth=' + c.id).then(r => r.json()); if (typeof n === 'string' && validNick(n)) nick = n; } catch (e) { }
    const k = nickKey(nick), accs = lsGet(ACC_KEY, {}), salt = newSalt();
    accs[k] = Object.assign(accs[k] || { created: Date.now() }, { nick, salt, hash: await hashPass(pass, salt) });
    lsSet(ACC_KEY, accs); storeCloud(k, c);
    closeModal(); login(k, nick);
    // тот же код продолжает работать — перешифровываем его новым паролем
    await dbMulti({ [path]: Object.assign({ uid: c.uid }, await sealRecovery(code, { email: data.email, pass, nick })) });
    await syncServerTime().catch(() => {});
    await cloudSync();
    showModal('🔑', 'Аккаунт восстановлен', 'Пароль изменён. Код восстановления остался прежним.', 'ok');
  } catch (e) { err.style.color = ''; err.textContent = /OperationError|decrypt/i.test(e.name + e.message) ? 'Неверный код' : 'Не получилось: ' + e.message; }
}

// ---------- смена пароля и ника (вызывается из профиля) ----------
async function cloudChangePassword(oldPass, newPass) {
  const c = cloud(); if (!c) return;
  if (newPass.length < 6) throw new Error('для облачного аккаунта пароль минимум 6 символов');
  const email = c.email || await resolveEmail(USER.key);
  const fresh = await fbAuth('signInWithPassword', email, oldPass);   // свежий вход обязателен
  const c2 = await fbSetPassword(fresh.id, newPass, email);
  storeCloud(USER.key, c2);
  const had = await db('GET', 'recovIdx/' + c2.uid).catch(() => null);
  if (had) setTimeout(() => setupRecovery(newPass).catch(() => {}), 300);   // старый код больше не подходит — выдаём новый
}
async function cloudRenameNick(oldK, newK) {
  const c = cloud(); if (!c) return;
  const email = c.email || await resolveEmail(oldK);
  // все 4 изменения атомарно; если новый ник занят — правила отклонят всё
  await dbMulti({ ['nicks/' + dbKey(newK)]: c.uid, ['login/' + dbKey(newK)]: { uid: c.uid, email }, ['nicks/' + dbKey(oldK)]: null, ['login/' + dbKey(oldK)]: null });
  c.email = email;
  const all = lsGet(CLOUD_KEY, {}); delete all[oldK]; all[newK] = c; lsSet(CLOUD_KEY, all);
}

// ---------- UI вкладки ----------
let boardCache = null, boardAt = 0, boardSort = 'arena';
async function renderOnline(force) {
  const host = document.getElementById('online-host');
  if (!fbOn()) {
    host.innerHTML = '<div class="panel panel-b"><h3 class="cinzel" style="color:var(--gold2);letter-spacing:2px">Онлайн-сервер не подключён</h3><p class="muted" style="margin:8px 0">Облачные аккаунты, таблица лидеров, PvP и подарки работают через бесплатный сервер Firebase. Вставь данные проекта:</p>' +
      '<div class="field"><label>Web API Key</label><input type="text" id="fb-key" placeholder="AIza..."></div><div class="field"><label>Realtime Database URL</label><input type="text" id="fb-db" placeholder="https://xxx-default-rtdb.europe-west1.firebasedatabase.app"></div>' +
      '<button class="btn green" data-click="saveFb()">Подключить</button></div>';
    return;
  }
  const c = cloud();
  if (!c) {
    host.innerHTML = '<div class="panel panel-b"><h3 class="cinzel" style="color:var(--gold2)">Войди в облако</h3><p class="muted" style="margin:8px 0">Подтверди пароль аккаунта <b>' + esc(USER.nick) + '</b> (минимум 6 символов), чтобы включить облачные сохранения, рейтинг, PvP и подарки.</p><div class="field"><label>Пароль</label><input type="password" id="cl-pass"></div><div class="auth-err" id="cl-err"></div><button class="btn green" data-click="cloudConnect()">Включить онлайн</button></div>';
    return;
  }
  ensurePvp();
  const rk = rankOf(S.pvp.mmr), nx = rankNext(S.pvp.mmr);
  botDailyMatches().catch(() => {});
  host.innerHTML = '<div class="online-grid"><div class="panel panel-b"><div class="cinzel" style="color:' + rk[2] + ';font-size:1.4rem;letter-spacing:2px">' + rankName(S.pvp.mmr) + '</div>' + (nx ? '<div class="muted" style="font-size:.75rem">до следующей ступени: ' + nx + ' MMR · ранг = 1000 MMR, 5 ступеней</div>' : '') + '<div>MMR <b>' + S.pvp.mmr + '</b> · побед ' + S.pvp.w + ' · поражений ' + S.pvp.l + '</div><div class="muted" style="font-size:.78rem">Набрано MMR сегодня: <b>' + Math.max(0, S.pvp.gain || 0) + '</b>/' + CONFIG.mmr.dailyCap + ' (после лимита прирост ×' + CONFIG.mmr.afterCap + ', после ' + CONFIG.mmr.hardCap + ' — ×' + CONFIG.mmr.afterHard + ') · винрейт за последние ' + Math.min(CONFIG.mmr.promoWindow, (S.pvp.hist || '').length) + ': ' + Math.round(pvpWinrate() * 100) + '%' + (RANKS.indexOf(rk) >= CONFIG.mmr.promoFrom ? ' · для повышения ранга нужно больше 50%' : '') + '</div><div class="muted" style="font-size:.8rem">Наградных PvP-боёв сегодня: ' + Math.max(0, CONFIG.pvp.rewardedPerDay - S.pvp.fights) + '/' + CONFIG.pvp.rewardedPerDay + '</div><button class="btn red big" style="margin-top:10px" data-click="pvpFight()">⚔ НАЙТИ СОПЕРНИКА</button><div class="muted" style="font-size:.75rem;margin-top:6px">Твой стак сражается с сохранённым стаком другого игрока.</div></div>' +
    '<div class="panel panel-b"><h3 class="cinzel" style="color:var(--gold2)">Подарок другу</h3><div class="field"><label>Ник</label><input type="text" id="gift-nick" maxlength="20"></div><div style="display:flex;gap:6px;flex-wrap:wrap"><select id="gift-kind"><option value="gems">Кристаллы</option><option value="item">Предмет</option></select><input type="number" id="gift-amount" placeholder="сколько" style="width:110px" min="' + CONFIG.gifts.min + '" max="' + CONFIG.gifts.maxOne + '"><select id="gift-item" style="display:none;max-width:220px"><option value="">— выбери предмет —</option>' +
    S.items.filter(x => !equippedOn(x.uid)).slice(0, 200).map(x => '<option value="' + x.uid + '">' + esc(x.name) + ' (' + RARITY_NAMES[x.rarity] + ')</option>').join('') + '</select><button class="btn gold" data-click="sendGift()">Отправить</button></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:4px">До ' + CONFIG.gifts.dayCount + ' подарков и ' + fmt(CONFIG.gifts.daySum) + ' 🔶 в сутки, не чаще раза в ' + (CONFIG.gifts.cooldownMs / 1000) + ' с.</div><div class="auth-err" id="gift-err"></div></div></div>' +
    leagueHTML() + '<div class="sec-title">Таблица лидеров</div><div class="seg" style="margin-bottom:8px">' + [['arena', 'Арена'], ['stack', 'Сила стака'], ['mmr', 'MMR'], ['inv', 'Invoker'], ['surv', '🔮 Выживание'], ['tower', '🏯 Башня']].map(([k, n]) => '<button class="' + (boardSort === k ? 'active' : '') + '" data-click="setBoardSort(\'' + k + '\')">' + n + '</button>').join('') + '</div><div class="panel" id="board"><div class="muted" style="padding:14px">Загрузка…</div></div>' +
    '<div class="muted" style="font-size:.75rem;margin-top:8px">☁ Облачное сохранение включено. <button class="btn ghost sm" data-click="manualCloudSave()">Сохранить сейчас</button> <button class="btn ghost sm" data-click="askNewRecovery()">🔑 Код восстановления</button></div>';
  document.getElementById('gift-kind').onchange = e => { document.getElementById('gift-amount').style.display = e.target.value === 'gems' ? '' : 'none'; document.getElementById('gift-item').style.display = e.target.value === 'gems' ? 'none' : ''; };
  if (boardSort === 'tower') { const bx = document.getElementById('board'); if (bx) { bx.id = 'tw-board'; await twLoadBoard(); bx.id = 'board'; } return; }
  try {
    if (force || !boardCache || boardCache._sort !== boardSort || Date.now() - boardAt > CONFIG.cloud.boardCacheMs) {
      await cloudPush();
      // топ-100 по выбранной колонке (индексы arena/stack/mmr/inv), а не вся таблица
      // 2.4: после релизного сброса — только записи новее CONFIG.wipe.at (сортировка уже у нас)
      const q = { orderBy: 'at', startAt: CONFIG.wipe.at, limitToLast: 400 };
      boardCache = await db('GET', 'board', undefined, false, q) || {};
      const mine = await db('GET', 'board/' + c.uid).catch(() => null);
      Object.defineProperty(boardCache, '_sort', { value: boardSort, enumerable: false });
      Object.defineProperty(boardCache, '_mine', { value: mine, enumerable: false });
      boardAt = Date.now();
    }
    const rows = Object.entries(boardCache).filter(([u, r]) => isObj(r) && (r.at || 0) >= CONFIG.wipe.at && !(boardSort === 'inv' && !(r.inv > 0)) && !(boardSort === 'surv' && !(r.surv > 0)) && !(typeof LIVE !== 'undefined' && LIVE.banned[u])).map(([uid, r]) => ({ uid, nick: String(r.nick || '?').slice(0, 20), title: r.title, ava: r.ava, bot: r.bot, arena: Math.floor(num(r.arena, 0, ARENA_MAX, 0)), stack: num(r.stack, 0, 1e12, 0), mmr: Math.round(num(r.mmr, 0, CONFIG.bots.mmrMax, 0)), inv: r.inv > 0 ? num(r.inv, 0, 1e6, 0) : null, surv: r.surv > 0 ? Math.floor(num(r.surv, 0, 400, 0)) : null }));
    if (boardSort === 'mmr') { try { (await loadBots()).forEach(b => rows.push({ uid: b.id, nick: '🤖 ' + b.nick, bot: true, title: null, arena: 0, stack: 0, mmr: b.mmr, inv: null })); } catch (e) { } }
    const inTop = rows.some(r => r.uid === c.uid);
    const key = { arena: r => -r.arena * 1e9 - r.stack, stack: r => -r.stack, mmr: r => -r.mmr, inv: r => r.inv || 1e9, surv: r => -(r.surv || 0) }[boardSort];
    rows.sort((a, b) => key(a) - key(b));
    document.getElementById('board').innerHTML = '<table class="board"><tr><th>#</th><th>Игрок</th><th>Арена</th><th>Сила стака</th><th>MMR</th><th>Invoker</th><th>Выживание</th></tr>' +
      rows.slice(0, 100).map((r, i) => '<tr class="' + (r.uid === c.uid ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + avaHTML(r.bot ? null : r.ava, r.uid) + esc(r.nick) + titleHTML(r.title) + (r.uid !== c.uid && !r.bot ? ' <button class="rep-btn" aria-label="Пожаловаться на игрока" title="Пожаловаться" data-click="openReport(\'' + r.uid + '\',\'' + esc(r.nick).replace(/'/g, '') + '\')">⚑</button>' : '') + (r.bot ? ' <span class="bot-tag">бот</span>' : '') + '</td><td>' + (r.bot ? '—' : r.arena + '/' + ARENA_MAX) + '</td><td>' + (r.bot ? '—' : fmt(r.stack)) + '</td><td style="color:' + rankOf(r.mmr)[2] + '">' + r.mmr + ' ' + rankName(r.mmr) + '</td><td>' + (r.inv ? r.inv.toFixed(2) + 's' : '—') + '</td><td>' + (r.surv ? r.surv : '—') + '</td></tr>').join('') + myPlaceRow(inTop, boardCache._mine) + '</table>';
  } catch (e) { document.getElementById('board').innerHTML = '<div class="auth-err" style="padding:14px">Не удалось загрузить: ' + esc(e.message) + '</div>'; }
}
// 2.8: иконка героя-аватара в таблицах (лидеры, друзья, Invoker)
function avaHTML(id, uid) {
  if (!id && uid && typeof USER !== 'undefined' && cloud() && uid === cloud().uid) id = S.avatar;
  const ok = id && HERO_BY_ID[id];
  return ok ? '<img class="bd-ava" src="' + heroIcon(id) + '" referrerpolicy="no-referrer" alt="" loading="lazy">' : '<span class="bd-ava none">👤</span>';
}
// «моё место»: если меня нет в топ-100 — отдельная строка внизу
function myPlaceRow(inTop, m) {
  if (inTop || !isObj(m)) return '';
  const mmr = Math.round(num(m.mmr, 0, CONFIG.bots.mmrMax, 0));
  return '<tr class="me"><td>100+</td><td>' + avaHTML(S.avatar) + esc(String(m.nick || USER.nick).slice(0, 20)) + titleHTML(m.title) + ' (ты)</td><td>' + Math.floor(num(m.arena, 0, ARENA_MAX, 0)) + '/' + ARENA_MAX + '</td><td>' + fmt(num(m.stack, 0, 1e12, 0)) + '</td><td style="color:' + rankOf(mmr)[2] + '">' + mmr + ' ' + rankName(mmr) + '</td><td>' + (m.inv > 0 ? (+m.inv).toFixed(2) + 's' : '—') + '</td><td>' + (m.surv > 0 ? Math.floor(+m.surv) : '—') + '</td></tr>';
}
function saveFb() {
  const k = document.getElementById('fb-key').value.trim(), d = document.getElementById('fb-db').value.trim();
  if (!k || !/^https:\/\/[a-z0-9.\-]+\.(firebaseio\.com|firebasedatabase\.app)\/?$/.test(d)) return showModal('⚠', 'Проверь данные', 'Нужны API Key и адрес базы Firebase (https://….firebasedatabase.app)', 'bad');
  FB = { apiKey: k, dbUrl: d }; lsSet('d2m_fb', FB); renderOnline();
}
async function cloudConnect() {
  const pass = document.getElementById('cl-pass').value, err = document.getElementById('cl-err');
  const acc = lsGet(ACC_KEY, {})[USER.key];
  if (await hashPass(pass, acc.salt) !== acc.hash) { err.textContent = 'Неверный пароль'; return; }
  if (pass.length < 6) { err.textContent = 'Для облака нужен пароль от 6 символов — смени его в профиле'; return; }
  err.style.color = 'var(--muted)'; err.textContent = 'Подключаюсь…';
  await cloudAfterAuth('register', USER.nick, pass);
  renderOnline(true);
}

(function () {
  const st = document.createElement('style');
  st.textContent = `
.online-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:800px){.online-grid{grid-template-columns:1fr}}
table.board{width:100%;border-collapse:collapse;font-size:.85rem}
table.board th{text-align:left;padding:8px 10px;color:var(--muted);font-weight:700;border-bottom:1px solid var(--line);font-size:.72rem;text-transform:uppercase;letter-spacing:.5px}
table.board td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.04)}
table.board tr.me td{background:rgba(200,164,90,.12);color:#fff;font-weight:700}
`;
  document.head.appendChild(st);
})();
