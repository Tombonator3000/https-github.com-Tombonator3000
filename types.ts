
export enum GamePhase {
  SETUP = 'setup',
  INVESTIGATOR = 'investigator',
  MYTHOS = 'mythos',
  COMBAT = 'combat',
  GAME_OVER = 'gameOver',
  MERCHANT = 'merchant', // New phase
  INVEST_LOGIC_BRIDGE = 'investLogicBridge'
}

export type CharacterType = 'detective' | 'professor' | 'journalist' | 'veteran' | 'occultist' | 'doctor';

export interface Spell {
  id: string;
  name: string;
  cost: number; // Insight cost
  description: string;
  effectType: 'damage' | 'heal' | 'reveal' | 'banish';
  value: number;
  range: number;
}

export interface Character {
  id: CharacterType;
  name: string;
  hp: number;
  maxHp: number;
  sanity: number;
  maxSanity: number;
  insight: number;
  special: string;
  imageUrl?: string; // New: Base64 image data
}

export interface Madness {
  id: string;
  name: string;
  description: string;
  effect: string;
  visualClass: string; // CSS class for visual distortion
}

export interface Player extends Character {
  position: { q: number; r: number };
  inventory: Item[];
  spells: Spell[]; // New: Active magic
  actions: number;
  isDead: boolean;
  madness: string[]; // Deprecated, keeping for safety
  activeMadness: Madness | null;
  instanceId?: string; // Unique ID for veterans to distinguish multiple of same class
}

// Data structure for a saved character in the roster
export interface SavedInvestigator extends Player {
    saveDate: number;
    scenariosSurvived: number;
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'tool' | 'relic' | 'armor' | 'consumable';
  effect: string;
  bonus?: number;
  cost?: number; // New: Price in Insight
  statModifier?: 'combat' | 'investigation' | 'agility' | 'physical_defense' | 'mental_defense';
}

export type EnemyAttackType = 'melee' | 'ranged' | 'sanity' | 'doom';

export type EnemyType = 
  | 'cultist' | 'deepone' | 'ghoul' | 'shoggoth' | 'boss' 
  | 'sniper' | 'priest' | 'mi-go' | 'nightgaunt' | 'hound' 
  | 'dark_young' | 'byakhee' | 'star_spawn' | 'formless_spawn' 
  | 'hunting_horror' | 'moon_beast';

export interface Enemy {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  damage: number;
  horror: number;
  speed: number;
  position: { q: number; r: number };
  visionRange: number;
  attackRange: number;
  attackType: EnemyAttackType;
  traits?: string[]; // New: 'flying', 'regenerate', 'massive', etc.
  isDying?: boolean; // For death animation
  imageUrl?: string; // New: Base64 image data
}

export interface BestiaryEntry {
    name: string;
    type: EnemyType;
    description: string;
    lore: string;
    hp: number;
    damage: number;
    horror: number;
    traits?: string[];
    defeatFlavor?: string; // New field for flavor text upon defeat
}

export type TileObjectType = 'altar' | 'bookshelf' | 'crate' | 'chest' | 'cabinet' | 'gate' | 'barricade' | 'locked_door' | 'rubble' | 'fire' | 'trap';

export interface TileObject {
  type: TileObjectType;
  searched: boolean; // For searchables
  blocking?: boolean; // If true, cannot enter tile until cleared
  health?: number; // For breakable obstacles
  difficulty?: number; // Target number for skill check
  reqSkill?: 'strength' | 'insight' | 'agility';
  puzzleType?: 'sequence' | 'dial'; // New: Determines if interaction triggers a mini-game
}

export interface Tile {
  id: string;
  q: number;
  r: number;
  name: string;
  type: 'building' | 'room' | 'street';
  explored: boolean;
  hasWater?: boolean;
  searchable: boolean;
  searched: boolean;
  object?: TileObject;
  isGate?: boolean;
  imageUrl?: string; // New: Base64 image data
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  startDoom: number;
  goal: string;
  cluesRequired: number;
  startLocation: string;
  specialRule: string;
  difficulty: 'Normal' | 'Hard' | 'Nightmare';
  tileSet: 'indoor' | 'outdoor' | 'mixed';
}

export interface ContextAction {
    id: string;
    label: string;
    iconType: 'strength' | 'insight' | 'agility' | 'interact';
    difficulty: number;
}

export interface FloatingText {
    id: string;
    q: number;
    r: number;
    content: string;
    colorClass: string;
    randomOffset: { x: number; y: number }; // Visual jitter
}

export interface ActivePuzzle {
    type: 'sequence';
    difficulty: number;
    targetTileId: string;
}

export interface GameState {
  phase: GamePhase;
  doom: number;
  round: number;
  players: Player[];
  activePlayerIndex: number;
  board: Tile[];
  enemies: Enemy[];
  encounteredEnemies: string[]; // List of EnemyTypes seen
  cluesFound: number;
  log: string[];
  lastDiceRoll: number[] | null;
  activeEvent: EventCard | null;
  activeCombat: { enemyId: string; playerId: string } | null;
  activePuzzle: ActivePuzzle | null; // New: Current mini-game
  selectedEnemyId: string | null;
  selectedTileId: string | null; // New: For selecting tiles to interact with
  activeScenario: Scenario | null;
  floatingTexts: FloatingText[];
  screenShake: boolean;
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  effectType: 'sanity' | 'health' | 'spawn' | 'insight' | 'doom';
  value: number;
}
