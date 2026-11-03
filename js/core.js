// ================= CORE: state, auth, save =================
let S = null;            // состояние текущего аккаунта
let USER = null;         // { key, nick }
let currentTab = 'home';
let speed = 'slow';
let busy = { hero: false, slot: false, ug: false, battle: false };

function freshState() {
  const heroes = {};
  HEROES.forEach(h => heroes[h.id] = { level: 1, bonus: 0 });
  return { version: SAVE_VERSION, gems: CONFIG.startGems, spins: 0, heroes, items: [], uid: 1, loadout: {}, mainHero: null,
    arena: { cleared: 0, replays: 0, wins: 0, losses: 0 }, invBest: null, avatar: 'invoker', created: Date.now(), freeAt: 0, wipe: CONFIG.wipe.id };
}

// ---------- storage helpers ----------
function lsGet(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function lsDel(k) { try { localStorage.removeItem(k); } catch (e) {} }
const ACC_KEY = 'd2m_accounts', SES_KEY = 'd2m_session';
function saveKey(k) { return 'd2m_save_' + k; }

function save() {
  if (!USER || !S || window.SIM_MODE) return;
  try { if (typeof notePower === 'function') notePower(); } catch (e) {}
  lsSet(saveKey(USER.key), S);
}
setInterval(save, 6000);
window.addEventListener('beforeunload', save);

// ---------- password hashing ----------
async function hashPass(pass, salt) {
  const data = salt + '::' + pass;
  try {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  // запасной вариант (если нет WebCrypto)
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < data.length; i++) { const c = data.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 'f' + (h2 >>> 0).toString(16) + (h1 >>> 0).toString(16);
}
function newSalt() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function nickKey(n) { return n.trim().toLowerCase(); }
function validNick(n) { return /^[A-Za-zА-Яа-яЁё0-9_\-. ]{3,20}$/.test(n.trim()); }

let authModeCur = 'login';
function authMode(m) {
  authModeCur = m;
  document.getElementById('at-login').classList.toggle('active', m === 'login');
  document.getElementById('at-reg').classList.toggle('active', m === 'register');
  document.getElementById('auth-pass2-f').style.display = m === 'register' ? 'block' : 'none';
  document.getElementById('auth-btn').textContent = m === 'register' ? 'СОЗДАТЬ АККАУНТ' : 'ИГРАТЬ';
  document.getElementById('auth-pass').autocomplete = m === 'register' ? 'new-password' : 'current-password';
  document.getElementById('auth-err').textContent = '';
}
async function authSubmit(e) {
  e.preventDefault();
  const nick = document.getElementById('auth-nick').value.trim();
  const pass = document.getElementById('auth-pass').value;
  const err = document.getElementById('auth-err');
  err.textContent = '';
  if (!validNick(nick)) { err.textContent = 'Ник: 3–20 символов (буквы, цифры, _ - .)'; return; }
  if (pass.length < 4) { err.textContent = 'Пароль минимум 4 символа'; return; }
  const accs = lsGet(ACC_KEY, {});
  const k = nickKey(nick);
  if (authModeCur === 'register') {
    if (accs[k]) { err.textContent = 'Такой ник уже занят'; return; }
    if (pass !== document.getElementById('auth-pass2').value) { err.textContent = 'Пароли не совпадают'; return; }
    const salt = newSalt();
    accs[k] = { nick, salt, hash: await hashPass(pass, salt), created: Date.now() };
    lsSet(ACC_KEY, accs);
    const st = freshState();
    importLegacy(st);
    lsSet(saveKey(k), st);
    login(k, nick);
    if (typeof cloudAfterAuth === 'function') cloudAfterAuth('register', nick, pass);
  } else {
    let a = accs[k];
    if (!a && typeof fbOn === 'function' && fbOn()) {
      err.style.color = 'var(--muted)'; err.textContent = 'Ищу аккаунт в облаке…';
      try { await cloudLoginNew(nick, pass); a = lsGet(ACC_KEY, {})[k]; err.textContent = ''; err.style.color = ''; } catch (e) { err.style.color = ''; }
    }
    if (!a) { err.textContent = 'Аккаунт не найден — зарегистрируйся'; return; }
    if (await hashPass(pass, a.salt) !== a.hash) { err.textContent = 'Неверный пароль'; return; }
    login(k, a.nick);
    if (typeof cloudAfterAuth === 'function') cloudAfterAuth('login', a.nick, pass);
  }
}
function login(k, nick) {
  USER = { key: k, nick };
  S = loadSafe(k);
  migrate(S);
  lsSet(SES_KEY, { key: k });
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('auth-pass').value = '';
  document.getElementById('auth-pass2').value = '';
  startGame();
}
function logout() {
  save(); bootSynced = false; TIME_OK = false;
  lsDel(SES_KEY);
  USER = null; S = null;
  closeModal();
  showAuth();
}
function showAuth() {
  const a = document.getElementById('auth');
  a.classList.remove('hidden');
  const accs = lsGet(ACC_KEY, {});
  const names = Object.values(accs).map(x => x.nick);
  document.getElementById('auth-accounts').innerHTML = names.length ? 'Аккаунты на этом устройстве: ' + names.map(n => '<a href="#" data-nick="' + esc(n) + '" data-click="pickAccount(this)">' + esc(n) + '</a>').join(', ') : '';
  authMode(names.length ? 'login' : 'register');
  const box = document.getElementById('auth-heroes');
  if (!box.children.length) ['juggernaut','invoker','pudge','crystal_maiden','phantom_assassin','axe','lina'].forEach(id => box.appendChild(mkImg(heroTallChain(id), id)));
}
// ---------- версии сохранения ----------
// SAVE_VERSION растёт, когда меняется формат сейва. Для каждого шага пишется функция в MIGRATIONS —
// она переводит сейв с версии N-1 на N. Старые сейвы проходят все шаги по очереди и не теряются.
const SAVE_VERSION = 4;
const MIGRATIONS = {
  // 1 → 2: сейвы до появления поля версии (старый Dota 2 Upgrader) — данных не трогаем
  2: st => { },
  // 2 → 3: поле версии теперь называется version; убираем служебный флаг импорта
  3: st => {
    delete st.v; delete st._imported_done;
    // этап 3: «гарантированный джекпот первой крутки» только для новых — у кого уже были крутки, считаем выданным
    if (st.spins > 0) st.firstSpinDone = true;
  },
  // 3 → 4 (версия 2.2): настройки новой боёвки, рогалик «Путь Древнего», «Битва за Башню»
  4: st => {
    if (st.manualUlt == null) st.manualUlt = false;
    if (st.btMult == null) st.btMult = 1;
    if (typeof migrateRogue === 'function') migrateRogue(st);
    if (typeof migrateTower === 'function') migrateTower(st);
  }
};
function saveVersionOf(st) { return typeof st.version === 'number' ? st.version : typeof st.v === 'number' ? st.v : 1; }
function migrate(st) {
  let ver = saveVersionOf(st);
  if (ver > SAVE_VERSION) { st._newer = true; }        // сейв из более новой версии игры — не трогаем
  else { while (ver < SAVE_VERSION) { ver++; if (MIGRATIONS[ver]) MIGRATIONS[ver](st); } st.version = SAVE_VERSION; delete st._newer; }
  if (!st.heroes) st.heroes = {};
  HEROES.forEach(h => { if (!st.heroes[h.id]) st.heroes[h.id] = { level: 1, bonus: 0 }; });
  st.items = st.items || []; st.loadout = st.loadout || {}; st.arena = st.arena || { cleared: 0, replays: 0, wins: 0, losses: 0 };
  if (!st.uid) st.uid = 1 + st.items.reduce((m, x) => Math.max(m, x.uid || 0), 0);
  if (typeof st.gems !== 'number') st.gems = CONFIG.startGems;
  if (typeof migrateRogue === 'function') migrateRogue(st);
  if (typeof migrateTower === 'function') migrateTower(st);
  // 2.3: снаряжение чужого героя снимаем (теперь оно надевается только на своего)
  for (const hid in st.loadout) for (const sl in st.loadout[hid]) { const it = st.items.find(x => x.uid === st.loadout[hid][sl]); if (!it || it.heroId !== hid) delete st.loadout[hid][sl]; }
  // 2.3: MMR всех игроков сброшен в 0 (один раз)
  if (st.pvp && st.pvp.reset !== 1) { st.pvp.mmr = 0; st.pvp.peak = 0; st.pvp.reset = 1; }
  // 2.4: релизный сброс прогресса у всех. Остаются только титулы ГОМО (они выдаются по нику, в сейве их нет).
  // Старый сейв кладётся в резервную копию на этом устройстве (d2m_prewipe_<ник>).
  if (st.wipe !== CONFIG.wipe.id && !st._newer) {
    const had = { arena: st.arena ? st.arena.cleared : 0, items: (st.items || []).length, gems: Math.floor(st.gems || 0) };
    const fresh = freshState(); fresh.created = st.created || Date.now();
    const backup = JSON.stringify(st);
    Object.keys(st).forEach(k => delete st[k]);
    Object.assign(st, fresh, { wipe: CONFIG.wipe.id, tutDone: true, season24: { had: 0, at: Date.now(), vet: false, shown: true, gift: 1 }, pvp: { mmr: 0, w: 0, l: 0, day: '', fights: 0, reset: 1, peak: 0 }, _wiped: had, _wipeBackup: backup });
    if (!st.heroes) st.heroes = {}; HEROES.forEach(h => { if (!st.heroes[h.id]) st.heroes[h.id] = { level: 1, bonus: 0 }; });
    if (typeof migrateRogue === 'function') migrateRogue(st);
    if (typeof migrateTower === 'function') migrateTower(st);
  }
  // 2.4: сезонный сброс кристаллов (один раз). Герои, предметы, уровни арены не трогаются.
  if (!st.season24) {
    const R = CONFIG.seasonReset, had = Math.floor(st.gems || 0);
    st.season24 = { had, at: Date.now(), vet: had >= R.vetFrom, shown: false };
    if (had > R.keep) st.gems = R.keep;
  }
}
// 2.4: окно с объяснением сброса и награда ветеранам
function season24Modal() {
  const z = S.season24, R = CONFIG.seasonReset; z.shown = true;
  let gift = '';
  if (z.vet && !z.gift) {
    z.gift = 1;
    grantTitle({ id: 'veteran-2-3', name: 'Ветеран 2.3', color: '#ff9a3a', icon: '🎖' });
    const it = addSkin(mainHeroId(), 'rare');
    gift = '<br><br>🎖 Ты был среди богатых игроков 2.3, поэтому получаешь титул <b style="color:#ff9a3a">«Ветеран 2.3»</b> и скин <b style="color:' + RARITY_COLOR.rare + '">' + esc(it.name) + '</b>.';
  }
  save();
  if (z.had <= R.keep && !gift) return;
  showModal('🔶', 'Новый сезон 2.4: сброс кристаллов',
    'В 2.3 кристаллы копились слишком быстро: сундук Arcana окупался за минуту, и цены потеряли смысл. Поэтому в 2.4 у всех кристаллы сброшены до <b>' + fmt(R.keep) + '</b> (у тебя было ' + fmt(z.had) + ').' +
    '<br><br>✅ Герои, их уровни, таланты, предметы, скины, арена и рекорды — остались как были.' +
    '<br>📉 Награды теперь меньше, но и копить на хорошую вещь — 2–3 дня, а не минута.' + gift, 'ok', { html: true });
}
// перенос прогресса из старой версии (Dota 2 Upgrader) в первый созданный аккаунт
function importLegacy(st) {
  const old = lsGet('dota_upgrader_save_v1', null);
  if (!old || lsGet('d2m_legacy_done', false)) return;
  try {
    if (typeof old.gold === 'number') st.gems = Math.max(CONFIG.startGems, Math.floor(old.gold));
    if (old.heroState) Object.keys(old.heroState).forEach(id => { if (st.heroes[id]) st.heroes[id].level = Math.max(1, Math.min(CONFIG.maxLevel, old.heroState[id].level || 1)); });
    (old.inventory || []).forEach(s => { if (RARITIES.includes(s.rarity)) st.items.push({ uid: st.uid++, type: 'skin', heroId: HERO_BY_ID[s.heroId] ? s.heroId : 'pudge', rarity: s.rarity, name: s.name, ts: s.ts || Date.now() }); });
    (old.equipment || []).forEach(e => { if (RARITIES.includes(e.rarity)) { const it = pickCatalog(e.rarity, e.slot, e.heroId); st.items.push(eqFromCatalog(it, st.uid++)); } });
    st.spins = old.spins || 0;
    lsSet('d2m_legacy_done', true);
    st._imported = true;
  } catch (e) {}
}

// ---------- power ----------
function calcPower(l) { const P = CONFIG.power; return Math.round(P.base * Math.pow(P.growth, l - 1) + P.perLevel * l); }
function spinCost(l) { const P = CONFIG.spin; return Math.round((P.base + P.perLevel * l) * Math.pow(P.growth, l - 1)); }
const EQ_POWER = { common: 20, uncommon: 50, rare: 120, mythical: 280, immortal: 600, arcana: 1300 };
function equipPower(id) {
  const lo = S.loadout[id]; if (!lo) return 0;
  let s = 0;
  for (const slot in lo) { const it = S.items.find(x => x.uid === lo[slot]); if (it) s += EQ_POWER[it.rarity] || 0; }
  return s;
}
function heroPower(id) { const h = S.heroes[id]; return Math.round((calcPower(h.level) + (h.bonus || 0) + equipPower(id)) * (typeof setBonusMul === 'function' ? setBonusMul(id) : 1)); }
function totalPower() { return HEROES.reduce((a, h) => a + heroPower(h.id), 0); }
function sortedByPower() { return HEROES.slice().sort((a, b) => heroPower(b.id) - heroPower(a.id)); }
function mainHeroId() { return S.mainHero && HERO_BY_ID[S.mainHero] ? S.mainHero : sortedByPower()[0].id; }
function getStack() {
  // 2.3: свой стак из 5 героев (первый — главный)
  const cs = S.customStack;
  if (Array.isArray(cs) && cs.length === 5 && cs.every(id => HERO_BY_ID[id]) && new Set(cs).size === 5) return cs.slice();
  const main = mainHeroId();
  const rest = sortedByPower().filter(h => h.id !== main).slice(0, 4).map(h => h.id);
  return [main].concat(rest);
}
function stackPower() { return getStack().reduce((a, id) => a + heroPower(id), 0); }

// ---------- currency ----------
function addGems(n) { S.gems = Math.max(0, Math.floor(S.gems + n)); updateTop(); }
function canPay(n) { return S.gems >= n; }

// ---------- items ----------
function rarityIdx(r) { return RARITIES.indexOf(r); }
// 2.3: снаряжение у каждого героя своё. Если в каталоге cs.money нет предмета героя нужной редкости —
// создаём предмет героя: название по слоту и редкости, картинка — иконка его способности.
const EQ_NOUN = { weapon: 'Blade', head: 'Helm', armor: 'Armor', arms: 'Bracers', back: 'Mantle', mount: 'Steed' };
function genHeroEq(heroId, rarity, slot) {
  slot = slot || pick(EQ_SLOTS).id;
  const sk = (typeof getSkills === 'function' ? getSkills(heroId) : []).map(s => s.key);
  const art = { weapon: sk[0], head: sk[1], armor: sk[2], arms: sk[1], back: sk[3], mount: sk[0] }[slot] || sk[0] || null;
  return { name: pick(SKIN_PREFIX[rarity]) + ' ' + EQ_NOUN[slot] + ' of ' + HERO_BY_ID[heroId].name, hero: heroId, path: undefined, art, rarity, slot };
}
function pickCatalog(rarity, slot, heroId, strict) {
  if (strict && heroId && HERO_BY_ID[heroId]) {
    let own = CS_ITEMS.filter(x => x.hero === heroId && x.rarity === rarity);
    const os = slot ? own.filter(x => x.slot === slot) : [];
    if (os.length) own = os;
    return own.length && Math.random() < 0.75 ? pick(own) : genHeroEq(heroId, rarity, slot);
  }
  let pool = CS_ITEMS.filter(x => x.rarity === rarity);
  if (!pool.length) pool = CS_ITEMS;
  const byHero = heroId ? pool.filter(x => x.hero === heroId) : [];
  if (byHero.length && Math.random() < 0.7) pool = byHero;
  const bySlot = slot ? pool.filter(x => x.slot === slot) : [];
  if (bySlot.length && Math.random() < 0.6) pool = bySlot;
  return pick(pool);
}
function eqFromCatalog(c, uid) { const it = { uid, type: 'eq', heroId: c.hero, rarity: c.rarity, name: c.name, path: c.path, slot: c.slot, ts: Date.now() }; if (c.art) it.art = c.art; if (!it.path) delete it.path; return it; }
function skinName(heroId, rarity) {
  const u = UNIQUE_SKINS[heroId] && UNIQUE_SKINS[heroId][rarity];
  if (u && Math.random() < 0.55) return u;
  const p = pick(SKIN_PREFIX[rarity]), s = pick(SKIN_SUFFIX[rarity]);
  return Math.random() < 0.4 ? p + ' ' + s + ' of ' + HERO_BY_ID[heroId].name : p + ' ' + s;
}
function addSkin(heroId, rarity) {
  if (!HERO_BY_ID[heroId]) heroId = pick(HEROES).id;
  const st = typeof pickSet === 'function' && Math.random() < 0.8 ? pickSet(heroId, rarity) : null;
  const it = { uid: S.uid++, type: 'skin', heroId, rarity, name: st ? st.name : skinName(heroId, rarity), path: st ? st.path : undefined, ts: Date.now() };
  S.items.unshift(it); updateTop(); if (typeof noteDrop === 'function') noteDrop(it);
  return it;
}
function addEquipment(heroId, rarity, slot) {
  if (!HERO_BY_ID[heroId]) heroId = pick(HEROES).id;
  const c = pickCatalog(rarity, slot, heroId, true);
  const it = eqFromCatalog(c, S.uid++);
  S.items.unshift(it);
  // авто-экипировка на героя-владельца, если слот пуст или предмет лучше
  const owner = HERO_BY_ID[heroId] ? heroId : it.heroId;
  autoEquip(it, owner);
  if (typeof noteDrop === 'function') noteDrop(it);
  updateTop();
  return it;
}
function autoEquip(it, heroId) {
  heroId = it.heroId;                                  // снаряжение надевается только на своего героя
  if (!HERO_BY_ID[heroId] || S.autoEquipOff) return;
  if (!S.loadout[heroId]) S.loadout[heroId] = {};
  const cur = S.items.find(x => x.uid === S.loadout[heroId][it.slot]);
  if (!cur || rarityIdx(it.rarity) > rarityIdx(cur.rarity)) { unequipItem(it.uid); S.loadout[heroId][it.slot] = it.uid; }
}
function equippedOn(uid) {
  for (const hid in S.loadout) for (const sl in S.loadout[hid]) if (S.loadout[hid][sl] === uid) return hid;
  return null;
}
function unequipItem(uid) {
  for (const hid in S.loadout) for (const sl in S.loadout[hid]) if (S.loadout[hid][sl] === uid) delete S.loadout[hid][sl];
}
function removeItem(uid) { unequipItem(uid); S.items = S.items.filter(x => x.uid !== uid); }
function weightedRarity(w) {
  w = w || { common: 28, uncommon: 24, rare: 20, mythical: 14, immortal: 9, arcana: 5 };   // 2.3: редкость выше
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (const k in w) { r -= w[k]; if (r <= 0) return k; }
  return 'common';
}
function sellPrice(it) { return Math.round(CONFIG.sell[it.rarity] * (it.type === 'eq' ? CONFIG.sellEqMul : CONFIG.sellSkinMul || 1)); }
function itemImgChain(it) {
  if (it.type === 'eq') return it.path ? [itemImg(it.path)] : [STEAM + 'abilities/' + (it.art || '') + '.png', it.art ? spellIcon(it.art) : null, heroImg(it.heroId)].filter(Boolean);
  if (it.path) return [itemImg(it.path)].concat(heroTallChain(it.heroId));
  return heroTallChain(it.heroId);
}

// ---------- UI helpers ----------
function updateTop() {
  if (!S) return;
  document.getElementById('gems-chip').innerHTML = gemHTML(S.gems);
  document.getElementById('st-stack').textContent = fmt(stackPower());
  document.getElementById('st-power').textContent = fmt(totalPower());
  document.getElementById('st-items').textContent = fmt(S.items.length);
  document.getElementById('st-spins').textContent = fmt(S.spins);
  document.getElementById('st-arena').textContent = Math.min(100, S.arena.cleared + 1);
}
function updateProfileChip() {
  document.getElementById('pc-nick').textContent = USER.nick;
  const ct = typeof currentTitle === 'function' ? currentTitle() : null;
  document.getElementById('pc-sub').innerHTML = ct ? titleHTML(ct) : 'Арена ' + S.arena.cleared + '/100';
  setImg(document.getElementById('pc-img'), heroImgChain(S.avatar || 'invoker'), S.avatar);
}
function switchTab(t) {
  if (busy.battle) return;
  currentTab = t;
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === t));
  document.querySelectorAll('.tab').forEach(s => s.classList.toggle('active', s.id === 'tab-' + t));
  try { if (location.hash !== '#' + t) history.replaceState(null, '', '#' + t); } catch (e) {}
  if (t === 'home') renderHome();
  if (t === 'heroes') renderHeroes();
  if (t === 'slots') renderSlotTab();
  if (t === 'collection') renderCollection();
  if (t === 'upgrade') renderUpgrade();
  if (t === 'arena') renderArena();
  if (t === 'rogue' && typeof renderRogue === 'function') renderRogue();
  if (t === 'invoker') invRender();
  if (t === 'quests') renderQuests();
  if (t === 'chests') renderChests();
  if (t === 'games') renderGames();
  if (t === 'online') renderOnline();
  if (t !== 'games' && typeof stopGames === 'function') stopGames();
  if (t !== 'slots' && typeof autoTotal !== 'undefined' && autoTotal) stopAuto('вкладка закрыта');
  window.scrollTo({ top: 0 });
}

