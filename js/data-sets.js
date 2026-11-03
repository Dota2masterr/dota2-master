// ================= НАБОРЫ (wiki.cs.money/dota/sets/<hero>) =================
// формат: название|редкость|картинка (econ/...). legendary → immortal
const CS_SETS_RAW = {
juggernaut: `Provocation of Ruin|immortal|sets/dota_item_provocation_of_ruin_png.png
Balance of the Bladekeeper|legendary|loading_screens/dc_betaloadingscreenjugg_png.png
Wandering Demon of the Plains Set|mythical|sets/dota_item_wandering_demon_of_the_plains_set_png.png
Armor of the Unyielding Mask|mythical|loading_screens/immortal_warlord_loading_screen_png.png
Pilgrimage of the Bladeform Aesthete|mythical|loading_screens/armor_for_the_favorite_loading_screen_png.png
Lineage of the Stormlords|mythical|sets/dota_item_lineage_of_the_stormlords_png.png
Jagged Honor|mythical|loading_screens/jugg_year_beast_slayer_ls_png.png
Isle of Dragons|mythical|items/juggernaut/miyamoto_musash_weapon/miyamoto_musash_weapon_png.png
Of Ebony and Ivory Set|rare|sets/dota_item_of_ebony_and_ivory_set_png.png
Traveler on the High Plains Set|rare|sets/dota_item_traveler_on_the_high_plains_set_png.png
Thousand Faces Set|rare|sets/dota_item_thousand_faces_set_png.png
Arms of the Gwimyeon Warrior Set|rare|sets/dota_item_kogu_warrior_set_png.png
The Exiled Ronin Set|rare|sets/dota_item_the_exiled_ronin_set_png.png
Gifts of the Vanished Isle Set|rare|sets/dota_item_gifts_of_the_vanished_isle_set_png.png
Bladesrunner|rare|sets/dota_item_bladesrunner_png.png
Dashing Swordsman|rare|loading_screens/esl_dashing_bladelord_loadingscreen_png.png
The Path of Odocoeleus|rare|sets/dota_item_frostivus2018_jugg_northern_wanderer_png.png
Sinister Shadow|rare|sets/dota_item_sinister_shadow_png.png
Argent Decimator|rare|loading_screens/dplus_battlemaster_set_ls_png.png
The Boar God's Honor Set|uncommon|sets/dota_item_the_boar_gods_honor_set_png.png`,
pudge: `The Abscesserator Bundle|immortal|sets/dota_item_the_abscesserator_bundle_png.png
Chains of the Black Death|legendary|loading_screens/blackdeath_png.png
Tools of the Mad Harvester Set|mythical|sets/dota_item_tools_of_the_mad_harvester_set_png.png
Murder of Crows|mythical|sets/dota_item_murder_of_crows_png.png
Gladiator's Revenge|mythical|sets/dota_item_gladiators_revenge_png.png
Compendium Bindings of the Trapper|mythical|loading_screens/promo_trapper_loading_screen_png.png
Surgical Precision|mythical|loading_screens/dotapit_s3_pudge_loadingscreen_png.png
Doomsday Ripper|mythical|loading_screens/doomsday_ripper_loading_screen_png.png
Scavenger of the Basilisk|mythical|loading_screens/scavenger_of_basilisk_png.png
Writ of the Royal Butcher|mythical|loading_screens/demon_queller_demon_queller_loading_screen_png.png
Jolly Reaver|mythical|loading_screens/pudge_deep_sea_abomination_pudge_deep_sea_abomination_loading_screen_ti_2017_png.png
Hunt of the Odobenus One|mythical|sets/dota_item_frostivus2018_pudge_walrus_slaughterer_png.png
Dapper Disguise|mythical|loading_screens/pudge_dapper_disguise_ls_png.png
Mindless Slaughter|mythical|sets/dota_item_mindless_slaughter_png.png
The Ol' Chopper's Set|rare|sets/dota_item_the_ol_choppers_set_png.png
Chained Slayers Set|rare|sets/dota_item_chained_slayers_set_png.png
The Butcher's Broilers Pack|rare|sets/dota_item_the_butchers_broilers_pack_png.png
Delicacies of Butchery Set|rare|sets/dota_item_delicacies_of_butchery_set_png.png
Bindings of the Trapper|rare|loading_screens/trapper_loading_screen_png.png`,
phantom_assassin: `Dread of the Gleaming Seal Set|legendary|sets/dota_item_dread_of_the_gleaming_seal_set_png.png
Creeping Shadow|mythical|loading_screens/creeping_shadow_loading_screen_png.png
Toll of the Fearful Aria|mythical|loading_screens/toll_of_the_fearful_aria_loading_screen_png.png
Visions of the Lifted Veil|mythical|sets/dota_item_ti8_pa_the_gloomy_veil_png.png
Gothic Whisper|mythical|sets/dota_item_ti9_cache_pa_gothic_hunter_png.png
Bane of the Deathstalkers|mythical|sets/dota_item_bane_of_the_deathstalkers_bundle_png.png
Penumbral Vesture Set|rare|sets/dota_item_penumbral_vesture_set_png.png
Nimble Edge Set|rare|sets/dota_item_nimble_edge_set_png.png
Dark Wraith Set|rare|sets/dota_item_dark_wraith_set_png.png
Dragonterror|rare|sets/dota_item_dragonterror_png.png
Dame de Carreau|rare|loading_screens/carreau_png.png
Raiments of the Sacrosanct|rare|loading_screens/raiment_of_the_sacred_blossom_loading_screen_png.png
Ravening Wings|rare|sets/dota_item_ravening_wings_png.png
Raiments of the Eventide|rare|loading_screens/raiments_of_the_shadow_slayer_set_loading_screen_png.png
Bloodroot Guard|rare|loading_screens/phantom_knight_loading_screen_png.png
Cruel Reprisal|rare|loading_screens/armor_reprisal_reprisal_loadingscreen_png.png
Valkyrie's Shade|rare|sets/dota_item_valkyries_shade_png.png
Capricious Fate|rare|loading_screens/dplus_capricious_fate_ls_png.png`,
invoker: `Dark Artistry Throwback|immortal|sets/dota_item_dark_artistry_kid_png.png
Dark Artistry|immortal|sets/dota_item_dark_artistry_png.png
Heir of Menace|mythical|loading_screens/the_little_king_ls_png.png
Iceforged Set|mythical|sets/dota_item_iceforged_set_png.png
Vestige of the Arsenal Magus|mythical|sets/dota_item_vestige_of_the_arsenal_magus_png.png
Sempiternal Revelations|mythical|sets/dota_item_sempiternal_revelations_set_png.png
Adornings of the Quas Precor Set|mythical|sets/dota_item_adornings_of_the_quas_precor_set_png.png
Cadenza Magic Master|mythical|sets/dota_item_cadenza_magic_master_png.png
Sinister Lightning|mythical|loading_screens/sinisterlightning_png.png
Volatile Majesty|mythical|loading_screens/dark_sorcerer_loading_screen_png.png
Trials of the Blackguard Magus|mythical|loading_screens/nightlord_nightlord_loadingscreen_png.png
Covenant of the Depths|mythical|loading_screens/covenant_of_the_depths_covenant_of_the_depths_loadingscreen_png.png
Fate Meridian|mythical|loading_screens/ti8_invoker_prism_crystal_spellcaster_ls_png.png
The Magus Magnus Set|rare|sets/dota_item_the_magus_magnus_set_png.png
Cabalist of Dark Magic Set|rare|sets/dota_item_cabalist_of_dark_magic_set_png.png
Mnemonus Arcanus Set|rare|sets/dota_item_mnemonus_arcanus_set_png.png
Garbs of the Eastern Range Set|rare|sets/dota_item_garbs_of_the_eastern_range_set_png.png
Relics of Glorious Inspiration|rare|bundles/esl_invoker_bundle_png.png
Northern Blight|rare|sets/dota_item_frostivus2018_invoker_keeper_of_magic_png.png`,
crystal_maiden: `Conduit of the Blueheart Bundle|legendary|sets/dota_item_conduit_of_the_blueheart_bundle_png.png
Glacier Duster Set|mythical|sets/dota_item_glacial_duster_set_png.png
Lady of the Lumini Polare|mythical|loading_screens/lumini_polare_loading_screen_png.png
Prelate of the Wyvern Legion|mythical|sets/dota_item_dota_plus_crystal_maiden_png.png
Glacial Gardens|mythical|loading_screens/the_winter_monarch_winter_monarch_loadingscreen_png.png
Lineage Charge of the Tundra Warden|mythical|sets/dota_item_lineage_charge_of_the_tundra_warden_png.png
Whitewind Battlemage|mythical|items/crystal_maiden/lady_whitewind_head/lady_whitewind_head_png.png
Winter Snowdrop|rare|sets/dota_item_winter_snowdrop_set_png.png
Regalia of the Crystalline Queen Set|rare|sets/dota_item_regalia_of_the_crystalline_queen_set_png.png
Frostiron Sorceress Set|rare|sets/dota_item_frostiron_sorceress_set_png.png
Heart of the North Set|rare|sets/dota_item_heart_of_the_north_set_png.png
Frozen Feather Set|rare|sets/dota_item_frozen_feather_set_png.png
Ensemble of the Crystalline Comet|rare|loading_screens/crystalline_comet_loading_screen_png.png
Wraps of the Winterbringer|rare|loading_screens/frostbringer_loadingscreen_png.png
Charge of the Tundra Warden|rare|loading_screens/icewrack_warden_loadingscreen2_png.png
Blueheart Sovereign|rare|loading_screens/crystalline_empress_loadingscreen_crystalline_empress_png.png
Icebound Floret|rare|loading_screens/esl_frozen_lotus_loading_screen_png.png
Glacial Magnolia|rare|loading_screens/magnolia_loading_screen_png.png
Winter's Warden|rare|sets/dota_item_frostivus_cm_frosty_valkyrie_png.png
Royal Winterbloom|rare|loading_screens/royal_winterbloom_ls_png.png`,
nevermore: `Diabolical Fiend|mythical|loading_screens/diabolical_fiend_loading_screen_png.png
Eternal Harvest|mythical|loading_screens/ferrum_chiroptera_loading_screen_png.png
Souls Tyrant|mythical|loading_screens/sf_souls_tyrant_ls_png.png
Soul Corpulence|mythical|loading_screens/sf_immortal_flame_ls_png.png
Spring Lineage Eternal Harvest|mythical|sets/dota_item_spring_lineage_eternal_harvest_png.png
Fathomless Ravager|rare|sets/dota_item_ti7_cache_krakens_ravager_png.png
Murder of Souls|rare|loading_screens/nevermores_shade_ls_png.png
Twilight Effigy|rare|sets/dota_item_harvest_effigy_png.png`,
axe: `Axe Unleashed|immortal|sets/dota_item_ti9_jungle_axe_set_png.png
Armor of the Shattered Vanguard|mythical|loading_screens/armor_of_the_wrought_legion_armor_of_the_wrought_legion_png.png
Shackles of the Enduring Conscript|mythical|loading_screens/ti8_axe_violent_prisoner_of_war_ls_png.png
Lineage The Ram's Head Armaments|mythical|sets/dota_item_ti10_legacy_the_rams_head_armaments_png.png
Carnage of the Endless Hunt|mythical|sets/dota_item_aghs_bp_glass_basilisk_hunter_png.png
Days of the Demon|mythical|sets/dota_item_days_of_the_demon_bundle_png.png
Forged in Demons' Blood Set|rare|sets/dota_item_forged_in_demons_blood_set_png.png
The Axecutioner Set|rare|sets/dota_item_the_axecutioner_set_png.png
Saberhorn's Armor Set|rare|sets/dota_item_saberhorns_armor_set_png.png
The Red Conqueror Set|rare|sets/dota_item_the_red_conqueror_set_png.png
Red Mist Reaper Set|rare|sets/dota_item_red_mist_reaper_set_png.png
Harbinger of War|rare|sets/dota_item_harbinger_of_war_png.png
The Ram's Head Armaments|rare|loading_screens/searing_annihilator_loading_screen_png.png
Wrathful Annihilator|rare|loading_screens/essentials_of_the_blood_edge_loading_screen_of_the_cursed_blood_edge_png.png
Supreme Black Orc Warboss|rare|loading_screens/oglodi_big_boss_oglodi_big_boss_loadingscreen_png.png
Snowpack Savage|rare|sets/dota_item_frostivus_axe_glacial_terror_png.png
Undefeated General|rare|sets/dota_item_undefeated_general_png.png
Snowblind Survival|rare|loading_screens/barbarian_of_the_outlands_ls_png.png
The Defiant Axe Set|uncommon|sets/dota_item_the_defiant_axe_set_png.png
The Forgemaster's Tools Set|uncommon|sets/dota_item_the_forgemasters_tools_set_png.png`,
lina: `Ember Crane Set|mythical|sets/dota_item_ember_crane_set_png.png
Everlasting Heat|mythical|loading_screens/everlastingheat_png.png
Bewitching Flare|mythical|loading_screens/bewitching_flare_loadingscreen_png.png
Regime of the Enthaleen Dragon|mythical|loading_screens/scales_of_the_burning_dragon_loading_screen_png.png
Fireflight Scion|mythical|loading_screens/reborn_phoenixlina_reborn_phoenixlina_loadingscreen_png.png
Glory of the Elderflame|mythical|sets/dota_item_glory_of_the_elderflame_png.png
Light of the Solar Divine|rare|sets/dota_item_light_of_the_solar_divine_set_png.png
The Battle Caster Set|rare|sets/dota_item_the_battle_caster_set_png.png
The Garments of the Charred Bloodline Set|rare|sets/dota_item_the_garments_of_the_charred_bloodline_set_png.png
Jini the Bright Moon Set|rare|sets/dota_item_the_bright_moon_of_josean_set_png.png
Dragonfire|rare|loading_screens/dragonfire_loadingscreen_png.png
Smoldering Journey|rare|loading_screens/bts_migrant_blaze_loadscreen_png.png
Divine Flame|rare|loading_screens/esl_divine_flame_ls_png.png
Warhawk Vestiments|rare|loading_screens/warhawk_vestiments_png.png
Vehement Plume|rare|loading_screens/feathery_soul_loading_screen_png.png
The Scarlet Flare|rare|sets/dota_item_the_scarlet_flare_png.png
Hellfire Insurgent|rare|sets/dota_item_heartflint_sorceress_png.png
Fire Regent|rare|loading_screens/flame_lily_in_full_bloom_ls_png.png
Fashion of the Scorching Princess Set|common|sets/dota_item_fashion_of_the_scorching_princess_set_png.png`,
antimage: `The Basher Blades|immortal|bundles/basher_blades_bundle1_png.png
Golden Basher Blades|immortal|bundles/basher_blades_gold_bundle1_png.png
Arcs of Manta Pack|mythical|items/antimage/arc_of_manta/arc_of_manta_png.png
Spoils from the Shifting Sorcerer Bundle|mythical|sets/dota_item_spoils_from_the_shifting_sorcerer_bundle_png.png
Mage Abolisher|mythical|loading_screens/mage_eraser_loading_screen_png.png
Fervent Conscript|mythical|loading_screens/distinguished_conscript_loadingscreen_png.png
Guilt of the Survivor|mythical|loading_screens/god_eater_god_eater_loadingscreen_png.png
Oathbound Defiant|mythical|sets/dota_item_oathbound_defiant_png.png
Shadows of the Forgotten Plane|mythical|sets/dota_item_shadows_of_the_forgotten_plane_png.png
Lineage Broken Scale|mythical|sets/dota_item_ti10_legacy_broken_scale_png.png
Faceless Death|mythical|sets/dota_item_faceless_death_png.png
Howls of the Northmarch|mythical|sets/dota_item_northern_veteran_png.png
The Mage Slayer's Set|rare|sets/dota_item_the_mage_slayers_set_png.png
Glaives of the Mage Slayer Pack|rare|items/antimage/antimage_slasher_weapon_png.png
The Gifts of Yoskreth Set|rare|sets/dota_item_the_gifts_of_yoskreth_set_png.png
The Clergy Ascetic Set|rare|sets/dota_item_the_clergy_ascetic_set_png.png
Legacy of the Awakened Set|rare|sets/dota_item_legacy_of_the_awakened_set_png.png
Acolyte of Vengeance|rare|sets/dota_item_acolyte_of_vengence_png.png
The Witch Hunter|rare|sets/dota_item_witch_hunter_png.png
The Armor of Tustakuri|rare|sets/dota_item_the_armor_of_tustakuri_png.png`,
faceless_void: `Claszureme Incursion|mythical|sets/dota_item_fv_primordial_conservator_png.png
Augur of Oblivion|mythical|sets/dota_item_augur_of_oblivion_png.png
Chronite Defense Set|rare|sets/dota_item_chronite_defense_set_png.png
Acolyte of Clasz Set|rare|sets/dota_item_acolyte_of_clasz_set_png.png
Viridi Inanitas Set|rare|sets/dota_item_viridi_inanitas_set_png.png
The Tentacular Timelord Set|rare|sets/dota_item_the_tentacular_timelord_set_png.png
Ancient Cultist|rare|sets/dota_item_ancient_cultist_png.png
Elements of the Endless Plane|rare|loading_screens/elements_of_oblivion_loading_screen_png.png
Misgivings of the Emerald Age|rare|loading_screens/void_armor_of_the_emerald_age_loadingscreen_void_armor_of_the_emerald_age_png.png
The Corruption of Nezzureem|rare|loading_screens/shards_of_nezzureem_loadingscreen_png.png
Frozen Void|rare|loading_screens/frozen_void_frozen_void_ls_png.png
Dials of Claszureme Set|common|sets/dota_item_dials_of_claszureme_set_png.png`
};
const CS_SETS = [];
Object.keys(CS_SETS_RAW).forEach(hero => CS_SETS_RAW[hero].split('\n').forEach(line => {
  const [name, r, path] = line.split('|');
  CS_SETS.push({ name, hero, path, rarity: r === 'legendary' ? 'immortal' : r });
}));
function pickSet(heroId, rarity) {
  let pool = CS_SETS.filter(s => s.hero === heroId && s.rarity === rarity);
  return pool.length ? pick(pool) : null;
}
