// ================= COLLECTION =================
let fType = 'all', fRarity = 'all', fSort = 'rdesc', fSlot = 'all', fHeroOnly = false;
function initCollection() {
  document.querySelectorAll('#f-type button').forEach(b => b.onclick = () => { fType = b.dataset.v; document.querySelectorAll('#f-type button').forEach(x => x.classList.toggle('active', x === b)); renderInventory(); });
  document.getElementById('f-sort').onchange = e => { fSort = e.target.value; renderInventory(); };
  document.getElementById('f-equip-hero').onchange = () => { renderInventory(); renderLoadout(); };
  const fs = document.getElementById('f-slot');
  if (fs) { fs.innerHTML = '<option value="all">Все слоты</option>' + EQ_SLOTS.map(s => '<option value="' + s.id + '">' + s.icon + ' ' + s.name + '</option>').join(''); fs.onchange = e => { fSlot = e.target.value; renderInventory(); }; }
  const fh = document.getElementById('f-hero-only'); if (fh) fh.onchange = e => { fHeroOnly = e.target.checked; renderInventory(); };
  rarityChips(document.getElementById('f-rarity'), () => fRarity, v => { fRarity = v; renderInventory(); });
}
function rarityChips(host, get, set) {
  host.innerHTML = '';
  ['all'].concat(RARITIES.slice().reverse()).forEach(r => {
    const c = document.createElement('button'); c.className = 'chip' + (get() === r ? ' active' : '');
    c.textContent = r === 'all' ? 'Все редкости' : RARITY_NAMES[r];
    if (r !== 'all') c.style.color = RARITY_COLOR[r];
    c.onclick = () => { set(r); host.querySelectorAll('.chip').forEach(x => x.classList.toggle('active', x === c)); };
    host.appendChild(c);
  });
}
function fillHeroSelect(sel, value) {
  const cur = value || sel.value || mainHeroId();
  sel.innerHTML = sortedByPower().map(h => '<option value="' + h.id + '">' + esc(h.name) + ' · ⚔' + fmt(heroPower(h.id)) + '</option>').join('');
  sel.value = cur;
}
function filteredItems(type, rar, sort, slot, hero) {
  let list = S.items.filter(it => (type === 'all' || it.type === type) && (rar === 'all' || it.rarity === rar) && (!slot || slot === 'all' || (it.type === 'eq' && it.slot === slot)) && (!hero || it.heroId === hero));
  const hn = it => HERO_BY_ID[it.heroId] ? HERO_BY_ID[it.heroId].name : it.heroId;
  const cmp = {
    rdesc: (a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity) || b.ts - a.ts,
    rasc: (a, b) => rarityIdx(a.rarity) - rarityIdx(b.rarity) || b.ts - a.ts,
    type: (a, b) => a.type.localeCompare(b.type) || rarityIdx(b.rarity) - rarityIdx(a.rarity),
    new: (a, b) => b.ts - a.ts,
    hero: (a, b) => hn(a).localeCompare(hn(b)) || rarityIdx(b.rarity) - rarityIdx(a.rarity),
    name: (a, b) => a.name.localeCompare(b.name)
  }[sort || 'rdesc'];
  return list.sort(cmp);
}
function itemCard(it, acts) {
  const c = document.createElement('div');
  c.className = 'icard ' + it.type;
  c.style.setProperty('--rc', RARITY_COLOR[it.rarity]);
  const ib = document.createElement('div'); ib.className = 'imgbox';
  ib.appendChild(mkImg(itemImgChain(it), it.name));
  const ty = document.createElement('div'); ty.className = 'type';
  ty.textContent = it.type === 'skin' ? 'Скин' : (EQ_SLOTS.find(s => s.id === it.slot) || { name: 'Item' }).name;
  ib.appendChild(ty);
  const on = it.type === 'eq' ? equippedOn(it.uid) : null;
  if (on) { const e = document.createElement('div'); e.className = 'eqmark'; e.textContent = '✓ ' + HERO_BY_ID[on].name.split(' ')[0]; ib.appendChild(e); }
  c.appendChild(ib);
  const inf = document.createElement('div'); inf.className = 'info';
  inf.innerHTML = '<div class="nm"></div><div class="rr"></div><div class="hh"></div>';
  inf.querySelector('.nm').textContent = it.name;
  inf.querySelector('.rr').textContent = RARITY_NAMES[it.rarity] + (it.type === 'eq' ? ' · ' + eqPctText(it.rarity) : it.type === 'skin' ? ' · ' + pctTxt(SKIN_PCT[it.rarity] || 0) + ' силы герою' : '');
  inf.querySelector('.hh').textContent = HERO_BY_ID[it.heroId] ? HERO_BY_ID[it.heroId].name : '';
  c.appendChild(inf);
  if (acts) { const a = document.createElement('div'); a.className = 'acts'; acts.forEach(x => { const b = document.createElement('button'); b.className = x.c; b.textContent = x.t; b.onclick = ev => { ev.stopPropagation(); x.f(ev); }; a.appendChild(b); }); c.appendChild(a); }
  return c;
}
function renderCollection() {
  fillHeroSelect(document.getElementById('f-equip-hero'));
  const ae = document.getElementById('auto-eq'); if (ae) ae.checked = !S.autoEquipOff;
  const sk = S.items.filter(x => x.type === 'skin').length;
  document.getElementById('c-total').textContent = fmt(S.items.length);
  document.getElementById('c-skins').textContent = fmt(sk);
  document.getElementById('c-eq').textContent = fmt(S.items.length - sk);
  document.getElementById('c-arcana').textContent = fmt(S.items.filter(x => x.rarity === 'arcana').length);
  document.getElementById('c-value').innerHTML = gemHTML(S.items.reduce((a, x) => a + sellPrice(x), 0));
  renderInventory(); renderLoadout();
}
function renderInventory() {
  const grid = document.getElementById('inv-grid');
  const target = document.getElementById('f-equip-hero').value;
  const list = filteredItems(fType, fRarity, fSort, fSlot, fHeroOnly ? target : null);
  grid.innerHTML = '';
  syncCollFilters();
  document.getElementById('inv-empty').style.display = list.length ? 'none' : 'block';
  renderChunked(grid, list, it => {
    const acts = [{ t: 'Продать ' + fmt(sellPrice(it)), c: 'sell', f: () => sellItem(it.uid) }];
    if (it.type === 'skin') { const on = S.skinSel && S.skinSel[it.heroId] === it.uid; acts.push({ t: on ? '✓ Облик' : 'Облик', c: 'eq', f: () => { S.skinSel = S.skinSel || {}; if (on) delete S.skinSel[it.heroId]; else S.skinSel[it.heroId] = it.uid; save(); renderInventory(); } }); }
    if (rarityIdx(it.rarity) < 5) acts.push({ t: '🔧', c: 'up', f: () => { switchTab('upgrade'); setUgMain(it.uid); } });
    if (it.type === 'eq') {
      const on = equippedOn(it.uid);
      acts.push(on ? { t: 'Снять', c: 'eq', f: () => { unequipItem(it.uid); save(); renderCollection(); updateTop(); } }
                   : { t: 'Надеть на ' + (HERO_BY_ID[it.heroId] ? HERO_BY_ID[it.heroId].name.split(' ')[0] : '?'), c: 'eq', f: () => equipTo(it.uid, it.heroId) });
    }
    return itemCard(it, acts);
  });
}
function equipTo(uid, heroId) {
  const it = S.items.find(x => x.uid === uid); if (!it) return;
  if (it.heroId !== heroId) return showModal('🛡', 'Чужой предмет', 'Это снаряжение героя ' + (HERO_BY_ID[it.heroId] ? HERO_BY_ID[it.heroId].name : '?') + ' — надеть можно только на него.', 'bad');
  unequipItem(uid);
  if (!S.loadout[heroId]) S.loadout[heroId] = {};
  S.loadout[heroId][it.slot] = uid;
  save(); updateTop(); renderCollection();
}
function renderLoadout() {
  const hid = document.getElementById('f-equip-hero').value || mainHeroId();
  const box = document.getElementById('loadout-box');
  const h = HERO_BY_ID[hid];
  box.innerHTML = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:flex-start"><div id="lo-img"></div><div style="flex:1;min-width:260px"><div class="cinzel" style="font-size:1.1rem;color:#fff">' + esc(h.name) + '</div><div class="muted" style="font-size:.85rem;margin-bottom:8px">Сила ' + fmt(heroPower(hid)) + ' · от снаряжения +' + fmt(equipPower(hid)) + ' (+' + Math.round(equipPct(hid) * 100) + '%)</div><div class="inv-grid" id="lo-grid" style="grid-template-columns:repeat(auto-fill,minmax(120px,1fr))"></div></div></div>';
  const im = mkImg(heroLookModel(hid), h.name, 'lo-model'); const sk = heroSkin(hid); if (sk && sk.path) im.title = sk.name;
  document.getElementById('lo-img').appendChild(im);
  const g = document.getElementById('lo-grid');
  EQ_SLOTS.forEach(sl => {
    const uid = S.loadout[hid] && S.loadout[hid][sl.id];
    const it = uid && S.items.find(x => x.uid === uid);
    if (it) g.appendChild(itemCard(it, [{ t: 'Снять', c: 'eq', f: () => { unequipItem(uid); save(); renderCollection(); updateTop(); } }]));
    else { const d = document.createElement('div'); d.className = 'slotbox'; d.style.minHeight = '150px'; d.style.flexDirection = 'column'; d.innerHTML = '<div style="font-size:1.6rem">' + sl.icon + '</div><div>' + sl.name + '</div><div style="font-size:.7rem">пусто</div>'; g.appendChild(d); }
  });
}
function sellItem(uid) {
  const it = S.items.find(x => x.uid === uid); if (!it) return;
  addGems(sellPrice(it)); removeItem(uid); track('itemsSold');
  if (ugMain === uid) ugMain = null; ugFuel = ugFuel.filter(x => x !== uid);
  save(); renderCollection(); updateTop();
}
// 2.3: кнопки фильтров всегда показывают текущий выбор (раньше после перерисовки сбрасывались визуально)
function syncCollFilters() {
  document.querySelectorAll('#f-type button').forEach(x => x.classList.toggle('active', x.dataset.v === fType));
  document.querySelectorAll('#f-rarity .chip').forEach((c, i) => c.classList.toggle('active', (i === 0 ? 'all' : RARITIES.slice().reverse()[i - 1]) === fRarity));
  const fsel = document.getElementById('f-sort'); if (fsel && fsel.value !== fSort) fsel.value = fSort;
  const fs = document.getElementById('f-slot'); if (fs) { fs.value = fSlot; fs.style.display = fType === 'skin' ? 'none' : ''; }
}
// 2.3: надеть лучшее снаряжение всем героям сразу
function equipBestAll() {
  let n = 0;
  S.items.filter(it => it.type === 'eq' && HERO_BY_ID[it.heroId]).sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity)).forEach(it => {
    const lo = S.loadout[it.heroId] = S.loadout[it.heroId] || {};
    const cur = S.items.find(x => x.uid === lo[it.slot]);
    if (!cur || rarityIdx(it.rarity) > rarityIdx(cur.rarity)) { unequipItem(it.uid); lo[it.slot] = it.uid; n++; }
  });
  save(); updateTop(); renderCollection();
  showModal('🛡', 'Готово', n ? 'Надето предметов: ' + n + '. Каждый — на своего героя, лучший в своём слоте.' : 'Всё лучшее уже надето.', 'ok', { auto: true });
}
function toggleAutoEquip(el) { S.autoEquipOff = !el.checked; save(); }
function sellVisible() {
  const list = filteredItems(fType, fRarity, fSort, fSlot, fHeroOnly ? document.getElementById('f-equip-hero').value : null);
  if (!list.length) return;
  const sum = list.reduce((a, x) => a + sellPrice(x), 0);
  confirmBox('Продать видимые', 'Продать ' + list.length + ' предмет(ов) за ' + gemHTML(sum) + '?', () => {
    list.forEach(x => removeItem(x.uid)); addGems(sum); track('itemsSold', list.length); ugMain = null; ugFuel = []; save(); renderCollection();
  }, true);
}
function sellCommons() {
  const list = S.items.filter(x => x.rarity === 'common');
  if (!list.length) return;
  const sum = list.reduce((a, x) => a + sellPrice(x), 0);
  confirmBox('Продать Common', 'Продать ' + list.length + ' Common за ' + gemHTML(sum) + '?', () => {
    list.forEach(x => removeItem(x.uid)); addGems(sum); track('itemsSold', list.length); save(); renderCollection();
  }, true);
}

