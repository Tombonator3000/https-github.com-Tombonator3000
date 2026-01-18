
import { Character, CharacterType, Item, EventCard, Tile, Scenario, Madness, Spell, BestiaryEntry, EnemyType, Trait, ScenarioModifier, TileObjectType } from './types';

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
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3, cost: 8 },

  // CURSED ITEMS - High risk, high reward
  {
    id: 'bloodknife',
    name: 'Bloodthirsty Dagger',
    type: 'weapon',
    effect: '+3 Combat Dice',
    bonus: 3,
    cost: 4,
    statModifier: 'combat',
    cursed: true,
    curseEffect: 'Lose 1 HP after each kill'
  },
  {
    id: 'cursedamulet',
    name: 'Cursed Bone Amulet',
    type: 'relic',
    effect: '+2 Max HP',
    bonus: 2,
    cost: 3,
    cursed: true,
    curseEffect: 'Cannot heal above 4 HP'
  },
  {
    id: 'madtome',
    name: 'Mad Prophet\'s Tome',
    type: 'relic',
    effect: 'Start with +3 Insight',
    bonus: 3,
    cost: 2,
    cursed: true,
    curseEffect: 'Permanently start with Hallucinations (visual distortion)'
  },
  {
    id: 'voidlens',
    name: 'Lens of the Void',
    type: 'tool',
    effect: '+2 Investigation Dice',
    bonus: 2,
    cost: 3,
    statModifier: 'investigation',
    cursed: true,
    curseEffect: 'Lose 1 Sanity when finding clues'
  },
  {
    id: 'hungryarmor',
    name: 'Living Armor',
    type: 'armor',
    effect: '-2 Physical Dmg Taken',
    bonus: 2,
    cost: 4,
    statModifier: 'physical_defense',
    cursed: true,
    curseEffect: 'Cannot use Rest action (armor hungers)'
  }
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
    'Basement Tunnel', 'Service Elevator', 'Covered Walkway',
    'Dumbwaiter Shaft', 'Laundry Chute', 'Ventilation Duct',
    'Spiral Staircase', 'Secret Bookshelf Passage', 'Crawlspace',
    'Attic Hatch', 'Fire Pole', 'Service Lift', 'Catacomb Tunnel'
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
  'Speakeasy', 'Bank Vault', 'Pawn Shop', 'Antique Store', 'Hotel Lobby', 'Radio Station',
  'Cold Storage', 'Furnace Room', 'Taxidermy Studio', 'Map Room', 'Telegraph Office',
  'Projection Booth', 'Costume Dept', 'Dressing Room', 'Wine Press', 'Root Cellar',
  'Opium Den', 'Hidden Shrine', 'Morgue Drawer', 'Incinerator', 'Chantry', 'Organ Loft',
  'Confessional', 'Sacristy', 'Vestry', 'Mausoleum Interior'
];

