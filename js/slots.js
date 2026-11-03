// ================= SLOTS (4 машины) =================
const SLOT_HERO_POOL = {
  common: ['pudge','axe','sniper','lion','bristleback','sand_king','witch_doctor','shadow_shaman','venomancer','tusk','jakiro','bane','warlock'],
  uncommon: ['drow_ranger','lina','windrunner','viper','razor','silencer','dazzle','undying','tidehunter','spirit_breaker','mirana','luna','clinkz'],
  rare: ['juggernaut','legion_commander','sven','slark','ursa','bloodseeker','riki','bounty_hunter','nyx_assassin','weaver','troll_warlord','gyrocopter','kunkka'],
  mythical: ['antimage','templar_assassin','ember_spirit','void_spirit','storm_spirit','earth_spirit','morphling','medusa','faceless_void','spectre','puck','muerta','marci'],
  immortal: ['phantom_assassin','nevermore','queenofpain','rubick','zuus','windrunner','lina','juggernaut','antimage','ember_spirit','crystal_maiden','axe','kez'],
  arcana: ['juggernaut','phantom_assassin','nevermore','crystal_maiden','legion_commander','pudge','invoker','terrorblade','ogre_magi','monkey_king','queenofpain','drow_ranger','earthshaker','faceless_void','lina','rubick']
};
const SLOT_W = { common: 26, uncommon: 19, rare: 15, mythical: 11, immortal: 7, arcana: 4 };
const MACHINES = [
  { id: 'imm3', name: 'Immortal 3×3', reels: 3, kind: 'hero', theme: 'theme-immortal', light: '#e4ae39', sub: '3×3 · 5 линий · герои · 3 в линию = скин героя' },
  { id: 'arc5', name: 'Arcana 3×5', reels: 5, kind: 'hero', theme: 'theme-arcana', light: '#ade55c', sub: '3×5 · 10 линий · герои · 4–5 в линию = скин' },
  { id: 'cos3', name: 'Cosmetic 3×3', reels: 3, kind: 'eq', theme: 'theme-cos3', light: '#4fb6d8', sub: '3×3 · 5 линий · снаряжение · 3 в линию = предмет' },
  { id: 'cos5', name: 'Cosmetic 3×5', reels: 5, kind: 'eq', theme: 'theme-cos5', light: '#a874ff', sub: '3×5 · 10 линий · снаряжение · 5 в линию = 2 предмета' }
];
MACHINES.forEach(m => Object.assign(m, CONFIG.slots[m.id]));   // ставки и выплаты — из CONFIG
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
    b.onclick = () => { if (busy.slot || autoTotal) return; curMachine = m; renderSlotTab(); };
    st.appendChild(b);
    bets[m.id] = bets[m.id] || m.minBet;
  });
}
function pickSlotSym(kind) {
  const tot = Object.values(SLOT_W).reduce((a, b) => a + b, 0);
  let r = Math.random() * tot, rar = 'common';
  for (const k in SLOT_W) { r -= SLOT_W[k]; if (r <= 0) { rar = k; break; } }
  if (kind === 'hero') return { rarity: rar, hero: pick(SLOT_HERO_POOL[rar]) };
  const c = pickCatalog(rar);
  return { rarity: rar, item: c };
}
function symEl(sym) {
  const d = document.createElement('div');
  d.className = 'ritem' + (sym.hero ? ' hero' : '');
  d.appendChild(mkImg(sym.hero ? heroImgChain(sym.hero) : [itemImg(sym.item.path)], sym.hero || sym.item.name));
  const n = document.createElement('div'); n.className = 'rn'; n.textContent = RARITY_NAMES[sym.rarity];
  n.style.background = RARITY_COLOR[sym.rarity];
  d.appendChild(n);
  return d;
}
function slotPayRows(m) {
  const R = RARITIES.slice().reverse();
  if (m.reels === 3) return R.map(r => '<div><span class="pay-dot" style="background:' + RARITY_COLOR[r] + '"></span>' + RARITY_NAMES[r] + ' ×3 <b>×' + m.full[r] + '</b> · ×2 <b>×' + m.pair[r] + '</b></div>').join('');
  return R.map(r => '<div><span class="pay-dot" style="background:' + RARITY_COLOR[r] + '"></span>' + RARITY_NAMES[r] + ' 5 <b>×' + m.p5[r] + '</b> · 4 <b>×' + m.p4[r] + '</b> · 3 <b>×' + m.p3[r] + '</b></div>').join('');
}
function renderSlotTab() {
  const m = curMachine;
  document.querySelectorAll('#slot-subtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === m.id));
  const host = document.getElementById('slot-machine-host');
  const maxB = CONFIG.slotsMaxBet;
  host.innerHTML =
    '<div class="slot-machine ' + m.theme + '">' +
    '<div class="machine-lights" style="color:' + m.light + '">' + '<i></i>'.repeat(16) + '</div>' +
    '<div class="sm-title">' + m.name + '</div><div class="sm-sub">' + m.sub + '</div>' +
    '<div class="reels grid3" id="reels" style="grid-template-columns:repeat(' + m.reels + ',1fr)"><svg class="slot-lines" id="slot-lines"></svg></div>' +
    '<div class="bet-row"><button class="btn sm" data-click="chBet(-10000)">−10к</button><button class="btn sm" data-click="chBet(-' + m.minBet + ')">−</button>' +
    '<input type="number" id="bet" min="' + m.minBet + '" step="' + m.minBet + '" value="' + bets[m.id] + '" data-change="setBet(this.value)"><img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">' +
    '<button class="btn sm" data-click="chBet(' + m.minBet + ')">+</button><button class="btn sm" data-click="chBet(10000)">+10к</button><button class="btn sm ghost" data-click="setBet(1e9)">MAX</button></div>' +
    '<div style="margin-top:12px"><button class="btn green big" id="slot-btn" data-click="spinSlots()">КРУТИТЬ</button></div><div id="auto-row"></div><div id="auto-info"></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:4px">ставка на все ' + m.lines + ' линий · мин. ' + m.minBet + ' · макс ' + fmt(maxB) + ' · <kbd>Пробел</kbd></div>' +
    '<div class="last-win" id="last-win"></div>' +
    '<div class="paytable"><h4>Выплаты за линию · ставка/' + m.lines + ' × множитель</h4><div class="paygrid">' + slotPayRows(m) + '</div>' +
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
}
function normBet(v) { const m = curMachine; v = Math.floor(+v || m.minBet); v = Math.max(m.minBet, Math.min(CONFIG.slotsMaxBet, v, Math.max(m.minBet, S.gems))); return Math.round(v / m.minBet) * m.minBet || m.minBet; }
function setBet(v) { if (busy.slot) return; bets[curMachine.id] = normBet(v); const i = document.getElementById('bet'); if (i) i.value = bets[curMachine.id]; updateSlotBtn(); }
function chBet(d) { setBet(bets[curMachine.id] + d); }
function updateSlotBtn() { const b = document.getElementById('slot-btn'); if (b) b.disabled = busy.slot || !canPay(bets[curMachine.id]); }
// сетка 3 ряда × N барабанов: grid[барабан][ряд]
function rollGrid(m) { const g = []; for (let r = 0; r < m.reels; r++) g.push([pickSlotSym(m.kind), pickSlotSym(m.kind), pickSlotSym(m.kind)]); return g; }
function spinSlots() {
  const m = curMachine, bet = bets[m.id];
  if (busy.slot || modalOpen || currentTab !== 'slots') return;
  if (!canPay(bet)) return showModal('🔶', 'Мало кристаллов', 'Ставка ' + fmt(bet) + ' 🔶', 'bad');
  busy.slot = true; addGems(-bet); S.spins++; track('slotSpins'); updateTop(); updateSlotBtn();
  const lw = document.getElementById('last-win'); lw.textContent = ''; lw.className = 'last-win';
  const ls = document.getElementById('slot-lines'); if (ls) ls.innerHTML = '';
  const grid = rollGrid(m);
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
      // оставляем в барабане только 3 видимых символа (без лишних картинок в памяти)
      while (inner.children.length > 3) inner.removeChild(inner.firstChild);
      inner.style.transition = 'none'; inner.style.transform = 'translateY(0)';
      if (++done === m.reels) evalSlots(m, bet, grid);
    }, dur + 60);
  }
}
// разбор выигрыша по линиям (чистая функция — её же проверяет симулятор экономики)
function slotLineWins(m, grid) {
  const per = 1 / m.lines, wins = [];
  SLOT_LINES[m.reels].forEach((ln, li) => {
    const syms = ln.map((row, r) => grid[r][row]);
    const r0 = syms[0].rarity; let n = 1; while (n < syms.length && syms[n].rarity === r0) n++;
    let mult = 0;
    if (m.reels === 3) mult = n === 3 ? m.full[r0] : n === 2 ? m.pair[r0] : 0;
    else mult = n === 5 ? m.p5[r0] : n === 4 ? m.p4[r0] : n === 3 ? m.p3[r0] : 0;
    if (mult) wins.push({ li, n, rarity: r0, mult: mult * per, syms: syms.slice(0, n), full: n === m.reels, drop: m.reels === 3 ? n === 3 : n >= 4 });
  });
  return wins;
}
function evalSlots(m, bet, grid) {
  const wins = slotLineWins(m, grid);
  const lw = document.getElementById('last-win');
  const total = wins.reduce((a, w) => a + w.mult, 0);
  const full = wins.some(w => w.full);
  if (full) hype('НИШТЯК'); else if (wins.length) hype('21'); else hype('БИЧ');
  drawSlotLines(m, wins);
  if (total > 0) {
    const win = Math.floor(bet * total);
    addGems(win);
    // предметы: за каждую «предметную» линию, но не больше 2 за крутку
    const got = [];
    wins.filter(w => w.drop).sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity)).slice(0, 2).forEach(w => {
      const s = w.syms[0];
      const cnt = m.kind === 'eq' && w.n === 5 ? 2 : 1;
      for (let i = 0; i < cnt && got.length < 2; i++) {
        if (m.kind === 'hero') { let r = w.rarity; if (m.boost && Math.random() < m.boost && rarityIdx(r) < 5) r = RARITIES[rarityIdx(r) + 1]; got.push(addSkin(s.hero, r)); }
        else { const it = eqFromCatalog(w.syms[i % w.syms.length].item, S.uid++); S.items.unshift(it); autoEquip(it, it.heroId); noteDrop(it); got.push(it); }
      }
    });
    lw.innerHTML = (full ? '🎉 ' : '✨ ') + wins.length + ' лин. — +' + gemHTML(win) + (got.length ? ' · ' + got.map(g => '<span style="color:' + RARITY_COLOR[g.rarity] + '">' + esc(g.name) + '</span>').join(', ') : '');
    lw.className = 'last-win' + (win < bet ? ' lose' : '');
  } else {
    lw.textContent = '😢 Ни одной линии'; lw.className = 'last-win lose';
    if (Math.random() < 0.05) { const it = addEquipment(pick(HEROES).id, 'common'); lw.textContent += ' · утешительный ' + it.name; }
  }
  busy.slot = false; updateTop(); updateSlotBtn(); save();
  afterSlotSpin(full, total > 0);
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
