// ================= МИНИ-ИГРЫ =================
function gameRewardOk(g) {
  ensureMeta(); S.gameDay = S.gameDay || {};
  if (S.gameDay.day !== S.daily.day) S.gameDay = { day: S.daily.day };
  return (S.gameDay[g] || 0) < CONFIG.minigames.dailyCap;
}
function gamePay(g, amount) {
  if (!gameRewardOk(g)) return 0;
  S.gameDay[g] = (S.gameDay[g] || 0) + 1;
  const v = Math.round(amount); addGems(v); save(); return v;
}
let curGame = null;
function renderGames() {
  const host = document.getElementById('games-host');
  const games = [
    ['lasthit', '🗡', 'Ластхит', 'Линия с волнами крипов: добивай врагов и денай своих. 45 секунд.'],
    ['hook', '🪝', 'Pudge Hook', 'Попади хуком по бегущему герою. 10 хуков.'],
    ['sunstrike', '☀', 'Sun Strike', 'Предскажи, где будет враг через 1.7 секунды, и попади Sun Strike. 10 кастов.'],
    ['guess', '❓', 'Угадай героя', 'По кусочку портрета или иконке ульты. 10 вопросов.'],
    ['invoker', '🔮', 'Invoker: выживание', 'Таймер всё короче. Ошибся или не успел — конец.'],
    ['tower', '🏰', 'Битва за Башню', 'Карточная стратегия: 50 этажей против ботов и PvP. Лучший этаж: ' + (S.tower ? S.tower.best : 0) + '.']
  ];
  host.innerHTML = '<div class="home-grid" style="margin-top:0">' + games.map(([id, ic, n, d]) => '<div class="panel home-card' + (curGame === id ? ' sel' : '') + '" data-click="startGame_(\'' + id + '\')"><div class="ic">' + ic + '</div><h3>' + n + '</h3><p>' + d + '</p><p class="muted" style="font-size:.72rem;margin-top:4px">Наградных раундов сегодня: ' + Math.max(0, CONFIG.minigames.dailyCap - ((S.gameDay && S.gameDay.day === todayStr() && S.gameDay[id]) || 0)) + '/' + CONFIG.minigames.dailyCap + (S.gameBest && S.gameBest[id] != null ? ' · рекорд ' + S.gameBest[id] : '') + '</p></div>').join('') + '</div><div id="game-stage" class="panel panel-b" style="margin-top:14px;min-height:120px"><div class="muted" style="text-align:center;padding:30px">Выбери мини-игру</div></div>';
}
function setBest(g, v, higherBetter) {
  S.gameBest = S.gameBest || {};
  const cur = S.gameBest[g];
  if (cur == null || (higherBetter ? v > cur : v < cur)) { S.gameBest[g] = v; save(); return true; }
  return false;
}
function startGame_(id) {
  stopGames(); curGame = id;
  if (id === 'invoker') { switchTab('invoker'); invSetMode('survival'); invStart(); return; }
  if (id === 'tower') { renderGames(); document.getElementById('game-stage').innerHTML = '<div id="tower-menu"></div>'; renderTowerMenu(); return; }
  renderGames();
  ({ lasthit: lhStart, hook: hookStart, guess: guessStart, sunstrike: ssStart })[id]();
}
let gTimers = [];
function stopGames() { if (typeof TB !== 'undefined' && TB) { if (TB.online && !TB.done) twLiveLeave(); twStop(); } gTimers.forEach(t => { clearInterval(t); clearTimeout(t); cancelAnimationFrame(t); }); gTimers = []; document.onkeydown_game = null; }

