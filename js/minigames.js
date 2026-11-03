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
    ['lasthit', '🗡', 'Ластхит', 'Добей крипа последним ударом. 10 крипов за раунд.'],
    ['hook', '🪝', 'Pudge Hook', 'Попади хуком по бегущему герою. 10 хуков.'],
    ['guess', '❓', 'Угадай героя', 'По силуэту или иконке ульты. 10 вопросов.'],
    ['invoker', '🔮', 'Invoker: выживание', 'Таймер всё короче. Ошибся или не успел — конец.']
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
  renderGames();
  ({ lasthit: lhStart, hook: hookStart, guess: guessStart })[id]();
}
let gTimers = [];
function stopGames() { gTimers.forEach(t => { clearInterval(t); clearTimeout(t); cancelAnimationFrame(t); }); gTimers = []; document.onkeydown_game = null; }

// ---------- ЛАСТХИТ ----------
let LH = null;
function lhStart() {
  LH = { n: 0, hits: 0, denies: 0, miss: 0 };
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div class="lh"><div class="lh-info"><b id="lh-score">0/10</b> · ластхитов: <b id="lh-hits" style="color:var(--ok)">0</b> · промахов: <b id="lh-miss" style="color:var(--danger)">0</b></div>' +
    '<div class="lh-field"><div class="lh-creep" id="lh-creep"><div class="lh-hp"><div id="lh-hpbar"></div></div><div class="lh-body">👹</div><div class="lh-num" id="lh-num"></div></div></div>' +
    '<div class="muted" style="text-align:center;font-size:.8rem">Твой удар: <b id="lh-dmg" style="color:var(--gold2)"></b> урона, бьёт через 0.35 с после клика. Союзные крипы тоже бьют — успей ударить, когда HP ≤ урона!</div>' +
    '<div style="text-align:center;margin-top:10px"><button class="btn red big" id="lh-btn" data-click="lhAttack()">⚔ УДАР <kbd>A</kbd></button></div></div>';
  lhNext();
}
function lhNext() {
  if (curGame !== 'lasthit' || !document.getElementById('lh-dmg')) return;
  if (LH.n >= 10) return lhEnd();
  LH.n++; LH.hp = 550; LH.max = 550; LH.dmg = 48 + Math.floor(Math.random() * 12); LH.busy = false; LH.dead = false;
  document.getElementById('lh-dmg').textContent = LH.dmg;
  document.getElementById('lh-score').textContent = LH.n + '/10';
  const c = document.getElementById('lh-creep'); c.className = 'lh-creep';
  lhDraw();
  const iv = setInterval(() => {
    if (LH.dead) return;
    LH.hp -= 18 + Math.random() * 34;
    if (LH.hp <= 0) { LH.hp = 0; LH.dead = true; clearInterval(iv); LH.miss++; floatGame('Крип добит союзниками', 'var(--danger)'); sfx('lose'); gTimers.push(setTimeout(lhNext, 700)); }
    lhDraw();
  }, 260 + Math.random() * 120);
  gTimers.push(iv); LH.iv = iv;
}
function lhDraw() {
  if (!document.getElementById('lh-hpbar')) return;
  document.getElementById('lh-hpbar').style.width = (LH.hp / LH.max * 100) + '%';
  document.getElementById('lh-num').textContent = Math.ceil(LH.hp);
  document.getElementById('lh-hits').textContent = LH.hits; document.getElementById('lh-miss').textContent = LH.miss;
}
function lhAttack() {
  if (!LH || LH.busy || LH.dead || !document.getElementById('lh-creep')) return;
  LH.busy = true; sfx('hit');
  const c = document.getElementById('lh-creep'); c.classList.add('swing');
  const t = setTimeout(() => {
    c.classList.remove('swing');
    if (LH.dead) return;
    LH.hp -= LH.dmg;
    if (LH.hp <= 0) { LH.hp = 0; LH.dead = true; clearInterval(LH.iv); LH.hits++; c.classList.add('lasthit'); floatGame('+ ЛАСТХИТ', 'var(--gold2)'); sfx('coin'); gTimers.push(setTimeout(lhNext, 700)); }
    else { floatGame('-' + LH.dmg, '#fff'); }
    LH.busy = false; lhDraw();
  }, 350);
  gTimers.push(t);
}
function lhEnd() {
  const g = gamePay('lasthit', LH.hits * rewardScale() * CONFIG.minigames.pay.lasthit);
  const rec = setBest('lasthit', LH.hits, true);
  document.getElementById('game-stage').innerHTML = gameResult('Ластхит', LH.hits + '/10 ластхитов', g, rec, 'lasthit');
  if (LH.hits === 10) hype('НИШТЯК');
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
  const pudge = new Image(); pudge.referrerPolicy = 'no-referrer'; pudge.src = heroImg('pudge');
  const tgtId = pick(['antimage', 'phantom_assassin', 'juggernaut', 'storm_spirit', 'slark', 'invoker', 'lina', 'riki']);
  const tgt = new Image(); tgt.referrerPolicy = 'no-referrer'; tgt.src = heroImg(tgtId);
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
    ctx.fillStyle = '#1d2c16'; ctx.fillRect(0, 0, 760, 360);
    ctx.fillStyle = '#5e4f33'; ctx.fillRect(0, 150, 760, 60);
    ctx.fillStyle = '#1d4a66'; ctx.fillRect(330, 0, 100, 360);
    try { ctx.drawImage(HK.tgt, t.x - 40, t.y - 22, 80, 45); } catch (e) { }
    ctx.strokeStyle = '#d0402e'; ctx.lineWidth = 2; ctx.strokeRect(t.x - 40, t.y - 22, 80, 45);
    try { ctx.drawImage(HK.pudge, 340, 310, 80, 45); } catch (e) { }
    const h = HK.hook;
    if (h) {
      const sp = 11;
      if (!h.back) { h.dist += sp; h.x += h.dx * sp; h.y += h.dy * sp; if (Math.abs(h.x - t.x) < 40 && Math.abs(h.y - t.y) < 24) { h.back = true; h.caught = true; HK.hit++; document.getElementById('hk-hit').textContent = HK.hit; HK.msg = 'GET OVER HERE!'; HK.msgT = 50; sfx('coin'); } else if (h.dist > h.max) h.back = true; }
      else { h.dist -= sp; h.x -= h.dx * sp; h.y -= h.dy * sp; if (h.caught) { t.x = h.x; t.y = h.y; } if (h.dist <= 0) { HK.hook = null; if (h.caught) { t.x = 100 + Math.random() * 560; t.y = 60 + Math.random() * 120; } if (HK.left <= 0) return hookEnd(); } }
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 3; ctx.setLineDash([6, 4]); ctx.beginPath(); ctx.moveTo(380, 330); ctx.lineTo(h.x, h.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(h.x, h.y, 7, 0, 7); ctx.fill();
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

// ---------- УГАДАЙ ГЕРОЯ ----------
let GS = null;
function guessStart() { GS = { n: 0, ok: 0 }; guessNext(); }
function guessNext() {
  if (curGame !== 'guess' || !document.getElementById('game-stage')) return;
  if (GS.n >= 10) return guessEnd();
  GS.n++;
  const ans = pick(HEROES);
  const opts = [ans]; while (opts.length < 4) { const h = pick(HEROES); if (!opts.includes(h)) opts.push(h); }
  opts.sort(() => Math.random() - 0.5);
  const mode = Math.random() < 0.5 ? 'silhouette' : 'ult';
  const st = document.getElementById('game-stage');
  st.innerHTML = '<div style="text-align:center"><div class="muted">Вопрос ' + GS.n + '/10 · верно ' + GS.ok + ' · ' + (mode === 'ult' ? 'Чья это ульта?' : 'Чей это силуэт?') + '</div><div id="gs-pic" class="gs-pic ' + mode + '"></div><div class="gs-opts">' +
    opts.map(h => '<button class="btn" data-click="guessPick(\'' + h.id + '\',\'' + ans.id + '\')">' + esc(h.name) + '</button>').join('') + '</div></div>';
  const pic = document.getElementById('gs-pic');
  pic.appendChild(mkImg(mode === 'ult' ? ultIconChain(ans.id) : heroTallChain(ans.id), '?'));
}
function guessPick(id, ans) {
  const ok = id === ans; if (ok) { GS.ok++; sfx('coin'); } else sfx('lose');
  const pic = document.getElementById('gs-pic'); pic.classList.remove('silhouette');
  pic.insertAdjacentHTML('beforeend', '<div style="margin-top:6px;font-weight:700;color:' + (ok ? 'var(--ok)' : 'var(--danger)') + '">' + (ok ? '✓ ' : '✗ ') + HERO_BY_ID[ans].name + ' — ' + ultOf(ans).name + '</div>');
  document.querySelectorAll('.gs-opts button').forEach(b => b.disabled = true);
  gTimers.push(setTimeout(guessNext, 1100));
}
function guessEnd() {
  const g = gamePay('guess', GS.ok * rewardScale() * CONFIG.minigames.pay.guess);
  const rec = setBest('guess', GS.ok, true);
  document.getElementById('game-stage').innerHTML = gameResult('Угадай героя', GS.ok + '/10 верно', g, rec, 'guess');
  if (GS.ok === 10) hype('НИШТЯК');
}
document.addEventListener('keydown', e => { if (currentTab === 'games' && curGame === 'lasthit' && (e.code === 'KeyA' || e.code === 'Space')) { e.preventDefault(); lhAttack(); } });

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
.gs-pic.silhouette img{filter:brightness(0) drop-shadow(0 0 8px rgba(232,199,122,.6))}
.gs-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-width:460px;margin:0 auto}
`;
  document.head.appendChild(st);
})();
