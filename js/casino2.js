// ================= 2.12: ⛏ Шахта, 🚀 Ракета, 🎡 Колесо фортуны — свои версии механик, только кристаллы =================
// ⛏ Шахта (по мотивам «Майндропа»): сверху сетка 3×5 инструментов. Кирки бьют свой столбец шахты (число = удары),
//    динамит ломает 3 блока, руда платит. Пробил столбец до дна — открывается сундук с множителем.
//    3+ книги — фриспины, в них шахта НЕ сбрасывается: копаешь всё глубже, сундуки появляются снова.
// 🚀 Ракета (crash): множитель растёт, забери до взрыва. Шанс долететь до ×m = 0.97 / m — отдача 97% при любой тактике.
// 🎡 Колесо: 24 сектора, ×0…×5 и BONUS → бонус-колесо до ×100. Подписи на колесе — это и есть выплаты.
CAS.push(
  { id: 'mine', name: '⛏ Шахта', title: 'Шахта', minBet: 100, theme: 'theme-mine', sub: 'кирки бьют свой столбец · руда платит · до дна — сундук · 3 📖 — фриспины' },
  { id: 'crash', name: '🚀 Ракета', title: 'Ракета', minBet: 50, theme: 'theme-crash', sub: 'множитель растёт — забери до взрыва' },
  { id: 'wheel', name: '🎡 Колесо', title: 'Колесо фортуны', minBet: 100, theme: 'theme-wheel', sub: '24 сектора · BONUS — бонус-колесо до ×40' }
);

// ---------- общий корпус автомата для новых игр ----------
function cab2Shell(g, glass, opt) {
  opt = opt || {};
  return '<div class="slot-machine cas-machine cab-wrap ' + g.theme + '"><div class="cab cab-' + g.id + '" id="cab">' +
    '<div class="cab-top"><div class="cab-bulbs">' + '<i></i>'.repeat(22) + '</div><div class="cab-title">' + g.title + '</div><div class="cab-sub">' + g.sub + '</div><div class="cab-fs" id="cab-fs"></div></div>' +
    '<div class="cab-body"><div class="cab-glass">' + glass + '</div>' + (opt.lever === false ? '' : '<button class="cab-lever" id="cab-lever" data-click="casSpin()" title="Дёрнуть рычаг" aria-label="Крутить"><span class="cab-rod"><b class="cab-knob"></b></span><span class="cab-base"></span></button>') + '</div>' +
    '<div id="cas-info" class="cas-info"></div><div class="cab-tray"><div class="last-win" id="cas-last">&nbsp;</div></div></div>' +
    casBetRow(g, casBet(g.id)) + (opt.extra || '') + '<div id="cas-ctrl" style="margin-top:10px"></div><div class="paytable" id="cas-pay"></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:6px">Только игровые кристаллы. Кристаллы нельзя купить или вывести. <kbd>Пробел</kbd> — ' + (opt.key || 'крутить') + '</div></div>';
}

