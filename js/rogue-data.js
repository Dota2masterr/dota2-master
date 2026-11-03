// ================= «ПУТЬ ДРЕВНЕГО» — ДАННЫЕ =================
// Все числа рогалика в одном месте (как CONFIG). Названия предметов и героев — как в Dota, тексты свои.
const ROGUE = {
  hero: { hp: 560, atk: 46, init: 10, mana: 100, manaStart: 50, manaRegen: 14, ultCd: 5, ultMana: 60, critMul: 1.8 },
  attr: { str: { hp: 140, atk: 2 }, agi: { init: 4, crit: 0.08, atk: 4 }, int: { amp: 0.12, manaRegen: 4 }, uni: { hp: 60, atk: 3, init: 2, amp: 0.05 } },
  acts: 3, rows: 5,                              // 5 рядов узлов + босс = 12–15 узлов на акт
  actMul: [1, 1.5, 2.1], rowMul: 0.06,          // сила врагов: акт × (1 + 0.06·ряд)
  gold: { fight: [26, 36], elite: [62, 78], boss: 120, chest: [40, 70], start: 60 },
  restHeal: 0.4, skillUpPow: 0.25, maxSkillLv: 3,
  neutralChance: { elite: 0.35, boss: 1 },
  // награда в кристаллах: см. rogueGemReward() и docs/расчёт
  reward: { perAct: 1.2, win: 2.4, abyss: 0.12, fullPerDay: 3, overMul: 0.25 },
  shards: { perAct: 4, win: 10, abyss: 2 },
  metaCap: 0.12,                                 // стартовый бонус от основной игры — не больше +12%
  unlockHero: 30, unlockStart: 20,               // цены разблокировок в Осколках
  dailyLogMax: 3000
};
const ROGUE_POOL0 = ['juggernaut', 'axe', 'lina', 'crystal_maiden', 'sven', 'phantom_assassin', 'lion', 'pudge', 'drow_ranger', 'sniper', 'zuus', 'witch_doctor'];

