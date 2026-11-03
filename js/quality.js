// ================= КАЧЕСТВО: английский, доступность, «Поделиться», «Сообщить о баге» =================

// ---------- английская версия ----------
// Словарь «русская фраза → английская». Переводчик проходит по тексту страницы (и всему, что дорисовывается
// позже) и заменяет фразы, которые есть в словаре. Новые строки — просто добавь пару сюда.
const I18N_TEXT = {
  "Верхний лайн": "Top lane",
  "Нижний лайн": "Bottom lane",
  "Лес": "Jungle",
  "Мид": "Mid",
  "Авто (сильнейший)": "Auto (strongest)",
  "⚔ В БОЙ": "⚔ FIGHT",
  "АТАКОВАТЬ": "ATTACK",
  "пусто": "empty",
  "ВСЕ РЕДКОСТИ": "ALL RARITIES",
  "Все связки": "All combos",
  "провал": "fail",
  "⚡ СИЛА": "⚡ POWER",
  "🎨 СКИН": "🎨 SKIN",
  "🛡 ВЕЩЬ": "🛡 ITEM",
  "ДЖЕКПОТ": "JACKPOT",
  "3 СТРЕЛКИ": "3 POINTERS",
  "НИШТЯК": "NISHTYAK",
  "БИЧ": "BITCH",
  "📤 ПОДЕЛИТЬСЯ ПРОГРЕССОМ": "📤 SHARE PROGRESS",
  "Круток героев": "Hero spins",
  "Круток слотов": "Slot spins",
  "Побед на арене": "Arena wins",
  "Поражений": "Losses",
  "Убийств Рошана": "Roshan kills",
  "Сундуков": "Chests",
  "Крафтов": "Crafts",
  "Апгрейдов (успех)": "Upgrades (success)",
  "Продано": "Sold",
  "Рекорд выживания": "Survival record",
  "Самый редкий дроп: пока нет": "Rarest drop: none yet",
  "Рост силы стака": "Stack power growth",
  "График появится, когда наберётся хотя бы 2 дня игры.": "The chart appears after at least 2 days of play.",
  "Награды полностью, предметы за боссов": "Full rewards, items from bosses",
  "исп.": "use",
  "обновятся в полночь": "refresh at midnight",
  "награды забраны": "rewards claimed",
  "Твои 3 сильнейших героя против трёх врагов подряд.": "Your 3 strongest heroes vs three enemies in a row.",
  "Полный стак 5 на 5.": "Full stack, 5 vs 5.",
  "Файт на ультах: у всех ульта каждые 3 действия.": "Ult fight: everyone ults every 3 actions.",
  "Нет активных связок. Поставь главным героем одного из пары, чтобы собрать синергию.": "No active combos. Make one hero of a pair your main to get a synergy.",
  "Первая крутка": "First spin",
  "Рулеточник": "Wheel spinner",
  "Колесо судьбы": "Wheel of fate",
  "Азартный": "Gambler",
  "Король слотов": "Slot king",
  "Вечный НИШТЯК": "Eternal NISHTYAK",
  "Лайнер": "Laner",
  "Хозяин топа": "Top lane master",
  "Хозяин бота": "Bot lane master",
  "Властелин леса": "Lord of the jungle",
  "Древний пал": "The Ancient has fallen",
  "Опытный": "Experienced",
  "Максимум": "Maximum",
  "Весь пул": "Whole pool",
  "Сильный стак": "Strong stack",
  "Непобедимые": "Unbeatable",
  "Коллекционер": "Collector",
  "Полный комплект": "Full set",
  "Кузнец": "Blacksmith",
  "Карл": "Carl",
  "Арсенал магии": "Magic arsenal",
  "Торговец": "Trader",
  "Неделя в игре": "A week in game",
  "Крутни рулетку героев": "Spin the hero wheel",
  "100 круток героев": "100 hero spins",
  "1000 круток героев": "1000 hero spins",
  "50 прокрутов слотов": "50 slot spins",
  "500 прокрутов слотов": "500 slot spins",
  "Поймай первый НИШТЯК": "Catch your first NISHTYAK",
  "10 раз НИШТЯК": "NISHTYAK 10 times",
  "Пройди 10 уровней арены": "Clear 10 arena levels",
  "Захвати верхний лайн (25)": "Take the top lane (25)",
  "Захвати нижний лайн (50)": "Take the bottom lane (50)",
  "Пройди лес (75)": "Clear the jungle (75)",
  "Пройди все 100 уровней": "Clear all 100 levels",
  "Подними героя до 25 уровня": "Raise a hero to level 25",
  "Подними героя до 50 уровня": "Raise a hero to level 50",
  "Все герои 10+ уровня": "All heroes level 10+",
  "Сила стака 10 000": "Stack power 10,000",
  "Сила стака 50 000": "Stack power 50,000",
  "50 предметов в коллекции": "50 items in collection",
  "Получи первую Arcana": "Get your first Arcana",
  "Заполни все 6 слотов снаряжения героя": "Fill all 6 gear slots of a hero",
  "10 успешных апгрейдов": "10 successful upgrades",
  "Invoker Race быстрее 20 с": "Invoker Race under 20 s",
  "Invoker Race быстрее 12 с": "Invoker Race under 12 s",
  "Продай 100 предметов": "Sell 100 items",
  "Заходи 7 дней подряд": "Log in 7 days in a row",
  "⬜ Крутни рулетку любого героя": "⬜ Spin any hero's wheel",
  "⬜ Забери награду за вход в «Заданиях»": "⬜ Claim the login reward in Quests",
  "⬜ Прокрути слоты": "⬜ Spin the slots",
  "Продай 5 предметов": "Sell 5 items",
  "Пройди Invoker Game 1 раз": "Finish Invoker Game once",
  "Выполни 12 ежедневных заданий": "Complete 12 daily quests",
  "Сыграй 25 наградных раундов мини-игр": "Play 25 rewarded mini-game rounds",
  "Выбери 5 героев. Первый — главный (👑). Нажми на выбранного, чтобы убрать. ⭐ — избранные.": "Pick 5 heroes. The first is the main one (👑). Tap a picked hero to remove. ⭐ — favorites.",
  "Ласт хит": "Last hit",
  "Ластхит": "Last hit",
  "Угадай героя": "Guess the hero",
  "Битва за Башню": "Tower Battle",
  "Выбери мини-игру": "Choose a mini-game",
  "Путь Древнего": "Path of the Ancient",
  'ВХОД В ИГРУ': 'SIGN IN', 'Вход': 'Sign in', 'Регистрация': 'Sign up', 'Ник': 'Nickname', 'Например: Dendi': 'e.g. Dendi', 'Пароль': 'Password', 'Повтори пароль': 'Repeat password',
  'ИГРАТЬ': 'PLAY', 'СОЗДАТЬ АККАУНТ': 'CREATE ACCOUNT', '🔑 Забыл пароль? Восстановить по коду': '🔑 Forgot password? Recover with code', 'Конфиденциальность': 'Privacy',
  'Неофициальная некоммерческая фан-игра. Dota 2 — собственность Valve.': 'Unofficial non-commercial fan game. Dota 2 is owned by Valve.',
  'Прогресс хранится в браузере и (если пароль от 6 символов) в облаке. Пароль хранится только в виде хэша.': 'Progress is stored in your browser and (with a 6+ character password) in the cloud. Passwords are stored only as a hash.',
  'Главная': 'Home', 'Герои': 'Heroes', 'Слоты': 'Slots', 'Коллекция': 'Collection', 'Апгрейдер': 'Upgrader', 'Арена': 'Arena', 'Задания': 'Quests', 'Сундуки': 'Treasures', 'Мини-игры': 'Mini-games', 'Онлайн': 'Online',
  'Кристаллы': 'Gems', 'Профиль': 'Profile', 'профиль': 'profile', '⚔ Сила стака': '⚔ Stack power', 'Σ Сила всех': 'Σ Total power', '🎨 Предметов': '🎨 Items', '🎰 Круток': '🎰 Spins', '🏟 Арена': '🏟 Arena',
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
  '🎮 Ставки, слоты и сундуки — только на игровую валюту. Кристаллы нельзя купить за деньги или вывести.': '🎮 Bets, slots and chests use in-game currency only. Gems can\'t be bought with money or withdrawn.',
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
  'Таблица лидеров': 'Leaderboard', 'Подарок другу': 'Gift to a friend', 'Кристаллы ': 'Gems ', 'Предмет': 'Item', 'Сила стака': 'Stack power', '⚔ НАЙТИ СОПЕРНИКА': '⚔ FIND OPPONENT', 'Обычный': 'Normal', 'Награда за вход': 'Login reward',
  'Задания на сегодня': 'Today\'s quests', 'Задания недели': 'Weekly quests', 'Достижения': 'Achievements', 'Первые шаги': 'First steps', '🚀 Первые шаги': '🚀 First steps', 'Крафт · 10 → 1': 'Craft · 10 → 1', 'Содержимое': 'Contents',
  'Открыть': 'Open', 'Шансы:': 'Odds:', '📊 Шансы и выплаты': '📊 Odds & payouts', '📊 Шансы рулетки': '📊 Wheel odds', 'Получено — приходи завтра': 'Claimed — come back tomorrow', 'Забрать награду дня': 'Claim today\'s reward',
  'Изменить ник / аватар': 'Change nickname / avatar', '💾 Перенос': '💾 Transfer', 'Сброс прогресса': 'Reset progress', '🗑 Удалить аккаунт': '🗑 Delete account', 'Звуковые эффекты': 'Sound effects', 'Пройти обучение заново': 'Replay tutorial',
  'Далее': 'Next', 'Начать игру': 'Start playing', 'Пропустить': 'Skip', 'Перезагрузить': 'Reload', 'Позже': 'Later', '⬆ Доступно обновление игры': '⬆ Game update available', '📋 Скопировать отчёт': '📋 Copy report', '⚠ Что-то пошло не так': '⚠ Something went wrong'
};
// 2.3: пословный словарь для динамических строк (уровни, награды, бои и т.д.)
const I18N_WORDS = {
  'Путь Древнего': 'Path of the Ancient', 'Битва за Башню': 'Tower Battle', 'Свой стак': 'Custom stack', 'Надеть лучшее всем': 'Equip best on all', 'Надевать новое автоматически': 'Auto-equip new items',
  'только его предметы': 'only their items', 'Все слоты': 'All slots', 'Слот': 'Slot', 'Герой': 'Hero', 'Файты': 'Fights', 'Тройка': 'Trio', 'Пятёрка': 'Five-stack', 'Торментор': 'Tormentor', 'Рошпит': 'Roshpit', 'Винсдум': 'Wisdom rune', '5 за активки': 'Actives fight',
  'награда получена': 'reward claimed', 'Избранные': 'Favorites', 'Избранное': 'Favorites', 'Остальные способности героя': 'Other hero abilities', 'Навыки': 'Skills', 'роль': 'role', 'Таланты': 'Talents',
  'Уровень': 'Level', 'уровень': 'level', 'уровня': 'level', 'ур.': 'lvl', 'Победа': 'Victory', 'ПОБЕДА': 'VICTORY', 'Поражение': 'Defeat', 'ПОРАЖЕНИЕ': 'DEFEAT', 'поражение': 'defeat', 'победа': 'victory', 'победы': 'wins', 'побед': 'wins',
  'Награда': 'Reward', 'награда': 'reward', 'Шанс победы': 'Win chance', 'Сила врагов': 'Enemy power', 'твой стак': 'your stack', 'волн подряд': 'waves in a row', 'волн': 'waves', 'Волны': 'Waves',
  'Скин за босса': 'Skin for the boss', 'Снаряжение': 'Gear', 'снаряжение': 'gear', 'Цепочка уровней': 'Level chain', 'Обычный': 'Normal', 'Турбо': 'Turbo',
  'Этаж': 'Floor', 'этаж': 'floor', 'Колода': 'Deck', 'Бой за этаж': 'Fight for floor', 'PvP с призраком': 'PvP vs ghost', 'Живой PvP': 'Live PvP', 'Бот': 'Bot', 'простой': 'easy', 'средний': 'medium', 'сложный': 'hard',
  'Начать забег': 'Start run', 'Ежедневный': 'Daily', 'Мои билды': 'My builds', 'Осколки': 'Shards', 'Рекорды': 'Records', 'Забег': 'Run', 'Стартовый предмет': 'Starting item', 'Уровень Бездны': 'Abyss level',
  'Лавка': 'Shop', 'Фонтан': 'Fountain', 'Событие': 'Event', 'Сундук': 'Chest', 'Бой': 'Fight', 'Элита': 'Elite', 'Босс': 'Boss', 'Инвентарь': 'Inventory', 'Все рецепты': 'All recipes', 'Сдаться': 'Give up', 'Дальше': 'Next', 'Атака': 'Attack', 'Автоход': 'Auto',
  'Продать': 'Sell', 'Надеть на': 'Equip on', 'Надеть': 'Equip', 'Снять': 'Unequip', 'Облик': 'Look', 'Скин': 'Skin', 'кристаллов': 'gems', 'кристаллы': 'gems', 'Кристаллы': 'Gems', 'кристалл': 'gem',
  'сегодня': 'today', 'Наградных раундов сегодня': 'Rewarded rounds today', 'рекорд': 'record', 'попаданий': 'hits', 'Кастов': 'Casts', 'Хуков': 'Hooks', 'ластхитов': 'last hits', 'денаев': 'denies', 'упущено': 'missed', 'Ещё раз': 'Again',
  'Ульты вручную': 'Manual ults', 'Ульты сами': 'Auto ults', 'Пропустить': 'Skip', 'Следующее': 'Next', 'Готово': 'Done', 'Сила': 'Power', 'сила': 'power', 'Ловкость': 'Agility', 'Интеллект': 'Intelligence', 'Универсальные': 'Universal',
  'Поиск…': 'Search…', 'По имени': 'By name', 'По уровню': 'By level', 'По силе': 'By power', 'героев': 'heroes', 'Главный герой': 'Main hero', 'Сила стака': 'Stack power', 'Арена': 'Arena', 'Достижения': 'Achievements', 'Предметов': 'Items',
  'Лучшие герои': 'Best heroes', 'Изменить профиль и аккаунт': 'Edit profile and account', 'Героев 50 ур.': 'Heroes lvl 50', 'Башня': 'Tower', 'перезарядка': 'cooldown', 'мана': 'mana', 'хода': 'turns', 'ходов': 'turns'
};
const I18N_WRE = new RegExp('(?<![А-Яа-яЁё])(' + Object.keys(I18N_WORDS).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?![А-Яа-яЁё])', 'g');
function trWords(t) { return t.replace(I18N_WRE, m => I18N_WORDS[m] || m); }
const I18N_ATTRS = ['placeholder', 'title', 'aria-label'];
const i18nOrig = new Map();      // узел → исходный русский текст (чтобы вернуть при переключении)
function trNode(n) {
  if (n.nodeType === 3) {
    const raw = n.nodeValue, t = raw.trim(); if (!t || !/[А-Яа-яЁё]/.test(t)) return;
    let en = I18N_TEXT[t];
    if (!en) { en = trWords(t); if (en === t || /[А-Яа-яЁё]/.test(en)) return; }      // 2.3: пословно — только если переведено всё (без «смеси» языков)
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
