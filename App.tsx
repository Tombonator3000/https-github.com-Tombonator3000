
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
  Edit2
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, Madness, ContextAction, SavedInvestigator, FloatingText, Item } from './types';
import { CHARACTERS, ITEMS, START_TILE, EVENTS, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, SCENARIOS, MADNESS_CONDITIONS } from './constants';
import GameBoard from './components/GameBoard';
import CharacterPanel from './components/CharacterPanel';
import EnemyPanel from './components/EnemyPanel';
import ActionBar from './components/ActionBar';
import DiceRoller from './components/DiceRoller';
import EventModal from './components/EventModal';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const ROSTER_KEY = 'shadows_1920s_roster';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const APP_VERSION = "2.8.2";

// --- DEFAULT STATE CONSTANT ---
const DEFAULT_STATE: GameState = {
    phase: GamePhase.SETUP,
    doom: 12,
    round: 1,
    players: [],
    activePlayerIndex: 0,
    board: [START_TILE],
    enemies: [],
    cluesFound: 0,
    log: [],
    lastDiceRoll: null,
    activeEvent: null,
    activeCombat: null,
    selectedEnemyId: null,
    selectedTileId: null,
    activeScenario: null,
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

  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
  const [viewingVeterans, setViewingVeterans] = useState(false);

  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const audioInit = useRef(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster));
  }, [roster]);

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

  const playStinger = (type: 'roll' | 'event' | 'click' | 'horror' | 'search' | 'combat' | 'heal' | 'madness' | 'block') => {
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
      if (tile.imageUrl) return;
      const prompt = `A top-down, hand-painted battlemap tile of a ${tile.name} (${tile.type}), 1920s Lovecraftian horror style. Dark, gritty texture, fog, eldritch atmosphere. No grid lines.`;
      const img = await generateImage(prompt);
      if (img) {
          setState(prev => ({
              ...prev,
              board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: img } : t)
          }));
      }
  };

  const generateEnemyVisual = async (enemy: Enemy) => {
      if (enemy.imageUrl) return;
      const prompt = `A terrifying, nightmarish illustration of a ${enemy.name} (${enemy.type}) from Cthulhu mythos. Dark fantasy art, creature design, horror, menacing, detailed, isolated on dark background.`;
      const img = await generateImage(prompt);
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

    let newSanity = player.sanity - amount;
    let logMsg = '';
    let sound: 'madness' | undefined = undefined;
    let updatedPlayer = { ...player };

    if (amount > 0) {
        triggerFloatingText(player.position.q, player.position.r, `-${amount} SAN`, 'text-purple-400');
        triggerShake();
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
      const newPlayer: Player = { ...char, position: { q: 0, r: 0 }, inventory: [], actions: 2, isDead: false, madness: [], activeMadness: null };
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

          const player: Player = {
              ...vet,
              position: { q: 0, r: 0 },
              actions: 2,
              isDead: false
          };
          return { ...prev, players: [...prev.players, player] };
      });
  };

  const updatePlayerName = (identifier: string, newName: string, isVeteran: boolean) => {
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

  const startGame = () => {
    if (state.players.length === 0 || !state.activeScenario) return;
    initAudio();
    const scenario = state.activeScenario;
    const startTile: Tile = { ...START_TILE, name: scenario.startLocation };
    generateTileVisual(startTile);

    setState(prev => ({ 
      ...prev, 
      phase: GamePhase.INVESTIGATOR, 
      activePlayerIndex: 0,
      doom: scenario.startDoom,
      board: [startTile],
      cluesFound: 0,
      log: [`SAKSFIL: ${scenario.title}`, `MÅL: ${scenario.goal}`, ...prev.log]
    }));
    addToLog("Etterforskningen starter. Mørket senker seg over byen.");
  };

  const saveToRoster = (player: Player) => {
      if (player.isDead) return;
      playStinger('click');
      const newVet: SavedInvestigator = {
          ...player,
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
      const isLastPlayer = prev.activePlayerIndex === prev.players.length - 1;
      let nextIndex = isLastPlayer ? 0 : prev.activePlayerIndex + 1;
      let nextPhase = isLastPlayer ? GamePhase.MYTHOS : GamePhase.INVESTIGATOR;

      if (nextPhase === GamePhase.INVESTIGATOR) {
           // CRITICAL BUG FIX: Ensure nextIndex is within bounds BEFORE checking .isDead
           while (nextIndex < prev.players.length && prev.players[nextIndex].isDead) {
               nextIndex++;
               if (nextIndex >= prev.players.length) {
                   nextIndex = 0;
                   nextPhase = GamePhase.MYTHOS;
                   break;
               }
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

  // --- MENU ACTIONS ---
  const handleStartNewGame = () => {
      setState(DEFAULT_STATE);
      setIsMainMenuOpen(false);
      initAudio();
  };

  const handleContinueGame = () => {
      setIsMainMenuOpen(false);
      initAudio();
  };

  const handleResetData = () => {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ROSTER_KEY);
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

      if (event.effectType === 'sanity') {
          const result = applySanityDamage(player, Math.abs(event.value));
          newPlayers[activePlayerIdx] = result.player;
          if (result.log) addToLog(result.log);
          if (result.sound) playStinger('madness');
      }
      else if (event.effectType === 'health') {
          const dmg = Math.abs(event.value);
          if (dmg > 0) {
              triggerFloatingText(player.position.q, player.position.r, `-${dmg} HP`, 'text-red-500');
              triggerShake();
          }
          const newHp = Math.max(0, Math.min(player.maxHp, player.hp + event.value));
          newPlayers[activePlayerIdx] = { ...player, hp: newHp, isDead: newHp <= 0 };
          if (newHp <= 0) addToLog(`${player.name} har omkommet.`);
      }
      else if (event.effectType === 'insight') {
          newPlayers[activePlayerIdx] = { ...player, insight: Math.max(0, player.insight + event.value) };
          triggerFloatingText(player.position.q, player.position.r, `+${event.value} INSIGHT`, 'text-blue-400');
      }
      else if (event.effectType === 'doom') newDoom = Math.max(0, prev.doom + event.value);
      else if (event.effectType === 'spawn') newEnemies.push({ 
          id: `enemy-${Date.now()}`, name: 'Kultist', type: 'cultist', 
          hp: 2, maxHp: 2, damage: 1, horror: 1, speed: 1, 
          position: { ...player.position }, visionRange: 3, attackRange: 1, attackType: 'melee' 
      });
      
      return { ...prev, players: newPlayers, doom: newDoom, enemies: newEnemies, activeEvent: null };
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
          
          const updatedEnemies = prev.enemies.map(enemy => {
            const alivePlayers = prev.players.filter(p => !p.isDead);
            if (alivePlayers.length === 0) return enemy;
            
            let targetPlayer: Player | null = null;
            let minDist = Infinity;
            
            alivePlayers.forEach(p => {
              const dist = hexDistance(enemy.position, p.position);
              if (dist < minDist) {
                minDist = dist;
                targetPlayer = p;
              }
            });

            const canSee = targetPlayer && hasLineOfSight(enemy.position, targetPlayer.position, prev.board, enemy.visionRange);
            const inRange = minDist <= enemy.attackRange;

            if (targetPlayer && canSee && inRange) {
                return enemy; 
            }

            let bestMove = enemy.position;
            if (targetPlayer) {
                const neighbors = [
                    {q: enemy.position.q + 1, r: enemy.position.r},
                    {q: enemy.position.q - 1, r: enemy.position.r},
                    {q: enemy.position.q, r: enemy.position.r + 1},
                    {q: enemy.position.q, r: enemy.position.r - 1},
                    {q: enemy.position.q + 1, r: enemy.position.r - 1},
                    {q: enemy.position.q - 1, r: enemy.position.r + 1}
                ];

                const validMoves = neighbors.filter(n => {
                   const tile = prev.board.find(t => t.q === n.q && t.r === n.r);
                   return tile && !tile.object?.blocking;
                });

                if (validMoves.length > 0) {
                   validMoves.sort((a, b) => {
                      const distA = hexDistance(a, targetPlayer!.position);
                      const distB = hexDistance(b, targetPlayer!.position);
                      return distA - distB;
                   });
                   bestMove = validMoves[0];
                }
            } else {
              const neighbors = [
                {q: enemy.position.q + 1, r: enemy.position.r}, 
                {q: enemy.position.q - 1, r: enemy.position.r}, 
                {q: enemy.position.q, r: enemy.position.r + 1}, 
                {q: enemy.position.q, r: enemy.position.r - 1}, 
                {q: enemy.position.q + 1, r: enemy.position.r - 1}, 
                {q: enemy.position.q - 1, r: enemy.position.r + 1}
              ];
              const validNeighbors = neighbors.filter(n => prev.board.some(t => t.q === n.q && t.r === n.r && !t.object?.blocking));
              if (validNeighbors.length > 0) {
                  bestMove = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
              }
            }
            return { ...enemy, position: bestMove };
          });

          let updatedPlayers = [...prev.players];
          updatedEnemies.forEach(e => {
            const victimIdx = updatedPlayers.findIndex(p => {
                if (p.isDead) return false;
                const dist = hexDistance(e.position, p.position);
                const los = hasLineOfSight(e.position, p.position, prev.board, e.visionRange);
                return dist <= e.attackRange && los;
            });

            if (victimIdx !== -1) {
              const victim = updatedPlayers[victimIdx];
              if (e.attackType === 'doom') {
                   newDoom = Math.max(0, newDoom - 1);
                   addToLog(`${e.name} kaster en forbannelse! Doom øker.`);
                   triggerFloatingText(e.position.q, e.position.r, "DOOM!", 'text-purple-600');
              } else {
                   const newHp = Math.max(0, victim.hp - e.damage);
                   const sanityResult = applySanityDamage(victim, e.horror);
                   if (e.damage > 0) {
                       triggerFloatingText(victim.position.q, victim.position.r, `-${e.damage} HP`, 'text-red-600');
                       triggerShake();
                   }
                   let finalPlayer = sanityResult.player;
                   finalPlayer.hp = newHp;
                   finalPlayer.isDead = newHp <= 0 || finalPlayer.isDead;
                   updatedPlayers[victimIdx] = finalPlayer;
                   if (e.attackType === 'ranged') addToLog(`${e.name} skyter på ${victim.name}!`);
                   else addToLog(`${e.name} angriper ${victim.name}!`);
                   if (newHp <= 0) addToLog(`${victim.name} har omkommet.`);
                   if (sanityResult.log) addToLog(sanityResult.log);
                   if (sanityResult.sound) playStinger('madness');
              }
            }
          });

          const gateTiles = prev.board.filter(t => t.isGate);
          if (gateTiles.length > 0 && Math.random() > 0.6) {
            const spawnGate = gateTiles[Math.floor(Math.random() * gateTiles.length)];
            const spawnRoll = Math.random();
            let newEnemy: Enemy;
            const base = { id: `enemy-${Date.now()}`, position: { q: spawnGate.q, r: spawnGate.r }, visionRange: 3 };
            if (spawnRoll > 0.9) newEnemy = { ...base, name: 'Dark Young', type: 'dark_young', hp: 6, maxHp: 6, damage: 2, horror: 3, speed: 1, attackRange: 1, attackType: 'melee' };
            else if (spawnRoll > 0.8) newEnemy = { ...base, name: 'Hound of Tindalos', type: 'hound', hp: 4, maxHp: 4, damage: 2, horror: 2, speed: 2, attackRange: 1, attackType: 'melee' };
            else if (spawnRoll > 0.7) newEnemy = { ...base, name: 'Nightgaunt', type: 'nightgaunt', hp: 3, maxHp: 3, damage: 1, horror: 0, speed: 2, attackRange: 1, attackType: 'melee' };
            else if (spawnRoll > 0.6) newEnemy = { ...base, name: 'Mi-Go', type: 'mi-go', hp: 3, maxHp: 3, damage: 1, horror: 1, speed: 1, attackRange: 3, attackType: 'ranged' };
            else if (spawnRoll > 0.5) newEnemy = { ...base, name: 'Dark Priest', type: 'priest', hp: 3, maxHp: 3, damage: 0, horror: 2, speed: 1, attackRange: 2, attackType: 'doom' };
            else if (spawnRoll > 0.4) newEnemy = { ...base, name: 'Sniper', type: 'sniper', hp: 2, maxHp: 2, damage: 1, horror: 0, speed: 1, attackRange: 3, attackType: 'ranged' };
            else newEnemy = { ...base, name: 'Kultist', type: 'cultist', hp: 2, maxHp: 2, damage: 1, horror: 1, speed: 1, attackRange: 1, attackType: 'melee' };
            updatedEnemies.push(newEnemy);
            addToLog(`En ${newEnemy.name} stiger ut av portalen ved ${spawnGate.name}!`);
          }

          const allDead = updatedPlayers.every(p => p.isDead);
          const finalPlayers = updatedPlayers.map(p => {
              if (p.isDead) return { ...p, actions: 0 };
              const baseActions = p.activeMadness?.id === 'm4' ? 1 : 2;
              return { ...p, actions: baseActions };
          });

          return { 
            ...prev, 
            doom: newDoom, 
            round: prev.round + 1, 
            enemies: updatedEnemies, 
            players: finalPlayers, 
            activePlayerIndex: 0,
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
    const getDiceCount = (base: number) => {
        let count = base;
        if (madness === 'm3') count -= 1;
        return Math.max(1, count);
    };

    switch (actionType) {
      case 'move':
        const { q, r } = payload;
        if (q === activePlayer.position.q && r === activePlayer.position.r) return;
        let targetTile = state.board.find(t => t.q === q && t.r === r);
        if (targetTile && targetTile.object?.blocking) {
            playStinger('block');
            addToLog(`Veien er blokkert av ${targetTile.object.type}. Du må fjerne det først.`);
            triggerFloatingText(q, r, "BLOCKED", 'text-amber-500');
            setState(prev => ({ ...prev, selectedTileId: targetTile!.id, selectedEnemyId: null }));
            return;
        }
        if (!targetTile) {
          const tileSet = state.activeScenario?.tileSet || 'mixed';
          let newTileType: 'room' | 'street' = 'street';
          let newTileName = 'Unknown';
          if (tileSet === 'indoor') newTileType = 'room';
          else if (tileSet === 'outdoor') newTileType = 'street';
          else newTileType = Math.random() > 0.5 ? 'room' : 'street';
          const pool = newTileType === 'room' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS;
          newTileName = pool[Math.floor(Math.random() * pool.length)];
          let objectType: TileObjectType | undefined = undefined;
          let isBlocking = false;
          let difficulty = 0;
          let reqSkill: 'strength' | 'insight' | 'agility' | undefined = undefined;
          const rng = Math.random();
          if (newTileType === 'room') {
               if (rng > 0.6) {
                   const obsRng = Math.random();
                   if (obsRng > 0.6) { objectType = 'locked_door'; isBlocking = true; difficulty = 4; reqSkill = 'strength'; }
                   else if (obsRng > 0.3) { objectType = 'rubble'; isBlocking = true; difficulty = 3; reqSkill = 'strength'; }
                   else { objectType = 'barricade'; isBlocking = true; difficulty = 3; reqSkill = 'agility'; }
               } else {
                   const lootRng = Math.random();
                   if (lootRng > 0.7) {
                        const containers: TileObjectType[] = ['bookshelf', 'crate', 'chest', 'cabinet'];
                        objectType = containers[Math.floor(Math.random() * containers.length)];
                        isBlocking = false;
                   }
               }
          }
          const isGate = Math.random() > 0.9;
          const newTile: Tile = { 
            id: `tile-${state.board.length}`, q, r, name: newTileName, type: newTileType, explored: true, searchable: true, searched: false, isGate, 
            object: objectType ? { type: objectType, searched: false, blocking: isBlocking, difficulty, reqSkill } : undefined 
          };
          const event = Math.random() > 0.85 ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null;
          setState(prev => ({ 
            ...prev, 
            board: [...prev.board, newTile], 
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p), 
            activeEvent: event,
            selectedTileId: null
          }));
          generateNarrative(newTile);
        } else {
          setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p), selectedTileId: null }));
          if (targetTile && !targetTile.imageUrl) generateTileVisual(targetTile);
        }
        break;

      case 'interact':
          const selTile = state.board.find(t => t.id === state.selectedTileId);
          if (!selTile || !selTile.object?.blocking) return;
          playStinger('roll');
          const iDice = getDiceCount(2 + (activePlayer.id === 'veteran' && selTile.object.reqSkill === 'strength' ? 1 : 0));
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
        const tEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
        const enemyOnTile = tEnemy && tEnemy.position.q === activePlayer.position.q && tEnemy.position.r === activePlayer.position.r 
          ? tEnemy 
          : state.enemies.find(e => e.position.q === activePlayer.position.q && e.position.r === activePlayer.position.r);

        if (!enemyOnTile) { addToLog("Ingenting å angripe her..."); return; }
        playStinger('combat');
        const atkDice = getDiceCount(2 + (activePlayer.id === 'veteran' ? 1 : 0));
        const aRoll = Array.from({ length: atkDice }, () => Math.floor(Math.random() * 6) + 1);
        const hits = aRoll.filter(v => v >= 4).length;
        if (hits > 0) {
            addToLog(`Du påførte ${hits} skade på ${enemyOnTile.name}!`);
            triggerFloatingText(enemyOnTile.position.q, enemyOnTile.position.r, `-${hits} HP`, 'text-red-500');
        } else {
            addToLog(`Bom!`);
            triggerFloatingText(enemyOnTile.position.q, enemyOnTile.position.r, `MISS`, 'text-slate-400');
        }
        setState(prev => {
            const updatedEnemies = prev.enemies.map(e => {
                if (e.id === enemyOnTile.id) {
                    const remaining = e.hp - hits;
                    if (remaining <= 0) {
                        setTimeout(() => {
                           setState(curr => ({ ...curr, enemies: curr.enemies.filter(en => en.id !== e.id) }));
                           addToLog(`${enemyOnTile.name} ble bekjempet.`);
                           triggerFloatingText(enemyOnTile.position.q, enemyOnTile.position.r, `DEAD`, 'text-red-700 font-bold');
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
                selectedEnemyId: (hits >= enemyOnTile.hp) ? null : prev.selectedEnemyId
            };
        });
        break;
        
      case 'investigate':
        const curTile = state.board.find(t => t.q === activePlayer.position.q && t.r === activePlayer.position.r);
        playStinger('roll');
        const invDice = getDiceCount(2 + (activePlayer.id === 'detective' ? 1 : 0));
        const iRoll = Array.from({ length: invDice }, () => Math.floor(Math.random() * 6) + 1);
        const searchSuccess = iRoll.filter(v => v >= 4).length;
        setState(prev => ({ ...prev, lastDiceRoll: iRoll }));
        if (curTile?.object && !curTile.object.blocking && !curTile.object.searched) {
             if (searchSuccess > 0) {
                 playStinger('search');
                 const rewardRng = Math.random();
                 if (rewardRng > 0.4) {
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
                         players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) 
                     }));
                     addToLog(`Du fant et viktig spor gjemt i ${curTile.object.type}!`);
                     triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `CLUE FOUND!`, 'text-green-400');
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
        const book = activePlayer.inventory.find(i => i.id === 'book');
        if (medKit) {
          playStinger('heal');
          setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { 
              ...p, hp: Math.min(p.maxHp, p.hp + 2), 
              inventory: p.inventory.filter(item => item !== medKit),
              actions: p.actions - 1
            } : p)
          }));
          addToLog("Du brukte et medisinsk skrin.");
          triggerFloatingText(activePlayer.position.q, activePlayer.position.r, `+2 HP`, 'text-green-500');
        } else if (book) {
           setState(prev => {
               const player = prev.players[prev.activePlayerIndex];
               if (!player) return prev;
               const sanResult = applySanityDamage(player, 1);
               const newP = sanResult.player;
               newP.insight += 3;
               newP.inventory = newP.inventory.filter(i => i !== book);
               newP.actions -= 1;
               if (sanResult.log) addToLog(sanResult.log);
               if (sanResult.sound) playStinger('madness');
               addToLog("Du leste Necronomicon. Kunnskapen brenner...");
               return { ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? newP : p) };
           });
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
      if (!tile || !tile.object?.blocking) return null;
      if (hexDistance(activePlayer.position, tile) > 1) return null;
      const obj = tile.object;
      let label = 'Interact';
      if (obj.type === 'locked_door') label = 'Break Down Door';
      if (obj.type === 'rubble') label = 'Clear Rubble';
      if (obj.type === 'barricade') label = 'Dismantle';
      return { id: 'interact-blocker', label, iconType: obj.reqSkill || 'strength', difficulty: obj.difficulty || 3 };
  };
  const currentContextAction = getContextAction();

  const activeMadnessClass = activePlayer?.activeMadness?.visualClass || '';
  const shakeClass = state.screenShake ? 'animate-shake' : '';
  const canContinue = state.phase !== GamePhase.SETUP && state.phase !== GamePhase.GAME_OVER && state.players.length > 0;

  if (isMainMenuOpen) {
      return (
        <>
            <MainMenu onNewGame={handleStartNewGame} onContinue={handleContinueGame} onOptions={() => setShowOptions(true)} canContinue={canContinue} version={APP_VERSION} />
            {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} onResetData={handleResetData} />}
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
                          <input type="text" value={selectedPlayer.name} onChange={(e) => updatePlayerName(key, e.target.value, false)} onClick={(e) => e.stopPropagation()} className="bg-transparent border-b border-[#e94560] text-[#e94560] text-xl font-bold uppercase tracking-tight w-full focus:outline-none placeholder-slate-700" />
                          <Edit2 size={12} className="text-slate-600" />
                        </div>
                      ) : (
                        <div className={`text-xl font-bold uppercase tracking-tight text-slate-100`}>{CHARACTERS[key].name}</div>
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
                                    <input type="text" value={selectedPlayer.name} onChange={(e) => updatePlayerName(vet.instanceId!, e.target.value, true)} onClick={(e) => e.stopPropagation()} className="bg-transparent border-b border-amber-500 text-amber-400 text-xl font-bold uppercase tracking-tight w-full focus:outline-none placeholder-amber-900/50 mr-2" />
                                  ) : (
                                    <div className={`text-xl font-bold uppercase tracking-tight ${isSelected ? 'text-amber-400' : 'text-amber-100/80'}`}>{vet.name}</div>
                                  )}
                                  <Trash2 size={14} className="text-slate-600 hover:text-red-500 z-20" onClick={(e) => { e.stopPropagation(); deleteVeteran(vet.instanceId!); }} />
                              </div>
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-amber-500 uppercase tracking-widest"><Star size={10} /><span>Survived: {vet.scenariosSurvived}</span></div>
                              <div className="flex gap-4 border-t border-amber-900/30 mt-4 pt-3 text-sm font-bold">
                                <div className="flex items-center gap-1 text-red-400"><Skull size={12} /> {vet.hp}</div>
                                <div className="flex items-center gap-1 text-purple-400"><RotateCcw size={12} /> {vet.sanity}</div>
                              </div>
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
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${activeMadnessClass} ${shakeClass}`}>
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] opacity-60"></div>
      
      <GameBoard tiles={state.board} players={state.players} enemies={state.enemies} selectedEnemyId={state.selectedEnemyId} onTileClick={(q, r) => handleAction('move', { q, r })} onEnemyClick={(id) => handleEnemyInteraction(id, 'click')} onEnemyHover={(id) => handleEnemyInteraction(id, 'hover')} enemySightMap={enemySightMap} floatingTexts={state.floatingTexts} />

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
          <button onClick={handleResetGame} className="text-slate-500 hover:text-[#e94560]"><RotateCcw size={18}/></button>
      </header>

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
          <ActionBar onAction={handleAction} actionsRemaining={activePlayer?.isDead ? 0 : (activePlayer?.actions ?? 0)} isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} contextAction={currentContextAction} />
          <div className="w-px h-12 bg-slate-800 mx-2"></div>
          <button onClick={handleEndTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold hover:bg-[#c9354d] transition-all flex items-center gap-3 uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.3)] group">
            {state.activePlayerIndex === state.players.length - 1 ? "AVSLUTT RUNDEN" : "NESTE TUR"} 
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

      {state.lastDiceRoll && <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none"><DiceRoller values={state.lastDiceRoll} onComplete={() => setState(prev => ({ ...prev, lastDiceRoll: null }))} /></div>}
      {state.activeEvent && <EventModal event={state.activeEvent} onResolve={handleResolveEvent} />}

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
