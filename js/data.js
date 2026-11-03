// ================= DATA =================
const CSM = 'https://s-wiki.cs.money/data/dota/panorama/images/';   // wiki.cs.money
const STEAM = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/';
// 2.3: валюта — оранжевые кристаллы (как осколки в Dota)
const GEM_IMG = "data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2064%2064%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27a%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23ffe2a0%27/%3E%3Cstop%20offset%3D%27.45%27%20stop-color%3D%27%23ff9a2a%27/%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23b84a08%27/%3E%3C/linearGradient%3E%3ClinearGradient%20id%3D%27b%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%270%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23fff6d8%27/%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ffb84a%27/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath%20d%3D%27M32%203%20L54%2022%20L32%2061%20L10%2022%20Z%27%20fill%3D%27url%28%23a%29%27%20stroke%3D%27%235a2404%27%20stroke-width%3D%272.5%27/%3E%3Cpath%20d%3D%27M32%203%20L42%2022%20L32%2061%20L22%2022%20Z%27%20fill%3D%27url%28%23b%29%27%20opacity%3D%27.55%27/%3E%3Cpath%20d%3D%27M10%2022%20H54%27%20stroke%3D%27%237a3406%27%20stroke-width%3D%272%27/%3E%3Cpath%20d%3D%27M22%2022%20L32%203%20L42%2022%27%20fill%3D%27none%27%20stroke%3D%27%23fff%27%20stroke-width%3D%271.5%27%20opacity%3D%27.7%27/%3E%3C/svg%3E";
const ATTR_ICON = {
  str: STEAM + 'icons/hero_strength.png', agi: STEAM + 'icons/hero_agility.png',
  int: STEAM + 'icons/hero_intelligence.png', uni: STEAM + 'icons/hero_universal.png'
};
const ATTR_NAME = { str: 'Сила', agi: 'Ловкость', int: 'Интеллект', uni: 'Универсальные' };
const ATTR_COLOR = { str: '#e0453a', agi: '#3fbf4f', int: '#3aa4e0', uni: '#c9a64a' };