// ======================= ⛏ ШАХТА =======================
const MINE = {
  // блоки: hp — сколько ударов, v — выплата за разбитый блок (× ставка, до коэффициента pay)
  blocks: {
    dirt: { hp: 1, v: 0, n: 'Земля', c: '#7a5230' }, stone: { hp: 2, v: 0, n: 'Камень', c: '#6d737b' },
    coal: { hp: 2, v: 0.1, n: 'Уголь', c: '#2c2f33', e: '◆' }, iron: { hp: 3, v: 0.3, n: 'Железо', c: '#9a8a7a', e: '◆' },
    gold: { hp: 3, v: 0.8, n: 'Золото', c: '#c9a227', e: '◆' }, diamond: { hp: 4, v: 2.5, n: 'Алмаз', c: '#2fd0d6', e: '◆' },
    obsidian: { hp: 5, v: 0, n: 'Обсидиан', c: '#24133a' }
  },
  rows: [
    [['dirt', 100]],
    [['dirt', 58], ['stone', 38], ['coal', 4]],
    [['stone', 58], ['coal', 12], ['iron', 20], ['gold', 10]],
    [['stone', 40], ['coal', 15], ['iron', 22], ['gold', 15], ['diamond', 4], ['obsidian', 4]],
    [['stone', 30], ['iron', 18], ['gold', 20], ['diamond', 9], ['obsidian', 23]],
    [['stone', 22], ['gold', 22], ['diamond', 14], ['obsidian', 42]]
  ],
  // инструменты в сетке 3×5: [вид, удары, вес]
  tools: [['e', 0, 650], ['pick', 1, 130], ['pick', 2, 90], ['pick', 3, 55], ['pick', 5, 25], ['tnt', 0, 30], ['sc', 0, 26]],
  pickCol: { 1: '#a0763f', 2: '#8d949c', 3: '#e8e8e8', 5: '#3fe0e6' },
  chest: [[2, 34], [3, 26], [5, 18], [10, 12], [20, 6], [50, 3], [100, 1]],
  fsN: 8, fsMore: 2
};
function mineCol() { return MINE.rows.map(w => { const t = casPickW(w); return { t, hp: MINE.blocks[t].hp }; }); }
function mineField() { return [0, 1, 2, 3, 4].map(mineCol); }
function mineTool(free) {
  const t = casPickW(MINE.tools.map(x => [x, x[2]]));
  if (t[0] === 'pick') return { k: 'pick', h: t[1], html: '<div class="cs-sym mn-tool" style="--rc:' + MINE.pickCol[t[1]] + '"><span>⛏</span><b>' + t[1] + '</b></div>' };
  if (t[0] === 'tnt') return { k: 'tnt', html: '<div class="cs-sym mn-tool mn-tnt"><span>🧨</span><b>TNT</b></div>' };
  if (t[0] === 'sc') return { k: 'sc', e: '📖' };
  return { k: 'e', html: '<div class="mn-empty"></div>' };
}
// одна крутка: field — шахта (во фриспинах сохраняется), иначе новая. ev — шаги для анимации
function casMineSpin(bet, field, free, cfg) {
  const C = cfg || CONFIG.casino.mine, f = (field || mineField()).map(col => col.map(b => ({ t: b.t, hp: b.hp }))), f0 = f.map(col => col.map(b => ({ t: b.t, hp: b.hp })));
  const g = []; for (let c = 0; c < 5; c++) g.push([mineTool(free), mineTool(free), mineTool(free)]);
  let x = 0; const ev = [];
  for (let c = 0; c < 5; c++) {
    let col = f[c], i = col.findIndex(b => b.hp > 0); if (i < 0) i = 6;
    for (let ti = 0; ti < 3; ti++) {
      const tl = g[c][ti]; if (tl.k !== 'pick' && tl.k !== 'tnt') continue;
      let h = tl.k === 'pick' ? tl.h : 0, boom = tl.k === 'tnt' ? 3 : 0;
      while ((h > 0 || boom > 0) && i < 6) {
        const b = col[i], B = MINE.blocks[b.t];
        if (boom > 0) { b.hp = 0; boom--; } else { const d = Math.min(h, b.hp); b.hp -= d; h -= d; }
        const brk = b.hp <= 0; if (brk) { x += B.v; i++; }
        ev.push({ c, r: i - (brk ? 1 : 0), brk, v: brk ? B.v : 0, t: b.t, ti, tnt: tl.k === 'tnt' });
        if (i >= 6) {
          const m = casPickW(MINE.chest); x += m; ev.push({ c, chest: m, ti });
          if (free) { col = f[c] = mineCol(); i = 0; ev.push({ c, refill: col.map(b => ({ t: b.t, hp: b.hp })) }); } else { h = 0; boom = 0; }
        }
      }
    }
  }
  const sc = [].concat(...g).filter(s => s.k === 'sc').length;
  let win = bet * x * C.pay; if (!free) win = casFloor(win, bet);
  return { g, f0, f, ev, x: x * C.pay, win, sc };
}
function mineSim(n) {
  let bet = 0, got = 0, fsN = 0, hit = 0;
  for (let i = 0; i < n; i++) {
    bet++; const R = casMineSpin(1, null, false); got += R.win; if (R.win > 0) hit++;
    if (R.sc >= 3) { fsN++; let left = MINE.fsN, f = null; while (left-- > 0) { const F = casMineSpin(1, f, true); f = F.f; got += F.win; if (F.sc >= 3) left += MINE.fsMore; } }
  }
  return { rtp: got / bet, fsEvery: fsN ? n / fsN : 0, hit: hit / n };
}
// ----- интерфейс Шахты -----
function mineBlockHTML(b, extra) {
  if (!b || b.hp <= 0) return '<div class="mn-blk air' + (extra || '') + '"></div>';
  const B = MINE.blocks[b.t], dmg = 1 - b.hp / B.hp;
  return '<div class="mn-blk b-' + b.t + (extra || '') + '" style="--bc:' + B.c + '" title="' + B.n + (B.v ? ' · ×' + +(B.v * CONFIG.casino.mine.pay).toFixed(2) : '') + '">' + (B.e ? '<i>' + B.e + '</i>' : '') + (dmg > 0 ? '<s style="opacity:' + Math.min(0.9, 0.3 + dmg * 0.7).toFixed(2) + '"></s>' : '') + '</div>';
}
function mineFieldHTML(f) {
  let h = '<div class="mn-field">';
  for (let c = 0; c < 5; c++) { h += '<div class="mn-col" data-c="' + c + '">'; for (let r = 0; r < 6; r++) h += mineBlockHTML(f[c][r]); h += '<div class="mn-chest">📦</div></div>'; }
  return h + '</div>';
}
function mineCur() { const st = casState(); return st.mine && st.mine.fs ? st.mine.fs.field : null; }
function mineUI(g) {
  const host = document.getElementById('slot-machine-host');
  host.innerHTML = cab2Shell(g, '<div id="cas-board" class="cas-board cas-mine"></div><div id="mine-field"></div>');
  casSetBoard(casGridOf(5, 3, () => mineTool(false)));
  document.getElementById('mine-field').innerHTML = mineFieldHTML(mineCur() || mineField());
  const P = CONFIG.casino.mine.pay;
  document.getElementById('cas-pay').innerHTML = '<h4>Руда (× ставка за разбитый блок)</h4><div class="paygrid">' + Object.keys(MINE.blocks).map(k => { const B = MINE.blocks[k]; return '<div><span class="mn-mini" style="--bc:' + B.c + '">' + (B.e || '') + '</span> ' + B.n + ' · ' + B.hp + ' уд. <b>' + (B.v ? '×' + +(B.v * P).toFixed(2) : '—') + '</b></div>'; }).join('') + '</div>' +
    '<div class="muted" style="font-size:.75rem;margin-top:6px">⛏ Кирка бьёт свой столбец (число — удары, лишние идут в следующий блок). 🧨 ломает 3 блока подряд. Пробил столбец до дна — 📦 сундук ×' + +(MINE.chest[0][0] * P).toFixed(1) + '…×' + +(MINE.chest[MINE.chest.length - 1][0] * P).toFixed(0) + '. 📖 3+ — ' + MINE.fsN + ' фриспинов: шахта не сбрасывается, сундуки появляются снова. Любой выигрыш — минимум ×' + CONFIG.casino.minWin + ' ставки.</div>';
  mineInfo();
}
function mineInfo() {
  const st = casState(), fs = st.mine && st.mine.fs;
  document.getElementById('cas-info').innerHTML = fs ? 'шахта сохраняется · выиграно ' + gemHTML(fs.win) : '<span class="muted">каждая крутка — новая шахта</span>';
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КОПАТЬ', 'casSpin()', busy.slot);
  casFsHead(fs);
}
function mineCellEl(c, r) { const col = document.querySelectorAll('#mine-field .mn-col')[c]; return col ? col.querySelectorAll('.mn-blk')[r] : null; }
function mineFloat(el, txt, cls) { if (!el) return; const d = document.createElement('div'); d.className = 'mn-float ' + (cls || ''); d.textContent = txt; el.appendChild(d); setTimeout(() => d.remove(), 1100); }
async function minePlay() {
  const st = casState(); st.mine = st.mine || {};
  const fs = st.mine.fs, bet = fs ? fs.bet : casBet('mine');
  if (!fs && !casStart(bet)) return;
  casBusy(true);
  const R = casMineSpin(bet, fs ? fs.field : null, !!fs), win = Math.floor(R.win);
  let newFs = false, more = false;
  if (fs) { fs.left--; fs.win += win; fs.field = R.f; if (R.sc >= 3) { fs.left += MINE.fsMore; fs.total += MINE.fsMore; more = true; } }
  else if (R.sc >= 3) { st.mine.fs = { bet, left: MINE.fsN, total: MINE.fsN, win: 0, field: mineField() }; newFs = true; }
  S.gems += win; save();
  if (fs) casFsHead(fs);
  const fe = document.getElementById('mine-field'); if (fe) fe.innerHTML = mineFieldHTML(R.f0.map(col => col.map(b => ({ t: b.t, hp: b.hp }))));
  await casReelSpin(R.g, () => mineTool(!!fs), fs ? null : casTease(R.g, 2));
  if (casCur !== 'mine') { casBusy(false); updateTop(); return; }
  // анимация ударов: по столбцам параллельно, внутри столбца по очереди
  const fast = casFast(), live = R.f0.map(col => col.map(b => ({ t: b.t, hp: b.hp }))), P = CONFIG.casino.mine.pay;
  const byCol = [0, 1, 2, 3, 4].map(c => R.ev.filter(e => e.c === c));
  await Promise.all(byCol.map(async (list, c) => {
    let lastTi = -1;
    for (const e of list) {
      if (e.ti !== undefined && e.ti !== lastTi) { lastTi = e.ti; const t = casCell(c, e.ti); if (t) { t.classList.add('mn-use'); } await casWait(fast ? 90 : 220); }
      if (e.refill) { e.refill.forEach((b, r) => { live[c][r] = { t: b.t, hp: b.hp }; const el = mineCellEl(c, r); if (el) el.outerHTML = mineBlockHTML(b, ' mn-new'); }); await casWait(fast ? 150 : 350); continue; }
      if (e.chest) {
        const ch = document.querySelectorAll('#mine-field .mn-chest')[c]; if (ch) { ch.classList.add('open'); ch.textContent = '💰'; mineFloat(ch, '×' + +(e.chest * P).toFixed(1), 'chest'); const Rr = ch.getBoundingClientRect(); particles('#ffd36a', 22, Rr.left + Rr.width / 2, Rr.top + Rr.height / 2); }
        sfx('open'); if (e.chest * P >= 10) shakeScreen(5); await casWait(fast ? 350 : 800); continue;
      }
      const b = live[c][e.r]; if (!b) continue;
      if (e.brk) b.hp = 0; else b.hp = Math.max(1, b.hp - 1);
      const el = mineCellEl(c, e.r);
      if (el) {
        if (e.brk) { el.classList.add('mn-break'); if (e.tnt) el.classList.add('mn-boom'); if (e.v) { mineFloat(el, '+×' + +(e.v * P).toFixed(2), e.t === 'diamond' ? 'dia' : ''); } setTimeout(() => { if (el.isConnected) el.outerHTML = mineBlockHTML(null); }, fast ? 120 : 260); }
        else { el.classList.remove('mn-hit'); void el.offsetWidth; el.classList.add('mn-hit'); const s = el.querySelector('s') || el.appendChild(document.createElement('s')); s.style.opacity = '0.6'; }
      }
      sfx(e.tnt ? 'hit' : e.brk && e.v ? 'coin' : 'tick'); if (e.tnt && e.brk) shakeScreen(3);
      await casWait(fast ? (e.brk ? 140 : 90) : (e.brk ? 300 : 180));
    }
  }));
  const fe2 = document.getElementById('mine-field'); if (fe2 && !fs && !newFs) { /* базовая игра: шахта остаётся как после крутки до следующего нажатия */ }
  if (fs && fe2) fe2.innerHTML = mineFieldHTML(R.f);
  let extra = more ? ' · 📖 +' + MINE.fsMore + ' фриспина' : newFs ? ' · 📖 бонус!' : '';
  await casShow(bet, win, extra, !!fs);
  if (newFs) { await casFsIntro(MINE.fsN, '📖', 'Шахта не сбрасывается — копай глубже, сундуки появляются снова · ставка ' + gemHTML(bet)); casBusy(false); const f3 = document.getElementById('mine-field'); if (f3) f3.innerHTML = mineFieldHTML(st.mine.fs.field); mineInfo(); return casNext('mine', minePlay); }
  const f2 = st.mine.fs;
  if (fs && f2 && f2.left <= 0) { st.mine.fs = null; save(); casBusy(false); mineInfo(); feed('⛏ Фриспины в Шахте: +' + fmt(f2.win) + ' 🔶', 'var(--gold2)'); await casFsEnd(f2, '⛏'); casRender(); return; }
  casBusy(false); mineInfo();
  if (fs && f2) casNext('mine', minePlay);
}

