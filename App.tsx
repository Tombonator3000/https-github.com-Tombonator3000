
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Skull, 
  ChevronRight,
  RotateCcw,
  Minimize2,
  ScrollText,
  Target,
  FolderOpen,
  ArrowLeft,
  Users,
  Star,
  Trash2,
  Edit2,
  ShoppingBag,
  Book,
  CloudFog,
  Zap,
  User,
  Save,
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, ContextAction, SavedInvestigator, Item, Spell, Trait, GameSettings } from './types';
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
import { loadSettings, DEFAULT_SETTINGS } from './utils/Settings';
import { hexDistance, findPath, hasLineOfSight } from './utils/hexUtils';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const ROSTER_KEY = 'shadows_1920s_roster';
const SETUP_CONFIG_KEY = 'shadows_1920s_setup_config_v1';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const APP_VERSION = "3.9.16";

// --- DEFAULT STATE CONSTANT ---
const DEFAULT_STATE: GameState = {
    phase: GamePhase.SETUP,
    doom: 12,
    round: 1,
    players: [],
    activePlayerIndex: 0,
    board: [START_TILE],
    enemies: [],
    encounteredEnemies: [], 
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
    screenShake: false,
    activeSpell: null
};

// --- LOG PARSER ---
const formatLogEntry = (entry: string) => {
    // Basic regex for keywords
    const keywords = [
        { regex: /(skade|damage)/gi, color: 'text-red-400 font-bold' },
        { regex: /(død|dead|die|beseiret|overvant)/gi, color: 'text-red-600 font-black uppercase' },
        { regex: /(sanity|sinnslidelse|madness)/gi, color: 'text-purple-400 font-bold' },
        { regex: /(insight|clue|hint)/gi, color: 'text-blue-400 font-bold' },
        { regex: /(heal|hp|liv)/gi, color: 'text-green-400 font-bold' },
        { regex: /(suksess|success|unlocked|klarte|traff)/gi, color: 'text-green-300 font-bold uppercase' },
        { regex: /(failed|mislyktes|bommet)/gi, color: 'text-orange-400 font-bold' },
        { regex: /(item|gjenstand|found)/gi, color: 'text-amber-400 font-bold' },
        { regex: /(doom|dommedag)/gi, color: 'text-[#e94560] font-black uppercase' },
        // Enemy names (Generic match for known types from constants could be improved, simplified here)
        { regex: /(cultist|ghoul|deep one|sniper|priest|shoggoth)/gi, color: 'text-red-300 italic' }
    ];

    let formatted = entry;
    // We can't use simple string replace for React components easily without dangerous HTML or parsing.
    // Simple parser: split by words and checking is robust but complex. 
    // For this prototype, we'll return a React node array.
    
    const parts = entry.split(/(\s+)/); // Split by whitespace but keep delimiters
    return parts.map((part, i) => {
        let className = '';
        for (const kw of keywords) {
            if (part.match(kw.regex)) {
                className = kw.color;
                break;
            }
        }
        return <span key={i} className={className}>{part}</span>;
    });
};

