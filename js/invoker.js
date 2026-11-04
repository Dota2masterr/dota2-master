// ================= INVOKER GAME =================
const INV_SPELLS = [
  { name: 'Cold Snap', orbs: 'QQQ', icon: 'invoker_cold_snap' },
  { name: 'Ghost Walk', orbs: 'QQW', icon: 'invoker_ghost_walk' },
  { name: 'Ice Wall', orbs: 'QQE', icon: 'invoker_ice_wall' },
  { name: 'E.M.P.', orbs: 'WWW', icon: 'invoker_emp' },
  { name: 'Tornado', orbs: 'QWW', icon: 'invoker_tornado' },
  { name: 'Alacrity', orbs: 'WWE', icon: 'invoker_alacrity' },
  { name: 'Sun Strike', orbs: 'EEE', icon: 'invoker_sun_strike' },
  { name: 'Forge Spirit', orbs: 'QEE', icon: 'invoker_forge_spirit' },
  { name: 'Chaos Meteor', orbs: 'WEE', icon: 'invoker_chaos_meteor' },
  { name: 'Deafening Blast', orbs: 'QWE', icon: 'invoker_deafening_blast' }
];
const ORB = { Q: { icon: 'invoker_quas', cls: 'q', name: 'Quas' }, W: { icon: 'invoker_wex', cls: 'w', name: 'Wex' }, E: { icon: 'invoker_exort', cls: 'e', name: 'Exort' } };
let invMode = 'tutorial', invRun = false, invOrbs = [], invIdx = 0, invOk = 0, invMiss = 0, invT0 = 0, invIv = null, invOrder = [], invInvoked = [];
function spellImg(icon, name) { return mkImg([spellIcon(icon), STEAM + 'abilities/' + icon + '.png'], name); }
function invInit() {
  const sb = document.getElementById('skillbar'); sb.innerHTML = '';
  [['Q', ORB.Q.icon, 'Quas'], ['W', ORB.W.icon, 'Wex'], ['E', ORB.E.icon, 'Exort'], ['R', 'invoker_invoke', 'Invoke']].forEach(([k, ic, nm]) => {
    const b = document.createElement('button'); b.className = 'skill';
    b.appendChild(spellImg(ic, nm));
    const s = document.createElement('span'); s.innerHTML = nm + '<br><kbd>' + k + '</kbd>'; b.appendChild(s);
    b.onclick = () => invPress(k);
    sb.appendChild(b);
  });
  const rc = document.getElementById('recipes'); rc.innerHTML = '';
  INV_SPELLS.forEach(sp => {
    const d = document.createElement('div'); d.className = 'recipe';
    const im = spellImg(sp.icon, sp.name); im.className = 'sp'; d.appendChild(im);
    const n = document.createElement('div'); n.innerHTML = '<b>' + sp.name + '</b><div class="muted" style="font-size:.7rem">' + sp.orbs + '</div>'; d.appendChild(n);
    const ob = document.createElement('div'); ob.className = 'ob';
    sp.orbs.split('').forEach(o => ob.appendChild(spellImg(ORB[o].icon, ORB[o].name)));
    d.appendChild(ob); rc.appendChild(d);
  });
  const t = document.getElementById('inv-spell-img'); setImg(t, [spellIcon('invoker_invoke')], 'Invoke');
  invSetMode(invMode);
}
function invRender() { document.getElementById('inv-best').textContent = S.invBest ? S.invBest.toFixed(2) + 's' : '—'; invOrbsRender(); }
function invSetMode(m) {
  if (invRun) return;
  invMode = m;
  ['tutorial', 'race', 'infinite', 'survival'].forEach(x => document.getElementById('im-' + x).classList.toggle('active', x === m));
  invSurvBoard();
}
function invOrbsRender() {
  for (let i = 0; i < 3; i++) {
    const el = document.getElementById('orb' + i); el.innerHTML = ''; el.className = 'orb';
    const o = invOrbs[i];
    if (o) { el.classList.add(ORB[o].cls, 'on'); el.appendChild(spellImg(ORB[o].icon, ORB[o].name)); }
  }
  const iv = document.getElementById('invoked').children;
  for (let i = 0; i < 2; i++) { iv[i].innerHTML = ''; if (invInvoked[i]) iv[i].appendChild(spellImg(invInvoked[i].icon, invInvoked[i].name)); }
}
function invTarget() {
  const sp = invOrder[invIdx];
  const img = document.getElementById('inv-spell-img');
  if (!sp) { document.getElementById('inv-spell-name').textContent = 'Готово!'; return; }
  setImg(img, [spellIcon(sp.icon), STEAM + 'abilities/' + sp.icon + '.png'], sp.name);
  document.getElementById('inv-spell-name').textContent = sp.name;
  document.getElementById('inv-spell-hint').textContent = (invMode === 'tutorial' ? sp.orbs + ' · ' : '') + (invIdx + 1) + '/' + invOrder.length;
  // 2.3: какое заклинание будет следующим
  const nx = invOrder[invIdx + 1], nb = document.getElementById('inv-next');
  if (nb) { nb.innerHTML = ''; if (nx) { nb.appendChild(document.createTextNode('Следующее: ')); const im = spellImg(nx.icon, nx.name); nb.appendChild(im); const b = document.createElement('b'); b.textContent = nx.name + (invMode === 'tutorial' ? ' (' + nx.orbs + ')' : ''); nb.appendChild(b); } }
  img.classList.remove('inv-in'); void img.offsetWidth; img.classList.add('inv-in');
}
// 2.3: анимации — сфера «вспыхивает», удачный каст — вспышка заклинания, ошибка — тряска
function invOrbPop(i) { const el = document.getElementById('orb' + i); if (!el || SETTINGS.noanim) return; el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function invCastFx(sp, ok) {
  const host = document.getElementById('tab-invoker'); if (!host || SETTINGS.noanim) return;
  if (!ok) { const b = document.querySelector('.inv-target') || document.getElementById('inv-spell-img'); if (b) { b.classList.remove('inv-shake'); void b.offsetWidth; b.classList.add('inv-shake'); } return; }
  const fx = document.createElement('div'); fx.className = 'inv-cast ' + (sp.orbs.includes('E') && sp.orbs.split('E').length > 2 ? 'fire' : sp.orbs.split('Q').length > 2 ? 'ice' : 'storm');
  fx.appendChild(spellImg(sp.icon, sp.name)); const t = document.createElement('span'); t.textContent = sp.name; fx.appendChild(t);
  host.style.position = 'relative'; host.appendChild(fx); setTimeout(() => fx.remove(), 800);
}
let invDeadline = 0;
// 2.5.1: рекорд выживания (заклинаний подряд) и таблица лидеров режима прямо во вкладке
function invSurvBest() { return Math.min(400, Math.floor((S && S.gameBest && S.gameBest.invoker) || 0)); }
let invSurvAt = 0, invSurvRows = null;
async function invSurvBoard(force) {
  const box = document.getElementById('inv-surv-board'); if (!box) return;
  box.style.display = invMode === 'survival' ? '' : 'none';
  if (invMode !== 'survival') return;
  const me = invSurvBest();
  const head = '<div class="sec-title" style="margin-top:0">🔮 Таблица выживания</div><div class="muted" style="font-size:.8rem;margin-bottom:6px">Твой рекорд: <b style="color:var(--gold2)">' + (me || '—') + '</b> заклинаний подряд</div>';
  if (typeof cloud !== 'function' || !fbOn() || !cloud()) { box.innerHTML = head + '<div class="muted">Таблица работает после входа в облачный аккаунт (вкладка «Онлайн»).</div>'; return; }
  if (!invSurvRows || force || Date.now() - invSurvAt > 60000) {
    box.innerHTML = head + '<div class="muted">Загружаю…</div>';
    try {
      if (force) await cloudPush();
      const raw = await db('GET', 'board', undefined, false, { orderBy: 'surv', startAt: 1, limitToLast: 50 }) || {};
      invSurvRows = Object.entries(raw).filter(([u, r]) => isObj(r) && r.surv > 0 && (r.at || 0) >= CONFIG.wipe.at && !(typeof LIVE !== 'undefined' && LIVE.banned && LIVE.banned[u]))
        .map(([uid, r]) => ({ uid, nick: String(r.nick || '?').slice(0, 20), title: r.title, surv: Math.floor(num(r.surv, 0, 400, 0)) })).sort((a, b) => b.surv - a.surv);
      invSurvAt = Date.now();
    } catch (e) { box.innerHTML = head + '<div class="auth-err">Не удалось загрузить: ' + esc(e.message) + '</div>'; return; }
  }
  const c = cloud(), top = invSurvRows.slice(0, 20), place = invSurvRows.findIndex(r => r.uid === c.uid);
  box.innerHTML = head + (top.length ? '<table class="board"><tr><th>#</th><th>Игрок</th><th>Заклинаний</th></tr>' + top.map((r, i) => '<tr class="' + (r.uid === c.uid ? 'me' : '') + '"><td>' + (i + 1) + '</td><td>' + esc(r.nick) + titleHTML(r.title) + '</td><td>' + r.surv + '</td></tr>').join('') +
    (place >= 20 ? '<tr class="me"><td>' + (place + 1) + '</td><td>' + esc(USER.nick) + ' (ты)</td><td>' + invSurvRows[place].surv + '</td></tr>' : '') + '</table>' : '<div class="muted">Пока никто не сыграл. Будь первым!</div>') +
    '<button class="btn ghost sm" style="margin-top:6px" data-click="invSurvBoard(true)">🔄 Обновить</button>';
}
function invSurvivalEnd(reason) {
  invStop();
  const n = invOk;
  const g = typeof gamePay === 'function' ? gamePay('invoker', n * rewardScale() * CONFIG.minigames.pay.invoker) : 0;
  const rec = typeof setBest === 'function' ? setBest('invoker', n, true) : false;
  document.getElementById('inv-spell-name').textContent = 'Конец: ' + n;
  document.getElementById('inv-spell-hint').textContent = reason;
  showModal('🔮', 'Выживание: ' + n + ' заклинаний', reason + (rec ? ' · НОВЫЙ РЕКОРД!' : '') + (g ? ' · +' + fmt(g) + ' 🔶' : ''), 'ok');
  if (rec && n >= 20) hype('НИШТЯК');
  if (rec) setTimeout(() => invSurvBoard(true), 600);
}
function invStats() {
  if (invRun && invMode === 'survival') { const left = invDeadline - Date.now(); document.getElementById('inv-spell-hint').textContent = '⏱ ' + Math.max(0, left / 1000).toFixed(1) + 's · ' + invOk; if (left <= 0) return invSurvivalEnd('Не успел!'); }
  document.getElementById('inv-ok').textContent = invOk;
  document.getElementById('inv-miss').textContent = invMiss;
  if (invT0) document.getElementById('inv-timer').textContent = ((Date.now() - invT0) / 1000).toFixed(2);
}
function invStart() {
  if (invRun) return;
  invRun = true; invOk = 0; invMiss = 0; invOrbs = []; invIdx = 0; invInvoked = []; invT0 = Date.now();
  invOrder = INV_SPELLS.slice();
  if (invMode === 'race') invOrder.sort(() => Math.random() - 0.5);
  if (invMode === 'infinite') { invOrder = []; for (let i = 0; i < 30; i++) invOrder.push(pick(INV_SPELLS)); }
  if (invMode === 'survival') { invOrder = []; for (let i = 0; i < 400; i++) invOrder.push(pick(INV_SPELLS)); invDeadline = Date.now() + 4000; }
  invOrbsRender(); invTarget(); invStats();
  clearInterval(invIv); invIv = setInterval(invStats, 50);
  document.getElementById('inv-start').textContent = '▶ Идёт…';
  document.getElementById('inv-feedback').textContent = '';
}
function invStop() { invRun = false; clearInterval(invIv); document.getElementById('inv-start').textContent = '▶ Start'; invStats(); }
function invClear() { invOrbs = []; invOrbsRender(); }
function invPress(k) {
  if (!invRun) return;
  const fb = document.getElementById('inv-feedback');
  if (ORB[k]) { if (invOrbs.length >= 3) invOrbs.shift(); invOrbs.push(k); invOrbsRender(); invOrbPop(invOrbs.length - 1); return; }
  if (k !== 'R') return;
  if (invOrbs.length < 3) { fb.textContent = 'Нужно 3 сферы'; fb.style.color = 'var(--danger)'; return; }
  const sp = invOrder[invIdx]; if (!sp) return;
  const got = invOrbs.slice().sort().join(''), need = sp.orbs.split('').sort().join('');
  const cast = INV_SPELLS.find(x => x.orbs.split('').sort().join('') === got);
  if (cast) { invInvoked = [cast].concat(invInvoked.filter(x => x !== cast)).slice(0, 2); }
  if (got === need) {
    invOk++; invIdx++; invOrbs = []; fb.textContent = '✓ ' + sp.name; fb.style.color = 'var(--ok)'; sfx('hit');   // 2.4: без всплывающей картинки
    if (invMode === 'survival') invDeadline = Date.now() + Math.max(1200, 4000 - invOk * 110);
    if (invIdx >= invOrder.length) {
      invStop();
      const t = (Date.now() - invT0) / 1000;
      let extra = '';
      track('invokerRuns');
      if (invMode === 'infinite') {
        // 2.6: «Бесконечный» — награда за каждое заклинание (по убывающей за день)
        const g = gamePay('invoker_inf', invOk * rewardScale() * CONFIG.earn.invInf); if (g) extra = ' · +' + fmt(g) + ' 🔶'; save();
      } else if (invMode === 'tutorial') {
        extra = ' · обучение без награды';
      } else {
        // 2.6: «Гонка» — чем быстрее и меньше ошибок, тем больше (раньше платила одинаково и без лимита)
        const q = Math.max(0.25, Math.min(1, 1 - invMiss * 0.08 - Math.max(0, t - 15) * 0.02));
        const reward = gamePay('invoker_race', rewardScale() * CONFIG.earn.invRace * q);
        if (reward) extra = ' · +' + fmt(reward) + ' 🔶';
        if (invMode === 'race' && (!S.invBest || t < S.invBest)) { S.invBest = t; extra += ' · НОВЫЙ РЕКОРД!'; hype('НИШТЯК'); }
        save();
      }
      document.getElementById('inv-spell-name').textContent = 'Финиш!';
      document.getElementById('inv-spell-hint').textContent = t.toFixed(2) + 's · ошибок ' + invMiss;
      showModal('🔮', 'Invoker!', 'Время ' + t.toFixed(2) + 's · верно ' + invOk + ' · ошибок ' + invMiss + extra, 'ok');
      invRender();
    } else invTarget();
  } else {
    invMiss++; if (invMode === 'survival') { invOrbs = []; invOrbsRender(); return invSurvivalEnd('Ошибка: нужно ' + sp.name); }
    invOrbs = []; fb.textContent = '✗ ' + (cast ? cast.name : '?') + ' — нужно ' + sp.name + ' (' + sp.orbs + ')'; fb.style.color = 'var(--danger)'; invCastFx(sp, false); sfx('lose');
  }
  invOrbsRender(); invStats();
}
document.addEventListener('keydown', e => {
  if (currentTab !== 'invoker' || !invRun) return;
  const map = { KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R' };
  if (map[e.code]) { e.preventDefault(); invPress(map[e.code]); }
  else if (e.code === 'Backspace') { e.preventDefault(); invClear(); }
});

// ================= BOOT =================
(function boot() {
  // режим для tools/sim.html и tests.html: игра загружается, но без входа и без записи в браузер
  if (/[?&]sim=1/.test(location.search)) { window.SIM_MODE = true; document.getElementById('auth').classList.add('hidden'); return; }
  const ses = lsGet(SES_KEY, null), accs = lsGet(ACC_KEY, {});
  if (ses && accs[ses.key]) login(ses.key, accs[ses.key].nick);
  else showAuth();
})();