// ---------- ЛАСТХИТ (2.3: настоящая линия) ----------
// На линии сходятся волны крипов. Свои крипы бьют чужих и наоборот. Добей вражеского крипа (золото) или
// добей своего, когда у него меньше половины HP (денай). Твой удар летит 0.4 с, перезарядка атаки 1 с. Раунд — 45 секунд.
let LH = null;
function lhStart() {
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div class="lh2"><div class="lh-info"><span>⏱ <b id="lh-t">45</b></span> · ластхиты <b id="lh-hits" style="color:var(--ok)">0</b> · денаи <b id="lh-den" style="color:#7ad3ff">0</b> · упущено <b id="lh-miss" style="color:var(--danger)">0</b></div>' +
    '<canvas id="lh-cv" width="720" height="300"></canvas><div class="muted" style="text-align:center;font-size:.78rem">Нажми на крипа — герой ударит (урон <b id="lh-dmg"></b>). Вражеский крип — ластхит 💰, свой с HP меньше половины — денай.</div></div>';
  const cv = document.getElementById('lh-cv'), ctx = cv.getContext('2d');
  const hero = new Image(); hero.referrerPolicy = 'no-referrer'; hero.src = STEAM + 'heroes/' + (S.mainHero || 'juggernaut') + '.png';
  LH = { t0: performance.now(), dur: 45000, hits: 0, denies: 0, miss: 0, cd: 0, dmg: 55 + Math.floor(Math.random() * 10), creeps: [], shots: [], fx: [], nextWave: 0, ctx, cv, hero, id: 1 };
  document.getElementById('lh-dmg').textContent = LH.dmg;
  cv.onclick = e => {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
    const c = LH.creeps.filter(c => c.hp > 0).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0];
    if (!c || Math.hypot(c.x - x, c.y - y) > 40) return;
    if (LH.cd > 0) { LH.fx.push({ x: 360, y: 270, t: 'перезарядка', c: '#aaa', life: 30 }); return; }
    if (c.side === 0 && c.hp > c.max * 0.5) { LH.fx.push({ x: c.x, y: c.y - 30, t: 'нельзя денаить', c: '#aaa', life: 30 }); return; }
    LH.cd = 1000; LH.shots.push({ x: 360, y: 270, to: c.id, t: 0 }); sfx('hit');
  };
  let last = performance.now();
  const loop = now => {
    if (!LH || !document.getElementById('lh-cv')) return;
    const dt = Math.min(50, now - last); last = now;
    const el = now - LH.t0, left = Math.max(0, LH.dur - el);
    document.getElementById('lh-t').textContent = Math.ceil(left / 1000);
    if (left <= 0) return lhEnd();
    LH.cd = Math.max(0, LH.cd - dt);
    // волны: каждые 9 секунд по 4 крипа с каждой стороны
    if (el >= LH.nextWave) { LH.nextWave += 9000; for (let s = 0; s < 2; s++) for (let i = 0; i < 4; i++) LH.creeps.push({ id: LH.id++, side: s, x: s === 0 ? -20 - i * 34 : 740 + i * 34, y: 130 + (i % 2) * 26, hp: i === 3 ? 300 : 420, max: i === 3 ? 300 : 420, rng: i === 3, cd: 600 + Math.random() * 600 }); }
    // движение и драка крипов
    LH.creeps.forEach(c => {
      if (c.hp <= 0) return;
      const foes = LH.creeps.filter(o => o.hp > 0 && o.side !== c.side);
      const tgt = foes.sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
      const reach = c.rng ? 140 : 40;
      if (tgt && Math.abs(tgt.x - c.x) <= reach) { c.cd -= dt; if (c.cd <= 0) { c.cd = 1000 + Math.random() * 300; const d = (c.rng ? 22 : 19) + Math.random() * 10; tgt.hp -= d; if (tgt.hp <= 0) { tgt.hp = 0; tgt.dieT = 30; if (tgt.side === 1) { LH.miss++; LH.fx.push({ x: tgt.x, y: tgt.y - 30, t: 'упущен', c: '#ff7a6a', life: 30 }); } } } }
      else c.x += (c.side === 0 ? 1 : -1) * 0.05 * dt;
    });
    // снаряды героя
    LH.shots = LH.shots.filter(sh => {
      const c = LH.creeps.find(x => x.id === sh.to); sh.t += dt;
      if (!c || c.hp <= 0) return false;
      if (sh.t < 400) { const k = sh.t / 400; sh.cx = 360 + (c.x - 360) * k; sh.cy = 270 + (c.y - 270) * k; return true; }
      c.hp -= LH.dmg;
      if (c.hp <= 0) { c.hp = 0; c.dieT = 30; if (c.side === 1) { LH.hits++; LH.fx.push({ x: c.x, y: c.y - 30, t: '+💰', c: '#ffd36a', life: 40 }); sfx('coin'); } else { LH.denies++; LH.fx.push({ x: c.x, y: c.y - 30, t: '!', c: '#7ad3ff', life: 40 }); sfx('coin'); } }
      return false;
    });
    LH.creeps = LH.creeps.filter(c => c.hp > 0 || (c.dieT = (c.dieT || 0) - 1) > 0);
    lhDraw();
    document.getElementById('lh-hits').textContent = LH.hits; document.getElementById('lh-den').textContent = LH.denies; document.getElementById('lh-miss').textContent = LH.miss;
    LH.raf = requestAnimationFrame(loop); gTimers.push(LH.raf);
  };
  LH.raf = requestAnimationFrame(loop); gTimers.push(LH.raf);
}
function lhDraw() {
  const { ctx } = LH;
  const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#1d2c16'); g.addColorStop(1, '#14200f'); ctx.fillStyle = g; ctx.fillRect(0, 0, 720, 300);
  ctx.fillStyle = '#5e4f33'; ctx.fillRect(0, 105, 720, 80);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < 24; i++) ctx.fillRect((i * 37) % 720, 110 + (i * 13) % 70, 14, 4);
  for (const [x, y] of [[40, 40], [120, 30], [600, 35], [680, 50], [60, 250], [650, 255]]) { ctx.fillStyle = '#0f3a12'; ctx.beginPath(); ctx.arc(x, y, 22, 0, 6.3); ctx.fill(); ctx.fillStyle = '#185418'; ctx.beginPath(); ctx.arc(x - 6, y - 6, 12, 0, 6.3); ctx.fill(); }
  LH.creeps.forEach(c => {
    ctx.globalAlpha = c.hp > 0 ? 1 : Math.max(0, c.dieT / 30);
    ctx.fillStyle = c.side === 0 ? '#3f8f3a' : '#a0392a'; ctx.beginPath(); ctx.arc(c.x, c.y, c.rng ? 11 : 14, 0, 6.3); ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.rng ? '🏹' : '🗡', c.x, c.y + 1);
    if (c.hp > 0) { ctx.fillStyle = '#000'; ctx.fillRect(c.x - 18, c.y - 26, 36, 6); ctx.fillStyle = c.side === 0 ? '#6cc53f' : '#e0452f'; ctx.fillRect(c.x - 18, c.y - 26, 36 * c.hp / c.max, 6);
      if (c.side === 1 && c.hp <= LH.dmg) { ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(c.x, c.y, 19, 0, 6.3); ctx.stroke(); } }
    ctx.globalAlpha = 1;
  });
  // герой
  ctx.save(); ctx.beginPath(); ctx.arc(360, 270, 26, 0, 6.3); ctx.clip(); try { ctx.drawImage(LH.hero, 320, 244, 80, 52); } catch (e) { } ctx.restore();
  ctx.strokeStyle = LH.cd > 0 ? '#555' : '#ffd36a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(360, 270, 27, -1.57, -1.57 + 6.28 * (1 - LH.cd / 1000)); ctx.stroke();
  LH.shots.forEach(sh => { if (sh.cx == null) return; ctx.fillStyle = '#ffd36a'; ctx.beginPath(); ctx.arc(sh.cx, sh.cy, 5, 0, 6.3); ctx.fill(); });
  LH.fx = LH.fx.filter(f => { f.life--; ctx.globalAlpha = Math.min(1, f.life / 15); ctx.fillStyle = f.c; ctx.font = 'bold 16px sans-serif'; ctx.fillText(f.t, f.x, f.y - (40 - f.life) * 0.6); ctx.globalAlpha = 1; return f.life > 0; });
}
function lhEnd() {
  const n = LH.hits + Math.floor(LH.denies / 2);
  const g = gamePay('lasthit', Math.min(10, n) * rewardScale() * CONFIG.minigames.pay.lasthit);
  const rec = setBest('lasthit', n, true);
  const line = LH.hits + ' ластхитов · ' + LH.denies + ' денаев · упущено ' + LH.miss;
  cancelAnimationFrame(LH.raf); LH = null;
  document.getElementById('game-stage').innerHTML = gameResult('Ластхит', line, g, rec, 'lasthit');
  if (n >= 15) hype('НИШТЯК');
}
function floatGame(t, col) {
  const st = document.getElementById('game-stage'); if (!st) return;
  const d = document.createElement('div'); d.className = 'dmg'; d.style.cssText = 'position:absolute;left:50%;top:40%;color:' + col; d.textContent = t;
  st.style.position = 'relative'; st.appendChild(d); setTimeout(() => d.remove(), 900);
}
function gameResult(name, line, g, rec, id) {
  return '<div style="text-align:center;padding:16px"><div class="cinzel" style="font-size:1.4rem;color:var(--gold2)">' + name + '</div><div style="font-size:1.1rem;margin:8px 0">' + line + (rec ? ' · <b style="color:var(--ok)">НОВЫЙ РЕКОРД</b>' : '') + '</div><div>' + (g ? '+' + gemHTML(g) : '<span class="muted">Лимит наград на сегодня исчерпан</span>') + '</div><button class="btn green" style="margin-top:12px" data-click="startGame_(\'' + id + '\')">Ещё раз</button></div>';
}

