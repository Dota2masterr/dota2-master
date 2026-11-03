// ================= ЛАВКА, ТАЛАНТЫ, СИНЕРГИИ, НАБОРЫ, РОШАН, РЕЖИМЫ =================
// 2.4: цена предмета лавки растёт вместе с базовой наградой (×rewardScale / shopRef), но не ниже базовой
function shopCost(id) { const b = CONFIG.shop[id] || 10000; const rs = typeof S !== 'undefined' && S && S.arena && typeof rewardScale === 'function' ? rewardScale() : 0; return Math.max(b, Math.round(b * rs / CONFIG.shopRef / 100) * 100); }
const ITEM_ICON = n => STEAM + 'items/' + n + '.png';
const SHOP = [
  { id: 'black_king_bar', name: 'Black King Bar', get cost() { return shopCost('black_king_bar'); }, d: 'Главный герой не может быть оглушён', mods: { stunImmune: true } },
  { id: 'heart', name: 'Heart of Tarrasque', get cost() { return shopCost('heart'); }, d: '+60% здоровья главному герою', mods: { hp: 1.6 } },
  { id: 'butterfly', name: 'Butterfly', get cost() { return shopCost('butterfly'); }, d: 'Уклонение: главный герой получает на 30% меньше урона', mods: { taken: 0.7 } },
  { id: 'greater_crit', name: 'Daedalus', get cost() { return shopCost('greater_crit'); }, d: '+20% шанс крита, крит ×2.6', mods: { crit: 0.2, critMul: 2.6 } },
  { id: 'satanic', name: 'Satanic', get cost() { return shopCost('satanic'); }, d: 'Вампиризм 15% от нанесённого урона', mods: { lifesteal: 0.15 } },
  { id: 'assault', name: 'Assault Cuirass', get cost() { return shopCost('assault'); }, d: 'Аура: вся команда +8% атаки', team: { atk: 1.08 } },
  { id: 'pipe', name: 'Pipe of Insight', get cost() { return shopCost('pipe'); }, d: 'Аура: команда получает на 10% меньше урона', team: { taken: 0.9 } },
  { id: 'ultimate_scepter', name: "Aghanim's Scepter", get cost() { return shopCost('ultimate_scepter'); }, d: 'Ульта главного героя ×1.5', mods: { ultMul: 1.5 } },
  { id: 'refresher', name: 'Refresher Orb', get cost() { return shopCost('refresher'); }, d: 'Первая ульта в бою срабатывает дважды', mods: { refresher: true } },
  // 2.4: новые предметы Dota
  { id: 'abyssal_blade', name: 'Abyssal Blade', get cost() { return shopCost('abyssal_blade'); }, d: 'Аура: оглушения команды длятся на 1 ход дольше', team: { stunExtra: 1 } },
  { id: 'monkey_king_bar', name: 'Monkey King Bar', get cost() { return shopCost('monkey_king_bar'); }, d: '+15% атаки и +10% шанс крита', mods: { atk: 1.15, crit: 0.1 } },
  { id: 'skadi', name: 'Eye of Skadi', get cost() { return shopCost('skadi'); }, d: '+25% здоровья и +10% атаки', mods: { hp: 1.25, atk: 1.1 } },
  { id: 'bloodthorn', name: 'Bloodthorn', get cost() { return shopCost('bloodthorn'); }, d: '+12% шанс крита, крит ×2.3, +10% атаки', mods: { crit: 0.12, critMul: 2.3, atk: 1.1 } },
  { id: 'shivas_guard', name: "Shiva's Guard", get cost() { return shopCost('shivas_guard'); }, d: 'Аура: команда получает на 7% меньше урона', team: { taken: 0.93 } },
  { id: 'sphere', name: "Linken's Sphere", get cost() { return shopCost('sphere'); }, d: 'Главный герой получает на 15% меньше урона', mods: { taken: 0.85 } },
  { id: 'manta', name: 'Manta Style', get cost() { return shopCost('manta'); }, d: 'Иллюзии: атака главного героя +25%', mods: { atk: 1.25 } },
  { id: 'radiance', name: 'Radiance', get cost() { return shopCost('radiance'); }, d: 'Аура: АоЕ-ульты команды +20%', team: { aoe: 1.2 } },
  { id: 'octarine_core', name: 'Octarine Core', get cost() { return shopCost('octarine_core'); }, d: 'Ульта главного героя ×1.25', mods: { ultMul: 1.25 } },
  { id: 'aeon_disk', name: 'Aeon Disk', get cost() { return shopCost('aeon_disk'); }, d: '+30% здоровья главному герою', mods: { hp: 1.3 } },
  { id: 'desolator', name: 'Desolator', get cost() { return shopCost('desolator'); }, d: 'Атака главного героя +20%', mods: { atk: 1.2 } },
  { id: 'vladmir', name: "Vladmir's Offering", get cost() { return shopCost('vladmir'); }, d: 'Аура: команда +5% атаки; главный герой — вампиризм 6%', team: { atk: 1.05 }, mods: { lifesteal: 0.06 } },
  { id: 'rapier', name: 'Divine Rapier', get cost() { return shopCost('rapier'); }, d: 'Атака главного героя ×1.8. Если он погибнет — рапира выпадет и пропадёт!', mods: { atk: 1.8, rapier: true } }
];
const CONSUMABLES = {
  aegis: { name: 'Aegis of the Immortal', icon: 'aegis', d: 'В следующем бою главный герой один раз воскреснет' },
  cheese: { name: 'Cheese', icon: 'cheese', d: 'Когда здоровье главного героя падает ниже 25% — полностью восстанавливает его' }
};
function ensureShop() { S.shop = S.shop || { owned: [], slots: [] }; S.cons = S.cons || { aegis: 0, cheese: 0 }; S.useCons = S.useCons || { aegis: true, cheese: true }; }

