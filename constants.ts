
import { Character, CharacterType, Item, EventCard, Tile, Scenario, Madness, Spell, BestiaryEntry, EnemyType, Trait, ScenarioModifier, TileObjectType } from './types';

export const SPELLS: Spell[] = [
    { id: 'wither', name: 'Wither', cost: 2, description: 'Drains life force from a target.', effectType: 'damage', value: 2, range: 3 },
    { id: 'mend', name: 'Mend Flesh', cost: 2, description: 'Knits wounds together with arcane energy.', effectType: 'heal', value: 2, range: 1 },
    { id: 'reveal', name: 'True Sight', cost: 1, description: 'Reveals hidden clues in the area.', effectType: 'reveal', value: 1, range: 0 },
    { id: 'banish', name: 'Banish', cost: 4, description: 'A powerful rite to weaken the connection to the void.', effectType: 'banish', value: 5, range: 2 }
];

export const CHARACTERS: Record<CharacterType, Character> = {
  detective: { id: 'detective', name: 'The Private Eye', hp: 5, maxHp: 5, sanity: 4, maxSanity: 4, insight: 1, special: '+1 die on Investigation' },
  professor: { id: 'professor', name: 'The Professor', hp: 3, maxHp: 3, sanity: 6, maxSanity: 6, insight: 3, special: 'Can read occult texts safely' },
  journalist: { id: 'journalist', name: 'The Journalist', hp: 4, maxHp: 4, sanity: 4, maxSanity: 4, insight: 1, special: '+1 Movement speed' },
  veteran: { id: 'veteran', name: 'The Veteran', hp: 6, maxHp: 6, sanity: 3, maxSanity: 3, insight: 0, special: '+1 die on Combat' },
  occultist: { id: 'occultist', name: 'The Occultist', hp: 3, maxHp: 3, sanity: 5, maxSanity: 5, insight: 4, special: 'Starts with knowledge of the Arcane' },
  doctor: { id: 'doctor', name: 'The Doctor', hp: 4, maxHp: 4, sanity: 5, maxSanity: 5, insight: 2, special: 'Can heal HP or Sanity' }
};

export const TRAIT_POOL: Trait[] = [
    { id: 't1', name: 'Hardened', description: '+1 Max HP', type: 'positive', effect: 'combat_bonus' },
    { id: 't2', name: 'Shell-Shocked', description: 'Starts with 1 less Sanity', type: 'negative', effect: 'fragile_mind' },
    { id: 't3', name: 'Scavenger', description: 'Better chance to find items', type: 'positive', effect: 'scavenger' },
    { id: 't4', name: 'Adrenaline Junkie', description: '+1 Movement Speed', type: 'positive', effect: 'runner' },
    { id: 't5', name: 'Old Wound', description: '-1 Max HP', type: 'negative', effect: 'max_hp_down' },
    { id: 't6', name: 'Occult Scholar', description: 'Regenerate 1 Sanity when finding a clue', type: 'positive', effect: 'sanity_regen' }
];

export const SCENARIO_MODIFIERS: ScenarioModifier[] = [
    { id: 'mod1', name: 'Thick Fog', description: 'Vision range reduced by 1.', effect: 'reduced_vision' },
    { id: 'mod2', name: 'Blood Moon', description: 'Enemies deal +1 Damage.', effect: 'strong_enemies' },
    { id: 'mod3', name: 'Dwindling Supplies', description: 'Items are harder to find.', effect: 'less_items' },
    { id: 'mod4', name: 'The Stars Align', description: 'Doom advances faster (+1 per Mythos phase).', effect: 'extra_doom' }
];