// ---------- PUDGE HOOK ----------
let HK = null;
function hookStart() {
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div class="muted" style="text-align:center;margin-bottom:6px">Кликни по полю — Pudge бросит хук в эту точку. Цель бежит! Хуков: <b id="hk-left" style="color:#fff">10</b> · попаданий: <b id="hk-hit" style="color:var(--ok)">0</b></div><canvas id="hk-cv" width="760" height="360" style="width:100%;max-width:760px;display:block;margin:0 auto;border:1px solid #000;border-radius:4px;cursor:crosshair"></canvas>';
  const cv = document.getElementById('hk-cv'), ctx = cv.getContext('2d');
  const pudge = new Image(); pudge.referrerPolicy = 'no-referrer'; pudge.src = STEAM + 'heroes/pudge.png';
  const tgtId = pick(['antimage', 'phantom_assassin', 'juggernaut', 'storm_spirit', 'slark', 'invoker', 'lina', 'riki']);
  const tgt = new Image(); tgt.referrerPolicy = 'no-referrer'; tgt.src = STEAM + 'heroes/' + tgtId + '.png';
  HK = { left: 10, hit: 0, hook: null, t: { x: 100, y: 120, vx: 3.2, vy: 1.4 }, ctx, cv, pudge, tgt, msg: '', msgT: 0 };
  cv.onclick = e => {
    if (!HK || HK.hook || HK.left <= 0) return;
    const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
    const ox = 380, oy = 330; const d = Math.hypot(x - ox, y - oy) || 1;
    HK.hook = { x: ox, y: oy, dx: (x - ox) / d, dy: (y - oy) / d, dist: 0, max: 420, back: false };
    HK.left--; document.getElementById('hk-left').textContent = HK.left; sfx('hit');
  };
  const loop = () => {
    if (!HK) return;
    const { ctx, t } = HK;
    // движение цели со сменой направления
    t.x += t.vx; t.y += t.vy;
    if (Math.random() < 0.02) { t.vx = (Math.random() < 0.5 ? -1 : 1) * (2.5 + Math.random() * 2.5); t.vy = (Math.random() - 0.5) * 3; }
    if (t.x < 40 || t.x > 720) t.vx *= -1; if (t.y < 30 || t.y > 220) t.vy *= -1;
    t.x = Math.max(40, Math.min(720, t.x)); t.y = Math.max(30, Math.min(220, t.y));
    hookBg(ctx, HK.bgT = (HK.bgT || 0) + 1);
    // цель: портрет в кружке с тенью и красной обводкой
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(t.x, t.y + 26, 30, 8, 0, 0, 6.3); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(t.x, t.y, 24, 0, 6.3); ctx.clip(); try { ctx.drawImage(HK.tgt, t.x - 42, t.y - 24, 84, 48); } catch (e) { } ctx.restore();
    ctx.strokeStyle = '#d0402e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(t.x, t.y, 25, 0, 6.3); ctx.stroke();
    hookPudge(ctx, HK);
    const h = HK.hook;
    if (h) {
      const sp = 11;
      if (!h.back) { h.dist += sp; h.x += h.dx * sp; h.y += h.dy * sp; if (Math.abs(h.x - t.x) < 40 && Math.abs(h.y - t.y) < 24) { h.back = true; h.caught = true; HK.hit++; document.getElementById('hk-hit').textContent = HK.hit; HK.msg = 'GET OVER HERE!'; HK.msgT = 50; sfx('coin'); } else if (h.dist > h.max) h.back = true; }
      else { h.dist -= sp; h.x -= h.dx * sp; h.y -= h.dy * sp; if (h.caught) { t.x = h.x; t.y = h.y; } if (h.dist <= 0) { HK.hook = null; if (h.caught) { t.x = 100 + Math.random() * 560; t.y = 60 + Math.random() * 120; } if (HK.left <= 0) return hookEnd(); } }
      hookChain(ctx, 380, 318, h.x, h.y);
    } else if (HK.left <= 0) return hookEnd();
    if (HK.msgT > 0) { HK.msgT--; ctx.fillStyle = '#ffd36a'; ctx.font = 'bold 30px Cinzel, serif'; ctx.textAlign = 'center'; ctx.fillText(HK.msg, 380, 60); }
    HK.raf = requestAnimationFrame(loop); gTimers.push(HK.raf);
  };
  loop();
}
function hookEnd() {
  const hits = HK.hit; HK = null;
  const g = gamePay('hook', hits * rewardScale() * CONFIG.minigames.pay.hook);
  const rec = setBest('hook', hits, true);
  document.getElementById('game-stage').innerHTML = gameResult('Pudge Hook', hits + '/10 попаданий', g, rec, 'hook');
  if (hits >= 8) { hype('НИШТЯК'); announce('Fresh meat!', { pitch: 0.3, rate: 0.8 }); }
}