const HEROES = [
  {id:'abaddon',name:'Abaddon'},{id:'alchemist',name:'Alchemist'},{id:'ancient_apparition',name:'Ancient Apparition'},
  {id:'antimage',name:'Anti-Mage'},{id:'arc_warden',name:'Arc Warden'},{id:'axe',name:'Axe'},
  {id:'bane',name:'Bane'},{id:'batrider',name:'Batrider'},{id:'beastmaster',name:'Beastmaster'},
  {id:'bloodseeker',name:'Bloodseeker'},{id:'bounty_hunter',name:'Bounty Hunter'},{id:'brewmaster',name:'Brewmaster'},
  {id:'bristleback',name:'Bristleback'},{id:'broodmother',name:'Broodmother'},{id:'centaur',name:'Centaur Warrunner'},
  {id:'chaos_knight',name:'Chaos Knight'},{id:'chen',name:'Chen'},{id:'clinkz',name:'Clinkz'},
  {id:'crystal_maiden',name:'Crystal Maiden'},{id:'dark_seer',name:'Dark Seer'},{id:'dark_willow',name:'Dark Willow'},
  {id:'dawnbreaker',name:'Dawnbreaker'},{id:'dazzle',name:'Dazzle'},{id:'death_prophet',name:'Death Prophet'},
  {id:'disruptor',name:'Disruptor'},{id:'doom_bringer',name:'Doom'},{id:'dragon_knight',name:'Dragon Knight'},
  {id:'drow_ranger',name:'Drow Ranger'},{id:'earth_spirit',name:'Earth Spirit'},{id:'earthshaker',name:'Earthshaker'},
  {id:'elder_titan',name:'Elder Titan'},{id:'ember_spirit',name:'Ember Spirit'},{id:'enchantress',name:'Enchantress'},
  {id:'enigma',name:'Enigma'},{id:'faceless_void',name:'Faceless Void'},{id:'furion',name:"Nature's Prophet"},
  {id:'grimstroke',name:'Grimstroke'},{id:'gyrocopter',name:'Gyrocopter'},{id:'hoodwink',name:'Hoodwink'},
  {id:'huskar',name:'Huskar'},{id:'invoker',name:'Invoker'},{id:'jakiro',name:'Jakiro'},
  {id:'juggernaut',name:'Juggernaut'},{id:'keeper_of_the_light',name:'Keeper of the Light'},{id:'kunkka',name:'Kunkka'},
  {id:'legion_commander',name:'Legion Commander'},{id:'leshrac',name:'Leshrac'},{id:'lich',name:'Lich'},
  {id:'life_stealer',name:'Lifestealer'},{id:'lina',name:'Lina'},{id:'lion',name:'Lion'},
  {id:'lone_druid',name:'Lone Druid'},{id:'luna',name:'Luna'},{id:'lycan',name:'Lycan'},
  {id:'magnataur',name:'Magnus'},{id:'marci',name:'Marci'},{id:'mars',name:'Mars'},
  {id:'medusa',name:'Medusa'},{id:'meepo',name:'Meepo'},{id:'mirana',name:'Mirana'},
  {id:'monkey_king',name:'Monkey King'},{id:'morphling',name:'Morphling'},{id:'muerta',name:'Muerta'},
  {id:'naga_siren',name:'Naga Siren'},{id:'necrolyte',name:'Necrophos'},{id:'nevermore',name:'Shadow Fiend'},
  {id:'night_stalker',name:'Night Stalker'},{id:'nyx_assassin',name:'Nyx Assassin'},{id:'ogre_magi',name:'Ogre Magi'},
  {id:'omniknight',name:'Omniknight'},{id:'oracle',name:'Oracle'},{id:'obsidian_destroyer',name:'Outworld Devourer'},
  {id:'pangolier',name:'Pangolier'},{id:'phantom_assassin',name:'Phantom Assassin'},{id:'phantom_lancer',name:'Phantom Lancer'},
  {id:'phoenix',name:'Phoenix'},{id:'primal_beast',name:'Primal Beast'},{id:'puck',name:'Puck'},
  {id:'pudge',name:'Pudge'},{id:'pugna',name:'Pugna'},{id:'queenofpain',name:'Queen of Pain'},
  {id:'rattletrap',name:'Clockwerk'},{id:'razor',name:'Razor'},{id:'riki',name:'Riki'},
  {id:'rubick',name:'Rubick'},{id:'sand_king',name:'Sand King'},{id:'shadow_demon',name:'Shadow Demon'},
  {id:'shadow_shaman',name:'Shadow Shaman'},{id:'shredder',name:'Timbersaw'},{id:'silencer',name:'Silencer'},
  {id:'skeleton_king',name:'Wraith King'},{id:'skywrath_mage',name:'Skywrath Mage'},{id:'slardar',name:'Slardar'},
  {id:'slark',name:'Slark'},{id:'snapfire',name:'Snapfire'},{id:'sniper',name:'Sniper'},
  {id:'spectre',name:'Spectre'},{id:'spirit_breaker',name:'Spirit Breaker'},{id:'storm_spirit',name:'Storm Spirit'},
  {id:'sven',name:'Sven'},{id:'techies',name:'Techies'},{id:'templar_assassin',name:'Templar Assassin'},
  {id:'terrorblade',name:'Terrorblade'},{id:'tidehunter',name:'Tidehunter'},{id:'tinker',name:'Tinker'},
  {id:'tiny',name:'Tiny'},{id:'treant',name:'Treant Protector'},{id:'troll_warlord',name:'Troll Warlord'},
  {id:'tusk',name:'Tusk'},{id:'abyssal_underlord',name:'Underlord'},{id:'undying',name:'Undying'},
  {id:'ursa',name:'Ursa'},{id:'vengefulspirit',name:'Vengeful Spirit'},{id:'venomancer',name:'Venomancer'},
  {id:'viper',name:'Viper'},{id:'visage',name:'Visage'},{id:'void_spirit',name:'Void Spirit'},
  {id:'warlock',name:'Warlock'},{id:'weaver',name:'Weaver'},{id:'windrunner',name:'Windranger'},
  {id:'winter_wyvern',name:'Winter Wyvern'},{id:'wisp',name:'Io'},{id:'witch_doctor',name:'Witch Doctor'},
  {id:'zuus',name:'Zeus'},{id:'ringmaster',name:'Ringmaster'},{id:'kez',name:'Kez'},{id:'largo',name:'Largo'}
];
const ATTRS = {
  str: 'alchemist axe bristleback centaur chaos_knight dawnbreaker doom_bringer dragon_knight earth_spirit earthshaker elder_titan huskar kunkka legion_commander life_stealer mars night_stalker ogre_magi omniknight primal_beast pudge slardar spirit_breaker sven tidehunter tiny treant tusk abyssal_underlord undying skeleton_king rattletrap lycan shredder phoenix largo',
  agi: 'antimage bloodseeker bounty_hunter clinkz drow_ranger ember_spirit faceless_void gyrocopter hoodwink juggernaut kez luna medusa meepo monkey_king morphling naga_siren phantom_assassin phantom_lancer razor riki nevermore slark sniper spectre templar_assassin terrorblade troll_warlord ursa viper weaver vengefulspirit mirana broodmother lone_druid',
  int: 'ancient_apparition crystal_maiden disruptor enchantress grimstroke jakiro keeper_of_the_light leshrac lich lina lion muerta necrolyte oracle obsidian_destroyer puck pugna queenofpain ringmaster rubick shadow_demon shadow_shaman silencer skywrath_mage storm_spirit tinker warlock witch_doctor zuus dark_seer chen invoker winter_wyvern dark_willow'
};
const RANGED = new Set(('ancient_apparition arc_warden bane batrider chen clinkz crystal_maiden dark_willow dazzle death_prophet disruptor drow_ranger enchantress enigma grimstroke gyrocopter hoodwink huskar invoker wisp jakiro keeper_of_the_light leshrac lich lina lion luna medusa mirana morphling muerta furion necrolyte oracle obsidian_destroyer phoenix puck pugna queenofpain razor ringmaster rubick shadow_demon shadow_shaman silencer skywrath_mage sniper snapfire storm_spirit techies templar_assassin tinker venomancer viper visage warlock weaver windrunner winter_wyvern witch_doctor zuus nevermore vengefulspirit lone_druid troll_warlord').split(' '));
HEROES.forEach(h => {
  h.attr = 'uni';
  for (const a of ['str','agi','int']) if (ATTRS[a].split(' ').includes(h.id)) h.attr = a;
  h.ranged = RANGED.has(h.id);
  let x = 0; for (const c of h.id) x = (x * 31 + c.charCodeAt(0)) >>> 0;
  h.hue = x % 360;
});
const HERO_BY_ID = Object.fromEntries(HEROES.map(h => [h.id, h]));

