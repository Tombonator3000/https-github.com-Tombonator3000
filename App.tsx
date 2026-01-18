
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Skull, 
  ChevronRight,
  RotateCcw,
  Sword,
  Maximize2,
  Minimize2,
  ScrollText,
  Target,
  FolderOpen,
  ArrowLeft,
  Brain,
  Save,
  Users,
  Briefcase,
  Star,
  Trash2,
  Edit2,
  ShoppingBag,
  Book,
  CloudFog,
  Zap
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, Madness, ContextAction, SavedInvestigator, FloatingText, Item, Spell, EnemyType, Trait } from './types';
import { CHARACTERS, ITEMS, START_TILE, EVENTS, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, SCENARIOS, MADNESS_CONDITIONS, SPELLS, BESTIARY, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS, TRAIT_POOL } from './constants';
import GameBoard from './components/GameBoard';
import CharacterPanel from './components/CharacterPanel';
import EnemyPanel from './components/EnemyPanel';
import ActionBar from './components/ActionBar';
import DiceRoller from './components/DiceRoller';
import EventModal from './components/EventModal';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import PuzzleModal from './components/PuzzleModal';
import MerchantShop from './components/MerchantShop';
import JournalModal from './components/JournalModal';
import TurnNotification from './components/TurnNotification'; 
import { loadAssetLibrary, saveAssetLibrary, generateLocationAsset, AssetLibrary } from './utils/AssetLibrary';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const ROSTER_KEY = 'shadows_1920s_roster';
const SETUP_CONFIG_KEY = 'shadows_1920s_setup_config_v1';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const APP_VERSION = "3.4.2";

// --- DEFAULT STATE CONSTANT ---
const DEFAULT_STATE: GameState = {
    phase: GamePhase.SETUP,
    doom: 12,
    round: 1,
    players: [],
    activePlayerIndex: 0,
    board: [START_TILE],
    enemies: [],
    encounteredEnemies: [], // Track bestiary progress
    cluesFound: 0,
    log: [],
    lastDiceRoll: null,
    activeEvent: null,
    activeCombat: null,
    activePuzzle: null,
    selectedEnemyId: null,
    selectedTileId: null,
    activeScenario: null,
    activeModifiers: [],
    floatingTexts: [],
    screenShake: false
};

// --- HEX MATH HELPERS ---
const hexDistance = (a: {q: number, r: number}, b: {q: number, r: number}) => {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
};

const cubeLerp = (a: {x: number, y: number, z: number}, b: {x: number, y: number, z: number}, t: number) => {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
};

const cubeRound = (cube: {x: number, y: number, z: number}) => {
  let rx = Math.round(cube.x);
  let ry = Math.round(cube.y);
  let rz = Math.round(cube.z);

  const x_diff = Math.abs(rx - cube.x);
  const y_diff = Math.abs(ry - cube.y);
  const z_diff = Math.abs(rz - cube.z);

  if (x_diff > y_diff && x_diff > z_diff) {
    rx = -ry - rz;
  } else if (y_diff > z_diff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }
  return { q: rx, r: rz };
};

const getHexLine = (start: {q: number, r: number}, end: {q: number, r: number}) => {
  const N = hexDistance(start, end);
  const a_nudge = { x: start.q + 1e-6, z: start.r + 1e-6, y: -start.q - start.r - 2e-6 };
  const b_nudge = { x: end.q + 1e-6, z: end.r + 1e-6, y: -end.q - end.r - 2e-6 };
  
  const results = [];
  for (let i = 0; i <= N; i++) {
    const t = N === 0 ? 0.0 : i / N;
    results.push(cubeRound(cubeLerp(a_nudge, b_nudge, t)));
  }
  return results;
};

const hasLineOfSight = (start: {q: number, r: number}, end: {q: number, r: number}, board: Tile[], range: number) => {
  const dist = hexDistance(start, end);
  if (dist > range) return false;
  
  const line = getHexLine(start, end);
  
  // Check path for obstacles
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    const tile = board.find(t => t.q === p.q && t.r === p.r);
    
    // 1. Tile must exist (cannot see over void)
    if (!tile) return false;

    // 2. If it's an intermediate tile (not start, not end), it must not block
    if (i > 0 && i < line.length - 1) {
        if (tile.object?.blocking) return false;
    }
  }
  
  return true;
};
// ------------------------

