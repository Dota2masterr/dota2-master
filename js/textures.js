// ================= 2.4: НОВЫЕ ТЕКСТУРЫ МИНИ-ИГР =================
// Всё рисуется кодом один раз в скрытый canvas и потом только копируется (drawImage) — 60 FPS и на телефоне.
// Случайность — своя, с сидом, поэтому картинка всегда одинаковая. Внешние картинки не нужны.
const TEX = { cache: {} };
function texRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function texCanvas(key, w, h, draw) {
  if (TEX.cache[key]) return TEX.cache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  return (TEX.cache[key] = c);
}
// трава: базовый градиент + пятна + травинки
function texGrass(g, x, y, w, h, pal, seed, dens) {
  const r = texRng(seed);
  const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, pal[0]); gr.addColorStop(1, pal[1]); g.fillStyle = gr; g.fillRect(x, y, w, h);
  for (let i = 0; i < w * h / 900; i++) { g.fillStyle = r() < 0.5 ? pal[2] : pal[3]; g.globalAlpha = 0.18 + r() * 0.2; g.beginPath(); g.ellipse(x + r() * w, y + r() * h, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, 6.283); g.fill(); }
  g.globalAlpha = 1;
  for (let i = 0; i < w * h / (dens || 60); i++) { const px = x + r() * w, py = y + r() * h, l = 2 + r() * 5; g.strokeStyle = r() < 0.5 ? pal[4] : pal[2]; g.globalAlpha = 0.35 + r() * 0.4; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px + (r() - 0.5) * 3, py - l); g.stroke(); }
  g.globalAlpha = 1;
}
function texTree(g, x, y, s, r, dark) {
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + s * 0.25, y + s * 0.85, s * 0.95, s * 0.35, 0, 0, 6.283); g.fill();
  g.fillStyle = '#3a2716'; g.fillRect(x - s * 0.12, y + s * 0.2, s * 0.24, s * 0.7);
  const cols = dark ? ['#13230f', '#1c3517', '#2b4a1f', '#3f6a2a'] : ['#123c14', '#1b5a1d', '#2a7a28', '#46a03a'];
  [[0, 0, 1], [-0.45, 0.15, 0.7], [0.45, 0.12, 0.72], [0, -0.35, 0.72]].forEach(([dx, dy, k], i) => {
    const cx = x + dx * s, cy = y + dy * s - s * 0.1, rr = s * 0.62 * k;
    const gr = g.createRadialGradient(cx - rr * 0.35, cy - rr * 0.4, rr * 0.1, cx, cy, rr); gr.addColorStop(0, cols[3]); gr.addColorStop(0.55, cols[2]); gr.addColorStop(1, cols[i % 2]);
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, rr, 0, 6.283); g.fill();
  });
  g.fillStyle = 'rgba(255,255,200,.08)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (r() - 0.6) * s, y - s * 0.3 + (r() - 0.5) * s * 0.5, s * 0.12, 0, 6.283); g.fill(); }
}
function texRock(g, x, y, s, r) {
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x + s * 0.2, y + s * 0.45, s, s * 0.35, 0, 0, 6.283); g.fill();
  const pts = []; for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283, k = 0.75 + r() * 0.3; pts.push([x + Math.cos(a) * s * k, y + Math.sin(a) * s * 0.62 * k]); }
  const gr = g.createLinearGradient(x - s, y - s, x + s, y + s); gr.addColorStop(0, '#8d8a80'); gr.addColorStop(1, '#3c3a36');
  g.fillStyle = gr; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 1.5; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(pts[3][0], pts[3][1]); g.lineTo(pts[5][0], pts[5][1]); g.stroke();
}
// башня-силуэт для фона (Radiant — светлая с зелёным огнём, Dire — тёмная с красным)
function texTowerDeco(g, x, y, s, dire) {
  g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x, y + s * 1.05, s * 0.9, s * 0.25, 0, 0, 6.283); g.fill();
  const gr = g.createLinearGradient(x - s, 0, x + s, 0); gr.addColorStop(0, dire ? '#2a1a1a' : '#6d6a5c'); gr.addColorStop(1, dire ? '#120a0a' : '#3d3b33');
  g.fillStyle = gr; g.beginPath(); g.moveTo(x - s * 0.6, y + s); g.lineTo(x - s * 0.4, y - s * 0.5); g.lineTo(x + s * 0.4, y - s * 0.5); g.lineTo(x + s * 0.6, y + s); g.closePath(); g.fill();
  g.fillStyle = dire ? '#3a1410' : '#8a8470'; g.fillRect(x - s * 0.55, y - s * 0.62, s * 1.1, s * 0.18);
  const c = dire ? '255,70,40' : '120,255,120';
  const gl = g.createRadialGradient(x, y - s * 0.85, 1, x, y - s * 0.85, s * 0.7); gl.addColorStop(0, 'rgba(' + c + ',.95)'); gl.addColorStop(1, 'rgba(' + c + ',0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y - s * 0.85, s * 0.7, 0, 6.283); g.fill();
}
// ---------- Ластхит: лайн с дорогой и башнями по краям ----------
function texLasthit() {
  return texCanvas('lh', 720, 300, (g, w, h) => {
    const r = texRng(11);
    texGrass(g, 0, 0, w, h, ['#24391b', '#172a12', '#2f4a22', '#101e0c', '#4b6e30'], 3);
    // дорога
    const road = g.createLinearGradient(0, 100, 0, 190); road.addColorStop(0, '#5a4a30'); road.addColorStop(0.5, '#6d5a3a'); road.addColorStop(1, '#4a3c26');
    g.fillStyle = road; g.beginPath(); g.moveTo(0, 108); for (let x = 0; x <= w; x += 40) g.lineTo(x, 104 + Math.sin(x / 90) * 4 + r() * 3); g.lineTo(w, 188); for (let x = w; x >= 0; x -= 40) g.lineTo(x, 186 + Math.sin(x / 70) * 4 + r() * 3); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; [128, 166].forEach(yy => { g.beginPath(); for (let x = 0; x <= w; x += 20) g.lineTo(x, yy + Math.sin(x / 50) * 2); g.stroke(); });
    for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,30,15,.5)' : 'rgba(150,130,90,.35)'; g.beginPath(); g.ellipse(r() * w, 110 + r() * 72, 1 + r() * 3, 1 + r() * 2, 0, 0, 6.283); g.fill(); }
    // края травы над дорогой
    g.strokeStyle = 'rgba(70,110,40,.6)'; g.lineWidth = 1; for (let x = 0; x < w; x += 3) { g.beginPath(); g.moveTo(x, 106); g.lineTo(x + 1, 100 - r() * 5); g.stroke(); g.beginPath(); g.moveTo(x, 186); g.lineTo(x + 1, 192 + r() * 4); g.stroke(); }
    texTowerDeco(g, 24, 120, 26, false); texTowerDeco(g, 696, 120, 26, true);
    [[70, 38, 24], [140, 22, 20], [230, 40, 18], [500, 30, 20], [590, 42, 24], [660, 22, 19], [40, 252, 22], [160, 262, 18], [560, 258, 20], [690, 250, 24]].forEach(([x, y, s]) => texTree(g, x, y, s, r, x > 360));
    [[300, 30, 9], [430, 50, 7], [260, 255, 8], [470, 265, 10]].forEach(([x, y, s]) => texRock(g, x, y, s, r));
    // виньетка
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.65); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
}
// ---------- Pudge Hook и Sun Strike: река между лесами ----------
function texRiver() {
  return texCanvas('river', 760, 360, (g, w, h) => {
    const r = texRng(23);
    texGrass(g, 0, 0, w, h, ['#26401c', '#182c12', '#335226', '#0f1f0b', '#527a34'], 7);
    const top = x => 225 - Math.sin(x / 760 * 3.1) * 30 + Math.sin(x / 90) * 4, bot = x => top(x) + 52 + Math.sin(x / 120) * 6;
    // берег
    g.fillStyle = '#4e4230'; g.beginPath(); g.moveTo(0, top(0) - 8); for (let x = 0; x <= w; x += 10) g.lineTo(x, top(x) - 8); for (let x = w; x >= 0; x -= 10) g.lineTo(x, bot(x) + 8); g.closePath(); g.fill();
    const wg = g.createLinearGradient(0, 190, 0, 300); wg.addColorStop(0, '#1f5a7a'); wg.addColorStop(0.5, '#123f5c'); wg.addColorStop(1, '#1b5272');
    g.fillStyle = wg; g.beginPath(); g.moveTo(0, top(0)); for (let x = 0; x <= w; x += 10) g.lineTo(x, top(x)); for (let x = w; x >= 0; x -= 10) g.lineTo(x, bot(x)); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(180,230,255,.28)'; g.lineWidth = 1.5;
    for (let k = 0; k < 7; k++) { g.beginPath(); const off = 8 + k * 6; for (let x = r() * 40; x < w; x += 70 + r() * 60) { const y = top(x) + off; g.moveTo(x, y); g.quadraticCurveTo(x + 14, y - 3, x + 28 + r() * 12, y); } g.stroke(); }
    g.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 0; x < w; x += 6) { if (r() < 0.5) g.fillRect(x, top(x) - 1, 3, 2); if (r() < 0.5) g.fillRect(x, bot(x) - 1, 3, 2); }
    // камыши
    g.strokeStyle = '#6c8a3a'; for (let i = 0; i < 70; i++) { const x = r() * w, y = (r() < 0.5 ? top(x) - 4 : bot(x) + 6); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 4, y - 8 - r() * 8); g.stroke(); }
    // руна в реке
    const rx = 520, ry = top(520) + 26; const rg = g.createRadialGradient(rx, ry, 1, rx, ry, 22); rg.addColorStop(0, 'rgba(120,220,255,.8)'); rg.addColorStop(1, 'rgba(120,220,255,0)'); g.fillStyle = rg; g.beginPath(); g.arc(rx, ry, 22, 0, 6.283); g.fill();
    [[50, 50, 26], [140, 30, 20], [700, 36, 26], [620, 70, 18], [30, 170, 22], [735, 150, 22], [150, 335, 24], [640, 335, 26], [330, 345, 18]].forEach(([x, y, s]) => texTree(g, x, y, s, r, x > 380));
    [[250, 40, 11], [500, 75, 9], [420, 318, 12], [80, 300, 8]].forEach(([x, y, s]) => texRock(g, x, y, s, r));
    const v = g.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, w * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.42)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  });
}
// ---------- Защита башен: поле Radiant (низ) / Dire (верх), река с мостами, две линии ----------
function texTowerField(W, H, RIVER) {
  return texCanvas('tw' + W + 'x' + H, W * 2, H * 2, (g, w, h) => {
    g.scale(2, 2);
    const r = texRng(41);
    texGrass(g, 0, 0, W, RIVER, ['#3a2a22', '#2a1c17', '#47302a', '#1a100c', '#5a3a30'], 5, 30);       // Dire: тёмная земля
    texGrass(g, 0, RIVER, W, H - RIVER, ['#2b4a20', '#1c3416', '#36592a', '#14260f', '#58833a'], 6, 30); // Radiant: трава
    // линии (дорожки) x=80 и x=280
    [80, 280].forEach(x => { const lg = g.createLinearGradient(x - 26, 0, x + 26, 0); lg.addColorStop(0, 'rgba(90,72,46,0)'); lg.addColorStop(0.25, 'rgba(110,90,58,.75)'); lg.addColorStop(0.75, 'rgba(110,90,58,.75)'); lg.addColorStop(1, 'rgba(90,72,46,0)'); g.fillStyle = lg; g.fillRect(x - 26, 40, 52, H - 80);
      for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(40,30,15,.4)'; g.fillRect(x - 18 + r() * 36, 40 + r() * (H - 80), 2, 2); } });
    // дорожка к трону
    [[180, 585], [180, 55]].forEach(([x, y]) => { g.fillStyle = 'rgba(110,90,58,.6)'; g.beginPath(); g.ellipse(x, y, 60, 26, 0, 0, 6.283); g.fill(); });
    // река
    const rg = g.createLinearGradient(0, RIVER - 16, 0, RIVER + 16); rg.addColorStop(0, '#1e5876'); rg.addColorStop(0.5, '#123b56'); rg.addColorStop(1, '#1e5876');
    g.fillStyle = rg; g.fillRect(0, RIVER - 15, W, 30);
    g.strokeStyle = 'rgba(180,230,255,.3)'; g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); for (let x = 0; x < W; x += 30) { g.moveTo(x + r() * 10, RIVER - 8 + k * 7); g.quadraticCurveTo(x + 14, RIVER - 10 + k * 7, x + 24, RIVER - 8 + k * 7); } g.stroke(); }
    // мосты
    [80, 280].forEach(x => { g.fillStyle = '#5a3e22'; g.fillRect(x - 17, RIVER - 18, 34, 36); g.fillStyle = '#7a5530'; for (let i = 0; i < 6; i++) g.fillRect(x - 16, RIVER - 17 + i * 6, 32, 4); g.fillStyle = '#3a2614'; g.fillRect(x - 19, RIVER - 18, 3, 36); g.fillRect(x + 16, RIVER - 18, 3, 36); });
    // деревья по краям (не на дорожках)
    [[14, 120], [16, 250], [346, 140], [344, 230], [150, 150], [210, 210], [180, 130]].forEach(([x, y], i) => texTree(g, x, y, i > 3 ? 11 : 14, r, true));
    [[14, 400], [16, 520], [346, 410], [344, 520], [150, 430], [210, 470], [180, 500]].forEach(([x, y], i) => texTree(g, x, y, i > 3 ? 11 : 14, r, false));
    [[130, 360, 6], [235, 285, 6], [120, 280, 5], [240, 370, 5]].forEach(([x, y, s]) => texRock(g, x, y, s, r));
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.62); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  });
}
// крип: щит-туловище, шлем, оружие (Radiant — зелёно-золотой, Dire — красно-чёрный)
function drawCreep(g, x, y, s, side, ranged, alpha) {
  const dire = side === 1;
  g.save(); g.globalAlpha = alpha == null ? 1 : alpha;
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(x, y + s * 0.85, s * 0.9, s * 0.3, 0, 0, 6.283); g.fill();
  const body = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 1, x, y, s); body.addColorStop(0, dire ? '#c0503a' : '#8ccf5a'); body.addColorStop(1, dire ? '#5a1810' : '#2c5a1c');
  g.fillStyle = body; g.beginPath(); g.arc(x, y, s * 0.8, 0, 6.283); g.fill();
  g.strokeStyle = dire ? '#1a0806' : '#122a0c'; g.lineWidth = Math.max(1, s * 0.12); g.stroke();
  // шлем
  g.fillStyle = dire ? '#2a2a2e' : '#d8b860'; g.beginPath(); g.arc(x, y - s * 0.32, s * 0.48, Math.PI, 0); g.fill();
  if (dire) { g.fillStyle = '#d0c8b0'; g.beginPath(); g.moveTo(x - s * 0.42, y - s * 0.5); g.lineTo(x - s * 0.62, y - s * 0.95); g.lineTo(x - s * 0.26, y - s * 0.62); g.fill(); g.beginPath(); g.moveTo(x + s * 0.42, y - s * 0.5); g.lineTo(x + s * 0.62, y - s * 0.95); g.lineTo(x + s * 0.26, y - s * 0.62); g.fill(); }
  else { g.fillStyle = '#fff3c0'; g.fillRect(x - s * 0.06, y - s * 0.86, s * 0.12, s * 0.3); }
  g.fillStyle = dire ? '#ff6a4a' : '#bfffb0'; g.fillRect(x - s * 0.3, y - s * 0.28, s * 0.6, s * 0.1);
  // оружие
  if (ranged) { g.strokeStyle = '#8a6a3a'; g.lineWidth = Math.max(1, s * 0.12); g.beginPath(); g.arc(x + s * 0.7, y, s * 0.5, -1.2, 1.2); g.stroke(); g.strokeStyle = '#ddd'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + s * 0.88, y - s * 0.46); g.lineTo(x + s * 0.88, y + s * 0.46); g.stroke(); }
  else { g.strokeStyle = '#c8d0d8'; g.lineWidth = Math.max(1.5, s * 0.16); g.beginPath(); g.moveTo(x + s * 0.55, y + s * 0.35); g.lineTo(x + s * 1.05, y - s * 0.45); g.stroke(); g.strokeStyle = '#6a4a2a'; g.beginPath(); g.moveTo(x + s * 0.5, y + s * 0.42); g.lineTo(x + s * 0.62, y + s * 0.28); g.stroke(); }
  g.restore();
}
// здание «Защиты башен»
function drawTwBuilding(g, b, mine) {
  const s = b.r, x = b.x, y = b.y, throne = b.kind === 'throne';
  g.save(); g.globalAlpha = b.alive ? 1 : 0.3;
  g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.ellipse(x, y + s * 0.7, s * 1.05, s * 0.45, 0, 0, 6.283); g.fill();
  const base = g.createRadialGradient(x - s * 0.3, y - s * 0.3, 2, x, y, s * 1.05); base.addColorStop(0, mine ? '#9a9a84' : '#5a3a34'); base.addColorStop(1, mine ? '#3e4a34' : '#22100c');
  g.fillStyle = base; g.beginPath();
  if (throne) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283 - 0.4, k = i % 2 ? 0.78 : 1; g.lineTo(x + Math.cos(a) * s * k, y + Math.sin(a) * s * k); } g.closePath(); }
  else g.arc(x, y, s, 0, 6.283);
  g.fill(); g.strokeStyle = mine ? '#c8f0b0' : '#ff8a6a'; g.lineWidth = 2; g.stroke();
  const c = mine ? '110,255,120' : '255,80,50';
  const gl = g.createRadialGradient(x, y, 1, x, y, s * 0.7); gl.addColorStop(0, 'rgba(' + c + ',1)'); gl.addColorStop(0.5, 'rgba(' + c + ',.45)'); gl.addColorStop(1, 'rgba(' + c + ',0)');
  g.fillStyle = gl; g.beginPath(); g.arc(x, y, s * 0.7, 0, 6.283); g.fill();
  g.fillStyle = mine ? '#e8ffe0' : '#ffe0d0'; g.beginPath(); g.arc(x, y, s * (throne ? 0.22 : 0.18), 0, 6.283); g.fill();
  g.restore();
}
// мистический фон для Invoker и «Угадай героя» (data:URL, CSP разрешает)
function texMysticURL() {
  if (TEX.mystic) return TEX.mystic;
  const c = texCanvas('mystic', 820, 420, (g, w, h) => {
    const r = texRng(77);
    const bg = g.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.7); bg.addColorStop(0, '#1d1830'); bg.addColorStop(1, '#07060c'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.1 + r() * 0.5) + ')'; g.fillRect(r() * w, r() * h, 1, 1); }
    [['#3ab0ff', 180, 210], ['#c34aff', 410, 150], ['#ff8a2a', 640, 230]].forEach(([col, x, y]) => { const gl = g.createRadialGradient(x, y, 2, x, y, 150); gl.addColorStop(0, col + '55'); gl.addColorStop(1, col + '00'); g.fillStyle = gl; g.beginPath(); g.arc(x, y, 150, 0, 6.283); g.fill(); });
    g.strokeStyle = 'rgba(232,199,122,.18)'; g.lineWidth = 1.5;
    [70, 110, 150].forEach(rr => { g.beginPath(); g.arc(w / 2, h / 2, rr, 0, 6.283); g.stroke(); });
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; g.beginPath(); g.moveTo(w / 2 + Math.cos(a) * 110, h / 2 + Math.sin(a) * 110); g.lineTo(w / 2 + Math.cos(a) * 150, h / 2 + Math.sin(a) * 150); g.stroke(); }
    g.font = '18px serif'; g.fillStyle = 'rgba(232,199,122,.22)'; g.textAlign = 'center'; g.textBaseline = 'middle';
    'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃ'.split('').forEach((ch, i) => { const a = i / 12 * 6.283; g.fillText(ch, w / 2 + Math.cos(a) * 130, h / 2 + Math.sin(a) * 130); });
  });
  try { TEX.mystic = c.toDataURL('image/jpeg', 0.82); } catch (e) { TEX.mystic = ''; }
  return TEX.mystic;
}
function applyMysticBg(el) { if (!el) return; const u = texMysticURL(); if (u) { el.style.backgroundImage = 'url(' + u + ')'; el.style.backgroundSize = 'cover'; el.style.backgroundPosition = 'center'; el.classList.add('tex-mystic'); } }