// ---------- таланты ----------
const TALENT_LEVELS = [10, 15, 20, 25];
const TALENTS = {
  10: [{ t: '+12% атаки', m: { atk: 1.12 } }, { t: '+15% здоровья', m: { hp: 1.15 } }],
  15: [{ t: '+12% шанс крита', m: { crit: 0.12 } }, { t: 'Ульта каждые 5 атак', m: { ultEvery: 5 } }],
  20: [{ t: '+25% атаки', m: { atk: 1.25 } }, { t: '−20% входящего урона', m: { taken: 0.8 } }],
  25: [{ t: 'Ульта ×1.5', m: { ultMul: 1.5 } }, { t: '+35% здоровья и +10% атаки', m: { hp: 1.35, atk: 1.1 } }]
};
function mergeMods(a, b) {
  const r = Object.assign({}, a);
  for (const k in b) {
    if (['atk', 'hp', 'taken', 'ultMul'].includes(k)) r[k] = (r[k] || 1) * b[k];
    else if (k === 'crit' || k === 'lifesteal') r[k] = (r[k] || 0) + b[k];
    else if (k === 'ultEvery') r[k] = Math.min(r[k] || 6, b[k]);
    else if (k === 'critMul') r[k] = Math.max(r[k] || 1.9, b[k]);
    else r[k] = b[k];
  }
  return r;
}
// 2.3: у каждого героя свои таланты из Dota (js/data-talents.js); сила ступени у всех одинаковая
function heroTalent(id, L, c) {
  const i = TALENT_LEVELS.indexOf(L), ht = typeof HERO_TALENTS !== 'undefined' && HERO_TALENTS[id];
  if (ht && ht[i] && ht[i][c]) return { n: ht[i][c][0], t: ht[i][c][2], m: ht[i][c][1] };
  return { n: TALENTS[L][c].t, t: TALENTS[L][c].t, m: TALENTS[L][c].m };
}
function talentMods(id) {
  const h = S.heroes[id]; let m = {};
  TALENT_LEVELS.forEach(L => { const c = h.talents && h.talents[L]; if (c != null && h.level >= L) m = mergeMods(m, heroTalent(id, L, c).m); });
  return m;
}
function pendingTalents(id) { const h = S.heroes[id]; return TALENT_LEVELS.filter(L => h.level >= L && !(h.talents && h.talents[L] != null)); }
function pickTalent(id, L, c) { const h = S.heroes[id]; h.talents = h.talents || {}; if (h.level < L || h.talents[L] != null) return; h.talents[L] = c; save(); renderPreview(); }
// 2.4: сброс талантов — 1 бесплатный в неделю, дальше цена растёт ×2 за каждый сброс (CONFIG.talentReset)
function talentResetWeek() { const d = new Date(nowMs()); const j = new Date(Date.UTC(d.getUTCFullYear(), 0, 1)); return d.getUTCFullYear() + '-' + Math.floor((d - j) / 6048e5); }
function talentResetCost() {
  const T = CONFIG.talentReset, R = S.talentReset = S.talentReset || { week: '', free: 0, n: 0 };
  if (R.week !== talentResetWeek()) { R.week = talentResetWeek(); R.free = 0; }
  if (R.free < T.freePerWeek) return 0;
  return Math.round(rewardScale() * T.baseMul * Math.pow(T.growth, Math.min(10, R.n)));
}
function resetTalents(id) {
  const h = S.heroes[id]; if (!h || !h.talents || !Object.keys(h.talents).length) return;
  const cost = talentResetCost();
  confirmBox('Сбросить таланты?', 'Все таланты ' + esc(HERO_BY_ID[id].name) + ' сбросятся, их можно будет выбрать заново. ' + (cost ? 'Цена: ' + gemHTML(cost) : 'Сейчас бесплатно (1 раз в неделю).'), () => {
    const c = talentResetCost();
    if (c && !canPay(c)) return showModal('🔶', 'Мало кристаллов', 'Нужно ' + fmt(c), 'bad');
    if (c) { addGems(-c); S.talentReset.n++; } else S.talentReset.free++;
    h.talents = {}; save(); renderPreview(); renderHeroList(); updateTop();
  }, true);
}
function renderTalents(id) {
  const h = S.heroes[id];
  const any = h.talents && Object.keys(h.talents).length;
  let html = '<div class="talent-tree"><div class="tt-title">Таланты' + (any ? ' <button class="btn sm ghost tt-reset" data-click="resetTalents(\'' + id + '\')">↺ Сбросить' + (talentResetCost() ? ' · ' + fmt(talentResetCost()) + ' 🔶' : ' · бесплатно') + '</button>' : '') + '</div>';
  TALENT_LEVELS.slice().reverse().forEach(L => {
    const ch = h.talents && h.talents[L];
    const open = h.level >= L;
    html += '<div class="tt-row">' + [0, 1].map(c => '<button class="tt-opt' + (ch === c ? ' on' : '') + (ch != null && ch !== c ? ' off' : '') + '" ' + (!open || ch != null ? 'disabled' : '') + ' data-click="pickTalent(\'' + id + '\',' + L + ',' + c + ')"><b>' + esc(heroTalent(id, L, c).n) + '</b><small>' + heroTalent(id, L, c).t + '</small></button>').join('<span class="tt-lvl' + (open ? ' open' : '') + '">' + L + '</span>') + '</div>';
  });
  return html + '</div>';
}

