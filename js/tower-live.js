// ================= «БИТВА ЗА БАШНЮ» — ЖИВОЙ PvP (бета) =================
// Как это работает на бесплатном Firebase:
// 1) Очередь tower_queue/{uid}. Кто видит соперника и у кого uid «больше», создаёт комнату tower_rooms/{id} {a, b, seed}.
// 2) Оба кладут свою колоду в комнату и начинают бой с общим сидом. Каждый у себя считает ОДИН И ТОТ ЖЕ бой.
// 3) По сети идут только действия «какая карта, куда, на каком тике». Действие срабатывает через 1 сек (30 тиков),
//    а убежать вперёд соперника можно не больше чем на 20 тиков — поэтому чужое действие всегда приходит вовремя.
// 4) Сердцебиение: свой тик раз в 0,5 сек. Нет вестей 15 сек или соперник вышел — победа.
// Лимит Spark: 100 одновременных подключений к базе (REST-запросы — не постоянные подключения, но их число и трафик 10 ГБ/мес тоже ограничены).
let TWQ = null;                          // ожидание в очереди
function twLiveQueue() {
  const c = typeof cloud === 'function' ? cloud() : null;
  if (!c) return showModal('☁', 'Нужен онлайн', 'Живой PvP доступен после входа в облачный аккаунт.', '');
  if (TWQ) return;
  TWQ = { uid: c.uid, t0: Date.now(), timer: null };
  showModal('⚡', 'Поиск соперника…', 'Ждём второго игрока (до 60 секунд). Колода — твоя текущая колода Башни.', '', { buttons: [{ t: 'Отмена', f: () => { twLiveCancel(); closeModal(); } }] });
  db('PUT', 'tower_queue/' + c.uid, { n: USER.nick, mmr: Math.min(5000, TS().cups), at: SV_TIME }).catch(() => { });
  TWQ.timer = setInterval(twLivePoll, 1500);
}
async function twLiveCancel() {
  if (!TWQ) return; clearInterval(TWQ.timer); const uid = TWQ.uid; TWQ = null;
  try { await db('DELETE', 'tower_queue/' + uid); } catch (e) { }
}
async function twLivePoll() {
  if (!TWQ || TWQ.busy) return;
  if (Date.now() - TWQ.t0 > TWM.cups.botAfterSec * 1000) { await twLiveCancel(); closeModal(); return twCupBotStart(); }   // 2.4: нет соперника 25 с — бот с похожими кубками
  TWQ.busy = true;
  try {
    const me = TWQ.uid;
    // комната, где я — игрок a?
    const rooms = await db('GET', 'tower_rooms', undefined, false, { orderBy: 'a', equalTo: me, limitToLast: 3 }) || {};
    const rid = Object.keys(rooms).find(k => rooms[k] && rooms[k].at > Date.now() - 90000 && !(rooms[k].left));
    if (rid) return twLiveJoin(rid, rooms[rid], 'a');
    // соперник в очереди?
    const q = await db('GET', 'tower_queue', undefined, false, { orderBy: 'at', startAt: Date.now() - 60000, limitToLast: 10 }) || {};
    const opp = Object.keys(q).filter(u => u !== me).sort((x, y) => Math.abs(q[x].mmr - TS().cups) - Math.abs(q[y].mmr - TS().cups))[0];
    if (opp && me > opp) {
      const id = me.slice(0, 8) + opp.slice(0, 8) + Date.now().toString(36);
      const room = { a: opp, b: me, na: String(q[opp].n || '???').slice(0, 20), nb: USER.nick, seed: Math.floor(Math.random() * 1e9), at: SV_TIME };
      await db('PUT', 'tower_rooms/' + id, room);
      room.at = Date.now();
      return twLiveJoin(id, room, 'b');
    }
  } catch (e) { console.warn('twLivePoll', e); } finally { if (TWQ) TWQ.busy = false; }
}
async function twLiveJoin(id, room, role) {
  const uid = TWQ.uid; clearInterval(TWQ.timer); TWQ = null;
  db('DELETE', 'tower_queue/' + uid).catch(() => { });
  closeModal();
  const deck = twDeck().map(c => ({ c, m: Math.min(2, Math.round((c.startsWith('h:') ? twHeroMul(c.slice(2)) : 1) * twCardMul(c, true) * 100) / 100) }));
  try { await db('PUT', 'tower_rooms/' + id + '/d/' + uid, deck); } catch (e) { return showModal('☁', 'Ошибка', 'Не удалось войти в комнату.', 'bad'); }
  showModal('⚡', 'Соперник найден!', 'Ждём колоду соперника…', '');
  const opp = role === 'a' ? room.b : room.a;
  for (let i = 0; i < 20; i++) {
    const d = await db('GET', 'tower_rooms/' + id + '/d/' + opp).catch(() => null);
    if (Array.isArray(d) && d.length === 8) {
      const clean = twCleanGhost({ n: 'x', deck: d, acts: [] }); if (!clean) break;
      const mine = deck.map(x => twCardSpec(x.c, x.m)), theirs = clean.deck.map(x => twCardSpec(x.c, x.m));
      closeModal();
      const me = role === 'a' ? 0 : 1;
      twStart('live', { seed: room.seed >>> 0, me, deck0: me === 0 ? mine : theirs, deck1: me === 0 ? theirs : mine,
        online: { id, uid, opp, oppName: role === 'a' ? room.nb : room.na, oppMmr: 1000, oppTick: 0, seen: {}, lastBeat: Date.now(), lastOpp: Date.now(), timer: null } });
      TB.online.timer = setInterval(twLiveSync, 400);
      twFlash('Против ' + TB.online.oppName + ' · действия срабатывают через 1 сек');
      return;
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  closeModal(); showModal('⚡', 'Соперник не ответил', 'Попробуй ещё раз.', '');
}
function twOnlineCanStep() { const o = TB.online; return TB.g.tick < o.oppTick + TW.lead || o.gone; }
function twOnlineSend(slot, x, y) {
  const o = TB.online, g = TB.g;
  const a = { u: o.uid, t: g.tick + TW.delay, slot, x: Math.round(x), y: Math.round(y) };
  TB.pending.push({ t: a.t, s: TB.me, slot, x: a.x, y: a.y });
  db('POST', 'tower_rooms/' + o.id + '/acts', a).catch(() => twFlash('Связь пропала — действие могло не дойти'));
  return true;
}
async function twLiveSync() {
  if (!TB || !TB.online || TB.done) return;
  const o = TB.online; if (o.busy) return; o.busy = true;
  try {
    if (Date.now() - o.lastBeat > 450) { o.lastBeat = Date.now(); db('PUT', 'tower_rooms/' + o.id + '/t/' + o.uid, TB.g.tick).catch(() => { }); }
    const r = await db('GET', 'tower_rooms/' + o.id);
    if (r) {
      const ot = r.t && r.t[o.opp];
      if (typeof ot === 'number' && ot > o.oppTick) { o.oppTick = ot; o.lastOpp = Date.now(); }
      Object.keys(r.acts || {}).forEach(k => {
        const a = r.acts[k]; if (o.seen[k] || !a || a.u !== o.opp) return; o.seen[k] = 1;
        TB.pending.push({ t: a.t | 0, s: 1 - TB.me, slot: a.slot | 0, x: +a.x, y: +a.y });
      });
      if (r.left && r.left[o.opp]) o.gone = 'left';
      o.emoSeen = o.emoSeen || {};
      Object.keys(r.emo || {}).forEach(k => { const e = r.emo[k]; if (o.emoSeen[k] || !e || e.u !== o.opp) return; o.emoSeen[k] = 1; const em = TWM.emotes[e.e | 0]; if (em) twShowEmote(1 - TB.me, em); });
    }
    if (!o.gone && Date.now() - o.lastOpp > 15000) o.gone = 'timeout';
    if (o.gone && !TB.g.over) { twEnd(TB.g, TB.me); twFlash(o.gone === 'left' ? 'Соперник вышел — победа!' : 'Соперник пропал — победа!'); }
  } catch (e) { } finally { o.busy = false; }
}
function twLiveLeave() { const o = TB && TB.online; if (!o) return; db('PUT', 'tower_rooms/' + o.id + '/left/' + o.uid, true).catch(() => { }); }
function twLiveResult(win, draw) {
  const T = TS(); const o = TB.online;
  const cupMsg = twCupsChange(win, draw); if (!draw) win ? T.w++ : T.l++;
  const d = todayStr(); if (T.day.d !== d) T.day = { d, n: 0 };
  let gems = 0; if (win && !o.gone) { T.day.n++; if (T.day.n <= TW.rewardedPerDay) { gems = Math.round(rewardScale() * TW.reward.pvpWin); addGems(gems); } }
  twBoardPut();
  clearInterval(o.timer);
  return ' · против ' + o.oppName + cupMsg + (gems ? ' · +' + fmt(gems) + ' 🔶' : '');
}
