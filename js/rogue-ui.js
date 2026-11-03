// ================= «ПУТЬ ДРЕВНЕГО» — ЭКРАНЫ =================
let rgView = 'start', rgPick = null, rgAbyssSel = 0, rgStartSel = null;
const RG_NODE = { fight: ['⚔', 'Бой'], elite: ['💀', 'Элита'], shop: ['🛒', 'Лавка'], event: ['❓', 'Событие'], rest: ['⛲', 'Фонтан'], chest: ['🎁', 'Сундук'], boss: ['👑', 'Босс'] };

function rgHost() { return document.getElementById('rogue-host'); }
function renderRogue() {
  const host = rgHost(); if (!host) return;
  const R = RS(), run = R.run;
  if (RF && !RF.test) return renderRogueFight();
  if (!run) return renderRogueHub();
  if (run.state === 'fight') { host.innerHTML = '<div class="panel panel-b rg-center"><div class="cinzel">Бой прерван</div><div class="muted">Забег сохранён. Бой начнётся заново с тем же здоровьем.</div><button class="btn green big" data-click="rogueResumeFight()">⚔ Продолжить бой</button></div>'; return; }
  let body = '';
  if (run.state === 'map') body = rgMapHTML(run);
  else if (run.state === 'shop') body = rgShopHTML(run);
  else if (run.state === 'rest') body = rgRestHTML(run);
  else if (run.state === 'event') body = rgEventHTML(run);
  else if (run.state === 'reward') body = rgRewardHTML(run);
  host.innerHTML = rgRunHeader(run) + body + rgInvHTML(run) + '<div class="rg-foot"><button class="btn ghost sm" data-click="rogueAbandon()">🏳 Сдаться</button></div>';
  if (run.state === 'map') rgDrawLinks();
}
function rogueResumeFight() { const run = RS().run; if (!run || run.state !== 'fight') return; run.hp = run.pending.hp0 || run.hp; rogueFight(); }
function rgRunHeader(run) {
  const s = rgStats(run);
  return '<div class="rg-head panel"><div class="rg-hero">' + imgTag(heroImgChain(run.hero)) + '<div><b>' + esc(HERO_BY_ID[run.hero].name) + '</b><div class="muted">Акт ' + (run.act + 1) + '/3 · ' + esc(RG_ACT[run.act].n) + (run.abyss ? ' · Бездна ' + run.abyss : '') + (run.daily ? ' · 📅 ежедневный' : '') + '</div></div></div>' +
    '<div class="rg-bars"><div class="rg-hpbar"><div style="width:' + Math.round(100 * run.hp / s.hp) + '%"></div><span>❤ ' + run.hp + ' / ' + s.hp + '</span></div>' +
    '<div class="rg-stats">⚔ ' + s.atk + ' · 🛡 ' + Math.round(s.armor) + ' · ⚡ ' + Math.round(s.init) + ' · 💥 ' + Math.round(s.crit * 100) + '%' + (s.amp ? ' · ✨ +' + Math.round(s.amp * 100) + '%' : '') + ' · <b class="rg-gold">💰 ' + run.gold + '</b></div></div></div>';
}
function imgTag(chain, cls) { const im = mkImg(chain, '', cls || ''); return im.outerHTML; }

// ---------- карта ----------
function rgMapHTML(run) {
  let h = '<div class="panel panel-b rg-map" id="rg-map"><svg class="rg-links" id="rg-links"></svg>';
  for (let i = run.map.length - 1; i >= 0; i--) {
    h += '<div class="rg-row">';
    run.map[i].forEach((n, j) => {
      const reach = run.row < 0 ? i === 0 : i === run.row + 1 && run.map[run.row][run.col].next.includes(j);
      const done = i < run.row || (i === run.row && j === run.col);
      const cur = i === run.row && j === run.col;
      const N = RG_NODE[n.t];
      h += '<button class="rg-node t-' + n.t + (reach ? ' reach' : '') + (done ? ' done' : '') + (cur ? ' cur' : '') + '" id="rgn-' + i + '-' + j + '" ' + (reach ? 'data-click="rogueGo(' + i + ',' + j + ')"' : 'disabled') + ' title="' + N[1] + '"><span>' + N[0] + '</span><small>' + N[1] + '</small></button>';
    });
    h += '</div>';
  }
  return h + '<div class="muted rg-hint">Выбери следующий узел (подсвечены). Сверху — босс акта.</div></div>';
}
function rgDrawLinks() {
  const run = RS().run, box = document.getElementById('rg-map'), svg = document.getElementById('rg-links'); if (!box || !svg) return;
  const B = box.getBoundingClientRect(); let p = '';
  run.map.forEach((row, i) => row.forEach((n, j) => n.next.forEach(k => {
    const a = document.getElementById('rgn-' + i + '-' + j), b = document.getElementById('rgn-' + (i + 1) + '-' + k); if (!a || !b) return;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const on = i === run.row && j === run.col;
    p += '<line x1="' + (ra.left + ra.width / 2 - B.left) + '" y1="' + (ra.top - B.top) + '" x2="' + (rb.left + rb.width / 2 - B.left) + '" y2="' + (rb.bottom - B.top) + '" class="' + (on ? 'on' : '') + '"/>';
  })));
  svg.setAttribute('width', B.width); svg.setAttribute('height', B.height); svg.innerHTML = p;
}