// ---------- синергии ----------
const SYNERGIES = [
  { ids: ['magnataur', 'ember_spirit'], name: 'Reverse Polarity + Sleight of Fist', d: '+12% атаки команды', team: { atk: 1.12 } },
  { ids: ['wisp', 'gyrocopter'], name: 'Io + Gyro', d: '+15% здоровья команды', team: { hp: 1.15 } },
  { ids: ['wisp', 'tiny'], name: 'Io + Tiny', d: '+12% атаки команды', team: { atk: 1.12 } },
  { ids: ['earthshaker', 'enigma'], name: 'Black Hole + Echo Slam', d: 'Урон по волнам ×1.4', team: { aoe: 1.4 } },
  { ids: ['faceless_void', 'crystal_maiden'], name: 'Chronosphere + Freezing Field', d: 'Урон по волнам ×1.3', team: { aoe: 1.3 } },
  { ids: ['dark_seer', 'magnataur'], name: 'Vacuum + Reverse Polarity', d: 'Оглушения длятся на 1 ход дольше', team: { stunExtra: 1 } },
  { ids: ['lion', 'shadow_shaman'], name: 'Двойной контроль', d: 'Оглушения длятся на 1 ход дольше', team: { stunExtra: 1 } },
  { ids: ['dazzle', 'huskar'], name: 'Shallow Grave + Huskar', d: 'Команда получает на 12% меньше урона', team: { taken: 0.88 } },
  { ids: ['omniknight', 'ursa'], name: 'Guardian Angel + Enrage', d: '+10% атаки и −8% урона', team: { atk: 1.1, taken: 0.92 } },
  { ids: ['vengefulspirit', 'drow_ranger'], name: 'Аура ловкачей', d: '+12% атаки команды', team: { atk: 1.12 } }
];
const ATTR_SYNERGY = {
  str: { name: 'Стена силы', d: '5 героев силы: +20% здоровья', team: { hp: 1.2 } },
  agi: { name: 'Стая ловкачей', d: '5 героев ловкости: +10% атаки и +крит', team: { atk: 1.1 } },
  int: { name: 'Совет магов', d: '5 магов: урон по волнам ×1.3', team: { aoe: 1.3 } },
  uni: { name: 'Универсалы', d: '5 универсальных: +8% атаки, −8% урона', team: { atk: 1.08, taken: 0.92 } }
};
function activeSynergies(ids) {
  const set = new Set(ids);
  const res = SYNERGIES.filter(s => s.ids.every(i => set.has(i)));
  const at = ids.map(i => HERO_BY_ID[i].attr);
  if (at.every(a => a === at[0])) res.push(Object.assign({ ids: ids.slice() }, ATTR_SYNERGY[at[0]]));
  return res;
}
function teamMods(ids) {
  let tm = {};
  const mergeT = b => { for (const k in b) { if (k === 'stunExtra') tm[k] = (tm[k] || 0) + b[k]; else tm[k] = (tm[k] || 1) * b[k]; } };
  activeSynergies(ids).forEach(s => mergeT(s.team));
  ensureShop();
  S.shop.slots.forEach(sid => { const it = SHOP.find(x => x.id === sid); if (it && it.team) mergeT(it.team); });
  return tm;
}

