// ================= SLOTS (5 машин) =================
// 2.9: слоты дают только кристаллы. ⭐ BONUS (3+ где угодно) → 10 фриспинов с множителями ×2–×10 (+5 при повторе),
// 🎯 (3+ где угодно) → Pick-and-Click: открой 3 из 12 сундуков с множителями ставки. Слот «Зевс» — молнии-множители на любой крутке.
const SLOT_HERO_POOL = {
  common: ['pudge','axe','sniper','lion','bristleback','sand_king','witch_doctor','shadow_shaman','venomancer','tusk','jakiro','bane','warlock'],
  uncommon: ['drow_ranger','lina','windrunner','viper','razor','silencer','dazzle','undying','tidehunter','spirit_breaker','mirana','luna','clinkz'],
  rare: ['juggernaut','legion_commander','sven','slark','ursa','bloodseeker','riki','bounty_hunter','nyx_assassin','weaver','troll_warlord','gyrocopter','kunkka'],
  mythical: ['antimage','templar_assassin','ember_spirit','void_spirit','storm_spirit','earth_spirit','morphling','medusa','faceless_void','spectre','puck','muerta','marci'],
  immortal: ['phantom_assassin','nevermore','queenofpain','rubick','zuus','windrunner','lina','juggernaut','antimage','ember_spirit','crystal_maiden','axe','kez'],
  arcana: ['juggernaut','phantom_assassin','nevermore','crystal_maiden','legion_commander','pudge','invoker','terrorblade','ogre_magi','monkey_king','queenofpain','drow_ranger','earthshaker','faceless_void','lina','rubick']
};
const SLOT_W = { common: 27, uncommon: 20, rare: 15, mythical: 11, immortal: 7, arcana: 4 };   // 2.5.3: чуть чаще совпадения (common 26→27, uncommon 19→20)
// символы «Зевса» — его способности
const ZEUS_SYMS = { common: 'zuus_arc_lightning', uncommon: 'zuus_static_field', rare: 'zuus_lightning_bolt', mythical: 'zuus_heavenly_jump', immortal: 'zuus_cloud', arcana: 'zuus_thundergods_wrath' };
const MACHINES = [
  { id: 'imm3', name: 'Immortal 3×3', reels: 3, kind: 'hero', theme: 'theme-immortal', light: '#e4ae39', sub: '3×3 · 5 линий · герои' },
  { id: 'arc5', name: 'Arcana 3×5', reels: 5, kind: 'hero', theme: 'theme-arcana', light: '#ade55c', sub: '3×5 · 10 линий · герои' },
  { id: 'cos3', name: 'Cosmetic 3×3', reels: 3, kind: 'eq', theme: 'theme-cos3', light: '#4fb6d8', sub: '3×3 · 5 линий · снаряжение' },
  { id: 'cos5', name: 'Cosmetic 3×5', reels: 5, kind: 'eq', theme: 'theme-cos5', light: '#a874ff', sub: '3×5 · 10 линий · снаряжение' },
  { id: 'zeus', name: '⚡ Зевс 3×5', reels: 5, kind: 'zeus', theme: 'theme-zeus', light: '#7ad3ff', sub: '3×5 · 10 линий · молнии ×2–×10 умножают выигрыш' }
];
MACHINES.forEach(m => Object.assign(m, CONFIG.slots[m.id], { fx: CONFIG.slotFx[m.id] }));   // ставки, выплаты и бонусы — из CONFIG
// линии: для каждой — номер ряда (0 верх, 1 середина, 2 низ) на каждом барабане
const SLOT_LINES = {
  3: [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]],
  5: [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [0, 1, 0, 1, 0]]
};
const LINE_COLORS = ['#ffd36a', '#6cff7a', '#7ad3ff', '#ff8a3a', '#ff5ac8', '#c8a4ff', '#ade55c', '#ff5a5a', '#5ae0ff', '#fff'];
let curMachine = MACHINES[0];
let bets = {};
const REEL_N = 30;
function initSlots() {
  const st = document.getElementById('slot-subtabs');
  st.innerHTML = '';
  MACHINES.forEach(m => {
    const b = document.createElement('button'); b.textContent = m.name; b.dataset.m = m.id;
    b.onclick = () => { if (busy.slot || autoTotal || fsActive() || pickActive()) return; curMachine = m; renderSlotTab(); };
    st.appendChild(b);
    bets[m.id] = bets[m.id] || m.minBet;
  });
}
function rollW(list, r) { const tot = list.reduce((a, x) => a + x[1], 0); let x = (r == null ? Math.random() : r) * tot; for (const [v, w] of list) { x -= w; if (x < 0) return v; } return list[list.length - 1][0]; }
// символ на барабане: обычный (по редкости) или особый — ⭐ скаттер, 🎯 выбор, ⚡ молния-множитель
function pickSlotSym(kind, m, free) {
  if (m && m.fx) {
    const r = Math.random(), f = m.fx;
    if (r < f.sc) return { sp: 'sc', rarity: 'sp' };
    if (!free && r < f.sc + f.pk) return { sp: 'pk', rarity: 'sp' };
    if (f.mx && r < f.sc + f.pk + f.mx) return { sp: 'mx', rarity: 'sp', mul: rollW(CONFIG.slotBonus.orbs) };
  }
  const tot = Object.values(SLOT_W).reduce((a, b) => a + b, 0);
  let r = Math.random() * tot, rar = 'common';
  for (const k in SLOT_W) { r -= SLOT_W[k]; if (r <= 0) { rar = k; break; } }
  if (kind === 'zeus') return { rarity: rar, zeus: ZEUS_SYMS[rar] };
  if (kind === 'hero') return { rarity: rar, hero: pick(SLOT_HERO_POOL[rar]) };
  return { rarity: rar, item: pickCatalog(rar) };   // картинка снаряжения — только для вида, предмет не выдаётся
}
function symEl(sym) {
  const d = document.createElement('div');
  if (sym.sp) {
    d.className = 'ritem sp sp-' + sym.sp;
    d.innerHTML = sym.sp === 'sc' ? '<span class="sp-ic">⭐</span><span class="sp-t">BONUS</span>' : sym.sp === 'pk' ? '<span class="sp-ic">🎯</span><span class="sp-t">ВЫБОР</span>' : '<span class="sp-ic">⚡</span><span class="sp-t">×' + sym.mul + '</span>';
    return d;
  }
  d.className = 'ritem' + (sym.hero ? ' hero' : '') + (sym.zeus ? ' zeus' : '');
  d.appendChild(mkImg(sym.zeus ? [spellIcon(sym.zeus), STEAM + 'abilities/' + sym.zeus + '.png'] : sym.hero ? heroImgChain(sym.hero) : [itemImg(sym.item.path)], sym.zeus || sym.hero || sym.item.name));
  const n = document.createElement('div'); n.className = 'rn'; n.textContent = RARITY_NAMES[sym.rarity];
  n.style.background = RARITY_COLOR[sym.rarity];
  d.appendChild(n);
  return d;
}
function payX(m, x) { const v = x * (m.fx.pay || 1); return v >= 10 ? Math.round(v) : Math.round(v * 100) / 100; }
function slotPayRows(m) {
  const R = RARITIES.slice().reverse();
  if (m.reels === 3) return R.map(r => '<div><span class="pay-dot" style="background:' + RARITY_COLOR[r] + '"></span>' + RARITY_NAMES[r] + ' ×3 <b>×' + payX(m, m.full[r]) + '</b> · ×2 <b>×' + payX(m, m.pair[r]) + '</b></div>').join('');
  return R.map(r => '<div><span class="pay-dot" style="background:' + RARITY_COLOR[r] + '"></span>' + RARITY_NAMES[r] + ' 5 <b>×' + payX(m, m.p5[r]) + '</b> · 4 <b>×' + payX(m, m.p4[r]) + '</b> · 3 <b>×' + payX(m, m.p3[r]) + '</b></div>').join('');
}
function renderSlotTab() {
  const fs = fsActive(), pk = pickActive();
  const lock = fs || pk; if (lock) { const mm = MACHINES.find(x => x.id === lock.m); if (mm) curMachine = mm; }
  const m = curMachine;
  document.querySelectorAll('#slot-subtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === m.id));
  const host = document.getElementById('slot-machine-host');
  const maxB = CONFIG.slotsMaxBet, B = CONFIG.slotBonus;
  host.innerHTML =
    '<div class="slot-machine ' + m.theme + '">' +
    '<div class="machine-lights" style="color:' + m.light + '">' + '<i></i>'.repeat(16) + '</div>' +
    '<div class="sm-title">' + m.name + '</div><div class="sm-sub">' + m.sub + '</div>' +
    '<div class="reels grid3" id="reels" style="grid-template-columns:repeat(' + m.reels + ',1fr)"><svg class="slot-lines" id="slot-lines"></svg></div>' +
    '<div class="bet-row"><button class="btn sm" data-click="chBet(-10000)">−10к</button><button class="btn sm" data-click="chBet(-' + m.minBet + ')">−</button>' +
    '<input type="number" id="bet" min="' + m.minBet + '" step="' + m.minBet + '" value="' + bets[m.id] + '" data-change="setBet(this.value)"><img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">' +
    '<button class="btn sm" data-click="chBet(' + m.minBet + ')">+</button><button class="btn sm" data-click="chBet(10000)">+10к</button><button class="btn sm ghost" data-click="setBet(1e9)">MAX</button></div>' +
    '<div style="margin-top:12px"><button class="btn green big" id="slot-btn" data-click="spinSlots()">КРУТИТЬ</button></div><div id="fs-row" class="fs-row" style="display:none"></div><div id="auto-row"></div><div id="auto-info"></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:4px">ставка на все ' + m.lines + ' линий · мин. ' + m.minBet + ' · макс ' + fmt(maxB) + ' · <kbd>Пробел</kbd> · только кристаллы, без предметов</div>' +
    '<div class="last-win" id="last-win"></div>' +
    '<div class="paytable"><h4>Бонусы</h4><div class="slot-bonus-info"><div><span class="sp-mini sp-sc">⭐</span> 3+ BONUS в любом месте — <b>' + B.fsSpins + ' фриспинов</b>, каждый выигрыш ×2…×10; ещё 3+ во время фриспинов — +' + B.fsRetrig + '</div>' +
    '<div><span class="sp-mini sp-pk">🎯</span> 3+ ВЫБОР — <b>бонус-игра</b>: открой ' + B.pick.open + ' из ' + B.pick.n + ' сундуков, в каждом множитель ставки ×1…×' + Math.max(...B.pick.vals.map(v => v[0])) + '</div>' +
    (m.fx.mx ? '<div><span class="sp-mini sp-mx">⚡</span> Молния ×2…×10 — если крутка выигрышная, все молнии на экране складываются и умножают выигрыш</div>' : '') + '</div>' +
    '<h4 style="margin-top:10px">Выплаты за линию · ставка/' + m.lines + ' × множитель</h4><div class="paygrid">' + slotPayRows(m) + '</div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:6px;text-align:center">Совпадения считаются слева направо по линиям. Полная линия = <b style="color:#fff">НИШТЯК</b> · выигрыш = <b style="color:#fff">21</b> · мимо = <b style="color:#fff">БИЧ</b></div></div>' +
    '</div>';
  const reels = document.getElementById('reels');
  for (let r = 0; r < m.reels; r++) {
    const reel = document.createElement('div'); reel.className = 'reel'; reel.id = 'reel' + r;
    const inner = document.createElement('div'); inner.className = 'reel-inner'; inner.id = 'inner' + r;
    for (let i = 0; i < 3; i++) inner.appendChild(symEl(pickSlotSym(m.kind)));
    reel.appendChild(inner); reels.appendChild(reel);
  }
  updateSlotBtn(); updateAutoUI();
  if (pk) setTimeout(openPick, 200);
}
function normBet(v) { const m = curMachine; v = Math.floor(+v || m.minBet); v = Math.max(m.minBet, Math.min(CONFIG.slotsMaxBet, v, Math.max(m.minBet, S.gems))); return Math.round(v / m.minBet) * m.minBet || m.minBet; }
function setBet(v) { if (busy.slot || fsActive() || pickActive()) return; bets[curMachine.id] = normBet(v); const i = document.getElementById('bet'); if (i) i.value = bets[curMachine.id]; updateSlotBtn(); }
function chBet(d) { setBet(bets[curMachine.id] + d); }
function updateSlotBtn() {
  const b = document.getElementById('slot-btn'); if (!b) return;
  const fs = fsActive(), pk = pickActive();
  b.disabled = busy.slot || !!document.getElementById('fs-ov') || (!fs && !pk && !canPay(bets[curMachine.id]));
  b.textContent = pk ? '🎯 БОНУС-ИГРА' : fs ? '⭐ ФРИСПИН' : 'КРУТИТЬ';
  fsRowUI();
}
// ---------- фриспины ----------
function fsActive() { const f = S && S.slotFs; return f && f.left > 0 && MACHINES.some(m => m.id === f.m) ? f : null; }
function fsRowUI() {
  const el = document.getElementById('fs-row'); if (!el) return;
  const f = fsActive();
  el.innerHTML = f ? '⭐ Фриспины: <b>' + (f.total - f.left) + '/' + f.total + '</b> · ставка ' + gemHTML(f.bet) + ' · выиграно ' + gemHTML(f.win || 0) + (f.gift ? ' · 🎁 подарок' : '') : '';
  el.style.display = f ? '' : 'none';
}
function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; }
function fsBanner(title, text, btn, fn) {
  const ov = document.createElement('div'); ov.className = 'fs-ov'; ov.id = 'fs-ov';
  ov.innerHTML = '<div class="fs-box"><div class="fs-title">' + title + '</div><div class="fs-res">' + text + '</div><button class="btn green big" id="fs-go">' + btn + '</button></div>';
  document.body.appendChild(ov); updateSlotBtn();
  document.getElementById('fs-go').onclick = () => { ov.remove(); updateSlotBtn(); if (fn) fn(); };
}
function fsFinish() {
  const f = S.slotFs; S.slotFs = null; save(); updateSlotBtn();
  const lw = document.getElementById('last-win');
  if (lw) lw.innerHTML = '⭐ Фриспины закончились: ' + f.total + ' шт. — итого +' + gemHTML(f.win || 0);
  feed('⭐ Фриспины в слотах: ' + f.total + ' шт., выигрыш +' + fmt(f.win || 0) + ' 🔶', 'var(--gold2)');
  if ((f.win || 0) >= f.bet * 20) hype('НИШТЯК');
  showModal('⭐', 'Фриспины: +' + fmt(f.win || 0), f.total + ' ' + plural(f.total, 'фриспин', 'фриспина', 'фриспинов') + ' по ставке ' + fmt(f.bet) + ' принесли ' + fmt(f.win || 0) + ' кристаллов.', (f.win || 0) > 0 ? 'ok' : '');
}
// ---------- бонус-игра Pick-and-Click ----------
function pickActive() { const p = S && S.slotPick; return p && p.left > 0 && MACHINES.some(m => m.id === p.m) ? p : null; }
function pickStart(m, bet) {
  const P = CONFIG.slotBonus.pick, vals = [];
  for (let i = 0; i < P.n; i++) vals.push(rollW(P.vals));
  S.slotPick = { m: m.id, bet, vals, open: [], left: P.open, win: 0 }; save();
}
function openPick() {
  const p = pickActive(); if (!p || document.getElementById('pk-ov')) return;
  const ov = document.createElement('div'); ov.className = 'fs-ov'; ov.id = 'pk-ov';
  ov.innerHTML = '<div class="fs-box pk-box"><div class="fs-title">🎯 БОНУС-ИГРА</div><div class="muted" style="font-size:.85rem">Открой ' + CONFIG.slotBonus.pick.open + ' сундука. В каждом — множитель ставки ' + gemHTML(p.bet) + '</div><div class="pk-grid" id="pk-grid"></div><div class="fs-res" id="pk-res"></div><button class="btn green big" id="pk-done" style="display:none">Забрать</button></div>';
  document.body.appendChild(ov); updateSlotBtn(); pickDraw();
}
function pickDraw() {
  const p = S.slotPick, g = document.getElementById('pk-grid'); if (!p || !g) return;
  const done = p.left <= 0;
  g.innerHTML = p.vals.map((v, i) => { const op = p.open.includes(i); return '<button class="pk-cell' + (op ? ' open' : done ? ' rest' : '') + '" ' + (op || done ? 'disabled' : 'data-click="pickOpen(' + i + ')"') + '>' + (op || done ? '×' + v : '🎁') + '</button>'; }).join('');
  document.getElementById('pk-res').innerHTML = 'Осталось открыть: <b>' + Math.max(0, p.left) + '</b> · выигрыш: ' + gemHTML(p.win);
  if (done) { const b = document.getElementById('pk-done'); b.style.display = ''; b.onclick = pickFinish; }
}
function pickOpen(i) {
  const p = pickActive(); i = +i; if (!p || p.open.includes(i) || i < 0 || i >= p.vals.length) return;
  p.open.push(i); p.left--; const g = Math.floor(p.bet * p.vals[i]); p.win += g; addGems(g); sfx(p.vals[i] >= 10 ? 'win' : 'coin');
  save(); updateTop(); pickDraw();
}
function pickFinish() {
  const p = S.slotPick; S.slotPick = null; save();
  const ov = document.getElementById('pk-ov'); if (ov) ov.remove();
  const lw = document.getElementById('last-win'); if (lw) lw.innerHTML = '🎯 Бонус-игра: +' + gemHTML(p ? p.win : 0);
  if (p) { feed('🎯 Бонус-игра в слотах: +' + fmt(p.win) + ' 🔶', 'var(--gold2)'); if (p.win >= p.bet * 30) hype('НИШТЯК'); }
  updateSlotBtn(); updateTop();
}
// сетка 3 ряда × N барабанов: grid[барабан][ряд]
function rollGrid(m, free) { const g = []; for (let r = 0; r < m.reels; r++) g.push([pickSlotSym(m.kind, m, free), pickSlotSym(m.kind, m, free), pickSlotSym(m.kind, m, free)]); return g; }
function spinSlots() {
  if (pickActive()) return openPick();
  const fs = fsActive();
  if (fs && curMachine.id !== fs.m) { curMachine = MACHINES.find(x => x.id === fs.m); renderSlotTab(); }
  const m = curMachine, bet = fs ? Math.min(CONFIG.slotsMaxBet, Math.max(m.minBet, Math.floor(+fs.bet) || m.minBet)) : bets[m.id];
  if (busy.slot || document.getElementById('fs-ov') || modalOpen || currentTab !== 'slots') return;
  if (fs) { busy.slot = true; fs.left--; busy.slotFree = true; save(); updateSlotBtn(); }
  else {
    if (!canPay(bet)) return showModal('🔶', 'Мало кристаллов', 'Ставка ' + fmt(bet) + ' 🔶', 'bad');
    busy.slot = true; busy.slotFree = false; addGems(-bet); S.spins++; track('slotSpins'); updateTop(); updateSlotBtn();
  }
  const lw = document.getElementById('last-win'); lw.textContent = ''; lw.className = 'last-win';
  const ls = document.getElementById('slot-lines'); if (ls) ls.innerHTML = '';
  const grid = rollGrid(m, !!fs);
  const durBase = speed === 'fast' ? 500 : 1500, durStep = speed === 'fast' ? 140 : 380;
  let done = 0;
  for (let r = 0; r < m.reels; r++) {
    const inner = document.getElementById('inner' + r);
    document.getElementById('reel' + r).classList.remove('win-reel');
    const keep = [...inner.children].slice(-3).map(x => x.cloneNode(true));
    inner.innerHTML = '';
    keep.forEach(k => inner.appendChild(k));
    for (let i = 0; i < REEL_N; i++) inner.appendChild(symEl(i >= REEL_N - 3 ? grid[r][i - (REEL_N - 3)] : pickSlotSym(m.kind)));
    const h = (inner.children[0] && inner.children[0].offsetHeight) || 88;
    inner.style.transition = 'none'; inner.style.transform = 'translateY(0)';
    void inner.offsetWidth;
    const dur = durBase + r * durStep;
    inner.style.transition = 'transform ' + dur + 'ms cubic-bezier(.2,.75,.25,1.04)';
    inner.style.transform = 'translateY(' + (-REEL_N * h) + 'px)';
    setTimeout(() => {
      sfx('tick');
      while (inner.children.length > 3) inner.removeChild(inner.firstChild);
      inner.style.transition = 'none'; inner.style.transform = 'translateY(0)';
      if (++done === m.reels) evalSlots(m, bet, grid);
    }, dur + 60);
  }
}
// разбор выигрыша по линиям (чистая функция — её же проверяет симулятор экономики)
function slotLineWins(m, grid) {
  const per = 1 / m.lines * ((m.fx && m.fx.pay) || 1), wins = [];
  SLOT_LINES[m.reels].forEach((ln, li) => {
    const syms = ln.map((row, r) => grid[r][row]);
    const r0 = syms[0].rarity; if (r0 === 'sp') return;
    let n = 1; while (n < syms.length && syms[n].rarity === r0) n++;
    let mult = 0;
    if (m.reels === 3) mult = n === 3 ? m.full[r0] : n === 2 ? m.pair[r0] : 0;
    else mult = n === 5 ? m.p5[r0] : n === 4 ? m.p4[r0] : n === 3 ? m.p3[r0] : 0;
    if (mult) wins.push({ li, n, rarity: r0, mult: mult * per, syms: syms.slice(0, n), full: n === m.reels });
  });
  return wins;
}
// итог крутки (чистая функция): множитель выигрыша, скаттеры, символы выбора, молнии
function slotSpinResult(m, grid, free, fsMulRoll) {
  const wins = slotLineWins(m, grid), flat = [].concat(...grid);
  let x = wins.reduce((a, w) => a + w.mult, 0);
  const orbs = flat.filter(s => s.sp === 'mx').reduce((a, s) => a + s.mul, 0);
  if (x > 0 && orbs > 0) x *= orbs;
  const fsMul = free && x > 0 ? (fsMulRoll != null ? fsMulRoll : rollW(CONFIG.slotBonus.fsMul)) : 1;
  x *= fsMul;
  return { wins, x, orbs, fsMul, sc: flat.filter(s => s.sp === 'sc').length, pk: flat.filter(s => s.sp === 'pk').length };
}
function evalSlots(m, bet, grid) {
  const free = busy.slotFree; busy.slotFree = false;
  const R = slotSpinResult(m, grid, free), wins = R.wins;
  const lw = document.getElementById('last-win');
  const full = wins.some(w => w.full);
  if (full) hype('НИШТЯК'); else if (wins.length) hype('21'); else if (!R.sc && !R.pk) hype('БИЧ');
  drawSlotLines(m, wins);
  const win = Math.floor(bet * R.x);
  if (win > 0) {
    addGems(win);
    lw.innerHTML = (full ? '🎉 ' : '✨ ') + wins.length + ' лин.' + (R.orbs && R.x ? ' · ⚡×' + R.orbs : '') + (R.fsMul > 1 ? ' · ⭐×' + R.fsMul : '') + ' — +' + gemHTML(win);
    lw.className = 'last-win' + (win < bet && !free ? ' lose' : '');
  } else { lw.textContent = free ? '⭐ Фриспин без выигрыша' : '😢 Ни одной линии'; lw.className = 'last-win lose'; }
  if (free && S.slotFs) S.slotFs.win = (S.slotFs.win || 0) + win;
  const B = CONFIG.slotBonus;
  let newFs = false, newPk = false;
  if (R.sc >= 3) {
    if (free && S.slotFs) { S.slotFs.left += B.fsRetrig; S.slotFs.total += B.fsRetrig; lw.innerHTML += ' · ⭐ +' + B.fsRetrig + ' фриспинов!'; }
    else if (!fsActive()) { S.slotFs = { m: m.id, bet, left: B.fsSpins, total: B.fsSpins, win: 0 }; newFs = true; }
  }
  if (!free && R.pk >= 3 && !pickActive()) { pickStart(m, bet); newPk = true; }
  busy.slot = false; updateTop(); updateSlotBtn(); save();
  if (newFs || newPk) {
    if (autoTotal) stopAuto(newFs ? 'выпали фриспины!' : 'бонус-игра!');
    hype('БОНУС'); sfx('win');
    if (newPk) return setTimeout(openPick, 500);
    return setTimeout(() => fsBanner('⭐ ' + B.fsSpins + ' ФРИСПИНОВ!', R.sc + ' знака BONUS. Каждый выигрыш во фриспинах умножится на ×2…×10. Ставка ' + gemHTML(bet), '▶ Начать', spinSlots), 500);
  }
  if (free) {
    if (!S.slotFs || S.slotFs.left <= 0) return fsFinish();
    return setTimeout(() => { if (fsActive() && currentTab === 'slots' && !modalOpen) spinSlots(); }, speed === 'fast' ? 350 : 800);
  }
  afterSlotSpin(full, win > 0);
}
// 2.9: расчёт отдачи с бонусами (для тестов и баланса): средний выигрыш на 1 ставку
function simSlotRTP(id, spins) {
  const m = MACHINES.find(x => x.id === id), B = CONFIG.slotBonus, P = B.pick;
  const pickEV = P.open * P.vals.reduce((a, v) => a + v[0] * v[1], 0) / P.vals.reduce((a, v) => a + v[1], 0);
  let base = 0, fs = 0, pk = 0, nFs = 0, nPk = 0;
  for (let k = 0; k < spins; k++) {
    const R = slotSpinResult(m, rollGrid(m, false), false);
    base += R.x;
    if (R.pk >= 3) { pk += pickEV; nPk++; }
    if (R.sc >= 3) { nFs++; let left = B.fsSpins; while (left > 0 && left < 500) { left--; const F = slotSpinResult(m, rollGrid(m, true), true); fs += F.x; if (F.sc >= 3) left += B.fsRetrig; } }
  }
  return { base: base / spins, fs: fs / spins, pick: pk / spins, rtp: (base + fs + pk) / spins, fsEvery: nFs ? spins / nFs : 0, pickEvery: nPk ? spins / nPk : 0 };
}
function drawSlotLines(m, wins) {
  const svg = document.getElementById('slot-lines'), box = document.getElementById('reels'); if (!svg || !box) return;
  const B = box.getBoundingClientRect(); svg.setAttribute('width', B.width); svg.setAttribute('height', B.height);
  const reelEls = [...box.querySelectorAll('.reel')];
  svg.innerHTML = wins.map(w => {
    const pts = SLOT_LINES[m.reels][w.li].map((row, r) => { const R = reelEls[r].getBoundingClientRect(); return (R.left - B.left + R.width / 2).toFixed(0) + ',' + (R.top - B.top + R.height * (row + 0.5) / 3).toFixed(0); }).join(' ');
    return '<polyline points="' + pts + '" fill="none" stroke="' + LINE_COLORS[w.li % 10] + '" stroke-width="4" stroke-linejoin="round" opacity=".9"/>';
  }).join('');
}