const App: React.FC = () => {
  // --- STATE ---
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showTurnNotification, setShowTurnNotification] = useState(false); // New state

  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Load asset library synchronously to hydrate state immediately
    const lib = loadAssetLibrary();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Hydrate board images from Asset Library
        // This compensates for stripping them during save
        if (parsed.board && Array.isArray(parsed.board)) {
            parsed.board = parsed.board.map((t: Tile) => ({
                ...t,
                imageUrl: lib[t.name] || t.imageUrl
            }));
        }

        return { 
            ...parsed, 
            hoveredEnemyId: null, 
            floatingTexts: [], 
            screenShake: false 
        };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return DEFAULT_STATE;
  });

  const [roster, setRoster] = useState<SavedInvestigator[]>(() => {
    const saved = localStorage.getItem(ROSTER_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  
  // Asset Library State
  const [assetLibrary, setAssetLibrary] = useState<AssetLibrary>({});

  const [viewingVeterans, setViewingVeterans] = useState(false);
  const [setupNames, setSetupNames] = useState<Record<string, string>>(() => {
      try {
          const saved = localStorage.getItem(SETUP_CONFIG_KEY);
          return saved ? JSON.parse(saved) : {};
      } catch (e) {
          return {};
      }
  });
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const audioInit = useRef(false);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    // Load assets on boot
    const lib = loadAssetLibrary();
    setAssetLibrary(lib);
  }, []);

  useEffect(() => {
    try {
        // Optimized Save: Strip heavy images from board to prevent QuotaExceededError
        const stateToSave = {
            ...state,
            board: state.board.map(t => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { imageUrl, ...rest } = t; 
                return rest;
            })
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
        console.warn("Save failed: Storage quota exceeded. Game progress may not persist.", e);
    }
  }, [state]);

  useEffect(() => {
    try {
        localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    } catch (e) {
        console.warn("Roster save failed: Storage quota exceeded.", e);
    }
  }, [roster]);

  useEffect(() => {
      try {
          localStorage.setItem(SETUP_CONFIG_KEY, JSON.stringify(setupNames));
      } catch (e) {
          console.warn("Setup config save failed.", e);
      }
  }, [setupNames]);

  // TURN NOTIFICATION TRIGGER
  useEffect(() => {
      if (state.phase === GamePhase.INVESTIGATOR || state.phase === GamePhase.MYTHOS) {
          setShowTurnNotification(true);
          const timer = setTimeout(() => setShowTurnNotification(false), 2000);
          return () => clearTimeout(timer);
      }
  }, [state.activePlayerIndex, state.phase]);

  // Update visuals if assets change (e.g. from Options menu generation)
  const refreshBoardVisuals = () => {
      const lib = loadAssetLibrary();
      setAssetLibrary(lib);
      setState(prev => ({
          ...prev,
          board: prev.board.map(t => ({
              ...t,
              imageUrl: lib[t.name] || t.imageUrl
          }))
      }));
  };

  // --- AUDIO ---
  const initAudio = async () => {
    if (audioInit.current) return;
    try {
        await Tone.start();
        audioInit.current = true;
        
        const filter = new Tone.Filter(200, "lowpass").toDestination();
        const pad = new Tone.PolySynth(Tone.Synth, { 
          oscillator: { type: 'sine' }, 
          envelope: { attack: 4, release: 4 } 
        }).connect(filter);
        
        pad.set({ volume: -20 });
        new Tone.LFO(0.05, 100, 300).connect(filter.frequency).start();
        
        new Tone.Loop(time => { 
          pad.triggerAttackRelease(['G1', 'D2', 'Bb2'], '2n', time); 
        }, '1n').start(0);
        
        Tone.getTransport().start();
    } catch (e) {
        console.warn("Audio init failed", e);
    }
  };

  const playStinger = (type: 'roll' | 'event' | 'click' | 'horror' | 'search' | 'combat' | 'heal' | 'madness' | 'block' | 'trap' | 'spell' | 'unlock' | 'coin') => {
    if (!audioInit.current) return;
    if (type === 'roll') new Tone.MembraneSynth().toDestination().triggerAttackRelease("C1", "8n");
    if (type === 'horror') new Tone.MembraneSynth().toDestination().triggerAttackRelease("G0", "1n");
    if (type === 'click') new Tone.MetalSynth({ volume: -20 }).toDestination().triggerAttackRelease("C5", "32n");
    if (type === 'event') new Tone.MetalSynth().toDestination().triggerAttackRelease("C3", "4n");
    if (type === 'search') new Tone.NoiseSynth({ volume: -15 }).toDestination().triggerAttackRelease("16n");
    if (type === 'combat') new Tone.MembraneSynth({ volume: -5, envelope: { sustain: 0.1 } }).toDestination().triggerAttackRelease("D1", "4n");
    if (type === 'heal') new Tone.Synth({ volume: -10, envelope: { attack: 0.5 } }).toDestination().triggerAttackRelease("E4", "2n");
    if (type === 'madness') {
        const synth = new Tone.FMSynth().toDestination();
        synth.triggerAttackRelease("C5", "4n");
        synth.frequency.rampTo("C2", 1);
    }
    if (type === 'block') new Tone.MetalSynth({ frequency: 50, envelope: { decay: 0.1 } }).toDestination().triggerAttackRelease(50, "16n");
    if (type === 'trap') {
        const synth = new Tone.MetalSynth({ harmonicity: 100, resonance: 800 }).toDestination();
        synth.triggerAttackRelease(200, "8n");
    }
    if (type === 'spell') {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.triggerAttackRelease(["C5", "E5", "G5"], "4n");
    }
    if (type === 'unlock') {
         new Tone.MetalSynth({ harmonicity: 200, resonance: 100 }).toDestination().triggerAttackRelease(800, "16n");
    }
    if (type === 'coin') {
        new Tone.MetalSynth({ harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination().triggerAttackRelease("C6", "16n");
    }
  };

  const addToLog = (message: string) => {
    setState(prev => ({ ...prev, log: [message, ...prev.log].slice(0, 50) }));
  };

  // --- AI IMAGE GENERATION (NANO BANANA) ---
  const generateImage = async (prompt: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1" }
            }
        });
        
        const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.warn("AI Image gen failed:", e);
        return null;
    }
  };

  const generateCharacterPortrait = async (player: Player) => {
      if (player.imageUrl) return;
      const prompt = `A dark, moody, oil painting style portrait of a 1920s ${player.name} (${player.id}) in a Lovecraftian horror setting. High contrast, atmospheric, vintage.`;
      const img = await generateImage(prompt);
      if (img) {
          setState(prev => ({
              ...prev,
              players: prev.players.map(p => p.instanceId === player.instanceId || (p.id === player.id && !p.instanceId && !player.instanceId) ? { ...p, imageUrl: img } : p)
          }));
      }
  };

  const generateTileVisual = async (tile: Tile) => {
      // 1. Check if asset already exists in our library
      const lib = loadAssetLibrary();
      if (lib[tile.name]) {
          setState(prev => ({
              ...prev,
              board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: lib[tile.name] } : t)
          }));
          return;
      }

      // 2. If not, generate it and save it
      if (tile.imageUrl) return;
      
      const img = await generateLocationAsset(tile.name, tile.type);
      if (img) {
          // Save to library
          lib[tile.name] = img;
          saveAssetLibrary(lib);
          setAssetLibrary(lib);

          // Update state
          setState(prev => ({
              ...prev,
              board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: img } : t)
          }));
      }
  };

  const generateEnemyVisual = async (enemy: Enemy) => {
      if (enemy.imageUrl) return;
      
      // Use the new, high-fidelity visual prompt from BESTIARY
      const bestiaryEntry = BESTIARY[enemy.type];
      const specificPrompt = bestiaryEntry?.visualPrompt || `A terrifying, nightmarish illustration of a ${enemy.name} (${enemy.type}) from Cthulhu mythos. Dark fantasy art, creature design, horror, menacing, detailed, isolated on dark background.`;
      
      const img = await generateImage(specificPrompt);
      if (img) {
          setState(prev => ({
              ...prev,
              enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, imageUrl: img } : e)
          }));
      }
  };


  const triggerFloatingText = (q: number, r: number, content: string, colorClass: string) => {
    const id = `ft-${Date.now()}-${Math.random()}`;
    const offsetX = (Math.random() - 0.5) * 40; 
    const offsetY = (Math.random() - 0.5) * 40;

    setState(prev => ({
        ...prev,
        floatingTexts: [...prev.floatingTexts, { id, q, r, content, colorClass, randomOffset: { x: offsetX, y: offsetY } }]
    }));
    setTimeout(() => {
        setState(prev => ({
            ...prev,
            floatingTexts: prev.floatingTexts.filter(ft => ft.id !== id)
        }));
    }, 2000); 
  };

  const triggerShake = () => {
      setState(prev => ({ ...prev, screenShake: true }));
      setTimeout(() => setState(prev => ({ ...prev, screenShake: false })), 500);
  };

  // --- GAMEPLAY LOGIC ---

  const applySanityDamage = (player: Player, amount: number): { player: Player, log?: string, sound?: 'madness' } => {
    if (player.isDead) return { player };

    // Check for Mitigation from Inventory (Relics)
    const mitigation = player.inventory
        .filter(i => i.statModifier === 'mental_defense')
        .reduce((sum, item) => sum + (item.bonus || 0), 0);
    
    const actualAmount = Math.max(0, amount - mitigation);
    let newSanity = player.sanity - actualAmount;
    let logMsg = '';
    let sound: 'madness' | undefined = undefined;
    let updatedPlayer = { ...player };

    if (actualAmount > 0) {
        triggerFloatingText(player.position.q, player.position.r, `-${actualAmount} SAN`, 'text-purple-400');
        triggerShake();
    } else if (amount > 0 && actualAmount === 0) {
        triggerFloatingText(player.position.q, player.position.r, `RESIST`, 'text-blue-300');
    }

    if (newSanity <= 0) {
        if (player.activeMadness) {
            updatedPlayer.sanity = 0;
            updatedPlayer.isDead = true;
            logMsg = `Sinnslidelsen ble for mye. ${player.name} har mistet forstanden totalt. (Død)`;
        } else {
            const madness = MADNESS_CONDITIONS[Math.floor(Math.random() * MADNESS_CONDITIONS.length)];
            updatedPlayer.activeMadness = madness;
            updatedPlayer.sanity = player.maxSanity;
            logMsg = `SINNSSYKDOM! ${player.name} knekker sammen og utvikler: ${madness.name}.`;
            sound = 'madness';
            triggerFloatingText(player.position.q, player.position.r, "MADNESS!", 'text-fuchsia-500');
        }
    } else {
        updatedPlayer.sanity = newSanity;
    }

    return { player: updatedPlayer, log: logMsg, sound };
  };

  const applyPhysicalDamage = (player: Player, amount: number): { player: Player, log?: string } => {
      if (player.isDead) return { player };

      // Check for Mitigation from Inventory (Armor)
      const mitigation = player.inventory
          .filter(i => i.statModifier === 'physical_defense')
          .reduce((sum, item) => sum + (item.bonus || 0), 0);

      // Check for 'Blood Moon' modifier (Global Damage Increase)
      const modifierDmg = state.activeModifiers.some(m => m.effect === 'strong_enemies') ? 1 : 0;

      const actualAmount = Math.max(0, (amount + modifierDmg) - mitigation);
      const newHp = Math.max(0, player.hp - actualAmount);
      let logMsg = '';
      
      if (actualAmount > 0) {
          triggerFloatingText(player.position.q, player.position.r, `-${actualAmount} HP`, 'text-red-500');
          triggerShake();
      } else if (amount > 0 && actualAmount === 0) {
          triggerFloatingText(player.position.q, player.position.r, `BLOCKED`, 'text-slate-400');
      }

      if (newHp <= 0) {
          logMsg = `${player.name} har omkommet av sine skader.`;
      }

      return {
          player: { ...player, hp: newHp, isDead: newHp <= 0 },
          log: logMsg
      };
  };

  const generateNarrative = async (tile: Tile) => {
    if (!process.env.API_KEY) return;
    generateTileVisual(tile);
    try {
      const prompt = `Skriv en kort, atmosfærisk beskrivelse (maks 2 setninger) på norsk for en etterforsker som går inn i "${tile.name}" i et Lovecraft-inspirert spill. Rommet inneholder: ${tile.object ? tile.object.type : 'ingenting spesielt'}. Doom-nivået er ${state.doom}.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      if (response.text) addToLog(response.text);
    } catch (e) {
      console.warn("Gemini error", e);
    }
  };

  const selectScenario = (scenario: Scenario) => {
    playStinger('click');
    setState(prev => ({ ...prev, activeScenario: scenario }));
  };

  const toggleCharacterSelection = (type: CharacterType) => {
    if (state.phase !== GamePhase.SETUP) return;
    playStinger('click');
    setState(prev => {
      const existing = prev.players.find(p => p.id === type && !p.instanceId);
      if (existing) return { ...prev, players: prev.players.filter(p => p !== existing) };
      if (prev.players.length >= 4) return prev;
      
      const char = CHARACTERS[type];
      // Init spells for Occultist or others
      const startingSpells: Spell[] = [];
      if (type === 'occultist') {
          startingSpells.push(SPELLS.find(s => s.id === 'wither')!);
      }

      // Check if we have a saved name for this session, otherwise use default
      const sessionName = setupNames[type] && setupNames[type].trim() !== '' ? setupNames[type] : char.name;

      const newPlayer: Player = { 
          ...char, 
          name: sessionName,
          position: { q: 0, r: 0 }, 
          inventory: [], 
          spells: startingSpells,
          actions: 2, 
          isDead: false, 
          madness: [], 
          activeMadness: null,
          traits: [] // New Recruit
      };
      generateCharacterPortrait(newPlayer);
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  };

  const toggleVeteranSelection = (vet: SavedInvestigator) => {
      if (state.phase !== GamePhase.SETUP) return;
      playStinger('click');
      setState(prev => {
          const existing = prev.players.find(p => p.instanceId === vet.instanceId);
          if (existing) return { ...prev, players: prev.players.filter(p => p.instanceId !== vet.instanceId) };
          if (prev.players.length >= 4) return prev;

          // Check for session-specific rename for veteran
          const sessionName = (vet.instanceId && setupNames[vet.instanceId] && setupNames[vet.instanceId].trim() !== '') 
            ? setupNames[vet.instanceId] 
            : vet.name;

          const player: Player = {
              ...vet,
              name: sessionName,
              position: { q: 0, r: 0 },
              actions: 2,
              isDead: false
          };
          return { ...prev, players: [...prev.players, player] };
      });
  };

  const updatePlayerName = (identifier: string, newName: string, isVeteran: boolean) => {
      // 1. Update the session memory so it persists if deselected/reselected
      setSetupNames(prev => ({ ...prev, [identifier]: newName }));

      // 2. Update the actual active player object if present
      setState(prev => ({
          ...prev,
          players: prev.players.map(p => {
              if (isVeteran) {
                  return p.instanceId === identifier ? { ...p, name: newName } : p;
              } else {
                  return (p.id === identifier && !p.instanceId) ? { ...p, name: newName } : p;
              }
          })
      }));
  };

  const handleNameBlur = (identifier: string, currentName: string, defaultName: string, isVeteran: boolean) => {
      // If name is empty on blur, revert to default to prevent nameless players
      if (!currentName || currentName.trim() === '') {
          updatePlayerName(identifier, defaultName, isVeteran);
      }
  };

  const startGame = () => {
    if (state.players.length === 0 || !state.activeScenario) return;
    
    // VALIDATION: Ensure all players have names
    const invalidPlayer = state.players.find(p => !p.name || p.name.trim() === '');
    if (invalidPlayer) {
        playStinger('block');
        // Shake screen or provide feedback (using simplified alert for now)
        alert("All investigators must have a name!");
        return;
    }

    initAudio();
    const scenario = state.activeScenario;
    const startTile: Tile = { ...START_TILE, name: scenario.startLocation };
    generateTileVisual(startTile);

    // Apply Roguelite Modifier
    const randomModifier = SCENARIO_MODIFIERS[Math.floor(Math.random() * SCENARIO_MODIFIERS.length)];

    setState(prev => ({ 
      ...prev, 
      phase: GamePhase.INVESTIGATOR, 
      activePlayerIndex: 0,
      doom: scenario.startDoom,
      board: [startTile],
      cluesFound: 0,
      activeModifiers: [randomModifier],
      log: [
          `SAKSFIL: ${scenario.title}`, 
          `GLOBAL EFFEKT: ${randomModifier.name} - ${randomModifier.description}`,
          ...prev.log
      ]
    }));
    addToLog("Etterforskningen starter. Mørket senker seg over byen.");
  };

  const goToMerchant = () => {
      setState(prev => ({ ...prev, phase: GamePhase.MERCHANT }));
  };

  const saveAllAndExit = () => {
      const survivors = state.players.filter(p => !p.isDead);
      
      setRoster(prev => {
          const newRoster = [...prev];
          survivors.forEach(survivor => {
              // ROGUELITE: Award Trait
              const newTrait = TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)];
              const existingTraits = survivor.traits || [];
              // Avoid duplicate traits
              const updatedTraits = existingTraits.some(t => t.id === newTrait.id) 
                ? existingTraits 
                : [...existingTraits, newTrait];

              const newVet: SavedInvestigator = {
                  ...survivor,
                  traits: updatedTraits,
                  instanceId: survivor.instanceId || `${survivor.id}-${Date.now()}`,
                  saveDate: Date.now(),
                  scenariosSurvived: (prev.find(v => v.instanceId === survivor.instanceId)?.scenariosSurvived || 0) + 1
              };
              
              // Apply Permanent Trait Effects if just gained
              if (!existingTraits.some(t => t.id === newTrait.id)) {
                  if (newTrait.effect === 'max_hp_down') newVet.maxHp = Math.max(1, newVet.maxHp - 1);
                  if (newTrait.effect === 'combat_bonus') newVet.maxHp = newVet.maxHp + 1; // "Hardened" gives health
              }

              // Replace existing if updated, or add new
              const existingIdx = newRoster.findIndex(p => p.instanceId === newVet.instanceId);
              if (existingIdx !== -1) {
                  newRoster[existingIdx] = newVet;
              } else {
                  newRoster.push(newVet);
              }
          });
          return newRoster;
      });
      handleResetGame();
  };

  const saveToRoster = (player: Player) => {
      if (player.isDead) return;
      playStinger('click');
      const newVet: SavedInvestigator = {
          ...player,
          traits: player.traits || [],
          instanceId: player.instanceId || `${player.id}-${Date.now()}`,
          saveDate: Date.now(),
          scenariosSurvived: (roster.find(v => v.instanceId === player.instanceId)?.scenariosSurvived || 0) + 1
      };

      setRoster(prev => {
          const filtered = prev.filter(p => p.instanceId !== newVet.instanceId);
          return [...filtered, newVet];
      });
      addToLog(`${player.name} er lagret i arkivet.`);
  };

  const deleteVeteran = (instanceId: string) => {
      setRoster(prev => prev.filter(p => p.instanceId !== instanceId));
  };

  const handleEndTurn = () => {
    playStinger('click');
    setState(prev => {
      // Find the next living player starting from next index
      let nextIndex = prev.activePlayerIndex + 1;
      let nextPhase = GamePhase.INVESTIGATOR;
      let foundPlayer = false;

      // Ensure nextIndex is within bounds if we are already at the end
      if (nextIndex >= prev.players.length) {
          nextIndex = 0;
          nextPhase = GamePhase.MYTHOS;
      } else {
        // Scan through the rest of the array
        while (nextIndex < prev.players.length) {
            if (!prev.players[nextIndex].isDead) {
            foundPlayer = true;
            break;
            }
            nextIndex++;
        }

        // If no living player found in the remainder of the list, it's Mythos time
        if (!foundPlayer) {
            nextPhase = GamePhase.MYTHOS;
            nextIndex = 0; 
        }
      }

      return { 
        ...prev, 
        activePlayerIndex: nextIndex, 
        phase: nextPhase,
        selectedEnemyId: null,
        selectedTileId: null
      };
    });
  };

  const handlePuzzleComplete = (success: boolean) => {
      const tileId = state.activePuzzle?.targetTileId;
      if (!tileId) {
          setState(prev => ({...prev, activePuzzle: null}));
          return;
      }

      if (success) {
          playStinger('unlock');
          addToLog(`Låsen gir etter! Du løste gåten.`);
          triggerFloatingText(0, 0, "UNLOCKED!", "text-green-400"); // Positions don't strictly matter for center text
          setState(prev => ({
              ...prev,
              activePuzzle: null,
              board: prev.board.map(t => t.id === tileId ? { ...t, object: undefined } : t),
              players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
              selectedTileId: null
          }));
      } else {
          playStinger('horror');
          addToLog(`Sinnet ditt svikter. Du klarte ikke å løse gåten.`);
          // Sanity damage penalty for failing puzzle?
          const activeP = state.players[state.activePlayerIndex];
          const result = applySanityDamage(activeP, 1);
          
          setState(prev => ({
              ...prev,
              activePuzzle: null,
              players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...result.player, actions: p.actions - 1 } : p)
          }));
          if (result.sound) playStinger('madness');
      }
  };

  // --- MENU ACTIONS ---
  const handleStartNewGame = () => {
      setState(DEFAULT_STATE);
      // Keep setup names even on new game to avoid re-typing preferred names
      setIsMainMenuOpen(false);
      refreshBoardVisuals(); // Ensure any newly generated assets from options are applied
      initAudio();
  };

  const handleContinueGame = () => {
      setIsMainMenuOpen(false);
      refreshBoardVisuals();
      initAudio();
  };

  const handleResetData = () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ROSTER_KEY);
      localStorage.removeItem(SETUP_CONFIG_KEY);
      // Also clear asset library? Maybe safe to keep it.
      window.location.reload();
  };

  // --- ACTIONS ---
  
  const handleResolveEvent = useCallback(() => {
    if (!state.activeEvent) return;
    const event = state.activeEvent;
    setState(prev => {
      const activePlayerIdx = prev.activePlayerIndex;
      const player = prev.players[activePlayerIdx];
      if (!player) return prev;

      const newPlayers = [...prev.players];
      let newDoom = prev.doom;
      const newEnemies = [...prev.enemies];
      let newEncountered = [...prev.encounteredEnemies];

      if (event.effectType === 'sanity') {
          const result = applySanityDamage(player, Math.abs(event.value));
          newPlayers[activePlayerIdx] = result.player;
          if (result.log) addToLog(result.log);
          if (result.sound) playStinger('madness');
      }
      else if (event.effectType === 'health') {
          const dmg = Math.abs(event.value);
          const result = applyPhysicalDamage(player, dmg);
          newPlayers[activePlayerIdx] = result.player;
          if (result.log) addToLog(result.log);
      }
      else if (event.effectType === 'insight') {
          newPlayers[activePlayerIdx] = { ...player, insight: Math.max(0, player.insight + event.value) };
          triggerFloatingText(player.position.q, player.position.r, `+${event.value} INSIGHT`, 'text-blue-400');
      }
      else if (event.effectType === 'doom') newDoom = Math.max(0, prev.doom + event.value);
      else if (event.effectType === 'spawn') {
          const template = BESTIARY['cultist'];
          newEnemies.push({ 
             id: `enemy-${Date.now()}`, 
             position: { ...player.position }, 
             visionRange: 3, 
             attackRange: 1, 
             attackType: 'melee',
             maxHp: template.hp,
             speed: 2,
             ...template
          });
          if (!newEncountered.includes(template.type)) newEncountered.push(template.type);
          addToLog("A Cultist emerges from the shadows!");
      }
      
      return { ...prev, players: newPlayers, doom: newDoom, enemies: newEnemies, activeEvent: null, encounteredEnemies: newEncountered };
    });
    playStinger('click');
  }, [state.activeEvent, state.activePlayerIndex]);

  // Mythos Phase Logic
  useEffect(() => {
    if (state.phase === GamePhase.MYTHOS) {
      const timer = setTimeout(() => {
        playStinger('horror');
        addToLog('Mythos-fase: Verden skjelver...');
        setState(prev => {
          let newDoom = prev.doom - 1;
          
          // Roguelite Mod: Extra Doom?
          if (prev.activeModifiers.some(m => m.effect === 'extra_doom')) {
              newDoom -= 1;
              triggerFloatingText(0,0, "DOOM ACCELERATES", 'text-purple-600');
          }

          // SEQUENTIAL ENEMY MOVEMENT (Anti-Stacking)
          const updatedEnemies: Enemy[] = [];
          
          const isTileOccupied = (q: number, r: number) => {
              if (updatedEnemies.some(e => e.position.q === q && e.position.r === r)) return true;
              return false;
          };

          for (const enemy of prev.enemies) {
            let currentEnemy = { ...enemy };
            if (currentEnemy.traits?.includes('regenerate') && currentEnemy.hp < currentEnemy.maxHp) {
                currentEnemy.hp = Math.min(currentEnemy.maxHp, currentEnemy.hp + 1);
            }

            const alivePlayers = prev.players.filter(p => !p.isDead);
            
            let targetPlayer: Player | null = null;
            let minDist = Infinity;
            
            alivePlayers.forEach(p => {
              const dist = hexDistance(currentEnemy.position, p.position);
              if (dist < minDist) {
                minDist = dist;
                targetPlayer = p;
              }
            });

            const hasLOS = targetPlayer && hasLineOfSight(currentEnemy.position, targetPlayer.position, prev.board, currentEnemy.visionRange);
            const inAttackRange = minDist <= currentEnemy.attackRange;

            if (hasLOS && inAttackRange) {
                updatedEnemies.push(currentEnemy);
                continue; 
            }

            let bestMove = currentEnemy.position;
            const neighborCoords = [
                {q: currentEnemy.position.q + 1, r: currentEnemy.position.r}, 
                {q: currentEnemy.position.q - 1, r: currentEnemy.position.r}, 
                {q: currentEnemy.position.q, r: currentEnemy.position.r + 1}, 
                {q: currentEnemy.position.q, r: currentEnemy.position.r - 1}, 
                {q: currentEnemy.position.q + 1, r: currentEnemy.position.r - 1}, 
                {q: currentEnemy.position.q - 1, r: currentEnemy.position.r + 1}
            ];

            const validMoves = neighborCoords.filter(n => {
                const tile = prev.board.find(t => t.q === n.q && t.r === n.r);
                if (!tile) return false;
                if (tile.object?.blocking && !currentEnemy.traits?.includes('flying')) return false;
                if (isTileOccupied(n.q, n.r)) return false; 
                return true;
            });

            if (validMoves.length > 0) {
                if (hasLOS && targetPlayer) {
                    validMoves.sort((a, b) => {
                        const distA = hexDistance(a, targetPlayer!.position);
                        const distB = hexDistance(b, targetPlayer!.position);
                        return distA - distB;
                    });
                    bestMove = validMoves[0];
                } else {
                    bestMove = validMoves[Math.floor(Math.random() * validMoves.length)];
                }
            }

            updatedEnemies.push({ ...currentEnemy, position: bestMove });
          }

          let updatedPlayers = [...prev.players];
          let attackCount = 0;

          updatedEnemies.forEach(e => {
            const victimIdx = updatedPlayers.findIndex(p => {
                if (p.isDead) return false;
                const dist = hexDistance(e.position, p.position);
                const los = hasLineOfSight(e.position, p.position, prev.board, e.visionRange);
                return dist <= e.attackRange && los;
            });

            if (victimIdx !== -1) {
              attackCount++;
              const victim = updatedPlayers[victimIdx];
              if (e.attackType === 'doom') {
                   newDoom = Math.max(0, newDoom - 1);
                   addToLog(`${e.name} kaster en forbannelse! Doom øker.`);
                   triggerFloatingText(e.position.q, e.position.r, "DOOM!", 'text-purple-600');
              } else {
                   const physResult = applyPhysicalDamage(victim, e.damage);
                   const sanityResult = applySanityDamage(physResult.player, e.horror);
                   
                   let finalPlayer = sanityResult.player;
                   updatedPlayers[victimIdx] = finalPlayer;
                   
                   if (e.attackType === 'ranged') addToLog(`${e.name} skyter på ${victim.name}!`);
                   else addToLog(`${e.name} angriper ${victim.name}!`);
                   
                   if (physResult.log) addToLog(physResult.log);
                   if (sanityResult.log) addToLog(sanityResult.log);
                   if (sanityResult.sound) playStinger('madness');
              }
            }
          });

          if (updatedEnemies.length > 0 && attackCount < updatedEnemies.length) {
              const movingCount = updatedEnemies.length - attackCount;
              addToLog(`${movingCount} fiender beveger seg i mørket...`);
          }

          // 6. SPAWN LOGIC (Escalation)
          const gateTiles = prev.board.filter(t => t.isGate);
          let newEncountered = [...prev.encounteredEnemies];
          
          if (gateTiles.length > 0) {
            let spawnChance = 0.2;
            if (newDoom < 9) spawnChance = 0.4;
            if (newDoom < 4) spawnChance = 1.0; 

            if (Math.random() < spawnChance) {
                const spawnCount = (newDoom < 4 && Math.random() > 0.5) ? 2 : 1;

                for (let i = 0; i < spawnCount; i++) {
                    const spawnGate = gateTiles[Math.floor(Math.random() * gateTiles.length)];
                    const spawnRoll = Math.random();
                    let template: typeof BESTIARY[keyof typeof BESTIARY];

                    if (spawnRoll > 0.95) template = BESTIARY['star_spawn'];
                    else if (spawnRoll > 0.9) template = BESTIARY['dark_young'];
                    else if (spawnRoll > 0.85) template = BESTIARY['shoggoth'];
                    else if (spawnRoll > 0.80) template = BESTIARY['hunting_horror'];
                    else if (spawnRoll > 0.75) template = BESTIARY['formless_spawn'];
                    else if (spawnRoll > 0.70) template = BESTIARY['hound'];
                    else if (spawnRoll > 0.65) template = BESTIARY['byakhee'];
                    else if (spawnRoll > 0.60) template = BESTIARY['mi-go'];
                    else if (spawnRoll > 0.55) template = BESTIARY['nightgaunt'];
                    else if (spawnRoll > 0.50) template = BESTIARY['moon_beast'];
                    else if (spawnRoll > 0.45) template = BESTIARY['deepone'];
                    else if (spawnRoll > 0.40) template = BESTIARY['ghoul'];
                    else if (spawnRoll > 0.35) template = BESTIARY['priest'];
                    else if (spawnRoll > 0.30) template = BESTIARY['sniper'];
                    else template = BESTIARY['cultist'];

                    const newEnemy: Enemy = { 
                        id: `enemy-${Date.now()}-${i}`, 
                        position: { q: spawnGate.q, r: spawnGate.r }, 
                        visionRange: 3,
                        attackRange: 1, 
                        attackType: 'melee',
                        maxHp: template.hp,
                        speed: 2,
                        ...template
                    };

                    updatedEnemies.push(newEnemy);
                    addToLog(`En ${newEnemy.name} stiger ut av portalen ved ${spawnGate.name}!`);
                    triggerFloatingText(spawnGate.q, spawnGate.r, "SPAWN!", "text-red-600");
                    
                    if (!newEncountered.includes(template.type)) newEncountered.push(template.type);
                }
            }
          }

          const allDead = updatedPlayers.every(p => p.isDead);
          const finalPlayers = updatedPlayers.map(p => {
              if (p.isDead) return { ...p, actions: 0 };
              const baseActions = p.activeMadness?.id === 'm4' ? 1 : 2;
              return { ...p, actions: baseActions };
          });

          const firstLivingIndex = finalPlayers.findIndex(p => !p.isDead);

          return { 
            ...prev, 
            doom: newDoom, 
            round: prev.round + 1, 
            enemies: updatedEnemies, 
            encounteredEnemies: newEncountered,
            players: finalPlayers, 
            activePlayerIndex: firstLivingIndex === -1 ? 0 : firstLivingIndex,
            phase: (newDoom <= 0 || allDead) ? GamePhase.GAME_OVER : GamePhase.INVESTIGATOR 
          };
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // SAFE ACCESS TO ACTIVE PLAYER
  const activePlayer = useMemo(() => {
    if (!state.players || state.players.length === 0) return null;
    return state.players[state.activePlayerIndex] ?? state.players[0] ?? null;
  }, [state.players, state.activePlayerIndex]);

  const handleAction = (actionType: string, payload?: any) => {
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    const madness = activePlayer.activeMadness?.id;
    
    // Dynamic Dice Calculator
    const getDiceCount = (base: number, skill: 'combat' | 'investigation' | 'agility') => {
        let count = base;
        if (madness === 'm3') count -= 1; // Hysteria Penalty

        // Check Inventory for Stat Modifiers (Pick BEST item)
        const itemBonus = activePlayer.inventory
            .filter(i => i.statModifier === skill)
            .reduce((max, item) => Math.max(max, item.bonus || 0), 0);
        
        count += itemBonus;

        return Math.max(1, count);
    };

    switch (actionType) {
      case 'move':
        const { q, r } = payload;
        if (q === activePlayer.position.q && r === activePlayer.position.r) return;
        const currentTile = state.board.find(t => t.q === activePlayer.position.q && t.r === activePlayer.position.r);
        let targetTile = state.board.find(t => t.q === q && t.r === r);
        if (targetTile && targetTile.object?.blocking) {
            playStinger('block');
            addToLog(`Veien er blokkert av ${targetTile.object.type}. Du må fjerne det først.`);
            triggerFloatingText(q, r, "BLOCKED", 'text-amber-500');
            setState(prev => ({ ...prev, selectedTileId: targetTile!.id, selectedEnemyId: null }));
            return;
        }
        if (!targetTile) {
          // --- PROCEDURAL GENERATION LOGIC v2 ---
          const tileSet = state.activeScenario?.tileSet || 'mixed';
          let newTileType: 'room' | 'street' = 'street';
          let newTileCategory: 'location' | 'connector' = 'location';
          
          // Determine Indoor/Outdoor
          if (tileSet === 'indoor') newTileType = 'room';
          else if (tileSet === 'outdoor') newTileType = 'street';
          else {
              if (currentTile?.type === 'room') newTileType = Math.random() > 0.8 ? 'street' : 'room';
              else newTileType = Math.random() > 0.8 ? 'room' : 'street';
          }

          // Determine Category
          const isCurrentConnector = currentTile?.category === 'connector';
          if (isCurrentConnector) {
              newTileCategory = Math.random() > 0.1 ? 'location' : 'connector';
          } else {
              newTileCategory = Math.random() > 0.3 ? 'connector' : 'location';
          }

          let newTileName = 'Unknown';
          const pool = newTileCategory === 'connector' 
              ? (newTileType === 'room' ? INDOOR_CONNECTORS : OUTDOOR_CONNECTORS)
              : (newTileType === 'room' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS);
          
          newTileName = pool[Math.floor(Math.random() * pool.length)];

          let objectType: TileObjectType | undefined = undefined;
          let isBlocking = false;
          let difficulty = 0;
          let reqSkill: 'strength' | 'insight' | 'agility' | undefined = undefined;
          const rng = Math.random();

          // OBJECT SPAWNING LOGIC
          if (newTileCategory === 'connector') {
              if (rng > 0.6) {
                  if (newTileType === 'room') {
                      objectType = 'locked_door'; isBlocking = true; difficulty = 4; reqSkill = 'strength';
                  } else {
                      objectType = Math.random() > 0.5 ? 'rubble' : 'fog_wall'; 
                      isBlocking = true; 
                      difficulty = 3; 
                      reqSkill = objectType === 'fog_wall' ? 'insight' : 'strength';
                  }
              } else if (rng < 0.2) {
                  objectType = Math.random() > 0.5 ? 'mirror' : 'switch';
              }
          } else {
              if (rng > 0.7) {
                   const containers: TileObjectType[] = ['bookshelf', 'crate', 'chest', 'cabinet', 'radio'];
                   objectType = containers[Math.floor(Math.random() * containers.length)];
                   isBlocking = false;
              } else if (rng < 0.2) {
                  objectType = 'trap';
              }
          }

          // Increased Gate Probability (30% on Locations)
          const isGate = newTileCategory === 'location' && Math.random() > 0.70; 
          
          // IMMEDIATE SPAWN CHANCE (Guardians)
          // 25% chance when revealing a new location tile that a monster spawns
          let immediateSpawn: Enemy | null = null;
          if (newTileCategory === 'location' && Math.random() < 0.25) {
              const template = BESTIARY['cultist']; // Default guardian
              immediateSpawn = {
                  id: `enemy-${Date.now()}-guard`,
                  position: { q, r },
                  visionRange: 3,
                  attackRange: 1,
                  attackType: 'melee',
                  maxHp: template.hp,
                  speed: 2,
                  ...template
              };
          }

          const newTile: Tile = { 
            id: `tile-${state.board.length}`, q, r, 
            name: newTileName, 
            type: newTileType, 
            category: newTileCategory,
            explored: true, searchable: true, searched: false, isGate, 
            object: objectType ? { type: objectType, searched: false, blocking: isBlocking, difficulty, reqSkill } : undefined 
          };
          
          const event = Math.random() > 0.85 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null;
          
          let trapLog = '';
          let finalPlayer = { ...activePlayer, position: { q, r }, actions: activePlayer.actions - 1 };
          
          if (objectType === 'trap') {
               playStinger('trap');
               trapLog = `DU GIKK I EN FELLE! 1 skade.`;
               const dmgResult = applyPhysicalDamage(finalPlayer, 1);
               finalPlayer = dmgResult.player;
          }

          const existingImage = assetLibrary[newTileName];
          if (existingImage) {
              newTile.imageUrl = existingImage;
          }

          setState(prev => {
              let updatedEnemies = [...prev.enemies];
              let updatedLog = [...prev.log];
              let updatedEncountered = [...prev.encounteredEnemies];

              if (immediateSpawn) {
                  updatedEnemies.push(immediateSpawn);
                  updatedLog.unshift(`A ${immediateSpawn.name} was waiting in the shadows!`);
                  if (!updatedEncountered.includes(immediateSpawn.type)) updatedEncountered.push(immediateSpawn.type);
                  playStinger('horror');
              }
              if (trapLog) updatedLog.unshift(trapLog);

              return { 
                ...prev, 
                board: [...prev.board, newTile], 
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? finalPlayer : p), 
                activeEvent: event,
                selectedTileId: null,
                enemies: updatedEnemies,
                log: updatedLog,
                encounteredEnemies: updatedEncountered
              };
          });
          
          generateNarrative(newTile);
        } else {
          setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p), selectedTileId: null }));
          if (targetTile && !targetTile.imageUrl) generateTileVisual(targetTile);
        }
        break;

      case 'flee':
        // 1. Check if enemy is on the tile
        const immediateThreat = state.enemies.find(e => 
            e.position.q === activePlayer.position.q && 
            e.position.r === activePlayer.position.r
        );

        if (!immediateThreat) {
            addToLog("Ingen fiender her å flykte fra.");
            triggerFloatingText(activePlayer.position.q, activePlayer.position.r, "NO THREAT", "text-slate-500");
            return;
        }

        playStinger('roll');
        // Trait: Runner
        const runnerBonus = activePlayer.traits?.some(t => t.effect === 'runner') ? 1 : 0;
        const fleeDice = getDiceCount(2 + (activePlayer.id === 'journalist' ? 1 : 0) + runnerBonus, 'agility');
        const fleeRoll = Array.from({ length: fleeDice }, () => Math.floor(Math.random() * 6) + 1);
        const fleeSuccess = fleeRoll.filter(v => v >= 4).length > 0;
        
        // 2. Identify neighbors
        const neighborCoords = [
            {q: activePlayer.position.q + 1, r: activePlayer.position.r},
            {q: activePlayer.position.q + 1, r: activePlayer.position.r - 1},
            {q: activePlayer.position.q, r: activePlayer.position.r - 1},
            {q: activePlayer.position.q - 1, r: activePlayer.position.r},
            {q: activePlayer.position.q - 1, r: activePlayer.position.r + 1},
            {q: activePlayer.position.q, r: activePlayer.position.r + 1}
        ];

        // 3. Filter Safe Tiles (Exists, Not blocked, No enemy)
        const safeTiles = neighborCoords.filter(n => {
            const tile = state.board.find(t => t.q === n.q && t.r === n.r);
            const enemyOnTile = state.enemies.some(e => e.position.q === n.q && e.position.r === n.r);
            return tile && !tile.object?.blocking && !enemyOnTile;
        });

        setState(prev => ({ ...prev, lastDiceRoll: fleeRoll }));

        if (fleeSuccess && safeTiles.length > 0) {
            const escapeTile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
            playStinger('click');
            addToLog(`Suksess! ${activePlayer.name} unnslapp ${immediateThreat.name}.`);
            triggerFloatingText(activePlayer.position.q, activePlayer.position.r, "ESCAPED!", "text-cyan-400");
            
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: escapeTile, actions: p.actions - 1 } : p)
            }));
        } else {
            let failMsg = "Mislyktes!";
            if (safeTiles.length === 0) failMsg = "Ingen vei ut!";
            
            addToLog(`${failMsg} ${immediateThreat.name} angriper fritt!`);
            triggerFloatingText(activePlayer.position.q, activePlayer.position.r, "CAUGHT!", "text-red-500");
            
            const physResult = applyPhysicalDamage(activePlayer, immediateThreat.damage);
            const sanityResult = applySanityDamage(physResult.player, immediateThreat.horror);
            
            if (sanityResult.sound) playStinger('madness');
            else playStinger('combat');

            setState(prev => {
                const newPlayers = [...prev.players];
                let finalPlayer = sanityResult.player;
                finalPlayer.actions = finalPlayer.actions - 1; // Spend action to fail
                newPlayers[prev.activePlayerIndex] = finalPlayer;
                
                return {
                    ...prev,
                    players: newPlayers
                };
            });
        }
        break;

      case 'interact':
          const selTile = state.board.find(t => t.id === state.selectedTileId);
          if (!selTile) return;

          // SPECIAL INTERACTABLES (Non-Blocking but interactable via selection)
          if (selTile.object && !selTile.object.blocking && !selTile.object.searched) {
              if (selTile.object.type === 'mirror') {
                  playStinger('spell');
                  const outcome = Math.random();
                  if (outcome > 0.4) {
                      addToLog("Du ser en hemmelighet i speilet. +2 Insight.");
                      triggerFloatingText(selTile.q, selTile.r, "+2 INSIGHT", 'text-blue-400');
                      setState(prev => ({
                          ...prev,
                          players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, insight: p.insight + 2, actions: p.actions - 1 } : p),
                          board: prev.board.map(t => t.id === selTile.id ? { ...t, object: { ...t.object!, searched: true } } : t),
                          selectedTileId: null
                      }));
                  } else {
                      addToLog("Speilet viser din død. Du skriker.");
                      const res = applySanityDamage(activePlayer, 2);
                      setState(prev => ({
                          ...prev,
                          players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...res.player, actions: p.actions - 1 } : p),
                          board: prev.board.map(t => t.id === selTile.id ? { ...t, object: { ...t.object!, searched: true } } : t),
                          selectedTileId: null
                      }));
                      if(res.sound) playStinger('madness');
                  }
                  return;
              }
              if (selTile.object.type === 'radio') {
                  playStinger('click');
                  addToLog("Radioen spraker... en stemme gir deg håp.");
                  triggerFloatingText(selTile.q, selTile.r, "+1 SAN", 'text-purple-400');
                  setState(prev => ({
                      ...prev,
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, sanity: Math.min(p.maxSanity, p.sanity + 1), actions: p.actions - 1 } : p),
                      board: prev.board.map(t => t.id === selTile.id ? { ...t, object: { ...t.object!, searched: true } } : t),
                      selectedTileId: null
                  }));
                  return;
              }
              if (selTile.object.type === 'switch') {
                  playStinger('click');
                  addToLog("Du slår på bryteren. Lyset flimrer.");
                  // Could reveal fog of war here in future
                  triggerFloatingText(selTile.q, selTile.r, "CLICK", 'text-white');
                  setState(prev => ({
                      ...prev,
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                      board: prev.board.map(t => t.id === selTile.id ? { ...t, object: { ...t.object!, searched: true } } : t),
                      selectedTileId: null
                  }));
                  return;
              }
          }

          // BLOCKING OBJECTS
          if (!selTile.object?.blocking) return;

          // PUZZLE CHECK: 50% chance to trigger puzzle instead of dice roll for doors
          if (Math.random() > 0.5 && (selTile.object.type === 'locked_door' || selTile.object.type === 'fog_wall')) {
              setState(prev => ({
                  ...prev,
                  activePuzzle: {
                      type: 'sequence',
                      difficulty: selTile.object!.difficulty || 3,
                      targetTileId: selTile.id
                  }
              }));
              addToLog(selTile.object.type === 'fog_wall' ? "Tåken er unaturlig. Du må bruke forstanden..." : "Låsen er kompleks. Du må tyde runene...");
              return;
          }

          playStinger('roll');
          const skillMap: Record<string, 'combat' | 'investigation' | 'agility'> = {
              'strength': 'combat', // Approximation
              'insight': 'investigation',
              'agility': 'agility'
          };
          const skillType = skillMap[selTile.object.reqSkill || 'strength'] || 'combat';
          
          const iDice = getDiceCount(2 + (activePlayer.id === 'veteran' && selTile.object.reqSkill === 'strength' ? 1 : 0), skillType);
          
          const roll = Array.from({ length: iDice }, () => Math.floor(Math.random() * 6) + 1);
          const success = roll.filter(v => v >= 4).length;
          setState(prev => ({ ...prev, lastDiceRoll: roll }));
          if (success >= 1) {
              playStinger('click');
              addToLog(`Suksess! ${activePlayer.name} fjernet ${selTile.object.type}.`);
              triggerFloatingText(selTile.q, selTile.r, "CLEARED!", 'text-green-500');
              setState(prev => ({
                  ...prev,
                  board: prev.board.map(t => t.id === selTile.id ? { ...t, object: undefined } : t),
                  players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                  selectedTileId: null
              }));
          } else {
              addToLog(`Mislyktes. ${selTile.object.type} står fortsatt.`);
              triggerFloatingText(selTile.q, selTile.r, "FAILED", 'text-red-500');
              setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
          }
          break;

      case 'attack':
        // Determine weapon range
        const maxWeaponRange = activePlayer.inventory
            .filter(i => i.type === 'weapon')
            .reduce((max, w) => {
                // Heuristic mapping: specific items have implicit range logic
                if (w.id === 'rev') return Math.max(max, 3);
                if (w.id === 'shot') return Math.max(max, 2);
                if (w.id === 'tommy') return Math.max(max, 4);
                return max;
            }, 1); // Default melee range 1

        const tEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
        
        let enemyToAttack: Enemy | undefined;

        // Logic 1: Attacking selected enemy if in range/LOS
        if (tEnemy) {
            const dist = hexDistance(activePlayer.position, tEnemy.position);
            const los = hasLineOfSight(activePlayer.position, tEnemy.position, state.board, maxWeaponRange);
            if (dist <= maxWeaponRange && los) {
                enemyToAttack = tEnemy;
            }
        }

        // Logic 2: If no valid selected target, attack anything on same tile
        if (!enemyToAttack) {
            enemyToAttack = state.enemies.find(e => e.position.q === activePlayer.position.q && e.position.r === activePlayer.position.r);
        }

        if (!enemyToAttack) { 
            addToLog("Ingen gyldige mål innen rekkevidde."); 
            return; 
        }

        playStinger('combat');
        const atkDice = getDiceCount(2 + (activePlayer.id === 'veteran' ? 1 : 0), 'combat');
        const aRoll = Array.from({ length: atkDice }, () => Math.floor(Math.random() * 6) + 1);
        const hits = aRoll.filter(v => v >= 4).length;
        if (hits > 0) {
            addToLog(`Du traff ${enemyToAttack.name} for ${hits} skade!`);
            triggerFloatingText(enemyToAttack.position.q, enemyToAttack.position.r, `-${hits} HP`, 'text-red-500');
        } else {
            addToLog(`Bom!`);
            triggerFloatingText(enemyToAttack.position.q, enemyToAttack.position.r, `MISS`, 'text-slate-400');
        }
        setState(prev => {
            const updatedEnemies = prev.enemies.map(e => {
                if (e.id === enemyToAttack!.id) {
                    const remaining = e.hp - hits;
                    if (remaining <= 0) {
                        const flavor = BESTIARY[e.type]?.defeatFlavor || `${e.name} ble bekjempet.`;
                        setTimeout(() => {
                           setState(curr => ({ ...curr, enemies: curr.enemies.filter(en => en.id !== e.id) }));
                           addToLog(flavor);
                           triggerFloatingText(enemyToAttack!.position.q, enemyToAttack!.position.r, `DEAD`, 'text-red-700 font-bold');
                        }, 800);
                        return { ...e, hp: 0, isDying: true };
                    }
                    return { ...e, hp: remaining };
                }
                return e;
            });
            return { 
                ...prev, 
                lastDiceRoll: aRoll, 
                enemies: updatedEnemies,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                selectedEnemyId: (hits >= enemyToAttack!.hp) ? null : prev.selectedEnemyId
            };
        });
        break;

      case 'cast':
          // ACTIVE MAGIC LOGIC
          const spell = activePlayer.spells[0]; // For now, just grab the first spell (Wither for Occultist)
          if (!spell) { addToLog("Du kan ingen formler."); return; }
          
          if (activePlayer.insight < spell.cost) {
              addToLog(`Ikke nok Insight! Trenger ${spell.cost}.`);
              triggerFloatingText(activePlayer.position.q, activePlayer.position.r, "NO MANA", "text-blue-500");
              return;
          }

          playStinger('spell');
          setState(prev => ({
              ...prev,
              players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, insight: p.insight - spell.cost, actions: p.actions - 1 } : p)
          }));
          
          triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `CAST ${spell.name}`, "text-purple-300");

          if (spell.effectType === 'damage') {
              // Auto-hit enemies in range
              setState(prev => {
                  let hitCount = 0;
                  const updatedEnemies = prev.enemies.map(e => {
                      if (hexDistance(e.position, activePlayer.position) <= spell.range) {
                          hitCount++;
                          const remaining = e.hp - spell.value;
                          triggerFloatingText(e.position.q, e.position.r, `-${spell.value} (MAGIC)`, "text-purple-500");
                          if (remaining <= 0) return { ...e, hp: 0, isDying: true };
                          return { ...e, hp: remaining };
                      }
                      return e;
                  });
                  addToLog(`${spell.name} traff ${hitCount} fiender!`);
                  return { ...prev, enemies: updatedEnemies };
              });
          }
          break;
        
      case 'investigate':
        const curTile = state.board.find(t => t.q === activePlayer.position.q && t.r === activePlayer.position.r);
        playStinger('roll');
        const invDice = getDiceCount(2 + (activePlayer.id === 'detective' ? 1 : 0), 'investigation');
        const iRoll = Array.from({ length: invDice }, () => Math.floor(Math.random() * 6) + 1);
        const searchSuccess = iRoll.filter(v => v >= 4).length;
        setState(prev => ({ ...prev, lastDiceRoll: iRoll }));
        if (curTile?.object && !curTile.object.blocking && !curTile.object.searched) {
             if (searchSuccess > 0) {
                 playStinger('search');
                 const rewardRng = Math.random();
                 
                 // Trait: Scavenger (Better odds)
                 const scavengerBonus = activePlayer.traits?.some(t => t.effect === 'scavenger') ? 0.2 : 0;
                 const threshold = 0.4 - scavengerBonus; // Lower threshold = better odds

                 // Trait: Occult Scholar (Sanity Regen)
                 const scholarBonus = activePlayer.traits?.some(t => t.effect === 'sanity_regen');

                 if (rewardRng > threshold) {
                     const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                     setState(prev => ({ 
                         ...prev, 
                         board: prev.board.map(t => t.id === curTile.id ? { ...t, object: { ...t.object!, searched: true } } : t), 
                         players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, inventory: [...p.inventory, item], actions: p.actions - 1 } : p) 
                     }));
                     addToLog(`Du ransaket ${curTile.object.type} og fant: ${item.name}!`);
                     triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `FOUND ${item.name}`, 'text-amber-400');
                 } else {
                     setState(prev => ({ 
                         ...prev, 
                         cluesFound: prev.cluesFound + 1,
                         board: prev.board.map(t => t.id === curTile.id ? { ...t, object: { ...t.object!, searched: true } } : t),
                         players: prev.players.map((p, i) => {
                             if (i === prev.activePlayerIndex) {
                                 let newP = { ...p, actions: p.actions - 1 };
                                 if (scholarBonus) {
                                     newP.sanity = Math.min(newP.maxSanity, newP.sanity + 1);
                                 }
                                 return newP;
                             }
                             return p;
                         }) 
                     }));
                     addToLog(`Du fant et viktig spor gjemt i ${curTile.object.type}!`);
                     triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `CLUE FOUND!`, 'text-green-400');
                     if (scholarBonus) triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `+1 SAN`, 'text-purple-400');
                 }
             } else {
                 addToLog(`Du fant ingenting av verdi i ${curTile.object.type}.`);
                 triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `NOTHING`, 'text-slate-500');
                 setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
             }
        } else {
            if (searchSuccess > 0) {
                const searchRoll = Math.random();
                if (searchRoll > 0.8) {
                    setState(prev => ({ ...prev, cluesFound: prev.cluesFound + 1, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
                    addToLog("Et spor!");
                    triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `CLUE!`, 'text-green-400');
                } else if (searchRoll > 0.65) {
                    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
                    setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, inventory: [...p.inventory, item], actions: p.actions - 1 } : p) }));
                    addToLog(`Du fant ${item.name} på gulvet!`);
                    triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `ITEM!`, 'text-amber-400');
                } else {
                    addToLog("Ingenting her.");
                    setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
                }
            } else {
                addToLog("Du overså noe.");
                triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `...`, 'text-slate-600');
                setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
            }
        }
        break;

      case 'rest':
        if (madness === 'm2') {
            playStinger('horror');
            addToLog(`${activePlayer.name} er for paranoid til å hvile!`);
            triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `PARANOID!`, 'text-purple-500');
            return; 
        }
        setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, hp: Math.min(p.maxHp, p.hp + 1), sanity: Math.min(p.maxSanity, p.sanity + 1), actions: p.actions - 1 } : p) }));
        addToLog(`${activePlayer.name} hviler.`);
        triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `RESTED`, 'text-blue-300');
        break;

      case 'item':
        const medKit = activePlayer.inventory.find(i => i.id === 'med');
        const whiskey = activePlayer.inventory.find(i => i.id === 'whiskey');
        const book = activePlayer.inventory.find(i => i.id === 'book');
        
        let itemUsed = false;
        let newPlayerState = { ...activePlayer };

        if (medKit) {
          playStinger('heal');
          newPlayerState.hp = Math.min(newPlayerState.maxHp, newPlayerState.hp + 2);
          newPlayerState.inventory = newPlayerState.inventory.filter(i => i !== medKit);
          addToLog("Du brukte et medisinsk skrin.");
          triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `+2 HP`, 'text-green-500');
          itemUsed = true;
        } else if (whiskey) {
          newPlayerState.sanity = Math.min(newPlayerState.maxSanity, newPlayerState.sanity + 2);
          newPlayerState.inventory = newPlayerState.inventory.filter(i => i !== whiskey);
          addToLog("Du drakk gammel whiskey. Nervene roer seg.");
          triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `+2 SAN`, 'text-purple-400');
          itemUsed = true;
        } else if (book) {
           const sanResult = applySanityDamage(newPlayerState, 1);
           newPlayerState = sanResult.player;
           newPlayerState.insight += 3;
           newPlayerState.inventory = newPlayerState.inventory.filter(i => i !== book);
           if (sanResult.log) addToLog(sanResult.log);
           if (sanResult.sound) playStinger('madness');
           addToLog("Du leste Necronomicon. Kunnskapen brenner...");
           itemUsed = true;
        }

        if (itemUsed) {
            newPlayerState.actions -= 1;
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? newPlayerState : p)
            }));
        } else {
          addToLog("Ingen brukbare gjenstander akkurat nå.");
        }
        break;

      case 'drop':
        const { item: itemToDrop } = payload;
        playStinger('click');
        setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                ...p, inventory: p.inventory.filter(i => i !== itemToDrop)
            } : p)
        }));
        addToLog(`${activePlayer.name} kastet ${itemToDrop.name}.`);
        break;

      case 'trade':
        const { item: itemToTrade, targetPlayerId } = payload;
        playStinger('click');
        setState(prev => {
            const targetIndex = prev.players.findIndex(p => p.instanceId === targetPlayerId || p.id === targetPlayerId);
            if (targetIndex === -1) return prev;
            const targetName = prev.players[targetIndex].name;
            const newPlayers = [...prev.players];
            newPlayers[prev.activePlayerIndex] = {
                ...newPlayers[prev.activePlayerIndex],
                inventory: newPlayers[prev.activePlayerIndex].inventory.filter(i => i !== itemToTrade)
            };
            newPlayers[targetIndex] = {
                ...newPlayers[targetIndex],
                inventory: [...newPlayers[targetIndex].inventory, itemToTrade]
            };
            addToLog(`${activePlayer.name} ga ${itemToTrade.name} til ${targetName}.`);
            return { ...prev, players: newPlayers };
        });
        break;
    }
  };

  const handleBuyItem = (playerId: string, item: Item) => {
      setState(prev => {
          const newPlayers = [...prev.players];
          const idx = newPlayers.findIndex(p => (p.instanceId || p.id) === playerId);
          
          if (idx !== -1 && newPlayers[idx].insight >= (item.cost || 0)) {
              playStinger('coin');
              newPlayers[idx] = {
                  ...newPlayers[idx],
                  insight: newPlayers[idx].insight - (item.cost || 0),
                  inventory: [...newPlayers[idx].inventory, item]
              };
          }
          return { ...prev, players: newPlayers };
      });
  };

  const handleEnemyInteraction = (id: string | null, type: 'click' | 'hover') => {
    if (type === 'click') {
      playStinger('click');
      setState(prev => ({ ...prev, selectedEnemyId: prev.selectedEnemyId === id ? null : id, selectedTileId: null }));
      if (id) {
          const enemy = state.enemies.find(e => e.id === id);
          if (enemy) generateEnemyVisual(enemy);
      }
    } else {
      setHoveredEnemyId(id);
    }
  };

  const handleResetGame = () => { setIsMainMenuOpen(true); };

  const displayEnemyId = state.selectedEnemyId || hoveredEnemyId;
  const displayEnemy = state.enemies.find(e => e.id === displayEnemyId);
  const requiredClues = state.activeScenario?.cluesRequired || 3;

  const enemySightMap = useMemo(() => {
    const visibleSet = new Set<string>();
    if (!displayEnemy) return visibleSet;
    state.board.forEach(tile => {
      if (hexDistance(displayEnemy.position, tile) <= displayEnemy.visionRange) {
        if (hasLineOfSight(displayEnemy.position, tile, state.board, displayEnemy.visionRange)) {
          visibleSet.add(`${tile.q},${tile.r}`);
        }
      }
    });
    return visibleSet;
  }, [displayEnemy, state.board]);

  const getContextAction = (): ContextAction | null => {
      if (!state.selectedTileId || !activePlayer) return null;
      const tile = state.board.find(t => t.id === state.selectedTileId);
      if (!tile) return null;
      
      // Interaction range check
      if (hexDistance(activePlayer.position, tile) > 1) return null;

      // Prioritize blocking objects (Doors, Rubble)
      if (tile.object?.blocking) {
          const obj = tile.object;
          let label = 'Interact';
          if (obj.type === 'locked_door') label = 'Break Down Door';
          if (obj.type === 'rubble') label = 'Clear Rubble';
          if (obj.type === 'barricade') label = 'Dismantle';
          if (obj.type === 'fog_wall') label = 'Dispel Fog';
          return { id: 'interact-blocker', label, iconType: obj.reqSkill || 'strength', difficulty: obj.difficulty || 3 };
      }

      // Allow interactions with special non-blocking objects
      if (tile.object && !tile.object.searched && (['mirror', 'radio', 'switch'].includes(tile.object.type))) {
          return { id: 'interact-object', label: 'Use Object', iconType: 'interact', difficulty: 0 };
      }

      return null;
  };
  const currentContextAction = getContextAction();

  const activeMadnessClass = activePlayer?.activeMadness?.visualClass || '';
  const shakeClass = state.screenShake ? 'animate-shake' : '';
  const canContinue = state.phase !== GamePhase.SETUP && state.phase !== GamePhase.GAME_OVER && state.players.length > 0;

  if (isMainMenuOpen) {
      return (
        <>
            <MainMenu onNewGame={handleStartNewGame} onContinue={handleContinueGame} onOptions={() => setShowOptions(true)} canContinue={canContinue} version={APP_VERSION} />
            {showOptions && <OptionsMenu onClose={() => { setShowOptions(false); refreshBoardVisuals(); }} onResetData={handleResetData} />}
        </>
      );
  }

  if (state.phase === GamePhase.SETUP) {
      if (!state.activeScenario) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#05050a] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
                <div className="bg-[#16213e]/95 p-12 rounded border-2 border-[#e94560] shadow-[0_0_80px_rgba(233,69,96,0.3)] max-w-5xl w-full backdrop-blur-md relative z-10 animate-in fade-in zoom-in duration-1000">
                    <div className="flex justify-between items-center mb-8">
                        <button onClick={handleResetGame} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                             <ArrowLeft size={16} /> MAIN MENU
                        </button>
                        <h1 className="text-6xl text-[#e94560] font-display italic tracking-tighter uppercase text-center absolute left-1/2 -translate-x-1/2">Case Files</h1>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {SCENARIOS.map(scenario => (
                            <div key={scenario.id} className="relative group cursor-pointer" onClick={() => selectScenario(scenario)}>
                                <div className="absolute inset-0 bg-[#e94560] opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
                                <div className="bg-[#0a0a1a] border border-slate-700 p-8 rounded-lg h-full flex flex-col hover:border-[#e94560] hover:shadow-[0_0_30px_rgba(233,69,96,0.2)] transition-all transform hover:-translate-y-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <FolderOpen className="text-slate-500 group-hover:text-[#e94560] transition-colors" size={32} />
                                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest rounded border ${scenario.difficulty === 'Normal' ? 'border-green-800 text-green-500' : scenario.difficulty === 'Hard' ? 'border-amber-800 text-amber-500' : 'border-red-800 text-red-500'}`}>
                                            {scenario.difficulty}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-display text-slate-200 mb-2">{scenario.title}</h2>
                                    <p className="text-slate-400 italic font-serif text-lg mb-6 flex-grow">"{scenario.description}"</p>
                                    <div className="space-y-2 border-t border-slate-800 pt-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-2"><Skull size={14} className="text-[#e94560]" /><span>Starts at <strong className="text-slate-300">{scenario.startDoom} Doom</strong></span></div>
                                        <div className="flex items-center gap-2"><Target size={14} className="text-purple-500" /><span>Requires <strong className="text-slate-300">{scenario.cluesRequired} Clues</strong></span></div>
                                        <div className="flex items-center gap-2"><ScrollText size={14} className="text-amber-500" /><span>Start: <strong className="text-slate-300">{scenario.startLocation}</strong></span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
      }

      return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#05050a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
        <div className="bg-[#16213e]/95 p-12 rounded border-2 border-[#e94560] shadow-[0_0_80px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center backdrop-blur-md relative z-10 animate-in fade-in slide-in-from-right duration-500">
          <div className="flex items-center justify-between mb-6">
              <button onClick={() => setState(prev => ({...prev, activeScenario: null, players: []}))} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest">
                  <ArrowLeft size={16} /> Change Case
              </button>
              <div className="text-[#e94560] font-display text-2xl uppercase tracking-widest">{state.activeScenario.title}</div>
          </div>
          <div className="flex justify-center gap-6 mb-8 border-b border-slate-700 pb-4">
              <button onClick={() => setViewingVeterans(false)} className={`flex items-center gap-2 uppercase tracking-widest font-bold pb-2 transition-all ${!viewingVeterans ? 'text-[#e94560] border-b-2 border-[#e94560]' : 'text-slate-500 hover:text-slate-300'}`}><Users size={18} /> New Recruits</button>
              <button onClick={() => setViewingVeterans(true)} className={`flex items-center gap-2 uppercase tracking-widest font-bold pb-2 transition-all ${viewingVeterans ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}><Star size={18} /> Veterans ({roster.length})</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12 min-h-[400px]">
            {!viewingVeterans ? (
                (Object.keys(CHARACTERS) as CharacterType[]).map(key => {
                  const selectedPlayer = state.players.find(p => p.id === key && !p.instanceId);
                  const isSelected = !!selectedPlayer;
                  return (
                    <button key={key} onClick={() => toggleCharacterSelection(key)} className={`group p-5 bg-[#0a0a1a] border-2 transition-all text-left relative overflow-hidden ${isSelected ? 'border-[#e94560] shadow-[0_0_20px_rgba(233,69,96,0.2)]' : 'border-slate-800 hover:border-slate-600'}`}>
                      {isSelected && selectedPlayer.imageUrl && (
                           <div className="w-full h-32 mb-3 bg-black rounded overflow-hidden border border-slate-700">
                               <img src={selectedPlayer.imageUrl} alt={selectedPlayer.name} className="w-full h-full object-cover opacity-80" />
                           </div>
                      )}
                      {isSelected ? (
                        <div className="flex items-center gap-2 mb-1">
                          <input 
                            type="text" 
                            value={selectedPlayer.name} 
                            onChange={(e) => updatePlayerName(key, e.target.value, false)} 
                            onBlur={(e) => handleNameBlur(key, e.target.value, CHARACTERS[key].name, false)}
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} 
                            onMouseDown={(e) => { e.stopPropagation(); }}
                            className="bg-transparent border-b border-[#e94560] text-[#e94560] text-xl font-bold uppercase tracking-tight w-full focus:outline-none placeholder-slate-700 z-50 relative cursor-text" 
                          />
                          <Edit2 size={12} className="text-slate-600" />
                        </div>
                      ) : (
                        <div className={`text-xl font-bold uppercase tracking-tight text-slate-100`}>{setupNames[key] || CHARACTERS[key].name}</div>
                      )}
                      <div className="text-[9px] text-slate-500 mt-2 uppercase tracking-[0.2em] leading-tight font-sans h-8">{CHARACTERS[key].special}</div>
                      <div className="flex gap-4 mt-4 text-sm font-bold">
                        <div className="flex items-center gap-1 text-red-500"><Skull size={12} /> {CHARACTERS[key].hp}</div>
                        <div className="flex items-center gap-1 text-purple-500"><RotateCcw size={12} /> {CHARACTERS[key].sanity}</div>
                      </div>
                      {isSelected && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#e94560] animate-pulse"></div>}
                    </button>
                  );
                })
            ) : (
                roster.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center text-slate-600 italic h-60 border-2 border-dashed border-slate-800 rounded">
                        <Star size={48} className="mb-4 opacity-20" /><p>No survivors in the archive yet.</p>
                    </div>
                ) : (
                    roster.map(vet => {
                        const selectedPlayer = state.players.find(p => p.instanceId === vet.instanceId);
                        const isSelected = !!selectedPlayer;
                        return (
                            <button key={vet.instanceId} onClick={() => toggleVeteranSelection(vet)} className={`group p-5 bg-[#1a120b] border-2 transition-all text-left relative overflow-hidden ${isSelected ? 'border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'border-amber-900/50 hover:border-amber-700'}`}>
                              <div className="flex justify-between items-start">
                                  {isSelected ? (
                                    <input 
                                        type="text" 
                                        value={selectedPlayer.name} 
                                        onChange={(e) => updatePlayerName(vet.instanceId!, e.target.value, true)} 
                                        onBlur={(e) => handleNameBlur(vet.instanceId!, e.target.value, vet.name, true)}
                                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); }} 
                                        onMouseDown={(e) => { e.stopPropagation(); }}
                                        className="bg-transparent border-b border-amber-500 text-amber-400 text-xl font-bold uppercase tracking-tight w-full focus:outline-none placeholder-amber-900/50 mr-2 z-50 relative cursor-text" 
                                    />
                                  ) : (
                                    <div className={`text-xl font-bold uppercase tracking-tight ${isSelected ? 'text-amber-400' : 'text-amber-100/80'}`}>{setupNames[vet.instanceId!] || vet.name}</div>
                                  )}
                                  <Trash2 size={14} className="text-slate-600 hover:text-red-500 z-20" onClick={(e) => { e.stopPropagation(); deleteVeteran(vet.instanceId!); }} />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-500 uppercase tracking-widest"><Star size={10} /><span>Survived: {vet.scenariosSurvived}</span></div>
                              <div className="flex gap-4 border-t border-amber-900/30 mt-4 pt-3 text-sm font-bold">
                                <div className="flex items-center gap-1 text-red-400"><Skull size={12} /> {vet.hp}</div>
                                <div className="flex items-center gap-1 text-purple-400"><RotateCcw size={12} /> {vet.sanity}</div>
                              </div>
                              {vet.traits && vet.traits.length > 0 && (
                                  <div className="flex gap-1 mt-2">
                                      {vet.traits.map(t => (
                                          <div key={t.id} title={t.name} className={`w-2 h-2 rounded-full ${t.type === 'positive' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                      ))}
                                  </div>
                              )}
                              {isSelected && <div className="absolute top-3 right-8 w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>}
                            </button>
                        );
                    })
                )
            )}
          </div>
          <button disabled={state.players.length === 0} onClick={startGame} className={`px-20 py-6 font-display text-3xl italic tracking-[0.3em] transition-all uppercase border-2 ${state.players.length > 0 ? 'bg-[#e94560] border-white text-white hover:scale-105 shadow-[0_0_40px_rgba(233,69,96,0.5)]' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'}`}>BEGIN INVESTIGATION</button>
        </div>
      </div>
    );
  }

  if (state.phase === GamePhase.MERCHANT) {
      return <MerchantShop players={state.players.filter(p => !p.isDead)} onBuy={handleBuyItem} onFinish={() => saveAllAndExit()} />
  }

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${activeMadnessClass} ${shakeClass}`}>
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] opacity-60"></div>
      
      {/* TURN NOTIFICATION OVERLAY */}
      {showTurnNotification && (
          <TurnNotification player={activePlayer} phase={state.phase} />
      )}

      <GameBoard 
        tiles={state.board} 
        players={state.players} 
        enemies={state.enemies} 
        selectedEnemyId={state.selectedEnemyId} 
        onTileClick={(q, r) => handleAction('move', { q, r })} 
        onEnemyClick={(id) => handleEnemyInteraction(id, 'click')} 
        onEnemyHover={(id) => handleEnemyInteraction(id, 'hover')} 
        enemySightMap={enemySightMap} 
        floatingTexts={state.floatingTexts} 
        doom={state.doom}
      />

      <header className="fixed top-4 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-[#16213e]/80 backdrop-blur-xl border-2 border-[#e94560]/30 px-8 py-3 rounded-full shadow-2xl z-40">
          <div className="flex items-center gap-4 border-r border-slate-700 pr-4">
             <Skull className={`text-[#e94560] ${state.doom <= 3 ? 'animate-pulse' : ''}`} size={20} />
             <span className="font-bold text-2xl tabular-nums text-white">{state.doom}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-sans font-bold">SPOR:</span>
            <div className="flex gap-2">
              {Array.from({length: requiredClues}).map((_, i) => (
                <div key={i} className={`w-3 h-3 rotate-45 border ${i < state.cluesFound ? 'bg-green-500 border-white shadow-[0_0_10px_green]' : 'bg-slate-900 border-slate-800'}`}></div>
              ))}
            </div>
          </div>
          {/* Active Modifiers Display */}
          {state.activeModifiers.length > 0 && (
              <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
                  {state.activeModifiers.map(mod => (
                      <div key={mod.id} className="group relative">
                          <CloudFog size={18} className="text-purple-400 cursor-help" />
                          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-black/90 p-2 text-[10px] border border-purple-500 rounded hidden group-hover:block">
                              <div className="font-bold text-purple-300 uppercase">{mod.name}</div>
                              <div className="text-slate-400">{mod.description}</div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
          <button onClick={() => setShowJournal(true)} className="text-slate-500 hover:text-amber-500 transition-colors" title="Bestiary">
            <Book size={18} />
          </button>
          <button onClick={handleResetGame} className="text-slate-500 hover:text-[#e94560]"><RotateCcw size={18}/></button>
      </header>

      {/* RENDER GUARD: Only render CharacterPanel if activePlayer is valid */}
      {activePlayer && (
        <div className={`fixed left-4 top-20 bottom-24 transition-all duration-500 z-40 ${leftPanelCollapsed ? 'w-12 overflow-hidden' : 'w-80'}`}>
          <div className="h-full bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 rounded shadow-2xl flex flex-col relative">
            <button onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)} className="absolute top-2 right-2 text-slate-500 hover:text-white z-50 p-1">
              {leftPanelCollapsed ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
            {!leftPanelCollapsed && (
              <div className="flex-1 flex flex-col overflow-hidden">
                 <CharacterPanel player={activePlayer} allPlayers={state.players} onTrade={(item, targetId) => handleAction('trade', { item, targetPlayerId: targetId })} onDrop={(item) => handleAction('drop', { item })} />
              </div>
            )}
          </div>
        </div>
      )}

      <div className={`fixed right-4 top-20 bottom-24 transition-all duration-500 z-40 ${rightPanelCollapsed ? 'w-12' : 'w-80'}`}>
        <div className="h-full flex flex-col gap-4">
          {displayEnemy && !rightPanelCollapsed && <EnemyPanel enemy={displayEnemy} onClose={() => setState(prev => ({ ...prev, selectedEnemyId: null }))} />}
          <div className="flex-1 bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 rounded shadow-2xl flex flex-col relative overflow-hidden">
            <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="absolute top-2 left-2 text-slate-500 hover:text-white z-50 p-1">
              {rightPanelCollapsed ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
            {!rightPanelCollapsed && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-black/40 flex items-center gap-2">
                   <ScrollText size={14} className="text-[#e94560]"/><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-sans">DOKUMENTERTE HENDELSER</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 font-serif italic text-[12px] leading-relaxed">
                   {state.log.map((entry, idx) => (
                     <div key={idx} className={`${idx === 0 ? 'text-white border-l-2 border-[#e94560] pl-3 py-1 bg-[#e94560]/5' : 'text-slate-500'} animate-in fade-in duration-500`}>{entry}</div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
        <div className="bg-[#16213e]/90 backdrop-blur-xl border-2 border-[#e94560]/40 p-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center gap-4">
          <ActionBar onAction={handleAction} actionsRemaining={activePlayer?.isDead ? 0 : (activePlayer?.actions ?? 0)} isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} contextAction={currentContextAction} hasSpells={activePlayer?.spells && activePlayer.spells.length > 0} />
          <div className="w-px h-12 bg-slate-800 mx-2"></div>
          <button onClick={handleEndTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold hover:bg-[#c9354d] transition-all flex items-center gap-3 uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.3)] group">
            {state.activePlayerIndex === state.players.length - 1 ? "AVSLUTT RUNDEN" : "NESTE TUR"} 
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

      {state.lastDiceRoll && <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"><DiceRoller values={state.lastDiceRoll} onComplete={() => setState(prev => ({ ...prev, lastDiceRoll: null }))} /></div>}
      {state.activeEvent && <EventModal event={state.activeEvent} onResolve={handleResolveEvent} />}
      {state.activePuzzle && <PuzzleModal difficulty={state.activePuzzle.difficulty} onSolve={handlePuzzleComplete} />}
      {showJournal && <JournalModal unlockedIds={state.encounteredEnemies} onClose={() => setShowJournal(false)} />}

      {state.phase === GamePhase.GAME_OVER && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl">
           <div className="text-center max-w-2xl">
             <h2 className="text-9xl font-display text-[#e94560] italic mb-10 uppercase tracking-tighter">FINIS</h2>
             <p className="text-xl text-slate-400 mb-16 italic font-serif px-10">
               {state.cluesFound >= requiredClues ? "Portalen er forseglet. Skyggene trekker seg tilbake..." : state.players.every(p => p.isDead) ? "Alle etterforskere er tapt. Mørket har seiret." : "Tiden rant ut. Dommedag er her."}
             </p>
             {state.players.some(p => !p.isDead) && (
                 <div className="mb-10">
                     <p className="text-sm uppercase tracking-widest text-slate-500 mb-4 font-bold">Overlevende (Klikk for å lagre)</p>
                     <div className="flex justify-center gap-4 flex-wrap">
                         {state.cluesFound >= requiredClues && (
                             <button onClick={goToMerchant} className="flex items-center gap-2 px-6 py-3 border border-amber-600 rounded bg-[#1a120b] hover:bg-amber-900/40 hover:border-amber-400 transition-all text-amber-500 font-bold uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse">
                                 <ShoppingBag size={16} /> Visit Black Market
                             </button>
                         )}
                         {state.players.map(p => {
                             if (p.isDead) return null;
                             const isSaved = roster.some(v => v.instanceId === p.instanceId);
                             return (
                                 <button key={p.id} onClick={() => saveToRoster(p)} disabled={isSaved} className={`flex items-center gap-2 px-6 py-3 border border-slate-700 rounded bg-[#1a1a2e] hover:border-amber-500 transition-all ${isSaved ? 'opacity-50 cursor-default' : ''}`}>
                                     <Save size={16} className="text-amber-500" /><span className="text-amber-100 font-bold uppercase text-xs tracking-wider">{p.name}</span>
                                     {isSaved && <span className="text-[8px] text-green-500 ml-1">(SAVED)</span>}
                                 </button>
                             );
                         })}
                     </div>
                 </div>
             )}
             <button onClick={handleResetGame} className="px-16 py-5 border-2 border-[#e94560] text-[#e94560] font-bold hover:bg-[#e94560] hover:text-white transition-all text-sm uppercase tracking-[0.4em]">AVSLUTT</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