// ---------- инвентарь и сборка ----------
function rgInvHTML(run) {
  const can = rgBuildable(run), shop = run.state === 'shop';
  let h = '<div class="panel panel-b"><div class="sec-sub">Инвентарь ' + run.items.length + '/6' + (shop ? ' · нажми на предмет, чтобы продать за 50%' : '') + '</div><div class="rg-inv">';
  for (let i = 0; i < 6; i++) {
    const id = run.items[i];
    h += id ? '<button class="rg-slot' + (RG_ITEMS[id] ? ' big' : '') + '" ' + (shop ? 'data-click="rogueSell(' + i + ')"' : 'data-click="rgItemInfo(\'' + id + '\')"') + ' title="' + esc(rgItemName(id)) + '">' + imgTag(rgItemIcon(id)) + '</button>' : '<div class="rg-slot empty"></div>';
  }
  h += '<button class="rg-slot neutral" ' + (run.neutral ? 'data-click="rgItemInfo(\'' + run.neutral + '\')"' : 'disabled') + ' title="Нейтральный слот">' + (run.neutral ? imgTag(rgItemIcon(run.neutral)) : '🌿') + '</button></div>';
  if (can.length) h += '<div class="rg-build">' + can.map(id => '<button class="btn sm gold" data-click="rogueBuild(\'' + id + '\')">🔨 Собрать ' + esc(RG_ITEMS[id][0]) + (RG_ITEMS[id][2] ? ' (' + RG_ITEMS[id][2] + ' 💰)' : '') + '</button>').join('') + '</div>';
  // что можно собрать почти
  const near = Object.keys(RG_ITEMS).map(id => { const have = run.items.slice(); const miss = RG_ITEMS[id][1].filter(c => { const i = have.indexOf(c); if (i < 0) return true; have.splice(i, 1); return false; }); return [id, miss]; }).filter(x => x[1].length && x[1].length < RG_ITEMS[x[0]][1].length).slice(0, 4);
  if (near.length) h += '<div class="muted rg-near">' + near.map(([id, miss]) => '<b>' + esc(RG_ITEMS[id][0]) + '</b>: не хватает ' + miss.map(c => esc(RG_COMP[c][0])).join(', ')).join('<br>') + '</div>';
  const pc = rgPathCounts(run), act = rgActivePaths(run);
  const pk = Object.keys(pc); if (pk.length) h += '<div class="rg-paths">' + pk.map(p => '<span class="rg-path' + (act.includes(p) ? ' on' : '') + '" title="' + esc(RG_PATHS[p].d) + '">' + RG_PATHS[p].i + ' ' + RG_PATHS[p].n + ' ' + pc[p] + '/3</span>').join('') + '</div>';
  h += '<button class="btn ghost sm" data-click="rgRecipes()">📖 Все рецепты</button></div>';
  return h;
}
function rgItemInfo(id) {
  const it = RG_ITEMS[id], c = RG_COMP[id], n = RG_NEUTRAL[id];
  const mods = m => Object.keys(m).map(k => k + ' ' + (m[k] < 1 && m[k] > 0 ? '+' + Math.round(m[k] * 100) + '%' : '+' + m[k])).join(', ');
  if (it) return showModal('🎒', it[0], it[6] + '\nСостав: ' + it[1].map(x => RG_COMP[x][0]).join(' + ') + (it[2] ? ' + рецепт ' + it[2] + ' 💰' : '') + '\nПуть: ' + it[4].map(p => RG_PATHS[p].n).join(', ') + (it[5] ? '\nАктивка: перезарядка ' + it[5].cd + ' хода' : ''), '');
  if (c) return showModal('🎒', c[0], 'Компонент · ' + mods(c[2]) + '\nВходит в: ' + Object.keys(RG_ITEMS).filter(i => RG_ITEMS[i][1].includes(id)).map(i => RG_ITEMS[i][0]).join(', '), '');
  if (n) return showModal('🌿', n[0], 'Нейтральный предмет · ' + n[2], '');
}
function rgRecipes() {
  const h = Object.keys(RG_ITEMS).map(id => { const it = RG_ITEMS[id]; return '<div class="rg-rec">' + imgTag(rgItemIcon(id)) + '<div><b>' + esc(it[0]) + '</b> <span class="muted">' + it[4].map(p => RG_PATHS[p].i).join('') + '</span><div class="muted">' + it[1].map(c => esc(RG_COMP[c][0])).join(' + ') + (it[2] ? ' + ' + it[2] + '💰' : '') + '</div><div>' + esc(it[6]) + '</div></div></div>'; }).join('');
  const paths = Object.keys(RG_PATHS).map(p => '<div>' + RG_PATHS[p].i + ' <b>' + RG_PATHS[p].n + '</b> (3 предмета): ' + esc(RG_PATHS[p].d) + '</div>').join('');
  showModal('📖', 'Рецепты и пути', '<div class="rg-recs">' + paths + '<hr>' + h + '</div>', '', { html: true });
}

