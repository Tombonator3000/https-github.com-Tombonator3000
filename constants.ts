
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
        { id: 'step1', description: 'Find the Iron Key (Investigate locations)', type: 'find_item', targetId: 'quest_iron_key', completed: false },
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
    title: 'Shadow over Innsmouth',
    description: 'The townspeople of Innsmouth are more than human. You must find the Silver Key to the hidden temple.',
    startDoom: 10,
    startLocation: 'Train Station',
    goal: 'Find the Silver Key and locate the Esoteric Order Hall.',
    specialRule: 'Water locations have +1 Deep One spawn.',
    difficulty: 'Hard',
    tileSet: 'mixed',
    victoryType: 'escape',
    steps: [
        { id: 'step1', description: 'Find the Silver Key', type: 'find_item', targetId: 'quest_silver_key', completed: false },
        { id: 'step2', description: 'Locate the Esoteric Order Hall', type: 'find_tile', targetId: 'Esoteric Order of Dagon Hall', completed: false }
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

export const BESTIARY: Record<EnemyType, BestiaryEntry> = {
  cultist: {
    name: 'Cultist', type: 'cultist', hp: 2, damage: 1, horror: 1,
    description: 'A brainwashed servant of the Outer Gods.',
    visualPrompt: 'A sinister 1920s cultist in dark hooded robes, shadows obscuring their face, holding a ritual dagger.',
    lore: 'These deluded individuals have traded their souls for a glimpse of forbidden truth.',
    defeatFlavor: 'The cultist collapses, a dark amulet shattering into pieces.',
    traits: []
  },
  ghoul: {
    name: 'Ghoul', type: 'ghoul', hp: 3, damage: 2, horror: 2,
    description: 'A flesh-eating subterranean dweller.',
    visualPrompt: 'A hunched, pale, canine-like humanoid with rubbery skin and sharp claws, crouching in a dark graveyard.',
    lore: 'Subterranean scavengers that feast on the interred dead, often found in ancient burial grounds.',
    defeatFlavor: 'It collapses into a pile of foul-smelling grave dirt.',
    traits: ['scavenger']
  },
  deepone: {
    name: 'Deep One', type: 'deepone', hp: 3, damage: 2, horror: 2,
    description: 'An immortal amphibious humanoid.',
    visualPrompt: 'A fish-frog hybrid humanoid with glistening scales, bulbous eyes, and webbed hands, emerging from dark water.',
    lore: 'Eternal servants of Father Dagon and Mother Hydra, they dwell in sunken cities beneath the waves.',
    defeatFlavor: 'The creature dissolves into a puddle of thick, salty brine.',
    traits: ['aquatic']
  },
  shoggoth: {
    name: 'Shoggoth', type: 'shoggoth', hp: 6, damage: 3, horror: 4,
    description: 'A protoplasmic mass of eyes and mouths.',
    visualPrompt: 'A massive, bubbling monstrosity of iridescent black slime covered in shifting eyes and gaping mouths.',
    lore: 'A nightmarish slave race created by the Elder Things, now possessing a chaotic and rebellious will.',
    traits: ['massive', 'slow'],
    defeatFlavor: 'The massive form loses all cohesion and flows into the cracks of the floor.'
  },
  sniper: {
    name: 'Cultist Sniper', type: 'sniper', hp: 2, damage: 2, horror: 1,
    description: 'A cultist armed with a long-range rifle.',
    visualPrompt: 'A hooded figure perched in a dark attic window, aiming a vintage 1920s rifle into the misty street.',
    lore: 'Chosen for their steady hands and absolute lack of remorse for their victims.',
    traits: ['ranged'],
    defeatFlavor: 'The sniper falls from their perch, their weapon clattering to the ground.'
  },
  priest: {
    name: 'Dark Priest', type: 'priest', hp: 5, damage: 2, horror: 3,
    description: 'A high-ranking member of the cult, channeling dark energies.',
    visualPrompt: 'A cult priest in ornate silk robes, arms raised as dark purple energy crackles around their fingers.',
    lore: 'They have traded every shred of their humanity for a taste of the Great Old Ones\' power.',
    traits: ['elite'],
    defeatFlavor: 'The priest screams as the very darkness they summoned consumes them from within.'
  },
  'mi-go': {
    name: 'Mi-Go', type: 'mi-go', hp: 3, damage: 1, horror: 1,
    description: 'A fungoid crustacean from Yuggoth.',
    visualPrompt: 'A pinkish, fungoid alien with multiple jointed limbs and large membranous wings, floating in a dark forest.',
    lore: 'Fungi from Yuggoth who harvest resources across the cosmos, often taking human brains for study.',
    traits: ['flying'],
    defeatFlavor: 'The alien body disintegrates into a cloud of fine, grey spores.'
  },
  nightgaunt: {
    name: 'Nightgaunt', type: 'nightgaunt', hp: 3, damage: 1, horror: 1,
    description: 'A faceless, horned flyer.',
    visualPrompt: 'A sleek, black humanoid creature with leather-like skin, bat wings, and a blank, faceless head.',
    lore: 'Faceless servants of Nodens, they are known for tickling their victims before carrying them into the void.',
    traits: ['flying'],
    defeatFlavor: 'It vanishes into the night sky like a wisp of smoke.'
  },
  hound: {
    name: 'Hound of Tindalos', type: 'hound', hp: 4, damage: 2, horror: 3,
    description: 'A predator from the angles of time.',
    visualPrompt: 'A lean, emaciated, blueish beast with a long proboscis, emerging from a sharp corner of a room.',
    lore: 'Predators that inhabit the angles of time, tracking their prey through any sharp-cornered space.',
    traits: ['fast', 'ambusher'],
    defeatFlavor: 'The beast recedes back into the impossible angles from which it came.'
  },
  dark_young: {
    name: 'Dark Young', type: 'dark_young', hp: 6, damage: 2, horror: 3,
    description: 'Offspring of Shub-Niggurath.',
    visualPrompt: 'A massive, tree-like monstrosity with black tentacles, multiple cloven hooves, and dripping mouths.',
    lore: 'The terrifying progeny of the Black Goat of the Woods, they guard her sacred groves.',
    traits: ['massive'],
    defeatFlavor: 'The monstrosity withers and turns into black, decaying wood.'
  },
  byakhee: {
    name: 'Byakhee', type: 'byakhee', hp: 3, damage: 2, horror: 1,
    description: 'An interstellar steed.',
    visualPrompt: 'A disturbing hybrid monster with features of crow, mole, ant, and humanoid, flying through space.',
    lore: 'Interstellar steeds serving Hastur the Unspeakable, summoned by the blowing of a silver whistle.',
    traits: ['flying', 'fast'],
    defeatFlavor: 'It dissolves into a handful of cosmic dust and foul-smelling feathers.'
  },
  star_spawn: {
    name: 'Star Spawn', type: 'star_spawn', hp: 8, damage: 3, horror: 5,
    description: 'A colossal kin of Cthulhu.',
    visualPrompt: 'A gigantic, green, winged monster with an octopus head and massive claws, towering over a coastal city.',
    lore: 'Lesser versions of the Great Dreamer himself, they await his awakening in sunken R\'lyeh.',
    traits: ['massive'],
    defeatFlavor: 'The entity liquefies into a mountain of foul green ooze.'
  },
  formless_spawn: {
    name: 'Formless Spawn', type: 'formless_spawn', hp: 5, damage: 2, horror: 2,
    description: 'Black ooze of Tsathoggua.',
    visualPrompt: 'A pitch-black, liquid shapeshifter forming tentacles and eyes as it flows across a cavern floor.',
    lore: 'Living puddles of black ichor that serve the sleepy god Tsathoggua in the depths of N\'kai.',
    traits: ['regenerate'],
    defeatFlavor: 'The ooze evaporates into a cloud of foul-smelling steam.'
  },
  hunting_horror: {
    name: 'Hunting Horror', type: 'hunting_horror', hp: 4, damage: 3, horror: 3,
    description: 'A viper of the void.',
    visualPrompt: 'A colossal, serpentine winged creature with a distorted, shifting face, coiling in the air.',
    lore: 'Great serpentine entities that serve as the hunting beasts of Nyarlathotep.',
    traits: ['fast', 'flying'],
    defeatFlavor: 'It coils in on itself and vanishes into a pinpoint of light.'
  },
  moon_beast: {
    name: 'Moon-Beast', type: 'moon_beast', hp: 4, damage: 1, horror: 2,
    description: 'Sadistic torturers from the moon.',
    visualPrompt: 'A pale, toad-like abomination with no eyes and pink tentacles where its face should be.',
    lore: 'Cruel and sadistic beings from the Dreamlands moon who trade in slaves and secrets.',
    traits: ['ranged'],
    defeatFlavor: 'The abomination falls silent, its tentacles twitching one last time.'
  },
  shade: {
    name: 'Shade', type: 'shade', hp: 2, damage: 1, horror: 3,
    description: 'A flickering remnant of a soul.',
    visualPrompt: 'A semi-transparent, elongated shadow reaching out from the corners of a dim library.',
    lore: 'Some say they are the echoes of those taken by the void, wandering forever in search of warmth.',
    traits: ['ethereal'],
    defeatFlavor: 'The darkness loses its shape and vanishes into the floorboards.'
  },
  dimensional_shambler: {
    name: 'Dimensional Shambler', type: 'dimensional_shambler', hp: 4, damage: 2, horror: 3,
    description: 'A hunter between planes.',
    visualPrompt: 'A rugose, loose-skinned humanoid with massive talons, partially fading in and out of existence.',
    lore: 'Creatures that can step through dimensions at will, often snatching victims into other planes.',
    traits: ['ethereal', 'ambusher'],
    defeatFlavor: 'It blinks out of existence, leaving only a faint smell of ozone.'
  },
  elder_thing: {
    name: 'Elder Thing', type: 'elder_thing', hp: 5, damage: 2, horror: 2,
    description: 'A star-headed scientist.',
    visualPrompt: 'A barrel-shaped entity with five-fold symmetry, a starfish head, and leathery wings, standing in an ice cave.',
    lore: 'Ancient scientists who ruled Earth millions of years ago, creators of the Shoggoths.',
    traits: ['flying', 'elite'],
    defeatFlavor: 'The creature stiffens and turns into a brittle, frozen statue.'
  },
  yithian: {
    name: 'Yithian', type: 'yithian', hp: 5, damage: 1, horror: 1,
    description: 'A cone-shaped scholar of time.',
    visualPrompt: 'A tall, iridescent cone-shaped body with four long tentacles, two ending in claws and one in a head with three eyes.',
    lore: 'Members of the Great Race of Yith who have swapped minds with creatures across time to gather knowledge.',
    traits: ['elite', 'insightful'],
    defeatFlavor: 'The iridescent body loses its shimmer and collapses inward.'
  },
  fire_vampire: {
    name: 'Fire Vampire', type: 'fire_vampire', hp: 2, damage: 2, horror: 2,
    description: 'A sentient spark of living flame.',
    visualPrompt: 'A swirling vortex of crimson and orange flame, with a core of intense white light, floating in the air.',
    lore: 'Sentient sparks from the star Fomalhaut that serve Cthugha, burning everything they touch.',
    traits: ['fast', 'ethereal'],
    defeatFlavor: 'The flame flickers out, leaving only a small pile of grey ash.'
  },
  colour_out_of_space: {
    name: 'Colour out of Space', type: 'colour_out_of_space', hp: 6, damage: 2, horror: 4,
    description: 'A nebulous, glowing entity of impossible hue.',
    visualPrompt: 'A shimmering, iridescent cloud of light of a colour that does not exist in the visible spectrum, floating over a blasted heath.',
    lore: 'An alien entity that fallen from the stars as a meteorite, draining the life and sanity from all living things nearby.',
    traits: ['ethereal', 'massive'],
    defeatFlavor: 'The impossible glow fades, leaving the area cold and lifeless.'
  },
  boss: {
    name: 'Ancient One', type: 'boss', hp: 10, damage: 4, horror: 6,
    description: 'An avatar of cosmic destruction.',
    visualPrompt: 'A cosmic entity of impossible geometry and scales, shadows of galaxies swirling within its form.',
    lore: 'An intrusion from outside the ordered universe, whose very presence unravels the laws of physics.',
    traits: ['massive'],
    defeatFlavor: 'The avatar is pulled back into the void, its scream echoing through time.'
  }
};

export const ITEMS: Item[] = [
  { id: 'rev', name: 'Revolver', type: 'weapon', effect: '+1 Combat Die', bonus: 1, cost: 3, statModifier: 'combat' },
  { id: 'shot', name: 'Shotgun', type: 'weapon', effect: '+2 Combat Dice', bonus: 2, cost: 5, statModifier: 'combat' },
  { id: 'tommy', name: 'Tommy Gun', type: 'weapon', effect: '+3 Combat Dice', bonus: 3, cost: 10, statModifier: 'combat' },
  { id: 'med', name: 'Medical Kit', type: 'consumable', effect: 'Heal 2 HP', bonus: 2, cost: 3 },
  { id: 'whiskey', name: 'Old Whiskey', type: 'consumable', effect: 'Heal 2 Sanity', bonus: 2, cost: 2 },
  { id: 'flash', name: 'Flashlight', type: 'tool', effect: '+1 Investigation Die', bonus: 1, cost: 2, statModifier: 'investigation' },
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3, cost: 8 },
  
  // Quest Items
  { id: 'quest_iron_key', name: 'Iron Key', type: 'quest', effect: 'Unlocks the Exit Door.', isQuestItem: true },
  { id: 'quest_silver_key', name: 'Silver Key', type: 'quest', effect: 'Required for the Temple of Dagon.', isQuestItem: true }
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