// ======================= 🚀 РАКЕТА =======================
// шанс долететь до ×m = edge / m. Точку взрыва не храним заранее: на каждом шаге ракета взрывается с шансом 1 − m_было/m_стало.
function crashGrow(ms) { return Math.floor(Math.exp(0.00011 * ms) * 100) / 100; }
function crashSim(n, cash) { const e = CONFIG.casino.crash.edge; let got = 0; for (let i = 0; i < n; i++) { if (Math.random() >= e) continue; if (Math.random() < 1 / cash) got += cash; } return got / n; }
let crashLive = false;
function crashUI(g) {
  const host = document.getElementById('slot-machine-host'), st = casState(); st.crash = st.crash || { auto: 2, hist: [] };
  if (st.crash.round && !crashLive) { crashSettle(); save(); updateTop(); }
  host.innerHTML = cab2Shell(g, '<div id="cas-board" class="crash-sky"><div class="crash-stars"></div><svg class="crash-path" viewBox="0 0 100 60" preserveAspectRatio="none"><path id="crash-line" d="M0,60"/></svg><div class="crash-rocket" id="crash-rocket">🚀</div><div class="crash-mul" id="crash-mul">×1.00</div></div><div class="crash-hist" id="crash-hist"></div>',
    { lever: false, key: 'старт / забрать', extra: '<div class="bet-row"><span class="muted">Автовывод на</span> <input type="number" id="crash-auto" min="1.01" step="0.01" value="' + (st.crash.auto || 2) + '" data-change="crashSetAuto(this.value)"> <span class="muted">(0 — выключен)</span></div>' });
  document.getElementById('cas-pay').innerHTML = '<h4>Как играть</h4><div class="muted" style="font-size:.8rem">Ставка — и ракета взлетает. Множитель растёт, пока она не взорвётся. Нажми «Забрать» раньше — получишь ставку × множитель. Шанс долететь до ×2 — ' + Math.round(CONFIG.casino.crash.edge / 2 * 100) + '%, до ×10 — ' + +(CONFIG.casino.crash.edge / 10 * 100).toFixed(1) + '%. Отдача ' + Math.round(CONFIG.casino.crash.edge * 100) + '% при любой тактике. Если закрыть игру во время полёта — сработает автовывод, без него ставка сгорит.</div>';
  crashHist(); crashCtrl();
}
function crashSetAuto(v) { const st = casState(); st.crash = st.crash || { hist: [] }; v = +v || 0; st.crash.auto = v >= 1.01 ? Math.min(1000, Math.round(v * 100) / 100) : 0; save(); }
function crashHist() { const st = casState(), h = document.getElementById('crash-hist'); if (h) h.innerHTML = (st.crash.hist || []).map(m => '<span class="' + (m >= 10 ? 'big' : m >= 2 ? 'ok' : 'low') + '">×' + m.toFixed(2) + '</span>').join(''); }
function crashCtrl() {
  const st = casState(), R = st.crash && st.crash.round, el = document.getElementById('cas-ctrl'); if (!el) return;
  el.innerHTML = R ? '<button class="btn gold big" id="cas-btn" data-click="crashCash()">💰 ЗАБРАТЬ ' + fmt(Math.floor(R.bet * (crashNow.m || 1))) + '</button>' : casBtn('🚀 СТАРТ', 'casSpin()', busy.slot);
  document.getElementById('cas-info').innerHTML = R ? 'ставка ' + gemHTML(R.bet) + (R.auto ? ' · автовывод ×' + R.auto : '') : '<span class="muted">забери до взрыва</span>';
}
let crashNow = { m: 1, raf: 0 };
function crashPlay() {
  const st = casState(); st.crash = st.crash || { auto: 2, hist: [] };
  if (st.crash.round) return crashCash();
  const bet = casBet('crash'); if (!casStart(bet)) return;
  const R = st.crash.round = { bet, auto: st.crash.auto || 0 }; save();
  busy.slot = true; crashNow = { m: 1, raf: 0, t0: performance.now(), dead: Math.random() >= CONFIG.casino.crash.edge, cash: 0 };
  const sky = document.getElementById('cas-board'); if (sky) sky.classList.remove('boom', 'won'), sky.classList.add('fly');
  sfx('start'); crashCtrl(); busy.slot = false;
  const speedK = casFast() ? 1.8 : 1;
  const tick = () => {
    if (!st.crash.round || st.crash.round !== R) return;
    const nm = crashGrow((performance.now() - crashNow.t0) * speedK);
    let m = R.auto && nm >= R.auto ? R.auto : nm;
    if (crashNow.dead || (m > crashNow.m && Math.random() < 1 - crashNow.m / m)) return crashBoom(R, crashNow.dead ? 1 : m);
    crashNow.m = m; crashDraw(m);
    if (R.auto && m >= R.auto) return crashCash();
    crashNow.raf = requestAnimationFrame(tick);
  };
  crashLive = true; crashNow.raf = requestAnimationFrame(tick);
}
function crashDraw(m) {
  const t = Math.min(1, Math.log(m) / Math.log(20)), x = 4 + t * 86, y = 56 - Math.min(52, Math.log(m) / Math.log(20) * 52);
  const line = document.getElementById('crash-line'); if (line) line.setAttribute('d', 'M0,60 Q' + (x * 0.6).toFixed(1) + ',60 ' + x.toFixed(1) + ',' + y.toFixed(1));
  const rk = document.getElementById('crash-rocket'); if (rk) { rk.style.left = x + '%'; rk.style.top = (y / 60 * 100) + '%'; }
  const mu = document.getElementById('crash-mul'); if (mu) { mu.textContent = '×' + m.toFixed(2); mu.classList.toggle('hot', m >= 5); }
  const b = document.getElementById('cas-btn'); if (b && casState().crash.round) b.textContent = '💰 ЗАБРАТЬ ' + fmt(Math.floor(casState().crash.round.bet * m));
}
function crashPush(m) { const st = casState(); st.crash.hist = [m].concat(st.crash.hist || []).slice(0, 14); crashHist(); }
function crashBoom(R, m) {
  const st = casState(); cancelAnimationFrame(crashNow.raf); crashLive = false; st.crash.round = null; save();
  const sky = document.getElementById('cas-board'); if (sky) { sky.classList.remove('fly'); sky.classList.add('boom'); }
  const mu = document.getElementById('crash-mul'); if (mu) mu.textContent = '💥 ×' + m.toFixed(2);
  sfx('lose'); shakeScreen(6); haptic('bich');
  crashPush(m); casTrayWin(0, R.bet, '💥 взорвалась на ×' + m.toFixed(2)); crashCtrl(); updateTop();
}
async function crashCash() {
  const st = casState(), R = st.crash && st.crash.round; if (!R) return;
  cancelAnimationFrame(crashNow.raf); crashLive = false; const m = crashNow.m, win = Math.floor(R.bet * m);
  st.crash.round = null; S.gems += win; save();
  // где бы она взорвалась дальше: при условии, что долетела до m, точка взрыва = m / U
  crashPush(Math.floor(m / Math.max(0.001, 1 - Math.random() * 0.999) * 100) / 100);
  const sky = document.getElementById('cas-board'); if (sky) { sky.classList.remove('fly'); sky.classList.add('won'); }
  crashCtrl(); busy.slot = true;
  await casShow(R.bet, win, ' · ×' + m.toFixed(2), false);
  busy.slot = false; crashCtrl();
}
// закрыли игру в полёте: с автовыводом — честно проверяем, долетела бы до него (шанс 1/auto), без — ставка сгорела
function crashSettle() {
  const st = S && S.cas && S.cas.crash, R = st && st.round; if (!R) return;
  st.round = null;
  if (R.auto && Math.random() < 1 / R.auto) { S.gems += Math.floor(R.bet * R.auto); st.hist = [R.auto].concat(st.hist || []).slice(0, 14); }
}