// ---------- лавка / фонтан / событие / награда ----------
function rgShopHTML(run) {
  let h = '<div class="panel panel-b"><div class="sec-title">🛒 Лавка</div><div class="rg-shop">';
  run.pending.shop.forEach((s, i) => {
    const p = rgPrice(run, s.c);
    h += '<button class="rg-buy' + (s.sold ? ' sold' : '') + '" ' + (s.sold ? 'disabled' : 'data-click="rogueBuy(' + i + ')"') + '>' + imgTag(rgItemIcon(s.c)) + '<div><b>' + esc(RG_COMP[s.c][0]) + '</b><small>' + rgModsShort(RG_COMP[s.c][2]) + '</small></div><span class="' + (run.gold >= p ? 'rg-gold' : 'muted') + '">' + (s.sold ? '✓' : p + ' 💰') + '</span></button>';
  });
  h += '</div><div class="rg-row2"><button class="btn" ' + (run.pending.potion ? 'disabled' : 'data-click="roguePotion()"') + '>🧪 Зелье +30% ❤ (' + (rgPrice(run, 'ring_of_regen') + 10) + ' 💰)</button><button class="btn green" data-click="rogueLeave()">Дальше ➜</button></div></div>';
  return h;
}
function rgModsShort(m) {
  const N = { atk: '⚔', hp: '❤', init: '⚡', armor: '🛡', crit: '💥', amp: '✨', manaRegen: '🔷', hpRegen: '💚', ls: '🩸', eva: '💨', mres: '🔮', pierce: '🗡', manaStart: '🔷' };
  return Object.keys(m).map(k => (N[k] || k) + (m[k] < 1 ? '+' + Math.round(m[k] * 100) + '%' : '+' + m[k])).join(' ');
}
function rgRestHTML(run) {
  const m = rgStats(run).hp, heal = Math.round(m * ROGUE.restHeal * (1 - rgAbyssSum(run.abyss, 'rest')));
  const sk = getSkills(run.hero).filter(x => x.kind !== 'passive');
  return '<div class="panel panel-b"><div class="sec-title">⛲ Фонтан</div><div class="muted">Отдохни или потренируйся. Выбрать можно что-то одно.</div><div class="rg-choices">' +
    '<button class="rg-choice" data-click="rogueRest(\'heal\',0)"><span>💚</span><b>Восстановить ' + heal + ' ❤</b><small>' + run.hp + ' → ' + Math.min(m, run.hp + heal) + '</small></button>' +
    sk.map((s, i) => (run.skillLv[i] || 0) < ROGUE.maxSkillLv ? '<button class="rg-choice" data-click="rogueRest(\'up\',' + i + ')">' + imgTag(skillIconChain(s.key, run.hero)) + '<b>Улучшить ' + esc(s.name) + '</b><small>ур. ' + (run.skillLv[i] || 0) + ' → ' + ((run.skillLv[i] || 0) + 1) + ': сила +25%' + ((run.skillLv[i] || 0) + 1 === 2 ? ', перезарядка −1' : '') + '</small></button>' : '').join('') + '</div></div>';
}
function rgEventHTML(run) {
  const ev = RG_EVENTS[run.pending.ev];
  return '<div class="panel panel-b rg-event"><div class="sec-title">❓ ' + esc(ev.t) + '</div><p>' + esc(ev.d) + '</p><div class="rg-choices">' +
    ev.c.map((c, i) => '<button class="rg-choice" data-click="rogueEvent(' + i + ')"' + (c.cost && run.gold < c.cost ? ' disabled' : '') + '><b>' + esc(c.t) + '</b>' + (c.ch != null ? '<small>шанс ' + Math.round(c.ch * 100) + '%</small>' : '') + '</button>').join('') + '</div></div>';
}
function rgRewardHTML(run) {
  const P = run.pending, sk = getSkills(run.hero).filter(x => x.kind !== 'passive');
  return '<div class="panel panel-b"><div class="sec-title">🏆 ' + esc(P.title) + '</div>' + (P.neutral ? '<div class="rg-neut">🌿 Нейтральный предмет: <b>' + esc(RG_NEUTRAL[P.neutral][0]) + '</b> — ' + esc(RG_NEUTRAL[P.neutral][2]) + (run.neutral ? ' (заменит ' + esc(rgItemName(run.neutral)) + ')' : '') + '</div>' : '') +
    '<div class="muted">Выбери одну награду:</div><div class="rg-choices">' +
    P.choices.map((c, i) => {
      if (c.up != null) { const s = sk[c.up]; return '<button class="rg-choice" data-click="rogueTake(' + i + ')">' + imgTag(skillIconChain(s.key, run.hero)) + '<b>📈 ' + esc(s.name) + '</b><small>ур. ' + (run.skillLv[c.up] || 0) + ' → ' + ((run.skillLv[c.up] || 0) + 1) + ', сила +25%</small></button>'; }
      const id = c.c || c.it; return '<button class="rg-choice" data-click="rogueTake(' + i + ')">' + imgTag(rgItemIcon(id)) + '<b>' + esc(rgItemName(id)) + '</b><small>' + (c.it ? esc(RG_ITEMS[id][6]) : rgModsShort(RG_COMP[id][2])) + '</small></button>';
    }).join('') + '</div><button class="btn ghost sm" data-click="rogueSkipReward()">Пропустить (+15 💰)</button></div>';
}