// ---------- компоненты (43) ----------
// m: модификаторы. atk, hp, init, armor, crit, critMul, ls, eva, amp, manaRegen, hpRegen, mres, pierce, manaStart
const RG_COMP = {
  branches: ['Iron Branch', 15, { atk: 3, hp: 20 }], gauntlets: ['Gauntlets of Strength', 30, { hp: 45, atk: 1 }],
  slippers: ['Slippers of Agility', 30, { init: 2, atk: 3 }], mantle: ['Mantle of Intelligence', 30, { amp: 0.03, manaRegen: 1 }],
  circlet: ['Circlet', 40, { atk: 2, hp: 15, init: 1, amp: 0.01 }], ring_of_health: ['Ring of Health', 70, { hpRegen: 12 }],
  void_stone: ['Void Stone', 70, { manaRegen: 5 }], ogre_axe: ['Ogre Axe', 100, { hp: 120 }],
  blade_of_alacrity: ['Blade of Alacrity', 100, { init: 4, atk: 6 }], staff_of_wizardry: ['Staff of Wizardry', 100, { amp: 0.08 }],
  broadsword: ['Broadsword', 100, { atk: 12 }], claymore: ['Claymore', 130, { atk: 18 }],
  mithril_hammer: ['Mithril Hammer', 140, { atk: 22 }], javelin: ['Javelin', 110, { atk: 10, crit: 0.05 }],
  quarterstaff: ['Quarterstaff', 70, { atk: 8, init: 1 }], robe: ['Robe of the Magi', 40, { amp: 0.04 }],
  belt_of_strength: ['Belt of Strength', 45, { hp: 65 }], boots_of_elves: ['Band of Elvenskin', 45, { init: 3 }],
  boots: ['Boots of Speed', 50, { init: 3 }], gloves: ['Gloves of Haste', 50, { init: 2, atk: 4 }],
  ring_of_protection: ['Ring of Protection', 35, { armor: 2 }], chainmail: ['Chainmail', 55, { armor: 4 }],
  platemail: ['Platemail', 140, { armor: 9 }], helm_of_iron_will: ['Helm of Iron Will', 90, { armor: 5, hpRegen: 6 }],
  vitality_booster: ['Vitality Booster', 100, { hp: 180 }], energy_booster: ['Energy Booster', 90, { manaRegen: 4, manaStart: 20 }],
  point_booster: ['Point Booster', 120, { hp: 120, manaRegen: 3 }], hyperstone: ['Hyperstone', 160, { init: 6, atk: 8 }],
  demon_edge: ['Demon Edge', 190, { atk: 34 }], eagle: ['Eaglesong', 190, { init: 10, atk: 10 }],
  reaver: ['Reaver', 190, { hp: 260 }], mystic_staff: ['Mystic Staff', 190, { amp: 0.18 }],
  relic: ['Sacred Relic', 210, { atk: 40 }], cloak: ['Cloak', 50, { mres: 0.12 }],
  ring_of_regen: ['Ring of Regen', 30, { hpRegen: 5 }], sobi_mask: ['Sage\'s Mask', 40, { manaRegen: 3 }],
  blades_of_attack: ['Blades of Attack', 45, { atk: 6 }], wind_lace: ['Wind Lace', 30, { init: 2 }],
  crown: ['Crown', 45, { init: 1, atk: 2, hp: 20, amp: 0.02 }], lifesteal: ['Morbid Mask', 60, { ls: 0.1 }],
  blight_stone: ['Blight Stone', 35, { pierce: 2 }], talisman_of_evasion: ['Talisman of Evasion', 90, { eva: 0.12 }],
  ultimate_orb: ['Ultimate Orb', 150, { atk: 10, hp: 100, init: 2, amp: 0.05 }]
};
// ---------- собранные предметы (25) ----------
// [название, компоненты, цена рецепта, модификаторы, пути, активка, описание своими словами]
// активки: dodge (уклонение на ход), bkb (иммунитет к контролю), heal, refresh, hex, silence, illusions, aoe
const RG_ITEMS = {
  blink: ['Blink Dagger', ['boots', 'wind_lace', 'gloves'], 30, { init: 6 }, ['control'], { a: 'dodge', cd: 4 }, 'Прыжок: следующий удар врага промахнётся'],
  black_king_bar: ['Black King Bar', ['ogre_axe', 'mithril_hammer'], 40, {}, ['tank', 'control'], { a: 'bkb', cd: 6, dur: 2 }, 'Иммунитет к оглушению и безмолвию на 2 хода'],
  desolator: ['Desolator', ['mithril_hammer', 'blight_stone', 'blades_of_attack'], 30, { atk: 6, pierce: 4 }, ['crit'], null, 'Атаки пробивают броню'],
  butterfly: ['Butterfly', ['eagle', 'talisman_of_evasion', 'quarterstaff'], 40, { eva: 0.12, init: 4 }, ['crit'], null, 'Уклонение и скорость'],
  ultimate_scepter: ["Aghanim's Scepter", ['point_booster', 'ogre_axe', 'staff_of_wizardry', 'blade_of_alacrity'], 0, { ult: 0.35 }, ['magic'], null, 'Ульта сильнее на 35%'],
  greater_crit: ['Daedalus', ['demon_edge', 'blades_of_attack', 'broadsword'], 50, { crit: 0.22, critMul: 0.5 }, ['crit'], null, 'Частые и мощные криты'],
  satanic: ['Satanic', ['reaver', 'lifesteal', 'claymore'], 40, { ls: 0.12 }, ['vamp'], { a: 'heal', cd: 6, pow: 0.3 }, 'Вампиризм; актив: лечение 30%'],
  heart: ['Heart of Tarrasque', ['reaver', 'vitality_booster', 'ring_of_regen'], 60, { hpRegenPct: 0.05 }, ['tank', 'vamp'], null, 'Лечит 5% здоровья каждый ход'],
  assault: ['Assault Cuirass', ['platemail', 'hyperstone', 'chainmail'], 40, { pierce: 3 }, ['tank'], null, 'Броня и скорость, снимает броню врагов'],
  skadi: ['Eye of Skadi', ['ultimate_orb', 'point_booster', 'belt_of_strength'], 30, { slowHit: 1 }, ['control', 'tank'], null, 'Атаки замедляют'],
  monkey_king_bar: ['Monkey King Bar', ['demon_edge', 'javelin', 'quarterstaff'], 30, { trueHit: 1, crit: 0.05 }, ['crit'], null, 'Атаки не промахиваются'],
  abyssal_blade: ['Abyssal Blade', ['belt_of_strength', 'mithril_hammer', 'javelin'], 50, { bash: 0.2 }, ['control'], null, '20%: удар оглушает'],
  sange_and_yasha: ['Sange and Yasha', ['belt_of_strength', 'boots_of_elves', 'ogre_axe'], 40, { ls: 0.06, sres: 0.3 }, ['tank', 'vamp'], null, 'Контроль на тебе короче'],
  manta: ['Manta Style', ['ultimate_orb', 'boots_of_elves', 'quarterstaff'], 40, {}, ['crit'], { a: 'illusions', cd: 5, dur: 3, pow: 0.4 }, 'Иллюзии бьют вместе с тобой 3 хода'],
  bfury: ['Battle Fury', ['claymore', 'broadsword', 'ring_of_health', 'quarterstaff'], 0, { cleave: 0.35 }, ['crit'], null, 'Атаки задевают всех врагов (35%)'],
  radiance: ['Radiance', ['relic', 'talisman_of_evasion'], 50, { burn: 22 }, ['magic'], null, 'Жжёт всех врагов каждый ход'],
  shivas_guard: ["Shiva's Guard", ['platemail', 'mystic_staff'], 40, {}, ['control', 'magic'], { a: 'aoe', cd: 5, pow: 1.4, slow: 2 }, 'Волна холода: урон и замедление всем'],
  octarine_core: ['Octarine Core', ['mystic_staff', 'point_booster', 'energy_booster'], 0, { cdr: 1 }, ['magic'], null, 'Перезарядка навыков на 1 ход короче'],
  refresher: ['Refresher Orb', ['void_stone', 'sobi_mask', 'energy_booster', 'ring_of_health'], 40, {}, ['magic'], { a: 'refresh', cd: 8 }, 'Сбрасывает перезарядку всех навыков'],
  sheepstick: ['Scythe of Vyse', ['mystic_staff', 'ultimate_orb', 'void_stone'], 0, {}, ['control', 'magic'], { a: 'hex', cd: 6, dur: 2 }, 'Превращает врага в овцу на 2 хода'],
  orchid: ['Orchid Malevolence', ['staff_of_wizardry', 'sobi_mask', 'quarterstaff'], 30, {}, ['control', 'magic'], { a: 'silence', cd: 5, dur: 2 }, 'Безмолвие на 2 хода'],
  mjollnir: ['Mjollnir', ['hyperstone', 'javelin', 'gloves'], 40, { chain: 0.25 }, ['crit', 'magic'], null, '25%: молния бьёт всех врагов'],
  vanguard: ['Vanguard', ['ring_of_health', 'vitality_booster'], 0, { block: 22 }, ['tank'], null, 'Блокирует часть каждого удара'],
  mekansm: ['Mekansm', ['chainmail', 'ring_of_health', 'crown'], 30, {}, ['tank', 'vamp'], { a: 'heal', cd: 5, pow: 0.25 }, 'Актив: лечение 25%'],
  blade_mail: ['Blade Mail', ['broadsword', 'chainmail', 'robe'], 30, { reflect: 0.3 }, ['tank'], null, 'Возвращает 30% полученного урона']
};
// ---------- нейтральные предметы (редкие) ----------
const RG_NEUTRAL = {
  trusty_shovel: ['Trusty Shovel', { hpRegen: 8, goldBonus: 0.1 }, '+10% золота забега'],
  arcane_ring: ['Arcane Ring', { manaRegen: 4, armor: 2 }, 'Мана и броня'],
  faded_broach: ['Faded Broach', { init: 3, hp: 60 }, 'Скорость и здоровье'],
  grove_bow: ['Grove Bow', { atk: 10, pierce: 2 }, 'Пробивает броню'],
  quickening_charm: ['Quickening Charm', { cdr: 1 }, 'Навыки быстрее'],
  mind_breaker: ['Mind Breaker', { amp: 0.15 }, 'Сила навыков'],
  spell_prism: ['Spell Prism', { cdr: 1, manaRegen: 2 }, 'Навыки быстрее'],
  paladin_sword: ['Paladin Sword', { ls: 0.1, atk: 8 }, 'Вампиризм'],
  titan_sliver: ['Titan Sliver', { sres: 0.3, atk: 10 }, 'Стойкость к контролю'],
  ocean_heart: ['Ocean Heart', { hpRegenPct: 0.03 }, 'Лечит 3% в ход'],
  ninja_gear: ['Ninja Gear', { eva: 0.15, init: 3 }, 'Уклонение'],
  apex: ['Apex', { atk: 20, hp: 120, amp: 0.08 }, 'Всего понемногу'],
  giants_ring: ['Giant\'s Ring', { hp: 260 }, 'Много здоровья'],
  mirror_shield: ['Mirror Shield', { reflect: 0.2, armor: 3 }, 'Отражает урон']
};
// ---------- пути билда (сет-бонус за 3+ предмета одного пути) ----------
const RG_PATHS = {
  crit: { n: 'Крит', i: '💥', m: { crit: 0.15, critMul: 0.3 }, d: '+15% шанс крита, криты сильнее' },
  magic: { n: 'Магия', i: '✨', m: { amp: 0.2, cdr: 1 }, d: '+20% к навыкам, перезарядка −1' },
  tank: { n: 'Танк', i: '🛡', m: { hpPct: 0.15, armor: 4 }, d: '+15% здоровья, +4 брони' },
  control: { n: 'Контроль', i: '🌀', m: { ctrl: 1 }, d: 'Оглушения и безмолвие на 1 ход дольше' },
  vamp: { n: 'Вампиризм', i: '🩸', m: { ls: 0.12, hpRegenPct: 0.03 }, d: '+12% вампиризма, лечение 3% в ход' }
};

