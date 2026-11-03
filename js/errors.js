// ================= ГЛОБАЛЬНЫЙ ПЕРЕХВАТ ОШИБОК =================
// Любая необработанная ошибка → понятный тост с кнопкой «Скопировать отчёт».
// Последние ошибки хранятся в браузере (пригодятся для формы «Сообщить о баге»).
const ERRLOG_KEY = 'd2m_errlog';
const ERRLOG = (() => { try { return JSON.parse(localStorage.getItem(ERRLOG_KEY) || '[]'); } catch (e) { return []; } })();
const ERR_IGNORE = /ResizeObserver loop|^Script error\.?$|Non-Error promise rejection|AbortError|The play\(\) request was interrupted/;
let errToastAt = 0, errToastCount = 0;
function errReport() {
  return JSON.stringify({
    version: self.APP_VERSION, at: new Date().toISOString(),
    user: (typeof USER !== 'undefined' && USER) ? USER.nick : null,
    tab: typeof currentTab !== 'undefined' ? currentTab : null,
    device: navigator.userAgent, screen: innerWidth + 'x' + innerHeight,
    online: navigator.onLine, errors: ERRLOG.slice(-10)
  }, null, 1);
}
function logError(kind, msg, stack) {
  msg = String(msg || 'неизвестная ошибка');
  if (ERR_IGNORE.test(msg)) return;
  const last = ERRLOG[ERRLOG.length - 1];
  if (last && last.msg === msg.slice(0, 300) && Date.now() - last.t < 5000) return;   // не дублировать
  ERRLOG.push({ t: Date.now(), v: self.APP_VERSION, kind, msg: msg.slice(0, 300), stack: String(stack || '').split('\n').slice(0, 4).join('\n').slice(0, 600) });
  while (ERRLOG.length > 30) ERRLOG.shift();
  try { localStorage.setItem(ERRLOG_KEY, JSON.stringify(ERRLOG)); } catch (e) { }
  showErrToast();
}
function showErrToast() {
  errToastCount++;
  if (Date.now() - errToastAt < 10000 && document.getElementById('err-toast')) { const c = document.querySelector('#err-toast .ec'); if (c) c.textContent = '×' + errToastCount; return; }
  errToastAt = Date.now(); errToastCount = 1;
  const old = document.getElementById('err-toast'); if (old) old.remove();
  const t = document.createElement('div'); t.id = 'err-toast';
  t.innerHTML = '<div><b>⚠ Что-то пошло не так</b> <span class="ec"></span></div><div class="em">Игра продолжает работать. Если ошибка мешает — пришли отчёт автору.</div><div class="eb"><button type="button" class="btn sm gold">📋 Скопировать отчёт</button><button type="button" class="btn sm ghost">✕</button></div>';
  const [copy, close] = t.querySelectorAll('button');
  copy.onclick = () => {
    const txt = errReport();
    const done = () => { copy.textContent = '✓ Скопировано'; };
    try { navigator.clipboard.writeText(txt).then(done, () => fallbackCopy(txt, done)); } catch (e) { fallbackCopy(txt, done); }
  };
  close.onclick = () => t.remove();
  document.body.appendChild(t);
  setTimeout(() => { if (t.isConnected) t.remove(); }, 15000);
}
function fallbackCopy(txt, done) {
  const ta = document.createElement('textarea'); ta.value = txt; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); done(); } catch (e) { } ta.remove();
}
window.addEventListener('error', ev => logError('error', ev.message, (ev.error && ev.error.stack) || (ev.filename + ':' + ev.lineno)));
window.addEventListener('unhandledrejection', ev => { const r = ev.reason; logError('promise', r && r.message ? r.message : r, r && r.stack); });
