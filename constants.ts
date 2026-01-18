
import { Character, CharacterType, Item, EventCard, Tile, Scenario, Madness, Spell, BestiaryEntry, EnemyType, Trait, ScenarioModifier } from './types';

export const SPELLS: Spell[] = [
    {
        id: 'wither',
        name: 'Wither',
        cost: 2,
        description: 'Drains life force from a target.',
        effectType: 'damage',
        value: 2,
        range: 3
    },
    {
        id: 'mend',
        name: 'Mend Flesh',
        cost: 2,
        description: 'Knits wounds together with arcane energy.',
        effectType: 'heal',
        value: 2,
        range: 1
    },
    {
        id: 'reveal',
        name: 'True Sight',
        cost: 1,
        description: 'Reveals hidden clues in the area.',
        effectType: 'reveal',
        value: 1,
        range: 0
    },
    {
        id: 'banish',
        name: 'Banish',
        cost: 4,
        description: 'A powerful rite to weaken the connection to the void.',
        effectType: 'banish',
        value: 5, // High damage/banish value
        range: 2
    }
];

export const CHARACTERS: Record<CharacterType, Character> = {
  detective: {
    id: 'detective',
    name: 'The Private Eye',
    hp: 5, maxHp: 5,
    sanity: 4, maxSanity: 4,
    insight: 1,
    special: '+1 die on Investigation'
  },
  professor: {
    id: 'professor',
    name: 'The Professor',
    hp: 3, maxHp: 3,
    sanity: 6, maxSanity: 6,
    insight: 3,
    special: 'Can read occult texts safely'
  },
  journalist: {
    id: 'journalist',
    name: 'The Journalist',
    hp: 4, maxHp: 4,
    sanity: 4, maxSanity: 4,
    insight: 1,
    special: '+1 Movement speed'
  },
  veteran: {
    id: 'veteran',
    name: 'The Veteran',
    hp: 6, maxHp: 6,
    sanity: 3, maxSanity: 3,
    insight: 0,
    special: '+1 die on Combat'
  },
  occultist: {
    id: 'occultist',
    name: 'The Occultist',
    hp: 3, maxHp: 3,
    sanity: 5, maxSanity: 5,
    insight: 4,
    special: 'Starts with knowledge of the Arcane'
  },
  doctor: {
    id: 'doctor',
    name: 'The Doctor',
    hp: 4, maxHp: 4,
    sanity: 5, maxSanity: 5,
    insight: 2,
    special: 'Can heal HP or Sanity'
  }
};

export const TRAIT_POOL: Trait[] = [
    { id: 't1', name: 'Hardened', description: '+1 Max HP', type: 'positive', effect: 'combat_bonus' }, // Implemented as stat boost on generation
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
  { id: 'rev', name: 'Revolver', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 3, statModifier: 'combat' },
  { id: 'shot', name: 'Shotgun', type: 'weapon', effect: '+2 Combat Dice', bonus: 2, cost: 5, statModifier: 'combat' },
  { id: 'tommy', name: 'Tommy Gun', type: 'weapon', effect: '+3 Combat Dice', bonus: 3, cost: 10, statModifier: 'combat' },
  { id: 'knife', name: 'Dagger', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 2, statModifier: 'combat' },
  
  { id: 'med', name: 'Medical Kit', type: 'consumable', effect: 'Heal 2 HP', bonus: 2, cost: 3 },
  { id: 'whiskey', name: 'Old Whiskey', type: 'consumable', effect: 'Heal 2 Sanity', bonus: 2, cost: 2 },
  
  { id: 'flash', name: 'Flashlight', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 2, statModifier: 'investigation' },
  { id: 'lens', name: 'Magnifying Glass', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 3, statModifier: 'investigation' },
  { id: 'map', name: 'Old Map', type: 'tool', effect: 'Explore further', cost: 2 },
  { id: 'boots', name: 'Sturdy Boots', type: 'tool', effect: '+1 Agility (Flee/Traps)', bonus: 1, cost: 4, statModifier: 'agility' },
  { id: 'coin', name: 'Lucky Coin', type: 'relic', effect: '+1 Agility', bonus: 1, cost: 3, statModifier: 'agility' },

  { id: 'coat', name: 'Heavy Coat', type: 'armor', effect: '-1 Physical Dmg Taken', bonus: 1, cost: 5, statModifier: 'physical_defense' },
  { id: 'amulet', name: 'Elder Sign', type: 'relic', effect: '-1 Sanity Dmg Taken', bonus: 1, cost: 6, statModifier: 'mental_defense' },
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3, cost: 8 }
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
  { 
    id: 'm1', 
    name: 'Hallucinations', 
    description: 'You see things that are not there. The world warps around you.', 
    effect: 'Severe visual distortion. No gameplay penalty... yet.', 
    visualClass: 'madness-hallucination' 
  },
  { 
    id: 'm2', 
    name: 'Paranoia', 
    description: 'They are watching you. You cannot close your eyes.', 
    effect: 'CANNOT use the Rest action. Tunnel vision.', 
    visualClass: 'madness-paranoia' 
  },
  { 
    id: 'm3', 
    name: 'Hysteria', 
    description: 'Your hands shake uncontrollably. Panic sets in.', 
    effect: '-1 Die on ALL skill checks. Screen shakes.', 
    visualClass: 'madness-hysteria' 
  },
  { 
    id: 'm4', 
    name: 'Catatonia', 
    description: 'Your mind retreats into darkness. You move sluggishly.', 
    effect: 'Max 1 Action per turn. World is dark.', 
    visualClass: 'madness-catatonia' 
  }
];