// ================= UPGRADER =================
let ugMain = null, ugFuel = [], ugWheel = null, ugFilter = 'all';
function ugChance() {
  const it = S.items.find(x => x.uid === ugMain); if (!it) return 0;
  let c = CONFIG.upgrade.base[it.rarity] || 0;
  ugFuel.forEach(u => { const f = S.items.find(x => x.uid === u); if (f) c += CONFIG.upgrade.fuelBase + CONFIG.upgrade.fuelPerRarity * rarityIdx(f.rarity); });
  return Math.min(CONFIG.upgrade.maxChance, c);
}
function renderUpgrade() {
  rarityChips(document.getElementById('ug-filter'), () => ugFilter, v => { ugFilter = v; renderUgGrid(); });
  renderUgSlots(); renderUgGrid();
}
function renderUgSlots() {
  const it = S.items.find(x => x.uid === ugMain);
  if (!it) ugMain = null;
  ugFuel = ugFuel.filter(u => S.items.some(x => x.uid === u));
  const sel = document.getElementById('ug-select'); if (sel) sel.innerHTML = ugSelectHTML();
  const box = document.getElementById('ug-main');
  box.innerHTML = ''; box.className = 'slotbox' + (it ? ' filled' : '');
  if (it) {
    box.style.setProperty('--rc', RARITY_COLOR[it.rarity]);
    box.appendChild(mkImg(itemImgChain(it), it.name));
    const nx = RARITIES[rarityIdx(it.rarity) + 1];
    const d = document.createElement('div'); d.style.textAlign = 'left';
    d.innerHTML = '<div style="font-weight:700;color:#fff">' + esc(it.name) + '</div><div style="color:' + RARITY_COLOR[it.rarity] + ';font-size:.8rem;font-weight:700">' + RARITY_NAMES[it.rarity] + ' → <span style="color:' + RARITY_COLOR[nx] + '">' + RARITY_NAMES[nx] + '</span></div>';
    box.appendChild(d);
  } else box.innerHTML = '<span>Выбери предмет в списке или кликни его в инвентаре ниже</span>';
  const fr = document.getElementById('ug-fuel'); fr.innerHTML = '';
  ugFuel.forEach(u => {
    const f = S.items.find(x => x.uid === u);
    const d = document.createElement('div'); d.className = 'fuel'; d.style.setProperty('--rc', RARITY_COLOR[f.rarity]); d.title = f.name;
    d.appendChild(mkImg(itemImgChain(f), f.name));
    const b = document.createElement('button'); b.textContent = '×'; b.onclick = () => { ugFuel = ugFuel.filter(x => x !== u); renderUpgrade(); };
    d.appendChild(b); fr.appendChild(d);
  });
  const ch = ugChance();
  document.getElementById('ug-chance').textContent = it ? Math.round(ch * 100) + '%' : '—';
  document.getElementById('ug-cost').innerHTML = it ? gemHTML(CONFIG.upgrade.cost[it.rarity]) : '—';
  document.getElementById('ug-next').textContent = it ? RARITY_NAMES[RARITIES[rarityIdx(it.rarity) + 1]] : '—';
  document.getElementById('ug-btn').disabled = busy.ug || !it || !canPay(CONFIG.upgrade.cost[it.rarity]);
  const c = it ? ch : 0.5;
  ugWheel = buildWheel(document.getElementById('ug-wheel'), [
    { label: 'УСПЕХ', sub: it ? Math.round(c * 100) + '%' : '', color: '#2f8a2a', weight: c },
    { label: 'ПРОВАЛ', sub: it ? Math.round((1 - c) * 100) + '%' : '', color: '#9b2a19', weight: 1 - c }
  ], { id: 'u', center: '⚒', labelY: 70 });
}
function renderUgGrid() {
  const g = document.getElementById('ug-grid'); g.innerHTML = '';
  const list = filteredItems('all', ugFilter, 'rdesc').filter(x => x.uid !== ugMain && !ugFuel.includes(x.uid));
  if (!list.length) { g.innerHTML = '<div class="empty" style="grid-column:1/-1">Нет предметов. Добывай в слотах, рулетке и на арене.</div>'; return; }
  renderChunked(g, list, it => {
    const c = itemCard(it); c.style.cursor = 'pointer';
    c.onclick = e => e.shiftKey ? addUgFuel(it.uid) : setUgMain(it.uid);
    c.oncontextmenu = e => { e.preventDefault(); addUgFuel(it.uid); };
    return c;
  });
}
// 2.9: апгрейд максимум до Immortal — Immortal → Arcana запрещён
const UG_MAX_FROM = 3;   // индекс редкости, с которой ещё можно улучшать (Mythical → Immortal)
function ugSelectHTML() {
  const list = S.items.filter(x => rarityIdx(x.rarity) <= UG_MAX_FROM).sort((a, b) => rarityIdx(b.rarity) - rarityIdx(a.rarity) || a.name.localeCompare(b.name));
  return '<option value="">— выбери предмет (' + list.length + ') —</option>' + list.map(x => '<option value="' + x.uid + '"' + (x.uid === ugMain ? ' selected' : '') + '>' + esc(RARITY_NAMES[x.rarity] + ' · ' + x.name + (HERO_BY_ID[x.heroId] ? ' (' + HERO_BY_ID[x.heroId].name + ')' : '')) + ' → ' + Math.round(ugChanceFor(x) * 100) + '%</option>').join('');
}
function ugChanceFor(it) { return Math.min(CONFIG.upgrade.maxChance, CONFIG.upgrade.base[it.rarity] || 0); }
function setUgMain(uid) {
  if (busy.ug) return;
  uid = +uid; if (!uid) { ugMain = null; return renderUpgrade(); }
  const it = S.items.find(x => x.uid === uid); if (!it) return;
  if (rarityIdx(it.rarity) > UG_MAX_FROM) return showModal('🔧', 'Нельзя улучшить', RARITY_NAMES[it.rarity] + ' — это максимум для апгрейдера: Immortal → Arcana улучшить нельзя. Arcana бывает только из сундуков героев.', '');
  ugMain = uid; ugFuel = ugFuel.filter(x => x !== uid);
  renderUpgrade();
}
function addUgFuel(uid) {
  if (busy.ug || uid === ugMain || ugFuel.includes(uid)) return;
  if (ugFuel.length >= 4) return showModal('🔧', 'Лимит', 'Максимум 4 донора.', '', { auto: true });
  ugFuel.push(uid); renderUpgrade();
}
function clearUpgrade() { if (busy.ug) return; ugMain = null; ugFuel = []; document.getElementById('ug-result').textContent = 'Выбери предмет'; document.getElementById('ug-result').className = 'ug-result'; renderUpgrade(); }
function spinUpgrade(ok) {
  const it = S.items.find(x => x.uid === ugMain);
  if (busy.ug || !it) return;
  if (rarityIdx(it.rarity) > UG_MAX_FROM) return;   // 2.9: Immortal → Arcana запрещён
  // 2.3: предмет надет на героя — сначала спросить (при провале он сгорит)
  const worn = [it.uid].concat(ugFuel).filter(u => equippedOn(u));
  if (worn.length && ok !== true) return confirmBox('Предмет надет', 'В апгрейде участвует надетое снаряжение (' + worn.length + ' шт.). При провале или как донор оно пропадёт с героя. Продолжить?', () => spinUpgrade(true));
  const cost = CONFIG.upgrade.cost[it.rarity];
  if (!canPay(cost)) return showModal('🔶', 'Мало кристаллов', 'Нужно ' + fmt(cost) + ' 🔶', 'bad');
  const ch = ugChance();
  addGems(-cost); busy.ug = true; track('upgradesTry');
  document.getElementById('ug-btn').disabled = true;
  const res = document.getElementById('ug-result'); res.className = 'ug-result'; res.textContent = 'Крутим…';
  const win = Math.random() < ch;
  const a = ugWheel.angles[win ? 0 : 1];
  const target = a.start + (a.end - a.start) * rnd(0.08, 0.92);
  const ms = speed === 'fast' ? 1300 : 3800;
  spinWheelTo(ugWheel, target, ms);
  setTimeout(() => {
    ugFuel.forEach(u => removeItem(u)); ugFuel = [];
    if (win) {
      track('upgradesOk');
      const nx = RARITIES[rarityIdx(it.rarity) + 1];
      const old = it.name;
      if (it.type === 'eq') {
        const c = pickCatalog(nx, it.slot, it.heroId, true);   // герой предмета не меняется
        Object.assign(it, { rarity: c.rarity, name: c.name, path: c.path, slot: c.slot, heroId: it.heroId }); if (c.art) it.art = c.art; if (!it.path) delete it.path;
      } else { it.rarity = nx; it.name = skinName(it.heroId, nx); }
      res.className = 'ug-result win'; res.textContent = 'УСПЕХ! ' + RARITY_NAMES[nx];
      showModal('⬆', 'Успех!', old + ' → ' + it.name + ' (' + RARITY_NAMES[nx] + ')', 'ok', { auto: true });
      if (nx === 'arcana') hype('НИШТЯК');
      if (rarityIdx(it.rarity) > UG_MAX_FROM) ugMain = null;
    } else {
      removeItem(it.uid); ugMain = null;
      res.className = 'ug-result lose'; res.textContent = 'ПРОВАЛ! Предмет сгорел';
      hype('БИЧ');
    }
    busy.ug = false; save(); updateTop(); renderUpgrade();
  }, ms + 60);
}
