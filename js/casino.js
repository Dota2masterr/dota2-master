// ================= 2.10: ещё 4 игры во вкладке «Слоты» — свои версии популярных механик, ставки только кристаллами =================
// 🐺 Псарня Бистмастера — 5×3, 20 линий, вайлды ×2/×3 на 2–4 барабанах, во фриспинах вайлды прилипают.
// 🐂 Лабиринт Кентавра — 5×3, 10 линий, множитель растёт с каждой выигрышной круткой подряд (×1→×2→×3→×5→×10).
// ☁ Небеса Зевса — 6×5, платят 8+ одинаковых в любом месте, каскады, сферы-множители; во фриспинах множитель копится.
// 💣 Мины — поле 5×5, выбираешь число мин, открываешь клетки, множитель растёт, можно забрать в любой момент.
// Все расчёты — чистые функции casDogSpin / casMazeSpin / casOlySpin; их же проверяет casSim (отдача ~90–96%, у Мин ровно 97%).

const CAS = [
  { id: 'dog', name: '🐺 Псарня', title: 'Псарня Бистмастера', minBet: 100, theme: 'theme-dog', sub: '5×3 · 20 линий · вайлды ×2/×3 · во фриспинах вайлды прилипают' },
  { id: 'maze', name: '🐂 Лабиринт', title: 'Лабиринт Кентавра', minBet: 100, theme: 'theme-maze', sub: '5×3 · 10 линий · множитель растёт с каждой победой подряд' },
  { id: 'oly', name: '☁ Небеса', title: 'Небеса Зевса', minBet: 100, theme: 'theme-oly', sub: '6×5 · 8+ одинаковых где угодно · каскады · сферы ×2…×50' },
  { id: 'mines', name: '💣 Мины', title: 'Мины', minBet: 50, theme: 'theme-mines', sub: 'поле 5×5 · выбери число мин · открывай клетки и забирай вовремя' }
];
let casCur = null;
const casBets = {};
function casState() { S.cas = S.cas || {}; return S.cas; }

// ---------- общие помощники ----------
function casPickW(list) { const t = list.reduce((a, x) => a + x[1], 0); let r = Math.random() * t; for (const x of list) { r -= x[1]; if (r < 0) return x[0]; } return list[list.length - 1][0]; }
function casIcon(sym) {
  if (!sym) return '';
  if (sym.k === 'sc') return '<div class="cs-sym cs-sc"><span>' + (sym.e || '⭐') + '</span><small>BONUS</small></div>';
  if (sym.k === 'wild') return '<div class="cs-sym cs-wild"><img src="' + sym.img + '" referrerpolicy="no-referrer" alt=""><small>WILD ×' + sym.m + '</small></div>';
  if (sym.k === 'orb') return '<div class="cs-sym cs-orb"><span>×' + sym.m + '</span></div>';
  return '<div class="cs-sym" style="--rc:' + (sym.c || '#888') + '"><img src="' + sym.img + '" referrerpolicy="no-referrer" alt=""></div>';
}
// 2.11: «ощущение заработка» — любой выигрыш в основной игре не меньше minWin × ставка (общая отдача всё равно < 100%)
function casFloor(win, bet) { return win > 0 ? Math.max(win, bet * (CONFIG.casino.minWin || 0)) : 0; }
const CS_ITEM = n => STEAM + 'items/' + n + '.png';

// ======================= 🐺 ПСАРНЯ =======================
const DOG = {
  lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[1,0,0,0,1],[1,2,2,2,1],[0,0,1,2,2],[2,2,1,0,0],[1,2,1,0,1],[1,0,1,2,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,0,2,0,0],[2,2,0,2,2],[0,2,0,2,0]],
  // [id, картинка, вес, выплата за 3/4/5 на линию (× ставка/20), цвет]
  syms: [
    ['lycan', () => heroIcon('lycan'), 4, [2.5, 9, 26], '#ade55c'],
    ['ursa', () => heroIcon('ursa'), 5, [1.8, 5, 18], '#e4ae39'],
    ['brood', () => heroIcon('broodmother'), 6, [1, 3.5, 10], '#c8a4ff'],
    ['chen', () => heroIcon('chen'), 7, [0.7, 1.8, 7], '#4fb6d8'],
    ['branch', () => CS_ITEM('branches'), 16, [1, 2.5, 10], '#8a8f98'],
    ['tango', () => CS_ITEM('tango'), 16, [1, 2.5, 10], '#8a8f98'],
    ['salve', () => CS_ITEM('flask'), 16, [0.5, 1.5, 5], '#8a8f98'],
    ['clarity', () => CS_ITEM('clarity'), 16, [0.5, 1.5, 5], '#8a8f98']
  ],
  wild: 0.04, sc: 0.04, wildM: [[2, 75], [3, 25]], fsN: [[7, 30], [8, 25], [9, 20], [10, 12], [12, 8], [15, 5]]
};
function dogSym(reel, sticky) {
  const D = DOG, r = Math.random();
  if ((reel === 0 || reel === 2 || reel === 4) && r < D.sc) return { k: 'sc', e: '🐾' };
  if (reel >= 1 && reel <= 3 && r < D.sc + D.wild) return { k: 'wild', m: casPickW(D.wildM), img: spellIcon('beastmaster_primal_roar') };
  const s = casPickW(D.syms.map(x => [x, x[2]]));
  return { k: 'n', id: s[0], img: s[1](), c: s[4] };
}
// одна крутка; sticky — прилипшие вайлды фриспинов { 'r,c': wild }
function casDogSpin(bet, cfg, sticky) {
  const pay = (cfg || CONFIG.casino.dog).pay, g = [];
  for (let r = 0; r < 5; r++) { g.push([0, 1, 2].map(c => (sticky && sticky[r + ',' + c]) || dogSym(r))); }
  let win = 0; const lines = [];
  DOG.lines.forEach((ln, li) => {
    const s = ln.map((row, r) => g[r][row]);
    if (s[0].k === 'sc') return;
    let base = null; for (const x of s) { if (x.k === 'n') { base = x.id; break; } if (x.k === 'sc') break; }
    if (!base) base = DOG.syms[0][0];   // вся линия из вайлдов — платит как высший символ
    let n = 0, mul = 0;
    for (const x of s) { if (x.k === 'wild') { n++; mul += x.m; } else if (x.k === 'n' && x.id === base) n++; else break; }
    if (n < 3) return;
    const sp = DOG.syms.find(y => y[0] === base);
    const w = bet / 20 * sp[3][n - 3] * (mul || 1) * pay;
    win += w; lines.push({ li, n, w });
  });
  const sc = [].concat(...g).filter(x => x.k === 'sc').length;
  if (!sticky) win = casFloor(win, bet);
  return { g, win, lines, sc };
}