export const INDOOR_CONNECTORS = [
    'Narrow Hallway', 'Dark Corridor', 'Grand Staircase', 
    'Servant Passage', 'Dusty Landing', 'Maintenance Shaft',
    'Basement Tunnel', 'Service Elevator', 'Covered Walkway'
];

export const INDOOR_LOCATIONS = [
  'Abandoned Manor', 'Dark Cellar', 'The Library', 
  'Secret Crypt', 'Old Church', 'Police Station', 
  'Warehouse', 'Arkham Asylum', 'Historical Museum', 
  'St. Mary\'s Hospital', 'Sanitarium', 'Underground Vault',
  'Dusty Attic', 'Grand Hall', 'Study Room', 'Kitchen', 
  'Ritual Chamber', 'Boiler Room', 'Servant Quarters',
  'Ballroom', 'Conservatory', 'Billiard Room', 'Wine Cellar', 
  'Panic Room', 'Trophy Room', 'Greenhouse', 'Observatory', 
  'Master Bedroom', 'Nursery', 'Operating Theater', 'Padded Cell',
  'Alchemy Lab', 'Dissection Room', 'Apothecary', 'Lecture Hall', 'Records Room',
  'Dining Hall', 'Portrait Gallery', 'Smoking Room', 'Sunroom',
  'Hidden Passage', 'Coal Chute', 'Seance Room', 'Clock Tower', 'Bell Tower',
  'Warden\'s Office', 'Evidence Locker', 'Holding Cell', 'Archivist\'s Office',
  'Speakeasy', 'Bank Vault', 'Pawn Shop', 'Antique Store', 'Hotel Lobby', 'Radio Station'
];

export const OUTDOOR_CONNECTORS = [
    'Narrow Alley', 'Cobblestone Path', 'Foggy Bridge', 
    'Tram Track', 'Dark Tunnel', 'Stone Steps', 
    'River Crossing', 'Overpass', 'Dirt Trail'
];

export const OUTDOOR_LOCATIONS = [
  'Misty Docks', 'Town Square', 'Old Lighthouse', 
  'Blackwood Forest', 'Graveyard', 'University Campus', 
  'Market District', 'River Bank', 'Train Station', 
  'Swamp', 'City Park', 'Merchant Street', 'Dark Pier',
  'Dead End Alley', 'Crossroads', 'T-Junction', 'Roundabout', 
  'Collapsed Bridge', 'Rotting Gazebo', 'Fountain', 
  'Construction Site', 'Fish Market', 'Shipyard', 'Boardwalk', 
  'Tidal Pool', 'Cliffside Path', 'Tenement Row', 'Gas Station', 
  'Tram Stop', 'Theater District', 'Slums', 'Cornfield', 'Old Well', 
  'Stone Circle', 'Ritual Site', 'Cave Entrance',
  'Broad Avenue', 'Railway Crossing', 'Bus Stop'
];

export const LOCATION_NAMES = [...INDOOR_LOCATIONS, ...OUTDOOR_LOCATIONS, ...INDOOR_CONNECTORS, ...OUTDOOR_CONNECTORS];

// Combined list for Asset Generation
export const ALL_LOCATIONS_FULL = [
    'Train Station',
    ...INDOOR_LOCATIONS, 
    ...OUTDOOR_LOCATIONS, 
    ...INDOOR_CONNECTORS, 
    ...OUTDOOR_CONNECTORS
];

export const START_TILE: Tile = {
  id: 'start',
  q: 0,
  r: 0,
  name: 'Train Station',
  type: 'street',
  category: 'location',
  explored: true,
  searchable: true,
  searched: false
};

