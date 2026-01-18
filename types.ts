
export enum GamePhase {
  SETUP = 'setup',
  INVESTIGATOR = 'investigator',
  MYTHOS = 'mythos',
  COMBAT = 'combat',
  GAME_OVER = 'gameOver',
  MERCHANT = 'merchant',
  VICTORY = 'victory' // New Phase
}

export type CharacterType = 'detective' | 'professor' | 'journalist' | 'veteran' | 'occultist' | 'doctor';

export interface Spell {
  id: string;
  name: string;
  cost: number;
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
  imageUrl?: string;
}

export interface Madness {
  id: string;
  name: string;
  description: string;
  effect: string;
  visualClass: string;
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
  spells: Spell[];
  actions: number;
  isDead: boolean;
  madness: string[];
  activeMadness: Madness | null;
  instanceId?: string;
  traits: Trait[];
}

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
  cost?: number;
  statModifier?: 'combat' | 'investigation' | 'agility' | 'physical_defense' | 'mental_defense';
  curse?: string; // New: Description of the curse
  curseEffect?: 'drain_hp_on_kill' | 'cap_hp' | 'hallucinations' | 'sanity_cost_clue' | 'no_rest'; // New: Functional curse ID
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
  traits?: string[];
  isDying?: boolean;
  imageUrl?: string;
}

export interface BestiaryEntry {
    name: string;
    type: EnemyType;
    description: string;
    lore: string;
    visualPrompt: string;
    hp: number;
    damage: number;
    horror: number;
    traits?: string[];
    defeatFlavor?: string;
}

export type TileObjectType = 
  | 'altar' | 'bookshelf' | 'crate' | 'chest' | 'cabinet' 
  | 'gate' | 'barricade' | 'locked_door' | 'rubble' | 'fire' | 'trap'
  | 'mirror' | 'radio' | 'switch' | 'statue' | 'fog_wall' | 'exit_door';

export interface TileObject {
  type: TileObjectType;
  searched: boolean;
  blocking?: boolean;
  health?: number;
  difficulty?: number;
  reqSkill?: 'strength' | 'insight' | 'agility';
  puzzleType?: 'sequence' | 'dial';
}

export interface Tile {
  id: string;
  q: number;
  r: number;
  name: string;
  type: 'building' | 'room' | 'street';
  category?: 'connector' | 'location';
  explored: boolean;
  hasWater?: boolean;
  searchable: boolean;
  searched: boolean;
  object?: TileObject;
  isGate?: boolean;
  imageUrl?: string;
}

// --- NEW SCENARIO TYPES (v3.10.0) ---

export type VictoryType = 'escape' | 'assassination' | 'collection' | 'survival';

export interface ScenarioStep {
    id: string;
    description: string;
    type: 'find_item' | 'find_tile' | 'kill_enemy' | 'survive' | 'interact';
    targetId?: string; // Item ID (e.g. 'exit_key'), Enemy Type, or Tile Name
    amount?: number; // Target amount (e.g. 10 rounds, 3 candles)
    completed: boolean;
}

export interface DoomEvent {
    threshold: number; // Triggers when Doom <= this number
    triggered: boolean;
    type: 'spawn_enemy' | 'buff_enemies' | 'sanity_hit' | 'spawn_boss';
    targetId?: string; // Enemy type or Boss ID
    amount?: number;
    message: string;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  startDoom: number;
  startLocation: string;
  specialRule: string;
  difficulty: 'Normal' | 'Hard' | 'Nightmare';
  tileSet: 'indoor' | 'outdoor' | 'mixed';
  
  // New Fields
  goal: string;
  victoryType: VictoryType;
  steps: ScenarioStep[];
  doomEvents: DoomEvent[];
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
    randomOffset: { x: number; y: number };
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
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
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
  encounteredEnemies: string[];
  cluesFound: number;
  log: string[];
  lastDiceRoll: number[] | null;
  activeEvent: EventCard | null;
  activeCombat: { enemyId: string; playerId: string } | null;
  activePuzzle: ActivePuzzle | null;
  selectedEnemyId: string | null;
  selectedTileId: string | null;
  activeScenario: Scenario | null;
  activeModifiers: ScenarioModifier[];
  floatingTexts: FloatingText[];
  screenShake: boolean;
  activeSpell: Spell | null;
  
  // New State for v3.10.0
  currentStepIndex: number;
  questItemsCollected: string[]; // IDs of quest items found (e.g. 'candle_red')
}

export interface EventCard {
  id: string;
  title: string;
  description: string;
  effectType: 'sanity' | 'health' | 'spawn' | 'insight' | 'doom';
  value: number;
}
