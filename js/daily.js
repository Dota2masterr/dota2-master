// ================= ГЕРОЙ ДНЯ, АВТОСПИН, ТИТУЛЫ, СТАТИСТИКА =================
// ---------- Герой дня ----------
function heroOfDay() {
  const d = todayStr();
  const r = seeded(dayDiff('2026-01-01', d) * 7349 + 11);
  return HEROES[Math.floor(r() * HEROES.length)].id;
}
function heroSpinCost(id) { const c = spinCost(S.heroes[id].level); return id === heroOfDay() ? Math.round(c * CONFIG.heroOfDay.spinMul) : c; }
// 2.4: «Испытание дня» — выиграй бои с героем дня в стаке, получи его скин и кристаллы
function hodState() { const d = todayStr(); if (!S.hod || S.hod.d !== d) S.hod = { d, n: 0, done: false }; return S.hod; }
function hodWin(ids) {
  const id = heroOfDay(), st = hodState();
  if (st.done || !ids || !ids.includes(id)) return '';
  st.n++;
  if (st.n < CONFIG.heroOfDay.wins) return ' · ☀ Испытание дня ' + st.n + '/' + CONFIG.heroOfDay.wins;
  st.done = true;
  const g = Math.round(rewardScale() * CONFIG.heroOfDay.rewardMul); addGems(g);
  const sk = addSkin(id, weightedRarity({ rare: 50, mythical: 32, immortal: 15, arcana: 3 }));
  if (typeof toast === 'function') toast('☀ Испытание дня выполнено', HERO_BY_ID[id].name + ': ' + sk.name + ' (' + RARITY_NAMES[sk.rarity] + ') + ' + fmt(g) + ' кристаллов');
  return ' · ☀ Испытание дня выполнено: ' + sk.name + ' + ' + fmt(g) + ' 🔶';
}
function hodTake() {
  const id = heroOfDay(); const cs = getStack();
  if (cs.includes(id)) return showModal('☀', 'Уже в стаке', HERO_BY_ID[id].name + ' уже в твоей команде. Выигрывай бои!', 'ok', { auto: true });
  cs[cs.length - 1] = id; S.customStack = cs; save(); if (currentTab === 'arena') renderArena(); else switchTab('arena');
  showModal('☀', 'Герой дня в стаке', HERO_BY_ID[id].name + ' заменил последнего героя команды. Состав можно поменять кнопкой «Свой стак».', 'ok', { auto: true });
}
function hodBanner(compact) {
  const id = heroOfDay(), h = HERO_BY_ID[id], st = hodState(), need = CONFIG.heroOfDay.wins;
  return '<div class="hod' + (compact ? ' compact' : '') + '"><img src="' + heroImg(id) + '" referrerpolicy="no-referrer" data-click="goHero(\'' + id + '\')"><div style="flex:1"><div class="hod-t">☀ Испытание дня: <b>' + esc(h.name) + '</b></div><div class="hod-d">' + (st.done ? '✓ Выполнено — приходи завтра за новым героем' : 'Выиграй ' + need + ' боя с ним в стаке (арена, файты, PvP) · ' + st.n + '/' + need + ' · награда: его скин + ' + fmt(Math.round(rewardScale() * CONFIG.heroOfDay.rewardMul)) + ' 🔶') + '</div></div>' + (st.done ? '' : '<button class="btn sm gold" data-click="hodTake()">В стак</button>') + '</div>';
}

