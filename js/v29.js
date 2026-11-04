// ================= 2.9: сундуки героев, награды на выбор (Путь Древнего, лига сезона) =================
// Предметы теперь бывают только отсюда (и из крафта): см. grantItems() в core.js.

// ---------- СУНДУКИ ГЕРОЕВ ----------
// Один сундук на каждого героя: внутри только предметы этого героя (скины и снаряжение),
// шансы редкости — CONFIG.dropW (Arcana 0.5%, Immortal 2%), цена — CONFIG.heroChest.cost.
let hcHero = null, hcSearch = '', hcBusy = false;
function hcOdds() { const w = CONFIG.dropW, t = Object.values(w).reduce((a, b) => a + b, 0); return RARITIES.slice().reverse().map(r => [r, w[r] / t * 100]); }
function hcSetHero(id) { if (hcBusy || !HERO_BY_ID[id]) return; hcHero = id; renderChests(); }
function hcFind(v) { hcSearch = String(v || '').toLowerCase(); const g = document.getElementById('hc-grid'); if (g) g.innerHTML = hcGridHTML(); }
function hcGridHTML() {
  return HEROES.filter(h => !hcSearch || h.name.toLowerCase().includes(hcSearch)).sort((a, b) => a.name.localeCompare(b.name))
    .map(h => '<button class="hc-h' + (h.id === hcHero ? ' on' : '') + '" data-click="hcSetHero(\'' + h.id + '\')" title="' + esc(h.name) + '"><img src="' + heroImg(h.id) + '" referrerpolicy="no-referrer" alt="" loading="lazy"><small>' + esc(h.name) + '</small></button>').join('');
}
// картинки предметов героя для ленты (только для вида)
function hcPreview(id, r) {
  const c = pickCatalog(r, null, id, true);
  return { name: c.name, rarity: r, src: c.path ? itemImg(c.path) : heroImg(id) };
}
function renderChests() {
  const host = document.getElementById('chests-host'); if (!host) return;
  if (!hcHero || !HERO_BY_ID[hcHero]) hcHero = mainHeroId();
  const h = HERO_BY_ID[hcHero], cost = CONFIG.heroChest.cost;
  const own = S.items.filter(x => x.heroId === hcHero).length;
  host.innerHTML = '<div class="tr-head"><h2 class="cinzel">Сундуки героев</h2><span class="muted">' + HEROES.length + ' сундуков · в каждом только предметы своего героя · предметы выпадают только здесь</span></div>' +
    '<div class="hc-layout"><div class="panel panel-b hc-pick"><input type="text" placeholder="Поиск героя…" value="' + esc(hcSearch) + '" data-input="hcFind(this.value)"><div class="hc-grid" id="hc-grid">' + hcGridHTML() + '</div></div>' +
    '<div class="panel panel-b hc-card"><div class="hc-top"><img src="' + heroImg(h.id) + '" referrerpolicy="no-referrer" alt=""><div><div class="cinzel hc-name">Сундук: ' + esc(h.name) + '</div><div class="muted">Твоих предметов этого героя: ' + own + '</div></div></div>' +
    '<table class="board hc-odds"><tr><th>Редкость</th><th>Шанс</th><th>Продажа</th></tr>' + hcOdds().map(([r, p]) => '<tr><td style="color:' + RARITY_COLOR[r] + ';font-weight:700">' + RARITY_NAMES[r] + '</td><td>' + (p < 1 ? p.toFixed(1) : p.toFixed(1)) + '%</td><td>' + gemHTML(CONFIG.sell[r]) + '</td></tr>').join('') + '</table>' +
    '<button class="btn green big" style="width:100%;margin-top:10px" ' + (canPay(cost) && !hcBusy ? '' : 'disabled') + ' data-click="openHeroChest()">🎁 Открыть за ' + fmt(cost) + ' 🔶</button></div></div>' +
    '<div id="chest-stage"></div><div class="sec-title">Крафт · 10 → 1</div><div class="panel panel-b" id="craft-box"></div>';
  if (typeof renderCraft === 'function') renderCraft();
}
function renderChestsButtons() { if (currentTab === 'chests' && !hcBusy) renderChests(); }
function openHeroChest() {
  const id = hcHero, cost = CONFIG.heroChest.cost;
  if (!HERO_BY_ID[id] || hcBusy || !canPay(cost)) return;
  hcBusy = true; addGems(-cost); track('chests');
  const r = weightedRarity();
  const it = grantItems(() => Math.random() < 0.5 ? addEquipment(id, r) : addSkin(id, r));
  save(); updateTop();
  const stage = document.getElementById('chest-stage');
  const N = 46, WIN = 40, cards = [];
  for (let i = 0; i < N; i++) cards.push(i === WIN ? { name: it.name, rarity: it.rarity, src: itemImgChain(it)[0] } : hcPreview(id, weightedRarity()));
  stage.innerHTML = '<div class="case-wrap panel"><div class="case-line"></div><div class="case-strip" id="case-strip">' +
    cards.map(x => '<div class="case-card" style="--rc:' + RARITY_COLOR[x.rarity] + '"><img src="' + x.src + '" referrerpolicy="no-referrer"><span>' + esc(x.name) + '</span></div>').join('') + '</div></div>';
  stage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const strip = document.getElementById('case-strip'), cw = 132, wrapW = strip.parentNode.clientWidth;
  const target = WIN * cw - wrapW / 2 + cw / 2 + rnd(-40, 40);
  const ms = speed === 'fast' || SETTINGS.noanim ? 1500 : 5200;
  strip.style.transition = 'none'; strip.style.transform = 'translateX(0)'; void strip.offsetWidth;
  strip.style.transition = 'transform ' + ms + 'ms cubic-bezier(.08,.6,.12,1)';
  strip.style.transform = 'translateX(' + (-target) + 'px)';
  let tk = 0; const iv = setInterval(() => { tk += 110; sfx('tick'); if (tk > ms * 0.8) clearInterval(iv); }, 110);
  setTimeout(() => {
    sfx('open'); strip.children[WIN].classList.add('won');
    if (it.rarity === 'arcana') hype('НИШТЯК'); else if (rarityIdx(it.rarity) >= 4) announce('Godlike!');
    showModal('🎁', RARITY_NAMES[it.rarity] + '!', it.name + ' (' + HERO_BY_ID[id].name + ') · продать можно за ' + fmt(sellPrice(it)) + ' 🔶', 'ok', { auto: true });
    hcBusy = false; renderChests();
  }, ms + 80);
}