export const SCENARIOS: Scenario[] = [
  {
    id: 's1',
    title: 'The Gathering Dark',
    description: 'Strange disappearances have plagued Arkham. The police are baffled, but you know better. The stars are aligning, and something is trying to break through.',
    startDoom: 12,
    goal: 'Find 3 Clues to seal the gate before Doom reaches 0.',
    cluesRequired: 3,
    startLocation: 'Train Station',
    specialRule: 'Standard Rules. Enemies spawn from Gates.',
    difficulty: 'Normal',
    tileSet: 'mixed'
  },
  {
    id: 's2',
    title: 'Rise of the Deep Ones',
    description: 'The fog rolling off the Miskatonic River smells of brine and decay. The Order of Dagon has begun their ritual. You have very little time.',
    startDoom: 10,
    goal: 'Find 4 Clues to banish the Ancient One.',
    cluesRequired: 4,
    startLocation: 'Misty Docks',
    specialRule: 'Doom starts lower. Enemies are more aggressive.',
    difficulty: 'Hard',
    tileSet: 'outdoor'
  },
  {
    id: 's3',
    title: 'The Whispering Manor',
    description: 'You have been invited to the Blackwood Estate for the reading of a will, but the doors have locked behind you. The house itself seems alive.',
    startDoom: 8,
    goal: 'Find 3 Clues to unlock the main door.',
    cluesRequired: 3,
    startLocation: 'Grand Hall',
    specialRule: 'Tight corridors. All tiles are indoors.',
    difficulty: 'Nightmare',
    tileSet: 'indoor'
  },
  {
    id: 's4',
    title: 'The Silent City',
    description: 'A supernatural silence has fallen. Supplies are scarce, and the shadows hide lethal snipers. You must move quietly.',
    startDoom: 9,
    goal: 'Survive and find 3 Clues.',
    cluesRequired: 3,
    startLocation: 'Town Square',
    specialRule: 'Reduced Vision Range. Items are rare.',
    difficulty: 'Hard',
    tileSet: 'mixed'
  }
];