// ---------- бонус набора: предметы героя-владельца на самом герое ----------
function setCount(id) { const lo = S.loadout[id]; if (!lo) return 0; let n = 0; for (const sl in lo) { const it = S.items.find(x => x.uid === lo[sl]); if (it && it.heroId === id) n++; } return n; }
function setBonusMul(id) { const n = setCount(id); return n >= 6 ? 1.25 : n >= 3 ? 1.1 : 1; }

// ---------- сборка команды для боя ----------
function buildTeam(opts) {
  opts = opts || {};
  ensureShop();
  const ids = getStack().slice(0, opts.size || 5);
  const team = ids.map((id, i) => {
    let m = talentMods(id);
    if (i === 0) {
      if (S.shards) m = mergeMods(m, { ultMul: 1 + 0.05 * Math.min(5, S.shards) });   // Aghanim's Shard с Торментора
      S.shop.slots.forEach(sid => { const it = SHOP.find(x => x.id === sid); if (it && it.mods) m = mergeMods(m, it.mods); });
      if (!opts.noCons) {
        if (S.cons.aegis > 0 && S.useCons.aegis) m.aegis = true;
        if (S.cons.cheese > 0 && S.useCons.cheese) m.cheese = true;
      }
    }
    if (id === heroOfDay() && CONFIG.heroOfDay.powerMul !== 1) m = mergeMods(m, { atk: CONFIG.heroOfDay.powerMul, hp: CONFIG.heroOfDay.powerMul });
    return { id, p: heroPower(id), mods: m };
  });
  return { team, tm: teamMods(ids), ids };
}
function consumeAfterBattle(used) {
  if (used.aegis && S.cons.aegis > 0) { S.cons.aegis--; arenaLog('gold', '🛡 Aegis использован'); }
  if (used.cheese && S.cons.cheese > 0) { S.cons.cheese--; arenaLog('gold', '🧀 Cheese съеден'); }
  if (used.rapierLost) {
    S.shop.slots = S.shop.slots.filter(x => x !== 'rapier'); S.shop.owned = S.shop.owned.filter(x => x !== 'rapier');
    arenaLog('lose', '⚔ Divine Rapier выпала! Главный герой погиб — рапира потеряна.');
  }
}

