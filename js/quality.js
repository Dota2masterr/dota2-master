// ================= КАЧЕСТВО: английский, доступность, «Поделиться», «Сообщить о баге» =================

// ---------- английская версия ----------
// Словарь «русская фраза → английская». Переводчик проходит по тексту страницы (и всему, что дорисовывается
// позже) и заменяет фразы, которые есть в словаре. Новые строки — просто добавь пару сюда.
const I18N_TEXT = {
  'ВХОД В ИГРУ': 'SIGN IN', 'Вход': 'Sign in', 'Регистрация': 'Sign up', 'Ник': 'Nickname', 'Например: Dendi': 'e.g. Dendi', 'Пароль': 'Password', 'Повтори пароль': 'Repeat password',
  'ИГРАТЬ': 'PLAY', 'СОЗДАТЬ АККАУНТ': 'CREATE ACCOUNT', '🔑 Забыл пароль? Восстановить по коду': '🔑 Forgot password? Recover with code', 'Конфиденциальность': 'Privacy',
  'Неофициальная некоммерческая фан-игра. Dota 2 — собственность Valve.': 'Unofficial non-commercial fan game. Dota 2 is owned by Valve.',
  'Прогресс хранится в браузере и (если пароль от 6 символов) в облаке. Пароль хранится только в виде хэша.': 'Progress is stored in your browser and (with a 6+ character password) in the cloud. Passwords are stored only as a hash.',
  'Главная': 'Home', 'Герои': 'Heroes', 'Слоты': 'Slots', 'Коллекция': 'Collection', 'Апгрейдер': 'Upgrader', 'Арена': 'Arena', 'Задания': 'Quests', 'Сундуки': 'Treasures', 'Мини-игры': 'Mini-games', 'Онлайн': 'Online',
  'Самоцветы': 'Gems', 'Профиль': 'Profile', 'профиль': 'profile', '⚔ Сила стака': '⚔ Stack power', 'Σ Сила всех': 'Σ Total power', '🎨 Предметов': '🎨 Items', '🎰 Круток': '🎰 Spins', '🏟 Арена': '🏟 Arena',
  'Скорость анимаций': 'Animation speed', '🐢 Медленно': '🐢 Slow', '⚡ Быстро': '⚡ Fast', 'Все герои +1 уровень': 'All heroes +1 level', '⬆ Улучшить всех': '⬆ Upgrade all', 'Обновить': 'Refresh', 'Установить как приложение': 'Install as app', 'Настройки': 'Settings',
  'Качай героев на рулетке, выбивай скины и снаряжение в четырёх слот-машинах, улучшай предметы и проведи свою команду через': 'Level heroes on the wheel, win skins and gear in four slot machines, upgrade items and lead your team through',
  '100 уровней арены': '100 arena levels', '— от верхнего лайна до мида.': '— from top lane to mid.', 'В БОЙ': 'TO BATTLE',
  'Рулетка улучшений. Чем выше уровень героя — тем дороже крутка.': 'Upgrade wheel. The higher the hero level, the pricier the spin.',
  'Immortal Slot 3, Arcana Slot 5, Cosmetic Slot 3 и Cosmetic Slot 5.': 'Immortal Slot 3, Arcana Slot 5, Cosmetic Slot 3 and Cosmetic Slot 5.',
  'Скины и снаряжение с wiki.cs.money. Сортировка, продажа, экипировка.': 'Skins and gear from wiki.cs.money. Sort, sell, equip.',
  'Рискни предметом ради редкости выше. Доноры повышают шанс.': 'Risk an item for a higher rarity. Donors raise the chance.',
  'All Pick: главный герой + 4 сильнейших. Цепочки волн, 4 локации.': 'All Pick: main hero + 4 strongest. Wave chains, 4 locations.',
  'Ежедневные задания, награда за вход и 25 достижений.': 'Daily quests, login rewards and 25 achievements.', 'Quas · Wex · Exort. Собери 10 заклинаний на скорость.': 'Quas · Wex · Exort. Invoke 10 spells against the clock.',
  'Статистика': 'Statistics', 'Выбери героя': 'Choose a hero', 'Рулетка улучшений': 'Upgrade wheel', 'Выбери героя слева': 'Pick a hero on the left', 'Круток подряд:': 'Spins in a row:', 'КРУТИТЬ': 'SPIN', 'Цена крутки:': 'Spin cost:', 'или': 'or', 'Пробел': 'Space',
  '🎮 Ставки, слоты и сундуки — только на игровую валюту. Самоцветы нельзя купить за деньги или вывести.': '🎮 Bets, slots and chests use in-game currency only. Gems can\'t be bought with money or withdrawn.',
  'Всего предметов': 'Total items', 'Скинов': 'Skins', 'Снаряжения': 'Gear', 'Стоимость': 'Value', 'Тип': 'Type', 'Все': 'All', 'Скины': 'Skins', 'Снаряжение': 'Gear', 'Сортировка': 'Sort',
  'По редкости ↓': 'Rarity ↓', 'По редкости ↑': 'Rarity ↑', 'По типу': 'Type', 'Сначала новые': 'Newest first', 'По герою': 'Hero', 'По названию': 'Name', 'Надеть на': 'Equip on', 'Продать видимые': 'Sell visible', 'Продать Common': 'Sell Common',
  'Пусто. Крути слоты и рулетку, проходи арену!': 'Empty. Spin slots and the wheel, clear the arena!', 'Экипировка героя': 'Hero loadout', 'Выбери': 'Choose', 'основной предмет': 'main item', 'и до 4': 'and up to 4', 'доноров': 'donors',
  '(Shift+клик) — доноры сгорают и повышают шанс.': '(Shift+click) — donors burn and raise the chance.', 'При провале основной предмет уничтожается.': 'On failure the main item is destroyed.',
  'Основной предмет': 'Main item', 'Кликни предмет в инвентаре ниже': 'Click an item in the inventory below', 'Доноры': 'Donors', '(макс. 4)': '(max 4)', 'Шанс': 'Chance', 'Цена': 'Cost', 'Результат': 'Result', 'АПГРЕЙД': 'UPGRADE', 'Очистить': 'Clear',
  'Колесо апгрейда': 'Upgrade wheel', 'Выбери предмет': 'Choose an item', 'Инвентарь': 'Inventory', 'клик — основной · Shift+клик — донор': 'click — main · Shift+click — donor', 'Главный герой:': 'Main hero:', 'Сила стака:': 'Stack power:',
  'Команда = главный герой + 4 самых сильных. В бою учитывается только мощь этих пятерых (стака), а не всех героев.': 'Team = main hero + 4 strongest. Only these five (the stack) count in battle.',
  'Лавка · предметы главного героя': 'Shop · main hero items', 'Рошан': 'Roshan', 'Синергии стака': 'Stack synergies', 'Журнал боёв': 'Battle log', 'Выживание': 'Survival', 'Время': 'Time', 'Цель': 'Target', 'Нажми Start': 'Press Start',
  '⌫ Очистить сферы': '⌫ Clear orbs', 'Клавиши': 'Keys', 'Рецепты': 'Recipes', 'Что нового': 'What\'s new', 'Роадмап': 'Roadmap', 'Сообщить о баге': 'Report a bug',
  'Неофициальная фан-игра. Dota 2 и все связанные материалы — собственность Valve Corporation. Проект некоммерческий.': 'Unofficial fan game. Dota 2 and all related materials are the property of Valve Corporation. Non-commercial project.',
  'Картинки: Steam CDN / wiki.cs.money. Если не грузятся — проверь интернет; иначе покажутся заглушки.': 'Images: Steam CDN / wiki.cs.money. If they don\'t load, check your connection; placeholders will be shown.',
  'Пропустить ⏩': 'Skip ⏩', 'Закрыть': 'Close', 'Музыка Dota 2': 'Dota 2 music', 'Саундтрек Dota 2': 'Dota 2 soundtrack', 'Свой MP3': 'Own MP3',
  'The Dota 2 Official Soundtrack — Valve Studio Orchestra. Без входа в Spotify играют 30-секундные фрагменты.': 'The Dota 2 Official Soundtrack — Valve Studio Orchestra. Without a Spotify login, 30-second previews play.',
  // частые динамические подписи
  'Забрать': 'Claim', '✓ получено': '✓ claimed', 'Перейти': 'Go', 'Сохранить': 'Save', 'Отмена': 'Cancel', 'Готово': 'Done', 'Выйти': 'Log out', 'Отправить': 'Send', 'Добавить': 'Add', 'Друзья': 'Friends', 'Пригласи друга': 'Invite a friend',
  'Таблица лидеров': 'Leaderboard', 'Подарок другу': 'Gift to a friend', 'Самоцветы ': 'Gems ', 'Предмет': 'Item', 'Сила стака': 'Stack power', '⚔ НАЙТИ СОПЕРНИКА': '⚔ FIND OPPONENT', 'Обычный': 'Normal', 'Награда за вход': 'Login reward',
  'Задания на сегодня': 'Today\'s quests', 'Задания недели': 'Weekly quests', 'Достижения': 'Achievements', 'Первые шаги': 'First steps', '🚀 Первые шаги': '🚀 First steps', 'Крафт · 10 → 1': 'Craft · 10 → 1', 'Содержимое': 'Contents',
  'Открыть': 'Open', 'Шансы:': 'Odds:', '📊 Шансы и выплаты': '📊 Odds & payouts', '📊 Шансы рулетки': '📊 Wheel odds', 'Получено — приходи завтра': 'Claimed — come back tomorrow', 'Забрать награду дня': 'Claim today\'s reward',
  'Изменить ник / аватар': 'Change nickname / avatar', '💾 Перенос': '💾 Transfer', 'Сброс прогресса': 'Reset progress', '🗑 Удалить аккаунт': '🗑 Delete account', 'Звуковые эффекты': 'Sound effects', 'Пройти обучение заново': 'Replay tutorial',
  'Далее': 'Next', 'Начать игру': 'Start playing', 'Пропустить': 'Skip', 'Перезагрузить': 'Reload', 'Позже': 'Later', '⬆ Доступно обновление игры': '⬆ Game update available', '📋 Скопировать отчёт': '📋 Copy report', '⚠ Что-то пошло не так': '⚠ Something went wrong'
};
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
const i18nOrig = new Map();      // узел → исходный русский текст (чтобы вернуть при переключении)
function trNode(n) {
  if (n.nodeType === 3) {
    const raw = n.nodeValue, t = raw.trim(); if (!t || !/[А-Яа-яЁё]/.test(t)) return;
    const en = I18N_TEXT[t]; if (!en) return;
    if (!i18nOrig.has(n)) i18nOrig.set(n, raw);
    n.nodeValue = raw.replace(t, en);
  } else if (n.nodeType === 1) {
    if (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.id === 'snow') return;
    I18N_ATTRS.forEach(a => { const v = n.getAttribute && n.getAttribute(a); if (v && I18N_TEXT[v.trim()]) { if (!n.dataset['ru' + a.replace('-', '')]) n.dataset['ru' + a.replace('-', '')] = v; n.setAttribute(a, I18N_TEXT[v.trim()]); } });
    n.childNodes.forEach(trNode);
  }
}
let i18nObs = null;
function applyTextLang() {
  if (SETTINGS.lang === 'en') {
    trNode(document.body);
    if (!i18nObs) { i18nObs = new MutationObserver(ms => ms.forEach(m => { m.addedNodes.forEach(trNode); if (m.type === 'characterData') trNode(m.target); })); i18nObs.observe(document.body, { childList: true, subtree: true }); }
  } else {
    if (i18nObs) { i18nObs.disconnect(); i18nObs = null; }
    i18nOrig.forEach((v, n) => { n.nodeValue = v; }); i18nOrig.clear();
    document.querySelectorAll('[data-ruplaceholder],[data-rutitle],[data-rurialabel]').forEach(el => { I18N_ATTRS.forEach(a => { const k = 'ru' + a.replace('-', ''); if (el.dataset[k]) { el.setAttribute(a, el.dataset[k]); delete el.dataset[k]; } }); });
  }
}