// ======================= 🐂 ЛАБИРИНТ =======================
const MAZE = {
  ladder: [1, 2, 3, 5, 10],
  syms: [['arcana', 'centaur', 3], ['immortal', 'elder_titan', 7], ['mythical', 'magnataur', 11], ['rare', 'spirit_breaker', 18], ['uncommon', 'tusk', 28], ['common', 'earthshaker', 40]],
  sc: 0.022
};
function mazeSym() {
  if (Math.random() < MAZE.sc) return { k: 'sc', e: '🐂' };
  const s = casPickW(MAZE.syms.map(x => [x, x[2]]));
  return { k: 'n', id: s[0], img: heroIcon(s[1]), c: RARITY_COLOR[s[0]] };
}
function casMazeSpin(bet, step, cfg, free) {
  const C = cfg || CONFIG.casino.maze, m = CONFIG.slots.arc5, g = [];
  for (let r = 0; r < 5; r++) g.push([mazeSym(), mazeSym(), mazeSym()]);
  let x = 0; const lines = [];
  SLOT_LINES[5].forEach((ln, li) => {
    const s = ln.map((row, r) => g[r][row]); if (s[0].k !== 'n') return;
    let n = 1; while (n < 5 && s[n].k === 'n' && s[n].id === s[0].id) n++;
    const v = n === 5 ? m.p5[s[0].id] : n === 4 ? m.p4[s[0].id] : n === 3 ? m.p3[s[0].id] : 0;
    if (v) { x += v / 10; lines.push({ li, n }); }
  });
  const mul = MAZE.ladder[Math.min(step, MAZE.ladder.length - 1)];
  let win = bet * x * C.pay * mul; if (!free) win = casFloor(win, bet);
  return { g, win, lines, mul, sc: [].concat(...g).filter(s => s.k === 'sc').length };
}

// ======================= ☁ НЕБЕСА ЗЕВСА =======================
const OLY = {
  // [id, картинка, вес, выплата за 8–9 / 10–11 / 12+ (× ставка), цвет]
  syms: [
    ['crown', () => spellIcon('zuus_thundergods_wrath'), 5, [6, 15, 30], '#ade55c'],
    ['bolt', () => spellIcon('zuus_lightning_bolt'), 7, [1.5, 6, 15], '#e4ae39'],
    ['arc', () => spellIcon('zuus_arc_lightning'), 8, [1.2, 3, 9], '#c8a4ff'],
    ['cloud', () => spellIcon('zuus_cloud'), 9, [0.9, 1.2, 7.2], '#4fb6d8'],
    ['gem1', () => CS_ITEM('gem'), 11, [1, 1.5, 10], '#8a8f98'],
    ['gem2', () => CS_ITEM('ultimate_orb'), 20, [0.8, 1.2, 8], '#8a8f98'],
    ['gem3', () => CS_ITEM('point_booster'), 21, [0.5, 1, 5], '#8a8f98'],
    ['gem4', () => CS_ITEM('energy_booster'), 22, [0.4, 0.9, 4], '#8a8f98'],
    ['gem5', () => CS_ITEM('vitality_booster'), 23, [0.25, 0.75, 2], '#8a8f98']
  ],
  sc: 0.018, orbBase: 0.004, orbFs: 0.007,
  orbs: [[2, 30], [3, 20], [4, 14], [5, 11], [6, 8], [8, 6], [10, 4], [12, 3], [15, 2], [20, 1], [25, 0.6], [50, 0.25]]
};
function olySym(free) {
  const r = Math.random();
  if (r < OLY.sc) return { k: 'sc', e: '⚡' };
  if (r < OLY.sc + (free ? OLY.orbFs : OLY.orbBase)) return { k: 'orb', m: casPickW(OLY.orbs) };
  const s = casPickW(OLY.syms.map(x => [x, x[2]]));
  return { k: 'n', id: s[0], img: s[1](), c: s[4] };
}
// крутка с каскадами: steps — кадры для анимации, x — выигрыш до множителя, orbs — сумма сфер
function casOlySpin(bet, free, cfg) {
  const C = cfg || CONFIG.casino.oly;
  let g = []; for (let c = 0; c < 6; c++) { g.push([]); for (let r = 0; r < 5; r++) g[c].push(olySym(free)); }
  const steps = [g.map(col => col.slice())]; let x = 0, orbs = 0, guard = 0;
  const sc = [].concat(...g).filter(s => s.k === 'sc').length;
  while (guard++ < 40) {
    const cnt = {}; g.forEach(col => col.forEach(s => { if (s.k === 'n') cnt[s.id] = (cnt[s.id] || 0) + 1; }));
    const wins = Object.entries(cnt).filter(([, n]) => n >= 8);
    if (!wins.length) break;
    wins.forEach(([id, n]) => { const p = OLY.syms.find(y => y[0] === id)[3]; x += p[n >= 12 ? 2 : n >= 10 ? 1 : 0]; });
    const kill = new Set(wins.map(w => w[0]));
    g = g.map(col => { const keep = col.filter(s => !(s.k === 'n' && kill.has(s.id))); while (keep.length < 5) keep.unshift(olySym(free)); return keep; });
    steps.push(g.map(col => col.slice()));
  }
  if (x > 0) g.forEach(col => col.forEach(s => { if (s.k === 'orb') orbs += s.m; }));
  return { g, steps, x: x * C.pay, orbs, sc, win: free ? bet * x * C.pay * (orbs || 1) : casFloor(bet * x * C.pay * (orbs || 1), bet) };
}

// ======================= 💣 МИНЫ =======================
// честный множитель: 0.97 × (25 C k) / ((25−m) C k) — за k открытых безопасных клеток при m минах
function minesMul(m, k) { let v = 1; for (let i = 0; i < k; i++) v *= (25 - i) / (25 - m - i); return Math.floor(v * CONFIG.casino.mines.edge * 100) / 100; }

