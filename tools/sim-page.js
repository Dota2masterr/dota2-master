// Страница симуляции: управляет невидимой копией игры (../index.html?sim=1)
const $ = id => document.getElementById(id);
function loadGame() {
  return new Promise(res => {
    const f = $('game'); f.onload = () => {
      const w = f.contentWindow, s = w.document.createElement('script'); s.src = 'tools/econ-sim.js'; s.onload = () => res(w); w.document.body.appendChild(s);
    }; f.src = '../index.html?sim=1&t=' + Date.now();
  });
}
function chart(canvas, series, opt) {
  const c = canvas, x = c.getContext('2d'), W = c.width = 940, H = c.height = 300, P = 46;
  x.clearRect(0, 0, W, H); x.font = '12px sans-serif';
  const all = series.flatMap(s => s.pts); if (!all.length) return;
  const maxX = Math.max(...all.map(p => p[0])) || 1;
  const ys = all.map(p => opt.log ? Math.log10(Math.max(1, p[1])) : p[1]);
  const maxY = Math.max(...ys) || 1, minY = opt.log ? 0 : 0;
  const X = v => P + (v / maxX) * (W - P - 10), Y = v => H - 26 - ((opt.log ? Math.log10(Math.max(1, v)) : v) - minY) / (maxY - minY || 1) * (H - 50);
  x.strokeStyle = '#2a333d'; x.fillStyle = '#8a96a3';
  for (let i = 0; i <= 4; i++) { const yv = minY + (maxY - minY) * i / 4, yy = H - 26 - (H - 50) * i / 4; x.beginPath(); x.moveTo(P, yy); x.lineTo(W - 10, yy); x.stroke(); x.fillText(opt.log ? '1e' + yv.toFixed(1) : Math.round(yv), 4, yy + 4); }
  x.fillText(opt.xl || '', W - 120, H - 6); x.fillText(opt.title || '', P, 14);
  series.forEach((s, i) => { x.strokeStyle = s.color || 'hsl(' + (i * 47 % 360) + ',70%,60%)'; x.lineWidth = s.w || 1.5; x.beginPath(); s.pts.forEach((p, j) => j ? x.lineTo(X(p[0]), Y(p[1])) : x.moveTo(X(p[0]), Y(p[1]))); x.stroke(); });
}
$('run').onclick = async () => {
  $('run').disabled = true; $('out').innerHTML = '';
  let over = {}; try { if ($('over').value.trim()) over = JSON.parse($('over').value); } catch (e) { $('st').textContent = 'JSON с ошибкой'; $('run').disabled = false; return; }
  const prof = { days: +$('nd').value, sessions: +$('ns').value, minutes: +$('nm').value, minigameRounds: +$('ng').value };
  const N = +$('np').value, runs = [];
  for (let i = 0; i < N; i++) {
    $('st').textContent = 'Игрок ' + (i + 1) + ' из ' + N + '…';
    const w = await loadGame();                     // свежая копия игры на каждого игрока
    w.simSetup(over); const r = w.simPlayer(prof);
    runs.push(JSON.parse(JSON.stringify(r)));
    await new Promise(r => setTimeout(r, 20));
  }
  $('st').textContent = 'Готово: ' + N * prof.days * prof.sessions + ' сессий';
  // вехи
  const ms = [10, 25, 50, 75, 100].map(L => { const h = runs.map(r => r.milestones[L] && r.milestones[L].hours).filter(v => v != null).sort((a, b) => a - b); const d = runs.map(r => r.milestones[L] && r.milestones[L].day).filter(v => v != null).sort((a, b) => a - b); return { L, n: h.length, h: h[Math.floor(h.length / 2)], d: d[Math.floor(d.length / 2)] }; });
  // доходы
  const book = {}; runs.forEach(r => { for (const k in r.book) { book[k] = book[k] || { in: 0, out: 0 }; book[k].in += r.book[k].in; book[k].out += r.book[k].out; } });
  const hours = runs.reduce((a, r) => a + r.timeline[r.timeline.length - 1].hours, 0), tot = Object.values(book).reduce((a, b) => a + b.in, 0);
  const fmt = n => Math.round(n).toLocaleString('ru-RU');
  $('out').innerHTML = '<h2>Прохождение арены (медиана)</h2><div class="card"><table><tr><th>Уровень</th><th>Часов игры</th><th>День</th><th>Дошли</th></tr>' + ms.map(m => '<tr><td>' + m.L + '</td><td>' + (m.h != null ? m.h : '—') + '</td><td>' + (m.d || '—') + '</td><td>' + m.n + '/' + N + '</td></tr>').join('') + '</table></div>' +
    '<canvas id="c1"></canvas><canvas id="c2"></canvas>' +
    '<h2>Источники и стоки самоцветов</h2><div class="card"><table><tr><th>Источник</th><th>Доход</th><th>Доля</th><th>В час</th><th>Расход</th></tr>' + Object.entries(book).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out)).map(([k, v]) => '<tr><td>' + k + '</td><td>' + fmt(v.in) + '</td><td>' + (v.in / tot * 100).toFixed(1) + '%</td><td>' + fmt(v.in / hours) + '</td><td>' + (v.out ? fmt(v.out) : '') + '</td></tr>').join('') + '</table></div>';
  chart($('c1'), runs.map(r => ({ pts: r.timeline.map(t => [t.hours, t.arena]) })), { title: 'Уровень арены от часов игры (каждая линия — игрок)', xl: 'часы игры' });
  chart($('c2'), runs.map(r => ({ pts: r.timeline.map(t => [t.hours, t.gems]) })), { title: 'Самоцветы на руках (логарифм)', xl: 'часы игры', log: true });
  $('run').disabled = false;
};
