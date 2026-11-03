// ================= LIVE-OPS: управление игрой без перезаливки =================
// Узел config/ в базе (меняется в admin.html): множители баланса, объявление, техработы,
// аварийные выключатели (PvP, подарки, слоты, сундуки), события. Без сети — последняя копия или дефолты CONFIG.
// 2.4: удалённые/скрытые аккаунты — не показываются в рейтинге и не попадаются соперниками, даже пока их данные лежат в базе
const HIDDEN_UIDS = ['pODgwM9GYOXGHQEo2P4spRNNAve2', 'j2BMfKqIEZNkBk0jYo6zb1HkvHb2', 'iBWIwXEry0WgooOB6ueWMfvvrZk1', 'SNJf5eDRiyNDHCEXyMROA487PPw1', 'E2KgPbyOPbTeYfgsQhBDvFoCQUB3', '2tUkrW7sjSUFr70kO0eq4mPaBTv2', 'esv1XnoPMjOsXn85JAwa0r9iYfB3'];
const LIVE = { cfg: {}, banned: Object.fromEntries(HIDDEN_UIDS.map(u => [u, true])), me: { banned: false } };
const LIVE_KEY = 'd2m_live';
// чистим то, что пришло из базы: только известные поля и правильные типы
function cleanBalance(over, base) {
  const out = {};
  for (const k in over) {
    if (!(k in base)) continue;
    const v = over[k], b = base[k];
    if (typeof b === 'number' && typeof v === 'number' && isFinite(v)) out[k] = v;
    else if (typeof b === 'boolean' && typeof v === 'boolean') out[k] = v;
    else if (isObj(b) && isObj(v)) out[k] = cleanBalance(v, b);
  }
  return out;
}
function cleanLiveCfg(c) {
  c = isObj(c) ? c : {};
  const s = (x, n) => typeof x === 'string' ? x.slice(0, n) : '';
  const kill = isObj(c.kill) ? c.kill : {};
  return {
    balance: isObj(c.balance) ? cleanBalance(c.balance, CONFIG) : null,
    announce: isObj(c.announce) && c.announce.text ? { id: s(c.announce.id || c.announce.text, 40), text: s(c.announce.text, 300) } : null,
    maintenance: isObj(c.maintenance) && c.maintenance.on === true ? { text: s(c.maintenance.text, 300) || 'Идут технические работы. Загляни чуть позже!' } : null,
    kill: { pvp: kill.pvp === true, gifts: kill.gifts === true, slots: kill.slots === true, chests: kill.chests === true },
    events: isObj(c.events) ? Object.fromEntries(Object.entries(c.events).filter(([, v]) => typeof v === 'boolean')) : {},
    analytics: c.analytics !== false
  };
}
const BASE_CONFIG = JSON.parse(JSON.stringify(CONFIG));   // дефолты, чтобы откатываться при снятии множителей
async function loadLiveConfig() {
  let cfg = lsGet(LIVE_KEY, null);
  if (fbOn()) {
    try {
      const r = await Promise.race([db('GET', 'config', undefined, true), new Promise((_, j) => setTimeout(() => j(new Error('timeout')), 3500))]);
      cfg = isObj(r) ? r : {}; lsSet(LIVE_KEY, cfg);
    } catch (e) { }
  }
  applyLive(cfg || {});
}
function applyLive(raw) {
  LIVE.cfg = cleanLiveCfg(raw);
  // сначала вернуть дефолты, потом наложить множители (снятые в админке множители перестают действовать)
  const fresh = JSON.parse(JSON.stringify(BASE_CONFIG));
  for (const k in fresh) CONFIG[k] = fresh[k];
  applyConfig(LIVE.cfg.balance || {});
  renderAnnounce(); checkMaintenance();
  if (typeof renderEventBanner === 'function' && S) renderEventBanner();
}
setInterval(() => loadLiveConfig(), 10 * 60000);

