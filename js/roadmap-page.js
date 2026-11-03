(function () {
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const name = { now: 'в работе', plan: 'в планах', done: 'готово' };
  document.getElementById('rm').innerHTML = ROADMAP.map(r => '<div class="card"><span class="tag ' + r.s + '">' + name[r.s] + '</span>' + esc(r.t) + '</div>').join('');
  document.getElementById('cl').innerHTML = CHANGELOG.map(c => '<div class="card"><b>Версия ' + esc(c.v) + '</b> <span class="muted">· ' + esc(c.date) + '</span><ul>' + c.items.map(i => '<li>' + esc(i) + '</li>').join('') + '</ul></div>').join('');
})();
