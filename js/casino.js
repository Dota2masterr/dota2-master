// ================= 2.10: ещё 4 игры во вкладке «Слоты» — свои версии популярных механик, ставки только кристаллами =================
// 🐺 Псарня Бистмастера — 5×3, 20 линий, вайлды ×2/×3 на 2–4 барабанах, во фриспинах вайлды прилипают.
// 🐂 Лабиринт Кентавра — 5×3, 10 линий, множитель растёт с каждой выигрышной круткой подряд (×1→×2→×3→×5→×10).
// ☁ Небеса Зевса — 6×5, платят 8+ одинаковых в любом месте, каскады, сферы-множители; во фриспинах множитель копится.
// 💣 Мины — поле 5×5, выбираешь число мин, открываешь клетки, множитель растёт, можно забрать в любой момент.
// Все расчёты — чистые функции casDogSpin / casMazeSpin / casOlySpin; их же проверяет casSim (отдача ~90–96%, у Мин ровно 97%).

const CAS = [
  { id: 'dog', name: '🐺 Псарня', title: 'Псарня Бистмастера', minBet: 100, theme: 'theme-dog', sub: '5×3 · 20 линий · вайлды ×2/×3 · во фриспинах вайлды прилипают' },
  { id: 'maze', name: '🐂 Лабиринт', title: 'Лабиринт Кентавра', minBet: 100, theme: 'theme-maze', sub: '5×3 · 10 линий · множитель растёт с каждой победой подряд' },
  { id: 'oly', name: '☁ Небеса', title: 'Небеса Зевса', minBet: 100, theme: 'theme-oly', sub: '6×5 · 8+ одинаковых где угодно · каскады · сферы ×2…×100' },
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
const CS_ITEM = n => STEAM + 'items/' + n + '.png';

// ======================= 🐺 ПСАРНЯ =======================
const DOG = {
  lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[1,0,0,0,1],[1,2,2,2,1],[0,0,1,2,2],[2,2,1,0,0],[1,2,1,0,1],[1,0,1,2,1],[0,1,1,1,0],[2,1,1,1,2],[0,1,0,1,0],[2,1,2,1,2],[1,1,0,1,1],[1,1,2,1,1],[0,0,2,0,0],[2,2,0,2,2],[0,2,0,2,0]],
  // [id, картинка, вес, выплата за 3/4/5 на линию (× ставка/20), цвет]
  syms: [
    ['lycan', () => heroIcon('lycan'), 4, [7.5, 25, 75], '#ade55c'],
    ['ursa', () => heroIcon('ursa'), 5, [5, 15, 50], '#e4ae39'],
    ['brood', () => heroIcon('broodmother'), 6, [3, 10, 30], '#c8a4ff'],
    ['chen', () => heroIcon('chen'), 7, [2, 5, 20], '#4fb6d8'],
    ['branch', () => CS_ITEM('branches'), 10, [1, 2.5, 10], '#8a8f98'],
    ['tango', () => CS_ITEM('tango'), 10, [1, 2.5, 10], '#8a8f98'],
    ['salve', () => CS_ITEM('flask'), 11, [0.5, 1.5, 5], '#8a8f98'],
    ['clarity', () => CS_ITEM('clarity'), 11, [0.5, 1.5, 5], '#8a8f98']
  ],
  wild: 0.055, sc: 0.05, wildM: [[2, 60], [3, 40]], fsN: [[9, 30], [10, 20], [11, 15], [12, 12], [14, 9], [16, 7], [18, 4], [20, 3]]
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
  return { g, win, lines, sc };
}

// ======================= 🐂 ЛАБИРИНТ =======================
const MAZE = {
  ladder: [1, 2, 3, 5, 10],
  syms: [['arcana', 'centaur', 4], ['immortal', 'elder_titan', 7], ['mythical', 'magnataur', 11], ['rare', 'spirit_breaker', 15], ['uncommon', 'tusk', 20], ['common', 'earthshaker', 27]],
  sc: 0.027
};
function mazeSym() {
  if (Math.random() < MAZE.sc) return { k: 'sc', e: '🐂' };
  const s = casPickW(MAZE.syms.map(x => [x, x[2]]));
  return { k: 'n', id: s[0], img: heroIcon(s[1]), c: RARITY_COLOR[s[0]] };
}
function casMazeSpin(bet, step, cfg) {
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
  const win = bet * x * C.pay * mul;
  return { g, win, lines, mul, sc: [].concat(...g).filter(s => s.k === 'sc').length };
}

