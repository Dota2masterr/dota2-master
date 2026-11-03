// ================= ЗАСТАВКА (2.3) — как при запуске Dota 2 =================
// Чёрный экран → вспышка → эмблема → надпись. Один раз за открытие вкладки, нажатие — пропустить.
(function intro() {
  try { if (sessionStorage.getItem('d2m_intro')) return; sessionStorage.setItem('d2m_intro', '1'); } catch (e) { }
  if (/[?&]sim=1/.test(location.search)) return;
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const d = document.createElement('div'); d.id = 'intro'; d.setAttribute('aria-hidden', 'true');
  d.innerHTML = '<div class="in-flash"></div><img class="in-logo" src="favicon.svg" alt=""><div class="in-title">DOTA 2 <b>MASTER</b></div><div class="in-sub">фан-игра · нажми, чтобы пропустить</div>';
  const go = () => { if (!d.parentNode) return; d.classList.add('out'); setTimeout(() => d.remove(), 600); };
  d.addEventListener('click', go);
  const add = () => { document.body.appendChild(d); setTimeout(go, reduce ? 900 : 3200); };
  if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
})();