// ======================= ОТДАЧА (для тестов и баланса) =======================
function casSim(id, n) {
  let bet = 0, got = 0, fsN = 0, hit = 0, plus = 0; const H = w => { if (w > 0) hit++; if (w >= 1) plus++; };
  if (id === 'dog') for (let i = 0; i < n; i++) { bet += 1; const R = casDogSpin(1); got += R.win; H(R.win); if (R.sc >= 3) { fsN++; let left = casPickW(DOG.fsN); const st = {}; while (left-- > 0) { const F = casDogSpin(1, null, st); got += F.win; F.g.forEach((col, r) => col.forEach((s, c) => { if (s.k === 'wild') st[r + ',' + c] = s; })); } } }
  if (id === 'maze') { let step = 0; for (let i = 0; i < n; i++) { bet += 1; const R = casMazeSpin(1, step); got += R.win; H(R.win); step = R.win > 0 ? step + 1 : 0; if (R.sc >= 3) { fsN++; let st = 0; for (let j = 0; j < CONFIG.casino.maze.fs; j++) { const F = casMazeSpin(1, st, null, true); got += F.win; if (F.win > 0) st++; } } } }
  if (id === 'oly') for (let i = 0; i < n; i++) { bet += 1; const R = casOlySpin(1, false); got += R.win; H(R.win); if (R.sc >= 4) { fsN++; let acc = 0, left = CONFIG.casino.oly.fs; while (left-- > 0) { const F = casOlySpin(1, true); if (F.x > 0) { acc += F.orbs; got += F.x * (acc || 1); } if (F.sc >= 3) left += 5; } } }
  return { rtp: got / bet, fsEvery: fsN ? n / fsN : 0, hit: hit / n, plus: plus / n };
}

// ======================= ИНТЕРФЕЙС =======================
function casOpen(id) {
  if (busy.slot || (typeof autoTotal !== 'undefined' && autoTotal) || (typeof fsActive === 'function' && (fsActive() || pickActive()))) return;
  casCur = id; casRender();
}
function casClose() { casCur = null; }
function casBet(id) { const g = CAS.find(x => x.id === id); return Math.max(g.minBet, Math.min(CONFIG.slotsMaxBet, casBets[id] || g.minBet)); }
function casSetBet(v) { if (!casCur || busy.slot || casLocked()) return; const g = CAS.find(x => x.id === casCur); v = Math.floor(+v || g.minBet); casBets[casCur] = Math.round(Math.max(g.minBet, Math.min(CONFIG.slotsMaxBet, v, Math.max(g.minBet, S.gems))) / g.minBet) * g.minBet; const i = document.getElementById('cas-bet'); if (i && CAB[casCur]) { i.value = casBets[casCur]; casInfo(); } else casRender(); }
function casChBet(d) { casSetBet(casBet(casCur) + d); }
function casLocked() { const st = casState(); return !!((st.dog && st.dog.fs) || (st.maze && st.maze.fs) || (st.oly && st.oly.fs) || (st.mines && st.mines.round)); }

