
import { Character, CharacterType, Item, EventCard, Tile, Scenario, Madness, Spell, BestiaryEntry, EnemyType } from './types';

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
  { id: 'e3', title: 'Ambush!', description: 'A cultist strikes from the shadows!', effectType: 'health', value: -1 },
  { id: 'e4', title: 'Helpful Witness', description: 'A local points the way. +1 Insight.', effectType: 'insight', value: 1 },
  { id: 'e5', title: 'Eldritch Sign', description: 'The ritual accelerates! Doom -1.', effectType: 'doom', value: -1 },
  { id: 'e6', title: 'Cold Mist', description: 'A bone-chilling mist surrounds you.', effectType: 'health', value: -1 },
  { id: 'e7', title: 'Sudden Clarity', description: 'The pattern becomes clear.', effectType: 'insight', value: 2 },
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

export const OUTDOOR_LOCATIONS = [
  'Misty Docks', 'Town Square', 'Back Alley', 
  'Old Lighthouse', 'Blackwood Forest', 'Graveyard', 
  'University Campus', 'Bridge', 'Market District', 
  'River Bank', 'Train Station', 'Swamp', 'City Park',
  'Merchant Street', 'Dark Pier',
  'Dead End Alley', 'Crossroads', 'T-Junction', 'Roundabout', 
  'Collapsed Bridge', 'Overgrown Path', 'Rotting Gazebo', 
  'Fountain', 'Construction Site',
  'Fish Market', 'Shipyard', 'Boardwalk', 'Tidal Pool', 'Cliffside Path',
  'Tenement Row', 'Cobblestone Street', 'Gas Station', 'Tram Stop', 'Theater District', 'Slums',
  'Cornfield', 'Old Well', 'Stone Circle', 'Ritual Site', 'Cave Entrance',
  'Narrow Lane', 'Broad Avenue', 'Underpass', 'Railway Crossing', 'Bus Stop'
];

export const LOCATION_NAMES = [...INDOOR_LOCATIONS, ...OUTDOOR_LOCATIONS];

export const START_TILE: Tile = {
  id: 'start',
  q: 0,
  r: 0,
  name: 'Train Station',
  type: 'street',
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
  }
];

export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist',
    type: 'cultist',
    hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    lore: 'Often recruited from the desperate and the mad, these individuals have traded their humanity for forbidden knowledge.',
    defeatFlavor: 'The cultist collapses, clutching a dark amulet.'
  },
  sniper: {
    name: 'Cult Sniper',
    type: 'sniper',
    hp: 2, damage: 1, horror: 0,
    description: 'An assassin striking from the shadows.',
    lore: 'Armed with stolen military rifles, they guard the ritual sites from a distance, prioritizing targets who know too much.',
    defeatFlavor: 'The sniper falls, their rifle clattering to the ground.'
  },
  priest: {
    name: 'Dark Priest',
    type: 'priest',
    hp: 3, damage: 0, horror: 2,
    description: 'A chanter of doom.',
    lore: 'Their very voice warps reality. They do not fight with weapons, but with words that accelerate the coming of the end.',
    defeatFlavor: 'The chanting stops abruptly as the priest exhales their last breath.'
  },
  ghoul: {
    name: 'Ghoul',
    type: 'ghoul',
    hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    lore: 'Canine-like humanoids that dwell in crypts and tunnels beneath the city. They are strangely intelligent and bargain with terrible secrets.',
    defeatFlavor: 'It collapses into a pile of dust and grave-dirt!'
  },
  deepone: {
    name: 'Deep One',
    type: 'deepone',
    hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    lore: 'Servants of Dagon who dwell in underwater cities. They seek to breed with humans to extend their lineage onto land.',
    defeatFlavor: 'The creature dissolves into a foul-smelling puddle of brine.'
  },
  shoggoth: {
    name: 'Shoggoth',
    type: 'shoggoth',
    hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    lore: 'Created as slave labor by the Elder Things eons ago. They are shifting, amorphous mountains of slime that crush everything in their path.',
    traits: ['massive'],
    defeatFlavor: 'The massive form loses cohesion, becoming a lifeless pool of slime.'
  },
  'mi-go': {
    name: 'Mi-Go',
    type: 'mi-go',
    hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    lore: 'They fly through the ether of space on membranous wings. Their technology is far beyond human comprehension, often involving brain extraction.',
    traits: ['flying'],
    defeatFlavor: 'The fungoid body disintegrates, vibrating out of existence.'
  },
  nightgaunt: {
    name: 'Nightgaunt',
    type: 'nightgaunt',
    hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    lore: 'Silent servants of Nodens. They do not speak, but tickle their victims into submission before carrying them off to the Dreamlands.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky without a sound.'
  },
  hound: {
    name: 'Hound of Tindalos',
    type: 'hound',
    hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    lore: 'They enter our reality through sharp angles in a room. Once they catch a scent, they pursue their prey across time itself.',
    traits: ['fast'],
    defeatFlavor: 'The beast recedes back into the angles of reality.'
  },
  dark_young: {
    name: 'Dark Young',
    type: 'dark_young',
    hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    lore: 'Enormous, tree-like monstrosities with hoofed legs and ropy tentacles smelling of grave mold.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers, resembling a dead tree.'
  },
  byakhee: {
    name: 'Byakhee',
    type: 'byakhee',
    hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    lore: 'composed of crow, mole, buzzard, ant, and decomposed human being. They can fly through space and carry riders to the court of Azathoth.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It screeches one last time before dissolving into cosmic dust.'
  },
  star_spawn: {
    name: 'Star Spawn',
    type: 'star_spawn',
    hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    lore: 'Smaller versions of the Great Dreamer himself. Their psychic presence alone can shatter the minds of the strongest investigators.',
    traits: ['massive'],
    defeatFlavor: 'The ground shakes as the colossal entity falls.'
  },
  formless_spawn: {
    name: 'Formless Spawn',
    type: 'formless_spawn',
    hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    lore: 'A malleable black substance that can change shape instantly. It heals rapidly from physical wounds.',
    traits: ['regenerate'],
    defeatFlavor: 'The black ooze evaporates, leaving a stain on reality.'
  },
  hunting_horror: {
    name: 'Hunting Horror',
    type: 'hunting_horror',
    hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    lore: 'A massive, serpentine entity resembling a dragon without wings. It serves Nyarlathotep and hunts those who pry too deep.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in on itself and vanishes in a flash of light.'
  },
  moon_beast: {
    name: 'Moon-Beast',
    type: 'moon_beast',
    hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    lore: 'Pale, toad-like abominations with no eyes and a mass of pink tentacles on their snout. They enslave other races.',
    traits: ['ranged'],
    defeatFlavor: 'The pale abomination falls silent.'
  },
  boss: {
    name: 'Ancient One',
    type: 'boss',
    hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    lore: 'You should not be seeing this. If you are, the end is already here.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is banished, screaming as it is pulled back into the void.'
  }
};
