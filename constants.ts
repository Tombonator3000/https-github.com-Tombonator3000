
import { Character, CharacterType, Item, EventCard, Tile, Scenario, Madness } from './types';

export const CHARACTERS: Record<CharacterType, Character> = {
  detective: {
    id: 'detective',
    name: 'The Private Eye',
    hp: 5, maxHp: 5,
    sanity: 4, maxSanity: 4,
    insight: 0,
    special: '+1 die on Investigation'
  },
  professor: {
    id: 'professor',
    name: 'The Professor',
    hp: 3, maxHp: 3,
    sanity: 6, maxSanity: 6,
    insight: 1,
    special: 'Can read occult texts safely'
  },
  journalist: {
    id: 'journalist',
    name: 'The Journalist',
    hp: 4, maxHp: 4,
    sanity: 4, maxSanity: 4,
    insight: 0,
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
    insight: 2,
    special: 'Expert at rituals'
  },
  doctor: {
    id: 'doctor',
    name: 'The Doctor',
    hp: 4, maxHp: 4,
    sanity: 5, maxSanity: 5,
    insight: 0,
    special: 'Can heal HP or Sanity'
  }
};

export const ITEMS: Item[] = [
  { id: 'rev', name: 'Revolver', type: 'weapon', effect: '+1 Combat Die', bonus: 1 },
  { id: 'shot', name: 'Shotgun', type: 'weapon', effect: '+2 Combat Dice', bonus: 2 },
  { id: 'knife', name: 'Dagger', type: 'weapon', effect: '+1 Combat Die', bonus: 1 },
  { id: 'med', name: 'Medical Kit', type: 'tool', effect: 'Heal 2 HP', bonus: 2 },
  { id: 'flash', name: 'Flashlight', type: 'tool', effect: '+1 Investigation Die', bonus: 1 },
  { id: 'map', name: 'Old Map', type: 'tool', effect: 'Explore further' },
  { id: 'amulet', name: 'Elder Sign', type: 'relic', effect: 'Ignore 1 Sanity damage' },
  { id: 'book', name: 'Necronomicon', type: 'relic', effect: '+3 Insight, -1 Sanity', bonus: 3 }
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
    effect: 'Visual distortions. You may see fake enemies.', 
    visualClass: 'madness-hallucination' 
  },
  { 
    id: 'm2', 
    name: 'Paranoia', 
    description: 'They are all against you. You hear whispers in the silence.', 
    effect: 'Screen desaturation and vignetting.', 
    visualClass: 'madness-paranoia' 
  },
  { 
    id: 'm3', 
    name: 'Hysteria', 
    description: 'You cannot stop shaking. The terror is overwhelming.', 
    effect: 'Camera shake and red tint.', 
    visualClass: 'madness-hysteria' 
  },
  { 
    id: 'm4', 
    name: 'Catatonia', 
    description: 'Your mind retreats into darkness.', 
    effect: 'Extreme darkness and tunnel vision.', 
    visualClass: 'madness-catatonia' 
  }
];

export const INDOOR_LOCATIONS = [
  'Abandoned Manor', 'Dark Cellar', 'The Library', 
  'Secret Crypt', 'Old Church', 'Police Station', 
  'Warehouse', 'Arkham Asylum', 'Historical Museum', 
  'St. Mary\'s Hospital', 'Sanitarium', 'Underground Vault',
  'Dusty Attic', 'Grand Hall', 'Study Room', 'Kitchen', 
  'Ritual Chamber', 'Boiler Room', 'Servant Quarters'
];

export const OUTDOOR_LOCATIONS = [
  'Misty Docks', 'Town Square', 'Back Alley', 
  'Old Lighthouse', 'Blackwood Forest', 'Graveyard', 
  'University Campus', 'Bridge', 'Market District', 
  'River Bank', 'Train Station', 'Swamp', 'City Park',
  'Merchant Street', 'Dark Pier'
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