// ---------- Автоспин в слотах ----------
let autoLeft = 0, autoTotal = 0, autoWins = 0, autoNet = 0, autoGems0 = 0;
function startAuto(n) {
  if (busy.slot) return;
  autoLeft = n; autoTotal = n; autoWins = 0; autoGems0 = S.gems;
  updateAutoUI(); spinSlots();
}
function stopAuto(reason) {
  if (!autoTotal) return;
  const done = autoTotal - autoLeft;
  const net = S.gems - autoGems0;
  autoLeft = 0; autoTotal = 0; updateAutoUI();
  const lw = document.getElementById('auto-info');
  if (lw) lw.innerHTML = 'Автоспин: ' + done + ' круток · выигрышей ' + autoWins + ' · итог ' + (net >= 0 ? '+' : '') + gemHTML(net) + (reason ? ' · <b>' + esc(reason) + '</b>' : '');
}
function afterSlotSpin(full, win) {
  if (!autoTotal) return;
  if (win) autoWins++;
  autoLeft--;
  updateAutoUI();
  if (full) return stopAuto('стоп на НИШТЯК!');
  if (autoLeft <= 0) return stopAuto('готово');
  if (!canPay(bets[curMachine.id])) return stopAuto('кончились кристаллы');
  if (currentTab !== 'slots') return stopAuto('вкладка закрыта');
  setTimeout(() => { if (autoTotal) spinSlots(); }, speed === 'fast' ? 250 : 600);
}
function updateAutoUI() {
  const b = document.getElementById('auto-row'); if (!b) return;
  b.innerHTML = autoTotal
    ? '<span class="muted">Автоспин: осталось <b style="color:#fff">' + autoLeft + '</b>/' + autoTotal + '</span> <button class="btn red sm" data-click="stopAuto(\'остановлено\')">■ Стоп</button>'
    : '<span class="muted">Автоспин:</span> ' + [10, 25, 50].map(n => '<button class="btn sm" data-click="startAuto(' + n + ')">×' + n + '</button>').join(' ') + ' <span class="muted" style="font-size:.7rem">(стоп на НИШТЯК)</span>';
}

// ---------- Титулы ----------
const ACH_COLORS = ['#e8c77a', '#ade55c', '#7ad3ff', '#ff8a3a', '#c8a4ff'];
// Особые титулы по нику (ключ — ник в нижнем регистре). «ГОМО» — титул разработчиков и выданный лично.
const GOMO = { id: 'gomo', name: 'ГОМО', color: '#ff4ae0', icon: '🛠' };
const PIRATE = { id: 'pirate', name: 'Серега Пират', color: '#3ad0ff', icon: '🏴‍☠️' };
const VANYA = { id: 'vanya', name: 'Ваня', color: '#7ad35a', icon: '👑' };
const GRANTED_TITLES = { dranik: [GOMO], wowchess: [GOMO], fwaeh: [PIRATE], vano: [VANYA] };
// 2.5.3: разовые подарки аккаунтам (по нику). id — чтобы выдать ровно один раз
const ACCOUNT_GRANTS = { vano: [{ id: 'vano-mmr-600', mmr: 600 }] };
function applyGrants() {
  if (!USER || !S || window.SIM_MODE) return;
  const list = ACCOUNT_GRANTS[USER.key]; if (!list) return;
  const got = String(S.grants || '').split(',').filter(Boolean);
  list.forEach(g => {
    if (got.includes(g.id)) return;
    if (g.mmr) { if (typeof ensurePvp === 'function') ensurePvp(); else S.pvp = S.pvp || { mmr: 0, w: 0, l: 0 }; S.pvp.mmr = Math.min(CONFIG.bots.mmrMax, (S.pvp.mmr || 0) + g.mmr); S.pvp.peak = Math.max(S.pvp.peak || 0, S.pvp.mmr); }
    got.push(g.id); S.grants = got.join(',');
    save(); if (typeof schedulePush === 'function') schedulePush(500);
    if (typeof toast === 'function') toast('🎁 Подарок', g.mmr ? '+' + g.mmr + ' MMR на твой аккаунт' : 'Подарок получен');
  });
}
setInterval(applyGrants, 20000);
function grantedTitles() { return (USER && GRANTED_TITLES[USER.key]) || []; }
function titleOptions() {
  const res = grantedTitles().map(t => ({ id: t.id, name: t.name, color: t.color, special: true }));
  (S.titlesWon || []).forEach(t => res.push({ id: t.id, name: t.name, color: t.color, icon: t.icon, special: true }));
  ACHIEVEMENTS.forEach((a, i) => { if (S.ach && S.ach[a.id]) res.push({ id: a.id, name: a.name, color: ACH_COLORS[i % ACH_COLORS.length], icon: a.icon }); });
  return res;
}
function currentTitle() {
  const opts = titleOptions();
  if (S.title == null && grantedTitles().length) { S.title = grantedTitles()[0].id; }
  return opts.find(o => o.id === S.title) || null;
}
function titleHTML(t) {
  if (!t || typeof t.name !== 'string') return '';
  const col = /^#[0-9a-fA-F]{3,8}$/.test(t.color) ? t.color : '#c8a45a';
  return '<span class="ptitle" style="color:' + col + ';border-color:' + col + '">' + (t.icon ? esc(String(t.icon).slice(0, 4)) + ' ' : '★ ') + esc(t.name.slice(0, 24)) + '</span>';
}
function setTitle(id) { S.title = id || ''; save(); updateProfileChip(); if (currentTab === 'home') renderHome(); if (typeof schedulePush === 'function') schedulePush(); }
function titlePickerHTML() {
  const opts = titleOptions();
  return '<label class="muted" style="font-size:.72rem;letter-spacing:1px;text-transform:uppercase">Титул в профиле</label><div class="title-pick">' +
    '<button class="tp' + (!S.title ? ' on' : '') + '" data-click="pickTitle(\'\',this)">без титула</button>' +
    opts.map(o => '<button class="tp' + (S.title === o.id ? ' on' : '') + '" style="color:' + o.color + '" data-click="pickTitle(\'' + o.id + '\',this)">' + (o.icon || '★') + ' ' + esc(o.name) + '</button>').join('') +
    (opts.length ? '' : '<span class="muted" style="font-size:.8rem">Получай достижения во вкладке «Задания» — каждое открывает свой титул.</span>') + '</div>';
}

