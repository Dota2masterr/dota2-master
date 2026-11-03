// ================= HEROES / ROULETTE =================
let selectedHero = null, attrFilter = 'all', heroSort = 'name', heroSearch = '';
let heroWheel = null;
const SEGMENTS = [
  { label: '+1 УР', type: 'level', value: 1, color: '#2f7a26', weight: 23 },
  { label: '🔶 ×0.6', type: 'gems', value: 0.6, color: '#1f6f7d', weight: 12 },
  { label: '+2 УР', type: 'level', value: 2, color: '#2a5fa8', weight: 14 },
  { label: 'БИЧ', sub: 'провал', type: 'fail', value: 0, color: '#3a3f46', weight: 18 },
  { label: '⚡ СИЛА', sub: '+10%', type: 'power', value: 0.1, color: '#a8862f', weight: 6 },
  { label: '+3 УР', type: 'level', value: 3, color: '#6a3fb8', weight: 7 },
  { label: '🎨 СКИН', type: 'skin', value: 1, color: '#9a2f86', weight: 5 },
  { label: '🔶 ×1.5', type: 'gems', value: 1.5, color: '#178f9e', weight: 6 },
  { label: '🛡 ВЕЩЬ', type: 'eq', value: 1, color: '#8a5a20', weight: 3 },
  { label: '+5 УР', sub: 'ДЖЕКПОТ', type: 'jackpot', value: 5, color: '#c8331f', weight: 3 },
  { label: '×3', sub: '3 СТРЕЛКИ', type: 'triple', value: 3, color: '#d6a01c', weight: 3 }
];
function initHeroes() {
  const f = document.getElementById('attr-filter');
  f.innerHTML = '';
  [['all', null, 'Все'], ['fav', null, '⭐ Избранные'], ['str', ATTR_ICON.str, 'Сила'], ['agi', ATTR_ICON.agi, 'Ловкость'], ['int', ATTR_ICON.int, 'Интеллект'], ['uni', ATTR_ICON.uni, 'Универсальные']].forEach(([k, ic, nm]) => {
    const b = document.createElement('button'); b.className = 'attr-btn' + (k === attrFilter ? ' active' : ''); b.dataset.a = k;
    b.innerHTML = (ic ? '<img src="' + ic + '" referrerpolicy="no-referrer" alt="">' : '') + nm;
    b.onclick = () => { attrFilter = k; f.querySelectorAll('.attr-btn').forEach(x => x.classList.toggle('active', x.dataset.a === k)); renderHeroList(); };
    f.appendChild(b);
  });
  const sp = document.createElement('div'); sp.style.flex = '1'; f.appendChild(sp);
  const srch = document.createElement('input'); srch.type = 'text'; srch.placeholder = 'Поиск…'; srch.style.width = '120px';
  srch.oninput = () => { heroSearch = srch.value.toLowerCase(); renderHeroList(); };
  f.appendChild(srch);
  const sel = document.createElement('select');
  sel.innerHTML = '<option value="name">По имени</option><option value="level">По уровню</option><option value="power">По силе</option>';
  sel.onchange = () => { heroSort = sel.value; renderHeroList(); };
  f.appendChild(sel);
  heroWheel = buildWheel(document.getElementById('hero-wheel'), SEGMENTS, { id: 'h', center: 'D' });
}
function renderHeroes() { const hb = document.getElementById('hod-heroes'); if (hb) hb.innerHTML = hodBanner(true); renderHeroList(); renderPreview(); }
function tierOf(l) { return Math.min(5, Math.floor(l / 10)); }
function renderHeroList() {
  const host = document.getElementById('heroes-list');
  host.innerHTML = '';
  document.getElementById('hero-count').textContent = HEROES.length + ' героев';
  const main = mainHeroId();
  const fav = S.fav || [];
  const groups = attrFilter === 'all' ? (fav.length ? ['fav'] : []).concat(['str', 'agi', 'int', 'uni']) : [attrFilter];
  groups.forEach(a => {
    let list = HEROES.filter(h => (a === 'fav' ? fav.includes(h.id) : h.attr === a) && (!heroSearch || h.name.toLowerCase().includes(heroSearch)));
    if (heroSort === 'level') list.sort((x, y) => S.heroes[y.id].level - S.heroes[x.id].level);
    else if (heroSort === 'power') list.sort((x, y) => heroPower(y.id) - heroPower(x.id));
    else list.sort((x, y) => x.name.localeCompare(y.name));
    if (!list.length) return;
    const g = document.createElement('div'); g.className = 'attr-group';
    g.innerHTML = a === 'fav' ? '<div class="attr-head" style="color:#ffd36a">⭐ Избранные <span class="muted" style="font-family:Roboto Condensed;letter-spacing:0;font-size:.75rem">(' + list.length + ')</span></div>' : '<div class="attr-head" style="color:' + ATTR_COLOR[a] + '"><img src="' + ATTR_ICON[a] + '" referrerpolicy="no-referrer" alt="">' + ATTR_NAME[a] + ' <span class="muted" style="font-family:Roboto Condensed;letter-spacing:0;font-size:.75rem">(' + list.length + ')</span></div>';
    const grid = document.createElement('div'); grid.className = 'hero-grid';
    list.forEach(h => {
      const st = S.heroes[h.id];
      const c = document.createElement('div');
      c.className = 'hcard' + (selectedHero === h.id ? ' selected' : '');
      c.title = h.name + ' · ур. ' + st.level + ' · ⚔ ' + fmt(heroPower(h.id));
      c.appendChild(mkImg(heroImgChain(h.id), h.name));
      const t = tierOf(st.level); if (t) { const tr = document.createElement('div'); tr.className = 'tier tier-' + t; c.appendChild(tr); }
      if (h.id === main) { const m = document.createElement('div'); m.className = 'mainstar'; m.textContent = '👑'; c.appendChild(m); }
      if (pendingTalents(h.id).length) { const tl = document.createElement('div'); tl.className = 'tal'; tl.textContent = '★'; tl.title = 'Доступен талант'; c.appendChild(tl); }
      if (fav.includes(h.id)) { const fv = document.createElement('div'); fv.className = 'favstar'; fv.textContent = '⭐'; c.appendChild(fv); }
      if (h.id === heroOfDay()) { const sn = document.createElement('div'); sn.className = 'sun'; sn.textContent = '☀'; sn.title = 'Герой дня'; c.appendChild(sn); }
      if (setCount(h.id) >= 6) { const sb = document.createElement('div'); sb.className = 'setb'; c.appendChild(sb); }
      const inf = document.createElement('div'); inf.className = 'hinfo';
      inf.innerHTML = '<span class="hname">' + esc(h.name) + '</span><span class="hlvl">' + st.level + '</span>';
      c.appendChild(inf);
      c.onclick = () => selectHero(h.id);
      grid.appendChild(c);
    });
    g.appendChild(grid); host.appendChild(g);
  });
}
function selectHero(id) {
  if (busy.hero) return;
  selectedHero = id;
  renderPreview();
  document.querySelectorAll('#heroes-list .hcard').forEach(c => c.classList.remove('selected'));
  renderHeroList();
}
function renderPreview() {
  const box = document.getElementById('sel-preview');
  const btn = document.getElementById('spin-btn');
  const ot = document.getElementById('pv-tal'); if (ot) ot.remove();
  if (!selectedHero) { box.innerHTML = '<div class="muted" style="width:100%">Выбери героя слева</div>'; btn.disabled = true; document.getElementById('spin-cost').textContent = '—'; return; }
  const h = HERO_BY_ID[selectedHero], st = S.heroes[selectedHero];
  box.innerHTML = '';
  // 2.3: живой (анимированный) портрет героя из Dota; если видео не грузится — обычная картинка
  const vis = document.createElement('div'); vis.className = 'hero-visual';
  const still = mkImg(heroTallChain(h.id), h.name); vis.appendChild(still);
  if (!SETTINGS.noanim && SETTINGS.liveHeroes !== false) {
    const v = document.createElement('video'); v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.src = STEAM.replace('/images/dota_react/', '/videos/dota_react/') + 'heroes/renders/' + h.id + '.webm';
    v.onloadeddata = () => { vis.classList.add('live'); v.play().catch(() => { }); }; v.onerror = () => v.remove();
    vis.appendChild(v);
  }
  const fb = document.createElement('button'); fb.className = 'fav-btn' + ((S.fav || []).includes(h.id) ? ' on' : ''); fb.textContent = (S.fav || []).includes(h.id) ? '⭐' : '☆'; fb.title = 'Избранное'; fb.onclick = () => toggleFav(h.id); vis.appendChild(fb);
  box.appendChild(vis);
  const m = document.createElement('div'); m.className = 'meta';
  m.innerHTML = '<div class="nm">' + esc(h.name) + '</div><div class="sub"><img src="' + ATTR_ICON[h.attr] + '" referrerpolicy="no-referrer" style="width:14px;vertical-align:-2px"> ' + ATTR_NAME[h.attr] + ' · ' + (h.ranged ? 'дальний бой' : 'ближний бой') + '</div>' +
    '<div class="sub">Уровень <b style="color:var(--gold2)">' + st.level + '</b>/' + CONFIG.maxLevel + ' · Сила <b style="color:#fff">' + fmt(heroPower(h.id)) + '</b>' + (st.bonus ? ' <span style="color:var(--ok)">(+' + fmt(st.bonus) + ' бонус)</span>' : '') + '</div>' +
    '<div class="sub" id="pv-ult"></div>' +
    '<div class="xpbar"><div style="width:' + (st.level / CONFIG.maxLevel * 100) + '%"></div></div>';
  box.appendChild(m);
  const ul = ultOf(h.id), pu = document.getElementById('pv-ult');
  const ui = mkImg(ultIconChain(h.id), ul.name); ui.style.cssText = 'width:20px;height:20px;vertical-align:-5px;border-radius:3px;margin-right:4px';
  pu.appendChild(ui); pu.appendChild(document.createTextNode(ul.name + ' — ' + EFFECT_NAME[ul.type]));
  pu.style.color = EFFECT_COLOR[ul.type];
  const tdiv = document.createElement('div'); tdiv.innerHTML = renderTalents(h.id); box.after ? null : null;
  const old = document.getElementById('pv-tal'); if (old) old.remove();
  tdiv.id = 'pv-tal'; tdiv.style.width = '100%'; box.parentNode.insertBefore(tdiv, box.nextSibling);
  const sc = setCount(h.id); if (sc >= 3) { const sb = document.createElement('div'); sb.className = 'sub'; sb.style.color = '#ffd36a'; sb.textContent = '✦ Набор героя: ' + sc + '/6 своих предметов → +' + (sc >= 6 ? 25 : 10) + '% силы'; m.appendChild(sb); }
  if (typeof collectionCount === 'function') { const cc = collectionCount(h.id); const cb = document.createElement('div'); cb.className = 'sub'; cb.style.color = cc >= 6 ? '#ade55c' : 'var(--muted)'; cb.textContent = '🌈 Коллекция редкостей: ' + cc + '/6' + (cc >= 6 ? ' → +' + Math.round(CONFIG.social.collectionBonus * 100) + '% силы' : ' (предметы героя всех редкостей = +' + Math.round(CONFIG.social.collectionBonus * 100) + '% силы)'); m.appendChild(cb); }
  const cost = heroSpinCost(h.id);
  const hod = h.id === heroOfDay();
  document.getElementById('spin-cost').innerHTML = gemHTML(cost) + (hod && CONFIG.heroOfDay.spinMul < 1 ? ' <span style="color:var(--gold2)">☀ −' + Math.round((1 - CONFIG.heroOfDay.spinMul) * 100) + '%</span>' : '') + (st.level < CONFIG.maxLevel ? ' <span class="muted">(след. ур.: ' + fmt(Math.round(spinCost(st.level + 1) * (hod ? CONFIG.heroOfDay.spinMul : 1))) + ')</span>' : '');
  btn.disabled = busy.hero || !canPay(cost);
}
function toggleFav(id) { S.fav = S.fav || []; S.fav = S.fav.includes(id) ? S.fav.filter(x => x !== id) : S.fav.concat([id]); save(); renderPreview(); renderHeroList(); }
function heroLog(cls, txt) {
  const l = document.getElementById('hero-log');
  const d = document.createElement('div'); d.className = cls; d.textContent = txt;
  l.prepend(d); while (l.children.length > 40) l.lastChild.remove();
}
let batchLeft = 0, batchRes = [];
function spinHero() {
  if (busy.hero || !selectedHero || modalOpen) return;
  const n = +document.getElementById('spin-count').value || 1;
  if (!canPay(heroSpinCost(selectedHero))) return showModal('🔶', 'Мало кристаллов', 'Нужно ' + fmt(heroSpinCost(selectedHero)) + ' 🔶 на одну крутку.', 'bad');
  busy.hero = true; batchLeft = n; batchRes = [];
  document.getElementById('spin-btn').disabled = true;
  oneHeroSpin();
}
function pickSegment() {
  const tot = SEGMENTS.reduce((a, s) => a + s.weight, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < SEGMENTS.length; i++) { r -= SEGMENTS[i].weight; if (r <= 0) return i; }
  return 0;
}
// 2.3: сегмент ×3 — на следующей крутке появляются ещё 2 стрелки (через 120°), каждая тоже даёт награду
function segAt(angle) { angle = ((angle % 360) + 360) % 360; const i = heroWheel.angles.findIndex(a => angle >= a.start && angle < a.end); return i < 0 ? 0 : i; }
function setExtraPointers(on) {
  const host = document.getElementById('hero-wheel'); if (!host) return;
  host.querySelectorAll('.wp-extra').forEach(x => x.remove());
  if (!on) return;
  const ptr = host.querySelector('.wheel-pointer');
  [120, 240].forEach(a => { const d = document.createElement('div'); d.className = 'wp-extra'; d.style.transform = 'rotate(' + a + 'deg)'; if (ptr) d.appendChild(ptr.cloneNode(true)); host.appendChild(d); });
}
function oneHeroSpin() {
  const st = S.heroes[selectedHero];
  const cost = heroSpinCost(selectedHero);
  if (batchLeft <= 0 || !canPay(cost)) return finishHeroBatch();
  // 2.3: герой уже 50-го уровня — рулетку останавливаем
  if (st.level >= CONFIG.maxLevel) { heroLog('gold', HERO_BY_ID[selectedHero].name + ' уже ' + CONFIG.maxLevel + ' уровня — рулетка остановлена'); return finishHeroBatch(); }
  addGems(-cost); S.spins++; track('heroSpins');
  // самая первая крутка в жизни аккаунта — гарантированный ДЖЕКПОТ (первое «вау»)
  const idx = !S.firstSpinDone ? SEGMENTS.findIndex(s => s.type === 'jackpot') : pickSegment();
  S.firstSpinDone = true;
  const a = heroWheel.angles[idx];
  const target = a.start + (a.end - a.start) * rnd(0.15, 0.85);
  const ms = speed === 'fast' ? 1300 : 4200;
  const triple = (S.tripleNext || 0) > 0;
  if (triple) S.tripleNext--;
  setExtraPointers(triple);
  const extra = triple ? [segAt(target + 120), segAt(target + 240)] : [];
  document.getElementById('spin-status').textContent = 'Крутка ' + (batchRes.length + 1) + '…';
  spinWheelTo(heroWheel, target, ms);
  setTimeout(() => {
    applySegment(SEGMENTS[idx], cost);
    batchRes.push(SEGMENTS[idx]);
    extra.forEach(j => { heroLog('gold', '➕ Доп. стрелка: ' + SEGMENTS[j].label); applySegment(SEGMENTS[j], cost); batchRes.push(SEGMENTS[j]); });
    if (triple) setTimeout(() => setExtraPointers((S.tripleNext || 0) > 0), 900);
    batchLeft--;
    renderPreview(); updateTop();
    if (batchLeft > 0 && canPay(heroSpinCost(selectedHero)) && st.level < CONFIG.maxLevel) setTimeout(oneHeroSpin, speed === 'fast' ? 250 : 650);
    else finishHeroBatch();
  }, ms + 60);
}
function applySegment(seg, cost) {
  const h = HERO_BY_ID[selectedHero], st = S.heroes[selectedHero];
  const lvlUp = n => { const o = st.level; st.level = Math.min(CONFIG.maxLevel, st.level + n); const g = st.level - o; if (g) track('heroLevels', g); if (!g) { addGems(Math.round(cost * 0.5)); heroLog('gold', h.name + ' уже MAX → +' + fmt(cost * 0.5) + ' 🔶'); } return g; };
  if (seg.type === 'level') { const g = lvlUp(seg.value); if (g) heroLog('win', h.name + ': +' + g + ' ур. → ' + st.level); }
  else if (seg.type === 'jackpot') { const g = lvlUp(5); heroLog('win', '★ ДЖЕКПОТ ' + h.name + ': +' + g + ' ур.'); hype('НИШТЯК'); }
  else if (seg.type === 'gems') { const g = Math.round(cost * seg.value); addGems(g); heroLog('gold', '+' + fmt(g) + ' 🔶'); }
  else if (seg.type === 'power') { const b = Math.max(3, Math.round(calcPower(st.level) * seg.value)); st.bonus = (st.bonus || 0) + b; heroLog('win', h.name + ': бонус силы +' + fmt(b)); }
  else if (seg.type === 'skin') { const it = addSkin(h.id, weightedRarity()); heroLog('win', '🎨 ' + it.name + ' (' + RARITY_NAMES[it.rarity] + ')'); }
  else if (seg.type === 'triple') { S.tripleNext = Math.min(3, (S.tripleNext || 0) + 1); heroLog('win', '×3! На следующей крутке будет 3 стрелки'); hype('НИШТЯК'); setTimeout(() => setExtraPointers(true), 300); }
  else if (seg.type === 'eq') { const it = addEquipment(h.id, weightedRarity()); heroLog('win', '🛡 ' + it.name + ' (' + RARITY_NAMES[it.rarity] + ')'); }
  else { heroLog('lose', 'Провал на ' + h.name); hype('БИЧ'); }
  // небольшой шанс бонусного дропа
  if (seg.type !== 'fail' && Math.random() < 0.12) { const it = addSkin(h.id, weightedRarity()); heroLog('win', '+ скин ' + it.name); }
}
function finishHeroBatch() {
  busy.hero = false;
  const cnt = {}; batchRes.forEach(s => cnt[s.label] = (cnt[s.label] || 0) + 1);
  document.getElementById('spin-status').innerHTML = 'Готово: ' + (Object.entries(cnt).map(([k, v]) => k + '×' + v).join(' · ') || '—');
  save(); renderPreview(); renderHeroList(); updateTop();
}