// ---------- НАГРАДЫ НА ВЫБОР ----------
// Очередь S.picks: [{ title, why, opts: [каталог предмета…] }]. Варианты создаются один раз и хранятся в сейве.
function capRarity(maxIdx) { const w = {}; RARITIES.forEach((r, i) => { if (i <= maxIdx) w[r] = CONFIG.dropW[r]; }); return weightedRarity(w); }
function pickOption(r, hero) { const id = hero && HERO_BY_ID[hero] ? hero : pick(HEROES).id; const c = pickCatalog(r, null, id, true); return { hero: id, rarity: r, name: c.name, path: c.path || null, slot: c.slot, art: c.art || null }; }
function queuePick(title, why, opts) { S.picks = S.picks || []; S.picks.push({ title, why, opts }); save(); setTimeout(showNextPick, 400); }
function showNextPick() {
  const p = (S.picks || [])[0]; if (!p || modalOpen) return;
  const card = (o, i) => '<button class="pick-opt" style="--rc:' + RARITY_COLOR[o.rarity] + '" data-click="takePick(' + i + ')"><img src="' + (o.path ? itemImg(o.path) : heroImg(o.hero)) + '" referrerpolicy="no-referrer" alt=""><b>' + esc(o.name) + '</b><small style="color:' + RARITY_COLOR[o.rarity] + '">' + RARITY_NAMES[o.rarity] + '</small><small>' + esc(HERO_BY_ID[o.hero] ? HERO_BY_ID[o.hero].name : '') + '</small></button>';
  showModal('🎁', p.title, '<div class="muted" style="margin-bottom:8px">' + esc(p.why) + '</div><div class="pick-row">' + p.opts.map(card).join('') + '</div>', 'ok', { html: true, buttons: [{ t: 'Выбрать позже', c: 'ghost', f: closeModal }] });
}
function takePick(i) {
  const p = (S.picks || [])[0]; i = +i; if (!p || !p.opts[i]) return;
  const o = p.opts[i];
  const it = grantItems(() => { const c = { hero: o.hero, rarity: o.rarity, name: o.name, path: o.path || undefined, slot: o.slot }; if (o.art) c.art = o.art; const x = eqFromCatalog(c, S.uid++); S.items.unshift(x); autoEquip(x, x.heroId); if (typeof noteDrop === 'function') noteDrop(x); return x; });
  S.picks.shift(); save(); closeModal(); updateTop();
  if (o.rarity === 'arcana') hype('НИШТЯК');
  toast('🎁 Получено', it.name + ' (' + RARITY_NAMES[it.rarity] + ')');
  setTimeout(showNextPick, 500);
}
// Путь Древнего: после победы — 1 из 5 предметов, редкость до Mythical
function rogueRewardPick() {
  const opts = []; for (let i = 0; i < 5; i++) opts.push(pickOption(capRarity(3)));
  queuePick('Награда Пути Древнего', 'Ты прошёл Путь до конца. Выбери один предмет из пяти (редкость до Mythical).', opts);
}

// ---------- ЛИГА СЕЗОНА: топ-3 по MMR ----------
// Во время сезона лучший MMR пишется в seasons/<сезон>/<uid> (см. cloudPush). После смены сезона игрок
// смотрит топ-3 прошлого сезона и, если он там, получает награды на выбор (3 случайных варианта).
const LEAGUE_TOP = [
  [['arcana', 'Arcana · 1 место'], ['immortal', 'Immortal · 1 место']],
  [['immortal', 'Immortal · 2 место'], ['immortal', 'Immortal · 2 место (второй)']],
  [['immortal', 'Immortal · 3 место']]
];
async function leagueTopReward(sid) {
  const c = typeof cloud === 'function' && cloud(); if (!c || !sid) return;
  S.leagueTop = S.leagueTop || {}; if (S.leagueTop[sid]) return;
  const top = await db('GET', 'seasons/' + sid, undefined, false, { orderBy: '$value', limitToLast: 3 }).catch(() => null);
  S.leagueTop[sid] = 1; save();
  if (!isObj(top)) return;
  const place = Object.entries(top).sort((a, b) => b[1] - a[1]).findIndex(([u]) => u === c.uid);
  if (place < 0 || place > 2) return;
  LEAGUE_TOP[place].forEach(([r, t]) => { const opts = [pickOption(r), pickOption(r), pickOption(r)]; queuePick('Лига сезона: ' + t, 'Ты на ' + (place + 1) + '-м месте по MMR в сезоне «' + seasonName(sid) + '». Выбери один предмет из трёх.', opts); });
}
