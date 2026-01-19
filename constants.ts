
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

export const INDOOR_LOCATIONS = [
    'Abandoned Manor', 'Dark Cellar', 'The Library', 'Secret Crypt', 'Old Church', 'Police Station', 'Warehouse', 'Arkham Asylum', 'Historical Museum', 'St. Mary\'s Hospital', 
    'Sanitarium', 'Underground Vault', 'Dusty Attic', 'Grand Hall', 'Study Room', 'Ritual Chamber', 'Boiler Room', 'Velvet Lounge', 'Opium Den', 'Grand Theater', 
    'Clock Tower Interior', 'Private Study', 'Damp Basement', 'Hidden Laboratory', 'Trophy Room', 'Servant Quarters', 'Billiard Room', 'Wine Cellar', 'Cold Storage', 
    'Padded Cell', 'Archives', 'Anatomy Theater', 'Gothic Chapel', 'Observatory', 'Vaulted Library', 'Secret Passage', 'Dusty Parlor', 'Morning Room', 'Ballroom',
    'Curio Shop', 'Old Bookstore', 'Printing Press', 'Mayor\'s Office', 'Holding Cell', 'Armory', 'Masonic Lodge', 'Silver Twilight Lodge', 'Witch House Attic', 
    'Gilman House Hotel Room', 'Marsh Refinery Office', 'Esoteric Order of Dagon Hall', 'First National Bank Vault', 'Orne Library Stacks', 'Miskatonic Exhibit'
];

export const OUTDOOR_LOCATIONS = [
    'Misty Docks', 'Town Square', 'Old Lighthouse', 'Blackwood Forest', 'Graveyard', 'University Campus', 'Market District', 'River Bank', 'Train Station', 'Swamp', 
    'City Park', 'Merchant Street', 'Dark Pier', 'Hanging Tree', 'Ruined Farmhouse', 'Overgrown Garden', 'Foggy Harbor', 'Lonely Crossroads', 'Cemetery Gate', 
    'Stone Circle', 'Miskatonic Bridge', 'Innsmouth Wharf', 'Devil Reef', 'Sentinel Hill', 'Blasted Heath', 'Aylesbury Pike', 'Whateley Farm', 'Cold Spring', 
    'Dead Man\'s Point', 'Whalebone Beach', 'Shuttered Street', 'Alley of Shadows', 'Rainy Courtyard', 'Abandoned Fairground', 'Old Mill', 'Deserted Pier', 
    'Kingsport Cliffs', 'Strange High House in the Mist', 'Plateau of Leng', 'Vale of Pnath', 'Dreamlands Forest', 'Ulthar Street', 'Celephaïs Gate'
];

export const INDOOR_CONNECTORS = [
    'Narrow Hallway', 'Dark Corridor', 'Grand Staircase', 'Servant Passage', 'Dusty Landing', 'Maintenance Shaft', 'Basement Tunnel', 'Service Elevator', 
    'Spiral Stairs', 'Crawlspace', 'Iron Rung Ladder', 'Vaulted Walkway', 'Dim Vestibule', 'Shadowed Foyer', 'Gallery Bridge'
];

export const OUTDOOR_CONNECTORS = [
    'Narrow Alley', 'Cobblestone Path', 'Foggy Bridge', 'Tram Track', 'Dark Tunnel', 'Stone Steps', 'River Crossing', 'Overpass', 'Dirt Trail', 
    'Winding Lane', 'Muddy Track', 'Overgrown Path', 'Brick Walkway', 'Misty Quay', 'Desolate Road', 'Sewer Tunnel', 'Drainage Pipe'
];

export const ALL_LOCATIONS_FULL = ['Train Station', ...INDOOR_LOCATIONS, ...OUTDOOR_LOCATIONS, ...INDOOR_CONNECTORS, ...OUTDOOR_CONNECTORS];

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
        { id: 'step1', description: 'Find the Dark Priest', type: 'find_item', targetId: 'location_intel', completed: false },
        { id: 'step2', description: 'Kill the Dark Priest', type: 'kill_enemy', targetId: 'priest', amount: 1, completed: false }
    ],
    doomEvents: [
        { threshold: 7, triggered: false, type: 'spawn_enemy', targetId: 'deepone', amount: 2, message: 'Deep Ones rise from the sewers.' },
        { threshold: 4, triggered: false, type: 'buff_enemies', message: 'The ritual empowers all enemies! (+1 HP)' },
        { threshold: 2, triggered: false, type: 'spawn_boss', targetId: 'shoggoth', message: 'The Priest summons a guardian!' }
    ]
  }
];