export const ITEMS: Item[] = [
  // Standard Items
  { id: 'rev', name: 'Revolver', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 3, statModifier: 'combat' },
  { id: 'shot', name: 'Shotgun', type: 'weapon', effect: '+2 Combat Dice', bonus: 2, cost: 5, statModifier: 'combat' },
  { id: 'tommy', name: 'Tommy Gun', type: 'weapon', effect: '+3 Combat Dice', bonus: 3, cost: 10, statModifier: 'combat' },
  { id: 'knife', name: 'Dagger', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 2, statModifier: 'combat' },
  { id: 'med', name: 'Medical Kit', type: 'consumable', effect: 'Heal 2 HP', bonus: 2, cost: 3 },
  { id: 'whiskey', name: 'Old Whiskey', type: 'consumable', effect: 'Heal 2 Sanity', bonus: 2, cost: 2 },
  { id: 'flash', name: 'Flashlight', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 2, statModifier: 'investigation' },
  { id: 'lens', name: 'Magnifying Glass', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 3, statModifier: 'investigation' },
  { id: 'map', name: 'Old Map', type: 'tool', effect: 'Explore further', cost: 2 },
  { id: 'boots', name: 'Sturdy Boots', type: 'tool', effect: '+1 Agility', bonus: 1, cost: 4, statModifier: 'agility' },
  { id: 'coin', name: 'Lucky Coin', type: 'relic', effect: '+1 Agility', bonus: 1, cost: 3, statModifier: 'agility' },
  { id: 'coat', name: 'Heavy Coat', type: 'armor', effect: '-1 Physical Dmg Taken', bonus: 1, cost: 5, statModifier: 'physical_defense' },
  { id: 'amulet', name: 'Elder Sign', type: 'relic', effect: '-1 Sanity Dmg Taken', bonus: 1, cost: 6, statModifier: 'mental_defense' },
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3, cost: 8 },

  // CURSED ITEMS (v3.10.0)
  { id: 'cursed_dagger', name: 'Bloodthirsty Dagger', type: 'weapon', effect: '+3 Combat. Drains 1 HP on kill.', bonus: 3, cost: 6, statModifier: 'combat', curse: 'Lose 1 HP after each kill.', curseEffect: 'drain_hp_on_kill' },
  { id: 'cursed_bone', name: 'Cursed Bone', type: 'relic', effect: '+2 Max HP. Cannot heal > 4 HP.', bonus: 2, cost: 5, statModifier: 'physical_defense', curse: 'Cannot heal above 4 HP.', curseEffect: 'cap_hp' },
  { id: 'cursed_tome', name: 'Mad Prophet\'s Tome', type: 'relic', effect: '+3 Insight. Start with Hallucinations.', bonus: 3, cost: 7, statModifier: 'investigation', curse: 'Permanent Hallucinations.', curseEffect: 'hallucinations' },
  { id: 'cursed_lens', name: 'Lens of the Void', type: 'tool', effect: '+2 Investigate. Lose Sanity on Clue.', bonus: 2, cost: 5, statModifier: 'investigation', curse: 'Lose 1 Sanity when finding items/clues.', curseEffect: 'sanity_cost_clue' },
  { id: 'cursed_armor', name: 'Living Armor', type: 'armor', effect: '-2 Phys Dmg. Cannot Rest.', bonus: 2, cost: 8, statModifier: 'physical_defense', curse: 'Cannot perform Rest action.', curseEffect: 'no_rest' }
];

export const EVENTS: EventCard[] = [
  { id: 'e1', title: 'Shadows in the Dark', description: 'You feel watched. Lose 1 Sanity.', effectType: 'sanity', value: -1 },
  { id: 'e2', title: 'Hidden Diary', description: 'Found important notes! +1 Insight.', effectType: 'insight', value: 1 },
  { id: 'e3', title: 'Dark Ritual', description: 'You stumble upon a ceremony in progress!', effectType: 'spawn', value: 1 },
  { id: 'e4', title: 'Helpful Witness', description: 'A local points the way. +1 Insight.', effectType: 'insight', value: 1 },
  { id: 'e5', title: 'Eldritch Sign', description: 'The ritual accelerates! Doom -1.', effectType: 'doom', value: -1 },
  { id: 'e6', title: 'Cold Mist', description: 'A bone-chilling mist surrounds you.', effectType: 'health', value: -1 },
  { id: 'e7', title: 'Broken Seal', description: 'Something pushes through the veil.', effectType: 'spawn', value: 1 },
  { id: 'e8', title: 'Echoes of the Past', description: 'Voices from another time haunt you.', effectType: 'sanity', value: -2 }
];

