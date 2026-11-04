// ================= SLOTS (4 машины) =================
const SLOT_HERO_POOL = {
  common: ['pudge','axe','sniper','lion','bristleback','sand_king','witch_doctor','shadow_shaman','venomancer','tusk','jakiro','bane','warlock'],
  uncommon: ['drow_ranger','lina','windrunner','viper','razor','silencer','dazzle','undying','tidehunter','spirit_breaker','mirana','luna','clinkz'],
  rare: ['juggernaut','legion_commander','sven','slark','ursa','bloodseeker','riki','bounty_hunter','nyx_assassin','weaver','troll_warlord','gyrocopter','kunkka'],
  mythical: ['antimage','templar_assassin','ember_spirit','void_spirit','storm_spirit','earth_spirit','morphling','medusa','faceless_void','spectre','puck','muerta','marci'],
  immortal: ['phantom_assassin','nevermore','queenofpain','rubick','zuus','windrunner','lina','juggernaut','antimage','ember_spirit','crystal_maiden','axe','kez'],
  arcana: ['juggernaut','phantom_assassin','nevermore','crystal_maiden','legion_commander','pudge','invoker','terrorblade','ogre_magi','monkey_king','queenofpain','drow_ranger','earthshaker','faceless_void','lina','rubick']
};
const SLOT_W = { common: 27, uncommon: 20, rare: 15, mythical: 11, immortal: 7, arcana: 4 };   // 2.5.3: чуть чаще совпадения (common 26→27, uncommon 19→20)
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
    b.onclick = () => { if (busy.slot || autoTotal || fsActive()) return; curMachine = m; renderSlotTab(); };
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
    '<div style="margin-top:12px"><button class="btn green big" id="slot-btn" data-click="spinSlots()">КРУТИТЬ</button></div><div id="fs-row" class="fs-row" style="display:none"></div><div id="auto-row"></div><div id="auto-info"></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:4px">🎁 шанс бонусных спинов ' + Math.round(CONFIG.slotsBonus.chance * 100) + '% за крутку (1–10 бесплатных) · ставка на все ' + m.lines + ' линий · мин. ' + m.minBet + ' · макс ' + fmt(maxB) + ' · <kbd>Пробел</kbd></div>' +
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
function setBet(v) { if (busy.slot || fsActive()) return; bets[curMachine.id] = normBet(v); const i = document.getElementById('bet'); if (i) i.value = bets[curMachine.id]; updateSlotBtn(); }
function chBet(d) { setBet(bets[curMachine.id] + d); }
function updateSlotBtn() {
  const b = document.getElementById('slot-btn'); if (!b) return;
  const fs = fsActive();
  b.disabled = busy.slot || fsWheelOpen || (!fs && !canPay(bets[curMachine.id]));
  b.textContent = fs ? '🎁 БЕСПЛАТНЫЙ СПИН' : 'КРУТИТЬ';
  fsRowUI();
}
// ---------- 2.7.2: бонусные (бесплатные) спины ----------
let fsWheelOpen = false;
function fsActive() { const f = S && S.slotFs; return f && f.left > 0 && MACHINES.some(m => m.id === f.m) ? f : null; }
function fsRowUI() {
  const el = document.getElementById('fs-row'); if (!el) return;
  const f = fsActive();
  el.innerHTML = f ? '🎁 Бонусные спины: <b>' + (f.total - f.left) + '/' + f.total + '</b> · ставка ' + gemHTML(f.bet) + ' · выиграно ' + gemHTML(f.win || 0) : '';
  el.style.display = f ? '' : 'none';
}
function rollFsCount(r) { const w = CONFIG.slotsBonus.w, tot = w.reduce((a, b) => a + b, 0); let x = (r == null ? Math.random() : r) * tot; for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i + 1; } return w.length; }
function openFsWheel(m, bet) {
  if (autoTotal) stopAuto('выпали бонусные спины!');
  const n = rollFsCount();
  S.slotFs = { m: m.id, bet, left: n, total: n, win: 0 }; save();   // сохраняем сразу — перезагрузка не отнимет спины
  fsWheelOpen = true; updateSlotBtn();
  const W = 74, CELLS = 46, stop = 38;
  const cells = []; for (let i = 0; i < CELLS; i++) cells.push(i === stop ? n : 1 + Math.floor(Math.random() * 10));
  const col = k => k >= 9 ? '#ade55c' : k >= 7 ? '#e4ae39' : k >= 5 ? '#c8a4ff' : k >= 3 ? '#4fb6d8' : '#8a8f98';
  const ov = document.createElement('div'); ov.className = 'fs-ov'; ov.id = 'fs-ov';
  ov.innerHTML = '<div class="fs-box"><div class="fs-title">🎁 БОНУСНЫЕ СПИНЫ!</div><div class="muted" style="font-size:.85rem">Рулетка решит, сколько бесплатных спинов по ставке ' + gemHTML(bet) + '</div>' +
    '<div class="fs-wheel"><div class="fs-mark"></div><div class="fs-strip" id="fs-strip">' + cells.map(k => '<div class="fs-cell" style="border-color:' + col(k) + ';color:' + col(k) + '">' + k + '</div>').join('') + '</div></div>' +
    '<div class="fs-res" id="fs-res">&nbsp;</div><button class="btn green big" id="fs-go" disabled>Крутится…</button></div>';
  document.body.appendChild(ov);
  hype('БОНУС'); sfx('coin');
  const strip = document.getElementById('fs-strip'), wheel = strip.parentElement;
  const target = stop * W + W / 2 - wheel.clientWidth / 2 + (Math.random() - 0.5) * W * 0.6;
  const dur = speed === 'fast' ? 2200 : 4200;
  strip.style.transform = 'translateX(0)'; void strip.offsetWidth;
  strip.style.transition = 'transform ' + dur + 'ms cubic-bezier(.12,.7,.18,1)';
  strip.style.transform = 'translateX(' + (-target) + 'px)';
  setTimeout(() => {
    sfx('win');
    strip.children[stop].classList.add('hit');
    document.getElementById('fs-res').innerHTML = 'Выпало: <b style="color:' + col(n) + '">' + n + '</b> ' + plural(n, 'бесплатный спин', 'бесплатных спина', 'бесплатных спинов');
    const go = document.getElementById('fs-go'); go.disabled = false; go.textContent = '▶ Начать';
    go.onclick = () => { ov.remove(); fsWheelOpen = false; updateSlotBtn(); spinSlots(); };
  }, dur + 150);
}
function plural(n, a, b, c) { const m10 = n % 10, m100 = n % 100; return m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c; }
function fsFinish() {
  const f = S.slotFs; S.slotFs = null; save(); updateSlotBtn();
  const lw = document.getElementById('last-win');
  if (lw) lw.innerHTML = '🎁 Бонусные спины закончились: ' + f.total + ' шт. — итого +' + gemHTML(f.win || 0);
  feed('🎁 Бонусные спины в слотах: ' + f.total + ' шт., выигрыш +' + fmt(f.win || 0) + ' 🔶', 'var(--gold2)');
  showModal('🎁', 'Бонусные спины: +' + fmt(f.win || 0), f.total + ' ' + plural(f.total, 'бесплатный спин', 'бесплатных спина', 'бесплатных спинов') + ' по ставке ' + fmt(f.bet) + ' принесли ' + fmt(f.win || 0) + ' кристаллов.', (f.win || 0) > 0 ? 'ok' : '');
}
// сетка 3 ряда × N барабанов: grid[барабан][ряд]
function rollGrid(m) { const g = []; for (let r = 0; r < m.reels; r++) g.push([pickSlotSym(m.kind), pickSlotSym(m.kind), pickSlotSym(m.kind)]); return g; }
function spinSlots() {
  const fs = fsActive();
  if (fs && curMachine.id !== fs.m) { curMachine = MACHINES.find(x => x.id === fs.m); renderSlotTab(); }
  const m = curMachine, bet = fs ? Math.min(CONFIG.slotsMaxBet, Math.max(m.minBet, Math.floor(+fs.bet) || m.minBet)) : bets[m.id];
  if (busy.slot || fsWheelOpen || modalOpen || currentTab !== 'slots') return;
  if (fs) { busy.slot = true; fs.left--; busy.slotFree = true; save(); updateSlotBtn(); }
  else {
    if (!canPay(bet)) return showModal('🔶', 'Мало кристаллов', 'Ставка ' + fmt(bet) + ' 🔶', 'bad');
    busy.slot = true; busy.slotFree = false; addGems(-bet); S.spins++; track('slotSpins'); updateTop(); updateSlotBtn();
  }
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
    if (busy.slotFree && S.slotFs) S.slotFs.win = (S.slotFs.win || 0) + win;
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
  const free = busy.slotFree; busy.slotFree = false;
  busy.slot = false; updateTop(); updateSlotBtn(); save();
  if (free) {   // бесплатный спин: следующий сам, в конце — итог
    if (!S.slotFs || S.slotFs.left <= 0) return fsFinish();
    return setTimeout(() => { if (fsActive() && currentTab === 'slots' && !modalOpen) spinSlots(); }, speed === 'fast' ? 350 : 800);
  }
  if (Math.random() < CONFIG.slotsBonus.chance) return openFsWheel(m, bet);
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
