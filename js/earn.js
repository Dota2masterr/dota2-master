// ================= 2.6: ЗАРАБОТОК — мини-игры, Invoker, экспедиции героев =================
// Все награды привязаны к rewardScale() (растёт вместе с ареной, как и цены), поэтому не обесценивают рынок.
// Мини-игры: первые раунды дня платят полностью, дальше меньше (CONFIG.earn.tiers) — а не обрубаются в ноль.
// Экспедиции: герой уходит на 1/4/8 часов и приносит звёздную пыль; слотов немного, значит в день — ограниченно.

// множитель награды за n-й раунд этой игры сегодня
function earnTierMul(n) { for (const [upTo, k] of CONFIG.earn.tiers) if (n <= upTo) return k; return 0; }
function earnRoundsToday(g) { ensureMeta(); S.gameDay = S.gameDay || {}; if (S.gameDay.day !== S.daily.day) S.gameDay = { day: S.daily.day }; return S.gameDay[g] || 0; }
// заменяем старый лимит (15 раундов, потом 0) на убывающую награду
gameRewardOk = function (g) { return earnTierMul(earnRoundsToday(g) + 1) > 0; };
gamePay = (function (orig) {
  return function (g, amount) {
    const n = earnRoundsToday(g) + 1, k = earnTierMul(n);
    if (k <= 0) return 0;
    S.gameDay[g] = n;
    const v = Math.max(1, Math.round(amount * CONFIG.earn.minigameMul * k)); addGems(v); save();
    if (typeof track === 'function') track('gameRounds');
    earnLastNote = k < 1 ? 'сегодня уже ' + n + '-й раунд — награда ×' + k : '';
    return v;
  };
})(gamePay);
let earnLastNote = '';
// подпись под наградой в окне итога мини-игры
gameResult = (function (orig) {
  return function (name, line, g, rec, id) {
    const html = orig(name, line, g, rec, id);
    const n = earnRoundsToday(id), next = earnTierMul(n + 1);
    const tip = '<div class="muted" style="font-size:.78rem;margin-top:4px">Раунд ' + n + ' сегодня' + (earnLastNote ? ' · ' + earnLastNote : '') + ' · следующий: ×' + next + '</div>';
    return html.replace('<button class="btn green"', tip + '<button class="btn green"');
  };
})(gameResult);
function earnGameLine(id) { const n = earnRoundsToday(id), k = earnTierMul(n + 1); return 'Награда сейчас ×' + k + (k < 1 ? ' (сыграно ' + n + ' раз)' : ''); }