export const MADNESS_CONDITIONS: Madness[] = [
  { id: 'm1', name: 'Hallucinations', description: 'You see things that are not there.', effect: 'Visual distortion.', visualClass: 'madness-hallucination' },
  { id: 'm2', name: 'Paranoia', description: 'They are watching you.', effect: 'Cannot Rest.', visualClass: 'madness-paranoia' },
  { id: 'm3', name: 'Hysteria', description: 'Your hands shake uncontrollably.', effect: '-1 Die on ALL checks.', visualClass: 'madness-hysteria' },
  { id: 'm4', name: 'Catatonia', description: 'Your mind retreats into darkness.', effect: 'Max 1 Action.', visualClass: 'madness-catatonia' }
];

export const INDOOR_CONNECTORS = ['Narrow Hallway', 'Dark Corridor', 'Grand Staircase', 'Servant Passage', 'Dusty Landing', 'Maintenance Shaft', 'Basement Tunnel', 'Service Elevator'];
export const INDOOR_LOCATIONS = ['Abandoned Manor', 'Dark Cellar', 'The Library', 'Secret Crypt', 'Old Church', 'Police Station', 'Warehouse', 'Arkham Asylum', 'Historical Museum', 'St. Mary\'s Hospital', 'Sanitarium', 'Underground Vault', 'Dusty Attic', 'Grand Hall', 'Study Room', 'Ritual Chamber', 'Boiler Room'];
export const OUTDOOR_CONNECTORS = ['Narrow Alley', 'Cobblestone Path', 'Foggy Bridge', 'Tram Track', 'Dark Tunnel', 'Stone Steps', 'River Crossing', 'Overpass', 'Dirt Trail'];
export const OUTDOOR_LOCATIONS = ['Misty Docks', 'Town Square', 'Old Lighthouse', 'Blackwood Forest', 'Graveyard', 'University Campus', 'Market District', 'River Bank', 'Train Station', 'Swamp', 'City Park', 'Merchant Street', 'Dark Pier'];
export const LOCATION_NAMES = [...INDOOR_LOCATIONS, ...OUTDOOR_LOCATIONS, ...INDOOR_CONNECTORS, ...OUTDOOR_CONNECTORS];
export const ALL_LOCATIONS_FULL = ['Train Station', ...INDOOR_LOCATIONS, ...OUTDOOR_LOCATIONS, ...INDOOR_CONNECTORS, ...OUTDOOR_CONNECTORS];
export const TILE_INTERACTABLES: TileObjectType[] = ['bookshelf', 'crate', 'chest', 'cabinet', 'radio', 'switch', 'mirror', 'statue', 'altar', 'rubble', 'locked_door', 'barricade', 'fog_wall', 'trap', 'fire'];

export const START_TILE: Tile = {
  id: 'start', q: 0, r: 0, name: 'Train Station', type: 'street', category: 'location', explored: true, searchable: true, searched: false
};

