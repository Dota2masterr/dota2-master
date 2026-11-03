// ================= НАВЫКИ ГЕРОЕВ =================
// 3 навыка + ульта (из ULTS) у каждого героя. Данные — js/data-skills.js (сгенерированы из базы Dota).
// Используются новой боёвкой арены, рогаликом «Путь Древнего» и «Битвой за Башню».
const SKILL_KIND = {
  dmg: { n: 'Урон', c: '#ff8a5a', i: '⚔' }, aoe: { n: 'Урон по всем', c: '#ff5a3a', i: '💥' }, stun: { n: 'Оглушение', c: '#7ad3ff', i: '💫' },
  silence: { n: 'Безмолвие', c: '#c8a4ff', i: '🤐' }, slow: { n: 'Замедление', c: '#7ab8ff', i: '🐌' }, dot: { n: 'Яд', c: '#7ad35a', i: '☠' },
  heal: { n: 'Лечение', c: '#6cff7a', i: '💚' }, shield: { n: 'Щит', c: '#ffd36a', i: '🛡' }, buff: { n: 'Усиление', c: '#ffb84a', i: '⚡' },
  debuff: { n: 'Ослабление', c: '#d07aff', i: '🔻' }, summon: { n: 'Призыв', c: '#9ad8ff', i: '👥' }, passive: { n: 'Пассивный', c: '#9fb0c0', i: '◈' },
  execute: { n: 'Добивание', c: '#ff2a6a', i: '☠' }
};
const ROLE_NAME = { carry: 'Керри', support: 'Саппорт', nuker: 'Нюкер', initiator: 'Инициатор', tank: 'Танк' };
const SKILL_CACHE = {};
function heroRole(id) { return (SKILL_DB[id] && SKILL_DB[id].role) || 'carry'; }
// навыки героя как объекты: { key, name, kind, pow, cd, mana, dur, target, extra, desc, ult }
function getSkills(id) {
  if (SKILL_CACHE[id]) return SKILL_CACHE[id];
  const raw = (SKILL_DB[id] && SKILL_DB[id].s) || [];
  let list = raw.map((s, i) => ({ key: s[0], name: s[1], kind: s[2], pow: s[3], cd: s[4], mana: s[5], dur: s[6], target: s[7], extra: s[8], desc: s[9], ult: s[8] === 'ult', slot: i }));
  if (!list.length) { const u = ultOf(id); list = [{ key: u.key, name: u.name, kind: 'dmg', pow: 3, cd: 0, mana: 100, dur: 1, target: 'enemy', extra: 'ult', desc: 'Ульта', ult: true, slot: 0 }]; }
  return (SKILL_CACHE[id] = list);
}
function skillIconChain(key, heroId) { return [STEAM + 'abilities/' + key + '.png', spellIcon(key), heroId ? heroIcon(heroId) : null].filter(Boolean); }
function skillCard(s, heroId) {
  const k = SKILL_KIND[s.kind] || SKILL_KIND.dmg;
  const d = document.createElement('div'); d.className = 'skill-card' + (s.ult ? ' ult' : '');
  const im = mkImg(skillIconChain(s.key, heroId), s.name, 'sk-ic'); d.appendChild(im);
  const t = document.createElement('div'); t.className = 'sk-t';
  t.innerHTML = '<div class="sk-n"></div><div class="sk-k" style="color:' + k.c + '">' + k.i + ' ' + k.n + (s.ult ? ' · УЛЬТА' : '') + '</div><div class="sk-d"></div><div class="sk-m">' +
    (s.kind === 'passive' ? 'всегда действует' : (s.ult ? 'шкала ульты: каждое 6-е действие' : 'перезарядка ' + s.cd + ' хода · мана ' + s.mana)) + '</div>';
  t.querySelector('.sk-n').textContent = s.name; t.querySelector('.sk-d').textContent = s.desc;
  d.appendChild(t); return d;
}
function skillsPanel(heroId) {
  const box = document.createElement('div'); box.className = 'skills-panel'; box.id = 'pv-skills';
  const h = document.createElement('div'); h.className = 'sk-h'; h.innerHTML = 'Навыки · роль: <b>' + ROLE_NAME[heroRole(heroId)] + '</b>'; box.appendChild(h);
  const g = document.createElement('div'); g.className = 'sk-grid'; getSkills(heroId).forEach(s => g.appendChild(skillCard(s, heroId))); box.appendChild(g);
  // 2.3: все способности героя из Dota (в бою используются 4 главные выше)
  const all = (typeof HERO_ABILITIES !== 'undefined' && HERO_ABILITIES[heroId]) || [];
  const used = new Set(getSkills(heroId).map(s => s.key));
  const rest = all.filter(a => !used.has(a[0]));
  if (rest.length) {
    const r = document.createElement('div'); r.className = 'sk-all';
    r.innerHTML = '<div class="sk-h">Остальные способности героя</div>';
    rest.forEach(a => { const d = document.createElement('div'); d.className = 'sk-mini'; d.appendChild(mkImg(skillIconChain(a[0], heroId), a[1])); const t = document.createElement('span'); t.textContent = a[1]; d.appendChild(t); r.appendChild(d); });
    box.appendChild(r);
  }
  return box;
}
(function hookSkills() {
  const _rp = renderPreview;
  renderPreview = function () {
    _rp();
    const old = document.getElementById('pv-skills'); if (old) old.remove();
    if (!selectedHero) return;
    const tal = document.getElementById('pv-tal'); const box = document.getElementById('sel-preview');
    const p = skillsPanel(selectedHero);
    (tal || box).after(p);
  };
})();