// ---------- экспедиции ----------
function expState() { S.exp = (S.exp && typeof S.exp === 'object' && !Array.isArray(S.exp)) ? S.exp : {}; return S.exp; }
function expReward(hid, opt) { const lv = (S.heroes[hid] || { level: 1 }).level; return Math.round(rewardScale() * opt[1] * (1 + Math.min(0.5, lv / 100))); }
function expBusy(hid) { return Object.values(expState()).some(x => x && x.h === hid); }
let expPick = {};
function expSetHero(slot, hid) { expPick[slot] = hid; renderQuests(); }
function expStart(slot, oi) {
  const E = CONFIG.earn.exp, st = expState(), opt = E.opts[oi]; if (!opt || st[slot]) return;
  const hid = expPick[slot];
  if (!HERO_BY_ID[hid] || S.heroes[hid].level < E.minLevel || expBusy(hid)) { showModal('🧭', 'Экспедиция', 'Выбери героя ' + E.minLevel + '+ уровня, который ещё не в экспедиции.', 'ok'); return; }
  const now = nowMs();
  st[slot] = { h: hid, s: now, e: now + opt[0] * 3600000, g: expReward(hid, opt) };
  save(); renderQuests();
}
function expClaim(slot) {
  const st = expState(), x = st[slot]; if (!x || nowMs() < x.e) return;
  const g = Math.max(0, Math.min(Math.round(x.g), Math.round(rewardScale() * 12)));   // защита от подделки
  addGems(g); delete st[slot]; track('expeditions'); save(); renderQuests(); updateTop();
  showModal('🧭', 'Экспедиция вернулась', (HERO_BY_ID[x.h] ? HERO_BY_ID[x.h].name : 'Герой') + ' принёс ' + gemHTML(g), 'ok', { html: true });
}
function expHTML() {
  const E = CONFIG.earn.exp, st = expState(), now = nowMs();
  const heroes = HEROES.filter(h => S.heroes[h.id].level >= E.minLevel).sort((a, b) => S.heroes[b.id].level - S.heroes[a.id].level);
  const fmtLeft = ms => { const m = Math.ceil(ms / 60000); return m >= 60 ? Math.floor(m / 60) + ' ч ' + (m % 60) + ' мин' : m + ' мин'; };
  let html = '<div class="sec-title">🧭 Экспедиции героев <span class="muted" style="font-size:.75rem;letter-spacing:0;font-family:Roboto Condensed;text-transform:none">отправь героя ' + E.minLevel + '+ уровня — он вернётся со звёздной пылью</span></div><div class="exp-grid">';
  for (let i = 0; i < E.slots; i++) {
    const slot = 's' + i, x = st[slot];
    html += '<div class="panel panel-b exp-slot">';
    if (x) {
      const done = now >= x.e, h = HERO_BY_ID[x.h];
      html += '<div class="exp-h"><img src="' + heroImg(x.h) + '" referrerpolicy="no-referrer" alt=""><div><b>' + esc(h ? h.name : x.h) + '</b><div class="muted">' + (done ? 'вернулся!' : 'вернётся через ' + fmtLeft(x.e - now)) + '</div></div></div>' +
        '<div class="xpbar"><div style="width:' + Math.min(100, (now - x.s) / (x.e - x.s) * 100) + '%"></div></div>' +
        '<button class="btn ' + (done ? 'gold' : 'ghost') + ' sm" ' + (done ? '' : 'disabled') + ' data-click="expClaim(\'' + slot + '\')">Забрать ' + gemHTML(x.g) + '</button>';
    } else if (!heroes.length) {
      html += '<div class="muted">Подними любого героя до ' + E.minLevel + ' уровня, чтобы отправлять его в экспедиции.</div>';
    } else {
      const free = heroes.filter(h => !expBusy(h.id));
      const others = Object.keys(expPick).filter(k => k !== slot && !st[k]).map(k => expPick[k]);
      if (!expPick[slot] || expBusy(expPick[slot]) || others.includes(expPick[slot])) { const f = free.find(h => !others.includes(h.id)) || free[0]; expPick[slot] = f && f.id; }
      html += '<div class="muted" style="margin-bottom:6px">Свободный слот</div><select data-change="expSetHero(\'' + slot + '\',this.value)">' + free.map(h => '<option value="' + h.id + '"' + (h.id === expPick[slot] ? ' selected' : '') + '>' + esc(h.name) + ' · ур. ' + S.heroes[h.id].level + '</option>').join('') + '</select>' +
        '<div class="exp-opts">' + E.opts.map((o, oi) => '<button class="btn sm" data-click="expStart(\'' + slot + '\',' + oi + ')">' + o[0] + ' ч → ' + gemHTML(expReward(expPick[slot], o)) + '</button>').join('') + '</div>';
    }
    html += '</div>';
  }
  return html + '</div>';
}
renderQuests = (function (orig) {
  return function () { orig(); const host = document.getElementById('quests-host'); if (host) host.insertAdjacentHTML('beforeend', expHTML()); };
})(renderQuests);
// значок на вкладке «Задания», когда экспедиция вернулась
questBadgeCount = (function (orig) { return function () { const n = orig(); const now = nowMs(); return n + Object.values(expState()).filter(x => x && now >= x.e).length; }; })(questBadgeCount);
setInterval(() => { if (!S) return; if (typeof updateQuestBadge === 'function') updateQuestBadge(); if (currentTab === 'quests' && Object.keys(expState()).length) renderQuests(); }, 60000);
// карточки мини-игр: текущий множитель награды
renderGames = (function (orig) {
  return function () {
    orig();
    document.querySelectorAll('#games-host .home-card[data-click^="startGame_"]').forEach(c => {
      const id = (c.getAttribute('data-click').match(/startGame_\('([^']+)'/) || [])[1]; if (!id || id === 'tower') return;
      const n = earnRoundsToday(id), k = earnTierMul(n + 1);
      c.insertAdjacentHTML('beforeend', '<div class="muted" style="font-size:.74rem;margin-top:4px">💰 ' + (k >= 1 ? 'полная награда' : 'награда ×' + k) + ' · сегодня сыграно ' + n + '</div>');
    });
  };
})(renderGames);