// 2.3: фон — река, трава, деревья, камни (рисуется один раз в отдельный холст)
let HOOK_BG = null;
function hookBg(ctx, t) {
  if (!HOOK_BG) {
    const c = document.createElement('canvas'); c.width = 760; c.height = 360; const g = c.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, '#22361a'); gr.addColorStop(1, '#16260f'); g.fillStyle = gr; g.fillRect(0, 0, 760, 360);
    for (let i = 0; i < 260; i++) { g.fillStyle = i % 2 ? 'rgba(80,120,40,.25)' : 'rgba(10,30,5,.3)'; g.fillRect((i * 97) % 760, (i * 53) % 360, 3, 6); }
    // река по диагонали
    g.fillStyle = '#18435e'; g.beginPath(); g.moveTo(0, 230); g.bezierCurveTo(200, 200, 520, 290, 760, 250); g.lineTo(760, 300); g.bezierCurveTo(520, 340, 200, 250, 0, 285); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(160,220,255,.25)'; g.lineWidth = 2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(0, 245 + k * 10); g.bezierCurveTo(200, 215 + k * 10, 520, 305 + k * 8, 760, 262 + k * 9); g.stroke(); }
    // камни и деревья
    [[60, 60], [700, 40], [150, 330], [640, 330], [30, 180], [735, 160]].forEach(([x, y]) => { g.fillStyle = '#0d2e10'; g.beginPath(); g.arc(x, y, 26, 0, 6.3); g.fill(); g.fillStyle = '#16481a'; g.beginPath(); g.arc(x - 7, y - 8, 15, 0, 6.3); g.fill(); g.fillStyle = '#3a2a18'; g.fillRect(x - 3, y + 18, 6, 12); });
    [[250, 40], [500, 70], [420, 320]].forEach(([x, y]) => { g.fillStyle = '#4a4a4a'; g.beginPath(); g.ellipse(x, y, 20, 12, 0.3, 0, 6.3); g.fill(); g.fillStyle = '#6a6a6a'; g.beginPath(); g.ellipse(x - 4, y - 4, 10, 6, 0.3, 0, 6.3); g.fill(); });
    HOOK_BG = c;
  }
  ctx.drawImage(HOOK_BG, 0, 0);
}
// модель Pudge: тело, тесак и портрет в кружке
function hookPudge(ctx, HK) {
  const x = 380, y = 322;
  ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.beginPath(); ctx.ellipse(x, y + 30, 44, 10, 0, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#6b8a4a'; ctx.beginPath(); ctx.ellipse(x, y + 8, 40, 28, 0, 0, 6.3); ctx.fill();
  ctx.strokeStyle = '#2a3a1a'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = '#9a3a2a'; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * 14 - 6, y - 4); ctx.lineTo(x + i * 14 + 6, y + 20); ctx.stroke(); }
  // тесак
  ctx.fillStyle = '#9aa4ad'; ctx.beginPath(); ctx.moveTo(x + 36, y - 4); ctx.lineTo(x + 62, y - 18); ctx.lineTo(x + 66, y + 4); ctx.lineTo(x + 42, y + 10); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#333'; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y - 18, 20, 0, 6.3); ctx.clip(); try { ctx.drawImage(HK.pudge, x - 36, y - 38, 72, 40); } catch (e) { } ctx.restore();
  ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y - 18, 21, 0, 6.3); ctx.stroke();
}
// цепь из звеньев и крюк
function hookChain(ctx, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx), n = Math.floor(d / 9);
  for (let i = 0; i < n; i++) { const k = i / n; ctx.save(); ctx.translate(x0 + dx * k, y0 + dy * k); ctx.rotate(ang + (i % 2 ? Math.PI / 2 : 0)); ctx.strokeStyle = i % 2 ? '#8a939b' : '#c0c8cf'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3, 0, 0, 6.3); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.translate(x1, y1); ctx.rotate(ang);
  ctx.strokeStyle = '#dfe6ec'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(8, 0); ctx.arc(8, 9, 9, -1.57, 1.9); ctx.stroke();
  ctx.fillStyle = '#dfe6ec'; ctx.beginPath(); ctx.moveTo(2, 15); ctx.lineTo(-4, 12); ctx.lineTo(4, 9); ctx.fill();
  ctx.restore();
}