// cs.money не хранит портреты нескольких новых героев — для них Steam CDN
const CSM_MISSING = new Set(['muerta','kez','ringmaster','largo']);
function heroImg(id) { return CSM_MISSING.has(id) ? STEAM + 'heroes/' + id + '.png' : CSM + 'heroes/npc_dota_hero_' + id + '_png.png'; }
function heroTall(id) { return CSM_MISSING.has(id) ? STEAM + 'heroes/' + id + '.png' : CSM + 'heroes/selection/npc_dota_hero_' + id + '_png.png'; }
function heroIcon(id) { return CSM_MISSING.has(id) ? STEAM + 'heroes/icons/' + id + '.png' : CSM + 'heroes/icons/npc_dota_hero_' + id + '_png.png'; }
function spellIcon(name) { return CSM + 'spellicons/' + name + '_png.png'; }
function itemImg(path) { return CSM + 'econ/' + path; }

function placeholderSVG(name, color) {
  name = String(name || '?').replace(/[\uD800-\uDFFF]/g, '');   // эмодзи и обрывки пар — убираем (иначе encodeURIComponent падает)
  const initials = name.split(/[\s'-]+/).map(w => w[0] || '').join('').slice(0, 3).toUpperCase();
  const safe = name.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
  const bg = color || '#3a2a1a';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="144" viewBox="0 0 256 144"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + bg + '"/><stop offset="100%" stop-color="#0b0f14"/></linearGradient></defs><rect width="256" height="144" fill="url(#g)"/><circle cx="128" cy="58" r="36" fill="rgba(0,0,0,0.35)" stroke="rgba(200,164,90,0.6)" stroke-width="2"/><text x="128" y="68" text-anchor="middle" font-family="Georgia,serif" font-size="28" font-weight="700" fill="#e8c77a">' + initials + '</text><text x="128" y="122" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#e6edf3">' + safe + '</text></svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
// универсальный загрузчик картинки с цепочкой запасных адресов
function setImg(img, urls, name) {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  let i = 0;
  img.onerror = function () {
    i++;
    if (i < list.length) img.src = list[i];
    else { img.onerror = null; img.classList.remove('skel'); img.src = placeholderSVG(name); }
  };
  img.src = list[0] || placeholderSVG(name);
}
// Steam CDN — основной источник портретов (стабильнее), cs.money — запасной
function heroImgChain(id) { return [STEAM + 'heroes/' + id + '.png', CSM + 'heroes/npc_dota_hero_' + id + '_png.png']; }
function heroTallChain(id) { return [heroTall(id), STEAM + 'heroes/' + id + '.png', heroImg(id)]; }
function mkImg(urls, name, cls) {
  const img = document.createElement('img');
  if (cls) img.className = cls;
  img.alt = name || '';
  img.loading = 'lazy';
  img.referrerPolicy = 'no-referrer';
  img.classList.add('skel');                                   // мерцающая заглушка, пока грузится
  img.addEventListener('load', () => img.classList.remove('skel'));
  setImg(img, urls, name);
  return img;
}

const RARITIES = ['common','uncommon','rare','mythical','immortal','arcana'];
const RARITY_NAMES = { common:'Common', uncommon:'Uncommon', rare:'Rare', mythical:'Mythical', immortal:'Immortal', arcana:'Arcana' };
const RARITY_COLOR = { common:'#b0c3d9', uncommon:'#5e98d9', rare:'#4b69ff', mythical:'#8847ff', immortal:'#e4ae39', arcana:'#ade55c' };

// ---- Реальные предметы с wiki.cs.money/dota (название, герой, картинка, редкость) ----
const CS_ITEMS_RAW = {
  arcana: [
    ['Frost Avalanche','crystal_maiden','heroes/crystal_maiden/crystal_maiden_arcana_back2_png.png'],
    ['Dread Retribution','drow_ranger','items/drow/dread_retribution/drow_arcana_weapon_png.png'],
    ['Dread Retribution - Headwear','drow_ranger','items/drow/dread_retribution/drow_arcana_head_png.png'],
    ['Dread Retribution - Shoulder Armor','drow_ranger','items/drow/dread_retribution/drow_arcana_shoulder_png.png'],
    ['Dread Retribution - Cape','drow_ranger','items/drow/dread_retribution/drow_arcana_back_png.png'],
    ['Dread Retribution - Bracers','drow_ranger','items/drow/dread_retribution/drow_arcana_arms_png.png'],
    ['Dread Retribution - Leg Armor','drow_ranger','items/drow/dread_retribution/drow_arcana_legs_png.png'],
    ['Dread Retribution - Quiver','drow_ranger','items/drow/dread_retribution/drow_arcana_quiver_png.png'],
    ['Planetfall','earthshaker','items/earthshaker/arcana/earthshaker_arcana_png.png'],
    ['Claszian Apostasy Head','faceless_void','items/faceless_void/faceless_void_arcana/faceless_void_arcana_png.png'],
    ['Bladeform Legacy','juggernaut','items/juggernaut/arcana/juggernaut_arcana_mask_style1_png.png'],
    ['Blades of Voth Domosh','legion_commander','items/legion_commander/demon_sword_png.png'],
    ['Fiery Soul of the Slayer','lina','items/lina/origins_flamehair/origins_flamehair_png.png'],
    ["Great Sage's Reckoning",'monkey_king','items/monkey_king/monkey_king_arcana_head/monkey_king_arcana_png.png'],
    ["Flockheart's Gamble",'ogre_magi','items/ogre_magi/ogre_magi_arcana/ogre_magi_arcana_head_png.png'],
    ['Manifold Paradox','phantom_assassin','items/phantom_assassin/manifold_paradox/arcana_pa_png.png'],
    ['Feast of Abscession','pudge','items/pudge/arcana/pudge_arcana_back_png.png'],
    ['Eminence of Ristul','queenofpain','items/queenofpain/queenofpain_arcana/queenofpain_arcana_png.png'],
    ['Grace of the Eminence of Ristul','queenofpain','items/queenofpain/queenofpain_arcana/queenofpain_arcana_dagger_png.png'],
    ['Raiments of the Eminence of Ristul','queenofpain','items/queenofpain/queenofpain_arcana/queenofpain_arcana_armor_legacy_png.png'],
    ['Crown of the Eminence of Ristul','queenofpain','items/queenofpain/queenofpain_arcana/queenofpain_arcana_head_png.png'],
    ['Magus Cypher','rubick','items/rubick/arcana/magus_cypher_png.png'],
    ['Demon Eater','nevermore','items/nevermore/shadowfiend_demon_eater_png.png']
  ],
  immortal: [
    ['Dragonclaw Hook','pudge','items/pudge/pudge_skeleton_hook_body_png.png'],
    ['Whalehook','pudge','items/pudge/whale_hook_png.png'],
    ['Golden Scavenging Guttleslug','pudge','items/pudge/immortal_arm/immortal_arm1_png.png'],
    ["Ripper's Reel",'pudge','items/pudge/harpoon_hook/mesh/harpoon_hook_png.png'],
    ['Mace of the Chosen','abaddon','items/abaddon/feathers/feathers_weapon_png.png'],
    ['Eternal Radiance Blades','alchemist','items/alchemist/eternal_radiance_blades/eternal_radiance_blades_png.png'],
    ['Midas Knuckles','alchemist','items/alchemist/midas_knuckles/midas_knuckles_png.png'],
    ["Razzil's Midas Knuckles",'alchemist','items/alchemist/razzils_midas_knuckles/razzils_midas_knuckles_png.png'],
    ['Shatterblast Crown','ancient_apparition','items/ancient_apparition/shatterblast_crown/shatterblast_crown2_png.png'],
    ['Shatterblast Core','ancient_apparition','items/ancient_apparition/ancient_apparation_ti8/ancient_apparation_ti8_png.png'],
    ['Shatterblast Rule','ancient_apparition','items/ancient_apparition/aa_2021_immortal/aa_2021_immortal_png.png'],
    ['Golden Offhand Basher of Mage Skulls','antimage','items/antimage/skullbasher_gold_offhand/skullbasher_gold_offhand1_png.png'],
    ['Golden Basher of Mage Skulls','antimage','items/antimage/skullbasher_gold/skullbasher_gold1_png.png'],
    ['Basher of Mage Skulls','antimage','items/antimage/skullbasher/skullbasher1_png.png'],
    ['Offhand Basher of Mage Skulls','antimage','items/antimage/skullbasher_offhand/skullbasher_offhand1_png.png'],
    ['Origins of Faith','antimage','items/antimage/ti7_antimage_immortal/ti7_immortal_armor_png.png'],
    ['Golden Origins of Faith','antimage','items/antimage/ti7_antimage_immortal/ti7_immortal_armor1_png.png'],
    ['Wraithbinder','arc_warden','items/arc_warden/aw_ti9_immortal_shoulders/aw_ti9_immortal_shoulders_png.png'],
    ['Rampant Outrage','axe','items/axe/shout_mask/shout_mask_png.png'],
    ['Molten Claw','axe','items/axe/molten_claw/molten_claw_png.png'],
    ['Mantle of the Cinder Baron','axe','items/axe/axe_mantle_of_the_cinder_baron/axe_mantle_of_the_cinder_baron_png.png'],
    ['Crucible of Rile','axe','items/axe/axe_ti9_immortal_head/axe_ti9_immortal_head_png.png'],
    ['Fists of Axe Unleashed','axe','items/axe/ti9_jungle_axe/ti9_jungle_axe_weapon_png.png'],
    ['Torso of Axe Unleashed','axe','items/axe/ti9_jungle_axe/ti9_jungle_axe_armor_png.png']
  ],
  mythical: [
    ["Phantom's Reaper",'abaddon','items/abaddon/phantoms_reaper/phantoms_reaper_png.png'],
    ['Rimeheart the Doom Stallion','abaddon','items/abaddon/mount_drake_evercold/mount_drake_evercold_png.png'],
    ['Endless Night Sword','abaddon','items/abaddon/abaddon_endless_night_weapon/abaddon_endless_night_weapon_png.png'],
    ['Endless Night Head','abaddon','items/abaddon/abaddon_endless_night_head/abaddon_endless_night_head_png.png'],
    ['Endless Night Cape','abaddon','items/abaddon/abaddon_endless_night_back/abaddon_endless_night_back_png.png'],
    ['Endless Night Shoulder','abaddon','items/abaddon/abaddon_endless_night_shoulder/abaddon_endless_night_shoulder_png.png'],
    ['Endless Night Mount','abaddon','items/abaddon/abaddon_endless_night_mount/abaddon_endless_night_mount_png.png'],
    ['Scythe of the Everblack','abaddon','items/abaddon/ti9_cache_abbaddon_everblack_weapon/ti9_cache_abbaddon_everblack_weapon_png.png'],
    ['Hood of the Everblack','abaddon','items/abaddon/ti9_cache_abbaddon_everblack_head/ti9_cache_abbaddon_everblack_head_png.png'],
    ['Pauldrons of the Everblack','abaddon','items/abaddon/ti9_cache_abbaddon_everblack_shoulder/ti9_cache_abbaddon_everblack_shoulder_png.png'],
    ['Cape of the Everblack','abaddon','items/abaddon/ti9_cache_abbaddon_everblack_back/ti9_cache_abbaddon_everblack_back_png.png'],
    ['Mount of the Everblack','abaddon','items/abaddon/ti9_cache_abbaddon_everblack_mount/ti9_cache_abbaddon_everblack_mount_png.png'],
    ['Trenchknight - Weapon','abaddon','items/abaddon/knight_of_the_abyss_weapon/knight_of_the_abyss_weapon_png.png'],
    ['Trenchknight - Shoulder','abaddon','items/abaddon/knight_of_the_abyss_shoulder/knight_of_the_abyss_shoulder_png.png'],
    ['Trenchknight - Mount','abaddon','items/abaddon/knight_of_the_abyss_mount/knight_of_the_abyss_mount_png.png'],
    ['Trenchknight - Head','abaddon','items/abaddon/knight_of_the_abyss_head/knight_of_the_abyss_head_png.png'],
    ['Trenchknight - Back','abaddon','items/abaddon/knight_of_the_abyss_back/knight_of_the_abyss_back_png.png'],
    ['Blightfall - Back','abaddon','items/abaddon/soul_of_darkness_back/soul_of_darkness_back_png.png'],
    ['Blightfall - Head','abaddon','items/abaddon/soul_of_darkness_head/soul_of_darkness_head_png.png'],
    ['Blightfall - Mount','abaddon','items/abaddon/soul_of_darkness_mount/soul_of_darkness_mount_png.png']
  ],
  rare: [
    ['Mistblade','abaddon','items/abaddon/mistblade/mistblade_png.png'],
    ['Netherax, Nightmare of the Mist','abaddon','items/abaddon/netherax_nightmare_of_the_mist/netherax_nightmare_of_the_mist_png.png'],
    ['Hollow Ripper','abaddon','items/abaddon/hollow_ripper/hollow_ripper_png.png'],
    ['Grudge in the Mist','abaddon','items/abaddon/grudge_in_the_mist/grudge_in_the_mist_png.png'],
    ['Death Shroud of the Frozen Apostle','abaddon','items/abaddon/cape_drake_evercold/cape_drake_evercold_png.png'],
    ['Horned Helm of the Frozen Apostle','abaddon','items/abaddon/head_drake_evercold/head_drake_evercold_png.png'],
    ['Drake Guard of the Frozen Apostle','abaddon','items/abaddon/shoulder_drake_evercold/shoulder_drake_evercold_png.png'],
    ['Twisted Ghostblade of the Frozen Apostle','abaddon','items/abaddon/weapon_ravelord/weapon_ravelord_png.png'],
    ['Hood of the Font Guard','abaddon','items/abaddon/hood_of_the_font_guard/hood_of_the_font_guard_png.png'],
    ['Iceshard','abaddon','items/abaddon/sword_iceshard/sword_iceshard_png.png'],
    ['Mistbreaker','abaddon','items/abaddon/weapon_foxc/weapon_foxc_png.png'],
    ['Dreadsteed of Avernus','abaddon','items/abaddon/abamount/abamount_png.png'],
    ['Soulhoof','abaddon','items/abaddon/soulhoof/soulhoof_png.png'],
    ['Warhorse of the Demonic Vessel','abaddon','items/abaddon/alliance_abba_mount/alliance_abba_mount_png.png'],
    ['Demon Edge','abaddon','items/abaddon/demonedge_weapon/demonedge_weapon_png.png'],
    ["Emissary's Blade",'abaddon','items/abaddon/emissaryblade_weapon/emissaryblade_weapon_png.png'],
    ['Nightsbane','abaddon','items/abaddon/vespertine_guard_mount/vespertine_guard_mount_png.png'],
    ['Rider of Avarice Mount','abaddon','items/abaddon/avarice_mount/avarice_mount_png.png'],
    ['Compendium Rider of Avarice Mount','abaddon','items/abaddon/promo_gilded_mount/promo_gilded_mount_png.png'],
    ['Helm of the Mistral Fiend','abaddon','items/abaddon/mark_of_the_mistral_fiend_head/mark_of_the_mistral_fiend_head_png.png']
  ],
  uncommon: [
    ['Darkstar the Mistforged','abaddon','items/abaddon/darkstar_the_mistforged/darkstar_the_mistforged_png.png'],
    ['Tarnhelm of Ruin','abaddon','items/abaddon/tarnhelm_of_ruin/tarnhelm_of_ruin_png.png'],
    ['Cold Light of the Mist','abaddon','items/abaddon/cold_light_of_the_mist/cold_light_of_the_mist_png.png'],
    ['Vespertine Guard Helmet','abaddon','items/abaddon/vespertine_guard_helmet/vespertine_guard_helmet_png.png'],
    ['Rider of Avarice Helmet','abaddon','items/abaddon/avarice_head/avarice_head_png.png'],
    ['Compendium Rider of Avarice Helmet','abaddon','items/abaddon/promo_gilded_helmet/promo_gilded_helmet_png.png'],
    ['Pauldrons of the Mistral Fiend','abaddon','items/abaddon/mark_of_the_mistral_fiend_shoulder/mark_of_the_mistral_fiend_shoulder_png.png'],
    ['Cape of Enveloping Despair','abaddon','items/abaddon/haze_whisperer_back/haze_whisperer_back_png.png'],
    ["Drowned Horseman's Helm",'abaddon','items/abaddon/dotapit_s3_drowned_rider_head/dotapit_s3_drowned_rider_head_png.png'],
    ["Drowned Horseman's Pauldrons",'abaddon','items/abaddon/dotapit_s3_drowned_rider_shoulder/dotapit_s3_drowned_rider_shoulder_png.png'],
    ['Hallgul the War Mount','abaddon','items/abaddon/weta_hallgul_war_mount/weta_hallgul_war_mount_png.png'],
    ['Fractured Sword','abaddon','items/abaddon/weta_fractured_sword_of_eternity_weapon/weta_fractured_sword_of_eternity_weapon_png.png'],
    ['Spaulders of Enveloping Despair','abaddon','items/abaddon/haze_whisperer_shoulder/haze_whisperer_shoulder_png.png'],
    ['Halberd of Enveloping Despair','abaddon','items/abaddon/haze_whisperer_weapon/haze_whisperer_weapon_png.png'],
    ["Assistant's Cutter",'alchemist','items/alchemist/precisioncutter/precisioncutter_png.png'],
    ["Assistant's Muscle Pump",'alchemist','items/alchemist/musclepump/musclepump_png.png'],
    ["Young Alchemist's Protection",'alchemist','items/alchemist/caustic_outfit/caustic_outfit_png.png'],
    ["Ogre's Caustic Steel Choppers",'alchemist','items/alchemist/caustic_weapon/caustic_weapon_png.png'],
    ['Formed Alloy Pauldrons','alchemist','items/alchemist/armor/armor_png.png'],
    ['Toxic Siege Bracers','alchemist','items/alchemist/toxic_siege_bracers/toxic_siege_bracers_png.png']
  ],
  common: [
    ['Mistplates of Ruin','abaddon','items/abaddon/mistplates_of_ruin/mistplates_of_ruin_png.png'],
    ['Winged Shroud of Ruin','abaddon','items/abaddon/winged_shroud_of_ruin/winged_shroud_of_ruin_png.png'],
    ['Cloak of the Resentful Spectre','abaddon','items/abaddon/cloak_of_the_resentful_spectre/cloak_of_the_resentful_spectre_png.png'],
    ['Shoulderplates of Evil Spirit','abaddon','items/abaddon/shoulderplates_of_evil_spirit/shoulderplates_of_evil_spirit_png.png'],
    ['Cloak of the Demonic Vessel','abaddon','items/abaddon/alliance_abba_back/alliance_abba_back_png.png'],
    ['Hood of the Demonic Vessel','abaddon','items/abaddon/alliance_abba_head/alliance_abba_head_png.png'],
    ['Prey of the Demonic Vessel','abaddon','items/abaddon/alliance_abba_shoulder/alliance_abba_shoulder_png.png'],
    ['Vespertine Guard Blade','abaddon','items/abaddon/vespertine_guard_blade/vespertine_guard_blade_png.png'],
    ['Vespertine Guard Cloak','abaddon','items/abaddon/vespertine_guard_cloak/vespertine_guard_cloak_png.png'],
    ['Vespertine Guard Shoulders','abaddon','items/abaddon/vespertine_guard_shoulder/vespertine_guard_shoulder_png.png'],
    ['Rider of Avarice Shoulders','abaddon','items/abaddon/avarice_shoulders/avarice_shoulders_png.png'],
    ['Rider of Avarice Sword','abaddon','items/abaddon/avarice_weapon/avarice_weapon_png.png'],
    ['Rider of Avarice Cape','abaddon','items/abaddon/avarice_back/avarice_back_png.png'],
    ['Compendium Rider of Avarice Cape','abaddon','items/abaddon/promo_gilded_cape/promo_gilded_cape_png.png'],
    ['Compendium Rider of Avarice Shoulders','abaddon','items/abaddon/promo_gilded_shoulder/promo_gilded_shoulder_png.png'],
    ['Compendium Rider of Avarice Sword','abaddon','items/abaddon/promo_gilded_sword/promo_gilded_sword_png.png'],
    ['Cape of the Mistral Fiend','abaddon','items/abaddon/mark_of_the_mistral_fiend_back/mark_of_the_mistral_fiend_back_png.png'],
    ['Call of the Mistral Fiend','abaddon','items/abaddon/mark_of_the_mistral_fiend_weapon/mark_of_the_mistral_fiend_weapon_png.png'],
    ["Drowned Horseman's Cape",'abaddon','items/abaddon/dotapit_s3_drowned_rider_back/dotapit_s3_drowned_rider_back_png.png'],
    ["Assistant's Blades of Scientific Inquiry",'alchemist','items/alchemist/brutalblades/brutalblades_png.png']
  ]
};
// слоты экипировки (в стиле Dota) — определяем по названию/пути предмета
const EQ_SLOTS = [
  { id:'weapon', name:'Weapon', icon:'⚔️' }, { id:'head', name:'Head', icon:'⛑️' },
  { id:'armor', name:'Armor', icon:'🛡️' }, { id:'arms', name:'Arms', icon:'🧤' },
  { id:'back', name:'Back', icon:'🪽' }, { id:'mount', name:'Mount / Misc', icon:'🐎' }
];
function guessSlot(name, path) {
  const s = (name + ' ' + path).toLowerCase();
  if (/mount|steed|stallion|horse|hoof|warhorse|nightsbane|dreadsteed/.test(s)) return 'mount';
  if (/quiver|cape|cloak|shroud|back|wings|tail|mantle/.test(s)) return 'back';
  if (/bracer|arms|glove|sleeve|knuckle|fists|claw|arm1/.test(s)) return 'arms';
  if (/head|helm|hood|crown|mask|tarnhelm|cowl|hair|horns|flamehair/.test(s)) return 'head';
  if (/shoulder|pauldron|spaulder|armor|plates|torso|protection|raiment|legs|core|binder/.test(s)) return 'armor';
  if (/sword|blade|axe|mace|scythe|halberd|cutter|chopper|basher|hook|dagger|spear|staff|bow|edge|reaper|ripper|weapon|iceshard|darkstar|mistbreaker|light|reel|grudge|netherax|cypher|sage|paradox|gamble/.test(s)) return 'weapon';
  return 'armor';
}
const CS_ITEMS = [];
RARITIES.forEach(r => (CS_ITEMS_RAW[r] || []).forEach(([name, hero, path]) => {
  CS_ITEMS.push({ name, hero, path, rarity: r, slot: guessSlot(name, path) });
}));

const UNIQUE_SKINS = {
  phantom_assassin: { arcana: 'Manifold Paradox', immortal: "Yulsaria's Glacier", mythical: 'Ghastly Glare' },
  pudge: { arcana: 'Feast of Abscession', immortal: 'Dragonclaw Hook', mythical: "Butcher's Banquet" },
  juggernaut: { arcana: 'Bladeform Legacy', immortal: 'Favored of the Isle', mythical: 'Edge of the Lost Order' },
  nevermore: { arcana: 'Demon Eater', immortal: 'Shadow Demons', mythical: 'Souls Tyrant' },
  crystal_maiden: { arcana: 'Frost Avalanche', immortal: 'Icewrack Seer', mythical: 'Winter Snowdrop' },
  legion_commander: { arcana: 'Blades of Voth Domosh', immortal: 'Provenance', mythical: 'Warmonger' },
  invoker: { arcana: 'Dark Artistry', immortal: 'Magus Apex', mythical: 'Exort Mastery' },
  terrorblade: { arcana: 'Fractal Horns of Inner Abysm', immortal: 'Foulfell Mire', mythical: 'Demon Shard' },
  monkey_king: { arcana: "Great Sage's Reckoning", immortal: 'Flowering Staff', mythical: 'Ruyi Jingu Bang' },
  queenofpain: { arcana: 'Eminence of Ristul', immortal: 'Bloodfeather', mythical: 'Succubus Veil' },
  rubick: { arcana: 'Magus Cypher', immortal: 'Staff of the Grand Magus', mythical: 'Force Staff Prime' },
  lina: { arcana: 'Fiery Soul of the Slayer', immortal: 'Blaze of Glory', mythical: 'Laguna Style' },
  zuus: { arcana: "Tempest's Wrath", immortal: 'Cloudstruck', mythical: "Thundergod's Wrath" },
  faceless_void: { arcana: 'Claszian Apostasy', immortal: 'Chronosphere', mythical: 'Time Lock' },
  drow_ranger: { arcana: 'Dread Retribution', immortal: 'Frostfeather', mythical: 'Marksman' },
  earthshaker: { arcana: 'Planetfall', immortal: 'Fissure Lord', mythical: 'Totem Bearer' },
  ogre_magi: { arcana: "Flockheart's Gamble", immortal: 'Multicast King', mythical: 'Twin Heads' },
  axe: { immortal: 'Rampant Outrage', mythical: "Berserker's Call", rare: 'Bloodchaser' },
  antimage: { immortal: 'Basher of Mage Skulls', mythical: 'Magebreaker', rare: 'Blink Edge' }
};
const SKIN_PREFIX = {
  common: ['Worn','Rusted','Simple','Faded','Plain','Cracked','Dusty','Standard'],
  uncommon: ['Fine','Polished','Hunter','Scout','Keen','Swift','Forest','Stone'],
  rare: ['Noble','Royal','Captain','Elite','Veteran','Obsidian','Azure','Crimson'],
  mythical: ['Mythic','Arcane','Ethereal','Void','Celestial','Runed','Spectral','Cursed'],
  immortal: ['Immortal','Divine','Eternal','Radiant','Dire','Ascended','Supreme','Golden'],
  arcana: ['Arcana','Persona','True Form','Awakened','Prime','Masterwork','Iconic','Ultimate']
};
const SKIN_SUFFIX = {
  common: ['Garb','Wraps','Hood','Cloak','Boots','Mask','Gloves','Armor'],
  uncommon: ['Raiment','Edge','Vestments','Guard','Mantle','Visage','Harness','Stride'],
  rare: ['Regalia','Scepter','Plate','Crown','Wing','Shard','Talon','Crest'],
  mythical: ['Relic','Essence','Aura','Spirit','Echo','Sigil','Core','Fragment'],
  immortal: ['Legacy','Triumph','Glory','Dominion','Sovereign','Aegis','Paragon','Eternity'],
  arcana: ['Vision','Awakening','Ascension','Rebirth','Destiny','Soul','Truth','Finale']
};

// Кристаллы (валюта): иконка Gem of True Sight
function gemHTML(n) { return '<span class="gemv">' + fmt(n) + '<img class="gem" src="' + GEM_IMG + '" alt="🔶" referrerpolicy="no-referrer"></span>'; }
function fmt(n) { n = Math.floor(Number(n) || 0); return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function rnd(a, b) { return a + Math.random() * (b - a); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