export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist',
    type: 'cultist',
    hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    visualPrompt: 'A cloaked cultist in dark robes with a hood obscuring their face, holding a jagged dagger. Dark, gritty, 1920s noir style.',
    lore: 'Often recruited from the desperate and the mad, these individuals have traded their humanity for forbidden knowledge.',
    defeatFlavor: 'The cultist collapses, clutching a dark amulet.'
  },
  sniper: {
    name: 'Cult Sniper',
    type: 'sniper',
    hp: 2, damage: 1, horror: 0,
    description: 'An assassin striking from the shadows.',
    visualPrompt: 'A menacing figure in a trench coat and fedora, holding a long rifle, hiding in the shadows of a brick building. Film noir aesthetic.',
    lore: 'Armed with stolen military rifles, they guard the ritual sites from a distance, prioritizing targets who know too much.',
    defeatFlavor: 'The sniper falls, their rifle clattering to the ground.'
  },
  priest: {
    name: 'Dark Priest',
    type: 'priest',
    hp: 3, damage: 0, horror: 2,
    description: 'A chanter of doom.',
    visualPrompt: 'An insane priest in tattered ceremonial vestments, eyes glowing with madness, chanting from a forbidden tome. Eldritch energy around them.',
    lore: 'Their very voice warps reality. They do not fight with weapons, but with words that accelerate the coming of the end.',
    defeatFlavor: 'The chanting stops abruptly as the priest exhales their last breath.'
  },
  ghoul: {
    name: 'Ghoul',
    type: 'ghoul',
    hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    visualPrompt: 'A hunched, canine-like humanoid with rubbery skin, hoof-like feet, and a face like a dog, crouching in a graveyard. Lovecraftian horror art.',
    lore: 'Canine-like humanoids that dwell in crypts and tunnels beneath the city. They are strangely intelligent and bargain with terrible secrets.',
    defeatFlavor: 'It collapses into a pile of dust and grave-dirt!'
  },
  deepone: {
    name: 'Deep One',
    type: 'deepone',
    hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    visualPrompt: 'A fish-frog hybrid humanoid with glistening gray-green scales, a white belly, bulging unblinking eyes, and gills on the neck. Wet and slimy atmosphere.',
    lore: 'Servants of Dagon who dwell in underwater cities. They seek to breed with humans to extend their lineage onto land.',
    defeatFlavor: 'The creature dissolves into a foul-smelling puddle of brine.'
  },
  shoggoth: {
    name: 'Shoggoth',
    type: 'shoggoth',
    hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    visualPrompt: 'A massive, shapeless monstrosity of iridescent black slime, covered in thousands of forming and unforming eyes and mouths. Protoplasmic horror.',
    lore: 'Created as slave labor by the Elder Things eons ago. They are shifting, amorphous mountains of slime that crush everything in their path.',
    traits: ['massive'],
    defeatFlavor: 'The massive form loses cohesion, becoming a lifeless pool of slime.'
  },
  'mi-go': {
    name: 'Mi-Go',
    type: 'mi-go',
    hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    visualPrompt: 'A pinkish, fungoid, crustacean-like alien creature with large membranous wings and an ellipsoid head covered in antennae. Cosmic horror sci-fi style.',
    lore: 'They fly through the ether of space on membranous wings. Their technology is far beyond human comprehension, often involving brain extraction.',
    traits: ['flying'],
    defeatFlavor: 'The fungoid body disintegrates, vibrating out of existence.'
  },
  nightgaunt: {
    name: 'Nightgaunt',
    type: 'nightgaunt',
    hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    visualPrompt: 'A sleek, oily black humanoid creature with no face, large curved horns, and bat-like wings. Silent and menacing.',
    lore: 'Silent servants of Nodens. They do not speak, but tickle their victims into submission before carrying them off to the Dreamlands.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky without a sound.'
  },
  hound: {
    name: 'Hound of Tindalos',
    type: 'hound',
    hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    visualPrompt: 'A lean, emaciated beast emerging from a sharp angle in the room. It looks made of smoke and blue ichor, with a long tongue. Non-euclidean horror.',
    lore: 'They enter our reality through sharp angles in a room. Once they catch a scent, they pursue their prey across time itself.',
    traits: ['fast'],
    defeatFlavor: 'The beast recedes back into the angles of reality.'
  },
  dark_young: {
    name: 'Dark Young',
    type: 'dark_young',
    hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    visualPrompt: 'A terrifying mass of ropy black tentacles and hooves, resembling a twisted, leafless tree that walks. Smelling of grave mold.',
    lore: 'Enormous, tree-like monstrosities with hoofed legs and ropy tentacles smelling of grave mold.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers, resembling a dead tree.'
  },
  byakhee: {
    name: 'Byakhee',
    type: 'byakhee',
    hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    visualPrompt: 'A hybrid monster partly crow, partly mole, partly ant, and partly decomposing human corpse. It has wings and can fly through space.',
    lore: 'composed of crow, mole, buzzard, ant, and decomposed human being. They can fly through space and carry riders to the court of Azathoth.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It screeches one last time before dissolving into cosmic dust.'
  },
  star_spawn: {
    name: 'Star Spawn',
    type: 'star_spawn',
    hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    visualPrompt: 'A gigantic, green, gelatinous monster with an octopus-like head, dragon wings, and claws. A smaller version of Cthulhu.',
    lore: 'Smaller versions of the Great Dreamer himself. Their psychic presence alone can shatter the minds of the strongest investigators.',
    traits: ['massive'],
    defeatFlavor: 'The ground shakes as the colossal entity falls.'
  },
  formless_spawn: {
    name: 'Formless Spawn',
    type: 'formless_spawn',
    hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    visualPrompt: 'A pitch-black, liquid shapeshifter changing forms rapidly. An oily toad-like shape emerging from the ooze.',
    lore: 'A malleable black substance that can change shape instantly. It heals rapidly from physical wounds.',
    traits: ['regenerate'],
    defeatFlavor: 'The black ooze evaporates, leaving a stain on reality.'
  },
  hunting_horror: {
    name: 'Hunting Horror',
    type: 'hunting_horror',
    hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    visualPrompt: 'A colossal, serpentine creature flying through the air, resembling a dragon without wings, with a single distorted face.',
    lore: 'A massive, serpentine entity resembling a dragon without wings. It serves Nyarlathotep and hunts those who pry too deep.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in on itself and vanishes in a flash of light.'
  },
  moon_beast: {
    name: 'Moon-Beast',
    type: 'moon_beast',
    hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    visualPrompt: 'A pale, toad-like abomination with no eyes and a mass of short, pink tentacles vibrating on its snout. Squat and loathsome.',
    lore: 'Pale, toad-like abominations with no eyes and a mass of pink tentacles on their snout. They enslave other races.',
    traits: ['ranged'],
    defeatFlavor: 'The pale abomination falls silent.'
  },
  boss: {
    name: 'Ancient One',
    type: 'boss',
    hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    visualPrompt: 'A cosmic entity of impossible geometry, surrounded by madness and void. An avatar of Nyarlathotep or Cthulhu.',
    lore: 'You should not be seeing this. If you are, the end is already here.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is banished, screaming as it is pulled back into the void.'
  }
};
