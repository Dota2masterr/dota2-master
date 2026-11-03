// ================= 2.4: ПАТИ-БОССЫ — ЖИВОЙ КООП ВДВОЁМ =================
// Как работает (бесплатный Firebase, только REST):
// 1) Лобби: позвать друга по нику (coop_inv/{друг}/{я}) или найти случайного напарника (очередь coop_queue).
//    Комнату coop_rooms/{id} создаёт игрок b, игрок a — второй. В комнату каждый кладёт 3 своих героя (d/{uid}).
// 2) Бой считается одинаково на обоих устройствах: общий сид + одинаковые герои. По сети идут только действия:
//    на каждый ход каждый пишет in/{uid}/{ход} — строку «какие ульты, агро, фокус». Ход выполняется, когда есть оба.
// 3) Напарник молчит — бой на паузе до 30 секунд, потом его героями управляет бот (ульты в удачный момент).
// 4) Награда за каждого босса — раз в день: уникальный предмет и кристаллы.
// Нагрузка: ~40 ходов × (1 запись + 2–3 чтения) ≈ 150 маленьких запросов на бой, ~60 КБ. Лимит 10 ГБ/мес — это ~150 000 боёв.
// Ограничения: 1 награда за босса в день, лобби живёт 90 с, бой не дольше 60 ходов, комнату удаляет хост после боя.
const COOP_BOSSES = [
  { id: 'ancient_roshan', unit: 'roshan', n: 'Древний Рошан', ic: '🦍', item: 'Клык Древнего Рошана', power: 1.4, hpMul: 5.2, k: 1.25,
    d: 'Один держит агро (кнопка 🛡), второй бьёт в спину ×1.5. Во 2-й фазе панцирь: ломается, только если вы оба нажмёте ульты в один ход.',
    phases: [{ at: 1, m: ['aggro'], t: 'один держит агро, второй бьёт в спину' }, { at: 0.6, m: ['aggro', 'shield'], t: 'панцирь! Ульты обоих игроков в один ход' }, { at: 0.3, m: ['enrage', 'aggro'], t: 'ярость — удар по всем каждые 3 хода' }] },
  { id: 'avatar', unit: 'night_stalker', n: 'Аватар Тьмы', ic: '🌑', item: 'Сердце Тьмы', power: 1.35, hpMul: 5.0, k: 1.3,
    d: 'Каждые 5 ходов меняет цель: кто под агро — защищается, второй бьёт в спину. Во 2-й фазе щит двух ульт, в 3-й — ярость.',
    phases: [{ at: 1, m: ['swap'], t: 'меняет цель каждые 5 ходов' }, { at: 0.6, m: ['swap', 'shield'], t: 'щит тьмы! Ульты обоих игроков в один ход' }, { at: 0.25, m: ['swap', 'enrage'], t: 'ярость и смена целей' }] },
  { id: 'abyss', unit: 'abyssal_underlord', n: 'Повелитель Бездны', ic: '🕳', item: 'Корона Бездны', power: 1.25, hpMul: 4.6, k: 1.25, adds: 2,
    d: 'Сзади два демона лечат босса. Один игрок ставит фокус «задний» и убивает их, второй держит агро. Потом — щит двух ульт и ярость.',
    phases: [{ at: 1, m: ['heal', 'aggro'], t: 'демоны лечат босса — убейте их' }, { at: 0.55, m: ['heal', 'aggro', 'shield'], t: 'щит бездны! Ульты обоих в один ход' }, { at: 0.25, m: ['enrage'], t: 'ярость' }] }
];
const COOP = { lobbySec: 90, waitSec: 30, maxTicks: 60, poll: 400 };
function coopState() { const d = todayStr(); if (!S.coop || S.coop.d !== d) S.coop = { d, got: {} }; if (!S.coop.got) S.coop.got = {}; return S.coop; }
// бой: 6 героев (3 игрока a, потом 3 игрока b)
function coopDef(bi, team) {
  const B = COOP_BOSSES[bi], P = team.reduce((a, t) => a + t.p, 0);
  const power = Math.round(P * B.power / 6 * 2.2);
  const waves = [{ id: B.unit, name: B.ic + ' ' + B.n, power, boss: true, hpMul: B.hpMul }];
  for (let i = 0; i < (B.adds || 0); i++) waves.push({ id: 'shadow_demon', name: 'Демон бездны', power: Math.round(power * 0.12), hpMul: 1.2 });
  return { L: 0, loc: LOCS[3] || LOCS[0], waves, R: power, K: B.k, reward: 0, back: 'arena', coop: { boss: B.id, bi, phases: B.phases }, teamSize: 6 };
}
function coopTeamOf(uidTeam) { return uidTeam.map(t => ({ id: HERO_BY_ID[t.id] ? t.id : 'axe', p: Math.max(10, Math.min(1e9, +t.p || 10)), mods: cleanCoopMods(t.mods) })); }
function cleanCoopMods(m) {
  const r = {}; if (!isObj(m)) return r;
  ['atk', 'hp', 'taken', 'ultMul'].forEach(k => { if (isFinite(+m[k])) r[k] = Math.max(0.3, Math.min(4, +m[k])); });
  ['crit', 'lifesteal'].forEach(k => { if (isFinite(+m[k])) r[k] = Math.max(0, Math.min(0.8, +m[k])); });
  if (isFinite(+m.critMul)) r.critMul = Math.max(1, Math.min(3, +m.critMul));
  if (m.stunImmune === true) r.stunImmune = true;
  return r;
}
function myCoopHeroes() { const bt = buildTeam({ noCons: true }); return bt.team.slice(0, 3).map(t => ({ id: t.id, p: Math.round(t.p), mods: cleanCoopMods(t.mods) })); }