// ---------- UI лавки (в арене) ----------
function renderShopPanel() {
  ensureShop();
  const box = document.getElementById('shop-box'); if (!box) return;
  const main = mainHeroId();
  let html = '<div class="shop-inv"><div class="muted" style="font-size:.75rem;margin-bottom:4px">Инвентарь главного героя (' + esc(HERO_BY_ID[main].name) + ') — 6 слотов</div><div class="inv6">';
  for (let i = 0; i < 6; i++) {
    const sid = S.shop.slots[i], it = SHOP.find(x => x.id === sid);
    html += '<div class="islot" ' + (it ? 'title="' + esc(it.name + ' — ' + it.d) + '" data-click="shopUnequip(\'' + sid + '\')"' : '') + '>' + (it ? '<img src="' + ITEM_ICON(it.id) + '" referrerpolicy="no-referrer">' : '') + '</div>';
  }
  html += '</div><div class="cons-row">';
  ['aegis', 'cheese'].forEach(k => {
    html += '<label class="cons" title="' + esc(CONSUMABLES[k].d) + '"><img src="' + ITEM_ICON(CONSUMABLES[k].icon) + '" referrerpolicy="no-referrer"><b>×' + S.cons[k] + '</b><input type="checkbox" ' + (S.useCons[k] ? 'checked' : '') + ' data-change="setUseCons(\'' + k + '\',this.checked)"> исп.</label>';
  });
  html += '</div></div><div class="shop-grid">';
  SHOP.forEach(it => {
    const owned = S.shop.owned.includes(it.id), on = S.shop.slots.includes(it.id);
    html += '<div class="shop-item' + (on ? ' on' : '') + '"><img src="' + ITEM_ICON(it.id) + '" referrerpolicy="no-referrer"><div class="si-t"><b>' + esc(it.name) + '</b><div class="muted">' + esc(it.d) + '</div></div>' +
      (on ? '<button class="btn sm" data-click="shopUnequip(\'' + it.id + '\')">Снять</button>' : owned ? '<button class="btn sm green" data-click="shopEquip(\'' + it.id + '\')">Надеть</button>' : '<button class="btn sm gold" ' + (canPay(it.cost) ? '' : 'disabled') + ' data-click="shopBuy(\'' + it.id + '\')">' + fmt(it.cost) + ' 🔶</button>') + '</div>';
  });
  box.innerHTML = html + '</div>';
}
function shopBuy(id) {
  const it = SHOP.find(x => x.id === id); if (!it || S.shop.owned.includes(id)) return;
  if (!canPay(it.cost)) return;
  addGems(-it.cost); S.shop.owned.push(id); track('shopBuys');
  if (S.shop.slots.length < 6) S.shop.slots.push(id);
  save(); renderShopPanel(); renderLevelInfo(); sfx('coin');
}
function shopEquip(id) { if (S.shop.slots.length >= 6) return showModal('🎒', 'Инвентарь полон', 'Сначала сними предмет — у героя 6 слотов.', ''); S.shop.slots.push(id); save(); renderShopPanel(); renderLevelInfo(); }
function shopUnequip(id) { S.shop.slots = S.shop.slots.filter(x => x !== id); save(); renderShopPanel(); renderLevelInfo(); }