// ---------- SUN STRIKE (2.3) ----------
// Удар падает через 1.7 с после нажатия — нужно бить туда, куда враг прибежит.
let SS = null;
function ssStart() {
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div class="muted" style="text-align:center;margin-bottom:6px">Нажми на поле — через 1.7 с туда ударит Sun Strike. Кастов: <b id="ss-left" style="color:#fff">10</b> · попаданий: <b id="ss-hit" style="color:var(--ok)">0</b></div><canvas id="ss-cv" width="760" height="360" style="width:100%;max-width:760px;display:block;margin:0 auto;border:1px solid #000;border-radius:4px;cursor:crosshair;touch-action:manipulation"></canvas>';
  const cv = document.getElementById('ss-cv'), ctx = cv.getContext('2d');
  const ids = HEROES.map(h => h.id).sort(() => Math.random() - 0.5).slice(0, 3);
  const mk = id => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.src = STEAM + 'heroes/' + id + '.png'; return { id, im, x: 80 + Math.random() * 600, y: 60 + Math.random() * 240, vx: 0, vy: 0, turn: 0, dead: 0 }; };
  SS = { left: 10, hit: 0, casts: [], foes: ids.map(mk), fx: [], ctx, cv, last: performance.now() };
  cv.onclick = e => {
    if (!SS || SS.left <= 0) return;
    const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) * cv.width / r.width, y = (e.clientY - r.top) * cv.height / r.height;
    SS.left--; document.getElementById('ss-left').textContent = SS.left;
    SS.casts.push({ x, y, t: 0 }); sfx('click');
  };
  const loop = now => {
    if (!SS || !document.getElementById('ss-cv')) return;
    const dt = Math.min(50, now - SS.last); SS.last = now;
    SS.foes.forEach(f => {
      if (f.dead > 0) { f.dead -= dt; if (f.dead <= 0) { f.x = 80 + Math.random() * 600; f.y = 60 + Math.random() * 240; } return; }
      f.turn -= dt; if (f.turn <= 0) { f.turn = 600 + Math.random() * 1400; const a = Math.random() * 6.283, sp = 0.06 + Math.random() * 0.1; f.vx = Math.cos(a) * sp; f.vy = Math.sin(a) * sp; }
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.x < 30 || f.x > 730) { f.vx *= -1; f.x = Math.max(30, Math.min(730, f.x)); } if (f.y < 30 || f.y > 330) { f.vy *= -1; f.y = Math.max(30, Math.min(330, f.y)); }
    });
    SS.casts = SS.casts.filter(c => {
      c.t += dt;
      if (c.t >= 1700 && !c.done) {
        c.done = true; let got = 0;
        SS.foes.forEach(f => { if (f.dead <= 0 && Math.hypot(f.x - c.x, f.y - c.y) < 48) { f.dead = 1200; got++; } });
        if (got) { SS.hit += got; document.getElementById('ss-hit').textContent = SS.hit; SS.fx.push({ x: c.x, y: c.y - 40, t: got > 1 ? 'ДВОЙНОЙ!' : 'ПОПАЛ!', life: 50 }); sfx('coin'); } else sfx('lose');
      }
      return c.t < 2100;
    });
    ssDraw(now);
    if (SS.left <= 0 && !SS.casts.length) return ssEnd();
    SS.raf = requestAnimationFrame(loop); gTimers.push(SS.raf);
  };
  SS.raf = requestAnimationFrame(loop); gTimers.push(SS.raf);
}
function ssDraw(now) {
  const { ctx } = SS;
  hookBg(ctx);
  SS.foes.forEach(f => {
    if (f.dead > 0) { ctx.globalAlpha = 0.3; }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x, f.y + 24, 26, 7, 0, 0, 6.3); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(f.x, f.y, 22, 0, 6.3); ctx.clip(); try { ctx.drawImage(f.im, f.x - 38, f.y - 22, 76, 44); } catch (e) { } ctx.restore();
    ctx.strokeStyle = '#d0402e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(f.x, f.y, 23, 0, 6.3); ctx.stroke();
    ctx.globalAlpha = 1;
  });
  SS.casts.forEach(c => {
    if (c.t < 1700) { const k = c.t / 1700; ctx.strokeStyle = 'rgba(255,200,60,' + (0.4 + k * 0.6) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, 48, 0, 6.3); ctx.stroke(); ctx.fillStyle = 'rgba(255,180,40,' + k * 0.35 + ')'; ctx.beginPath(); ctx.arc(c.x, c.y, 48 * k, 0, 6.3); ctx.fill(); }
    else { const k = 1 - (c.t - 1700) / 400; const g = ctx.createLinearGradient(c.x, 0, c.x, c.y); g.addColorStop(0, 'rgba(255,255,220,0)'); g.addColorStop(1, 'rgba(255,230,120,' + k + ')'); ctx.fillStyle = g; ctx.fillRect(c.x - 30, 0, 60, c.y); ctx.fillStyle = 'rgba(255,200,60,' + k + ')'; ctx.beginPath(); ctx.arc(c.x, c.y, 52, 0, 6.3); ctx.fill(); }
  });
  SS.fx = SS.fx.filter(f => { f.life--; ctx.fillStyle = '#ffd36a'; ctx.font = 'bold 24px Cinzel, serif'; ctx.textAlign = 'center'; ctx.globalAlpha = Math.min(1, f.life / 20); ctx.fillText(f.t, f.x, f.y - (50 - f.life) * 0.5); ctx.globalAlpha = 1; return f.life > 0; });
}
function ssEnd() {
  const hits = SS.hit; cancelAnimationFrame(SS.raf); SS = null;
  const g = gamePay('sunstrike', Math.min(10, hits) * rewardScale() * CONFIG.minigames.pay.sunstrike);
  const rec = setBest('sunstrike', hits, true);
  document.getElementById('game-stage').innerHTML = gameResult('Sun Strike', hits + '/10 попаданий', g, rec, 'sunstrike');
  if (hits >= 7) { hype('НИШТЯК'); }
}