// --- UPDATED SCENARIOS (v3.10.0) ---
export const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: 'Escape from Blackwood Manor',
    description: 'You are trapped in the haunted Blackwood estate. The doors are sealed by dark magic. You must find the key and escape before the entity claims you.',
    startDoom: 12,
    startLocation: 'Grand Hall',
    goal: 'Find the Iron Key, locate the Exit Door, and Escape.',
    specialRule: 'Indoors only. Exit Door spawns after Key is found.',
    difficulty: 'Normal',
    tileSet: 'indoor',
    victoryType: 'escape',
    steps: [
        { id: 'step1', description: 'Find the Iron Key (Investigate locations)', type: 'find_item', targetId: 'quest_key', completed: false },
        { id: 'step2', description: 'Locate the Exit Door', type: 'find_tile', targetId: 'Exit Door', completed: false },
        { id: 'step3', description: 'Unlock the Door and Escape', type: 'interact', targetId: 'Exit Door', completed: false }
    ],
    doomEvents: [
        { threshold: 8, triggered: false, type: 'spawn_enemy', targetId: 'cultist', amount: 2, message: 'The cultists have found you!' },
        { threshold: 5, triggered: false, type: 'spawn_enemy', targetId: 'ghoul', amount: 2, message: 'Hungry ghouls emerge from the shadows.' },
        { threshold: 2, triggered: false, type: 'spawn_boss', targetId: 'shoggoth', amount: 1, message: 'A Shoggoth blocks the way!' }
    ]
  },
  {
    id: 's2',
    title: 'Assassination of the High Priest',
    description: 'The Order of the Black Sun is performing a ritual to summon a Great Old One. You must silence their leader before the ritual completes.',
    startDoom: 10,
    startLocation: 'Town Square',
    goal: 'Find and kill the Dark Priest.',
    specialRule: 'Enemies are stronger. Time is short.',
    difficulty: 'Hard',
    tileSet: 'mixed',
    victoryType: 'assassination',
    steps: [
        { id: 'step1', description: 'Find the Dark Priest', type: 'find_item', targetId: 'location_intel', completed: false }, // Finding intel reveals location? Or just find him
        { id: 'step2', description: 'Kill the Dark Priest', type: 'kill_enemy', targetId: 'priest', amount: 1, completed: false }
    ],
    doomEvents: [
        { threshold: 7, triggered: false, type: 'spawn_enemy', targetId: 'deepone', amount: 2, message: 'Deep Ones rise from the sewers.' },
        { threshold: 4, triggered: false, type: 'buff_enemies', message: 'The ritual empowers all enemies! (+1 HP)' },
        { threshold: 2, triggered: false, type: 'spawn_boss', targetId: 'shoggoth', message: 'The Priest summons a guardian!' }
    ]
  },
  {
    id: 's3',
    title: 'The Ritual of Binding',
    description: 'To stop the encroaching void, you must perform the counter-ritual. Gather the sacred components and place them on the Altar.',
    startDoom: 14,
    startLocation: 'Library',
    goal: 'Collect 3 Sacred Candles and place them on the Altar.',
    specialRule: 'Map is large. Travel is dangerous.',
    difficulty: 'Normal',
    tileSet: 'indoor',
    victoryType: 'collection',
    steps: [
        { id: 'step1', description: 'Find the Red Candle', type: 'find_item', targetId: 'candle_red', completed: false },
        { id: 'step2', description: 'Find the Black Candle', type: 'find_item', targetId: 'candle_black', completed: false },
        { id: 'step3', description: 'Find the White Candle', type: 'find_item', targetId: 'candle_white', completed: false },
        { id: 'step4', description: 'Perform the Ritual at the Altar', type: 'interact', targetId: 'Altar', completed: false }
    ],
    doomEvents: [
        { threshold: 10, triggered: false, type: 'sanity_hit', amount: 1, message: 'The house whispers your secrets. (-1 Sanity)' },
        { threshold: 7, triggered: false, type: 'spawn_enemy', targetId: 'hound', amount: 1, message: 'A Hound of Tindalos smells you.' },
        { threshold: 4, triggered: false, type: 'spawn_enemy', targetId: 'nightgaunt', amount: 2, message: 'Nightgaunts descend from the rafters.' }
    ]
  },
  {
    id: 's4',
    title: 'The Siege of Arkham',
    description: 'They are coming. Wave after wave of horrors. You cannot run. You can only survive.',
    startDoom: 15,
    startLocation: 'Police Station',
    goal: 'Survive for 10 rounds.',
    specialRule: 'Doom decreases every round automatically.',
    difficulty: 'Nightmare',
    tileSet: 'mixed',
    victoryType: 'survival',
    steps: [
        { id: 'step1', description: 'Survive until help arrives', type: 'survive', amount: 10, completed: false }
    ],
    doomEvents: [
        { threshold: 12, triggered: false, type: 'spawn_enemy', targetId: 'cultist', amount: 3, message: 'Wave 1: Cultists attack!' },
        { threshold: 8, triggered: false, type: 'spawn_enemy', targetId: 'ghoul', amount: 3, message: 'Wave 2: Ghouls swarm the barricades!' },
        { threshold: 4, triggered: false, type: 'spawn_boss', targetId: 'dark_young', amount: 1, message: 'Wave 3: A Dark Young appears!' }
    ]
  }
];