// ---------- техработы ----------
function checkMaintenance() {
  let m = document.getElementById('maint');
  if (!LIVE.cfg.maintenance) { if (m) m.remove(); return; }
  if (!m) { m = document.createElement('div'); m.id = 'maint'; document.body.appendChild(m); }
  m.innerHTML = '<div class="panel panel-b"><div style="font-size:2.4rem">🔧</div><h2 class="cinzel" style="color:var(--gold2)">Технические работы</h2><p></p><button class="btn green" type="button">Проверить снова</button></div>';
  m.querySelector('p').textContent = LIVE.cfg.maintenance.text;
  m.querySelector('button').onclick = () => loadLiveConfig();
}
// ---------- объявление ----------
function renderAnnounce() {
  const old = document.getElementById('announce'); if (old) old.remove();
  const a = LIVE.cfg.announce; if (!a || lsGet('d2m_ann_hide', '') === a.id) return;
  const host = document.querySelector('#tab-home'); if (!host) return;
  const d = document.createElement('div'); d.id = 'announce'; d.className = 'panel announce';
  d.innerHTML = '<span>📢 <span class="at"></span></span><button class="btn ghost sm" type="button" aria-label="Скрыть объявление">✕</button>';
  d.querySelector('.at').textContent = a.text;
  d.querySelector('button').onclick = () => { lsSet('d2m_ann_hide', a.id); d.remove(); };
  host.prepend(d);
}
// ---------- аварийные выключатели ----------
function killed(what, name) {
  if (!LIVE.cfg.kill[what]) return false;
  showModal('🔧', name + ' временно отключены', 'Автор игры временно выключил эту функцию. Остальная игра работает — загляни позже.', '');
  return true;
}
// ---------- бан ----------
async function checkBan() {
  const c = cloud(); if (!c) return;
  try {
    const b = await db('GET', 'banned/' + c.uid);
    LIVE.me.banned = !!b;
    if (b && !lsGet('d2m_ban_seen_' + c.uid, false)) { lsSet('d2m_ban_seen_' + c.uid, true); showModal('⛔', 'Онлайн ограничен', 'Аккаунт исключён из рейтинга и PvP' + (b.reason ? ': ' + String(b.reason).slice(0, 200) : '') + '. Одиночная игра доступна.', 'bad'); }
    const bn = await db('GET', 'bannedNicks/' + enc(USER.key), undefined, true).catch(() => null);
    if (bn) showModal('✏', 'Смени ник', 'Ник «' + USER.nick + '» запрещён модератором. Смени его в профиле, чтобы вернуться в рейтинг и PvP.', 'bad', { buttons: [{ t: 'Открыть профиль', c: 'green', f: () => { closeModal(); openProfile(); } }] });
  } catch (e) { }
}
(function hookLive() {
  const _pvp = pvpFight; pvpFight = function () { if (killed('pvp', 'PvP-бои')) return; if (LIVE.me.banned) return showModal('⛔', 'PvP недоступно', 'Аккаунт исключён из рейтинга и PvP.', 'bad'); return _pvp(); };
  const _gift = sendGift; sendGift = function () { if (killed('gifts', 'Подарки')) return; return _gift(); };
  const _slot = spinSlots; spinSlots = function () { if (killed('slots', 'Слоты')) return; return _slot.apply(this, arguments); };
  const _auto = startAuto; startAuto = function (n) { if (killed('slots', 'Слоты')) return; return _auto(n); };
  const _chest = openChest; openChest = function (id) { if (killed('chests', 'Сундуки')) return; return _chest(id); };
  const _rows = publicRows; publicRows = function (c) { return LIVE.me.banned ? {} : _rows(c); };
  const _start = startGame; startGame = function () { _start(); renderAnnounce(); if (typeof cloud === 'function' && cloud()) setTimeout(checkBan, 2500); };
  // подарки от администрации: могут быть и отрицательными (забрать кристаллы)
  const _check = checkGifts;
  checkGifts = async function () {
    const c = cloud(); if (!c || conflictOpen) return _check();
    try {
      const gifts = await db('GET', 'gifts/' + c.uid);
      const admin = Object.entries(gifts || {}).filter(([, g]) => isObj(g) && g.fromUid === 'admin' && g.kind === 'admin');
      for (const [gid, g] of admin) {
        if (await cloudSync() === 'conflict') break;
        const snap = JSON.stringify(S), n = Math.trunc(num(g.amount, -1e13, 1e13, 0));
        addGems(n);
        const at = Math.max(nowMs(), ((S.cloud && S.cloud.at) || 0) + 1); S.savedAt = at; S.cloud = { at, h: stateHash(S) };
        try { await dbMulti({ ['gifts/' + c.uid + '/' + gid]: null, ['saves/' + c.uid]: { at, nick: USER.nick, state: S } }); save(); toast('📨 От администрации', (n >= 0 ? '+' : '') + fmt(n) + ' 🔶' + (g.note ? ' · ' + String(g.note).slice(0, 120) : '')); }
        catch (e) { S = JSON.parse(snap); }
      }
    } catch (e) { }
    return _check();
  };
})();
loadLiveConfig();