// ---------- УГАДАЙ ГЕРОЯ ----------
let GS = null;
// 2.2: вместо чёрного силуэта (по нему было не угадать) — «фрагмент»: сильно увеличенный кусок портрета,
// размытие и увеличение уменьшаются со временем. Герои не повторяются, сломанная картинка — новый вопрос без штрафа.
function guessStart() { GS = { n: 0, ok: 0, used: new Set(), skips: 0, tok: 0 }; guessNext(); }
function guessNext() {
  if (curGame !== 'guess' || !document.getElementById('game-stage') || !GS) return;
  if (GS.n >= 10) return guessEnd();
  const pool = HEROES.filter(h => !GS.used.has(h.id));
  const ans = pick(pool.length ? pool : HEROES); GS.used.add(ans.id);
  const opts = [ans]; while (opts.length < 4) { const h = pick(HEROES); if (!opts.includes(h)) opts.push(h); }
  opts.sort(() => Math.random() - 0.5);
  const mode = Math.random() < 0.5 ? 'frag' : 'ult';
  const tok = ++GS.tok; GS.cur = ans.id; GS.answered = false;
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div style="text-align:center"><div class="muted">Вопрос ' + (GS.n + 1) + '/10 · верно ' + GS.ok + ' · ' + (mode === 'ult' ? 'Чья это ульта?' : 'Чей это портрет? Картинка проясняется со временем') + '</div><div id="gs-pic" class="gs-pic ' + mode + '"></div><div class="gs-opts">' +
    opts.map(h => '<button class="btn" data-click="guessPick(\'' + h.id + '\')">' + esc(h.name) + '</button>').join('') + '</div></div>';
  const pic = document.getElementById('gs-pic');
  const img = mkImg(mode === 'ult' ? ultIconChain(ans.id) : heroTallChain(ans.id), '?');
  if (mode === 'frag') { GS.ox = 15 + Math.random() * 70; GS.oy = 10 + Math.random() * 50; img.style.transformOrigin = GS.ox + '% ' + GS.oy + '%'; img.style.transform = 'scale(3.2)'; img.style.filter = 'blur(6px)'; }
  const fail = () => { if (tok !== GS.tok || GS.answered) return; GS.skips++; if (GS.skips > 15) { document.getElementById('game-stage').innerHTML = '<div class="muted" style="text-align:center;padding:20px">Картинки героев не загружаются — проверь интернет и попробуй ещё раз.</div>'; GS = null; return; } guessNext(); };
  img.addEventListener('load', () => {
    if (tok !== GS.tok) return;
    if (/^data:/.test(img.src)) return fail();                 // все адреса не загрузились — заглушка
    if (mode === 'frag' && motionOK()) requestAnimationFrame(() => { img.style.transition = 'transform 8s linear, filter 8s linear'; img.style.transform = 'scale(1.6)'; img.style.filter = 'blur(1px)'; });
    else if (mode === 'frag') { img.style.transform = 'scale(2)'; img.style.filter = 'blur(2px)'; }
  });
  pic.appendChild(img);
}
function guessPick(id) {
  if (!GS || GS.answered || !GS.cur) return;                  // защита от двойного нажатия
  GS.answered = true; GS.n++;
  const ans = GS.cur, ok = id === ans; if (ok) { GS.ok++; sfx('coin'); } else sfx('lose');
  const pic = document.getElementById('gs-pic'); if (!pic) return;
  const img = pic.querySelector('img'); if (img) { img.style.transition = 'transform .4s, filter .4s'; img.style.transform = 'none'; img.style.filter = 'none'; }
  pic.insertAdjacentHTML('afterend', '<div style="margin-top:6px;font-weight:700;color:' + (ok ? 'var(--ok)' : 'var(--danger)') + '">' + (ok ? '✓ ' : '✗ ') + esc(HERO_BY_ID[ans].name) + ' — ' + esc(ultOf(ans).name) + '</div>');
  document.querySelectorAll('.gs-opts button').forEach(b => { b.disabled = true; if (b.dataset.click.includes("'" + ans + "'")) b.classList.add('green'); });
  gTimers.push(setTimeout(guessNext, 1300));
}
function guessEnd() {
  const g = gamePay('guess', GS.ok * rewardScale() * CONFIG.minigames.pay.guess);
  const rec = setBest('guess', GS.ok, true);
  document.getElementById('game-stage').innerHTML = gameResult('Угадай героя', GS.ok + '/10 верно', g, rec, 'guess');
  if (GS.ok === 10) hype('НИШТЯК');
}