// ======================= 🎡 КОЛЕСО ФОРТУНЫ =======================
const WHEEL = {
  // 24 сектора по кругу; 'B' — бонус-колесо
  main: [0, 1.2, 0, 1.5, 0, 1.2, 0, 2, 0, 1.2, 0, 3, 0, 1.2, 0, 'B', 0, 1.2, 0, 2, 0, 1.2, 0, 1.5],
  bonus: [2, 3, 5, 2, 8, 3, 2, 10, 2, 3, 5, 2, 40, 2, 3, 8, 2, 3, 5, 2, 15, 3, 2, 2],
  colors: { 0: '#2a2f37', 1.2: '#2f6b3a', 1.5: '#2f7a8a', 2: '#3a5bb0', 3: '#7a3ab0', 5: '#b05a2a', B: '#d4a017' }
};
function wheelEV() { const m = WHEEL.main, b = WHEEL.bonus.reduce((a, x) => a + x, 0) / WHEEL.bonus.length; return m.reduce((a, x) => a + (x === 'B' ? b : x), 0) / m.length; }
function wheelSVG(list, big) {
  const n = list.length, R = 100; let h = '<svg viewBox="-105 -105 210 210" class="wh-svg">';
  list.forEach((v, i) => {
    const a0 = (i / n) * 2 * Math.PI - Math.PI / 2 - Math.PI / n, a1 = a0 + 2 * Math.PI / n, x0 = R * Math.cos(a0), y0 = R * Math.sin(a0), x1 = R * Math.cos(a1), y1 = R * Math.sin(a1);
    const col = big ? ['#8a1a1a', '#b8860b', '#1a5a8a', '#5a1a8a'][i % 4] : (WHEEL.colors[v] || '#444'), am = a0 + Math.PI / n, tx = 72 * Math.cos(am), ty = 72 * Math.sin(am);
    h += '<path d="M0,0 L' + x0.toFixed(2) + ',' + y0.toFixed(2) + ' A' + R + ',' + R + ' 0 0,1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + ' Z" fill="' + col + '" stroke="#0b0d10" stroke-width="1"/>';
    h += '<text x="' + tx.toFixed(1) + '" y="' + ty.toFixed(1) + '" transform="rotate(' + (am * 180 / Math.PI + 90).toFixed(1) + ' ' + tx.toFixed(1) + ' ' + ty.toFixed(1) + ')" text-anchor="middle" dominant-baseline="middle" class="wh-t' + (v === 'B' ? ' b' : '') + '">' + (v === 'B' ? 'BONUS' : v === 0 ? '—' : '×' + v) + '</text>';
  });
  return h + '<circle r="16" fill="#111" stroke="#d4a017" stroke-width="3"/></svg>';
}
function wheelUI(g) {
  const host = document.getElementById('slot-machine-host');
  host.innerHTML = cab2Shell(g, '<div id="cas-board" class="wh-wrap"><div class="wh-pointer">▼</div><div class="wh-lights">' + Array.from({ length: 24 }, (_, i) => '<i style="transform:rotate(' + (i * 15) + 'deg) translateY(calc(-0.475 * min(380px, 82vw)));animation-delay:' + (-(i % 3) * 0.4) + 's"></i>').join('') + '</div><div class="wh-disc" id="wh-disc">' + wheelSVG(WHEEL.main) + '</div></div>');
  const nz = WHEEL.main.filter(x => x).length;
  document.getElementById('cas-pay').innerHTML = '<h4>Сектора</h4><div class="muted" style="font-size:.8rem">24 сектора, все равновероятны: выигрыш на ' + nz + ' из 24 (' + Math.round(nz / 24 * 100) + '%). Подпись сектора — это выплата × ставка. BONUS (1 из 24) запускает бонус-колесо: ×2…×' + Math.max(...WHEEL.bonus) + '. Средняя отдача ' + Math.round(wheelEV() * 100) + '%.</div>';
  wheelInfo();
}
function wheelInfo() { document.getElementById('cas-info').innerHTML = '<span class="muted">крути колесо — подписи на секторах и есть выплаты</span>'; document.getElementById('cas-ctrl').innerHTML = casBtn('🎡 КРУТИТЬ', 'casSpin()', busy.slot); }
let wheelRot = 0;
function wheelTurn(disc, idx, n, ms) {
  return new Promise(res => {
    const seg = 360 / n, jitter = (Math.random() - 0.5) * seg * 0.7;
    const target = 360 * (casFast() ? 3 : 6) + (360 - idx * seg) + jitter;
    wheelRot = wheelRot - (wheelRot % 360) + target;
    disc.style.transition = 'transform ' + ms + 'ms cubic-bezier(.12,.6,.15,1)'; disc.style.transform = 'rotate(' + wheelRot + 'deg)';
    let last = 0; const t0 = performance.now(); const tk = () => { const k = (performance.now() - t0) / ms; if (k >= 1) return; const p = Math.floor(k * 40 * (1 - k)); if (p !== last) { last = p; sfx('tick'); } requestAnimationFrame(tk); }; tk();
    setTimeout(res, ms + 60);
  });
}
async function wheelPlay() {
  const bet = casBet('wheel'); if (!casStart(bet)) return;
  casBusy(true);
  const i = Math.floor(Math.random() * WHEEL.main.length), v = WHEEL.main[i];
  let j = -1, win = 0;
  if (v === 'B') { j = Math.floor(Math.random() * WHEEL.bonus.length); win = bet * WHEEL.bonus[j]; } else win = bet * v;
  win = Math.floor(win); S.gems += win; save();
  const disc = document.getElementById('wh-disc'), cab = document.getElementById('cab');
  const lever = document.getElementById('cab-lever'); if (lever) { lever.classList.remove('pull'); void lever.offsetWidth; lever.classList.add('pull'); }
  sfx('start');
  if (disc) await wheelTurn(disc, i, WHEEL.main.length, casFast() ? 1500 : 4200);
  if (casCur !== 'wheel') { casBusy(false); updateTop(); return; }
  if (v === 'B') {
    sfx('open'); if (cab) { cab.classList.remove('flash'); void cab.offsetWidth; cab.classList.add('flash'); }
    casFloat('BONUS!', 'fs'); await casWait(casFast() ? 400 : 1200);
    const wrap = document.getElementById('cas-board');
    if (wrap) { wrap.classList.add('bonus'); wrap.querySelector('#wh-disc').outerHTML = '<div class="wh-disc" id="wh-disc">' + wheelSVG(WHEEL.bonus, true) + '</div>'; wheelRot = 0; }
    await casWait(300);
    const d2 = document.getElementById('wh-disc'); if (d2) await wheelTurn(d2, j, WHEEL.bonus.length, casFast() ? 1800 : 5000);
    await casShow(bet, win, ' · бонус ×' + WHEEL.bonus[j], false);
    if (!casWinTier(win / bet)) await casBigWin(win, bet, { tier: 1, title: '🎡 БОНУС-КОЛЕСО' });
    const w2 = document.getElementById('cas-board'); if (w2) { w2.classList.remove('bonus'); w2.querySelector('#wh-disc').outerHTML = '<div class="wh-disc" id="wh-disc">' + wheelSVG(WHEEL.main) + '</div>'; wheelRot = 0; }
  } else await casShow(bet, win, v ? ' · ×' + v : '', false);
  casBusy(false); wheelInfo();
}

// ---------- регистрация ----------
CAS_UI.mine = mineUI; CAS_UI.crash = crashUI; CAS_UI.wheel = wheelUI;
CAS_PLAY.mine = minePlay; CAS_PLAY.crash = crashPlay; CAS_PLAY.wheel = wheelPlay;
CAS_LOCK.push(st => !!(st.mine && st.mine.fs), st => !!(st.crash && st.crash.round));
