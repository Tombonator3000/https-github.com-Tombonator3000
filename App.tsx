
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
  Brain
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, Madness, ContextAction } from './types';
import { CHARACTERS, ITEMS, START_TILE, EVENTS, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, SCENARIOS, MADNESS_CONDITIONS } from './constants';
import GameBoard from './components/GameBoard';
import CharacterPanel from './components/CharacterPanel';
import EnemyPanel from './components/EnemyPanel';
import ActionBar from './components/ActionBar';
import DiceRoller from './components/DiceRoller';
import EventModal from './components/EventModal';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
  // Check if every point in the line exists in the board array AND is not blocking sight (could add 'sightBlocking' later)
  // For now, assume walls (implied by missing tiles) block sight.
  return line.every(point => board.some(t => t.q === point.q && t.r === point.r));
};
// ------------------------

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...parsed, hoveredEnemyId: null };
      } catch (e) {
        console.error("Failed to load save", e);
      }
    }
    return {
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
      activeScenario: null
    };
  });

  const [hoveredEnemyId, setHoveredEnemyId] = useState<string | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);

  const audioInit = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const initAudio = async () => {
    if (audioInit.current) return;
    await Tone.start();
    audioInit.current = true;
    const pad = new Tone.PolySynth(Tone.Synth, { oscillator: { type: 'sine' }, envelope: { attack: 4, release: 4 } }).toDestination();
    pad.set({ volume: -28 });
    new Tone.LFO(0.05, 100, 300).connect(pad.frequency).start();
    new Tone.Loop(time => { pad.triggerAttackRelease(['G1', 'D2', 'Bb2'], '2n', time); }, '1n').start(0);
    Tone.getTransport().start();
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

  // --- LOGIC: SANITY & MADNESS ---
  const applySanityDamage = (player: Player, amount: number): { player: Player, log?: string, sound?: 'madness' } => {
    if (player.isDead) return { player };

    let newSanity = player.sanity - amount;
    let logMsg = '';
    let sound: 'madness' | undefined = undefined;
    let updatedPlayer = { ...player };

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
        }
    } else {
        updatedPlayer.sanity = newSanity;
    }

    return { player: updatedPlayer, log: logMsg, sound };
  };

  const generateNarrative = async (tile: Tile) => {
    if (!process.env.API_KEY) return;
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
      const existing = prev.players.find(p => p.id === type);
      if (existing) return { ...prev, players: prev.players.filter(p => p.id !== type) };
      if (prev.players.length >= 4) return prev;
      const char = CHARACTERS[type];
      const newPlayer: Player = { ...char, position: { q: 0, r: 0 }, inventory: [], actions: 2, isDead: false, madness: [], activeMadness: null };
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  };

  const startGame = () => {
    if (state.players.length === 0 || !state.activeScenario) return;
    initAudio();
    const scenario = state.activeScenario;
    const startTile: Tile = { ...START_TILE, name: scenario.startLocation };
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

  const handleEndTurn = () => {
    playStinger('click');
    setState(prev => {
      const isLastPlayer = prev.activePlayerIndex === prev.players.length - 1;
      return { 
        ...prev, 
        activePlayerIndex: isLastPlayer ? 0 : prev.activePlayerIndex + 1, 
        phase: isLastPlayer ? GamePhase.MYTHOS : GamePhase.INVESTIGATOR,
        selectedEnemyId: null,
        selectedTileId: null
      };
    });
  };

  const handleResolveEvent = useCallback(() => {
    if (!state.activeEvent) return;
    const event = state.activeEvent;
    setState(prev => {
      const activePlayer = prev.players[prev.activePlayerIndex];
      const newPlayers = [...prev.players];
      let newDoom = prev.doom;
      const newEnemies = [...prev.enemies];

      if (event.effectType === 'sanity') {
          const result = applySanityDamage(activePlayer, Math.abs(event.value));
          newPlayers[prev.activePlayerIndex] = result.player;
          if (result.log) addToLog(result.log);
          if (result.sound) playStinger('madness');
      }
      else if (event.effectType === 'health') {
          const newHp = Math.max(0, Math.min(activePlayer.maxHp, activePlayer.hp + event.value));
          newPlayers[prev.activePlayerIndex] = { ...activePlayer, hp: newHp, isDead: newHp <= 0 };
          if (newHp <= 0) addToLog(`${activePlayer.name} har omkommet.`);
      }
      else if (event.effectType === 'insight') newPlayers[prev.activePlayerIndex] = { ...activePlayer, insight: Math.max(0, activePlayer.insight + event.value) };
      else if (event.effectType === 'doom') newDoom = Math.max(0, prev.doom + event.value);
      else if (event.effectType === 'spawn') newEnemies.push({ id: `enemy-${Date.now()}`, name: 'Kultist', type: 'cultist', hp: 2, maxHp: 2, damage: 1, horror: 1, speed: 1, position: { ...activePlayer.position }, visionRange: 3 });
      
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
          const newDoom = prev.doom - 1;
          
          const updatedEnemies = prev.enemies.map(enemy => {
            const alivePlayers = prev.players.filter(p => !p.isDead);
            if (alivePlayers.length === 0) return enemy;
            let targetPlayer: Player | null = null;
            let minDist = Infinity;
            alivePlayers.forEach(p => {
              const dist = hexDistance(enemy.position, p.position);
              if (hasLineOfSight(enemy.position, p.position, prev.board, enemy.visionRange)) {
                if (dist < minDist) {
                  minDist = dist;
                  targetPlayer = p;
                }
              }
            });

            let newQ = enemy.position.q;
            let newR = enemy.position.r;

            if (targetPlayer) {
              if (targetPlayer.position.q > enemy.position.q) newQ++; else if (targetPlayer.position.q < enemy.position.q) newQ--;
              if (targetPlayer.position.r > enemy.position.r) newR++; else if (targetPlayer.position.r < enemy.position.r) newR--;
            } else {
              const neighbors = [{q: newQ+1, r: newR}, {q: newQ-1, r: newR}, {q: newQ, r: newR+1}, {q: newQ, r: newR-1}, {q: newQ+1, r: newR-1}, {q: newQ-1, r: newR+1}];
              const validNeighbors = neighbors.filter(n => prev.board.some(t => t.q === n.q && t.r === n.r && !t.object?.blocking));
              if (validNeighbors.length > 0) {
                  const randomMove = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
                  newQ = randomMove.q;
                  newR = randomMove.r;
              }
            }
            return { ...enemy, position: { q: newQ, r: newR } };
          });

          let updatedPlayers = [...prev.players];
          updatedEnemies.forEach(e => {
            const pIdx = updatedPlayers.findIndex(p => p.position.q === e.position.q && p.position.r === e.position.r && !p.isDead);
            if (pIdx !== -1) {
              const victim = updatedPlayers[pIdx];
              const newHp = Math.max(0, victim.hp - e.damage);
              const sanityResult = applySanityDamage(victim, e.horror);
              let finalPlayer = sanityResult.player;
              finalPlayer.hp = newHp;
              finalPlayer.isDead = newHp <= 0 || finalPlayer.isDead;
              updatedPlayers[pIdx] = finalPlayer;
              addToLog(`${e.name} angriper ${victim.name}! Tap: ${e.damage} HP, ${e.horror} Sanity.`);
              if (newHp <= 0) addToLog(`${victim.name} har blitt revet i stykker.`);
              if (sanityResult.log) addToLog(sanityResult.log);
              if (sanityResult.sound) playStinger('madness');
            }
          });

          const gateTiles = prev.board.filter(t => t.isGate);
          if (gateTiles.length > 0 && Math.random() > 0.6) {
            const spawnGate = gateTiles[Math.floor(Math.random() * gateTiles.length)];
            updatedEnemies.push({ id: `enemy-${Date.now()}`, name: 'Kultist', type: 'cultist', hp: 2, maxHp: 2, damage: 1, horror: 1, speed: 1, position: { q: spawnGate.q, r: spawnGate.r }, visionRange: 3 });
            addToLog(`En skikkelse stiger ut av portalen ved ${spawnGate.name}!`);
          }

          const allDead = updatedPlayers.every(p => p.isDead);
          return { 
            ...prev, 
            doom: newDoom, 
            round: prev.round + 1, 
            enemies: updatedEnemies, 
            players: updatedPlayers.map(p => ({ ...p, actions: p.isDead ? 0 : 2 })), 
            phase: (newDoom <= 0 || allDead) ? GamePhase.GAME_OVER : GamePhase.INVESTIGATOR 
          };
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  const activePlayer = state.players[state.activePlayerIndex] || state.players[0];

  const handleAction = (actionType: string, payload?: any) => {
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    
    switch (actionType) {
      case 'move':
        const { q, r } = payload;
        
        // Cannot move to self
        if (q === activePlayer.position.q && r === activePlayer.position.r) return;

        let targetTile = state.board.find(t => t.q === q && t.r === r);
        
        // CHECK BLOCKED
        if (targetTile && targetTile.object?.blocking) {
            playStinger('block');
            addToLog(`Veien er blokkert av ${targetTile.object.type}. Du må fjerne det først.`);
            setState(prev => ({ ...prev, selectedTileId: targetTile!.id, selectedEnemyId: null }));
            return;
        }

        if (!targetTile) {
          // --- GENERATION LOGIC ---
          const tileSet = state.activeScenario?.tileSet || 'mixed';
          let newTileType: 'room' | 'street' = 'street';
          let newTileName = 'Unknown';

          // Determine Type
          if (tileSet === 'indoor') newTileType = 'room';
          else if (tileSet === 'outdoor') newTileType = 'street';
          else newTileType = Math.random() > 0.5 ? 'room' : 'street';

          // Naming
          const pool = newTileType === 'room' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS;
          newTileName = pool[Math.floor(Math.random() * pool.length)];

          // Generation Obstacles (The Dungeon Crawl Logic)
          let objectType: TileObjectType | undefined = undefined;
          let isBlocking = false;
          let difficulty = 0;
          let reqSkill: 'strength' | 'insight' | 'agility' | undefined = undefined;

          const rng = Math.random();
          if (newTileType === 'room') {
               // 40% chance of obstacle indoors
               if (rng > 0.6) {
                   const obsRng = Math.random();
                   if (obsRng > 0.6) {
                       objectType = 'locked_door'; isBlocking = true; difficulty = 4; reqSkill = 'strength';
                   } else if (obsRng > 0.3) {
                       objectType = 'rubble'; isBlocking = true; difficulty = 3; reqSkill = 'strength';
                   } else {
                       objectType = 'barricade'; isBlocking = true; difficulty = 3; reqSkill = 'agility';
                   }
               } else if (rng < 0.2) {
                   objectType = 'bookshelf'; // Searchable
               }
          }

          const isGate = Math.random() > 0.9;
          
          const newTile: Tile = { 
            id: `tile-${state.board.length}`, 
            q, r, 
            name: newTileName, 
            type: newTileType, 
            explored: true, 
            searchable: true, 
            searched: false, 
            isGate, 
            object: objectType ? { 
                type: objectType, 
                searched: false, 
                blocking: isBlocking, 
                difficulty, 
                reqSkill 
            } : undefined 
          };
          
          const eventTrigger = Math.random() > 0.85;
          const event = eventTrigger ? EVENTS[Math.floor(Math.random() * EVENTS.length)] : null;
          
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
        }
        break;

      case 'interact':
          // Perform contextual skill check
          const selectedTile = state.board.find(t => t.id === state.selectedTileId);
          if (!selectedTile || !selectedTile.object?.blocking) return;

          playStinger('roll');
          const skillRoll = Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1); // Base 2 dice
          // Bonus dice based on character? For now, simplifying:
          if (activePlayer.id === 'veteran' && selectedTile.object.reqSkill === 'strength') skillRoll.push(Math.floor(Math.random() * 6) + 1);
          if (activePlayer.id === 'professor' && selectedTile.object.reqSkill === 'insight') skillRoll.push(Math.floor(Math.random() * 6) + 1);

          const total = skillRoll.reduce((a, b) => a + b, 0); // Sum or successes? Using simple sum vs difficulty for now? 
          // Actually, let's stick to Success count (4,5,6) to be consistent with combat.
          // Difficulty 3 = needs 1 success. Difficulty 4 = needs 1 success but harder?
          // Let's redefine difficulty: Difficulty is target number.
          
          const successes = skillRoll.filter(v => v >= 4).length;
          const requiredSuccesses = 1; // Simplify: Always need 1 success to clear for now.

          setState(prev => ({ ...prev, lastDiceRoll: skillRoll }));

          if (successes >= requiredSuccesses) {
              playStinger('click');
              addToLog(`Suksess! ${activePlayer.name} fjernet ${selectedTile.object.type}.`);
              setState(prev => ({
                  ...prev,
                  board: prev.board.map(t => t.id === selectedTile.id ? { ...t, object: undefined } : t),
                  players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                  selectedTileId: null
              }));
          } else {
              addToLog(`Mislyktes. ${selectedTile.object.type} står fortsatt.`);
              setState(prev => ({
                  ...prev,
                  players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p)
              }));
          }
          break;

      case 'attack':
        const targetEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
        const enemyOnTile = targetEnemy && targetEnemy.position.q === activePlayer.position.q && targetEnemy.position.r === activePlayer.position.r 
          ? targetEnemy 
          : state.enemies.find(e => e.position.q === activePlayer.position.q && e.position.r === activePlayer.position.r);

        if (!enemyOnTile) { addToLog("Ingenting å angripe her..."); return; }
        playStinger('combat');
        const roll = Array.from({ length: 2 }, () => Math.floor(Math.random() * 6) + 1);
        const hits = roll.filter(v => v >= 4).length;
        setState(prev => ({ 
          ...prev, 
          lastDiceRoll: roll, 
          enemies: prev.enemies.map(e => e.id === enemyOnTile.id ? { ...e, hp: e.hp - hits } : e).filter(e => e.hp > 0), 
          players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
          selectedEnemyId: hits >= enemyOnTile.hp ? null : prev.selectedEnemyId
        }));
        if (hits > 0) addToLog(`Du påførte ${hits} skade på ${enemyOnTile.name}!`); else addToLog(`Bom!`);
        break;
      case 'investigate':
        const currentTile = state.board.find(t => t.q === activePlayer.position.q && t.r === activePlayer.position.r);
        playStinger('roll');
        const iRoll = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        const searchSuccesses = iRoll.filter(v => v >= 4).length;
        setState(prev => ({ ...prev, lastDiceRoll: iRoll }));
        if (searchSuccesses > 0) {
          if (currentTile?.object && !currentTile.object.searched && !currentTile.object.blocking) {
            playStinger('search');
            const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            setState(prev => ({ ...prev, board: prev.board.map(t => t.id === currentTile.id ? { ...t, object: { ...t.object!, searched: true } } : t), players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, inventory: [...p.inventory, item], actions: p.actions - 1 } : p) }));
            addToLog(`Du fant ${item.name}!`);
          } else if (Math.random() > 0.7) {
            setState(prev => ({ ...prev, cluesFound: prev.cluesFound + 1, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
            addToLog("Et spor!");
          } else {
            addToLog("Ingenting her.");
            setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
          }
        } else {
          addToLog("Du overså noe.");
          setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p) }));
        }
        break;
      case 'rest':
        setState(prev => ({ ...prev, players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, hp: Math.min(p.maxHp, p.hp + 1), sanity: Math.min(p.maxSanity, p.sanity + 1), actions: p.actions - 1 } : p) }));
        addToLog(`${activePlayer.name} hviler.`);
        break;
      case 'item':
        const medKit = activePlayer.inventory.find(i => i.id === 'med');
        const book = activePlayer.inventory.find(i => i.id === 'book');
        
        if (medKit) {
          playStinger('heal');
          setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { 
              ...p, 
              hp: Math.min(p.maxHp, p.hp + 2), 
              inventory: p.inventory.filter(item => item !== medKit),
              actions: p.actions - 1
            } : p)
          }));
          addToLog("Du brukte et medisinsk skrin.");
        } else if (book) {
           setState(prev => {
               const active = prev.players[prev.activePlayerIndex];
               const sanResult = applySanityDamage(active, 1);
               const newP = sanResult.player;
               newP.insight += 3;
               newP.inventory = newP.inventory.filter(i => i !== book);
               newP.actions -= 1;
               
               if (sanResult.log) addToLog(sanResult.log);
               if (sanResult.sound) playStinger('madness');
               addToLog("Du leste Necronomicon. Kunnskapen brenner...");
               
               return {
                   ...prev,
                   players: prev.players.map((p, i) => i === prev.activePlayerIndex ? newP : p)
               };
           });
        } else {
          addToLog("Ingen brukbare gjenstander akkurat nå.");
        }
        break;
    }
  };

  const handleEnemyInteraction = (id: string | null, type: 'click' | 'hover') => {
    if (type === 'click') {
      playStinger('click');
      setState(prev => ({ ...prev, selectedEnemyId: prev.selectedEnemyId === id ? null : id, selectedTileId: null }));
    } else {
      setHoveredEnemyId(id);
    }
  };

  const resetGame = () => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); };

  // --- FOV CALCULATION FOR VISUALS ---
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

  // --- CONTEXT ACTION CALCULATION ---
  const getContextAction = (): ContextAction | null => {
      if (!state.selectedTileId) return null;
      const tile = state.board.find(t => t.id === state.selectedTileId);
      if (!tile || !tile.object?.blocking) return null;
      
      // Is neighbor?
      const dist = hexDistance(activePlayer.position, tile);
      if (dist > 1) return null;

      const obj = tile.object;
      let label = 'Interact';
      if (obj.type === 'locked_door') label = 'Break Down Door';
      if (obj.type === 'rubble') label = 'Clear Rubble';
      if (obj.type === 'barricade') label = 'Dismantle';

      return {
          id: 'interact-blocker',
          label,
          iconType: obj.reqSkill || 'strength',
          difficulty: obj.difficulty || 3
      };
  };
  const currentContextAction = getContextAction();
  // -----------------------------------

  // Apply Madness Visuals to active player
  const activeMadnessClass = activePlayer?.activeMadness?.visualClass || '';
  
  if (state.phase === GamePhase.SETUP) {
    // SCENARIO SELECTION SCREEN
    if (!state.activeScenario) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#05050a] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
                <div className="bg-[#16213e]/95 p-12 rounded border-2 border-[#e94560] shadow-[0_0_80px_rgba(233,69,96,0.3)] max-w-5xl w-full backdrop-blur-md relative z-10 animate-in fade-in zoom-in duration-1000">
                    <h1 className="text-6xl text-[#e94560] mb-8 font-display italic tracking-tighter uppercase text-center">Case Files</h1>
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
                                    
                                    <div className="space-y-2 border-t border-slate-800 pt-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Skull size={14} className="text-[#e94560]" />
                                            <span>Starts at <strong className="text-slate-300">{scenario.startDoom} Doom</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Target size={14} className="text-purple-500" />
                                            <span>Requires <strong className="text-slate-300">{scenario.cluesRequired} Clues</strong></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <ScrollText size={14} className="text-amber-500" />
                                            <span>Start: <strong className="text-slate-300">{scenario.startLocation}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    // CHARACTER SELECTION SCREEN
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-[#05050a] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')] opacity-20"></div>
        <div className="bg-[#16213e]/95 p-12 rounded border-2 border-[#e94560] shadow-[0_0_80px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center backdrop-blur-md relative z-10 animate-in fade-in slide-in-from-right duration-500">
          <div className="flex items-center justify-between mb-6">
              <button onClick={() => setState(prev => ({...prev, activeScenario: null, players: []}))} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest">
                  <ArrowLeft size={16} /> Change Case
              </button>
              <div className="text-[#e94560] font-display text-2xl uppercase tracking-widest">{state.activeScenario.title}</div>
              <div className="w-20"></div> {/* Spacer */}
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-[#e94560] to-transparent w-full mb-6"></div>
          <p className="text-xl mb-12 text-slate-400 italic font-serif tracking-widest uppercase">Select your team (1-4 investigators)</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
            {(Object.keys(CHARACTERS) as CharacterType[]).map(key => {
              const isSelected = state.players.some(p => p.id === key);
              return (
                <button key={key} onClick={() => toggleCharacterSelection(key)} className={`group p-5 bg-[#0a0a1a] border-2 transition-all text-left relative overflow-hidden ${isSelected ? 'border-[#e94560] shadow-[0_0_20px_rgba(233,69,96,0.2)]' : 'border-slate-800 hover:border-slate-600'}`}>
                  <div className={`text-xl font-bold uppercase tracking-tight ${isSelected ? 'text-[#e94560]' : 'text-slate-100'}`}>{CHARACTERS[key].name}</div>
                  <div className="text-[9px] text-slate-500 mt-2 uppercase tracking-[0.2em] leading-tight font-sans h-8">{CHARACTERS[key].special}</div>
                  <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1 text-red-500 font-bold"><Skull size={12} /> {CHARACTERS[key].hp}</div>
                    <div className="flex items-center gap-1 text-purple-500 font-bold"><RotateCcw size={12} /> {CHARACTERS[key].sanity}</div>
                  </div>
                  {isSelected && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#e94560] animate-pulse"></div>}
                </button>
              );
            })}
          </div>
          <button disabled={state.players.length === 0} onClick={startGame} className={`px-20 py-6 rounded-none font-display text-3xl italic tracking-[0.3em] transition-all uppercase border-2 ${state.players.length > 0 ? 'bg-[#e94560] border-white text-white hover:scale-105 shadow-[0_0_40px_rgba(233,69,96,0.5)]' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'}`}>BEGIN INVESTIGATION</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${activeMadnessClass}`}>
      <div className="absolute inset-0 pointer-events-none z-50 shadow-[inset_0_0_200px_rgba(0,0,0,0.9)] opacity-60"></div>
      <div className="absolute inset-0 pointer-events-none z-50 bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] mix-blend-overlay opacity-10"></div>

      <GameBoard 
        tiles={state.board} 
        players={state.players} 
        enemies={state.enemies} 
        selectedEnemyId={state.selectedEnemyId}
        onTileClick={(q, r) => handleAction('move', { q, r })} 
        onEnemyClick={(id) => handleEnemyInteraction(id, 'click')}
        onEnemyHover={(id) => handleEnemyInteraction(id, 'hover')}
        enemySightMap={enemySightMap}
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
          <button onClick={resetGame} className="text-slate-500 hover:text-[#e94560] transition-colors"><RotateCcw size={18}/></button>
      </header>

      <div className={`fixed left-4 top-20 bottom-24 transition-all duration-500 z-40 ${leftPanelCollapsed ? 'w-12 overflow-hidden' : 'w-80'}`}>
        <div className="h-full bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 rounded shadow-2xl flex flex-col relative">
          <button onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)} className="absolute top-2 right-2 text-slate-500 hover:text-white z-50 p-1">
            {leftPanelCollapsed ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
          </button>
          {!leftPanelCollapsed && (
            <div className="flex-1 flex flex-col overflow-hidden">
               <CharacterPanel player={activePlayer} />
               <div className="p-6 border-t border-slate-800 overflow-y-auto">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] font-sans flex items-center gap-2">
                  <Sword size={12} className="text-[#e94560]" /> UTSTYR
                </h3>
                <div className="space-y-3">
                  {activePlayer.inventory.length === 0 ? (
                    <p className="text-[10px] italic text-slate-600 text-center py-4 border border-dashed border-slate-800">Lommene er tomme...</p>
                  ) : (
                    activePlayer.inventory.map((item, idx) => (
                      <div key={idx} className="p-3 bg-white/5 border border-slate-800 rounded group hover:border-[#e94560]/40 transition-all">
                        <div className="font-bold text-slate-200 text-xs flex justify-between uppercase">
                          {item.name}
                          <span className="text-[8px] text-[#e94560]">{item.type}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">"{item.effect}"</div>
                      </div>
                    ))
                  )}
                </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className={`fixed right-4 top-20 bottom-24 transition-all duration-500 z-40 ${rightPanelCollapsed ? 'w-12' : 'w-80'}`}>
        <div className="h-full flex flex-col gap-4">
          {displayEnemy && !rightPanelCollapsed && (
            <EnemyPanel 
              enemy={displayEnemy} 
              onClose={() => setState(prev => ({ ...prev, selectedEnemyId: null }))}
            />
          )}
          <div className="flex-1 bg-[#0a0a1a]/90 backdrop-blur-2xl border-2 border-[#e94560]/20 rounded shadow-2xl flex flex-col relative overflow-hidden">
            <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="absolute top-2 left-2 text-slate-500 hover:text-white z-50 p-1">
              {rightPanelCollapsed ? <Maximize2 size={16}/> : <Minimize2 size={16}/>}
            </button>
            {!rightPanelCollapsed && (
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-slate-800 bg-black/40 flex items-center gap-2">
                   <ScrollText size={14} className="text-[#e94560]"/>
                   <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] font-sans">DOKUMENTERTE HENDELSER</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4 font-serif italic text-[12px] leading-relaxed">
                   {state.log.map((entry, idx) => (
                     <div key={idx} className={`${idx === 0 ? 'text-white border-l-2 border-[#e94560] pl-3 py-1 bg-[#e94560]/5' : 'text-slate-500'} animate-in fade-in duration-500`}>
                       {entry}
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
        <div className="bg-[#16213e]/90 backdrop-blur-xl border-2 border-[#e94560]/40 p-3 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] flex items-center gap-4">
          <ActionBar 
            onAction={handleAction} 
            actionsRemaining={activePlayer.isDead ? 0 : activePlayer.actions} 
            isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
            contextAction={currentContextAction}
          />
          <div className="w-px h-12 bg-slate-800 mx-2"></div>
          <button onClick={handleEndTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold hover:bg-[#c9354d] transition-all flex items-center gap-3 uppercase text-[10px] tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(233,69,96,0.3)] group">
            {state.activePlayerIndex === state.players.length - 1 ? "AVSLUTT RUNDEN" : "NESTE TUR"} 
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </footer>

      {state.lastDiceRoll && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
          <DiceRoller values={state.lastDiceRoll} onComplete={() => setState(prev => ({ ...prev, lastDiceRoll: null }))} />
        </div>
      )}

      {state.activeEvent && ( <EventModal event={state.activeEvent} onResolve={handleResolveEvent} /> )}

      {state.phase === GamePhase.GAME_OVER && (
        <div className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl">
           <div className="text-center max-w-2xl">
             <h2 className="text-9xl font-display text-[#e94560] italic mb-10 uppercase tracking-tighter">FINIS</h2>
             <p className="text-xl text-slate-400 mb-16 italic leading-relaxed font-serif px-10">
               {state.cluesFound >= requiredClues ? "Portalen er forseglet. Skyggene trekker seg tilbake..." : state.players.every(p => p.isDead) ? "Alle etterforskere er tapt. Mørket har seiret." : "Tiden rant ut. Dommedag er her."}
             </p>
             <button onClick={resetGame} className="px-16 py-5 border-2 border-[#e94560] text-[#e94560] font-bold hover:bg-[#e94560] hover:text-white transition-all text-sm uppercase tracking-[0.4em]">AVSLUTT</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