// ================= 2.4.8: КАРТИНКИ ИГРОКА (assets/tower, assets/rogue) =================
// Картинки грузятся один раз и кэшируются. Пока картинка не загрузилась (или не нашлась) — рисуется старая графика кодом.
const ASSET = { img: {} };
function assetImg(path) {
  const c = ASSET.img[path];
  if (c) return c.ok ? c.im : null;
  const im = new Image(); const rec = ASSET.img[path] = { im, ok: false };
  im.onload = () => { rec.ok = true; }; im.onerror = () => { rec.bad = true; };
  im.src = 'assets/' + path + '.webp';
  return null;
}
function assetUrl(path) { return 'assets/' + path + '.webp'; }
function assetTag(path, cls, alt) { return '<img class="' + (cls || 'a-ico') + '" src="' + assetUrl(path) + '" alt="' + (alt || '') + '" loading="lazy" draggable="false">'; }
// «Защита башен»: юнит карты → спрайт (по значку карты), заклинание → эффект на поле, карта → иконка
const TW_SPRITE = { '🗡': 'creep-melee', '🏹': 'creep-ranged', '🪨': 'catapult', '🐀': 'kobold', '🐺': 'wolf', '🌳': 'treant', '🕷': 'spider', '⚔': 'megacreep', '🔥': 'golem', '🗼': 'sentry', '✚': 'healward', '🪦': 'tombstone', '🧟': 'zombie' };
const TW_SPELL_FX = { sunstrike: 'fx-sun', chrono: 'fx-chrono', blackhole: 'fx-blackhole', arrow: 'fx-explosion', ravage: 'fx-ravage', meteor: 'fx-meteor', freezing: 'fx-frost', mekansm: 'fx-heal' };
const TW_SPELL_ICON = { sunstrike: 'spell-sunstrike', chrono: 'spell-chrono', blackhole: 'spell-blackhole', arrow: 'spell-arrow', ravage: 'spell-ravage', meteor: 'spell-meteor', freezing: 'spell-freezing', mekansm: 'spell-mekansm' };
const TW_ARENA_FILE = ['forest', 'river', 'shop', 'camp', 'roshan', 'mid', 'sanctum', 'citadel', 'throne', 'immortal'];
// заранее подгрузить всё для боя Башни, чтобы в первые секунды не мигало
function twPreload() {
  Object.values(TW_SPRITE).concat(Object.values(TW_SPELL_FX), ['tower-blue', 'tower-red', 'throne-blue', 'throne-red', 'tower-blue-ruin', 'tower-red-ruin', 'throne-blue-ruin', 'throne-red-ruin', 'fx-explosion'])
    .forEach(n => assetImg('tower/' + n));
  TW_ARENA_FILE.forEach((n, i) => assetImg('tower/arena-' + i + '-' + n));
}
// «Путь Древнего»: враг → картинка
const RG_FOE_IMG = { kobold: 'foe-creep', wolf: 'foe-wolf', alpha: 'foe-wolf', satyr: 'foe-imp', troll: 'elite-2', ogre: 'elite-1', harpy: 'foe-ghost', golem: 'foe-golem', centaur: 'elite-3', dark_troll: 'elite-2', lizard: 'foe-spider', skeleton: 'foe-ghost', treant_s: 'boss-act1', rosh_pup: 'elite-1', treant: 'boss-act1', roshan: 'boss-act2', ancient: 'boss-act3' };