// ---------- синергии UI ----------
function renderSynergyBox() {
  const box = document.getElementById('syn-box'); if (!box) return;
  const ids = getStack();
  const act = activeSynergies(ids);
  let html = act.length ? act.map(s => '<div class="syn on">✦ <b>' + esc(s.name) + '</b> — ' + esc(s.d) + '</div>').join('') : '<div class="muted" style="font-size:.8rem">Нет активных связок. Поставь главным героем одного из пары, чтобы собрать синергию.</div>';
  html += '<details style="margin-top:6px"><summary class="muted" style="cursor:pointer;font-size:.78rem">Все связки</summary>' + SYNERGIES.map(s => '<div class="syn' + (act.includes(s) ? ' on' : '') + '">' + s.ids.map(i => '<img src="' + heroIcon(i) + '" referrerpolicy="no-referrer" title="' + HERO_BY_ID[i].name + '">').join('') + ' <b>' + esc(s.name) + '</b> — ' + esc(s.d) + '</div>').join('') + Object.keys(ATTR_SYNERGY).map(a => '<div class="syn"><img src="' + ATTR_ICON[a] + '" referrerpolicy="no-referrer"> <b>' + ATTR_SYNERGY[a].name + '</b> — ' + ATTR_SYNERGY[a].d + '</div>').join('') + '</details>';
  box.innerHTML = html;
}

// ---------- режимы арены ----------
let arenaMode = 'normal', cmBan = -1;
const MODES = {
  normal: { name: 'Обычный', d: 'Награды полностью, предметы за боссов' },
  turbo: { name: 'Turbo', d: 'Враги слабее на 15%, бой быстрее, награда ×0.5, без предметов' },
  cm: { name: 'Captains Mode', d: 'Забань одного врага (кликни по волне) — его заменят крипы. Награда ×0.85' },
  survival: { name: 'Выживание', d: 'Бесконечные волны с ростом силы. Награда за каждую волну, рекорд сохраняется' }
};
function setArenaMode(m) { arenaMode = m; cmBan = -1; renderLevelInfo(); }
function modeDef(def) {
  const d = JSON.parse(JSON.stringify({ L: def.L, waves: def.waves, R: def.R, K: def.K, reward: def.reward, skin: def.skin, eq: def.eq, mechText: def.mechText }));
  d.loc = def.loc;
  counterPickWaves(d, getStack());
  if (arenaMode === 'turbo') { d.waves.forEach(w => w.power = Math.round(w.power * 0.85)); d.reward = Math.round(d.reward * 0.5); d.skin = d.eq = false; d.turbo = true; }
  if (arenaMode === 'cm' && cmBan >= 0 && d.waves[cmBan]) { const w = d.waves[cmBan]; w.power = Math.round(w.power * 0.4); w.name = 'Крипы (бан: ' + w.name + ')'; w.id = 'creeps'; w.boss = false; if (w.mech) { delete w.mech; d.mechText = ''; } d.reward = Math.round(d.reward * 0.85); }
  return d;
}
// 2.4: с 30-го уровня часть врагов (15%→60% к 100-му) подбирается против самой частой роли в твоём стаке.
// Подбор детерминирован (одинаков в подсказке и в бою), сила волны не меняется — меняется только кто.
function counterPickWaves(d, ids) {
  const C = CONFIG.combat; if (!d.L || d.L < C.counterFrom || !ids || !ids.length) return d;
  const cnt = {}; ids.forEach(id => { const r = heroRole(id); cnt[r] = (cnt[r] || 0) + 1; });
  const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
  const want = roleWeakTo(top);
  const pool = HEROES.map(h => h.id).filter(id => want.includes(heroRole(id)));
  if (!pool.length) return d;
  const ch = C.counterChanceMin + (C.counterChanceMax - C.counterChanceMin) * Math.min(1, (d.L - C.counterFrom) / (100 - C.counterFrom));
  const r = seeded(d.L * 4099 + ids.join('').length * 31 + top.length);
  const used = new Set(d.waves.map(w => w.id));
  d.waves.forEach(w => {
    if (w.boss || w.mech || w.id === 'creeps' || r() >= ch) return;
    let id, k = 0; do { id = pool[Math.floor(r() * pool.length)]; } while (used.has(id) && ++k < 20);
    used.add(id); w.id = id; w.name = HERO_BY_ID[id].name; w.counter = true;
  });
  d.counterRole = top;
  return d;
}
function survivalDef() {
  const base = reqPower(Math.max(1, S.arena.cleared)) * 0.5;
  const loc = locOf(Math.min(100, S.arena.cleared + 1));
  const waves = [];
  for (let i = 0; i < 60; i++) { const id = loc.pool[i % loc.pool.length]; if (!HERO_BY_ID[id]) continue; waves.push({ id, power: Math.round(base * Math.pow(1.13, i)), boss: (i + 1) % 10 === 0, name: HERO_BY_ID[id].name + ' · волна ' + (waves.length + 1) }); }
  return { L: 0, loc, waves, R: base, K: 1.5 * 2.2, reward: 0, survival: true };
}