// ---------- враги ----------
// намерения (intent): atk N, heavy (×1.8), stun, silence, poison, buff (+30% атака), shield, heal, summon, aoe
const RG_ENEMY = {
  kobold: { n: 'Кобольд', ic: '🐀', hp: 150, atk: 16, init: 9, p: ['atk', 'atk', 'heavy'] },
  wolf: { n: 'Волк', ic: '🐺', hp: 190, atk: 20, init: 13, p: ['atk', 'heavy', 'atk'] },
  satyr: { n: 'Сатир-мистик', ic: '😈', hp: 170, atk: 15, init: 8, p: ['atk', 'silence', 'heal'] },
  troll: { n: 'Тролль-знахарь', ic: '🧌', hp: 230, atk: 18, init: 7, p: ['atk', 'heal', 'atk', 'poison'] },
  ogre: { n: 'Огр-громила', ic: '👹', hp: 320, atk: 24, init: 5, p: ['atk', 'stun', 'heavy'] },
  harpy: { n: 'Гарпия', ic: '🦅', hp: 150, atk: 18, init: 14, p: ['atk', 'atk', 'poison'] },
  golem: { n: 'Каменный голем', ic: '🗿', hp: 420, atk: 22, init: 4, p: ['shield', 'heavy', 'atk'] },
  centaur: { n: 'Кентавр-завоеватель', ic: '🐎', hp: 480, atk: 30, init: 9, p: ['atk', 'stun', 'heavy', 'buff'], elite: 1 },
  alpha: { n: 'Альфа-волк', ic: '🐺', hp: 420, atk: 34, init: 15, p: ['buff', 'heavy', 'atk', 'heavy'], elite: 1 },
  dark_troll: { n: 'Тёмный тролль-призыватель', ic: '💀', hp: 450, atk: 26, init: 8, p: ['summon', 'atk', 'poison', 'atk'], elite: 1 },
  lizard: { n: 'Громовой ящер', ic: '🦎', hp: 520, atk: 30, init: 6, p: ['aoe', 'atk', 'stun', 'atk'], elite: 1 },
  skeleton: { n: 'Скелет', ic: '☠', hp: 110, atk: 14, init: 10, p: ['atk'] },
  treant_s: { n: 'Трент', ic: '🌳', hp: 90, atk: 12, init: 6, p: ['atk', 'atk'] },
  rosh_pup: { n: 'Миньон Рошана', ic: '🦍', hp: 380, atk: 28, init: 7, p: ['heavy', 'atk', 'shield'], elite: 1 },
  // боссы актов
  treant: { n: 'Лесной древень', ic: '🌲', img: 'treant', hp: 800, atk: 26, init: 6, p: ['summon', 'atk', 'heavy', 'atk', 'stun'], boss: 'treant' },
  roshan: { n: 'Рошан', ic: '🦍', img: 'roshan', hp: 600, atk: 25, init: 8, p: ['atk', 'heavy', 'atk', 'aoe', 'buff'], boss: 'roshan' },
  ancient: { n: 'Древний Dire', ic: '🏛', img: 'ancient', hp: 1000, atk: 26, init: 7, p: ['atk', 'aoe', 'atk', 'heavy', 'silence'], boss: 'ancient' }
};
const RG_ACT = [
  { n: 'Лес Radiant', bg: 'g-jungle', fights: [['kobold', 'kobold'], ['wolf'], ['satyr', 'kobold'], ['harpy', 'harpy'], ['troll'], ['wolf', 'kobold']], elites: [['centaur'], ['alpha'], ['dark_troll']], boss: 'treant' },
  { n: 'Река и логово Рошана', bg: 'g-bot', fights: [['ogre'], ['golem'], ['satyr', 'troll'], ['harpy', 'wolf'], ['skeleton', 'skeleton', 'skeleton'], ['ogre', 'kobold']], elites: [['rosh_pup'], ['lizard'], ['rosh_pup', 'skeleton']], boss: 'roshan' },
  { n: 'Цитадель Dire', bg: 'g-mid', fights: [['golem', 'satyr'], ['ogre', 'harpy'], ['skeleton', 'skeleton', 'troll'], ['alpha'], ['centaur'], ['lizard']], elites: [['centaur', 'satyr'], ['dark_troll', 'skeleton'], ['alpha', 'wolf']], boss: 'ancient' }
];
const RG_INTENT = {
  atk: { i: '⚔', n: 'Атака', c: '#ff8a6a' }, heavy: { i: '🗡', n: 'Сильный удар', c: '#ff4a3a' }, stun: { i: '💫', n: 'Оглушение', c: '#7ad3ff' },
  silence: { i: '🤐', n: 'Безмолвие', c: '#c8a4ff' }, poison: { i: '☠', n: 'Яд', c: '#7ad35a' }, buff: { i: '⬆', n: 'Усиление', c: '#ffb84a' },
  shield: { i: '🛡', n: 'Щит', c: '#ffd36a' }, heal: { i: '💚', n: 'Лечение', c: '#6cff7a' }, summon: { i: '👥', n: 'Призыв', c: '#9ad8ff' }, aoe: { i: '💥', n: 'Удар по всем', c: '#ff5a3a' }
};
// ---------- Уровни Бездны (0–10) — каждый добавляет врагам модификатор ----------
const RG_ABYSS = [
  { d: 'Обычная сложность' },
  { d: 'Враги: +10% здоровья', hp: 0.1 },
  { d: 'Враги: +10% урона', atk: 0.1 },
  { d: 'Элиты встречаются чаще', elite: 1 },
  { d: 'Лечение у фонтана −50%', rest: 0.5 },
  { d: 'Враги: ещё +10% здоровья', hp: 0.1 },
  { d: 'Цены в лавке +20%', price: 0.2 },
  { d: 'Враги: ещё +10% урона', atk: 0.1 },
  { d: 'Боссы: +25% здоровья', boss: 0.25 },
  { d: 'Начинаешь с 80% здоровья', startHp: 0.2 },
  { d: 'Враги ходят быстрее (+3 инициативы)', init: 3 }
];
// ---------- события (16) ----------
// выбор: e (эффекты) или ch (шанс) + ok/no. Эффекты: gold, hp (доля от макс.), maxhp, comp (случайный компонент),
// item (случайный предмет), neutral, skill (улучшение навыка), fight (бой), curse (−атака), atk
const RG_EVENTS = [
  { id: 'goblin', t: 'Торговец-гоблин', d: 'Гоблин с тележкой хитро щурится: «Сундук без замка — всего за 60 золота. Внутри что-то ценное… наверное».',
    c: [{ t: 'Купить сундук (60 💰)', cost: 60, ch: 0.65, ok: { item: 1 }, no: { gold: 10 }, okT: 'Внутри настоящий предмет!', noT: 'Пусто. Гоблин бросил тебе 10 монет «на сдачу».' }, { t: 'Пройти мимо', e: {} }] },
  { id: 'shadow', t: 'Алтарь Тени', d: 'Чёрный камень шепчет: «Отдай часть жизни — получишь силу».',
    c: [{ t: 'Отдать 20% здоровья', e: { hp: -0.2, atk: 8 }, okT: 'Атака +8 до конца забега.' }, { t: 'Уйти', e: {} }] },
  { id: 'courier', t: 'Курьер потерялся', d: 'Курьер кружит у реки с чужими вещами и не помнит, кому их нёс.',
    c: [{ t: 'Помочь найти хозяина', e: { gold: 45 }, okT: 'Хозяин щедро отблагодарил.' }, { t: 'Забрать посылку себе', ch: 0.5, ok: { comp: 2 }, no: { hp: -0.15 }, okT: 'Две полезные вещи!', noT: 'Курьер оказался кусачим.' }] },
  { id: 'fountain', t: 'Забытый фонтан', d: 'Вода светится мягким светом. На краю — монеты прошлых путников.',
    c: [{ t: 'Испить воды', e: { hp: 0.3 } }, { t: 'Собрать монеты', e: { gold: 35 } }] },
  { id: 'rune', t: 'Руна на развилке', d: 'В кустах пульсирует руна. Неизвестно какая.',
    c: [{ t: 'Взять руну', ch: 0.75, ok: { skill: 1 }, no: { hp: -0.12 }, okT: 'Руна усилила твой навык!', noT: 'Это была ловушка Течиса.' }, { t: 'Не трогать', e: {} }] },
  { id: 'shrine', t: 'Святилище', d: 'Старое святилище ещё хранит силу. Можно помолиться или забрать подношения.',
    c: [{ t: 'Помолиться', e: { maxhp: 60, hp: 0.1 } }, { t: 'Забрать подношения', e: { gold: 60, hp: -0.1 } }] },
  { id: 'smith', t: 'Кузнец-отшельник', d: '«Дай мне 50 золота — и твой клинок станет острее».',
    c: [{ t: 'Заплатить 50 💰', cost: 50, e: { atk: 10 } }, { t: 'Отказаться', e: {} }] },
  { id: 'camp', t: 'Лагерь нейтралов', d: 'Крипы спят у костра. Рядом лежит их добыча.',
    c: [{ t: 'Напасть', e: { fight: 1, gold: 40 }, okT: 'Бой!' }, { t: 'Тихо стащить добычу', ch: 0.5, ok: { comp: 1, gold: 20 }, no: { fight: 1 }, noT: 'Они проснулись!' }] },
  { id: 'tome', t: 'Книга знаний', d: 'На пне лежит древняя книга, страницы шуршат сами.',
    c: [{ t: 'Прочитать', e: { skill: 1 } }, { t: 'Продать коллекционеру', e: { gold: 50 } }] },
  { id: 'gamble', t: 'Игра в кости с сатиром', d: '«Ставишь 40 — удвою. Или проиграешь», — ухмыляется сатир.',
    c: [{ t: 'Сыграть (40 💰)', cost: 40, ch: 0.5, ok: { gold: 90 }, no: {}, okT: 'Выигрыш!', noT: 'Сатир смеётся и исчезает с деньгами.' }, { t: 'Не играть', e: {} }] },
  { id: 'wounded', t: 'Раненый разведчик', d: 'Разведчик Radiant просит зелье. У тебя его нет — только часть сил.',
    c: [{ t: 'Поделиться силами (−15% здоровья)', e: { hp: -0.15, neutral: 1 }, okT: 'В благодарность он отдал редкую находку.' }, { t: 'Оставить', e: {} }] },
  { id: 'mirror', t: 'Озеро-зеркало', d: 'В отражении — ты, только сильнее. Отражение протягивает руку.',
    c: [{ t: 'Коснуться', ch: 0.6, ok: { maxhp: 80, atk: 5 }, no: { curse: 6 }, okT: 'Ты стал крепче.', noT: 'Отражение забрало часть силы: атака −6.' }, { t: 'Отвернуться', e: {} }] },
  { id: 'cache', t: 'Тайник Radiant', d: 'Под корнями дерева — ящик со снаряжением.',
    c: [{ t: 'Открыть', e: { comp: 1, gold: 15 } }] },
  { id: 'bounty', t: 'Охотник за головами', d: 'Охотник предлагает работу: убить элитного врага за награду.',
    c: [{ t: 'Взяться', e: { elite: 1, gold: 80 }, okT: 'Бой с элитой!' }, { t: 'Отказаться', e: {} }] },
  { id: 'thief', t: 'Воришка', d: 'Кто-то уже лезет в твой кошель!',
    c: [{ t: 'Догнать', ch: 0.6, ok: { gold: 30 }, no: { gold: -30, hp: -0.05 }, okT: 'Догнал и забрал его добычу.', noT: 'Убежал с частью золота.' }, { t: 'Отпустить (−20 💰)', e: { gold: -20 } }] },
  { id: 'well', t: 'Колодец желаний', d: 'Брось монету и загадай желание.',
    c: [{ t: 'Бросить 30 💰', cost: 30, ch: 0.7, ok: { hp: 0.5 }, no: {}, okT: 'Раны затянулись.', noT: 'Ничего не произошло.' }, { t: 'Пройти', e: {} }] }
];
// ---------- реплики (свои тексты) ----------
const RG_LINES = {
  intro: { carry: 'Сегодня мой клинок дойдёт до самого Древнего.', support: 'Пусть путь долгий — я не дам ему меня сломить.', nuker: 'Огонь, лёд, молнии… посмотрим, что выдержит тьма.', initiator: 'Первым вхожу, последним выхожу. Как всегда.', tank: 'Пусть бьют. Я крепче этих стен.' },
  boss: {
    treant: ['Земля под ногами задрожала. Деревья расступились, пропуская хозяина леса.', 'Лесной древень: «Ты рубил мои ветви всю дорогу. Теперь мой черёд».'],
    roshan: ['В логове пахнет сыром и старой кровью. Что-то огромное ворочается во тьме.', 'Рошан не говорит. Он ревёт — и стены пещеры отвечают эхом.'],
    ancient: ['Цитадель Dire. Камень здесь тёплый, будто живой.', 'Древний пробуждается: «Ни один герой не доходил так далеко. И ни один не уйдёт»'] },
  win: 'Древний Dire рушится. Над Цитаделью впервые за века встаёт рассвет. Легенду о твоём пути будут пересказывать у каждого фонтана.',
  lose: 'Путь оборвался. Но Древний знает: ты вернёшься — и в следующий раз дойдёшь дальше.'
};
