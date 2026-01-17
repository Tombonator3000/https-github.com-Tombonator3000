
export enum GamePhase {
  SETUP = 'setup',
  INVESTIGATOR = 'investigator',
  MYTHOS = 'mythos',
  COMBAT = 'combat',
  GAME_OVER = 'gameOver',
  INVEST_LOGIC_BRIDGE = 'investLogicBridge'
}

export type CharacterType = 'detective' | 'professor' | 'journalist' | 'veteran' | 'occultist' | 'doctor';

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
  type: 'weapon' | 'tool' | 'relic';
  effect: string;
  bonus?: number;
}

export type EnemyAttackType = 'melee' | 'ranged' | 'sanity' | 'doom';

export interface Enemy {
  id: string;
  name: string;
  type: 'cultist' | 'deepone' | 'ghoul' | 'shoggoth' | 'boss' | 'sniper' | 'priest' | 'mi-go' | 'nightgaunt' | 'hound' | 'dark_young';
  hp: number;
  maxHp: number;
  damage: number;
  horror: number;
  speed: number;
  position: { q: number; r: number };
  visionRange: number;
  attackRange: number;
  attackType: EnemyAttackType;
  isDying?: boolean; // For death animation
  imageUrl?: string; // New: Base64 image data
}

export type TileObjectType = 'altar' | 'bookshelf' | 'crate' | 'chest' | 'cabinet' | 'gate' | 'barricade' | 'locked_door' | 'rubble' | 'fire';

export interface TileObject {
  type: TileObjectType;
  searched: boolean; // For searchables
  blocking?: boolean; // If true, cannot enter tile until cleared
  health?: number; // For breakable obstacles
  difficulty?: number; // Target number for skill check
  reqSkill?: 'strength' | 'insight' | 'agility';
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

export interface GameState {
  phase: GamePhase;
  doom: number;
  round: number;
  players: Player[];
  activePlayerIndex: number;
  board: Tile[];
  enemies: Enemy[];
  cluesFound: number;
  log: string[];
  lastDiceRoll: number[] | null;
  activeEvent: EventCard | null;
  activeCombat: { enemyId: string; playerId: string } | null;
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
