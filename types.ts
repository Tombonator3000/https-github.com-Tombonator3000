
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

export interface Trait {
    id: string;
    name: string;
    description: string;
    type: 'positive' | 'negative';
    effect: 'combat_bonus' | 'sanity_regen' | 'max_hp_down' | 'fragile_mind' | 'scavenger' | 'runner';
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
  traits: Trait[]; // New: Permanent traits from previous runs
}

// Data structure for a saved character in the roster
export interface SavedInvestigator extends Player {
    saveDate: number;
    scenariosSurvived: number;
    traits: Trait[];
}

export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'tool' | 'relic' | 'armor' | 'consumable';
  effect: string;
  bonus?: number;
  cost?: number; // New: Price in Insight
  statModifier?: 'combat' | 'investigation' | 'agility' | 'physical_defense' | 'mental_defense';
  cursed?: boolean; // Roguelite: Cursed items
  curseEffect?: string; // Description of curse penalty
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
    visualPrompt: string; // New: Specific prompt for AI generation
    hp: number;
    damage: number;
    horror: number;
    traits?: string[];
    defeatFlavor?: string; // New field for flavor text upon defeat
}

export type TileObjectType = 
  | 'altar' | 'bookshelf' | 'crate' | 'chest' | 'cabinet' 
  | 'gate' | 'barricade' | 'locked_door' | 'rubble' | 'fire' | 'trap'
  | 'mirror' | 'radio' | 'switch' | 'statue' | 'fog_wall'; // Expanded interactables

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
  category?: 'connector' | 'location'; // New: helps procedural generation flow
  explored: boolean;
  hasWater?: boolean;
  searchable: boolean;
  searched: boolean;
  object?: TileObject;
  isGate?: boolean;
  imageUrl?: string; // New: Base64 image data
}

export type VictoryType = 'investigation' | 'escape' | 'assassination' | 'collection' | 'survival' | 'random';

export interface ScenarioStep {
  id: number;
  description: string;
  completed: boolean;
  trigger?: 'investigate_success' | 'move_to_tile' | 'kill_enemy' | 'survive_rounds' | 'interact';
  targetItem?: string; // For collection quests
  targetEnemy?: EnemyType; // For assassination
  targetTileName?: string; // For escape/movement
  roundsToSurvive?: number; // For survival
}

export interface DoomEvent {
  doomThreshold: number;
  description: string;
  effect: 'spawn_enemies' | 'spawn_boss' | 'buff_enemies' | 'debuff_players' | 'corrupt_tiles';
  value?: number; // Number of enemies, amount of buff, etc
  enemyType?: EnemyType;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  startDoom: number;
  goal: string;
  victoryType: VictoryType; // New: Type of victory condition
  steps: ScenarioStep[]; // New: Step-by-step objectives
  doomEvents: DoomEvent[]; // New: Events triggered at Doom thresholds
  cluesRequired: number; // Deprecated but keeping for compatibility
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

export interface ScenarioModifier {
    id: string;
    name: string;
    description: string;
    effect: 'reduced_vision' | 'extra_doom' | 'strong_enemies' | 'less_items';
}

export interface GameSettings {
  audio: {
    masterVolume: number; // 0-100
    musicVolume: number; // 0-100
    sfxVolume: number; // 0-100
    muted: boolean;
  };
  graphics: {
    highContrast: boolean;
    reduceMotion: boolean;
    particles: boolean;
  };
  gameplay: {
    showGrid: boolean;
    fastMode: boolean;
  };
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
  activeModifiers: ScenarioModifier[]; // New: Roguelite run modifiers
  floatingTexts: FloatingText[];
  screenShake: boolean;
  activeSpell: Spell | null; // New: Currently selected spell waiting for target
  currentStep: number; // New: Current step index in scenario
  collectedItems: string[]; // New: Quest items collected (for collection scenarios)
  triggeredDoomEvents: number[]; // New: Track which doom thresholds have fired
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  effectType: 'sanity' | 'health' | 'spawn' | 'insight' | 'doom';
  value: number;
}