// ---------- реплики (сюжет) ----------
function rogueShowLine(title, text, then, win) {
  const host = rgHost(); if (!host) { if (then) then(); return; }
  rgLineThen = then;
  host.innerHTML = '<div class="panel panel-b rg-line' + (win ? ' win' : '') + '"><div class="cinzel rg-line-t">' + esc(title) + '</div><p>' + esc(text).replace(/\n/g, '<br>') + '</p>' +
    (RS().last && !RS().run ? '<button class="btn" data-click="rogueSaveBuild()">💾 Сохранить билд</button>' : '') + '<button class="btn green big" data-click="rgLineNext()">Дальше ➜</button></div>';
}
let rgLineThen = null;
function rgLineNext() { const f = rgLineThen; rgLineThen = null; if (f) f(); else renderRogue(); }

// ---------- главный экран (без забега) ----------
function renderRogueHub() {
  const R = RS(), host = rgHost();
  const pool = rgPool(); if (!rgPick || !pool.includes(rgPick)) rgPick = pool[0];
  const maxAb = R.abyss[rgPick] || 0; if (rgAbyssSel > maxAb) rgAbyssSel = maxAb;
  if (!rgStartSel || !R.starts.includes(rgStartSel)) rgStartSel = R.starts[0];
  const tabs = [['start', '⚔ Забег'], ['builds', '💾 Мои билды'], ['meta', '💠 Осколки'], ['board', '🏆 Рекорды']];
  let h = '<div class="rg-tabs">' + tabs.map(([k, n]) => '<button class="btn sm ' + (rgView === k ? 'gold' : 'ghost') + '" data-click="rgSetView(\'' + k + '\')">' + n + '</button>').join('') + '</div>';
  if (rgView === 'start') {
    const daily = R.daily === todayStr();
    const meta = rogueMetaBonus(rgPick);
    h += '<div class="panel panel-b"><div class="sec-title">Путь Древнего</div><div class="muted">Забег из 3 актов: Лес Radiant → Река и Рошан → Цитадель Dire. Предметы и золото — только на этот забег. Прерванный забег сохранится.</div>' +
      '<div class="sec-sub">Герой (' + pool.length + ' в пуле)</div><div class="rg-heroes">' + pool.map(id => '<button class="rg-hpick' + (id === rgPick ? ' on' : '') + '" data-click="rgSetPick(\'' + id + '\')" title="' + esc(HERO_BY_ID[id].name) + '">' + imgTag(heroImgChain(id)) + '<small>' + esc(HERO_BY_ID[id].name) + (R.abyss[id] ? ' · Б' + R.abyss[id] : '') + '</small></button>').join('') + '</div>' +
      '<div class="rg-skills">' + getSkills(rgPick).map(s => '<div class="rg-sk" title="' + esc(s.desc) + '">' + imgTag(skillIconChain(s.key, rgPick)) + '<small>' + esc(s.name) + '</small></div>').join('') + '</div>' +
      '<div class="muted">Роль: ' + ROLE_NAME[heroRole(rgPick)] + ' · Бонус от прокачки в основной игре: <b>+' + Math.round(meta * 100) + '%</b> (уровень, снаряжение, таланты; максимум +12%)</div>' +
      '<div class="sec-sub">Стартовый предмет</div><div class="rg-starts">' + R.starts.map(c => '<button class="rg-slot' + (c === rgStartSel ? ' on' : '') + '" data-click="rgSetStart(\'' + c + '\')" title="' + esc(RG_COMP[c][0]) + '">' + imgTag(rgItemIcon(c)) + '</button>').join('') + '</div>' +
      '<div class="sec-sub">Уровень Бездны</div><div class="rg-abyss">' + RG_ABYSS.map((a, i) => '<button class="btn sm ' + (i === rgAbyssSel ? 'gold' : 'ghost') + '" ' + (i > maxAb ? 'disabled' : 'data-click="rgSetAbyss(' + i + ')"') + ' title="' + esc(a.d) + '">' + i + '</button>').join('') + '</div>' +
      '<div class="muted">' + (rgAbyssSel ? 'Модификаторы: ' + RG_ABYSS.slice(1, rgAbyssSel + 1).map(a => esc(a.d)).join('; ') : 'Бездна открывается после первой победы этим героем.') + '</div>' +
      '<div class="rg-row2"><button class="btn green big" data-click="rogueStart(false)">⚔ Начать забег</button><button class="btn big" ' + (daily ? 'disabled' : 'data-click="rogueStart(true)"') + '>📅 Ежедневный' + (daily ? ' ✓' : '') + '</button></div>' +
      '<div class="muted" style="font-size:.75rem">Ежедневный забег — одна карта для всех на сегодня, Бездна 0, одна попытка. Награда: до ' + fmt(rogueGemReward(3, true, rgAbyssSel, 1)) + ' 🔶 за победу (3 забега в день — полная награда). Сегодня сыграно: ' + (R.day.d === todayStr() ? R.day.n : 0) + '.</div></div>';
  } else if (rgView === 'builds') {
    h += '<div class="panel panel-b"><div class="sec-title">Мои билды</div>' + (R.builds.length ? R.builds.map((b, i) => '<div class="rg-bld">' + imgTag(heroImgChain(b.hero)) + '<div class="rg-bld-i">' + b.items.concat(b.neutral ? [b.neutral] : []).map(id => imgTag(rgItemIcon(id))).join('') + '</div><div><b>' + (b.win ? '🏆 Победа' : 'Акт ' + (b.acts + 1)) + '</b><small class="muted"> Бездна ' + b.abyss + '</small></div><button class="btn ghost sm" data-click="rogueDelBuild(' + i + ')">✕</button></div>').join('') : '<div class="muted">Пока пусто. После забега нажми «Сохранить билд».</div>') + '</div>' +
      '<div class="panel panel-b"><div class="sec-title">Статистика</div><div class="sec-sub">Герои</div>' + rgStatTable(R.stats.hero, id => HERO_BY_ID[id] ? HERO_BY_ID[id].name : id) + '<div class="sec-sub">Предметы</div>' + rgStatTable(R.stats.item, rgItemName) + '</div>';
  } else if (rgView === 'meta') {
    const others = HEROES.filter(x => !pool.includes(x.id));
    h += '<div class="panel panel-b"><div class="sec-title">💠 Осколки Древнего: ' + R.shards + '</div><div class="muted">Даются за пройденные акты (' + ROGUE.shards.perAct + ') и победы (' + ROGUE.shards.win + ' + ' + ROGUE.shards.abyss + ' за уровень Бездны).</div>' +
      '<div class="sec-sub">Стартовые предметы (' + ROGUE.unlockStart + ' 💠)</div><div class="rg-starts">' + RG_STARTS.map(c => '<button class="rg-slot' + (R.starts.includes(c) ? ' on' : ' locked') + '" ' + (R.starts.includes(c) ? 'disabled' : 'data-click="rogueUnlockStart(\'' + c + '\')"') + ' title="' + esc(RG_COMP[c][0]) + '">' + imgTag(rgItemIcon(c)) + '</button>').join('') + '</div>' +
      '<div class="sec-sub">Новые герои в пул (' + ROGUE.unlockHero + ' 💠)</div><div class="rg-heroes">' + others.map(x => '<button class="rg-hpick locked" data-click="rogueUnlockHero(\'' + x.id + '\')" title="' + esc(x.name) + '">' + imgTag(heroImgChain(x.id)) + '<small>' + esc(x.name) + '</small></button>').join('') + '</div></div>';
  } else if (rgView === 'board') {
    h += '<div class="panel panel-b"><div class="sec-title">📅 Ежедневный забег — ' + todayStr() + '</div><div id="rg-board-d" class="muted">Загрузка…</div></div><div class="panel panel-b"><div class="sec-title">🌀 Бездна — лучшие</div><div id="rg-board-a" class="muted">Загрузка…</div></div>';
    setTimeout(rogueLoadBoards, 0);
  }
  host.innerHTML = h;
}
function rgStatTable(obj, nm) {
  const ks = Object.keys(obj || {}).sort((a, b) => (obj[b].w + obj[b].l) - (obj[a].w + obj[a].l)).slice(0, 15);
  if (!ks.length) return '<div class="muted">Нет данных.</div>';
  return '<table class="rg-tab"><tr><th></th><th>Игр</th><th>Побед</th></tr>' + ks.map(k => { const o = obj[k], n = o.w + o.l; return '<tr><td>' + esc(nm(k)) + '</td><td>' + n + '</td><td>' + Math.round(100 * o.w / n) + '%</td></tr>'; }).join('') + '</table>';
}
function rgSetView(v) { rgView = v; renderRogue(); }
function rgSetPick(id) { rgPick = id; renderRogue(); }
function rgSetAbyss(i) { rgAbyssSel = i; renderRogue(); }
function rgSetStart(c) { rgStartSel = c; renderRogue(); }
function rogueStart(daily) {
  const R = RS(); if (R.run) return renderRogue();
  if (daily && R.daily === todayStr()) return;
  rogueNewRun(rgPick, daily ? 0 : rgAbyssSel, daily, rgStartSel);
}