// ======================= ☁ НЕБЕСА ЗЕВСА =======================
const OLY = {
  // [id, картинка, вес, выплата за 8–9 / 10–11 / 12+ (× ставка), цвет]
  syms: [
    ['crown', () => spellIcon('zuus_thundergods_wrath'), 5, [10, 25, 50], '#ade55c'],
    ['bolt', () => spellIcon('zuus_lightning_bolt'), 7, [2.5, 10, 25], '#e4ae39'],
    ['arc', () => spellIcon('zuus_arc_lightning'), 8, [2, 5, 15], '#c8a4ff'],
    ['cloud', () => spellIcon('zuus_cloud'), 9, [1.5, 2, 12], '#4fb6d8'],
    ['gem1', () => CS_ITEM('gem'), 11, [1, 1.5, 10], '#8a8f98'],
    ['gem2', () => CS_ITEM('ultimate_orb'), 12, [0.8, 1.2, 8], '#8a8f98'],
    ['gem3', () => CS_ITEM('point_booster'), 13, [0.5, 1, 5], '#8a8f98'],
    ['gem4', () => CS_ITEM('energy_booster'), 14, [0.4, 0.9, 4], '#8a8f98'],
    ['gem5', () => CS_ITEM('vitality_booster'), 15, [0.25, 0.75, 2], '#8a8f98']
  ],
  sc: 0.022, orbBase: 0.004, orbFs: 0.009,
  orbs: [[2, 30], [3, 20], [4, 14], [5, 11], [6, 8], [8, 6], [10, 4], [12, 3], [15, 2], [20, 1], [25, 0.6], [50, 0.25], [100, 0.1]]
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
  return { g, steps, x: x * C.pay, orbs, sc, win: bet * x * C.pay * (orbs || 1) };
}

// ======================= 💣 МИНЫ =======================
// честный множитель: 0.97 × (25 C k) / ((25−m) C k) — за k открытых безопасных клеток при m минах
function minesMul(m, k) { let v = 1; for (let i = 0; i < k; i++) v *= (25 - i) / (25 - m - i); return Math.floor(v * CONFIG.casino.mines.edge * 100) / 100; }

// ======================= ОТДАЧА (для тестов и баланса) =======================
function casSim(id, n) {
  let bet = 0, got = 0, fsN = 0;
  if (id === 'dog') for (let i = 0; i < n; i++) { bet += 1; const R = casDogSpin(1); got += R.win; if (R.sc >= 3) { fsN++; let left = casPickW(DOG.fsN); const st = {}; while (left-- > 0) { const F = casDogSpin(1, null, st); got += F.win; F.g.forEach((col, r) => col.forEach((s, c) => { if (s.k === 'wild') st[r + ',' + c] = s; })); } } }
  if (id === 'maze') { let step = 0; for (let i = 0; i < n; i++) { bet += 1; const R = casMazeSpin(1, step); got += R.win; step = R.win > 0 ? step + 1 : 0; if (R.sc >= 3) { fsN++; let st = 0; for (let j = 0; j < CONFIG.casino.maze.fs; j++) { const F = casMazeSpin(1, st); got += F.win; if (F.win > 0) st++; } } } }
  if (id === 'oly') for (let i = 0; i < n; i++) { bet += 1; const R = casOlySpin(1, false); got += R.win; if (R.sc >= 4) { fsN++; let acc = 0, left = CONFIG.casino.oly.fs; while (left-- > 0) { const F = casOlySpin(1, true); if (F.x > 0) { acc += F.orbs; got += F.x * (acc || 1); } if (F.sc >= 3) left += 5; } } }
  return { rtp: got / bet, fsEvery: fsN ? n / fsN : 0 };
}