export const START_TILE: Tile = {
  id: 'start', q: 0, r: 0, name: 'Train Station', type: 'street', category: 'location', explored: true, searchable: true, searched: false
};

// Added missing 'shade' entry to fulfill Record<EnemyType, BestiaryEntry>
export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist', type: 'cultist', hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    visualPrompt: 'A sinister cultist in hooded robes, 1920s horror style.',
    lore: 'Recruited from the desperate and the mad.',
    defeatFlavor: 'The cultist collapses, a dark amulet shattering.',
    traits: []
  },
  ghoul: {
    name: 'Ghoul', type: 'ghoul', hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    visualPrompt: 'A hunched, canine-like humanoid with rubbery skin.',
    lore: 'Subterranean dwellers that feast on the dead.',
    defeatFlavor: 'It collapses into grave dirt.',
    traits: ['scavenger']
  },
  deepone: {
    name: 'Deep One', type: 'deepone', hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    visualPrompt: 'A fish-frog hybrid humanoid with glistening scales.',
    lore: 'Immortal servants of Father Dagon.',
    defeatFlavor: 'The creature dissolves into brine.',
    traits: ['aquatic']
  },
  shoggoth: {
    name: 'Shoggoth', type: 'shoggoth', hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    visualPrompt: 'A massive monstrosity of iridescent black slime.',
    lore: 'A nightmarish slave race created by the Elder Things.',
    traits: ['massive', 'slow'],
    defeatFlavor: 'The massive form loses cohesion.'
  },
  sniper: {
    name: 'Cultist Sniper', type: 'sniper', hp: 2, damage: 2, horror: 1,
    description: 'A cultist armed with a long-range rifle.',
    visualPrompt: 'A hooded cultist with a vintage sniper rifle, 1920s horror style.',
    lore: 'Chosen for their steady hands and lack of remorse.',
    traits: ['ranged'],
    defeatFlavor: 'The sniper falls from their perch.'
  },
  priest: {
    name: 'Dark Priest', type: 'priest', hp: 5, damage: 2, horror: 3,
    description: 'A high-ranking member of the cult, channeling dark energies.',
    visualPrompt: 'A cult priest in ornate robes, surrounded by dark energy.',
    lore: 'They have traded their humanity for forbidden power.',
    traits: ['elite'],
    defeatFlavor: 'The priest screams as the darkness consumes them.'
  },
  'mi-go': {
    name: 'Mi-Go', type: 'mi-go', hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    visualPrompt: 'A pinkish, fungoid alien with large wings.',
    lore: 'Fungi from Yuggoth who fly through space.',
    traits: ['flying'],
    defeatFlavor: 'The body disintegrates.'
  },
  nightgaunt: {
    name: 'Nightgaunt', type: 'nightgaunt', hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    visualPrompt: 'A sleek black humanoid with bat wings and no face.',
    lore: 'Faceless servants of Nodens.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky.'
  },
  hound: {
    name: 'Hound of Tindalos', type: 'hound', hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    visualPrompt: 'A lean, emaciated beast emerging from a corner.',
    lore: 'Predators that inhabit the angles of time.',
    traits: ['fast', 'ambusher'],
    defeatFlavor: 'The beast recedes into the angles.'
  },
  dark_young: {
    name: 'Dark Young', type: 'dark_young', hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    visualPrompt: 'A mass of black tentacles and hooves.',
    lore: 'The Black Goat of the Woods.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers.'
  },
  byakhee: {
    name: 'Byakhee', type: 'byakhee', hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    visualPrompt: 'A disturbing hybrid monster of crow, mole, and ant.',
    lore: 'Interstellar steeds serving Hastur.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It dissolves into cosmic dust.'
  },
  star_spawn: {
    name: 'Star Spawn', type: 'star_spawn', hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    visualPrompt: 'A gigantic, green monster with octopus head.',
    lore: 'Smaller versions of the Great Dreamer.',
    traits: ['massive'],
    defeatFlavor: 'The entity liquefies into green ooze.'
  },
  formless_spawn: {
    name: 'Formless Spawn', type: 'formless_spawn', hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    visualPrompt: 'A pitch-black, liquid shapeshifter.',
    lore: 'Living puddles of black ichor.',
    traits: ['regenerate'],
    defeatFlavor: 'The ooze evaporates into foul steam.'
  },
  hunting_horror: {
    name: 'Hunting Horror', type: 'hunting_horror', hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    visualPrompt: 'A colossal, serpentine flyer with a distorted face.',
    lore: 'A serpentine entity that serves Nyarlathotep.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in and vanishes.'
  },
  moon_beast: {
    name: 'Moon-Beast', type: 'moon_beast', hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    visualPrompt: 'A pale, toad-like abomination with no eyes.',
    lore: 'Sadistic beings from the Dreamlands.',
    traits: ['ranged'],
    defeatFlavor: 'The abomination falls silent.'
  },
  shade: {
    name: 'Shade', type: 'shade', hp: 2, damage: 1, horror: 3,
    description: 'A flickering remnant of a soul, or something far worse.',
    visualPrompt: 'A semi-transparent, elongated shadow reaching out from corners.',
    lore: 'Some say they are the echoes of those taken by the void.',
    traits: ['ethereal'],
    defeatFlavor: 'The darkness loses its shape and vanishes.'
  },
  boss: {
    name: 'Ancient One', type: 'boss', hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    visualPrompt: 'A cosmic entity of impossible geometry.',
    lore: 'An intrusion from outside the ordered universe.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is pulled back into the void.'
  }
};