// ---------- РОШАН ----------
function roshanState() {
  const today = todayStr();
  if (!S.roshan || isNewDay(S.roshan.day, today)) {
    const R = CONFIG.roshan, pw = Math.max(R.minPower, Math.round(stackPower() * R.powerMul));
    S.roshan = { day: today, power: pw, pool: pw * R.poolMul, dealt: 0, tries: R.tries, killed: false };
  }
  return S.roshan;
}
function renderRoshan() {
  const box = document.getElementById('roshan-box'); if (!box) return;
  const r = roshanState();
  const left = Math.max(0, 1 - r.dealt / r.pool);
  box.innerHTML = '<div class="rosh"><img class="rosh-img" src="' + spellIcon('roshan_slam') + '" referrerpolicy="no-referrer"><div style="flex:1"><div class="cinzel" style="font-size:1.1rem;color:#fff">Рошан <span class="muted" style="font-size:.75rem;font-family:Roboto Condensed">рейд-босс дня</span></div>' +
    '<div class="rosh-bar"><div style="width:' + (left * 100) + '%"></div><span>' + Math.round(left * 100) + '%</span></div>' +
    '<div class="muted" style="font-size:.78rem">' + (r.killed ? '✓ Повержен сегодня — приходи завтра' : 'Попыток: <b style="color:#fff">' + r.tries + '/3</b> · бой длится 14 ходов, урон копится') + '</div>' +
    '<div style="font-size:.78rem;margin-top:2px">Награда: <img src="' + ITEM_ICON('aegis') + '" class="mini-ic"> Aegis + <img src="' + ITEM_ICON('cheese') + '" class="mini-ic"> Cheese + ' + gemHTML(Math.round(rewardScale() * CONFIG.roshan.rewardMul)) + ' + Immortal</div></div>' +
    '<button class="btn red" ' + (r.killed || r.tries <= 0 || busy.battle ? 'disabled' : '') + ' data-click="fightRoshan()">Атаковать</button></div>';
}
function fightRoshan() {
  const r = roshanState(); if (r.killed || r.tries <= 0 || busy.battle) return;
  r.tries--;
  const hpFrac = 1 - r.dealt / r.pool;
  const def = { L: 0, loc: LOCS[2], waves: [{ id: 'roshan', name: 'Roshan', power: r.power, boss: true, hpMul: 3.2 * hpFrac }], R: r.power, K: 1.6, reward: 0, roshan: true };
  def.waves[0].hpMul = Math.max(0.05, 3.2 * hpFrac);
  startBattle(0, false, def);
}