// ---------- Статистика ----------
function noteDrop(it) {
  if (!it || !RARITIES.includes(it.rarity)) return;
  S.bestDrop = S.bestDrop || null;
  if (!S.bestDrop || rarityIdx(it.rarity) > rarityIdx(S.bestDrop.rarity)) S.bestDrop = { name: it.name, rarity: it.rarity, at: Date.now() };
  S.stats = S.stats || {}; S.stats['drop_' + it.rarity] = (S.stats['drop_' + it.rarity] || 0) + 1;
}
function notePower() {
  S.powerHist = S.powerHist || [];
  const d = todayStr(), p = stackPower();
  const last = S.powerHist[S.powerHist.length - 1];
  if (last && last[0] === d) { if (p > last[1]) last[1] = p; }
  else S.powerHist.push([d, p]);
  if (S.powerHist.length > 120) S.powerHist.splice(0, S.powerHist.length - 120);
}
function powerChartSVG() {
  const h = (S.powerHist || []).slice(-30);
  if (h.length < 2) return '<div class="muted" style="font-size:.8rem;padding:20px 0;text-align:center">График появится, когда наберётся хотя бы 2 дня игры.</div>';
  const W = 560, H = 160, P = 30;
  const max = Math.max(...h.map(x => x[1])), min = Math.min(...h.map(x => x[1]));
  const x = i => P + i * (W - P * 2) / (h.length - 1), y = v => H - 22 - (v - min) / Math.max(1, max - min) * (H - 44);
  const pts = h.map((v, i) => x(i).toFixed(1) + ',' + y(v[1]).toFixed(1)).join(' ');
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:640px;display:block">' +
    '<line x1="' + P + '" y1="' + (H - 22) + '" x2="' + (W - P) + '" y2="' + (H - 22) + '" stroke="#2a333d"/>' +
    '<polyline fill="none" stroke="#e8c77a" stroke-width="2.5" points="' + pts + '"/>' +
    h.map((v, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v[1]).toFixed(1) + '" r="3" fill="#e8c77a"><title>' + v[0] + ': ' + fmt(v[1]) + '</title></circle>').join('') +
    '<text x="' + P + '" y="14" fill="#8a96a3" font-size="11">' + fmt(max) + '</text><text x="' + P + '" y="' + (H - 6) + '" fill="#8a96a3" font-size="11">' + h[0][0] + '</text><text x="' + (W - P) + '" y="' + (H - 6) + '" fill="#8a96a3" font-size="11" text-anchor="end">' + h[h.length - 1][0] + '</text></svg>';
}
function statsHTML() {
  const s = S.stats || {};
  const cells = [
    ['🎯', 'Круток героев', s.heroSpins || 0], ['🎰', 'Круток слотов', s.slotSpins || 0], ['🌈', 'НИШТЯК', s.nishtyak || 0], ['💀', 'БИЧ', s.bich || 0], ['🃏', '«21»', s.twentyone || 0],
    ['⚔', 'Побед на арене', S.arena.wins], ['☠', 'Поражений', S.arena.losses], ['🐉', 'Убийств Рошана', s.roshanKills || 0], ['🎁', 'Сундуков', s.chests || 0], ['⚒', 'Крафтов', s.crafts || 0],
    ['🔧', 'Апгрейдов (успех)', (s.upgradesOk || 0) + '/' + (s.upgradesTry || 0)], ['💰', 'Продано', s.itemsSold || 0], ['🌊', 'Рекорд выживания', S.survivalBest || 0], ['🔮', 'Invoker Race', S.invBest ? S.invBest.toFixed(2) + 's' : '—'], ['⚔', 'PvP', S.pvp ? S.pvp.w + 'W / ' + S.pvp.l + 'L' : '—']
  ];
  const drops = RARITIES.slice().reverse().map(r => '<span style="color:' + RARITY_COLOR[r] + '">' + RARITY_NAMES[r] + ': ' + (s['drop_' + r] || 0) + '</span>').join(' · ');
  return '<div class="stat-grid">' + cells.map(c => '<div class="sg"><span>' + c[0] + '</span><b>' + (typeof c[2] === 'number' ? fmt(c[2]) : c[2]) + '</b><small>' + c[1] + '</small></div>').join('') + '</div>' +
    '<div style="margin:10px 0;font-size:.85rem">Самый редкий дроп: ' + (S.bestDrop ? '<b style="color:' + RARITY_COLOR[S.bestDrop.rarity] + '">' + esc(S.bestDrop.name) + ' (' + RARITY_NAMES[S.bestDrop.rarity] + ')</b>' : '<span class="muted">пока нет</span>') + '</div>' +
    '<div class="muted" style="font-size:.78rem;margin-bottom:6px">Выпало предметов: ' + drops + '</div>' +
    '<div class="cinzel" style="color:var(--gold2);letter-spacing:2px;font-size:.85rem;margin:12px 0 4px">Рост силы стака</div>' + powerChartSVG();
}