// ---------- доступность ----------
// кнопки-иконки получают подпись для экранных читалок; кликабельные div — роль кнопки и фокус с клавиатуры
const KB_CLICKABLE = '[data-click]:not(button):not(a):not(input):not(select):not(label), .hcard, .home-card, .profile-chip, #wave-strip .w, .lvl';
function a11yPass(root) {
  (root || document).querySelectorAll('button:not([aria-label])').forEach(b => {
    const txt = b.textContent.replace(/[\s -⯿\uD800-\uDFFF️×✕]/g, '');
    if (!txt) { const t = b.getAttribute('title'); if (t) b.setAttribute('aria-label', t); }
  });
  (root || document).querySelectorAll(KB_CLICKABLE).forEach(el => { if (!el.hasAttribute('tabindex')) { el.setAttribute('tabindex', '0'); el.setAttribute('role', 'button'); } });
  (root || document).querySelectorAll('img:not([alt])').forEach(i => i.setAttribute('alt', ''));
}
document.addEventListener('keydown', e => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches(KB_CLICKABLE)) { e.preventDefault(); e.target.click(); }
  if (e.key === 'Escape' && typeof modalOpen !== 'undefined' && modalOpen) closeModal();
});
let a11yTimer = null;
new MutationObserver(() => { clearTimeout(a11yTimer); a11yTimer = setTimeout(() => a11yPass(), 250); }).observe(document.body, { childList: true, subtree: true });