// ---------- UI в арене ----------
let coopBoss = 0, CQ = null, coopInvPoll = null;
function renderCoop() {
  const box = document.getElementById('coop-box'); if (!box) return;
  const st = coopState(), on = typeof cloud === 'function' && cloud();
  box.innerHTML = '<div class="muted" style="font-size:.78rem;margin-bottom:6px">Боссы на двоих: у них здоровье и механики рассчитаны на двух живых игроков. Бой идёт одновременно у обоих. Награда — раз в день за каждого босса.</div><div class="coop-list">' +
    COOP_BOSSES.map((b, i) => '<div class="coop-b' + (coopBoss === i ? ' sel' : '') + '" data-click="coopPick(' + i + ')"><span class="coop-ic">' + b.ic + '</span><div><b>' + esc(b.n) + '</b>' + (st.got[b.id] ? ' <span class="muted">✓ сегодня</span>' : '') + '<div class="muted">' + esc(b.d) + '</div><div style="font-size:.72rem">Награда: <b style="color:' + RARITY_COLOR.arcana + '">' + esc(b.item) + '</b> + кристаллы</div></div></div>').join('') + '</div>' +
    (on ? '<div class="coop-act"><button class="btn red" data-click="coopRandom()">🎲 Случайный напарник</button><input type="text" id="coop-nick" maxlength="20" placeholder="ник друга"><button class="btn gold" data-click="coopInvite()">📨 Позвать</button></div><div id="coop-inv"></div>'
      : '<div class="muted">Кооп доступен после входа в облачный аккаунт (вкладка «Онлайн»).</div>');
  if (on) coopCheckInvites();
}
function coopPick(i) { coopBoss = Math.max(0, Math.min(COOP_BOSSES.length - 1, i | 0)); renderCoop(); }
async function coopCheckInvites() {
  const c = cloud(); const host = document.getElementById('coop-inv'); if (!c || !host) return;
  try {
    const inv = await db('GET', 'coop_inv/' + c.uid) || {};
    const list = Object.entries(inv).filter(([, v]) => isObj(v) && v.at > Date.now() - COOP.lobbySec * 1000 && COOP_BOSSES[v.b | 0]);
    host.innerHTML = list.map(([from, v]) => '<div class="coop-invrow">📨 <b>' + esc(String(v.n || '?').slice(0, 20)) + '</b> зовёт на «' + esc(COOP_BOSSES[v.b | 0].n) + '» <button class="btn sm green" data-click="coopAccept(\'' + from + '\')">Принять</button></div>').join('');
  } catch (e) { }
  clearTimeout(coopInvPoll);
  if (document.getElementById('coop-inv') && !busy.battle && !CQ) coopInvPoll = setTimeout(coopCheckInvites, 5000);
}
async function coopInvite() {
  const c = cloud(); if (!c || CQ) return;
  const nick = (document.getElementById('coop-nick').value || '').trim();
  const to = nick.length >= 3 ? await nickOwner(nickKey(nick)) : null;
  if (!to || to === c.uid) return showModal('📨', 'Не найден', 'Игрок с таким ником не найден.', 'bad');
  const id = c.uid.slice(0, 8) + to.slice(0, 8) + Date.now().toString(36);
  const room = { a: to, b: c.uid, na: String(nick).slice(0, 20), nb: USER.nick, boss: coopBoss, seed: Math.floor(Math.random() * 1e9), at: SV_TIME };
  try {
    await db('PUT', 'coop_rooms/' + id, room);
    await db('PUT', 'coop_inv/' + to + '/' + c.uid, { n: USER.nick, r: id, b: coopBoss, at: SV_TIME });
  } catch (e) { return showModal('☁', 'Ошибка', 'Не удалось создать лобби: ' + e.message, 'bad'); }
  room.at = Date.now();
  coopLobby(id, room, 'b', 'Ждём, пока ' + nick + ' примет приглашение…');
}
async function coopAccept(from) {
  const c = cloud(); if (!c || CQ) return;
  try {
    const inv = await db('GET', 'coop_inv/' + c.uid + '/' + from); if (!isObj(inv)) return;
    db('DELETE', 'coop_inv/' + c.uid + '/' + from).catch(() => { });
    const room = await db('GET', 'coop_rooms/' + inv.r);
    if (!isObj(room) || room.a !== c.uid) return showModal('📨', 'Лобби закрыто', 'Приглашение устарело.', '');
    coopLobby(inv.r, room, 'a', 'Входим в лобби…');
  } catch (e) { showModal('☁', 'Ошибка', e.message, 'bad'); }
}
// случайный напарник: очередь по боссу; комнату создаёт тот, у кого uid «больше»
function coopRandom() {
  const c = cloud(); if (!c || CQ) return;
  CQ = { uid: c.uid, t0: Date.now(), timer: null, boss: coopBoss };
  showModal('🎲', 'Поиск напарника…', 'Ищем второго игрока на «' + COOP_BOSSES[coopBoss].n + '» (до 90 секунд).', '', { buttons: [{ t: 'Отмена', f: () => { coopCancel(); closeModal(); } }] });
  db('PUT', 'coop_queue/' + c.uid, { n: USER.nick, b: coopBoss, at: SV_TIME }).catch(() => { });
  CQ.timer = setInterval(coopPoll, 1500);
}
async function coopCancel() { if (!CQ) return; clearInterval(CQ.timer); const u = CQ.uid; CQ = null; try { await db('DELETE', 'coop_queue/' + u); } catch (e) { } }
async function coopPoll() {
  if (!CQ || CQ.busy) return;
  if (Date.now() - CQ.t0 > COOP.lobbySec * 1000) { await coopCancel(); return showModal('🎲', 'Никого нет', 'Сейчас нет свободных напарников. Позови друга по нику.', ''); }
  CQ.busy = true;
  try {
    const me = CQ.uid;
    const rooms = await db('GET', 'coop_rooms', undefined, false, { orderBy: 'a', equalTo: me, limitToLast: 3 }) || {};
    const rid = Object.keys(rooms).find(k => isObj(rooms[k]) && rooms[k].at > Date.now() - COOP.lobbySec * 1000 && !rooms[k].left);
    if (rid) { const r = rooms[rid]; clearInterval(CQ.timer); CQ = null; db('DELETE', 'coop_queue/' + me).catch(() => { }); return coopLobby(rid, r, 'a', 'Напарник найден!'); }
    const q = await db('GET', 'coop_queue', undefined, false, { orderBy: 'at', startAt: Date.now() - 60000, limitToLast: 10 }) || {};
    const opp = Object.keys(q).find(u => u !== me && isObj(q[u]) && (q[u].b | 0) === CQ.boss);
    if (opp && me > opp) {
      const id = me.slice(0, 8) + opp.slice(0, 8) + Date.now().toString(36);
      const room = { a: opp, b: me, na: String(q[opp].n || '???').slice(0, 20), nb: USER.nick, boss: CQ.boss, seed: Math.floor(Math.random() * 1e9), at: SV_TIME };
      await db('PUT', 'coop_rooms/' + id, room);
      room.at = Date.now(); clearInterval(CQ.timer); CQ = null; db('DELETE', 'coop_queue/' + me).catch(() => { });
      return coopLobby(id, room, 'b', 'Напарник найден!');
    }
  } catch (e) { console.warn('coopPoll', e); } finally { if (CQ) CQ.busy = false; }
}
// лобби: оба кладут героев, ждём напарника, стартуем
async function coopLobby(id, room, role, text) {
  const c = cloud();
  closeModal(); showModal('🤝', 'Лобби: ' + COOP_BOSSES[room.boss | 0].n, text, '', { buttons: [{ t: 'Выйти', f: () => { closeModal(); db('PUT', 'coop_rooms/' + id + '/left/' + c.uid, true).catch(() => { }); coopLobbyStop = true; } }] });
  coopLobbyStop = false;
  try { await db('PUT', 'coop_rooms/' + id + '/d/' + c.uid, myCoopHeroes()); } catch (e) { closeModal(); return showModal('☁', 'Ошибка', 'Не удалось войти в лобби.', 'bad'); }
  const partner = role === 'a' ? room.b : room.a;
  const t0 = Date.now();
  while (!coopLobbyStop && Date.now() - t0 < COOP.lobbySec * 1000) {
    const d = await db('GET', 'coop_rooms/' + id + '/d/' + partner).catch(() => null);
    if (Array.isArray(d) && d.length) {
      const mine = await db('GET', 'coop_rooms/' + id + '/d/' + c.uid).catch(() => null);
      if (!Array.isArray(mine)) break;
      closeModal();
      const ta = role === 'a' ? mine : d, tb = role === 'a' ? d : mine;
      return coopStart(id, room, role, partner, ta, tb);
    }
    const left = await db('GET', 'coop_rooms/' + id + '/left/' + partner).catch(() => null);
    if (left) break;
    await new Promise(r => setTimeout(r, 1500));
  }
  if (!coopLobbyStop) { closeModal(); showModal('🤝', 'Напарник не пришёл', 'Лобби закрыто. Попробуй ещё раз.', ''); }
}
let coopLobbyStop = false;
function coopStart(id, room, role, partner, ta, tb) {
  const team = coopTeamOf(ta.slice(0, 3)).map(t => Object.assign(t, { owner: 0 })).concat(coopTeamOf(tb.slice(0, 3)).map(t => Object.assign(t, { owner: 1 })));
  const def = coopDef(room.boss | 0, team);
  def.coopTeam = team;
  def.coopNet = { id, me: role === 'a' ? 0 : 1, uid: cloud().uid, partner, seed: room.seed >>> 0, names: [room.na, room.nb] };
  switchTab('arena');
  startBattle(0, false, def);
}