// modal
let modalTimer = null, modalOpen = false;
function showModal(em, title, desc, cls, opts) {
  opts = opts || {};
  document.getElementById('m-em').textContent = em;
  const h = document.getElementById('m-title'); h.textContent = title; h.className = cls === 'ok' ? 'ok' : cls === 'bad' ? 'bad' : '';
  const d = document.getElementById('m-desc'); if (opts.html) d.innerHTML = desc; else d.textContent = desc;
  const b = document.getElementById('m-btns'); b.innerHTML = '';
  (opts.buttons || [{ t: 'OK', c: 'green', f: closeModal }]).forEach(x => {
    const bt = document.createElement('button'); bt.className = 'btn ' + (x.c || ''); bt.textContent = x.t; bt.onclick = x.f; b.appendChild(bt);
  });
  document.getElementById('modal').classList.add('show');
  modalOpen = true;
  clearTimeout(modalTimer);
  if (opts.auto) modalTimer = setTimeout(closeModal, speed === 'fast' ? 1200 : 2200);
}
function closeModal() { document.getElementById('modal').classList.remove('show'); modalOpen = false; clearTimeout(modalTimer); }
function confirmBox(title, desc, onYes, html) {
  showModal('❓', title, desc, '', { html, buttons: [{ t: 'Да', c: 'green', f: () => { closeModal(); onYes(); } }, { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
document.getElementById('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

// НИШТЯК / 21 / БИЧ
let hypeTimer = null;
function hype(text) {
  const el = document.getElementById('hype');
  document.getElementById('hype-text').textContent = text;
  el.classList.remove('show', 'bich'); void el.offsetWidth;
  if (text === 'БИЧ') el.classList.add('bich');
  el.classList.add('show');
  if (text === 'НИШТЯК' && typeof track === 'function') track('nishtyak');
  if (text === 'БИЧ' && typeof track === 'function') track('bich');
  if (text === '21' && typeof track === 'function') track('twentyone');
  // 2.3: голос — проигрыш «BITCH», 21 — быстрое «twenty one», джекпот — «НИШТЯЯЯК»
  if (typeof announce === 'function') { if (text === 'НИШТЯК') announce('Ништяяяяк!', { lang: 'ru', pitch: 0.8, rate: 0.75 }); else if (text === 'БИЧ') announce('Bitch!', { pitch: 0.6, rate: 0.9 }); else if (text === '21') announce('twenty one', { rate: 1.9, pitch: 1.1 }); }
  if (typeof sfx === 'function') sfx(text === 'БИЧ' ? 'lose' : 'win');
  clearTimeout(hypeTimer);
  hypeTimer = setTimeout(() => el.classList.remove('show'), 1750);
}

function setSpeed(m) {
  speed = m;
  document.getElementById('spd-slow').classList.toggle('active', m === 'slow');
  document.getElementById('spd-fast').classList.toggle('active', m === 'fast');
  lsSet('d2m_speed', m);
}

// бесплатные кристаллы раз в 10 минут
function freeAmount() { return Math.max(CONFIG.free.min, Math.round(rewardScale() * CONFIG.free.mul / 50) * 50); }
function freeLeft() { return Math.min(CONFIG.free.cooldownMs, (S.freeAt || 0) - nowMs()); }
function freeGems() {
  const left = freeLeft();
  if (left > 0) return;
  const fg = freeAmount(); addGems(fg); S.freeAt = nowMs() + CONFIG.free.cooldownMs; save(); sfx('coin');
  showModal('🔶', '+' + fmt(fg) + ' кристаллов', 'Следующий бонус через 10 минут.', 'ok', { auto: true });
  updateFreeBtn();
}
function updateFreeBtn() {
  if (!S) return;
  const b = document.getElementById('free-btn');
  const left = freeLeft();
  if (left > 0) { const s = Math.ceil(left / 1000); b.disabled = true; b.textContent = '⏳ ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  else { b.disabled = false; b.innerHTML = '+' + fmtShort(freeAmount()) + ' <img class="gem" src="' + GEM_IMG + '" referrerpolicy="no-referrer">'; }
}
setInterval(updateFreeBtn, 1000);

function upgradeAll() {
  const targets = HEROES.filter(h => S.heroes[h.id].level < CONFIG.maxLevel);
  if (!targets.length) return showModal('⬆', 'Максимум', 'Все герои уже 50 уровня.', '');
  const cost = targets.reduce((a, h) => a + Math.round(spinCost(S.heroes[h.id].level) * 0.9), 0);
  confirmBox('Улучшить всех', 'Все ' + targets.length + ' героев получат +1 уровень за ' + gemHTML(cost) + '. Цена зависит от уровня каждого героя.', () => {
    if (!canPay(cost)) return showModal('🔶', 'Мало кристаллов', 'Нужно ' + fmt(cost) + ' 🔶', 'bad');
    addGems(-cost);
    targets.forEach(h => S.heroes[h.id].level++); track('heroLevels', targets.length);
    save(); updateTop();
    if (currentTab === 'heroes') renderHeroes();
    if (currentTab === 'arena') renderArena();
    showModal('⬆', 'Готово!', targets.length + ' героев +1 уровень', 'ok', { auto: true });
  }, true);
}
function refreshUI() { switchTab(currentTab); updateTop(); updateProfileChip(); showModal('🔄', 'Обновлено', 'Интерфейс и картинки перерисованы.', 'ok', { auto: true }); }

// ---------- profile ----------
// 2.3: профиль — карточка игрока со статистикой; настройки аккаунта свернуты ниже
function profileCardHTML() {
  const pv = S.pvp || { mmr: 0, w: 0, l: 0 }, rk = typeof rankOf === 'function' ? rankOf(pv.mmr || 0) : ['—', 0, '#888'];
  const ach = S.ach ? Object.keys(S.ach).length : 0, achT = typeof ACHIEVEMENTS !== 'undefined' ? ACHIEVEMENTS.length : 0;
  const maxed = HEROES.filter(h => S.heroes[h.id] && S.heroes[h.id].level >= CONFIG.maxLevel).length;
  const arc = S.items.filter(x => x.rarity === 'arcana').length;
  const top = sortedByPower().slice(0, 3);
  const ct = typeof currentTitle === 'function' ? currentTitle() : null;
  const st = (i, n, v) => '<div class="pf-st"><span>' + i + '</span><b>' + v + '</b><small>' + n + '</small></div>';
  return '<div class="pf-card"><div class="pf-ava"><img src="' + STEAM + 'heroes/' + (S.avatar || 'invoker') + '.png" referrerpolicy="no-referrer" alt=""></div>' +
    '<div class="pf-main"><div class="pf-nick">' + esc(USER.nick) + '</div>' + (ct ? titleHTML(ct) : '') +
    '<div class="pf-rank" style="color:' + rk[2] + ';border-color:' + rk[2] + '">' + (typeof rankName === 'function' ? rankName(pv.mmr || 0) : rk[0]) + ' · ' + (pv.mmr || 0) + ' MMR</div></div></div>' +
    '<div class="pf-stats">' + st('⚔', 'Арена', (S.arena.cleared || 0) + '/100') + st('💪', 'Сила стака', fmtShort(stackPower())) + st('🏆', 'PvP', (pv.w || 0) + '–' + (pv.l || 0)) +
    st('⭐', 'Героев 50 ур.', maxed + '/' + HEROES.length) + st('🎒', 'Предметов', fmt(S.items.length)) + st('🟢', 'Arcana', arc) +
    st('🏅', 'Достижения', ach + '/' + achT) + st('🏰', 'Башня', 'этаж ' + ((S.tower && S.tower.best) || 0)) + st('🌀', 'Путь Древнего', ((S.rogue && S.rogue.wins) || 0) + ' побед') + '</div>' +
    '<div class="pf-top"><div class="muted">Лучшие герои</div>' + top.map(h => '<div class="pf-hero"><img src="' + STEAM + 'heroes/' + h.id + '.png" referrerpolicy="no-referrer" alt=""><span>' + esc(h.name) + '<small>ур. ' + S.heroes[h.id].level + ' · ⚔ ' + fmtShort(heroPower(h.id)) + '</small></span></div>').join('') + '</div>';
}
function openProfile() {
  const html = '<div style="text-align:left">' + profileCardHTML() +
    '<details class="pf-edit"><summary>✏ Изменить профиль и аккаунт</summary>' +
    '<div class="field"><label>Ник</label><input type="text" id="pf-nick" maxlength="20" value="' + esc(USER.nick) + '"></div>' +
    titlePickerHTML() +
    '<label class="muted" style="font-size:.72rem;letter-spacing:1px;text-transform:uppercase">Аватар</label><div class="profile-heroes" id="pf-heroes"></div>' +
    '<div class="field"><label>Новый пароль (необязательно)</label><input type="password" id="pf-pass" maxlength="64" autocomplete="new-password"></div>' +
    '<div class="field"><label>Текущий пароль (нужен для смены пароля или ника)</label><input type="password" id="pf-old" maxlength="64" autocomplete="current-password"></div>' +
    (typeof cloud === 'function' && cloud() ? '<div style="margin:4px 0 8px"><button class="btn sm ghost" type="button" data-click="askNewRecovery()">🔑 Новый код восстановления</button></div>' : '') +
    '</details><div class="auth-err" id="pf-err"></div></div>';
  showModal('👤', 'Профиль', html, '', { html: true, buttons: [
    { t: 'Сохранить', c: 'green', f: saveProfile }, { t: '💾 Перенос', c: 'gold', f: openTransfer }, { t: 'Выйти', c: 'red', f: logout }, { t: 'Сброс прогресса', c: 'ghost', f: resetProgress }, { t: '🗑 Удалить аккаунт', c: 'ghost', f: () => openDeleteAccount() }, { t: '✕', c: 'ghost', f: closeModal }] });
  const box = document.getElementById('pf-heroes');
  HEROES.forEach(h => {
    const im = mkImg(heroImgChain(h.id), h.name); im.title = h.name;
    if (h.id === S.avatar) im.classList.add('sel');
    im.onclick = () => { box.querySelectorAll('img').forEach(x => x.classList.remove('sel')); im.classList.add('sel'); box.dataset.sel = h.id; };
    box.appendChild(im);
  });
}
async function saveProfile() {
  const err = document.getElementById('pf-err');
  const nick = document.getElementById('pf-nick').value.trim();
  const pass = document.getElementById('pf-pass').value;
  const sel = document.getElementById('pf-heroes').dataset.sel;
  if (!validNick(nick)) { err.textContent = 'Ник: 3–20 символов'; return; }
  const accs = lsGet(ACC_KEY, {});
  const nk = nickKey(nick);
  if (nk !== USER.key && accs[nk]) { err.textContent = 'Ник занят'; return; }
  const acc = accs[USER.key];
  const oldPass = document.getElementById('pf-old').value;
  const hasCloud = typeof cloud === 'function' && cloud();
  if (pass || nk !== USER.key) {
    if (await hashPass(oldPass, acc.salt) !== acc.hash) { err.textContent = 'Введи текущий пароль'; return; }
  }
  if (pass && pass.length < 4) { err.textContent = 'Пароль минимум 4 символа'; return; }
  err.style.color = 'var(--muted)'; err.textContent = hasCloud && (pass || nk !== USER.key) ? 'Сохраняю в облаке…' : '';
  try {
    if (hasCloud && nk !== USER.key) await cloudRenameNick(USER.key, nk);
    if (hasCloud && pass) await cloudChangePassword(oldPass, pass);
  } catch (e) { err.style.color = ''; err.textContent = /доступ/.test(e.message) ? 'Этот ник в онлайне уже занят' : 'Облако: ' + e.message; return; }
  err.style.color = '';
  if (pass) { acc.salt = newSalt(); acc.hash = await hashPass(pass, acc.salt); }
  acc.nick = nick;
  if (sel) S.avatar = sel;
  if (nk !== USER.key) {
    delete accs[USER.key]; accs[nk] = acc;
    lsSet(saveKey(nk), S); lsDel(saveKey(USER.key));
    USER.key = nk; lsSet(SES_KEY, { key: nk });
  }
  USER.nick = nick;
  lsSet(ACC_KEY, accs); save();
  if (hasCloud) schedulePush(500);
  updateProfileChip(); closeModal();
  if (currentTab === 'home') renderHome();
}
function resetProgress() {
  confirmBox('Сбросить прогресс?', 'Кристаллы, уровни героев, предметы и арена обнулятся. Аккаунт останется.', () => {
    const av = S.avatar; S = freshState(); S.avatar = av; save(); startGame();
    showModal('🗑', 'Сброс', 'Прогресс очищен. Удачи с нуля!', '', { auto: true });
  });
}

// ---------- music ----------
let musicLoaded = false;
function toggleMusic() {
  const p = document.getElementById('music-panel');
  p.classList.toggle('show');
  if (!musicLoaded) {
    musicLoaded = true;
    document.getElementById('music-embed').innerHTML = '<iframe src="https://open.spotify.com/embed/album/6fpvsv041NQCRMpxAvwgLI?utm_source=generator&theme=0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Dota 2 Official Soundtrack"></iframe>';
  }
}
function playOwnTrack(inp) {
  const f = inp.files && inp.files[0]; if (!f) return;
  const a = document.getElementById('own-audio');
  a.src = URL.createObjectURL(f); a.style.display = 'block';
  a.play().then(() => document.getElementById('music-fab').classList.add('playing')).catch(() => {});
}

// ---------- SVG wheel ----------
// segs: [{label, color, weight}] ; returns {rot, segs:[{start,end}], wrap}
function buildWheel(host, segs, opts) {
  opts = opts || {};
  host.innerHTML = '';
  const total = segs.reduce((a, s) => a + s.weight, 0);
  const R = 150, C = 160;
  let a0 = 0;
  const NS = 'http://www.w3.org/2000/svg';
  const ang = [];
  let paths = '', labels = '', seps = '';
  const pt = (a, r) => [C + r * Math.sin(a * Math.PI / 180), C - r * Math.cos(a * Math.PI / 180)];
  segs.forEach((s, i) => {
    const d = s.weight / total * 360, a1 = a0 + d;
    ang.push({ start: a0, end: a1 });
    const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
    const large = d > 180 ? 1 : 0;
    const gid = 'wg' + (opts.id || '') + i;
    paths += '<defs><radialGradient id="' + gid + '" cx="160" cy="160" r="150" gradientUnits="userSpaceOnUse"><stop offset="0.15" stop-color="' + shade(s.color, -0.55) + '"/><stop offset="0.75" stop-color="' + s.color + '"/><stop offset="1" stop-color="' + shade(s.color, 0.25) + '"/></radialGradient></defs>';
    paths += d >= 359.9
      ? '<circle cx="160" cy="160" r="150" fill="url(#' + gid + ')"/>'
      : '<path d="M160 160 L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + ' A150 150 0 ' + large + ' 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + ' Z" fill="url(#' + gid + ')"/>';
    const [sx, sy] = pt(a0, R);
    seps += '<line x1="160" y1="160" x2="' + sx.toFixed(2) + '" y2="' + sy.toFixed(2) + '" stroke="rgba(0,0,0,.55)" stroke-width="2"/><line x1="160" y1="160" x2="' + sx.toFixed(2) + '" y2="' + sy.toFixed(2) + '" stroke="rgba(255,230,170,.25)" stroke-width="0.8"/>';
    const mid = a0 + d / 2;
    const fs = d < 22 ? 9 : d < 40 ? 11 : 13;
    labels += '<g transform="rotate(' + mid.toFixed(2) + ' 160 160)"><text x="160" y="' + (opts.labelY || 48) + '" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="900" font-size="' + fs + '" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke" letter-spacing=".5">' + esc(s.label) + '</text>' + (s.sub ? '<text x="160" y="' + ((opts.labelY || 48) + 14) + '" text-anchor="middle" font-family="Roboto Condensed" font-weight="700" font-size="9" fill="#ffe9b0" stroke="#000" stroke-width="2.5" paint-order="stroke">' + esc(s.sub) + '</text>' : '') + '</g>';
    a0 = a1;
  });
  // ticks
  let ticks = '';
  for (let i = 0; i < 72; i++) { const a = i * 5, [x0, y0] = pt(a, 150), [x1, y1] = pt(a, i % 2 ? 145 : 141); ticks += '<line x1="' + x0.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="rgba(255,235,180,.45)" stroke-width="1"/>'; }
  const rotSvg = '<svg viewBox="0 0 320 320" xmlns="' + NS + '">' + paths + seps + ticks + labels +
    '<circle cx="160" cy="160" r="150" fill="none" stroke="rgba(0,0,0,.6)" stroke-width="3"/>' +
    '<circle cx="160" cy="160" r="40" fill="rgba(0,0,0,.35)"/></svg>';
  // статичная часть: обод с лампочками + центр
  let bulbs = '';
  for (let i = 0; i < 24; i++) { const [x, y] = pt(i * 15, 156); bulbs += '<circle class="bulb' + (i % 2 ? ' alt' : '') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3.2" fill="#fff4c4" style="filter:drop-shadow(0 0 3px #ffd36a)"/>'; }
  const staticSvg = '<svg viewBox="0 0 320 320" xmlns="' + NS + '"><defs>' +
    '<linearGradient id="rim' + (opts.id || '') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".35" stop-color="#d9b25a"/><stop offset=".7" stop-color="#7a5a1e"/><stop offset="1" stop-color="#e9c770"/></linearGradient>' +
    '<radialGradient id="hub' + (opts.id || '') + '" cx=".38" cy=".32"><stop offset="0" stop-color="#ffe9a6"/><stop offset=".5" stop-color="#c8a45a"/><stop offset="1" stop-color="#5a4214"/></radialGradient></defs>' +
    '<circle cx="160" cy="160" r="156" fill="none" stroke="url(#rim' + (opts.id || '') + ')" stroke-width="10"/>' +
    '<circle cx="160" cy="160" r="151" fill="none" stroke="#000" stroke-width="1.5"/>' + bulbs +
    '<circle cx="160" cy="160" r="34" fill="url(#hub' + (opts.id || '') + ')" stroke="#2a1d08" stroke-width="3"/>' +
    '<circle cx="160" cy="160" r="24" fill="#120d06" stroke="#c8a45a" stroke-width="1.5"/>' +
    '<text x="160" y="168" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="900" font-size="20" fill="#e8c77a">' + (opts.center || 'D') + '</text></svg>';
  const pointer = '<svg class="wheel-pointer" viewBox="0 0 34 46"><defs><linearGradient id="pg' + (opts.id || '') + '" x1="0" x2="1"><stop offset="0" stop-color="#8a6d32"/><stop offset=".5" stop-color="#fff0b8"/><stop offset="1" stop-color="#8a6d32"/></linearGradient></defs><path d="M17 44 L3 10 A14 14 0 1 1 31 10 Z" fill="url(#pg' + (opts.id || '') + ')" stroke="#2a1d08" stroke-width="2"/><circle cx="17" cy="13" r="5" fill="#b8321f" stroke="#2a1d08" stroke-width="1.5"/></svg>';
  host.innerHTML = '<div class="wheel-glow"></div><div class="wheel-rot">' + rotSvg + '</div><div class="wheel-static">' + staticSvg + '</div>' + pointer;
  const rot = host.querySelector('.wheel-rot');
  rot.style.transform = 'rotate(' + (host._rotation || 0) + 'deg)';
  return { rot, angles: ang, host };
}
function shade(hex, p) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (p < 0) { r *= 1 + p; g *= 1 + p; b *= 1 + p; } else { r += (255 - r) * p; g += (255 - g) * p; b += (255 - b) * p; }
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}
// крутит колесо так, чтобы угол targetAngle (по часовой от верха) оказался под указателем
function spinWheelTo(w, targetAngle, ms) {
  const host = w.host;
  const cur = host._rotation || 0;
  const base = cur - (cur % 360);
  const turns = speed === 'fast' ? 3 : 6;
  let next = base + turns * 360 + (360 - targetAngle);
  if (next <= cur + 720) next += 360;
  host._rotation = next;
  host.classList.add('spinning');
  w.rot.style.transition = 'transform ' + ms + 'ms cubic-bezier(.12,.75,.12,1)';
  w.rot.style.transform = 'rotate(' + next + 'deg)';
  // тиканье указателя
  const ptr = host.querySelector('.wheel-pointer');
  let t = 0; const iv = setInterval(() => { t += 90; if (ptr) { ptr.classList.remove('tick'); void ptr.offsetWidth; ptr.classList.add('tick'); } if (typeof sfx === 'function') sfx('tick'); if (t > ms * 0.85) clearInterval(iv); }, 90 + Math.random() * 40);
  setTimeout(() => host.classList.remove('spinning'), ms);
}

// клавиша пробел
document.addEventListener('keydown', e => {
  if (!S || !document.getElementById('auth').classList.contains('hidden')) return;
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
  if (e.code === 'Space') {
    if (modalOpen) { e.preventDefault(); closeModal(); return; }
    if (currentTab === 'heroes') { e.preventDefault(); spinHero(); }
    else if (currentTab === 'slots') { e.preventDefault(); spinSlots(); }
  }
  if (e.code === 'Escape' && modalOpen) closeModal();
});

// ---------- HOME ----------
function renderHome() {
  const box = document.getElementById('home-heroes');
  if (!box.children.length) ['phantom_assassin','juggernaut','crystal_maiden','pudge','invoker'].forEach(id => box.appendChild(mkImg(heroTallChain(id), id)));
  const st = getStack();
  const best = sortedByPower()[0];
  document.getElementById('home-profile').innerHTML =
    '<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">' +
    '<div id="hp-av"></div><div style="flex:1;min-width:200px"><div class="cinzel" style="font-size:1.3rem;color:#fff;font-weight:700">' + esc(USER.nick) + titleHTML(currentTitle()) + '</div>' +
    '<div class="muted" style="font-size:.85rem;margin-top:4px">Кристаллы: ' + gemHTML(S.gems) + ' · Сила стака: <b style="color:var(--gold2)">' + fmt(stackPower()) + '</b> · Арена: <b>' + S.arena.cleared + '/100</b> · Побед: ' + S.arena.wins + ' · Предметов: ' + S.items.length + '</div>' +
    '<div class="muted" style="font-size:.85rem;margin-top:4px">Сильнейший герой: <b style="color:#fff">' + best.name + '</b> (ур. ' + S.heroes[best.id].level + ', ⚔ ' + fmt(heroPower(best.id)) + ')' + (S.invBest ? ' · Рекорд Invoker: ' + S.invBest.toFixed(2) + 's' : '') + '</div></div>' +
    '<button class="btn" data-click="openProfile()">Изменить ник / аватар</button></div>';
  document.getElementById('hod-home').innerHTML = hodBanner(false);
  document.getElementById('home-stats').innerHTML = statsHTML();
  const av = mkImg(heroTallChain(S.avatar || 'invoker'), S.avatar);
  av.style.cssText = 'width:72px;height:96px;object-fit:cover;border:1px solid var(--gold3)';
  document.getElementById('hp-av').appendChild(av);
}

let bootSynced = false;
function startGame() {
  setSpeed(lsGet('d2m_speed', 'slow'));
  achSeen = null; ensureMeta(); ensureShop(); applySettings();
  updateTop(); updateProfileChip(); updateFreeBtn(); updateQuestBadge();
  initHeroes(); initSlots(); initCollection(); initArena(); invInit();
  const h = (location.hash || '').slice(1);
  switchTab(['home','heroes','slots','collection','upgrade','arena','invoker','quests','chests','games','online'].includes(h) ? h : 'home');
  setTimeout(() => startTutorial(false), 600);
  if (typeof cloud === 'function' && fbOn() && cloud() && !bootSynced) { bootSynced = true; setTimeout(async () => { try { await syncServerTime(); } catch (e) { } try { await ensureNickClaim(); } catch (e) { } try { await cloudSync(); } catch (e) { } checkGifts(); checkPvpHits(); }, 1200); }
  if (S._wipeBackup) { try { if (USER) localStorage.setItem('d2m_prewipe_' + USER.key, S._wipeBackup); } catch (e) { } delete S._wipeBackup; }
  if (S._wiped) { const w = S._wiped; delete S._wiped; save(); if (typeof schedulePush === 'function') schedulePush();
    if (w.arena || w.items || w.gems > CONFIG.startGems)
    showModal('🚀', 'Релиз 2.4: новый старт для всех', 'В честь выхода 2.4 прогресс всех игроков сброшен: герои, предметы, кристаллы, арена, MMR, Башня, рекорды и таблицы лидеров начинаются с нуля. Все стартуют на равных.<br><br>У тебя было: арена ' + w.arena + '/100, предметов ' + w.items + ', кристаллов ' + fmt(w.gems) + '.<br>Титулы ГОМО сохранены.', 'ok', { html: true }); }
  if (S.season24 && !S.season24.shown) season24Modal();
  if (S._imported) { delete S._imported; save(); showModal('📦', 'Прогресс перенесён', 'Уровни героев, золото (теперь кристаллы) и предметы из старой версии перенесены в этот аккаунт.', 'ok'); }
}