// ---------- CSS ----------
(function () {
  const st = document.createElement('style');
  st.textContent = `
.talent-tree{margin-top:8px;padding:8px;background:#05070a;border:1px solid var(--line);border-radius:3px}
.tt-title{font-family:Cinzel;color:var(--gold2);font-size:.75rem;letter-spacing:2px;text-align:center;margin-bottom:4px}
.tt-row{display:grid;grid-template-columns:1fr 30px 1fr;gap:4px;margin:3px 0;align-items:center}
.tt-opt b{display:block;font-weight:700;color:inherit}.tt-opt small{display:block;font-size:.6rem;color:#9fd38a;margin-top:2px}
.tt-opt{font-size:.66rem;padding:5px 3px;min-height:44px;border:1px solid #2a333d;background:#11161c;color:var(--muted);border-radius:2px;cursor:pointer;font-family:inherit;line-height:1.1}
.tt-opt:not(:disabled):hover{border-color:var(--gold);color:#fff}
.tt-opt.on{background:linear-gradient(180deg,#4a3a18,#2a200c);color:var(--gold2);border-color:var(--gold)}
.tt-opt.off{opacity:.35}.tt-opt:disabled{cursor:default}
.tt-lvl{text-align:center;font-family:Cinzel;font-weight:700;font-size:.8rem;color:#555;border:1px solid #333;border-radius:50%;width:28px;height:28px;line-height:26px}
.tt-lvl.open{color:var(--gold2);border-color:var(--gold3)}
.arena-extra{display:grid;grid-template-columns:1.2fr 1fr;gap:14px;margin-top:14px}
@media(max-width:980px){.arena-extra{grid-template-columns:1fr}}
.inv6{display:grid;grid-template-columns:repeat(6,1fr);gap:4px}
.islot{aspect-ratio:88/64;background:#05070a;border:1px solid #2a333d;cursor:pointer}
.islot img{width:100%;height:100%;display:block}
.cons-row{display:flex;gap:10px;margin:8px 0}
.cons{display:flex;align-items:center;gap:4px;font-size:.75rem;color:var(--muted)}
.cons img{width:38px;height:28px}
.shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;margin-top:8px}
.shop-item{display:flex;align-items:center;gap:8px;padding:6px;background:#0b0e12;border:1px solid var(--line);border-radius:3px;font-size:.75rem}
.shop-item.on{border-color:var(--green2);box-shadow:0 0 10px rgba(108,197,63,.25)}
.shop-item img{width:52px;height:38px;flex-shrink:0}
.si-t{flex:1}.si-t b{color:#fff}
.syn{font-size:.8rem;padding:4px 0;color:var(--muted)}.syn.on{color:var(--ok)}
.syn img{width:22px;height:22px;vertical-align:-6px;margin-right:2px}
.mode-row{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.rosh{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.rosh-img{width:72px;height:72px;border:2px solid #ff8a3a;border-radius:4px;box-shadow:0 0 18px rgba(255,138,58,.4)}
.rosh-bar{position:relative;height:16px;background:#200;border:1px solid #000;margin:4px 0}
.rosh-bar>div{height:100%;background:linear-gradient(90deg,#8a1d14,#e0452f)}
.rosh-bar span{position:absolute;inset:0;text-align:center;font-size:.7rem;line-height:16px;font-weight:700}
.mini-ic{width:26px;height:19px;vertical-align:-5px}
.wave-strip .w.banned img{filter:grayscale(1);opacity:.4}
.wave-strip .w.cm{cursor:pointer}
.wave-strip .w.cm:hover img{outline:2px solid #fff}
.hcard .tal{position:absolute;top:2px;right:3px;font-size:.7rem;color:var(--gold2);text-shadow:0 0 4px #000}
.hcard .setb{position:absolute;inset:0;border:2px solid #ffd36a;box-shadow:inset 0 0 14px rgba(255,211,106,.5);pointer-events:none}
`;
  document.head.appendChild(st);
})();