// ================= ЭКРАН БОЯ =================
function renderRogueFight() {
  const host = rgHost(); if (!host || !RF) return;
  host.innerHTML = '<div class="rg-fight panel ' + (RF.run.act != null ? RG_ACT[RF.run.act || 0].bg : '') + '">' +
    '<div class="rg-queue" id="rg-queue"></div>' +
    '<div class="rg-foes" id="rg-foes"></div>' +
    '<div class="rg-me" id="rg-me"></div>' +
    '<div id="rg-tip"></div>' +
    '<div class="rg-acts" id="rg-acts"></div>' +
    '<div class="rg-ctrl"><button class="btn sm ' + (RF.auto ? 'gold' : 'ghost') + '" data-click="rgToggleAuto()">🤖 Автоход</button>' + [1, 2, 4].map(x => '<button class="btn sm ' + (RF.mult === x ? 'gold' : 'ghost') + '" data-click="rgSetMult(' + x + ')">x' + x + '</button>').join('') + (RF.test ? '' : '<button class="btn sm ghost" data-click="rogueAbandon()">🏳</button>') + '</div>' +
    '<div class="rg-log" id="rg-log"></div></div>';
  rgRenderUnits(); rgRenderQueue(); rgRenderActions(!!RF.wait);
  if (!RF.scrolled) { RF.scrolled = 1; const f = host.querySelector('.rg-fight'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'start' }); }
  RF.log.slice(0, 6).forEach(l => rgLogLine(l[0], l[1], true));
}
function rgUnitHTML(u, i) {
  const st = []; const S2 = u.st;
  if (S2.stun > 0) st.push('💫' + S2.stun); if (S2.silence > 0) st.push('🤐'); if (S2.slow > 0) st.push('🐌'); if (S2.poison.length) st.push('☠'); if (S2.shield > 0) st.push('🛡' + S2.shield);
  if (S2.buff > 0) st.push('⬆'); if (S2.amp > 0) st.push('🔻'); if (S2.bkb > 0) st.push('🟡'); if (S2.dodge > 0) st.push('💨'); if (S2.pet) st.push('👥'); if (S2.illu > 0) st.push('👤');
  const pic = u.hero ? imgTag(heroImgChain(u.id)) : u.img === 'treant' ? imgTag(heroImgChain('treant')) : u.img === 'roshan' ? imgTag([spellIcon('roshan_slam'), ITEM_ICON('aegis')]) : '<span class="rg-emo">' + u.ic + '</span>';
  let intent = '';
  if (!u.hero && u.alive) { const t = rgIntentText(u); intent = '<div class="rg-intent" style="color:' + t.c + '" title="' + t.n + '">' + t.i + (t.v ? ' ' + t.v : '') + '</div>'; }
  return '<div class="rg-unit' + (u.hero ? ' hero' : '') + (u.boss ? ' boss' : '') + (u.alive ? '' : ' dead') + (!u.hero && RF.target === i ? ' tgt' : '') + '" id="' + (u.hero ? 'rgu-h' : 'rgu-' + i) + '" ' + (!u.hero && u.alive ? 'data-click="rgSetTarget(' + i + ')"' : '') + '>' +
    intent + '<div class="rg-pic">' + pic + '</div><div class="rg-nm">' + esc(u.n) + '</div>' +
    '<div class="rg-hp"><div style="width:' + Math.round(100 * u.hp / u.max) + '%"></div><span>' + u.hp + '</span></div>' +
    (u.hero ? '<div class="rg-mp"><div style="width:' + Math.round(u.mana) + '%"></div><span>' + Math.round(u.mana) + '</span></div>' : '') +
    '<div class="rg-st">' + st.join(' ') + '</div></div>';
}
function rgRenderUnits() {
  if (!RF) return;
  const a = document.getElementById('rg-foes'), b = document.getElementById('rg-me'); if (!a || !b) return;
  a.innerHTML = RF.foes.map((f, i) => f.alive || f.boss ? rgUnitHTML(f, i) : '').join('');
  b.innerHTML = rgUnitHTML(RF.hero, -1);
}
function rgRenderQueue() {
  const q = document.getElementById('rg-queue'); if (!q || !RF) return;
  q.innerHTML = '<span class="muted">Ход ' + RF.round + ':</span>' + RF.order.map((u, i) => '<span class="rg-q' + (i === RF.turn ? ' now' : '') + (u.alive ? '' : ' dead') + '">' + (u.hero ? '🙂' : u.ic) + '</span>').join('');
}
function rgRenderActions(on) {
  const box = document.getElementById('rg-acts'); if (!box || !RF) return;
  const h = RF.hero;
  let x = '<button class="rg-act" ' + (on ? 'data-click="rgAct(\'atk\',0)"' : 'disabled') + '><span>⚔</span><b>Атака</b><small>' + h.atk + '</small></button>';
  h.skills.forEach((s, i) => {
    const cd = h.cd[s.key] || 0, mana = rgSkillMana(s), ok = on && rgCanUse(i);
    const lv = RF.run.skillLv ? RF.run.skillLv[i] || 0 : 0;
    x += '<button class="rg-act' + (s.ult ? ' ult' : '') + '" ' + (ok ? 'data-click="rgAct(\'skill\',' + i + ')"' : 'disabled') + ' title="' + esc(s.desc) + '">' + imgTag(skillIconChain(s.key, h.id)) + '<b>' + esc(s.name) + (lv ? ' ' + '★'.repeat(lv) : '') + '</b><small>' + (cd ? '⏳' + cd : '🔷' + mana) + '</small></button>';
  });
  rgItemActives(RF.run).forEach((id, i) => {
    const cd = h.icd[id] || 0, ok = on && rgCanItem(id);
    x += '<button class="rg-act item" ' + (ok ? 'data-click="rgAct(\'item\',' + i + ')"' : 'disabled') + ' title="' + esc(RG_ITEMS[id][6]) + '">' + imgTag(rgItemIcon(id)) + '<b>' + esc(RG_ITEMS[id][0]) + '</b><small>' + (cd ? '⏳' + cd : 'готов') + '</small></button>';
  });
  box.innerHTML = x;
  box.classList.toggle('wait', !!on);
}
function rgToggleAuto() { const R = RS(); R.autoFight = !R.autoFight; if (RF) { RF.auto = R.autoFight; if (RF.auto && RF.wait) RF.wait(rgAutoPick()); } save(); renderRogueFight(); }
function rgSetMult(x) { const R = RS(); R.rgMult = [1, 2, 4].includes(x) ? x : 1; if (RF) RF.mult = R.rgMult; save(); renderRogueFight(); }
function rgLogLine(t, col, noStore) {
  if (RF && !noStore) { RF.log.unshift([t, col]); RF.log.length = Math.min(RF.log.length, 30); }
  const l = document.getElementById('rg-log'); if (!l) return;
  const d = document.createElement('div'); d.textContent = t; if (col) d.style.color = col; if (noStore) l.appendChild(d); else l.prepend(d);
  while (l.children.length > 6) l.lastChild.remove();
}
function rgElOf(u) { if (!RF) return null; return document.getElementById(u.hero ? 'rgu-h' : 'rgu-' + RF.foes.indexOf(u)); }
function rgFloat(u, txt, col, big) {
  rgRenderUnits();
  const el = rgElOf(u); if (!el || SETTINGS.noanim) return;
  const d = document.createElement('div'); d.className = 'rg-float' + (big ? ' big' : ''); d.textContent = txt; d.style.color = col || '#fff';
  d.style.left = (20 + Math.random() * 50) + '%'; el.appendChild(d); setTimeout(() => d.remove(), 900);
}
function rgLunge(u) { const el = rgElOf(u); if (!el || SETTINGS.noanim) return; el.classList.remove('lunge'); void el.offsetWidth; el.classList.add('lunge'); sfx('hit'); }
function rgShake() { const el = document.querySelector('.rg-fight'); if (!el || !motionOK()) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function rgPopSkill(u, s) { const el = rgElOf(u); if (!el || SETTINGS.noanim) return; const d = document.createElement('div'); d.className = 'rg-pop'; d.innerHTML = imgTag(skillIconChain(s.key, u.id)); el.appendChild(d); setTimeout(() => d.remove(), 800); sfx('click'); }
function rgPopItem(u, id) { const el = rgElOf(u); if (!el || SETTINGS.noanim) return; const d = document.createElement('div'); d.className = 'rg-pop'; d.innerHTML = imgTag(rgItemIcon(id)); el.appendChild(d); setTimeout(() => d.remove(), 800); }

// ================= ОНЛАЙН: ежедневный забег и Бездна =================
async function rogueSubmit(res) {
  try {
    const c = typeof cloud === 'function' ? cloud() : null; if (!c || typeof db !== 'function') return;
    const nick = USER.nick;
    if (res.daily) {
      const d = todayStr(), path = 'runs_daily/' + d + '/' + c.uid;
      const old = await db('GET', path);
      if (!old || (old.at || 0) < CONFIG.wipe.at || res.depth > old.d || (res.depth === old.d && res.time < old.t))
        await db('PUT', path, { n: nick, d: res.depth, t: Math.min(86400, res.time), h: res.hero, b: res.items.concat(res.neutral ? [res.neutral] : []).join(',').slice(0, 200), s: res.seed, l: String(res.log).slice(0, ROGUE.dailyLogMax), w: !!res.win, at: SV_TIME });
    }
    if (res.win) {
      const R = RS(), h = {}; for (const k in R.abyss) if (HERO_BY_ID[k]) h[k] = Math.min(10, R.abyss[k] | 0);
      const m = Math.max(0, ...Object.values(h));
      await db('PUT', 'abyss/' + c.uid, { n: nick, m, h, at: SV_TIME });
    }
  } catch (e) { console.warn('rogueSubmit', e); }
}
async function rogueLoadBoards() {
  const a = document.getElementById('rg-board-d'), b = document.getElementById('rg-board-a');
  try {
    const d = await db('GET', 'runs_daily/' + todayStr(), undefined, false, { orderBy: 'd', limitToLast: 30 }) || {};
    const rows = Object.entries(d).filter(([u]) => !LIVE.banned[u]).map(([, x]) => x).filter(x => x && typeof x.d === 'number' && (x.at || 0) >= CONFIG.wipe.at).sort((x, y) => y.d - x.d || x.t - y.t);
    if (a) a.innerHTML = rows.length ? '<table class="rg-tab"><tr><th>#</th><th>Игрок</th><th>Глубина</th><th>Время</th><th>Герой</th></tr>' + rows.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.n) + (x.w ? ' 🏆' : '') + '</td><td>' + x.d + '</td><td>' + Math.floor(x.t / 60) + ':' + String(x.t % 60).padStart(2, '0') + '</td><td>' + esc(HERO_BY_ID[x.h] ? HERO_BY_ID[x.h].name : x.h) + '</td></tr>').join('') + '</table>' : 'Сегодня ещё никто не прошёл ежедневный забег. Будь первым!';
  } catch (e) { if (a) a.textContent = 'Нужен вход онлайн.'; }
  try {
    const d = await db('GET', 'abyss', undefined, false, { orderBy: 'at', startAt: CONFIG.wipe.at, limitToLast: 200 }) || {};
    const rows = Object.entries(d).filter(([u]) => !LIVE.banned[u]).map(([, x]) => x).filter(x => x && typeof x.m === 'number' && (x.at || 0) >= CONFIG.wipe.at).sort((x, y) => y.m - x.m);
    if (b) b.innerHTML = rows.length ? '<table class="rg-tab"><tr><th>#</th><th>Игрок</th><th>Бездна</th><th>Лучшие герои</th></tr>' + rows.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(x.n) + '</td><td>' + x.m + '</td><td>' + Object.keys(x.h || {}).sort((p, q) => x.h[q] - x.h[p]).slice(0, 3).map(k => esc(HERO_BY_ID[k] ? HERO_BY_ID[k].name : k) + ' ' + x.h[k]).join(', ') + '</td></tr>').join('') + '</table>' : 'Пока пусто.';
  } catch (e) { if (b) b.textContent = 'Нужен вход онлайн.'; }
}