// 2.11: Псарня, Лабиринт и Небеса — в корпусе «однорукого бандита»: лампы, стекло, рычаг, лоток для выигрыша
const CAB = { dog: { cols: 5, rows: 3 }, maze: { cols: 5, rows: 3 }, oly: { cols: 6, rows: 5 } };
function casBetRow(g, bet) {
  return '<div class="bet-row"><button class="btn sm" data-click="casChBet(-10000)">−10к</button><button class="btn sm" data-click="casChBet(-' + g.minBet + ')">−</button>' +
    '<input type="number" id="cas-bet" min="' + g.minBet + '" step="' + g.minBet + '" value="' + bet + '" data-change="casSetBet(this.value)"><img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">' +
    '<button class="btn sm" data-click="casChBet(' + g.minBet + ')">+</button><button class="btn sm" data-click="casChBet(10000)">+10к</button><button class="btn sm ghost" data-click="casSetBet(1e9)">MAX</button></div>';
}
function casRender() {
  const g = CAS.find(x => x.id === casCur); if (!g) return;
  document.querySelectorAll('#slot-subtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === 'cas:' + g.id));
  const host = document.getElementById('slot-machine-host'), bet = casBet(g.id), foot = '<div class="muted" style="font-size:.72rem;margin-top:6px">Только игровые кристаллы. Кристаллы нельзя купить или вывести. <kbd>Пробел</kbd> — крутить</div>';
  if (!CAB[g.id]) {
    host.innerHTML = '<div class="slot-machine cas-machine ' + g.theme + '"><div class="sm-title">' + g.title + '</div><div class="sm-sub">' + g.sub + '</div>' +
      '<div id="cas-board" class="cas-board cas-' + g.id + '"></div><div id="cas-info" class="cas-info"></div>' + casBetRow(g, bet) +
      '<div id="cas-ctrl" style="margin-top:10px"></div><div class="last-win" id="cas-last"></div><div class="paytable" id="cas-pay"></div>' + foot + '</div>';
    return minesUI();
  }
  const C = CAB[g.id];
  host.innerHTML = '<div class="slot-machine cas-machine cab-wrap ' + g.theme + '">' +
    '<div class="cab cab-' + g.id + '" id="cab">' +
    '<div class="cab-top"><div class="cab-bulbs">' + '<i></i>'.repeat(22) + '</div><div class="cab-title">' + g.title + '</div><div class="cab-sub">' + g.sub + '</div><div class="cab-fs" id="cab-fs"></div></div>' +
    '<div class="cab-body"><div class="cab-glass"><div id="cas-board" class="cas-board cas-' + g.id + '"></div><div class="cab-mul" id="cab-mul"></div></div>' +
    '<button class="cab-lever" id="cab-lever" data-click="casSpin()" title="Дёрнуть рычаг" aria-label="Крутить"><span class="cab-rod"><b class="cab-knob"></b></span><span class="cab-base"></span></button></div>' +
    '<div id="cas-info" class="cas-info"></div>' +
    '<div class="cab-tray"><div class="last-win" id="cas-last">&nbsp;</div></div>' +
    '</div>' + casBetRow(g, bet) +
    '<div id="cas-ctrl" style="margin-top:10px"></div><div class="paytable" id="cas-pay"></div>' + foot + '</div>';
  const st = casState(), fs = st[g.id] && st[g.id].fs, sticky = (g.id === 'dog' && fs) ? fs.sticky : {};
  const rnd = { dog: c => dogSym(c), maze: () => mazeSym(), oly: () => olySym(!!fs) }[g.id];
  casSetBoard(casGridOf(C.cols, C.rows, (c, r) => sticky[c + ',' + r] || rnd(c)));
  if (g.id === 'dog') casMarkSticky();
  document.getElementById('cas-pay').innerHTML = casPayHTML(g.id);
  casInfo();
}
function casSpin() {
  if (!casCur || busy.slot || modalOpen || document.querySelector('.cbw-ov,.cfs-ov')) return;
  ({ dog: dogPlay, maze: mazePlay, oly: olyPlay, mines: () => { } })[casCur]();
}
function casGrid(cols, rows, get, hl) {
  let h = '<div class="cs-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) h += '<div class="cs-cell' + (hl && hl.has(c + ',' + r) ? ' hl' : '') + '">' + casIcon(get(c, r)) + '</div>';
  return h + '</div>';
}
// для Мин (старая простая выплата)
function casPay(bet, win, fsMsg) {
  if (win > 0) addGems(Math.floor(win));
  const lw = document.getElementById('cas-last');
  if (lw) { lw.innerHTML = win > 0 ? '✨ +' + gemHTML(Math.floor(win)) + (fsMsg || '') : (fsMsg || '😢 мимо'); lw.className = 'last-win' + (win > 0 ? '' : ' lose'); }
  if (win >= bet * 50) hype('НИШТЯК'); else if (win > 0) hype('21');
  updateTop(); save();
}
function casStart(bet) { if (!canPay(bet)) { showModal('🔶', 'Мало кристаллов', 'Ставка ' + fmt(bet) + ' 🔶', 'bad'); return false; } addGems(-bet); S.spins++; track('slotSpins'); updateTop(); return true; }
function casBtn(txt, fn, dis) { return '<button class="btn green big" id="cas-btn" ' + (dis ? 'disabled' : '') + ' data-click="' + fn + '">' + txt + '</button>'; }

// ---------- барабаны ----------
function casFast() { return speed === 'fast' || !motionOK(); }
function casWait(ms) { return new Promise(r => setTimeout(r, ms)); }
function casGridOf(cols, rows, get) { const g = []; for (let c = 0; c < cols; c++) { g.push([]); for (let r = 0; r < rows; r++) g[c].push(get(c, r)); } return g; }
function casCellHTML(sym, cls, style) { return '<div class="cs-cell' + (cls ? ' ' + cls : '') + '"' + (style ? ' style="' + style + '"' : '') + '>' + casIcon(sym) + '</div>'; }
// сетка g[барабан][ряд] → барабаны; cls(c, r) — доп. класс клетки
function casSetBoard(g, cls) {
  const b = document.getElementById('cas-board'); if (!b) return;
  const cols = g.length, rows = g[0].length;
  let h = '<div class="cab-reels" style="--cols:' + cols + ';--rows:' + rows + '">';
  for (let c = 0; c < cols; c++) { h += '<div class="cab-reel"><div class="cab-strip">'; for (let r = 0; r < rows; r++) { const k = cls && cls(c, r); h += casCellHTML(g[c][r], k && k[0], k && k[1]); } h += '</div></div>'; }
  b.innerHTML = h + '<svg class="cab-lines"></svg></div>';
}
function casCell(c, r) { const reel = document.querySelectorAll('#cas-board .cab-reel')[c]; return reel ? reel.querySelectorAll('.cs-cell')[r] : null; }
// интрига: с какого барабана тянуть, если на предыдущих уже need+ бонус-символов
function casTease(g, need) { let n = 0; for (let c = 0; c < g.length; c++) { if (n >= need) return c; n += g[c].filter(s => s.k === 'sc').length; } return null; }
// крутит все барабаны к итоговой сетке; барабаны останавливаются по очереди слева направо
function casReelSpin(final, rnd, tease, keep) {
  const reels = [...document.querySelectorAll('#cas-board .cab-reel')]; if (!reels.length) return Promise.resolve();
  const svg = document.querySelector('#cas-board .cab-lines'); if (svg) svg.innerHTML = '';
  const rows = final[0].length, fast = casFast(), per = fast ? 34 : 62;
  const lever = document.getElementById('cab-lever'); if (lever) { lever.classList.remove('pull'); void lever.offsetWidth; lever.classList.add('pull'); }
  const cab = document.getElementById('cab'); if (cab) cab.classList.remove('win', 'win2', 'win3');
  sfx('start');
  let prevDur = 0;
  return Promise.all(reels.map((reel, c) => new Promise(res => {
    const strip = reel.querySelector('.cab-strip'), ch = reel.clientHeight / rows || 80;
    // прилипшие вайлды не крутятся — барабан с ними просто стоит
    if (keep && final[c].every((s, r) => keep(c, r))) { setTimeout(res, 50); return; }
    const old = [...strip.children].map(x => x.innerHTML);
    let n = (fast ? 5 : 9) + c * (fast ? 2 : 4); const late = tease != null && c >= tease;
    if (late) n += (fast ? 10 : 22) + (c - tease) * (fast ? 5 : 12);
    let h = ''; for (let r = 0; r < rows; r++) h += casCellHTML(final[c][r]);
    for (let i = 0; i < n; i++) h += casCellHTML(rnd(c));
    old.forEach(x => { h += '<div class="cs-cell">' + x + '</div>'; });
    strip.innerHTML = h; strip.style.height = 'auto';
    strip.querySelectorAll('.cs-cell').forEach(x => { x.style.height = ch + 'px'; });
    strip.style.transition = 'none'; strip.style.transform = 'translateY(' + (-(rows + n) * ch) + 'px)'; void strip.offsetWidth;
    const dur = Math.round((rows + n) * per * (rows > 3 ? 0.7 : 1));
    if (late) { const at = prevDur; setTimeout(() => reel.classList.add('tease'), at); }
    prevDur = dur;
    strip.classList.add('spin');
    strip.style.transition = 'transform ' + dur + 'ms cubic-bezier(.3,.08,.25,1.06)';
    strip.style.transform = 'translateY(0)';
    setTimeout(() => strip.classList.remove('spin'), dur * 0.82);
    setTimeout(() => {
      strip.style.transition = 'none'; strip.style.transform = ''; strip.style.height = '';
      let f = ''; for (let r = 0; r < rows; r++) f += casCellHTML(final[c][r]); strip.innerHTML = f;
      reel.classList.remove('tease'); reel.classList.add('stop'); setTimeout(() => reel.classList.remove('stop'), 260);
      if (final[c].some(s => s.k === 'sc')) { sfx('coin'); strip.querySelectorAll('.cs-sc').forEach(e => e.parentElement.classList.add('sc-land')); } else sfx('tick');
      res();
    }, dur + 30);
  })));
}
// линии выигрыша поверх барабанов
function casDrawLines(lines, rowsOf) {
  const box = document.querySelector('#cas-board .cab-reels'), svg = box && box.querySelector('.cab-lines'); if (!svg || !lines.length) return;
  const B = box.getBoundingClientRect(), reels = [...box.querySelectorAll('.cab-reel')];
  svg.setAttribute('viewBox', '0 0 ' + B.width + ' ' + B.height); svg.setAttribute('width', B.width); svg.setAttribute('height', B.height);
  svg.innerHTML = lines.map(w => '<polyline class="cab-line" style="animation-delay:' + (lines.indexOf(w) * 90) + 'ms" points="' + rowsOf(w.li).map((row, c) => { const R = reels[c].getBoundingClientRect(); return (R.left - B.left + R.width / 2).toFixed(0) + ',' + (R.top - B.top + R.height * (row + 0.5) / 3).toFixed(0); }).join(' ') + '" stroke="' + LINE_COLORS[w.li % LINE_COLORS.length] + '"/>').join('');
  lines.forEach(w => rowsOf(w.li).slice(0, w.n).forEach((row, c) => { const el = casCell(c, row); if (el) el.classList.add('hl'); }));
}
function casMarkSticky() { const st = casState(), fs = st.dog && st.dog.fs; if (!fs) return; Object.keys(fs.sticky).forEach(k => { const [c, r] = k.split(',').map(Number); const el = casCell(c, r); if (el) el.classList.add('sticky'); }); }
function casFloat(text, cls) {
  const g = document.querySelector('#cab .cab-glass'); if (!g) return;
  const d = document.createElement('div'); d.className = 'cab-float ' + (cls || ''); d.textContent = text; g.appendChild(d); setTimeout(() => d.remove(), 1400);
}
function casBusy(on) { busy.slot = on; const b = document.getElementById('cas-btn'); if (b) b.disabled = on; const l = document.getElementById('cab-lever'); if (l) l.disabled = on; }
function casTrayWin(win, bet, extra) {
  const lw = document.getElementById('cas-last'); if (!lw) return;
  if (win > 0) {
    lw.className = 'last-win tray-win'; const t0 = performance.now(), dur = casFast() ? 300 : Math.min(1200, 300 + win / bet * 40);
    const tick = () => { const k = Math.min(1, (performance.now() - t0) / dur); lw.innerHTML = '✨ +' + gemHTML(Math.floor(win * k)) + (extra || ''); if (k < 1) requestAnimationFrame(tick); };
    tick();
  } else { lw.innerHTML = extra ? extra.replace(/^ · /, '') : '&nbsp;'; lw.className = 'last-win lose'; }
}

// ---------- эффекты крупного выигрыша и фриспинов ----------
const CAS_TIERS = [null, { t: 'КРУПНЫЙ ВЫИГРЫШ', c: '#ffd36a' }, { t: 'МЕГА ВЫИГРЫШ', c: '#ff8a3a' }, { t: 'ЭПИЧЕСКИЙ ВЫИГРЫШ', c: '#ff5ad8' }];
function casWinTier(x) { return x >= 80 ? 3 : x >= 30 ? 2 : x >= 12 ? 1 : 0; }
function casCoinRain(box, n) {
  if (!motionOK() || !SETTINGS.particles) return;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('img'); c.src = GEM_IMG; c.className = 'cbw-coin'; c.alt = '';
    c.style.cssText = 'left:' + (Math.random() * 100) + '%;animation-delay:' + (Math.random() * 1600) + 'ms;animation-duration:' + (1300 + Math.random() * 1300) + 'ms;width:' + (16 + Math.random() * 22) + 'px;--rot:' + (Math.random() * 720 - 360) + 'deg';
    box.appendChild(c);
  }
}
// оверлей «КРУПНЫЙ / МЕГА / ЭПИЧЕСКИЙ ВЫИГРЫШ» со счётчиком и дождём кристаллов; закрывается кликом
function casBigWin(win, bet, opt) {
  opt = opt || {};
  const tier = Math.max(opt.tier || 0, casWinTier(win / bet)) || 1, T = CAS_TIERS[tier], fast = casFast();
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'cbw-ov cbw-t' + tier; ov.style.setProperty('--tc', T.c);
    ov.innerHTML = '<div class="cbw-rays"></div><div class="cbw-box"><div class="cbw-title">' + (opt.title || T.t) + '</div><div class="cbw-sum"><img src="' + GEM_IMG + '" alt=""><span>0</span></div><div class="cbw-sub">' + (opt.sub || ('×' + (+(win / bet).toFixed(1)) + ' от ставки')) + '</div><div class="cbw-hint">нажми, чтобы продолжить</div></div>';
    document.body.appendChild(ov);
    casCoinRain(ov, 24 + tier * 22);
    const cab = document.getElementById('cab'); if (cab) cab.classList.add('win' + (tier > 1 ? tier : ''));
    sfx('win'); if (tier >= 2) setTimeout(() => sfx('open'), 350);
    haptic('nishtyak'); shakeScreen(3 + tier * 3);
    const burst = () => particles(T.c, 18 + tier * 10, innerWidth * (0.25 + Math.random() * 0.5), innerHeight * (0.25 + Math.random() * 0.3));
    burst(); const bi = setInterval(burst, 700);
    const span = ov.querySelector('.cbw-sum span'), t0 = performance.now(), dur = fast ? 700 : 1300 + tier * 600;
    let done = false;
    const tick = () => { const k = Math.min(1, (performance.now() - t0) / dur), e = 1 - Math.pow(1 - k, 3); span.textContent = fmt(Math.floor(win * e)); if (k < 1 && !done) requestAnimationFrame(tick); else { span.textContent = fmt(Math.floor(win)); ov.classList.add('full'); } };
    tick();
    const close = () => { if (done) return; done = true; clearInterval(bi); span.textContent = fmt(Math.floor(win)); ov.classList.add('out'); setTimeout(() => { ov.remove(); res(); }, 250); };
    ov.addEventListener('click', close);
    setTimeout(close, dur + (fast ? 900 : 2200));
  });
}
// бонус-символы светятся, автомат вспыхивает, затем экран «N ФРИСПИНОВ» с кнопкой старта
async function casFsIntro(n, emoji, text) {
  document.querySelectorAll('#cas-board .cs-sc').forEach(e => { const cell = e.parentElement; cell.classList.add('sc-hit'); const R = cell.getBoundingClientRect(); particles('#ffd36a', 14, R.left + R.width / 2, R.top + R.height / 2); });
  const cab = document.getElementById('cab'); if (cab) { cab.classList.remove('flash'); void cab.offsetWidth; cab.classList.add('flash'); }
  sfx('open'); haptic('arcana'); shakeScreen(6);
  await casWait(casFast() ? 500 : 1300);
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'cfs-ov';
    ov.innerHTML = '<div class="cfs-burst"></div><div class="cfs-box"><div class="cfs-emoji">' + emoji + '</div><div class="cfs-num">0</div><div class="cfs-title">ФРИСПИНОВ!</div><div class="cfs-sub">' + text + '</div><button class="btn green big" id="cfs-go">▶ Начать</button></div>';
    document.body.appendChild(ov); casCoinRain(ov, 30);
    const num = ov.querySelector('.cfs-num'); let k = 0;
    const step = () => { k++; num.textContent = k; num.classList.remove('bump'); void num.offsetWidth; num.classList.add('bump'); sfx('coin'); if (k < n) setTimeout(step, casFast() ? 40 : 90); };
    setTimeout(step, 250);
    ov.querySelector('#cfs-go').onclick = () => { ov.classList.add('out'); setTimeout(() => { ov.remove(); res(); }, 220); };
  });
}
// общий итог крутки: деньги уже зачислены в S при старте — тут только показ
async function casShow(bet, win, extra, bonus) {
  updateTop();
  casTrayWin(win, bet, extra);
  const x = win / bet, cab = document.getElementById('cab');
  if (win > 0 && cab) { cab.classList.remove('win'); void cab.offsetWidth; cab.classList.add('win'); }
  if (casWinTier(x)) { await casWait(casFast() ? 150 : 450); await casBigWin(win, bet); }
  else if (win > 0) { sfx(x >= 3 ? 'win' : 'coin'); if (x >= 5) { const g = document.querySelector('#cab .cab-glass'); if (g) { const R = g.getBoundingClientRect(); particles('#ffd36a', 20, R.left + R.width / 2, R.top + R.height / 2); } } if (!bonus && x >= 5) hype('21'); }
}
function casFsEnd(f, emoji, extra) {
  return casBigWin(f.win, f.bet, { tier: casWinTier(f.win / f.bet) || 1, title: emoji + ' ФРИСПИНЫ: ИТОГ', sub: f.total + ' ' + plural(f.total, 'фриспин', 'фриспина', 'фриспинов') + ' по ставке ' + fmt(f.bet) + (extra || '') });
}
function casNext(id, fn) { setTimeout(() => { if (casCur === id && currentTab === 'slots' && !modalOpen && !busy.slot) fn(); }, casFast() ? 300 : 650); }
function casInfo() { const f = { dog: dogInfo, maze: mazeInfo, oly: olyInfo }[casCur]; if (f) f(); }
function casFsHead(fs, extra) {
  const el = document.getElementById('cab-fs'), cab = document.getElementById('cab');
  if (cab) cab.classList.toggle('fs-mode', !!fs);
  if (el) el.innerHTML = fs ? '⭐ ФРИСПИНЫ ' + (fs.total - fs.left) + '/' + fs.total + (extra || '') : '';
}
function casPayHTML(id) {
  if (id === 'dog') return '<h4>Выплаты за линию (ставка/20 × множитель) · вайлд заменяет всё, его ×2/×3 умножает линию</h4><div class="paygrid">' + DOG.syms.map(s => '<div><img class="pay-ic" src="' + s[1]() + '" referrerpolicy="no-referrer" alt=""> 3 <b>×' + +(s[3][0] * CONFIG.casino.dog.pay).toFixed(1) + '</b> · 4 <b>×' + +(s[3][1] * CONFIG.casino.dog.pay).toFixed(1) + '</b> · 5 <b>×' + +(s[3][2] * CONFIG.casino.dog.pay).toFixed(1) + '</b></div>').join('') + '</div><div class="muted" style="font-size:.75rem">🐾 3 BONUS на 1, 3 и 5 барабанах — 7–15 фриспинов, вайлды прилипают до конца</div>';
  if (id === 'maze') return '<h4>Выплаты — как у Arcana 3×5 × ' + CONFIG.casino.maze.pay + ', умножаются на текущий множитель</h4><div class="muted" style="font-size:.75rem">🐂 3+ BONUS в любом месте — ' + CONFIG.casino.maze.fs + ' фриспинов, множитель во фриспинах только растёт</div>';
  return '<h4>8+ одинаковых где угодно (× ставка): 8–9 / 10–11 / 12+</h4><div class="paygrid">' + OLY.syms.map(s => '<div><img class="pay-ic" src="' + s[1]() + '" referrerpolicy="no-referrer" alt=""> <b>×' + +(s[3][0] * CONFIG.casino.oly.pay).toFixed(2) + '</b> · <b>×' + +(s[3][1] * CONFIG.casino.oly.pay).toFixed(2) + '</b> · <b>×' + +(s[3][2] * CONFIG.casino.oly.pay).toFixed(2) + '</b></div>').join('') + '</div><div class="muted" style="font-size:.75rem">Выигрышные символы исчезают, сверху падают новые. Сферы ×2…×50 складываются и умножают выигрыш. ⚡ 4+ BONUS — ' + CONFIG.casino.oly.fs + ' фриспинов, множитель сфер копится</div>';
}