// ======================= ИНТЕРФЕЙС =======================
function casOpen(id) {
  if (busy.slot || (typeof autoTotal !== 'undefined' && autoTotal) || (typeof fsActive === 'function' && (fsActive() || pickActive()))) return;
  casCur = id; casRender();
}
function casClose() { casCur = null; }
function casBet(id) { const g = CAS.find(x => x.id === id); return Math.max(g.minBet, Math.min(CONFIG.slotsMaxBet, casBets[id] || g.minBet)); }
function casSetBet(v) { if (!casCur || busy.slot || casLocked()) return; const g = CAS.find(x => x.id === casCur); v = Math.floor(+v || g.minBet); casBets[casCur] = Math.round(Math.max(g.minBet, Math.min(CONFIG.slotsMaxBet, v, Math.max(g.minBet, S.gems))) / g.minBet) * g.minBet; casRender(); }
function casChBet(d) { casSetBet(casBet(casCur) + d); }
function casLocked() { const st = casState(); return !!((st.dog && st.dog.fs) || (st.maze && st.maze.fs) || (st.oly && st.oly.fs) || (st.mines && st.mines.round)); }
function casRender() {
  const g = CAS.find(x => x.id === casCur); if (!g) return;
  document.querySelectorAll('#slot-subtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === 'cas:' + g.id));
  const host = document.getElementById('slot-machine-host'), bet = casBet(g.id);
  host.innerHTML = '<div class="slot-machine cas-machine ' + g.theme + '"><div class="sm-title">' + g.title + '</div><div class="sm-sub">' + g.sub + '</div>' +
    '<div id="cas-board" class="cas-board cas-' + g.id + '"></div><div id="cas-info" class="cas-info"></div>' +
    '<div class="bet-row"><button class="btn sm" data-click="casChBet(-10000)">−10к</button><button class="btn sm" data-click="casChBet(-' + g.minBet + ')">−</button>' +
    '<input type="number" id="cas-bet" min="' + g.minBet + '" step="' + g.minBet + '" value="' + bet + '" data-change="casSetBet(this.value)"><img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">' +
    '<button class="btn sm" data-click="casChBet(' + g.minBet + ')">+</button><button class="btn sm" data-click="casChBet(10000)">+10к</button><button class="btn sm ghost" data-click="casSetBet(1e9)">MAX</button></div>' +
    '<div id="cas-ctrl" style="margin-top:10px"></div><div class="last-win" id="cas-last"></div>' +
    '<div class="paytable" id="cas-pay"></div><div class="muted" style="font-size:.72rem;margin-top:6px">Только игровые кристаллы. Кристаллы нельзя купить или вывести.</div></div>';
  ({ dog: dogUI, maze: mazeUI, oly: olyUI, mines: minesUI })[g.id]();
}
function casSpin() {
  if (!casCur || busy.slot || modalOpen) return;
  ({ dog: dogPlay, maze: mazePlay, oly: olyPlay, mines: () => { } })[casCur]();
}
function casGrid(cols, rows, get, hl) {
  let h = '<div class="cs-grid" style="grid-template-columns:repeat(' + cols + ',1fr)">';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) h += '<div class="cs-cell' + (hl && hl.has(c + ',' + r) ? ' hl' : '') + '">' + casIcon(get(c, r)) + '</div>';
  return h + '</div>';
}
function casPay(bet, win, fsMsg) {
  if (win > 0) addGems(Math.floor(win));
  const lw = document.getElementById('cas-last');
  if (lw) { lw.innerHTML = win > 0 ? '✨ +' + gemHTML(Math.floor(win)) + (fsMsg || '') : (fsMsg || '😢 мимо'); lw.className = 'last-win' + (win > 0 ? '' : ' lose'); }
  if (win >= bet * 50) hype('НИШТЯК'); else if (win > 0) hype('21');
  updateTop(); save();
}
function casStart(bet) { if (!canPay(bet)) { showModal('🔶', 'Мало кристаллов', 'Ставка ' + fmt(bet) + ' 🔶', 'bad'); return false; } addGems(-bet); S.spins++; track('slotSpins'); updateTop(); return true; }
function casBtn(txt, fn, dis) { return '<button class="btn green big" ' + (dis ? 'disabled' : '') + ' data-click="' + fn + '">' + txt + '</button>'; }