(function () {
  const st = document.createElement('style');
  st.textContent = `
.hod{display:flex;align-items:center;gap:12px;padding:10px 14px;margin-bottom:12px;cursor:pointer;border:1px solid #e8c77a;border-radius:4px;background:linear-gradient(90deg,rgba(232,199,122,.18),rgba(0,0,0,.2));box-shadow:0 0 18px rgba(232,199,122,.15)}
.hod img{width:96px;height:54px;object-fit:cover;border-radius:3px;border:1px solid #e8c77a}
.hod-t{font-family:Cinzel;color:#fff;letter-spacing:1px}.hod-t b{color:var(--gold2)}
.hod-d{font-size:.8rem;color:var(--muted)}
.hod.compact{padding:6px 10px;margin:0 0 10px}.hod.compact img{width:64px;height:36px}
.hcard .sun{position:absolute;bottom:16px;left:3px;font-size:.85rem;filter:drop-shadow(0 0 4px #ffd36a)}
.ptitle{display:inline-block;font-size:.68rem;font-weight:700;letter-spacing:.5px;padding:1px 6px;border:1px solid;border-radius:10px;margin-left:6px;vertical-align:2px;white-space:nowrap;text-shadow:0 0 6px currentColor}
.profile-chip .ptitle{margin:2px 0 0;font-size:.6rem;padding:0 5px;text-shadow:none}
.title-pick{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 12px;max-height:150px;overflow:auto}
.tp{background:#0b0e12;border:1px solid #2a333d;border-radius:12px;padding:3px 10px;font-size:.75rem;font-weight:700;cursor:pointer;color:var(--muted);font-family:inherit}
.tp.on{border-color:currentColor;box-shadow:0 0 10px currentColor}
#auto-row{margin-top:8px;display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap}
#auto-info{font-size:.8rem;min-height:18px;margin-top:4px;color:var(--muted)}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:6px}
.sg{background:#0b0e12;border:1px solid var(--line);border-radius:3px;padding:8px;text-align:center}
.sg span{font-size:1.1rem}.sg b{display:block;color:var(--gold2);font-family:Cinzel;font-size:1.05rem}.sg small{color:var(--muted);font-size:.68rem}
table.board .ptitle{font-size:.6rem}
`;
  document.head.appendChild(st);
})();