export const OUTDOOR_CONNECTORS = [
    'Narrow Alley', 'Cobblestone Path', 'Foggy Bridge', 
    'Tram Track', 'Dark Tunnel', 'Stone Steps', 
    'River Crossing', 'Overpass', 'Dirt Trail',
    'Rickety Bridge', 'Muddy Trail', 'Sewer Entrance', 
    'Fire Escape', 'Rooftop Walkway', 'Wooden Plank', 
    'Suspension Bridge', 'Gravel Road', 'Deer Path'
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
  'Broad Avenue', 'Railway Crossing', 'Bus Stop',
  'Bandstand', 'Monument', 'Gallows Hill', 'Whaling Ship Deck',
  'Cargo Hold', 'Crow\'s Nest', 'Jagged Reef', 'Sandbar',
  'Driftwood Pile', 'Burned Church Ruins', 'Potter\'s Field',
  'Open Grave', 'Gargoyle Perch', 'Water Tower', 'Chimney Stack',
  'Boxcar', 'Ticket Booth', 'Newsstand', 'Shoeshine Stand'
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

// Available object types for procedural generation logic
export const TILE_INTERACTABLES: TileObjectType[] = [
    'bookshelf', 'crate', 'chest', 'cabinet', 'radio', 
    'switch', 'mirror', 'statue', 'altar', 'rubble',
    'locked_door', 'barricade', 'fog_wall', 'trap', 'fire'
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
  // SCENARIO 1: ESCAPE - Find key and escape the manor
  {
    id: 's1',
    title: 'Escape from Blackwood Manor',
    description: 'The doors have locked behind you. You hear chanting from below. Find the Exit Key and escape before the ritual completes.',
    startDoom: 12,
    goal: 'Find the Exit Key, locate the Exit Door, and escape alive.',
    victoryType: 'escape',
    steps: [
      {
        id: 1,
        description: 'Search rooms to find the Brass Exit Key',
        completed: false,
        trigger: 'investigate_success',
        targetItem: 'exit_key'
      },
      {
        id: 2,
        description: 'Locate the Exit Door (appears after finding key)',
        completed: false,
        trigger: 'move_to_tile',
        targetTileName: 'Exit Door'
      },
      {
        id: 3,
        description: 'Reach the Exit Door and escape',
        completed: false,
        trigger: 'interact'
      }
    ],
    doomEvents: [
      {
        doomThreshold: 8,
        description: 'The ritual intensifies. Cultists are alerted!',
        effect: 'spawn_enemies',
        value: 2,
        enemyType: 'cultist'
      },
      {
        doomThreshold: 5,
        description: 'Reality weakens. The walls bleed.',
        effect: 'spawn_enemies',
        value: 1,
        enemyType: 'ghoul'
      },
      {
        doomThreshold: 2,
        description: 'THE GUARDIAN AWAKENS!',
        effect: 'spawn_boss',
        enemyType: 'shoggoth'
      }
    ],
    cluesRequired: 0, // Legacy field
    startLocation: 'Grand Hall',
    specialRule: 'Exit Door spawns after finding key. Must reach exit to win.',
    difficulty: 'Normal',
    tileSet: 'indoor'
  },

  // SCENARIO 2: ASSASSINATION - Kill the High Priest
  {
    id: 's2',
    title: 'Assassination of the High Priest',
    description: 'The Dark Priest must die before the summoning completes. Hunt him down in the misty streets of Innsmouth.',
    startDoom: 10,
    goal: 'Find and kill the Dark Priest before Doom reaches 0.',
    victoryType: 'assassination',
    steps: [
      {
        id: 1,
        description: 'Hunt down the Dark Priest',
        completed: false,
        trigger: 'kill_enemy',
        targetEnemy: 'priest'
      }
    ],
    doomEvents: [
      {
        doomThreshold: 7,
        description: 'Deep Ones emerge from the harbor!',
        effect: 'spawn_enemies',
        value: 2,
        enemyType: 'deepone'
      },
      {
        doomThreshold: 4,
        description: 'The Priest begins the final incantation!',
        effect: 'buff_enemies',
        value: 1 // +1 HP to all enemies
      },
      {
        doomThreshold: 2,
        description: 'SHOGGOTH GUARDIAN SUMMONED!',
        effect: 'spawn_boss',
        enemyType: 'shoggoth'
      }
    ],
    cluesRequired: 0,
    startLocation: 'Misty Docks',
    specialRule: 'Dark Priest spawns after 3 rounds. Kill him to win.',
    difficulty: 'Hard',
    tileSet: 'outdoor'
  },

  // SCENARIO 3: COLLECTION - Gather 3 Sacred Candles
  {
    id: 's3',
    title: 'The Ritual of Binding',
    description: 'To seal the gate, you must find the three Sacred Candles and place them on the Ancient Altars.',
    startDoom: 11,
    goal: 'Find all 3 Sacred Candles and place them on Altars.',
    victoryType: 'collection',
    steps: [
      {
        id: 1,
        description: 'Find the White Candle',
        completed: false,
        trigger: 'investigate_success',
        targetItem: 'white_candle'
      },
      {
        id: 2,
        description: 'Find the Red Candle',
        completed: false,
        trigger: 'investigate_success',
        targetItem: 'red_candle'
      },
      {
        id: 3,
        description: 'Find the Black Candle',
        completed: false,
        trigger: 'investigate_success',
        targetItem: 'black_candle'
      },
      {
        id: 4,
        description: 'Place all candles on Altars to complete the ritual',
        completed: false,
        trigger: 'interact'
      }
    ],
    doomEvents: [
      {
        doomThreshold: 7,
        description: 'The Hounds smell your scent...',
        effect: 'spawn_enemies',
        value: 1,
        enemyType: 'hound'
      },
      {
        doomThreshold: 4,
        description: 'Nightgaunts descend from above!',
        effect: 'spawn_enemies',
        value: 2,
        enemyType: 'nightgaunt'
      }
    ],
    cluesRequired: 0,
    startLocation: 'Old Church',
    specialRule: 'Sacred Candles spawn randomly in searchable tiles. Must collect all 3.',
    difficulty: 'Normal',
    tileSet: 'mixed'
  },

  // SCENARIO 4: SURVIVAL - Last 10 rounds
  {
    id: 's4',
    title: 'The Siege of Arkham',
    description: 'The town is overrun. Barricade yourself and survive until dawn. Hold out for 10 rounds.',
    startDoom: 15,
    goal: 'Survive for 10 rounds against endless waves.',
    victoryType: 'survival',
    steps: [
      {
        id: 1,
        description: 'Survive until Round 10',
        completed: false,
        trigger: 'survive_rounds',
        roundsToSurvive: 10
      }
    ],
    doomEvents: [
      {
        doomThreshold: 10,
        description: 'First wave: Cultists attack!',
        effect: 'spawn_enemies',
        value: 3,
        enemyType: 'cultist'
      },
      {
        doomThreshold: 7,
        description: 'Second wave: Ghouls break through!',
        effect: 'spawn_enemies',
        value: 2,
        enemyType: 'ghoul'
      },
      {
        doomThreshold: 4,
        description: 'Final wave: HORROR UNLEASHED!',
        effect: 'spawn_enemies',
        value: 1,
        enemyType: 'hunting_horror'
      }
    ],
    cluesRequired: 0,
    startLocation: 'Town Square',
    specialRule: 'Enemy waves spawn at specific Doom thresholds. Survive 10 rounds to win.',
    difficulty: 'Hard',
    tileSet: 'outdoor'
  },

  // SCENARIO 5: RANDOM - Generated at runtime
  {
    id: 's5',
    title: 'The Unknown Horror',
    description: 'Something stirs in the darkness. Your mission will be revealed when you arrive...',
    startDoom: 12,
    goal: 'Mission objectives will be generated upon arrival.',
    victoryType: 'random',
    steps: [], // Will be populated at runtime
    doomEvents: [], // Will be populated at runtime
    cluesRequired: 0,
    startLocation: 'Train Station',
    specialRule: 'RANDOMIZED SCENARIO - Goal and steps generated when game starts.',
    difficulty: 'Normal',
    tileSet: 'mixed'
  }
];

export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist',
    type: 'cultist',
    hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    visualPrompt: 'A sinister cultist in ragged, hooded robes, face obscured by shadow, clutching a jagged ceremonial dagger. Dramatic chiaroscuro lighting, 1920s horror illustration style, oil painting texture.',
    lore: 'Recruited from the desperate and the mad, these fanatics have traded their humanity for forbidden promises. They seek only to usher in the end times, chanting in tongues that make the ears bleed.',
    defeatFlavor: 'The cultist collapses, a dark amulet shattering on the cobblestones.',
    traits: []
  },
  sniper: {
    name: 'Cult Sniper',
    type: 'sniper',
    hp: 2, damage: 1, horror: 0,
    description: 'An assassin striking from the shadows.',
    visualPrompt: 'A menacing silhouette in a trench coat and fedora, perched on a rooftop with a long rifle. Noir atmosphere, high contrast, rain-slicked city background, muted colors.',
    lore: 'Armed with stolen military hardware and unholy blessings, these marksmen guard the ritual sites. They do not speak, they do not miss, and they prioritize targets who have seen too much.',
    defeatFlavor: 'The sniper slumps forward, their rifle clattering to the ground.',
    traits: ['ranged']
  },
  priest: {
    name: 'Dark Priest',
    type: 'priest',
    hp: 3, damage: 1, horror: 2,
    description: 'A chanter of doom.',
    visualPrompt: 'A deranged priest in ornate, tattered ceremonial vestments, eyes glowing with purple madness, holding a tome bound in human skin. Eldritch energy crackles around them. Dark fantasy art style.',
    lore: 'Their very voice warps reality, accelerating the cosmic alignment. They do not fight with steel, but with words that rot the soul and summon the void closer to our world.',
    defeatFlavor: 'The chanting is cut short by a gurgling gasp as the priest expires.',
    traits: []
  },
  ghoul: {
    name: 'Ghoul',
    type: 'ghoul',
    hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    visualPrompt: 'A hunched, canine-like humanoid with rubbery grey skin, hoof-like feet, and a face like a feral dog, crouching in a graveyard. Dirt and bone fragments scattered around. Gritty, detailed horror art.',
    lore: 'Subterranean dwellers that feast on the dead. Though bestial in appearance, they possess a chilling intelligence and often bargain with sorcerers for the choicest corpses.',
    defeatFlavor: 'It collapses into a pile of dust and foul-smelling grave dirt.',
    traits: ['scavenger']
  },
  deepone: {
    name: 'Deep One',
    type: 'deepone',
    hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    visualPrompt: 'A terrifying fish-frog hybrid humanoid with glistening gray-green scales, a pale belly, and bulging unblinking eyes. Standing on a wet dock, dripping with slime. Lovecraftian atmosphere.',
    lore: 'Immortal servants of Father Dagon who dwell in underwater cities. They possess a loathsome, unblinking stare and seek to breed with humans to extend their lineage onto land.',
    defeatFlavor: 'The creature dissolves into a foul-smelling puddle of brine and ichor.',
    traits: ['aquatic']
  },
  shoggoth: {
    name: 'Shoggoth',
    type: 'shoggoth',
    hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    visualPrompt: 'A massive, shapeless monstrosity of iridescent black slime, rolling forward like a tide. Covered in thousands of forming and unforming eyes and mouths. Protoplasmic texture, oil slick colors.',
    lore: 'A nightmarish slave race created by the Elder Things eons ago. They are shifting mountains of iridescent slime that crush everything in their path, constantly crying "Tekeli-li! Tekeli-li!"',
    traits: ['massive', 'slow'],
    defeatFlavor: 'The massive form loses cohesion, becoming a lifeless pool of inert slime.'
  },
  'mi-go': {
    name: 'Mi-Go',
    type: 'mi-go',
    hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    visualPrompt: 'A pinkish, fungoid, crustacean-like alien creature with large membranous wings and a pulsating ellipsoid head covered in antennae. Holding a strange metallic cylinder. Cosmic sci-fi horror.',
    lore: 'Fungi from Yuggoth who fly through the ether of space. Their technology is far beyond human comprehension, often involving the surgical extraction of living brains into metal cylinders.',
    traits: ['flying'],
    defeatFlavor: 'The fungoid body disintegrates, vibrating out of our dimension.'
  },
  nightgaunt: {
    name: 'Nightgaunt',
    type: 'nightgaunt',
    hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    visualPrompt: 'A sleek, oily black humanoid creature with absolutely no face, large curved horns, and bat-like wings. Smooth texture, merging with the shadows. Unsettling and silent.',
    lore: 'Faceless, silent servants of Nodens. They do not speak or scream, but tickle their victims into submission before carrying them off to the Dreamlands to be abandoned in the dark.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky without a sound, leaving only a cold breeze.'
  },
  hound: {
    name: 'Hound of Tindalos',
    type: 'hound',
    hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    visualPrompt: 'A lean, emaciated beast emerging from a sharp 90-degree angle in a room. It appears made of blue smoke and ichor, with a long, jagged tongue. Non-euclidean geometry, abstract horror.',
    lore: 'Predators that inhabit the angles of time, unlike life which exists in curves. Once they catch the scent of a time-traveler or seer, they pursue their prey across eons, manifesting through any sharp corner.',
    traits: ['fast', 'ambusher'],
    defeatFlavor: 'The beast howls and recedes back into the angles of reality.'
  },
  dark_young: {
    name: 'Dark Young',
    type: 'dark_young',
    hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    visualPrompt: 'A terrifying mass of ropy black tentacles and hooves, resembling a twisted, leafless tree that walks. Dripping with green goo, with gaping maws on the trunk. Forest horror.',
    lore: 'The Black Goat of the Woods with a Thousand Young. These enormous, tree-like monstrosities smell of open graves and stomp through the forest on hoofed legs, crushing the sanity of all who behold them.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers rapidly, resembling a dead, rotted tree stump.'
  },
  byakhee: {
    name: 'Byakhee',
    type: 'byakhee',
    hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    visualPrompt: 'A disturbing hybrid monster composed of crow, mole, ant, and decomposing human corpse. Large wings, furry texture, decaying flesh. Flying against a starry sky.',
    lore: 'Interstellar steeds serving Hastur. They can fly through the vacuum of space, composed of matter that shouldn\'t exist together—fur, feathers, and rotting meat. A whistle can summon them.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It screeches one last time before dissolving into cosmic dust.'
  },
  star_spawn: {
    name: 'Star Spawn',
    type: 'star_spawn',
    hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    visualPrompt: 'A gigantic, green, gelatinous monster with an octopus-like head, dragon wings, and claws. Towering over buildings, wet and slimy. Scale is massive. Lovecraftian masterpiece.',
    lore: 'Smaller versions of the Great Dreamer himself. They waged war against the Elder Things eons ago. Their psychic presence alone can shatter the minds of the strongest investigators like glass.',
    traits: ['massive'],
    defeatFlavor: 'The ground shakes violently as the colossal entity falls, liquefying into green ooze.'
  },
  formless_spawn: {
    name: 'Formless Spawn',
    type: 'formless_spawn',
    hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    visualPrompt: 'A pitch-black, liquid shapeshifter changing forms rapidly. An oily toad-like shape emerging from a puddle of tar. Reflective, viscous texture. Body horror.',
    lore: 'Living, sentient puddles of black ichor associated with Tsathoggua. They can flow through the smallest cracks and instantly harden into weapons or tendrils to lash out at their prey.',
    traits: ['regenerate'],
    defeatFlavor: 'The black ooze evaporates into foul steam, leaving a permanent stain on reality.'
  },
  hunting_horror: {
    name: 'Hunting Horror',
    type: 'hunting_horror',
    hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    visualPrompt: 'A colossal, serpentine creature flying through the air, resembling a dragon without wings, with a single distorted face. Scales are constantly shifting. Cosmic void background.',
    lore: 'A massive, serpentine entity resembling a dragon without wings. It serves Nyarlathotep and hunts those who pry too deep into secrets better left buried. It hates the light.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in on itself, shrieking, and vanishes in a blinding flash of light.'
  },
  moon_beast: {
    name: 'Moon-Beast',
    type: 'moon_beast',
    hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    visualPrompt: 'A pale, toad-like abomination with no eyes and a mass of short, pink tentacles vibrating on its snout. Squat, loathsome, and slippery. Dreamlands setting.',
    lore: 'Blind, pale, toad-like abominations from the Dreamlands\' moon. They sail black galleys and enslave other races, taking sadistic pleasure in torture and suffering.',
    traits: ['ranged'],
    defeatFlavor: 'The pale abomination falls silent, its tentacles twitching one last time.'
  },
  boss: {
    name: 'Ancient One',
    type: 'boss',
    hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    visualPrompt: 'A cosmic entity of impossible geometry, surrounded by madness and void. An avatar of Nyarlathotep or Cthulhu. Fractured reality, non-euclidean shapes, overwhelming scale.',
    lore: 'You should not be seeing this. It is an intrusion from outside the ordered universe, a hole in the fabric of reality that burns the mind to look upon. If you are here, the end is already beginning.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is banished, screaming as it is pulled back into the void, sealing the gate.'
  }
};