// ----- Псарня -----
function dogUI(last) {
  const st = casState(), fs = st.dog && st.dog.fs;
  const sticky = fs ? fs.sticky : {};
  const g = last || null;
  document.getElementById('cas-board').innerHTML = casGrid(5, 3, (c, r) => g ? g[c][r] : (sticky[c + ',' + r] || dogSym(c)));
  document.getElementById('cas-info').innerHTML = fs ? '⭐ Фриспины: <b>' + fs.left + '</b> осталось · прилипших вайлдов: ' + Object.keys(sticky).length + ' · выиграно ' + gemHTML(fs.win) : '';
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  document.getElementById('cas-pay').innerHTML = '<h4>Выплаты за линию (ставка/20 × множитель) · вайлд 🐺 заменяет всё, его ×2/×3 умножает линию</h4><div class="paygrid">' + DOG.syms.map(s => '<div><img class="pay-ic" src="' + s[1]() + '" referrerpolicy="no-referrer" alt=""> 3 <b>×' + s[3][0] + '</b> · 4 <b>×' + s[3][1] + '</b> · 5 <b>×' + s[3][2] + '</b></div>').join('') + '</div><div class="muted" style="font-size:.75rem">🐾 3 BONUS на 1, 3 и 5 барабанах — 9–20 фриспинов, вайлды прилипают до конца</div>';
}
function dogPlay() {
  const st = casState(); st.dog = st.dog || {};
  const fs = st.dog.fs, bet = fs ? fs.bet : casBet('dog');
  if (!fs && !casStart(bet)) return;
  busy.slot = true; dogUI();
  const R = casDogSpin(bet, null, fs ? fs.sticky : null);
  setTimeout(() => {
    busy.slot = false;
    let msg = '';
    if (fs) { fs.left--; fs.win += Math.floor(R.win); R.g.forEach((col, r) => col.forEach((s, c) => { if (s.k === 'wild') fs.sticky[r + ',' + c] = s; })); }
    if (!fs && R.sc >= 3) { const n = casPickW(DOG.fsN); st.dog.fs = { bet, left: n, total: n, sticky: {}, win: 0 }; msg = ' · 🐾 ' + n + ' фриспинов!'; hype('БОНУС'); }
    casPay(bet, R.win, msg);
    dogUI(R.g);
    const f2 = st.dog.fs;
    if (f2 && f2.left <= 0) { st.dog.fs = null; save(); showModal('🐺', 'Фриспины: +' + fmt(f2.win), f2.total + ' фриспинов по ставке ' + fmt(f2.bet), f2.win > 0 ? 'ok' : ''); dogUI(R.g); }
    else if (f2 && fs) setTimeout(() => { if (casCur === 'dog' && currentTab === 'slots' && !modalOpen) dogPlay(); }, speed === 'fast' ? 350 : 800);
  }, speed === 'fast' ? 350 : 900);
}
// ----- Лабиринт -----
function mazeUI(last) {
  const st = casState(), M = st.maze || {}, fs = M.fs, step = fs ? fs.step : (M.step || 0);
  document.getElementById('cas-board').innerHTML = casGrid(5, 3, (c, r) => last ? last[c][r] : mazeSym());
  document.getElementById('cas-info').innerHTML = '<div class="maze-ladder">' + MAZE.ladder.map((v, i) => '<span class="' + (i === Math.min(step, MAZE.ladder.length - 1) ? 'on' : '') + '">×' + v + '</span>').join('→') + '</div>' + (fs ? '⭐ Фриспины: <b>' + fs.left + '</b> · множитель не сбрасывается · выиграно ' + gemHTML(fs.win) : '<span class="muted">Выигрыш подряд поднимает множитель, проигрыш сбрасывает его</span>');
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  document.getElementById('cas-pay').innerHTML = '<h4>Выплаты — как у Arcana 3×5 × ' + CONFIG.casino.maze.pay + ', умножаются на текущий множитель</h4><div class="muted" style="font-size:.75rem">🐂 3+ BONUS в любом месте — ' + CONFIG.casino.maze.fs + ' фриспинов, множитель во фриспинах только растёт</div>';
}
function mazePlay() {
  const st = casState(); st.maze = st.maze || { step: 0 };
  const fs = st.maze.fs, bet = fs ? fs.bet : casBet('maze');
  if (!fs && !casStart(bet)) return;
  busy.slot = true; mazeUI();
  const R = casMazeSpin(bet, fs ? fs.step : st.maze.step || 0);
  setTimeout(() => {
    busy.slot = false; let msg = R.win > 0 ? ' · ×' + R.mul : '';
    if (fs) { fs.left--; fs.win += Math.floor(R.win); if (R.win > 0) fs.step++; }
    else { st.maze.step = R.win > 0 ? (st.maze.step || 0) + 1 : 0; if (R.sc >= 3) { st.maze.fs = { bet, left: CONFIG.casino.maze.fs, total: CONFIG.casino.maze.fs, step: st.maze.step, win: 0 }; msg += ' · 🐂 фриспины!'; hype('БОНУС'); } }
    casPay(bet, R.win, msg);
    mazeUI(R.g);
    const f2 = st.maze.fs;
    if (f2 && f2.left <= 0) { st.maze.fs = null; save(); showModal('🐂', 'Фриспины: +' + fmt(f2.win), f2.total + ' фриспинов по ставке ' + fmt(f2.bet), f2.win > 0 ? 'ok' : ''); mazeUI(R.g); }
    else if (f2 && fs) setTimeout(() => { if (casCur === 'maze' && currentTab === 'slots' && !modalOpen) mazePlay(); }, speed === 'fast' ? 350 : 800);
  }, speed === 'fast' ? 350 : 900);
}
// ----- Небеса Зевса -----
function olyUI(g) {
  const st = casState(), fs = st.oly && st.oly.fs;
  document.getElementById('cas-board').innerHTML = casGrid(6, 5, (c, r) => g ? g[c][r] : olySym(false));
  document.getElementById('cas-info').innerHTML = fs ? '⭐ Фриспины: <b>' + fs.left + '</b> · общий множитель <b>×' + (fs.acc || 0) + '</b> · выиграно ' + gemHTML(fs.win) : '';
  document.getElementById('cas-ctrl').innerHTML = casBtn(fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ', 'casSpin()', busy.slot);
  document.getElementById('cas-pay').innerHTML = '<h4>8+ одинаковых где угодно (× ставка): 8–9 / 10–11 / 12+</h4><div class="paygrid">' + OLY.syms.map(s => '<div><img class="pay-ic" src="' + s[1]() + '" referrerpolicy="no-referrer" alt=""> <b>×' + +(s[3][0] * CONFIG.casino.oly.pay).toFixed(2) + '</b> · <b>×' + +(s[3][1] * CONFIG.casino.oly.pay).toFixed(2) + '</b> · <b>×' + +(s[3][2] * CONFIG.casino.oly.pay).toFixed(2) + '</b></div>').join('') + '</div><div class="muted" style="font-size:.75rem">Выигрышные символы исчезают, сверху падают новые. Сферы ×2…×100 складываются и умножают выигрыш. ⚡ 4+ BONUS — ' + CONFIG.casino.oly.fs + ' фриспинов, множитель сфер копится</div>';
}
function olyPlay() {
  const st = casState(); st.oly = st.oly || {};
  const fs = st.oly.fs, bet = fs ? fs.bet : casBet('oly');
  if (!fs && !casStart(bet)) return;
  busy.slot = true;
  const R = casOlySpin(bet, !!fs);
  let i = 0; const stepMs = speed === 'fast' ? 260 : 650;
  const show = () => { olyUI(R.steps[i]); if (++i < R.steps.length) setTimeout(show, stepMs); else setTimeout(done, stepMs); };
  const done = () => {
    busy.slot = false; let win = R.win, msg = '';
    if (fs) { fs.left--; if (R.x > 0) { fs.acc = (fs.acc || 0) + R.orbs; win = bet * R.x * (fs.acc || 1); } else win = 0; fs.win += Math.floor(win); if (R.sc >= 3) { fs.left += 5; fs.total += 5; msg = ' · ⚡ +5 фриспинов'; } }
    else if (R.sc >= 4) { st.oly.fs = { bet, left: CONFIG.casino.oly.fs, total: CONFIG.casino.oly.fs, acc: 0, win: 0 }; msg = ' · ⚡ ' + CONFIG.casino.oly.fs + ' фриспинов!'; hype('БОНУС'); }
    if (R.orbs && R.x > 0 && !fs) msg = ' · сферы ×' + R.orbs + msg;
    casPay(bet, win, msg); olyUI(R.g);
    const f2 = st.oly.fs;
    if (f2 && f2.left <= 0) { st.oly.fs = null; save(); showModal('☁', 'Фриспины: +' + fmt(f2.win), f2.total + ' фриспинов по ставке ' + fmt(f2.bet) + ' · множитель ×' + (f2.acc || 0), f2.win > 0 ? 'ok' : ''); olyUI(R.g); }
    else if (f2 && fs) setTimeout(() => { if (casCur === 'oly' && currentTab === 'slots' && !modalOpen) olyPlay(); }, speed === 'fast' ? 350 : 800);
  };
  show();
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