// ---------- синхронизация ходов (вызывается из playTick) ----------
// возвращает входы этого хода, когда оба игрока их прислали; иначе null (бой на паузе)
function coopTickInputs() {
  const N = BT.coop; if (!N) return BT.inputs.splice(0);
  const k = BT.tick;
  if (N.sent[k] == null) {
    const mine = BT.inputs.splice(0).filter(x => typeof x === 'string' || N.myIdx.includes(x));
    N.sent[k] = mine.join(',') || '-';
    db('PUT', 'coop_rooms/' + N.id + '/in/' + N.uid + '/' + k, N.sent[k]).catch(() => { N.netErr = (N.netErr || 0) + 1; });
  }
  if (N.bot) return coopMerge(N, N.sent[k], '-');
  if (N.got[k] != null) { N.waitT = 0; coopStatus(''); return coopMerge(N, N.sent[k], N.got[k]); }
  if (!N.waitT) N.waitT = Date.now();
  const waited = (Date.now() - N.waitT) / 1000;
  if (waited > 1.2) coopStatus('⏸ Ждём напарника… ' + Math.max(0, Math.ceil(COOP.waitSec - waited)) + ' с');
  if (waited > COOP.waitSec) {
    N.bot = true; BT.engine.setSmart(N.partnerIdx); coopStatus('');
    feed('🤖 Напарник пропал — его героями управляет бот', 'var(--gold2)');
    return coopMerge(N, N.sent[k], '-');
  }
  if (!N.busy && Date.now() - (N.lastPoll || 0) > COOP.poll) {
    N.busy = true; N.lastPoll = Date.now();
    db('GET', 'coop_rooms/' + N.id + '/in/' + N.partner + '/' + k).then(v => { if (typeof v === 'string') N.got[k] = v; }).catch(() => { }).finally(() => { N.busy = false; });
    db('GET', 'coop_rooms/' + N.id + '/left/' + N.partner).then(v => { if (v && !N.bot) { N.waitT = Date.now() - COOP.waitSec * 1000; } }).catch(() => { });
  }
  return null;
}
function coopMerge(N, mine, theirs) {
  const parse = (s, owner) => (s === '-' ? [] : String(s).split(',')).map(x => /^\d+$/.test(x) ? +x : x).filter(x => typeof x === 'number' ? (owner === 0 ? x < 3 : x >= 3 && x < 6) : /^(taunt:[01]|focus:[01]:(auto|front|back))$/.test(x) && x.split(':')[1] === String(owner));
  const a = N.me === 0 ? mine : theirs, b = N.me === 0 ? theirs : mine;
  return parse(a, 0).concat(parse(b, 1));
}
function coopStatus(t) { const s = document.getElementById('bt-coop-st'); if (s) s.textContent = t; }
function coopInit(def) {
  const n = def.coopNet;
  BT.coop = { id: n.id, me: n.me, uid: n.uid, partner: n.partner, sent: {}, got: {}, myIdx: n.me === 0 ? [0, 1, 2] : [3, 4, 5], partnerIdx: n.me === 0 ? [3, 4, 5] : [0, 1, 2], names: n.names };
}
function coopTaunt() { if (!BT || !BT.coop) return; BT.inputs.push('taunt:' + BT.coop.me); feed('🛡 Ты забираешь агро', 'var(--gold2)'); }
function coopFocus() {
  if (!BT || !BT.coop) return;
  const o = ['auto', 'front', 'back']; BT.focus = o[(o.indexOf(BT.focus || 'auto') + 1) % 3];
  BT.inputs.push('focus:' + BT.coop.me + ':' + BT.focus); renderBtControls(); feed('🎯 ' + FOCUS_NAME[BT.focus] + ' (твои герои)', 'var(--gold2)');
}
function coopLeave() { const N = BT && BT.coop; if (!N) return; db('PUT', 'coop_rooms/' + N.id + '/left/' + N.uid, true).catch(() => { }); }
// итог боя
function coopResult(def, result, st) {
  const B = COOP_BOSSES[def.coop.bi], cs = coopState();
  let msg;
  if (result.win) {
    st.textContent = '🏆 БОСС ПОВЕРЖЕН'; st.style.color = 'var(--ok)'; sfx('win');
    if (!cs.got[B.id]) {
      cs.got[B.id] = 1;
      const it = addEquipment(mainHeroId(), 'arcana'); it.name = B.item + ' · ' + it.name; it.coop = B.id;
      const g = Math.round(rewardScale() * 3); addGems(g);
      msg = B.n + ' повержен вдвоём! ' + it.name + ' + ' + fmt(g) + ' 🔶';
      if (typeof track === 'function') track('coopKills');
    } else msg = B.n + ' повержен! Награду за этого босса ты уже получил сегодня.';
  } else { st.textContent = '💀 ПОРАЖЕНИЕ'; st.style.color = 'var(--danger)'; sfx('lose'); msg = B.n + ' устоял. Договоритесь: кто держит агро, и жмите ульты в один ход, чтобы сломать щит.'; }
  const N = BT.coop; if (N && N.me === 1) setTimeout(() => db('DELETE', 'coop_rooms/' + N.id).catch(() => { }), 8000);   // хост (b) убирает комнату
  return msg;
}