// ----- Псарня -----
function dogInfo() {
  const st = casState(), fs = st.dog && st.dog.fs;
  document.getElementById('cas-info').innerHTML = fs ? 'прилипших вайлдов: <b>' + Object.keys(fs.sticky).length + '</b> · выиграно ' + gemHTML(fs.win) : '<span class="muted">20 линий · ставка ' + gemHTML(casBet('dog')) + '</span>';
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  casFsHead(fs);
}
async function dogPlay() {
  const st = casState(); st.dog = st.dog || {};
  const fs = st.dog.fs, bet = fs ? fs.bet : casBet('dog');
  if (!fs && !casStart(bet)) return;
  casBusy(true);
  const R = casDogSpin(bet, null, fs ? fs.sticky : null), win = Math.floor(R.win);
  const stickyBefore = fs ? Object.assign({}, fs.sticky) : {};
  let newFs = 0;
  if (fs) { fs.left--; fs.win += win; R.g.forEach((col, r) => col.forEach((s, c) => { if (s.k === 'wild') fs.sticky[r + ',' + c] = s; })); }
  else if (R.sc >= 3) { newFs = casPickW(DOG.fsN); st.dog.fs = { bet, left: newFs, total: newFs, sticky: {}, win: 0 }; }
  S.gems += win; save();                       // выигрыш зачислен сразу — обновление страницы его не съест
  if (fs) casFsHead(fs);
  await casReelSpin(R.g, c => dogSym(c), fs ? null : casTease(R.g, 2), (c, r) => !!stickyBefore[c + ',' + r]);
  if (casCur !== 'dog') { casBusy(false); updateTop(); return; }
  casMarkSticky();
  casDrawLines(R.lines, li => DOG.lines[li]);
  await casShow(bet, win, newFs ? ' · 🐾 бонус!' : '', !!fs);
  if (newFs) { await casFsIntro(newFs, '🐾', 'Вайлды прилипают до конца фриспинов · ставка ' + gemHTML(bet)); casBusy(false); casInfo(); casMarkSticky(); return casNext('dog', dogPlay); }
  const f2 = st.dog.fs;
  if (fs && f2 && f2.left <= 0) { st.dog.fs = null; save(); casBusy(false); casInfo(); feed('🐺 Фриспины в Псарне: +' + fmt(f2.win) + ' 🔶', 'var(--gold2)'); await casFsEnd(f2, '🐺'); casRender(); return; }
  casBusy(false); casInfo();
  if (fs && f2) casNext('dog', dogPlay);
}
// ----- Лабиринт -----
function mazeInfo(bump) {
  const st = casState(), M = st.maze || {}, fs = M.fs, step = fs ? fs.step : (M.step || 0), on = Math.min(step, MAZE.ladder.length - 1);
  document.getElementById('cas-info').innerHTML = '<div class="maze-ladder">' + MAZE.ladder.map((v, i) => '<span class="' + (i === on ? 'on' + (bump ? ' bump' : '') : i < on ? 'past' : '') + '">×' + v + '</span>').join('<em>›</em>') + '</div>' + (fs ? 'множитель не сбрасывается · выиграно ' + gemHTML(fs.win) : '<span class="muted">Выигрыш подряд поднимает множитель, проигрыш сбрасывает его</span>');
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  casFsHead(fs);
  const cab = document.getElementById('cab'); if (cab) cab.dataset.step = on;
}
async function mazePlay() {
  const st = casState(); st.maze = st.maze || { step: 0 };
  const fs = st.maze.fs, bet = fs ? fs.bet : casBet('maze');
  if (!fs && !casStart(bet)) return;
  casBusy(true);
  const R = casMazeSpin(bet, fs ? fs.step : st.maze.step || 0, null, !!fs), win = Math.floor(R.win);
  let newFs = false;
  if (fs) { fs.left--; fs.win += win; if (win > 0) fs.step++; }
  else { st.maze.step = win > 0 ? (st.maze.step || 0) + 1 : 0; if (R.sc >= 3) { st.maze.fs = { bet, left: CONFIG.casino.maze.fs, total: CONFIG.casino.maze.fs, step: st.maze.step, win: 0 }; newFs = true; } }
  S.gems += win; save();
  if (fs) casFsHead(fs);
  await casReelSpin(R.g, () => mazeSym(), fs ? null : casTease(R.g, 2));
  if (casCur !== 'maze') { casBusy(false); updateTop(); return; }
  casDrawLines(R.lines, li => SLOT_LINES[5][li]);
  if (win > 0 && R.mul > 1) casFloat('×' + R.mul, 'mul');
  await casShow(bet, win, win > 0 ? ' · ×' + R.mul : (newFs ? ' · 🐂 бонус!' : ''), !!fs);
  mazeInfo(win > 0);
  if (newFs) { await casFsIntro(CONFIG.casino.maze.fs, '🐂', 'Множитель лабиринта во фриспинах только растёт · ставка ' + gemHTML(bet)); casBusy(false); casInfo(); return casNext('maze', mazePlay); }
  const f2 = st.maze.fs;
  if (fs && f2 && f2.left <= 0) { st.maze.fs = null; save(); casBusy(false); casInfo(); feed('🐂 Фриспины в Лабиринте: +' + fmt(f2.win) + ' 🔶', 'var(--gold2)'); await casFsEnd(f2, '🐂', ' · дошли до ×' + MAZE.ladder[Math.min(f2.step, MAZE.ladder.length - 1)]); casRender(); return; }
  casBusy(false); mazeInfo();
  if (fs && f2) casNext('maze', mazePlay);
}
// ----- Небеса Зевса -----
function olyInfo() {
  const st = casState(), fs = st.oly && st.oly.fs;
  document.getElementById('cas-info').innerHTML = fs ? 'общий множитель сфер <b class="oly-acc">×' + (fs.acc || 0) + '</b> · выиграно ' + gemHTML(fs.win) : '<span class="muted">8+ одинаковых в любом месте · каскады · сферы-множители</span>';
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  casFsHead(fs, fs ? ' · ×' + (fs.acc || 0) : '');
}
async function olyPlay() {
  const st = casState(); st.oly = st.oly || {};
  const fs = st.oly.fs, bet = fs ? fs.bet : casBet('oly');
  if (!fs && !casStart(bet)) return;
  casBusy(true);
  const R = casOlySpin(bet, !!fs);
  let win = R.win, newFs = false, retrig = false;
  if (fs) { fs.left--; if (R.x > 0) { fs.acc = (fs.acc || 0) + R.orbs; win = bet * R.x * (fs.acc || 1); } else win = 0; win = Math.floor(win); fs.win += win; if (R.sc >= 3) { fs.left += 5; fs.total += 5; retrig = true; } }
  else { win = Math.floor(win); if (R.sc >= 4) { st.oly.fs = { bet, left: CONFIG.casino.oly.fs, total: CONFIG.casino.oly.fs, acc: 0, win: 0 }; newFs = true; } }
  S.gems += win; save();
  if (fs) casFsHead(fs, ' · ×' + (fs.acc || 0));
  await casReelSpin(R.steps[0], () => olySym(!!fs), fs ? null : casTease(R.steps[0], 3));
  if (casCur !== 'oly') { casBusy(false); updateTop(); return; }
  const fast = casFast();
  // каскады: выигрышные символы вспыхивают, лопаются, сверху падают новые
  for (let i = 0; i + 1 < R.steps.length; i++) {
    const fr = R.steps[i], cnt = {};
    fr.forEach(col => col.forEach(s => { if (s.k === 'n') cnt[s.id] = (cnt[s.id] || 0) + 1; }));
    const kill = new Set(Object.keys(cnt).filter(k => cnt[k] >= 8)), gone = fr.map(col => col.filter(s => s.k === 'n' && kill.has(s.id)).length);
    fr.forEach((col, c) => col.forEach((s, r) => { if (s.k === 'n' && kill.has(s.id)) { const el = casCell(c, r); if (el) el.classList.add('hl'); } }));
    sfx('coin'); await casWait(fast ? 280 : 650);
    document.querySelectorAll('#cas-board .cs-cell.hl').forEach(el => el.classList.add('pop'));
    await casWait(fast ? 140 : 280);
    casSetBoard(R.steps[i + 1], (c, r) => r < gone[c] ? ['drop', 'animation-delay:' + ((gone[c] - r) * 40 + c * 25) + 'ms'] : null);
    sfx('tick'); await casWait(fast ? 240 : 480);
  }
  if (R.x > 0 && R.orbs) {
    document.querySelectorAll('#cas-board .cs-orb').forEach(e => e.parentElement.classList.add('orb-hit'));
    sfx('open'); casFloat('×' + (fs ? fs.acc : R.orbs), 'mul big'); await casWait(fast ? 400 : 900);
  }
  let extra = R.orbs && R.x > 0 ? ' · сферы ×' + R.orbs : '';
  if (retrig) { extra += ' · ⚡ +5 фриспинов'; casFloat('+5 ФРИСПИНОВ', 'fs'); sfx('open'); }
  if (newFs) extra += ' · ⚡ бонус!';
  await casShow(bet, win, extra, !!fs);
  if (newFs) { await casFsIntro(CONFIG.casino.oly.fs, '⚡', 'Сферы во фриспинах складываются в общий множитель · ставка ' + gemHTML(bet)); casBusy(false); casRender(); return casNext('oly', olyPlay); }
  const f2 = st.oly.fs;
  if (fs && f2 && f2.left <= 0) { st.oly.fs = null; save(); casBusy(false); casInfo(); feed('☁ Фриспины в Небесах: +' + fmt(f2.win) + ' 🔶', 'var(--gold2)'); await casFsEnd(f2, '☁', ' · множитель ×' + (f2.acc || 0)); casRender(); return; }
  casBusy(false); casInfo();
  if (fs && f2) casNext('oly', olyPlay);
}
// ----- Мины -----
// мины не хранятся заранее: каждая открытая клетка — мина с вероятностью (осталось мин)/(осталось клеток);
// так их нельзя подсмотреть в сохранении. В конце оставшиеся мины раскладываются по закрытым клеткам для показа.
function minesUI() {
  const st = casState(), R = st.mines && st.mines.round, m = (st.mines && st.mines.m) || 3;
  let h = '<div class="cs-grid mines-grid" style="grid-template-columns:repeat(5,1fr)">';
  for (let i = 0; i < 25; i++) {
    const op = R && R.open.includes(i), boom = R && R.boom === i, shown = R && R.show && R.show.includes(i);
    h += '<button class="mn-cell' + (op ? ' safe' : '') + (boom ? ' boom' : '') + (shown && !boom ? ' mine' : '') + '" ' + (R && !R.over && !op ? 'data-click="minesOpen(' + i + ')"' : 'disabled') + '>' + (boom || shown ? '💣' : op ? '💎' : '') + '</button>';
  }
  document.getElementById('cas-board').innerHTML = h + '</div>';
  const k = R ? R.open.length : 0;
  document.getElementById('cas-info').innerHTML = R ? 'Мин: <b>' + R.m + '</b> · открыто ' + k + ' · сейчас <b>×' + minesMul(R.m, k) + '</b> (' + gemHTML(Math.floor(R.bet * minesMul(R.m, k))) + ') · следующая клетка — <b>×' + minesMul(R.m, k + 1) + '</b>' :
    'Мин на поле: <select id="mn-m" data-change="minesSetM(this.value)">' + [1, 2, 3, 5, 7, 10, 15, 20, 24].map(v => '<option' + (v === m ? ' selected' : '') + '>' + v + '</option>').join('') + '</select> · первая клетка ×' + minesMul(m, 1);
  document.getElementById('cas-ctrl').innerHTML = R && !R.over ? '<button class="btn gold big" ' + (k ? '' : 'disabled') + ' data-click="minesCash()">💰 Забрать ' + fmt(Math.floor(R.bet * minesMul(R.m, k))) + '</button>' : casBtn('▶ Новая игра', 'minesStart()');
  document.getElementById('cas-pay').innerHTML = '<h4>Как играть</h4><div class="muted" style="font-size:.8rem">Ставка, число мин — и открывай клетки. Каждая безопасная клетка 💎 повышает множитель, мина 💣 сжигает ставку. Забрать можно в любой момент. Отдача — ' + Math.round(CONFIG.casino.mines.edge * 100) + '%.</div>';
}
function minesSetM(v) { const st = casState(); st.mines = st.mines || {}; if (st.mines.round) return; st.mines.m = Math.max(1, Math.min(24, +v || 3)); minesUI(); }
function minesStart() {
  const st = casState(); st.mines = st.mines || { m: 3 };
  if (st.mines.round && !st.mines.round.over) return;
  const bet = casBet('mines'); if (!casStart(bet)) return;
  st.mines.round = { bet, m: st.mines.m || 3, open: [], over: false }; save(); minesUI();
}
function minesOpen(i) {
  const st = casState(), R = st.mines && st.mines.round; i = +i;
  if (!R || R.over || R.open.includes(i) || i < 0 || i > 24) return;
  const left = 25 - R.open.length, mines = R.m;
  if (Math.random() < mines / left) {
    R.over = true; R.boom = i; R.show = minesLay(R, i); sfx('lose'); hype('БИЧ');
    const lw = document.getElementById('cas-last'); if (lw) { lw.textContent = '💣 Мина! Ставка сгорела'; lw.className = 'last-win lose'; }
    st.mines.round = null; save(); minesUI(); casState().mines.last = R; minesShow(R); return;
  }
  R.open.push(i); sfx('coin');
  if (R.open.length >= 25 - R.m) return minesCash();
  save(); minesUI();
}
function minesLay(R, boom) { const free = []; for (let j = 0; j < 25; j++) if (!R.open.includes(j) && j !== boom) free.push(j); free.sort(() => Math.random() - 0.5); return [boom].concat(free.slice(0, R.m - 1)); }
function minesShow(R) { const st = casState(); st.mines.round = R; minesUI(); st.mines.round = null; }
function minesCash() {
  const st = casState(), R = st.mines && st.mines.round; if (!R || R.over || !R.open.length) return;
  const win = Math.floor(R.bet * minesMul(R.m, R.open.length));
  R.over = true; R.show = minesLay(R, -1).slice(1).concat([]); R.show = (function () { const f = []; for (let j = 0; j < 25; j++) if (!R.open.includes(j)) f.push(j); f.sort(() => Math.random() - 0.5); return f.slice(0, R.m); })();
  st.mines.round = null; casPay(R.bet, win, ' · ×' + minesMul(R.m, R.open.length)); minesShow(R);
}