const App: React.FC = () => {
  // --- STATE ---
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [showTurnNotification, setShowTurnNotification] = useState(false); 
  const [gameSettings, setGameSettings] = useState<GameSettings>(DEFAULT_SETTINGS);

  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const lib = loadAssetLibrary();
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
            screenShake: false,
            activeSpell: null
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
  
  const [assetLibrary, setAssetLibrary] = useState<AssetLibrary>({});
  const [viewingVeterans, setViewingVeterans] = useState(false);
  const [setupNames, setSetupNames] = useState<Record<string, string>>(() => {
      try {
          const saved = localStorage.getItem(SETUP_CONFIG_KEY);
          return saved ? JSON.parse(saved) : {};
      } catch (e) { return {}; }
  });
  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(window.innerWidth < 768);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(window.innerWidth < 768);

  const audioInit = useRef(false);
  const ambientSynthRef = useRef<Tone.PolySynth | null>(null);

  // --- PERSISTENCE & INIT ---
  useEffect(() => {
    const lib = loadAssetLibrary();
    setAssetLibrary(lib);
    setGameSettings(loadSettings());
  }, []);

  // Update Audio Volume when settings change
  useEffect(() => {
      if (!audioInit.current) return;
      
      const { masterVolume, musicVolume, muted } = gameSettings.audio;
      
      // Master Volume (Tone.Destination is in Decibels)
      // Map 0-100 to -60db to 0db
      const masterDb = muted || masterVolume === 0 ? -Infinity : Tone.gainToDb(masterVolume / 100);
      Tone.Destination.volume.rampTo(masterDb, 0.1);

      // Music Volume (Ambient Synth)
      if (ambientSynthRef.current) {
          const musicDb = musicVolume === 0 ? -Infinity : Tone.gainToDb(musicVolume / 100) - 20; // -20 is base mix
          ambientSynthRef.current.volume.rampTo(musicDb, 0.5);
      }

  }, [gameSettings.audio]);

  useEffect(() => {
    try {
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
        console.warn("Save failed: Storage quota exceeded.", e);
    }
  }, [state]);

  useEffect(() => {
    try {
        localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
    } catch (e) {
        console.warn("Roster save failed.", e);
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
        
        // Initial Volume Set
        const { musicVolume } = loadSettings().audio;
        const initialMusicDb = musicVolume === 0 ? -Infinity : Tone.gainToDb(musicVolume / 100) - 20;
        pad.set({ volume: initialMusicDb });
        
        ambientSynthRef.current = pad; // Store ref for updates

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
    
    const { sfxVolume, muted } = gameSettings.audio;
    if (muted || sfxVolume === 0) return;

    // Base volume calculation (0-1 multiplier)
    const vol = sfxVolume / 100;
    const gainDb = Tone.gainToDb(vol);

    if (type === 'roll') new Tone.MembraneSynth({ volume: gainDb }).toDestination().triggerAttackRelease("C1", "8n");
    if (type === 'horror') new Tone.MembraneSynth({ volume: gainDb }).toDestination().triggerAttackRelease("G0", "1n");
    if (type === 'click') new Tone.MetalSynth({ volume: gainDb - 20 }).toDestination().triggerAttackRelease("C5", "32n");
    if (type === 'event') new Tone.MetalSynth({ volume: gainDb }).toDestination().triggerAttackRelease("C3", "4n");
    if (type === 'search') new Tone.NoiseSynth({ volume: gainDb - 15 }).toDestination().triggerAttackRelease("16n");
    if (type === 'combat') new Tone.MembraneSynth({ volume: gainDb - 5, envelope: { sustain: 0.1 } }).toDestination().triggerAttackRelease("D1", "4n");
    if (type === 'heal') new Tone.Synth({ volume: gainDb - 10, envelope: { attack: 0.5 } }).toDestination().triggerAttackRelease("E4", "2n");
    if (type === 'madness') {
        const synth = new Tone.FMSynth({ volume: gainDb }).toDestination();
        synth.triggerAttackRelease("C5", "4n");
        synth.frequency.rampTo("C2", 1);
    }
    if (type === 'block') new Tone.MetalSynth({ volume: gainDb, frequency: 50, envelope: { decay: 0.1 } }).toDestination().triggerAttackRelease(50, "16n");
    if (type === 'trap') {
        const synth = new Tone.MetalSynth({ volume: gainDb, harmonicity: 100, resonance: 800 }).toDestination();
        synth.triggerAttackRelease(200, "8n");
    }
    if (type === 'spell') {
        const synth = new Tone.PolySynth(Tone.Synth, { volume: gainDb }).toDestination();
        synth.triggerAttackRelease(["C5", "E5", "G5"], "4n");
    }
    if (type === 'unlock') {
         new Tone.MetalSynth({ volume: gainDb, harmonicity: 200, resonance: 100 }).toDestination().triggerAttackRelease(800, "16n");
    }
    if (type === 'coin') {
        new Tone.MetalSynth({ volume: gainDb, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5 }).toDestination().triggerAttackRelease("C6", "16n");
    }
  };

  const addToLog = (message: string) => {
    setState(prev => ({ ...prev, log: [message, ...prev.log].slice(0, 50) }));
  };

  // --- AI IMAGE GENERATION ---
  const generateImage = async (prompt: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
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
      const lib = loadAssetLibrary();
      if (lib[tile.name]) {
          setState(prev => ({
              ...prev,
              board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: lib[tile.name] } : t)
          }));
          return;
      }
      if (tile.imageUrl) return;
      const img = await generateLocationAsset(tile.name, tile.type);
      if (img) {
          lib[tile.name] = img;
          saveAssetLibrary(lib);
          setAssetLibrary(lib);
          setState(prev => ({
              ...prev,
              board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: img } : t)
          }));
      }
  };

  const generateEnemyVisual = async (enemy: Enemy) => {
      if (enemy.imageUrl) return;
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
      if (gameSettings.graphics.reduceMotion) return; // Accessibility check
      setState(prev => ({ ...prev, screenShake: true }));
      setTimeout(() => setState(prev => ({ ...prev, screenShake: false })), 500);
  };

  const applySanityDamage = (player: Player, amount: number) => {
    if (player.isDead) return { player };
    const mitigation = player.inventory.filter(i => i.statModifier === 'mental_defense').reduce((sum, item) => sum + (item.bonus || 0), 0);
    const actualAmount = Math.max(0, amount - mitigation);
    let newSanity = player.sanity - actualAmount;
    let logMsg = '';
    let sound: 'madness' | undefined = undefined;
    let updatedPlayer = { ...player };
    if (actualAmount > 0) {
        triggerFloatingText(player.position.q, player.position.r, `-${actualAmount} SAN`, 'text-purple-400 font-bold drop-shadow-md');
        triggerShake();
    } else if (amount > 0 && actualAmount === 0) triggerFloatingText(player.position.q, player.position.r, `RESIST`, 'text-blue-300');
    if (newSanity <= 0) {
        if (player.activeMadness) {
            updatedPlayer.sanity = 0; updatedPlayer.isDead = true; logMsg = `Sinnslidelsen ble for mye. ${player.name} har mistet forstanden totalt. (Død)`;
        } else {
            const madness = MADNESS_CONDITIONS[Math.floor(Math.random() * MADNESS_CONDITIONS.length)];
            updatedPlayer.activeMadness = madness; updatedPlayer.sanity = player.maxSanity; logMsg = `SINNSSYKDOM! ${player.name} knekker sammen og utvikler: ${madness.name}.`; sound = 'madness';
            triggerFloatingText(player.position.q, player.position.r, "MADNESS!", 'text-fuchsia-500 font-black text-xl');
        }
    } else updatedPlayer.sanity = newSanity;
    return { player: updatedPlayer, log: logMsg, sound };
  };

  const applyPhysicalDamage = (player: Player, amount: number) => {
      if (player.isDead) return { player };
      const mitigation = player.inventory.filter(i => i.statModifier === 'physical_defense').reduce((sum, item) => sum + (item.bonus || 0), 0);
      const modifierDmg = state.activeModifiers.some(m => m.effect === 'strong_enemies') ? 1 : 0;
      const actualAmount = Math.max(0, (amount + modifierDmg) - mitigation);
      const newHp = Math.max(0, player.hp - actualAmount);
      let logMsg = '';
      if (actualAmount > 0) { 
          triggerFloatingText(player.position.q, player.position.r, `-${actualAmount} HP`, 'text-red-500 font-bold drop-shadow-md'); 
          triggerShake(); 
      } 
      else if (amount > 0 && actualAmount === 0) triggerFloatingText(player.position.q, player.position.r, `BLOCKED`, 'text-slate-400');
      if (newHp <= 0) logMsg = `${player.name} har omkommet av sine skader.`;
      return { player: { ...player, hp: newHp, isDead: newHp <= 0 }, log: logMsg };
  };

  const generateNarrative = async (tile: Tile) => {
    if (!process.env.API_KEY) return;
    generateTileVisual(tile);
    try {
      const prompt = `Skriv en kort, atmosfærisk beskrivelse (maks 2 setninger) på norsk for en etterforsker som går inn i "${tile.name}" i et Lovecraft-inspirert spill. Rommet inneholder: ${tile.object ? tile.object.type : 'ingenting spesielt'}. Doom-nivået er ${state.doom}.`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      if (response.text) addToLog(response.text);
    } catch (e) { console.warn("Gemini error", e); }
  };

  const selectScenario = (scenario: Scenario) => { playStinger('click'); setState(prev => ({ ...prev, activeScenario: scenario })); };

  const toggleCharacterSelection = (type: CharacterType) => {
    if (state.phase !== GamePhase.SETUP) return;
    playStinger('click');
    setState(prev => {
      const existing = prev.players.find(p => p.id === type && !p.instanceId);
      if (existing) return { ...prev, players: prev.players.filter(p => p !== existing) };
      if (prev.players.length >= 4) return prev;
      const char = CHARACTERS[type];
      const startingSpells: Spell[] = type === 'occultist' ? [SPELLS.find(s => s.id === 'wither')!] : [];
      const sessionName = setupNames[type] && setupNames[type].trim() !== '' ? setupNames[type] : char.name;
      const newPlayer: Player = { ...char, name: sessionName, position: { q: 0, r: 0 }, inventory: [], spells: startingSpells, actions: 2, isDead: false, madness: [], activeMadness: null, traits: [] };
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
          const sessionName = (vet.instanceId && setupNames[vet.instanceId] && setupNames[vet.instanceId].trim() !== '') ? setupNames[vet.instanceId] : vet.name;
          const player: Player = { ...vet, name: sessionName, position: { q: 0, r: 0 }, actions: 2, isDead: false };
          return { ...prev, players: [...prev.players, player] };
      });
  };

  const updatePlayerName = (identifier: string, newName: string, isVeteran: boolean) => {
      setSetupNames(prev => ({ ...prev, [identifier]: newName }));
      setState(prev => ({ ...prev, players: prev.players.map(p => {
              if (isVeteran) return p.instanceId === identifier ? { ...p, name: newName } : p;
              else return (p.id === identifier && !p.instanceId) ? { ...p, name: newName } : p;
          }) }));
  };

  const handleNameBlur = (identifier: string, currentName: string, defaultName: string, isVeteran: boolean) => {
      if (!currentName || currentName.trim() === '') updatePlayerName(identifier, defaultName, isVeteran);
  };

  const startGame = () => {
    if (state.players.length === 0 || !state.activeScenario) return;
    const invalidPlayer = state.players.find(p => !p.name || p.name.trim() === '');
    if (invalidPlayer) { playStinger('block'); alert("All investigators must have a name!"); return; }
    initAudio();
    const scenario = state.activeScenario;
    const startTile: Tile = { ...START_TILE, name: scenario.startLocation };
    generateTileVisual(startTile);
    const randomModifier = SCENARIO_MODIFIERS[Math.floor(Math.random() * SCENARIO_MODIFIERS.length)];
    setState(prev => ({ ...prev, phase: GamePhase.INVESTIGATOR, activePlayerIndex: 0, doom: scenario.startDoom, board: [startTile], cluesFound: 0, activeModifiers: [randomModifier], log: [`SAKSFIL: ${scenario.title}`, `GLOBAL EFFEKT: ${randomModifier.name} - ${randomModifier.description}`, ...prev.log] }));
    addToLog("Etterforskningen starter. Mørket senker seg over byen.");
  };

  const activePlayer = useMemo(() => {
    if (!state.players || state.players.length === 0) return null;
    return state.players[state.activePlayerIndex] ?? state.players[0] ?? null;
  }, [state.players, state.activePlayerIndex]);

  const handleAction = (actionType: string, payload?: any) => {
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    const madness = activePlayer.activeMadness?.id;
    const getDiceCount = (base: number, skill: 'combat' | 'investigation' | 'agility') => {
        let count = base;
        if (madness === 'm3') count -= 1;
        const itemBonus = activePlayer.inventory.filter(i => i.statModifier === skill).reduce((max, item) => Math.max(max, item.bonus || 0), 0);
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
          // Procedural Gen Logic
          const tileSet = state.activeScenario?.tileSet || 'mixed';
          let newTileType: 'room' | 'street' = 'street';
          if (tileSet === 'indoor') newTileType = 'room';
          else if (tileSet === 'outdoor') newTileType = 'street';
          else {
              if (currentTile?.type === 'room') newTileType = Math.random() > 0.8 ? 'street' : 'room';
              else newTileType = Math.random() > 0.8 ? 'room' : 'street';
          }
          const isCurrentConnector = currentTile?.category === 'connector';
          const newTileCategory = isCurrentConnector ? (Math.random() > 0.1 ? 'location' : 'connector') : (Math.random() > 0.3 ? 'connector' : 'location');
          const pool = newTileCategory === 'connector' ? (newTileType === 'room' ? INDOOR_CONNECTORS : OUTDOOR_CONNECTORS) : (newTileType === 'room' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS);
          const newTileName = pool[Math.floor(Math.random() * pool.length)];
          let objectType: TileObjectType | undefined = undefined;
          let isBlocking = false;
          let difficulty = 0;
          let reqSkill: 'strength' | 'insight' | 'agility' | undefined = undefined;
          const rng = Math.random();

          if (newTileCategory === 'connector') {
              if (rng > 0.6) {
                  if (newTileType === 'room') { objectType = 'locked_door'; isBlocking = true; difficulty = 4; reqSkill = 'strength'; } 
                  else { objectType = Math.random() > 0.5 ? 'rubble' : 'fog_wall'; isBlocking = true; difficulty = 3; reqSkill = objectType === 'fog_wall' ? 'insight' : 'strength'; }
              } else if (rng < 0.2) objectType = Math.random() > 0.5 ? 'mirror' : 'switch';
          } else {
              if (rng > 0.7) { const containers: TileObjectType[] = ['bookshelf', 'crate', 'chest', 'cabinet', 'radio']; objectType = containers[Math.floor(Math.random() * containers.length)]; isBlocking = false; } 
              else if (rng < 0.2) objectType = 'trap';
          }
          const isGate = newTileCategory === 'location' && Math.random() > 0.70; 
          let immediateSpawn: Enemy | null = null;
          if (newTileCategory === 'location' && Math.random() < 0.25) {
              const template = BESTIARY['cultist'];
              immediateSpawn = { id: `enemy-${Date.now()}-guard`, position: { q, r }, visionRange: 3, attackRange: 1, attackType: 'melee', maxHp: template.hp, speed: 2, ...template };
          }
          const newTile: Tile = { id: `tile-${state.board.length}`, q, r, name: newTileName, type: newTileType, category: newTileCategory, explored: true, searchable: true, searched: false, isGate, object: objectType ? { type: objectType, searched: false, blocking: isBlocking, difficulty, reqSkill } : undefined };
          const event = Math.random() > 0.85 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null;
          let trapLog = '';
          let finalPlayer = { ...activePlayer, position: { q, r }, actions: activePlayer.actions - 1 };
          if (objectType === 'trap') { playStinger('trap'); trapLog = `DU GIKK I EN FELLE! 1 skade.`; const dmgResult = applyPhysicalDamage(finalPlayer, 1); finalPlayer = dmgResult.player; }
          
          generateTileVisual(newTile); // Trigger visual gen

          setState(prev => {
              let updatedEnemies = [...prev.enemies];
              let updatedLog = [...prev.log];
              let updatedEncountered = [...prev.encounteredEnemies];
              if (immediateSpawn) { updatedEnemies.push(immediateSpawn); updatedLog.unshift(`A ${immediateSpawn.name} was waiting in the shadows!`); if (!updatedEncountered.includes(immediateSpawn.type)) updatedEncountered.push(immediateSpawn.type); playStinger('horror'); }
              if (trapLog) updatedLog.unshift(trapLog);
              return { ...prev, board: [...prev.board, newTile], players: prev.players.map((p, i) => i === prev.activePlayerIndex ? finalPlayer : p), activeEvent: event, selectedTileId: null, enemies: updatedEnemies, log: updatedLog, encounteredEnemies: updatedEncountered };
          });
          generateNarrative(newTile);
        } else {
          setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p), selectedTileId: null }));
          if (targetTile && !targetTile.imageUrl) generateTileVisual(targetTile);
        }
        break;
      
      case 'interact':
          const selTile = state.board.find(t => t.id === state.selectedTileId);
          if (!selTile) return;
          if (selTile.object?.blocking) {
             if (Math.random() > 0.5 && (selTile.object.type === 'locked_door' || selTile.object.type === 'fog_wall')) {
                 setState(prev => ({ ...prev, activePuzzle: { type: 'sequence', difficulty: selTile.object!.difficulty || 3, targetTileId: selTile.id } }));
                 addToLog("Du må bruke forstanden..."); return;
             }
             playStinger('roll');
             const skillMap: Record<string, 'combat' | 'investigation' | 'agility'> = { 'strength': 'combat', 'insight': 'investigation', 'agility': 'agility' };
             const skillType = skillMap[selTile.object.reqSkill || 'strength'] || 'combat';
             const skillTypeTyped = skillType as 'combat' | 'investigation' | 'agility';
             const iDice = getDiceCount(2 + (activePlayer.id === 'veteran' && selTile.object.reqSkill === 'strength' ? 1 : 0), skillTypeTyped);
             const roll = Array.from({ length: iDice }, () => Math.floor(Math.random() * 6) + 1);
             const success = roll.filter(v => v >= 4).length;
             setState(prev => ({ ...prev, lastDiceRoll: roll }));
             if (success >= 1) {
                 playStinger('click'); addToLog(`Suksess! ${activePlayer.name} fjernet ${selTile.object.type}.`); triggerFloatingText(selTile.q, selTile.r, "CLEARED!", 'text-green-500');
                 setState(prev => ({ ...prev, board: prev.board.map(t => t.id === selTile.id ? { ...t, object: undefined } : t), players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p), selectedTileId: null }));
             } else { addToLog(`Mislyktes.`); triggerFloatingText(selTile.q, selTile.r, "FAILED", 'text-red-500'); setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) })); }
          }
          break;
        
      case 'attack':
          let targetId = state.selectedEnemyId;
          const enemiesInRange = state.enemies.filter(e => !e.isDying && hexDistance(activePlayer.position, e.position) <= 1);
          
          if (!targetId) {
              if (enemiesInRange.length === 1) targetId = enemiesInRange[0].id;
              else if (enemiesInRange.length > 1) { addToLog("Flere fiender i nærheten. Velg en å angripe."); return; }
              else { addToLog("Ingen fiender i nærheten."); return; }
          }
          
          const target = state.enemies.find(e => e.id === targetId);
          if (!target) return;
          
          if (hexDistance(activePlayer.position, target.position) > 1) { addToLog("Fienden er for langt unna."); return; }

          playStinger('roll');
          const baseCombat = 2 + (activePlayer.id === 'veteran' ? 1 : 0);
          const combatDice = getDiceCount(baseCombat, 'combat');
          const attackRoll = Array.from({ length: combatDice }, () => Math.floor(Math.random() * 6) + 1);
          const hits = attackRoll.filter(v => v >= 4).length;
          
          setState(prev => ({ ...prev, lastDiceRoll: attackRoll }));
          
          if (hits > 0) {
              playStinger('combat');
              triggerFloatingText(target.position.q, target.position.r, `-${hits} HP`, 'text-red-500 text-3xl font-black drop-shadow-md');
              if (hits >= 3) triggerShake(); // Impact shake on big hits

              const newHp = target.hp - hits;
              if (newHp <= 0) {
                  addToLog(`Kritisk treff! ${target.name} er beseiret.`);
                  playStinger('horror');
                  setState(prev => ({
                      ...prev,
                      enemies: prev.enemies.map(e => e.id === targetId ? { ...e, hp: 0, isDying: true } : e),
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                      selectedEnemyId: null
                  }));
                  setTimeout(() => {
                      setState(prev => ({ ...prev, enemies: prev.enemies.filter(e => e.id !== targetId) }));
                  }, 1000);
              } else {
                  addToLog(`Angrep traff ${target.name} for ${hits} skade.`);
                  setState(prev => ({
                      ...prev,
                      enemies: prev.enemies.map(e => e.id === targetId ? { ...e, hp: newHp } : e),
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p)
                  }));
              }
          } else {
              triggerFloatingText(target.position.q, target.position.r, "MISS", 'text-slate-500 font-bold');
              addToLog(`${activePlayer.name} bommet.`);
              setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
          }
          break;

      case 'cast':
          const spell = payload as Spell;
          if (activePlayer.insight < spell.cost) {
              addToLog("Not enough Insight to cast this spell.");
              playStinger('block');
              return;
          }

          // Case 1: Targeted Spells (Requires Enemy Selection)
          if (spell.range > 0) {
              setState(prev => ({ ...prev, activeSpell: spell, selectedEnemyId: null }));
              addToLog(`Casting ${spell.name}. Select a target within ${spell.range} tiles.`);
              playStinger('click');
              return;
          }

          // Case 2: Self/Global Spells (Instant)
          let spellLog = `Casting ${spell.name}...`;
          let updatedPlayerState = { ...activePlayer, insight: activePlayer.insight - spell.cost, actions: activePlayer.actions - 1 };
          let clueGain = 0;

          playStinger('spell');

          if (spell.effectType === 'heal') {
              const healedHp = Math.min(activePlayer.maxHp, activePlayer.hp + spell.value);
              updatedPlayerState.hp = healedHp;
              spellLog += ` Healed for ${spell.value} HP.`;
              triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `+${spell.value} HP`, 'text-green-400');
          } 
          else if (spell.effectType === 'reveal') {
              clueGain = spell.value;
              spellLog += ` Revealed hidden truths! +${clueGain} Insight.`;
              updatedPlayerState.insight += clueGain; // Refund/Bonus? Or CluesFound? Let's say CluesFound for victory?
              // Actually 'reveal' usually finds clues for the scenario goal.
              // Let's increment cluesFound in state, but also give visual feedback.
              triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `CLUE FOUND`, 'text-cyan-400 font-bold');
          }

          addToLog(spellLog);
          setState(prev => ({
              ...prev,
              players: prev.players.map((p, i) => i === prev.activePlayerIndex ? updatedPlayerState : p),
              cluesFound: prev.cluesFound + clueGain
          }));
          break;

      case 'cancel_cast':
          setState(prev => ({ ...prev, activeSpell: null }));
          addToLog("Spellcasting cancelled.");
          playStinger('click');
          break;

      default: break;
    }
  };

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
      if (event.effectType === 'sanity') { const result = applySanityDamage(player, Math.abs(event.value)); newPlayers[activePlayerIdx] = result.player; if (result.log) addToLog(result.log); if (result.sound) playStinger('madness'); }
      else if (event.effectType === 'health') { const dmg = Math.abs(event.value); const result = applyPhysicalDamage(player, dmg); newPlayers[activePlayerIdx] = result.player; if (result.log) addToLog(result.log); }
      else if (event.effectType === 'insight') { newPlayers[activePlayerIdx] = { ...player, insight: Math.max(0, player.insight + event.value) }; triggerFloatingText(player.position.q, player.position.r, `+${event.value} INSIGHT`, 'text-blue-400'); }
      else if (event.effectType === 'doom') newDoom = Math.max(0, prev.doom + event.value);
      else if (event.effectType === 'spawn') { const template = BESTIARY['cultist']; newEnemies.push({ id: `enemy-${Date.now()}`, position: { ...player.position }, visionRange: 3, attackRange: 1, attackType: 'melee', maxHp: template.hp, speed: 2, ...template }); if (!newEncountered.includes(template.type)) newEncountered.push(template.type); addToLog("A Cultist emerges!"); }
      return { ...prev, players: newPlayers, doom: newDoom, enemies: newEnemies, activeEvent: null, encounteredEnemies: newEncountered };
    });
    playStinger('click');
  }, [state.activeEvent, state.activePlayerIndex]);

  // MYTHOS PHASE LOGIC - UPDATED AI (v3.9.15 Pathfinding)
  useEffect(() => {
    if (state.phase === GamePhase.MYTHOS) {
      const timer = setTimeout(() => {
        playStinger('horror');
        addToLog('Mythos-fase: Verden skjelver...');
        
        setState(prev => {
          let newDoom = prev.doom - 1;
          const updatedEnemies: Enemy[] = [];
          const players = [...prev.players]; 
          let logMessages: string[] = [];

          // Helper to deal damage inside the reducer
          const damagePlayer = (pId: string, type: 'hp' | 'sanity' | 'doom', amount: number) => {
              const pIdx = players.findIndex(p => p.id === pId || p.instanceId === pId);
              if (pIdx === -1) return;
              if (players[pIdx].isDead) return;

              if (type === 'doom') {
                  newDoom = Math.max(0, newDoom - 1);
                  logMessages.push("The Ritual advances! Doom increases.");
                  triggerFloatingText(players[pIdx].position.q, players[pIdx].position.r, "DOOM!", "text-red-600 font-black");
                  return;
              }

              if (type === 'sanity') {
                  const res = applySanityDamage(players[pIdx], amount);
                  players[pIdx] = res.player;
                  if (res.log) logMessages.push(res.log);
                  if (res.sound) playStinger('madness');
              } else {
                  const res = applyPhysicalDamage(players[pIdx], amount);
                  players[pIdx] = res.player;
                  if (res.log) logMessages.push(res.log);
              }
          };

          for (const enemy of prev.enemies) { 
              let currentEnemy = { ...enemy };
              
              // Regeneration
              if (currentEnemy.traits?.includes('regenerate') && currentEnemy.hp < currentEnemy.maxHp) {
                  currentEnemy.hp = Math.min(currentEnemy.maxHp, currentEnemy.hp + 1);
              }

              const alivePlayers = players.filter(p => !p.isDead);
              
              // AI STEP 1: Find best target via Pathfinding
              // We do a BFS from enemy to find nearest reachable player
              const enemyBlockers = new Set([
                  ...updatedEnemies.map(e => `${e.position.q},${e.position.r}`),
                  ...prev.enemies.filter(e => e.id !== enemy.id && !updatedEnemies.find(ue => ue.id === e.id)).map(e => `${e.position.q},${e.position.r}`)
              ]);

              const playerPositions = alivePlayers.map(p => p.position);
              const path = findPath(
                  currentEnemy.position, 
                  playerPositions, 
                  prev.board, 
                  enemyBlockers, 
                  currentEnemy.traits?.includes('flying') || false
              );

              // Ambusher Logic: If no path found or path is too long, try teleport
              if ((!path || path.length > 8) && currentEnemy.traits?.includes('ambusher') && Math.random() > 0.6) {
                   const targetPlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)];
                   if (targetPlayer) {
                       const neighbors = [
                           {q: targetPlayer.position.q + 1, r: targetPlayer.position.r}, 
                           {q: targetPlayer.position.q - 1, r: targetPlayer.position.r}, 
                           {q: targetPlayer.position.q, r: targetPlayer.position.r + 1}, 
                           {q: targetPlayer.position.q, r: targetPlayer.position.r - 1}, 
                           {q: targetPlayer.position.q + 1, r: targetPlayer.position.r - 1}, 
                           {q: targetPlayer.position.q - 1, r: targetPlayer.position.r + 1}
                       ];
                       const validAmbushSpot = neighbors.find(n => {
                           const tile = prev.board.find(t => t.q === n.q && t.r === n.r);
                           const isOccupied = players.some(p => p.position.q === n.q && p.position.r === n.r) || enemyBlockers.has(`${n.q},${n.r}`);
                           return tile && !tile.object?.blocking && !isOccupied;
                       });

                       if (validAmbushSpot) {
                           currentEnemy.position = validAmbushSpot;
                           logMessages.push(`${currentEnemy.name} emerges from the angles of space!`);
                           playStinger('trap');
                           updatedEnemies.push(currentEnemy);
                           continue; // End turn after ambush
                       }
                   }
              }

              // Normal Movement / Attack Loop
              let remainingMoves = currentEnemy.speed || 1;
              let currentPathIndex = 0; // The path includes start -> ... -> end. index 0 is start.

              // If no path found, we can't move to target. Just sit tight (or wander randomly if we implemented that).
              // If path found, try to move along it.
              if (path && path.length > 1) {
                  // Identify which player is at the end of the path
                  const targetPos = path[path.length - 1];
                  const targetPlayer = alivePlayers.find(p => p.position.q === targetPos.q && p.position.r === targetPos.r);

                  // Move loop
                  while (remainingMoves > 0) {
                      // Check for Attack Opportunity BEFORE moving further?
                      // Ranged units check if they have LOS and are in range.
                      if (targetPlayer) {
                          const dist = hexDistance(currentEnemy.position, targetPlayer.position);
                          const hasLOS = hasLineOfSight(currentEnemy.position, targetPlayer.position, prev.board, currentEnemy.visionRange);
                          
                          if (hasLOS && dist <= currentEnemy.attackRange) {
                              // Stop moving and attack
                              remainingMoves = 0;
                              logMessages.push(`${currentEnemy.name} attacks ${targetPlayer.name}!`);
                              
                              if (currentEnemy.attackType === 'doom') {
                                  damagePlayer(targetPlayer.instanceId || targetPlayer.id, 'doom', 1);
                              } else if (currentEnemy.attackType === 'sanity') {
                                  damagePlayer(targetPlayer.instanceId || targetPlayer.id, 'sanity', currentEnemy.horror);
                              } else {
                                  damagePlayer(targetPlayer.instanceId || targetPlayer.id, 'hp', currentEnemy.damage);
                              }
                              break; // Turn over
                          }
                      }

                      // Move one step if not attacking
                      // Path[0] is current pos. Path[1] is next step.
                      if (currentPathIndex < path.length - 1) { // Ensure we don't step ONTO the player
                          const nextStep = path[currentPathIndex + 1];
                          // Check if next step is the player (don't move onto player)
                          if (players.some(p => p.position.q === nextStep.q && p.position.r === nextStep.r)) {
                              remainingMoves = 0; // Reached melee range, but didn't attack yet? 
                              // Actually if we are here, it means we are adjacent (path length 2: start -> player).
                              // The loop continues, next iteration checks range/LOS, which will be true for melee.
                          } else {
                              currentEnemy.position = nextStep;
                              currentPathIndex++;
                              remainingMoves--;
                          }
                      } else {
                          remainingMoves = 0;
                      }
                  }
              }

              updatedEnemies.push(currentEnemy);
          } 
          
          return { 
              ...prev, 
              doom: newDoom, 
              round: prev.round + 1, 
              enemies: updatedEnemies, 
              players: players,
              log: [...logMessages, ...prev.log],
              phase: (newDoom <= 0) ? GamePhase.GAME_OVER : GamePhase.INVESTIGATOR, 
              activePlayerIndex: 0 
          };
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  const handleStartNewGame = () => {
    playStinger('click');
    setState(DEFAULT_STATE);
    setIsMainMenuOpen(false);
    initAudio();
  };

  const handleResetData = () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ROSTER_KEY);
      localStorage.removeItem(SETUP_CONFIG_KEY);
      localStorage.removeItem('shadows_1920s_settings_v1');
      window.location.reload();
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
      setGameSettings(newSettings);
  };

  const handleResetGame = () => { 
      setIsMainMenuOpen(true); 
  };

  const handleEndTurn = () => {
    playStinger('click');
    setState(prev => {
      let nextIndex = prev.activePlayerIndex + 1;
      let nextPhase = GamePhase.INVESTIGATOR;
      let foundPlayer = false;

      if (nextIndex >= prev.players.length) {
          nextIndex = 0;
          nextPhase = GamePhase.MYTHOS;
      } else {
        while (nextIndex < prev.players.length) {
            if (!prev.players[nextIndex].isDead) {
                foundPlayer = true;
                break;
            }
            nextIndex++;
        }
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
        selectedTileId: null,
        activeSpell: null // Clear spell selection on end turn
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
          triggerFloatingText(0, 0, "UNLOCKED!", "text-green-400");
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

  const deleteVeteran = (instanceId: string) => {
      setRoster(prev => prev.filter(p => p.instanceId !== instanceId));
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

  const goToMerchant = () => {
      setState(prev => ({ ...prev, phase: GamePhase.MERCHANT }));
  };

  const saveAllAndExit = () => {
      const survivors = state.players.filter(p => !p.isDead);
      setRoster(prev => {
          const newRoster = [...prev];
          survivors.forEach(survivor => {
              const newTrait = TRAIT_POOL[Math.floor(Math.random() * TRAIT_POOL.length)];
              const existingTraits = survivor.traits || [];
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
              
              if (!existingTraits.some(t => t.id === newTrait.id)) {
                  if (newTrait.effect === 'max_hp_down') newVet.maxHp = Math.max(1, newVet.maxHp - 1);
                  if (newTrait.effect === 'combat_bonus') newVet.maxHp = newVet.maxHp + 1;
              }

              const existingIdx = newRoster.findIndex(p => p.instanceId === newVet.instanceId);
              if (existingIdx !== -1) {
                  newRoster[existingIdx] = newVet;
              } else {
                  newRoster.push(newVet);
              }
          });
          return newRoster;
      });
      handleStartNewGame();
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

  // --- KEYBOARD LISTENERS ---
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (state.phase !== GamePhase.INVESTIGATOR || isMainMenuOpen || showOptions || showJournal || state.activeEvent) return;

          switch(e.key) {
              case '1': handleAction('investigate'); break;
              case '2': handleAction('attack'); break;
              case '3': handleAction('flee'); break;
              case '4': handleAction('rest'); break;
              case '5': handleAction('item'); break;
              case ' ': e.preventDefault(); handleEndTurn(); break;
              case 'c': setLeftPanelCollapsed(prev => !prev); break;
              case 'l': setRightPanelCollapsed(prev => !prev); break;
              case 'm': setRightPanelCollapsed(prev => !prev); break; // Map alias for Log
              default: break;
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.phase, isMainMenuOpen, showOptions, showJournal, state.activeEvent, activePlayer]);

  const activeMadnessClass = activePlayer?.activeMadness?.visualClass || '';
  const shakeClass = state.screenShake ? 'animate-shake' : '';
  const canContinue = state.phase !== GamePhase.SETUP && state.phase !== GamePhase.GAME_OVER && state.players.length > 0;
  
  const highContrastClass = gameSettings.graphics.highContrast ? 'high-contrast-mode' : '';

  if (isMainMenuOpen) {
      return (
        <>
            <MainMenu onNewGame={handleStartNewGame} onContinue={() => {setIsMainMenuOpen(false); initAudio();}} onOptions={() => setShowOptions(true)} canContinue={canContinue} version={APP_VERSION} />
            {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} onResetData={handleResetData} onUpdateSettings={handleUpdateSettings} />}
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
                                <div className="absolute inset-0 bg-[#e94560] opacity-0 group-hover:opacity-1 rounded-lg transition-opacity duration-300"></div>
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

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${activeMadnessClass} ${shakeClass} ${highContrastClass}`}>
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] opacity-60"></div>
      
      {showTurnNotification && <TurnNotification player={activePlayer} phase={state.phase} />}

      <GameBoard 
        tiles={state.board} 
        players={state.players} 
        enemies={state.enemies} 
        selectedEnemyId={state.selectedEnemyId} 
        onTileClick={(q, r) => handleAction('move', { q, r })} 
        onEnemyClick={(id) => {
            if (state.activeSpell) {
                const target = state.enemies.find(e => e.id === id);
                if (target && hexDistance(activePlayer.position, target.position) <= state.activeSpell.range) {
                    playStinger('spell');
                    let spellLog = `${activePlayer.name} casts ${state.activeSpell.name} on ${target.name}!`;
                    let updatedEnemies = [...state.enemies];
                    
                    if (state.activeSpell.effectType === 'damage') {
                        const newHp = Math.max(0, target.hp - state.activeSpell.value);
                        spellLog += ` Dealt ${state.activeSpell.value} damage.`;
                        triggerFloatingText(target.position.q, target.position.r, `-${state.activeSpell.value} HP`, 'text-purple-400 font-bold drop-shadow-md');
                        
                        if (newHp === 0) {
                            spellLog += ` The target is destroyed!`;
                            updatedEnemies = updatedEnemies.map(e => e.id === id ? { ...e, hp: 0, isDying: true } : e);
                            setTimeout(() => {
                                setState(prev => ({ ...prev, enemies: prev.enemies.filter(e => e.id !== id) }));
                            }, 1000);
                        } else {
                            updatedEnemies = updatedEnemies.map(e => e.id === id ? { ...e, hp: newHp } : e);
                        }
                    } else if (state.activeSpell.effectType === 'banish') {
                        spellLog += ` The entity is banished to the void!`;
                        triggerFloatingText(target.position.q, target.position.r, `BANISHED!`, 'text-cyan-400 font-bold drop-shadow-md');
                        updatedEnemies = updatedEnemies.filter(e => e.id !== id);
                        playStinger('horror');
                    }

                    addToLog(spellLog);
                    setState(prev => ({
                        ...prev,
                        enemies: updatedEnemies,
                        players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, insight: p.insight - prev.activeSpell!.cost, actions: p.actions - 1 } : p),
                        activeSpell: null,
                        selectedEnemyId: null
                    }));
                } else {
                    addToLog("Target is out of range or invalid.");
                    playStinger('block');
                }
            } else {
                setState(prev => ({...prev, selectedEnemyId: id}));
            }
        }} 
        onEnemyHover={setHoveredEnemyId} 
        floatingTexts={state.floatingTexts} 
        doom={state.doom}
      />

      {/* Header */}
      <header className="fixed top-0 md:top-4 left-0 md:left-1/2 md:-translate-x-1/2 w-full md:w-auto flex justify-between md:justify-center items-center gap-2 md:gap-6 bg-[#16213e]/90 backdrop-blur-xl border-b-2 md:border-2 border-[#e94560]/30 px-4 py-2 md:px-8 md:py-3 md:rounded-full shadow-2xl z-40">
          <div className="flex items-center gap-2 md:gap-4 border-r border-slate-700 pr-2 md:pr-4">
             <Skull className={`text-[#e94560]`} size={16} />
             <span className="font-bold text-lg md:text-2xl tabular-nums text-white">{state.doom}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowOptions(true)} className="text-slate-500 hover:text-white transition-colors" title="Options">
                <Edit2 size={16} />
            </button>
            <button onClick={() => setShowJournal(true)} className="text-slate-500 hover:text-amber-500 transition-colors" title="Bestiary">
                <Book size={16} />
            </button>
            <button onClick={handleResetGame} className="text-slate-500 hover:text-[#e94560]"><RotateCcw size={16}/></button>
          </div>
      </header>

      {/* Panels (Left/Right/Bottom) - Included via Component Imports in real app */}
      
      {activePlayer && !leftPanelCollapsed && (
        <div className="fixed inset-0 md:left-4 md:top-20 md:bottom-24 md:w-80 md:inset-auto transition-all duration-500 z-50 animate-in slide-in-from-bottom md:slide-in-from-left">
          <div className="h-full bg-[#0a0a1a]/95 md:bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 md:rounded shadow-2xl flex flex-col relative">
            <button 
                onClick={() => setLeftPanelCollapsed(true)} 
                className="absolute top-4 right-4 md:top-2 md:right-2 text-slate-500 hover:text-white z-50 p-2 md:p-1 bg-black/50 rounded-full"
                title="Minimize Character Panel"
            >
              <Minimize2 size={20}/>
            </button>
            <div className="flex-1 flex flex-col overflow-hidden pt-8 md:pt-0">
                <CharacterPanel player={activePlayer} allPlayers={state.players} onTrade={(item, targetId) => handleAction('trade', { item, targetPlayerId: targetId })} onDrop={(item) => handleAction('drop', { item })} />
            </div>
          </div>
        </div>
      )}

      {!rightPanelCollapsed && (
        <div className="fixed inset-0 md:right-4 md:top-20 md:bottom-24 md:w-80 md:inset-auto transition-all duration-500 z-50 animate-in slide-in-from-bottom md:slide-in-from-right">
            <div className="h-full flex flex-col gap-4 bg-[#0a0a1a]/95 md:bg-transparent">
            {state.selectedEnemyId ? (
                (() => {
                    const displayEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
                    return displayEnemy ? <EnemyPanel enemy={displayEnemy} onClose={() => setState(prev => ({ ...prev, selectedEnemyId: null }))} /> : null;
                })()
            ) : hoveredEnemyId ? (
                (() => {
                    const displayEnemy = state.enemies.find(e => e.id === hoveredEnemyId);
                    return displayEnemy ? <EnemyPanel enemy={displayEnemy} /> : null;
                })()
            ) : (
                <div className="flex-1 bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 md:rounded shadow-2xl flex flex-col relative overflow-hidden">
                    <button 
                        onClick={() => setRightPanelCollapsed(true)} 
                        className="absolute top-4 left-4 md:top-2 md:left-2 text-slate-500 hover:text-white z-50 p-2 md:p-1 bg-black/50 rounded-full"
                        title="Minimize Log"
                    >
                    <Minimize2 size={20}/>
                    </button>
                    <div className="flex-1 flex flex-col pt-12 md:pt-0">
                    <div className="p-4 border-b border-slate-800 bg-black/40 flex items-center justify-end gap-2">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-sans">DOKUMENTERTE HENDELSER</h3>
                        <ScrollText size={14} className="text-[#e94560]"/>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 font-serif italic text-[12px] leading-relaxed custom-scrollbar pb-20 md:pb-5">
                        {state.log.map((entry, idx) => (
                            <div key={idx} className={`${idx === 0 ? 'text-white border-l-2 border-[#e94560] pl-3 py-1 bg-[#e94560]/5' : 'text-slate-500'} animate-in fade-in duration-500`}>
                                {formatLogEntry(entry)}
                            </div>
                        ))}
                    </div>
                    </div>
                </div>
            )}
            </div>
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-6 left-0 right-0 pointer-events-none z-40 flex justify-between px-4 md:px-8">
          <div className="pointer-events-auto">
              {activePlayer && leftPanelCollapsed && (
                  <button 
                    onClick={() => setLeftPanelCollapsed(false)}
                    className="flex items-center gap-2 md:gap-3 px-3 py-3 md:px-6 md:py-4 bg-[#1a120b] border-2 border-amber-900/50 hover:border-amber-500 text-amber-500 font-bold uppercase text-xs tracking-widest rounded-full md:rounded-xl shadow-lg hover:-translate-y-1 transition-all"
                  >
                      <User size={20} /> <span className="hidden md:inline">Character (C)</span>
                  </button>
              )}
          </div>

          <div className="pointer-events-auto">
              {rightPanelCollapsed && (
                  <button 
                    onClick={() => setRightPanelCollapsed(false)}
                    className="flex items-center gap-2 md:gap-3 px-3 py-3 md:px-6 md:py-4 bg-[#0a0a1a] border-2 border-slate-700 hover:border-[#e94560] text-slate-300 hover:text-[#e94560] font-bold uppercase text-xs tracking-widest rounded-full md:rounded-xl shadow-lg hover:-translate-y-1 transition-all"
                  >
                      <span className="hidden md:inline">Log (L)</span> <ScrollText size={20} />
                  </button>
              )}
          </div>
      </div>

      <footer className="fixed bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 md:gap-4 z-40 w-[95%] md:w-auto justify-center">
        <div className="bg-[#16213e]/90 backdrop-blur-xl border-2 border-[#e94560]/40 p-2 md:p-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center gap-2 md:gap-4 max-w-full">
          <ActionBar 
            onAction={handleAction} 
            actionsRemaining={activePlayer?.isDead ? 0 : (activePlayer?.actions ?? 0)} 
            isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
            contextAction={(() => {
                if (!state.selectedTileId || !activePlayer) return null;
                const tile = state.board.find(t => t.id === state.selectedTileId);
                if (!tile) return null;
                if (hexDistance(activePlayer.position, tile) > 1) return null;
                if (tile.object?.blocking) {
                    const obj = tile.object;
                    let label = 'Interact';
                    if (obj.type === 'locked_door') label = 'Break Down Door';
                    if (obj.type === 'rubble') label = 'Clear Rubble';
                    if (obj.type === 'barricade') label = 'Dismantle';
                    if (obj.type === 'fog_wall') label = 'Dispel Fog';
                    return { id: 'interact-blocker', label, iconType: obj.reqSkill || 'strength', difficulty: obj.difficulty || 3 };
                }
                if (tile.object && !tile.object.searched && (['mirror', 'radio', 'switch'].includes(tile.object.type))) {
                    return { id: 'interact-object', label: 'Use Object', iconType: 'interact', difficulty: 0 };
                }
                return null;
            })()} 
            spells={activePlayer?.spells || []}
            activeSpell={state.activeSpell}
          />
          <div className="w-px h-8 md:h-12 bg-slate-800 mx-1 md:mx-2 shrink-0"></div>
          <button onClick={handleEndTurn} className="px-4 py-3 md:px-8 md:py-4 bg-[#e94560] text-white font-bold hover:bg-[#c9354d] transition-all flex items-center gap-2 md:gap-3 uppercase text-[9px] md:text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.3)] group shrink-0">
            <span className="hidden md:inline">{state.activePlayerIndex === state.players.length - 1 ? "AVSLUTT RUNDEN (SPC)" : "NESTE TUR (SPC)"}</span>
            <span className="md:hidden"><ChevronRight size={16} /></span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform hidden md:block" />
          </button>
        </div>
      </footer>
      
      {/* Modals */}
      {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} onResetData={handleResetData} onUpdateSettings={handleUpdateSettings} />}
      {state.lastDiceRoll && <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"><DiceRoller values={state.lastDiceRoll} onComplete={() => setState(prev => ({ ...prev, lastDiceRoll: null }))} /></div>}
      {state.activeEvent && <EventModal event={state.activeEvent} onResolve={handleResolveEvent} />}
      {state.activePuzzle && <PuzzleModal difficulty={state.activePuzzle.difficulty} onSolve={handlePuzzleComplete} />}
      {showJournal && <JournalModal unlockedIds={state.encounteredEnemies} onClose={() => setShowJournal(false)} />}
      
      {state.phase === GamePhase.GAME_OVER && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl">
           <div className="text-center max-w-2xl">
             <h2 className="text-6xl md:text-9xl font-display text-[#e94560] italic mb-6 md:mb-10 uppercase tracking-tighter">FINIS</h2>
             <p className="text-lg md:text-xl text-slate-400 mb-10 md:mb-16 italic font-serif px-4 md:px-10">
               {state.cluesFound >= (state.activeScenario?.cluesRequired || 3) ? "Portalen er forseglet. Skyggene trekker seg tilbake..." : state.players.every(p => p.isDead) ? "Alle etterforskere er tapt. Mørket har seiret." : "Tiden rant ut. Dommedag er her."}
             </p>
             {state.players.some(p => !p.isDead) && (
                 <div className="mb-10">
                     <p className="text-sm uppercase tracking-widest text-slate-500 mb-4 font-bold">Overlevende (Klikk for å lagre)</p>
                     <div className="flex justify-center gap-4 flex-wrap">
                         {state.cluesFound >= (state.activeScenario?.cluesRequired || 3) && (
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

      {state.phase === GamePhase.MERCHANT && (
          <MerchantShop players={state.players.filter(p => !p.isDead)} onBuy={handleBuyItem} onFinish={() => saveAllAndExit()} />
      )}
    </div>
  );
};

export default App;