// ---------- карточка «Поделиться» ----------
// Рисуется на canvas без чужих картинок (иначе браузер не даст сохранить), 1080×1350 — удобно для VK/Telegram.
function shareCardCanvas() {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1410'); g.addColorStop(0.5, '#0e1217'); g.addColorStop(1, '#0b1a12'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { x.fillStyle = 'rgba(232,199,122,' + (0.2 + Math.random() * 0.6) + ')'; x.beginPath(); x.arc(Math.random() * W, Math.random() * H, Math.random() * 2.2, 0, 7); x.fill(); }
  x.strokeStyle = '#8a6a2f'; x.lineWidth = 4; x.strokeRect(30, 30, W - 60, H - 60);
  x.textAlign = 'center'; x.fillStyle = '#e8c77a'; x.font = '900 88px Cinzel, Georgia, serif'; x.fillText('DOTA 2 MASTER', W / 2, 180);
  x.fillStyle = '#ffffff'; x.font = '700 76px "Roboto Condensed", Arial, sans-serif'; x.fillText(USER.nick, W / 2, 330);
  const t = currentTitle(); if (t) { x.fillStyle = /^#[0-9a-f]{3,8}$/i.test(t.color) ? t.color : '#e8c77a'; x.font = '600 40px "Roboto Condensed", Arial'; x.fillText('« ' + t.name + ' »', W / 2, 395); }
  const rows = [['⚔ Арена', S.arena.cleared + ' / 100'], ['💪 Сила стака', fmt(stackPower())], ['🏆 MMR', (S.pvp ? S.pvp.mmr + ' · ' + rankOf(S.pvp.mmr)[0] : '—')], ['🎫 Сезон', 'уровень ' + (S.season ? Math.min(30, Math.floor(S.season.xp / CONFIG.progression.xpPerLevel)) : 0)], ['🎨 Предметов', fmt(S.items.length)]];
  x.font = '500 46px "Roboto Condensed", Arial';
  rows.forEach(([k, v], i) => { const y = 520 + i * 95; x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(120, y - 62, W - 240, 80); x.textAlign = 'left'; x.fillStyle = '#9fb0c0'; x.fillText(k, 160, y); x.textAlign = 'right'; x.fillStyle = '#ffffff'; x.fillText(v, W - 160, y); });
  if (S.bestDrop) { x.textAlign = 'center'; x.fillStyle = RARITY_COLOR[S.bestDrop.rarity] || '#fff'; x.font = '700 40px "Roboto Condensed", Arial'; x.fillText('Лучший дроп: ' + S.bestDrop.name.slice(0, 34), W / 2, 1050); x.font = '600 34px "Roboto Condensed", Arial'; x.fillText(RARITY_NAMES[S.bestDrop.rarity] || '', W / 2, 1100); }
  x.textAlign = 'center'; x.fillStyle = '#e8c77a'; x.font = '600 38px "Roboto Condensed", Arial'; x.fillText('Играй бесплатно в браузере:', W / 2, 1210);
  x.fillStyle = '#ffffff'; x.font = '500 34px "Roboto Condensed", Arial'; x.fillText(location.host + location.pathname.replace(/[^/]*$/, ''), W / 2, 1258);
  x.fillStyle = '#6f7d8a'; x.font = '400 22px Arial'; x.fillText('неофициальная фан-игра · Dota 2 © Valve', W / 2, 1300);
  return c;
}
async function shareCard() {
  const c = shareCardCanvas();
  const blob = await new Promise(r => c.toBlob(r, 'image/png'));
  const file = new File([blob], 'dota2master-' + USER.nick + '.png', { type: 'image/png' });
  if (typeof statEvent === 'function') statEvent('share');
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Dota 2 Master', text: 'Мой прогресс в Dota 2 Master — залетай! ' + location.href.split('?')[0] }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  toast('📤 Картинка сохранена', 'Отправь её в VK или Telegram');
}

// ---------- «Сообщить о баге» ----------
function openBugReport() {
  showModal('🐞', 'Сообщить о баге', '<div style="text-align:left"><div class="field"><label>Что случилось? Что делал перед этим?</label><textarea id="bug-text" maxlength="1500" style="width:100%;height:110px;background:#05070a;color:#fff;border:1px solid var(--line2);padding:8px;font-size:16px"></textarea></div>' +
    '<label style="font-size:.85rem"><input type="checkbox" id="bug-tech" checked> Приложить технические данные (версия, устройство, последние ошибки — без пароля и личных данных)</label><div class="auth-err" id="bug-err"></div></div>', '', { html: true, buttons: [
      { t: 'Отправить', c: 'green', f: sendBugReport }, { t: 'Отмена', c: 'ghost', f: closeModal }] });
}
async function sendBugReport() {
  const txt = document.getElementById('bug-text').value.trim(), err = document.getElementById('bug-err');
  if (txt.length < 5) { err.textContent = 'Опиши проблему хотя бы парой слов'; return; }
  const full = txt + (document.getElementById('bug-tech').checked ? '\n\n--- техданные ---\n' + errReport() : '');
  if (typeof statEvent === 'function') statEvent('bug_report');
  if (USER && typeof cloud === 'function' && cloud()) { await sendReport({ kind: 'bug', reason: 'bug', text: full.slice(0, 3500) }); return; }
  // без облака — копируем отчёт, чтобы отправить автору вручную
  try { await navigator.clipboard.writeText(full); closeModal(); showModal('🐞', 'Отчёт скопирован', 'Онлайн не подключён, поэтому отчёт скопирован в буфер обмена — отправь его автору игры.', ''); }
  catch (e) { err.textContent = 'Скопируй текст вручную и отправь автору.'; }
}

(function hookQuality() {
  const _al = applyLang;
  applyLang = function () { _al(); applyTextLang(); };
  // кнопка «Поделиться» на главной
  const _rh = renderHome;
  renderHome = function () { _rh(); const p = document.getElementById('home-profile'); if (p && !p.querySelector('.share-btn')) { const b = document.createElement('button'); b.className = 'btn gold share-btn'; b.type = 'button'; b.textContent = '📤 Поделиться прогрессом'; b.onclick = shareCard; b.style.marginTop = '8px'; p.appendChild(b); } };
  // в тосте ошибки — ещё и «Сообщить»
  const _et = showErrToast;
  showErrToast = function () { _et(); const t = document.getElementById('err-toast'); if (t && !t.querySelector('.bug-btn')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn sm green bug-btn'; b.textContent = '🐞 Сообщить'; b.onclick = () => { t.remove(); openBugReport(); }; t.querySelector('.eb').prepend(b); } };
  setTimeout(() => a11yPass(), 500);
})();
