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
  { id: 'imm3', name: 'Immortal Slot 3', reels: 3, kind: 'hero', theme: 'theme-immortal', light: '#e4ae39', 
    sub: '3 барабана · герои · выигрыш = скин героя', },
  { id: 'arc5', name: 'Arcana Slot 5', reels: 5, kind: 'hero', theme: 'theme-arcana', light: '#ade55c', 
    sub: '5 барабанов · герои · шанс повышения редкости скина', },
  { id: 'cos3', name: 'Cosmetic Slot 3', reels: 3, kind: 'eq', theme: 'theme-cos3', light: '#4fb6d8', 
    sub: '3 барабана · снаряжение · выигрыш = предмет с барабана', },
  { id: 'cos5', name: 'Cosmetic Slot 5', reels: 5, kind: 'eq', theme: 'theme-cos5', light: '#a874ff', 
    sub: '5 барабанов · снаряжение · за 4+ совпадения — 2 предмета', }
];
MACHINES.forEach(m => Object.assign(m, CONFIG.slots[m.id]));   // ставки и выплаты — из CONFIG
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
function renderSlotTab() {
  const m = curMachine;
  document.querySelectorAll('#slot-subtabs button').forEach(b => b.classList.toggle('active', b.dataset.m === m.id));
  const host = document.getElementById('slot-machine-host');
  const rows = RARITIES.slice().reverse().map(r => '<div><span class="pay-dot" style="background:' + RARITY_COLOR[r] + '"></span>' + RARITY_NAMES[r] + ' ×' + m.reels + ' <b>×' + m.full[r] + '</b></div>').join('');
  const extra = Object.keys(m.multi).sort((a, b) => b - a).map(k => '<div>' + k + ' одинаковых <b>×' + m.multi[k] + '</b></div>').join('') + (m.arcAny ? '<div>Arcana где угодно <b>×' + m.arcAny + '</b></div>' : '');
  host.innerHTML =
    '<div class="slot-machine ' + m.theme + '">' +
    '<div class="machine-lights" style="color:' + m.light + '">' + '<i></i>'.repeat(16) + '</div>' +
    '<div class="sm-title">' + m.name + '</div><div class="sm-sub">' + m.sub + '</div>' +
    '<div class="reels" id="reels" style="grid-template-columns:repeat(' + m.reels + ',1fr)"><div class="payline"></div></div>' +
    '<div class="bet-row"><button class="btn sm" data-click="chBet(-1000)">−1000</button><button class="btn sm" data-click="chBet(-' + m.minBet + ')">−</button>' +
    '<input type="number" id="bet" min="' + m.minBet + '" step="' + m.minBet + '" value="' + bets[m.id] + '" data-change="setBet(this.value)"><img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">' +
    '<button class="btn sm" data-click="chBet(' + m.minBet + ')">+</button><button class="btn sm" data-click="chBet(1000)">+1000</button><button class="btn sm ghost" data-click="setBet(1e9)">MAX</button></div>' +
    '<div style="margin-top:12px"><button class="btn green big" id="slot-btn" data-click="spinSlots()">КРУТИТЬ</button></div><div id="auto-row"></div><div id="auto-info"></div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:4px">мин. ставка ' + m.minBet + ' · макс 50 000 · <kbd>Пробел</kbd></div>' +
    '<div class="last-win" id="last-win"></div>' +
    '<div class="paytable"><h4>Выплаты · ' + m.name + '</h4><div class="paygrid">' + rows + extra + '</div>' +
    '<div class="muted" style="font-size:.72rem;margin-top:6px;text-align:center">Все совпадения = <b style="color:#fff">НИШТЯК</b> · 2+ одной редкости = <b style="color:#fff">21</b> · мимо = <b style="color:#fff">БИЧ</b></div></div>' +
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
function normBet(v) { const m = curMachine; v = Math.floor(+v || m.minBet); v = Math.max(m.minBet, Math.min(50000, v, Math.max(m.minBet, S.gems))); return Math.round(v / m.minBet) * m.minBet || m.minBet; }
function setBet(v) { if (busy.slot) return; bets[curMachine.id] = normBet(v); const i = document.getElementById('bet'); if (i) i.value = bets[curMachine.id]; updateSlotBtn(); }
function chBet(d) { setBet(bets[curMachine.id] + d); }
function updateSlotBtn() { const b = document.getElementById('slot-btn'); if (b) b.disabled = busy.slot || !canPay(bets[curMachine.id]); }
function spinSlots() {
  const m = curMachine, bet = bets[m.id];
  if (busy.slot || modalOpen || currentTab !== 'slots') return;
  if (!canPay(bet)) return showModal('💎', 'Мало самоцветов', 'Ставка ' + fmt(bet) + ' 💎', 'bad');
  busy.slot = true; addGems(-bet); S.spins++; track('slotSpins'); updateTop(); updateSlotBtn();
  const lw = document.getElementById('last-win'); lw.textContent = ''; lw.className = 'last-win';
  const result = [];
  const durBase = speed === 'fast' ? 500 : 1500, durStep = speed === 'fast' ? 140 : 380;
  let done = 0;
  for (let r = 0; r < m.reels; r++) {
    const reelEl = document.getElementById('reel' + r); reelEl.classList.remove('win-reel');
    const inner = document.getElementById('inner' + r);
    const keep = (inner._shown || inner.children[0]) ? (inner._shown || inner.children[0]).cloneNode(true) : null;
    inner.innerHTML = '';
    if (keep) inner.appendChild(keep);
    const syms = [];
    for (let i = 0; i < REEL_N; i++) { const s = pickSlotSym(m.kind); syms.push(s); inner.appendChild(symEl(s)); }
    const stop = REEL_N - 2;              // символ на линии выплат
    result.push(syms[stop - 1]);
    inner._shown = inner.children[stop];
    const h = (inner.children[1] && inner.children[1].offsetHeight) || 132;
    inner.style.transition = 'none'; inner.style.transform = 'translateY(' + (-0) + 'px)';
    void inner.offsetWidth;
    const dur = durBase + r * durStep;
    inner.style.transition = 'transform ' + dur + 'ms cubic-bezier(.2,.75,.25,1.04)';
    // элемент с индексом stop (с учётом keep в начале) должен встать в окно
    inner.style.transform = 'translateY(' + (-(stop) * h) + 'px)';
    setTimeout(() => { sfx('tick'); if (++done === m.reels) evalSlots(m, bet, result); }, dur + 60);
  }
}
function evalSlots(m, bet, res) {
  const cnt = {}; res.forEach(s => cnt[s.rarity] = (cnt[s.rarity] || 0) + 1);
  const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a] || rarityIdx(b) - rarityIdx(a))[0];
  const n = cnt[best];
  let mult = 0, label = '', drops = 0, dropR = best;
  if (n === m.reels) { mult = m.full[best]; drops = m.kind === 'eq' && m.reels === 5 ? 2 : 1; label = RARITY_NAMES[best] + ' ×' + n; hype('НИШТЯК'); }
  else if (n >= 2) {
    mult = m.multi[n] || 0; if (mult) { drops = n >= 4 && m.kind === 'eq' ? 2 : (n >= 3 || (m.reels === 3 && CONFIG.slotPairDropsItem) ? 1 : 0); label = n + ' × ' + RARITY_NAMES[best]; }
    hype('21');
  } else hype('БИЧ');
  if (!mult && m.arcAny && cnt.arcana) { mult = m.arcAny; drops = 0; label = 'Arcana на барабане'; }
  const lw = document.getElementById('last-win');
  // подсветка выигрышных барабанов
  if (n >= 2) res.forEach((s, i) => { if (s.rarity === best) document.getElementById('reel' + i).classList.add('win-reel'); });
  if (mult > 0) {
    const win = Math.floor(bet * mult);
    addGems(win);
    const got = [];
    const matched = res.filter(s => s.rarity === dropR);
    for (let i = 0; i < drops; i++) {
      const s = matched[i % matched.length];
      if (m.kind === 'hero') {
        let r = dropR;
        if (m.boost && Math.random() < m.boost && rarityIdx(r) < 5) r = RARITIES[rarityIdx(r) + 1];
        got.push(addSkin(s.hero, r));
      } else {
        const it = eqFromCatalog(s.item, S.uid++); S.items.unshift(it); autoEquip(it, it.heroId); noteDrop(it); got.push(it);
      }
    }
    lw.innerHTML = (n === m.reels ? '🎉 ' : '✨ ') + esc(label) + ' — +' + gemHTML(win) + (got.length ? ' · ' + got.map(g => '<span style="color:' + RARITY_COLOR[g.rarity] + '">' + esc(g.name) + '</span>').join(', ') : '');
    lw.className = 'last-win' + (win < bet ? ' lose' : '');
  } else {
    lw.textContent = '😢 Нет совпадений'; lw.className = 'last-win lose';
    if (Math.random() < 0.05) { const it = addEquipment(pick(HEROES).id, 'common'); lw.textContent += ' · утешительный ' + it.name; }
  }
  busy.slot = false; updateTop(); updateSlotBtn(); save();
  afterSlotSpin(n === m.reels, mult > 0);
}