export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist', type: 'cultist', hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    visualPrompt: 'A sinister cultist in ragged, hooded robes, face obscured by shadow, clutching a jagged ceremonial dagger. Dramatic chiaroscuro lighting, 1920s horror illustration style, oil painting texture.',
    lore: 'Recruited from the desperate and the mad, these fanatics have traded their humanity for forbidden promises.',
    defeatFlavor: 'The cultist collapses, a dark amulet shattering on the cobblestones.',
    traits: []
  },
  sniper: {
    name: 'Cult Sniper', type: 'sniper', hp: 2, damage: 1, horror: 0,
    description: 'An assassin striking from the shadows.',
    visualPrompt: 'A menacing silhouette in a trench coat and fedora, perched on a rooftop with a long rifle. Noir atmosphere, high contrast.',
    lore: 'Armed with stolen military hardware and unholy blessings.',
    defeatFlavor: 'The sniper slumps forward, their rifle clattering to the ground.',
    traits: ['ranged']
  },
  priest: {
    name: 'Dark Priest', type: 'priest', hp: 3, damage: 1, horror: 2,
    description: 'A chanter of doom.',
    visualPrompt: 'A deranged priest in ornate, tattered ceremonial vestments, eyes glowing with purple madness. Eldritch energy crackles around them.',
    lore: 'Their very voice warps reality, accelerating the cosmic alignment.',
    defeatFlavor: 'The chanting is cut short by a gurgling gasp as the priest expires.',
    traits: []
  },
  ghoul: {
    name: 'Ghoul', type: 'ghoul', hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    visualPrompt: 'A hunched, canine-like humanoid with rubbery grey skin, hoof-like feet, and a face like a feral dog. Dirt and bone fragments scattered around.',
    lore: 'Subterranean dwellers that feast on the dead.',
    defeatFlavor: 'It collapses into a pile of dust and foul-smelling grave dirt.',
    traits: ['scavenger']
  },
  deepone: {
    name: 'Deep One', type: 'deepone', hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    visualPrompt: 'A terrifying fish-frog hybrid humanoid with glistening gray-green scales. Standing on a wet dock, dripping with slime.',
    lore: 'Immortal servants of Father Dagon who dwell in underwater cities.',
    defeatFlavor: 'The creature dissolves into a foul-smelling puddle of brine and ichor.',
    traits: ['aquatic']
  },
  shoggoth: {
    name: 'Shoggoth', type: 'shoggoth', hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    visualPrompt: 'A massive, shapeless monstrosity of iridescent black slime, rolling forward like a tide. Covered in thousands of eyes and mouths.',
    lore: 'A nightmarish slave race created by the Elder Things eons ago.',
    traits: ['massive', 'slow'],
    defeatFlavor: 'The massive form loses cohesion, becoming a lifeless pool of inert slime.'
  },
  'mi-go': {
    name: 'Mi-Go', type: 'mi-go', hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    visualPrompt: 'A pinkish, fungoid, crustacean-like alien creature with large membranous wings and a pulsating ellipsoid head.',
    lore: 'Fungi from Yuggoth who fly through the ether of space.',
    traits: ['flying'],
    defeatFlavor: 'The fungoid body disintegrates, vibrating out of our dimension.'
  },
  nightgaunt: {
    name: 'Nightgaunt', type: 'nightgaunt', hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    visualPrompt: 'A sleek, oily black humanoid creature with absolutely no face, large curved horns, and bat-like wings.',
    lore: 'Faceless, silent servants of Nodens.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky without a sound, leaving only a cold breeze.'
  },
  hound: {
    name: 'Hound of Tindalos', type: 'hound', hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    visualPrompt: 'A lean, emaciated beast emerging from a sharp 90-degree angle in a room. It appears made of blue smoke and ichor.',
    lore: 'Predators that inhabit the angles of time, unlike life which exists in curves.',
    traits: ['fast', 'ambusher'],
    defeatFlavor: 'The beast howls and recedes back into the angles of reality.'
  },
  dark_young: {
    name: 'Dark Young', type: 'dark_young', hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    visualPrompt: 'A terrifying mass of ropy black tentacles and hooves, resembling a twisted, leafless tree that walks.',
    lore: 'The Black Goat of the Woods with a Thousand Young.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers rapidly, resembling a dead, rotted tree stump.'
  },
  byakhee: {
    name: 'Byakhee', type: 'byakhee', hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    visualPrompt: 'A disturbing hybrid monster composed of crow, mole, ant, and decomposing human corpse. Large wings, furry texture.',
    lore: 'Interstellar steeds serving Hastur.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It screeches one last time before dissolving into cosmic dust.'
  },
  star_spawn: {
    name: 'Star Spawn', type: 'star_spawn', hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    visualPrompt: 'A gigantic, green, gelatinous monster with an octopus-like head, dragon wings, and claws. Towering over buildings.',
    lore: 'Smaller versions of the Great Dreamer himself. They waged war against the Elder Things eons ago.',
    traits: ['massive'],
    defeatFlavor: 'The ground shakes violently as the colossal entity falls, liquefying into green ooze.'
  },
  formless_spawn: {
    name: 'Formless Spawn', type: 'formless_spawn', hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    visualPrompt: 'A pitch-black, liquid shapeshifter changing forms rapidly. An oily toad-like shape emerging from a puddle of tar.',
    lore: 'Living, sentient puddles of black ichor associated with Tsathoggua.',
    traits: ['regenerate'],
    defeatFlavor: 'The black ooze evaporates into foul steam, leaving a permanent stain on reality.'
  },
  hunting_horror: {
    name: 'Hunting Horror', type: 'hunting_horror', hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    visualPrompt: 'A colossal, serpentine creature flying through the air, resembling a dragon without wings, with a single distorted face.',
    lore: 'A massive, serpentine entity resembling a dragon without wings. It serves Nyarlathotep.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in on itself, shrieking, and vanishes in a blinding flash of light.'
  },
  moon_beast: {
    name: 'Moon-Beast', type: 'moon_beast', hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    visualPrompt: 'A pale, toad-like abomination with no eyes and a mass of short, pink tentacles vibrating on its snout.',
    lore: 'Blind, pale, toad-like abominations from the Dreamlands\' moon.',
    traits: ['ranged'],
    defeatFlavor: 'The pale abomination falls silent, its tentacles twitching one last time.'
  },
  boss: {
    name: 'Ancient One', type: 'boss', hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    visualPrompt: 'A cosmic entity of impossible geometry, surrounded by madness and void. An avatar of Nyarlathotep or Cthulhu.',
    lore: 'You should not be seeing this. It is an intrusion from outside the ordered universe.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is banished, screaming as it is pulled back into the void, sealing the gate.'
  }
};