(function () {
  const st = document.createElement('style');
  st.textContent = `
.home-card.sel{box-shadow:0 0 0 2px var(--gold2)}
.lh-field{height:200px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#1d2c16,#2a3a1c);border-radius:4px;margin:10px 0;position:relative}
.lh-creep{text-align:center;transition:transform .1s}
.lh-creep.swing{transform:translateX(-8px) rotate(-6deg)}
.lh-creep.lasthit .lh-body{filter:grayscale(1);opacity:.4}
.lh-body{font-size:5rem;line-height:1}
.lh-hp{width:160px;height:12px;background:#300;border:1px solid #000;margin:0 auto 6px}
.lh-hp>div{height:100%;background:linear-gradient(90deg,#8a1d14,#e0452f);transition:width .15s}
.lh-num{font-family:Cinzel;font-weight:900;font-size:1.2rem}
.gs-pic{margin:14px auto;width:142px;min-height:120px}
.gs-pic img{width:142px;height:188px;object-fit:cover;border-radius:4px;border:2px solid var(--gold3)}
.gs-pic.ult img{width:128px;height:128px}
.gs-pic.frag{overflow:hidden;width:142px;height:188px;border-radius:4px;border:2px solid var(--gold3)}.gs-pic.frag img{border:0}.gs-opts .btn{min-height:44px}
.gs-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-width:460px;margin:0 auto}
`;
  document.head.appendChild(st);
})();
