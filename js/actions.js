// ================= КНОПКИ БЕЗ INLINE-КОДА =================
// Вместо data-click="..." в разметке пишем data-click="имяФункции('арг', 1, this)".
// Здесь один общий обработчик разбирает вызов (без eval) и вызывает функцию.
// Поддерживаются аргументы: 'строки', числа, true/false/null, this, this.value, this.checked, event.
const ACT_CACHE = {};
function parseCall(expr) {
  if (ACT_CACHE[expr]) return ACT_CACHE[expr];
  const m = /^\s*([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)\s*$/.exec(expr);
  if (!m) throw new Error('data-действие не разобрано: ' + expr);
  const args = []; const s = m[2]; let i = 0;
  const skip = () => { while (i < s.length && /\s/.test(s[i])) i++; };
  while (true) {
    skip(); if (i >= s.length) break;
    const q = s[i];
    if (q === "'" || q === '"') {
      let v = ''; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === '\\') i++; v += s[i++]; }
      i++; args.push({ v });
    } else {
      const j = s.indexOf(',', i); const tok = (j < 0 ? s.slice(i) : s.slice(i, j)).trim(); i = j < 0 ? s.length : j;
      if (tok === 'this') args.push({ t: 'el' });
      else if (/^this\.(value|checked)$/.test(tok)) args.push({ t: 'prop', p: tok.slice(5) });
      else if (tok === 'event') args.push({ t: 'ev' });
      else if (tok === 'true' || tok === 'false') args.push({ v: tok === 'true' });
      else if (tok === 'null') args.push({ v: null });
      else if (/^-?\d+(\.\d+)?(e\d+)?$/i.test(tok)) args.push({ v: +tok });
      else throw new Error('аргумент не разобран: ' + tok + ' в ' + expr);
    }
    skip(); if (s[i] === ',') i++;
  }
  return (ACT_CACHE[expr] = { name: m[1], args });
}
function runAct(expr, el, ev) {
  const c = parseCall(expr);
  const fn = window[c.name];
  if (typeof fn !== 'function') throw new Error('нет функции ' + c.name);
  return fn.apply(el, c.args.map(a => a.t === 'el' ? el : a.t === 'prop' ? el[a.p] : a.t === 'ev' ? ev : a.v));
}
['click', 'change', 'input', 'submit'].forEach(type => {
  document.addEventListener(type, ev => {
    const attr = 'data-' + type;
    const el = ev.target && ev.target.closest ? ev.target.closest('[' + attr + ']') : null;
    if (!el) return;
    if (type === 'click' && el.tagName === 'A' && el.getAttribute('href') === '#') ev.preventDefault();
    if (type === 'submit') ev.preventDefault();
    if (el.disabled) return;
    const r = runAct(el.getAttribute(attr), el, ev);
    if (r && typeof r.catch === 'function') r.catch(e => logError('promise', e && e.message, e && e.stack));
  });
});

// ---------- маленькие функции вместо бывшего inline-кода ----------
function setUseCons(k, on) { S.useCons[k] = !!on; save(); }
function setBoardSort(k) { boardSort = k; renderOnline(); }
function manualCloudSave() { return cloudPush().then(() => toast('☁', 'Сохранено в облако')); }
function goHero(id) { switchTab('heroes'); selectHero(id); }
function pickTitle(id, el) { setTitle(id); el.parentNode.querySelectorAll('.tp').forEach(x => x.classList.remove('on')); el.classList.add('on'); }
function setCraftR(v) { craftR = v; renderCraft(); }
function setSetting(k, el) {
  if (k === 'vol') SETTINGS.vol = +el.value;
  else if (k === 'lang') SETTINGS.lang = el.value;
  else SETTINGS[k] = el.checked;
  saveSettings();
  if (k === 'lang' && S) { try { switchTab(currentTab); updateTop(); updateProfileChip(); } catch (e) { } }   // 2.3: перерисовать на новом языке
  if (k === 'sfx') sfx('click');
  if (k === 'voice') announce('First Blood!');
}
function restartTutorial() { closeModal(); startTutorial(true); }
function tutSkip() { tutStep = -1; showTutStep(); }
function tutNext() { tutStep++; showTutStep(); }
function pickAccount(el) { document.getElementById('auth-nick').value = el.dataset.nick; authMode('login'); }
// 2.4.4: выживание — 1 попытка в день
function survivalLeft() { return S.survDay === todayStr() ? 0 : 1; }
function startSurvival() {
  if (busy.battle) return;
  if (!survivalLeft()) return showModal('🌊', 'Попытка на сегодня использована', 'В выживании одна попытка в день. Возвращайся завтра!', '');
  S.survDay = todayStr(); save();
  startBattle(0, false, survivalDef());
}