export const ITEMS: Item[] = [
  { id: 'rev', name: 'Revolver', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 3, statModifier: 'combat' },
  { id: 'shot', name: 'Shotgun', type: 'weapon', effect: '+2 Combat Dice', bonus: 2, cost: 5, statModifier: 'combat' },
  { id: 'tommy', name: 'Tommy Gun', type: 'weapon', effect: '+3 Combat Dice', bonus: 3, cost: 10, statModifier: 'combat' },
  { id: 'med', name: 'Medical Kit', type: 'consumable', effect: 'Heal 2 HP', bonus: 2, cost: 3 },
  { id: 'whiskey', name: 'Old Whiskey', type: 'consumable', effect: 'Heal 2 Sanity', bonus: 2, cost: 2 },
  { id: 'flash', name: 'Flashlight', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 2, statModifier: 'investigation' },
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3, cost: 8 }
];

export const EVENTS: EventCard[] = [
  { id: 'e1', title: 'Shadows in the Dark', description: 'You feel watched. Lose 1 Sanity.', effectType: 'sanity', value: -1 },
  { id: 'e2', title: 'Hidden Diary', description: 'Found important notes! +1 Insight.', effectType: 'insight', value: 1 },
  { id: 'e3', title: 'Dark Ritual', description: 'You stumble upon a ceremony!', effectType: 'spawn', value: 1 }
];

export const MADNESS_CONDITIONS: Madness[] = [
  { id: 'm1', name: 'Hallucinations', description: 'You see things.', effect: 'Visual distortion.', visualClass: 'madness-hallucination' },
  { id: 'm2', name: 'Paranoia', description: 'They are watching.', effect: 'Cannot Rest.', visualClass: 'madness-paranoia' }
];

export const SCENARIO_MODIFIERS: ScenarioModifier[] = [
    { id: 'mod1', name: 'Thick Fog', description: 'The town is shrouded in an unnatural mist. Vision is severely reduced.', effect: 'reduced_vision', weatherType: 'fog' },
    { id: 'mod2', name: 'Cursed Rain', description: 'A black, oily rain falls from the sky, chilling you to the bone.', effect: 'hazardous_weather', weatherType: 'rain' },
    { id: 'mod3', name: 'Cosmic Miasma', description: 'The air glows with a sickly purple light.', effect: 'reduced_vision', weatherType: 'miasma' },
    { id: 'mod4', name: 'Void Storm', description: 'Cubes of non-existence float through the air.', effect: 'reduced_vision', weatherType: 'void_storm' }
];

export const TRAIT_POOL: Trait[] = [
    { id: 't1', name: 'Hardened', description: '+1 Max HP', type: 'positive', effect: 'combat_bonus' }
];
