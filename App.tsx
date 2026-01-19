
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Skull, ChevronRight, ChevronLeft, RotateCcw, Minimize2, ScrollText, Target, FolderOpen, 
  ArrowLeft, Users, Star, Trash2, Edit2, ShoppingBag, Book, CloudFog, Zap, 
  User, Save, MapPin, CheckCircle, HelpCircle, FileText, History, Heart, Brain, Settings, Edit3,
  Hammer, Wind, Lock, Flame
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, ContextAction, SavedInvestigator, Item, Spell, Trait, GameSettings, ScenarioStep, DoomEvent, EnemyType, VictoryType, FloatingText, Madness } from './types';
import { CHARACTERS, ITEMS, START_TILE, EVENTS, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, SCENARIOS, MADNESS_CONDITIONS, SPELLS, BESTIARY, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS, TRAIT_POOL, LOCATION_DESCRIPTIONS } from './constants';
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
import { loadAssetLibrary, saveAssetLibrary, generateLocationAsset, AssetLibrary, getCharacterVisual, getEnemyVisual } from './utils/AssetLibrary';
import { loadSettings, DEFAULT_SETTINGS } from './utils/Settings';
import { hexDistance, findPath, hasLineOfSight } from './utils/hexUtils';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const APP_VERSION = "3.10.24"; 

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
    activeSpell: null,
    currentStepIndex: 0,
    questItemsCollected: []
};

const ROOM_SHAPES = {
    SMALL: [{q:0, r:0}],
    MEDIUM: [{q:0, r:0}, {q:1, r:0}, {q:0, r:1}, {q:1, r:-1}],
    LARGE: [{q:0, r:0}, {q:1, r:0}, {q:0, r:1}, {q:1, r:-1}, {q:-1, r:0}, {q:0, r:-1}, {q:-1, r:1}],
    LINEAR: [{q:0, r:0}, {q:1, r:0}, {q:2, r:0}]
};

const formatLogEntry = (entry: string) => {
    const keywords = [
        { regex: /(skade|damage)/gi, color: 'text-red-400 font-bold' },
        { regex: /(død|dead|die|beseiret|overvant)/gi, color: 'text-red-600 font-black uppercase' },
        { regex: /(sanity|sinnslidelse|madness|galskap)/gi, color: 'text-purple-400 font-bold' },
        { regex: /(insight|clue|hint)/gi, color: 'text-blue-400 font-bold' },
        { regex: /(heal|hp|liv)/gi, color: 'text-green-400 font-bold' },
        { regex: /(suksess|success|unlocked|klarte|traff)/gi, color: 'text-green-300 font-bold uppercase' },
        { regex: /(failed|mislyktes|bommet)/gi, color: 'text-orange-400 font-bold' },
        { regex: /(item|gjenstand|found)/gi, color: 'text-amber-400 font-bold' },
        { regex: /(doom|dommedag)/gi, color: 'text-[#e94560] font-black uppercase' },
        { regex: /(ENTERED:|LOCATION:|ROOM:)/gi, color: 'text-[#eecfa1] font-bold tracking-widest' },
        { regex: /(VISIBLE|SIGHT|EYES)/gi, color: 'text-red-300 font-bold' },
        { regex: /(SPELL|MAGI|ARCANE|GRIMOIRE)/gi, color: 'text-purple-300 font-bold' },
        { regex: /(NARRATIVE:)/gi, color: 'text-amber-200 italic font-medium' }
    ];

    const parts = entry.split(/(\s+)/);
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
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
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
        return { ...parsed, hoveredEnemyId: null, floatingTexts: [], screenShake: false, activeSpell: null };
      } catch (e) { console.error(e); }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => { setGameSettings(loadSettings()); }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const generateNarrative = async (context: string) => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a short, chilling 1920s Lovecraftian horror flavor text for: ${context}. Keep it under 15 words.`,
        });
        if (response.text) {
            addToLog(`NARRATIVE: ${response.text}`);
        }
    } catch (e) {
        console.warn("Narrative generation failed", e);
    }
  };

  // Mythos Phase Controller (Active Monster AI & Combat)
  useEffect(() => {
    if (state.phase === GamePhase.MYTHOS) {
        addToLog("The Mythos awakens. Ancient gears turn in the darkness.");
        
        const processEnemyAI = async () => {
            let updatedEnemies = [...state.enemies];
            let updatedPlayers = [...state.players];

            for (let i = 0; i < updatedEnemies.length; i++) {
                const enemy = updatedEnemies[i];
                const alivePlayers = updatedPlayers.filter(p => !p.isDead);
                if (alivePlayers.length === 0) continue;

                const nearestPlayer = alivePlayers.sort((a, b) => 
                    hexDistance(enemy.position, a.position) - hexDistance(enemy.position, b.position)
                )[0];

                const dist = hexDistance(enemy.position, nearestPlayer.position);

                if (dist <= enemy.attackRange) {
                    addToLog(`The ${enemy.name} strikes ${nearestPlayer.name}!`);
                    addFloatingText(nearestPlayer.position.q, nearestPlayer.position.r, `-${enemy.damage} HP`, "text-red-500");
                    if (enemy.horror > 0) addFloatingText(nearestPlayer.position.q, nearestPlayer.position.r, `-${enemy.horror} SAN`, "text-purple-500");
                    triggerScreenShake();

                    updatedPlayers = updatedPlayers.map(p => {
                        if (p.id === nearestPlayer.id) {
                            const newHp = Math.max(0, p.hp - enemy.damage);
                            const newSanity = Math.max(0, p.sanity - enemy.horror);
                            const isDead = newHp <= 0;
                            if (isDead) addToLog(`${p.name} has fallen to the darkness...`);
                            return checkMadness({ ...p, hp: newHp, sanity: newSanity, isDead });
                        }
                        return p;
                    });
                } 
                else {
                    const enemyBlockers = new Set(updatedEnemies.filter(e => e.id !== enemy.id).map(e => `${e.position.q},${e.position.r}`));
                    const path = findPath(enemy.position, [nearestPlayer.position], state.board, enemyBlockers, false);
                    
                    if (path && path.length > 1) {
                        updatedEnemies[i] = { ...enemy, position: path[1] };
                    }
                }
            }

            setTimeout(() => {
                setState(prev => ({ 
                    ...prev, 
                    enemies: updatedEnemies,
                    phase: GamePhase.INVESTIGATOR, 
                    activePlayerIndex: 0,
                    players: updatedPlayers.map(p => ({ ...p, actions: p.isDead ? 0 : 2 })) 
                }));
                addToLog("A new day breaks...");
            }, 1000);
        };

        processEnemyAI();
    }
  }, [state.phase]);

  const addToLog = (message: string) => {
    setState(prev => ({ ...prev, log: [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.log].slice(0, 50) }));
  };

  const triggerScreenShake = () => {
    setState(prev => ({ ...prev, screenShake: true }));
    setTimeout(() => setState(prev => ({ ...prev, screenShake: false })), 500);
  };

  const addFloatingText = (q: number, r: number, content: string, colorClass: string) => {
    const id = `ft-${Date.now()}`;
    setState(prev => ({
        ...prev,
        floatingTexts: [...prev.floatingTexts, { id, q, r, content, colorClass, randomOffset: { x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 40 } }]
    }));
    setTimeout(() => {
        setState(prev => ({ ...prev, floatingTexts: prev.floatingTexts.filter(t => t.id !== id) }));
    }, 2000);
  };

  const checkMadness = (player: Player) => {
      if (player.sanity <= 0 && !player.activeMadness) {
          const newMadness = MADNESS_CONDITIONS[Math.floor(Math.random() * MADNESS_CONDITIONS.length)];
          addToLog(`${player.name} has cracked. Madness sets in: ${newMadness.name}!`);
          addFloatingText(player.position.q, player.position.r, "BROKEN MIND", "text-purple-600 font-black");
          return { ...player, sanity: Math.floor(player.maxSanity / 2), activeMadness: newMadness, madness: [...player.madness, newMadness.id] };
      }
      return player;
  };

  const spawnEnemy = useCallback(async (type: EnemyType, q: number, r: number) => {
      const bestiary = BESTIARY[type];
      if (!bestiary) return;

      const newEnemy: Enemy = {
          id: `enemy-${Date.now()}-${Math.random()}`,
          name: bestiary.name,
          type: type,
          hp: bestiary.hp,
          maxHp: bestiary.hp,
          damage: bestiary.damage,
          horror: bestiary.horror,
          speed: 1,
          position: { q, r },
          visionRange: 3,
          attackRange: 1,
          attackType: 'melee',
          traits: bestiary.traits,
          imageUrl: await getEnemyVisual({ type } as any) || undefined
      };

      setState(prev => ({ ...prev, enemies: [...prev.enemies, newEnemy] }));
      addToLog(`A ${bestiary.name} emerges from the shadows!`);
  }, []);

  const spawnRoom = useCallback(async (startQ: number, startR: number, tileSet: 'indoor' | 'outdoor' | 'mixed') => {
      const roomId = `room-${Date.now()}`;
      const isConnector = Math.random() > 0.6; 
      
      const pool = isConnector 
        ? (tileSet === 'indoor' ? INDOOR_CONNECTORS : OUTDOOR_CONNECTORS)
        : (tileSet === 'indoor' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS);
      
      const roomName = pool[Math.floor(Math.random() * pool.length)];
      const shape = isConnector ? ROOM_SHAPES.LINEAR : ROOM_SHAPES.MEDIUM;
      
      const newTiles: Tile[] = [];

      // IMMEDIATE UPDATE: Add tiles to the board WITHOUT images first to prevent "void" exploration blocks
      shape.forEach(offset => {
          const q = startQ + offset.q;
          const r = startR + offset.r;
          
          if (!state.board.some(t => t.q === q && t.r === r)) {
              let object: TileObjectType | undefined = undefined;
              let blocking = false;

              if (tileSet === 'indoor' && Math.random() > 0.6) {
                  const roll = Math.random();
                  if (roll > 0.8) { object = 'locked_door'; blocking = true; }
                  else if (roll > 0.6) { object = 'rubble'; blocking = true; }
                  else if (roll > 0.5) { object = 'fire'; blocking = true; }
              }

              newTiles.push({
                  id: `tile-${Date.now()}-${Math.random()}`,
                  q, r,
                  name: roomName,
                  type: isConnector ? 'street' : 'room',
                  category: isConnector ? 'connector' : 'location',
                  roomId,
                  explored: true,
                  searchable: !isConnector,
                  searched: false,
                  object: object ? { type: object, searched: false, blocking, difficulty: 4 } : undefined
              });
          }
      });

      if (newTiles.length > 0) {
          setState(prev => ({ ...prev, board: [...prev.board, ...newTiles] }));
          addToLog(`ENTERED: ${roomName}.`);
          
          if (Math.random() > 0.8) spawnEnemy('cultist', startQ, startR);

          // ASYNC ENHANCEMENT: Generate the image after the board is physically updated
          const imageUrl = await generateLocationAsset(roomName, isConnector ? 'street' : 'room');
          if (imageUrl) {
              setState(prev => ({
                  ...prev,
                  board: prev.board.map(t => t.roomId === roomId ? { ...t, imageUrl } : t)
              }));
          }
      }
  }, [state.board, spawnEnemy]);

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;

    if (state.activeSpell && actionType !== 'cancel_cast') {
        if (actionType === 'enemy_click') resolveSpell(payload.id, true);
        if (actionType === 'move') resolveSpell('self', false);
        return;
    }

    switch (actionType) {
      case 'move':
        const { q, r } = payload;
        const targetTile = state.board.find(t => t.q === q && t.r === r);
        
        if (targetTile?.object?.blocking) {
            setState(prev => ({ ...prev, selectedTileId: targetTile.id }));
            addToLog(`PATH BLOCKED: ${targetTile.object.type}.`);
            return;
        }

        if (!targetTile) {
             spawnRoom(q, r, state.activeScenario?.tileSet || 'mixed');
        } 
        
        setState(prev => ({ 
            ...prev, 
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p) 
        }));
        break;

      case 'interact':
        const tile = state.board.find(t => t.id === state.selectedTileId);
        if (!tile || !tile.object) return;

        const skillRoll = Array.from({ length: 1 + activePlayer.insight }, () => Math.floor(Math.random() * 6) + 1);
        const successes = skillRoll.filter(v => v >= 4).length;

        if (successes >= 1) {
            addToLog(`CLEARED: ${tile.object.type} removed!`);
            addFloatingText(tile.q, tile.r, "CLEARED", "text-green-400 font-bold");
            setState(prev => ({
                ...prev,
                board: prev.board.map(t => t.id === tile.id ? { ...t, object: { ...t.object!, blocking: false } } : t),
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                selectedTileId: null
            }));
        } else {
            addToLog(`FAILURE: Path remains blocked.`);
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? checkMadness({ ...p, actions: p.actions - 1, sanity: Math.max(0, p.sanity - 1) }) : p),
                selectedTileId: null
            }));
        }
        break;

      case 'rest':
          setState(prev => ({
              ...prev,
              players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, hp: Math.min(p.maxHp, p.hp + 1), sanity: Math.min(p.maxSanity, p.sanity + 1), actions: p.actions - 1 } : p)
          }));
          addToLog(`${activePlayer.name} rested.`);
          break;

      case 'investigate':
          const diceCount = 1 + activePlayer.insight + (activePlayer.id === 'detective' ? 1 : 0);
          const iRoll = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
          setState(prev => ({ ...prev, lastDiceRoll: iRoll }));
          break;

      case 'attack':
          const targetEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
          if (!targetEnemy) return;
          const combatRoll = Array.from({ length: 1 + (activePlayer.id === 'veteran' ? 1 : 0) }, () => Math.floor(Math.random() * 6) + 1);
          setState(prev => ({ ...prev, lastDiceRoll: combatRoll, activeCombat: { playerId: activePlayer.id, enemyId: targetEnemy.id } }));
          break;

      case 'enemy_click':
          setState(prev => ({...prev, selectedEnemyId: payload.id}));
          break;

      case 'cast':
          setState(prev => ({ ...prev, activeSpell: payload }));
          addToLog(`Targeting ${payload.name}...`);
          break;

      case 'cancel_cast':
          setState(prev => ({ ...prev, activeSpell: null }));
          break;
    }
  };

  const resolveDiceResult = () => {
      const roll = state.lastDiceRoll;
      if (!roll) return;

      const successes = roll.filter(v => v >= 4).length;
      const activePlayer = state.players[state.activePlayerIndex];

      if (state.activeCombat) {
          const enemy = state.enemies.find(e => e.id === state.activeCombat?.enemyId);
          if (enemy) {
              if (successes > 0) {
                  const damage = successes;
                  addToLog(`HIT: ${activePlayer.name} deals ${damage} damage.`);
                  addFloatingText(enemy.position.q, enemy.position.r, `-${damage} HP`, "text-red-500 font-black");
                  triggerScreenShake();
                  
                  setState(prev => ({
                      ...prev,
                      enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, hp: e.hp - damage } : e).filter(e => e.hp > 0),
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                      lastDiceRoll: null,
                      activeCombat: null
                  }));
              } else {
                  addToLog(`MISS! Attack failed.`);
                  setState(prev => ({
                      ...prev,
                      players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                      lastDiceRoll: null,
                      activeCombat: null
                  }));
              }
          }
      } else {
          if (successes > 0) {
              const randomItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
              addToLog(`FOUND: ${randomItem.name}!`);
              addFloatingText(activePlayer.position.q, activePlayer.position.r, "ITEM FOUND", "text-amber-400 font-bold");
              
              setState(prev => ({
                  ...prev,
                  players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, inventory: [...p.inventory, randomItem].slice(0, 6), actions: p.actions - 1 } : p),
                  lastDiceRoll: null
              }));
          } else {
              addToLog(`NOTHING FOUND.`);
              setState(prev => ({
                  ...prev,
                  players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, actions: p.actions - 1 } : p),
                  lastDiceRoll: null
              }));
          }
      }
  };

  const handleNextTurn = () => {
      setState(prev => {
          const nextIndex = prev.activePlayerIndex + 1;
          const isEndOfRound = nextIndex >= prev.players.length;
          if (isEndOfRound) {
              return { 
                  ...prev, 
                  phase: GamePhase.MYTHOS, 
                  activePlayerIndex: 0,
                  doom: prev.doom - 1,
                  round: prev.round + 1,
                  activeSpell: null
              };
          }
          return { ...prev, activePlayerIndex: nextIndex, activeSpell: null };
      });
  };

  const resolveSpell = (targetId: string, isEnemy: boolean) => {
    const activePlayer = state.players[state.activePlayerIndex];
    const spell = state.activeSpell;
    if (!activePlayer || !spell) return;

    if (activePlayer.insight < spell.cost) {
        addToLog("INSIGHT INSUFFICIENT.");
        setState(prev => ({ ...prev, activeSpell: null }));
        return;
    }

    if (isEnemy) {
        const enemy = state.enemies.find(e => e.id === targetId);
        if (!enemy) return;
        const dist = hexDistance(activePlayer.position, enemy.position);
        if (dist > spell.range && spell.range > 0) {
            addToLog("OUT OF RANGE.");
            return;
        }

        if (spell.effectType === 'damage') {
            addToLog(`CAST: ${spell.name} on ${enemy.name}.`);
            addFloatingText(enemy.position.q, enemy.position.r, `-${spell.value} ARCANE`, "text-purple-400 font-black");
            triggerScreenShake();
            setState(prev => ({
                ...prev,
                enemies: prev.enemies.map(e => e.id === enemy.id ? { ...e, hp: e.hp - spell.value } : e).filter(e => e.hp > 0),
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? checkMadness({ ...p, actions: p.actions - 1, insight: p.insight - spell.cost }) : p),
                activeSpell: null
            }));
        }
    } else {
        if (spell.effectType === 'heal') {
            addToLog(`CAST: ${spell.name}.`);
            addFloatingText(activePlayer.position.q, activePlayer.position.r, `+${spell.value} HP`, "text-green-400 font-bold");
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, hp: Math.min(p.maxHp, p.hp + spell.value), actions: p.actions - 1, insight: p.insight - spell.cost } : p),
                activeSpell: null
            }));
        }
    }
  };

  const activePlayer = state.players[state.activePlayerIndex] || state.players[0] || null;
  const selectedEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);
  const selectedTile = state.board.find(t => t.id === state.selectedTileId);

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${state.screenShake ? 'animate-shake' : ''} ${activePlayer?.activeMadness?.visualClass || ''}`}>
      
      {isMainMenuOpen && (
          <MainMenu 
            onNewGame={() => { setState({...DEFAULT_STATE, phase: GamePhase.SETUP}); setIsMainMenuOpen(false); }} 
            onContinue={() => setIsMainMenuOpen(false)} 
            onOptions={() => setShowOptions(true)} 
            canContinue={state.phase !== GamePhase.SETUP} 
            version={APP_VERSION} 
          />
      )}

      {state.phase === GamePhase.SETUP && !isMainMenuOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 bg-[#05050a] overflow-y-auto">
              {!state.activeScenario ? (
                  <div className="bg-[#16213e] p-12 rounded-2xl border-2 border-[#e94560] shadow-[0_0_50px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center">
                      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                          <button onClick={() => setIsMainMenuOpen(true)} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"><RotateCcw size={16}/> Back to Title</button>
                          <h1 className="text-3xl font-display text-[#e94560] italic uppercase tracking-widest">Select a Case File</h1>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {SCENARIOS.map(s => (
                              <button key={s.id} onClick={() => setState(prev => ({ ...prev, activeScenario: s }))} className="p-6 bg-[#0a0a1a] border border-slate-700 hover:border-[#e94560] rounded-xl text-left transition-all group">
                                  <h3 className="text-xl font-bold text-white group-hover:text-[#e94560] mb-2">{s.title}</h3>
                                  <p className="text-xs text-slate-400 italic leading-relaxed">{s.description}</p>
                              </button>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="bg-[#16213e] p-12 rounded-2xl border-2 border-[#e94560] shadow-[0_0_50px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center">
                      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                          <button onClick={() => setState(prev => ({...prev, activeScenario: null}))} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"><ArrowLeft size={16}/> Back</button>
                          <h1 className="text-2xl font-display text-[#e94560] uppercase tracking-[0.2em]">{state.activeScenario.title}</h1>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                          {(Object.keys(CHARACTERS) as CharacterType[]).map(type => {
                              const isSelected = !!state.players.find(p => p.id === type);
                              return (
                                  <button key={type} onClick={() => {
                                      const char = CHARACTERS[type];
                                      setState(prev => ({
                                          ...prev,
                                          players: isSelected ? prev.players.filter(p => p.id !== type) : [...prev.players, { ...char, position: { q: 0, r: 0 }, inventory: [], spells: (type === 'occultist' ? [SPELLS[0]] : []), actions: 2, isDead: false, madness: [], activeMadness: null, traits: [] }]
                                      }));
                                  }} className={`p-4 bg-[#0a0a1a] border-2 rounded-xl transition-all ${isSelected ? 'border-[#e94560] shadow-[0_0_15px_rgba(233,69,96,0.3)] scale-105' : 'border-slate-800 opacity-60'}`}>
                                      <div className="text-lg font-bold text-white uppercase tracking-tighter">{CHARACTERS[type].name}</div>
                                      <div className="flex justify-center gap-4 text-xs font-bold mt-2">
                                          <span className="text-red-500 flex items-center gap-1"><Heart size={12}/> {CHARACTERS[type].hp}</span>
                                          <span className="text-purple-500 flex items-center gap-1"><Brain size={12}/> {CHARACTERS[type].sanity}</span>
                                      </div>
                                  </button>
                              );
                          })}
                      </div>
                      <button disabled={state.players.length === 0} onClick={() => {
                          setState(prev => ({ ...prev, phase: GamePhase.INVESTIGATOR, doom: prev.activeScenario?.startDoom || 12 }));
                          addToLog("The investigation begins.");
                          spawnEnemy('cultist', 1, 0);
                      }} className={`px-12 py-4 font-display text-2xl tracking-[0.3em] uppercase border-2 transition-all ${state.players.length > 0 ? 'bg-[#e94560] border-white text-white shadow-[0_0_30px_#e94560]' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'}`}>Assemble Team</button>
                  </div>
              )}
          </div>
      )}

      {state.phase !== GamePhase.SETUP && !isMainMenuOpen && (
          <>
            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl flex items-center gap-4">
                <div className="flex-1 bg-[#1a120b]/90 border-2 border-[#e94560] rounded-2xl p-4 shadow-[0_0_30px_rgba(233,69,96,0.3)] backdrop-blur-md text-center pointer-events-none">
                    <div className="flex items-center justify-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#8b6b4e] mb-1">
                        <span className="flex items-center gap-2"><History size={14}/> ROUND: <span className="text-white">{state.round}</span></span>
                        <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full"></span>
                        <span className="flex items-center gap-2"><Skull size={14}/> DOOM: <span className="text-[#e94560]">{state.doom}</span></span>
                    </div>
                </div>
                <button onClick={() => setShowOptions(true)} className="bg-[#1a120b]/90 border-2 border-[#e94560] rounded-xl p-3 text-[#e94560] transition-colors hover:bg-black/50"><Settings size={24}/></button>
            </div>

            <div className="absolute inset-0 z-0">
                <GameBoard tiles={state.board} players={state.players} enemies={state.enemies} selectedEnemyId={state.selectedEnemyId} onTileClick={(q, r) => handleAction('move', { q, r })} onEnemyClick={(id) => handleAction('enemy_click', { id })} floatingTexts={state.floatingTexts} doom={state.doom} activeModifiers={state.activeModifiers} />
            </div>

            {activePlayer && (
                <div className={`fixed top-1/2 -translate-y-1/2 left-6 h-[80vh] w-80 z-40 transition-all ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+40px)] opacity-0'}`}>
                    <CharacterPanel player={activePlayer} allPlayers={state.players} onTrade={()=>{}} onDrop={()=>{}} />
                </div>
            )}

            <div className={`fixed top-1/2 -translate-y-1/2 right-6 h-[80vh] w-80 z-40 transition-all ${showRightPanel ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+40px)] opacity-0'}`}>
                {selectedEnemy ? (
                    <EnemyPanel enemy={selectedEnemy} onClose={() => setState(prev => ({ ...prev, selectedEnemyId: null }))} />
                ) : (
                    <div className="bg-[#1a120b]/95 border-2 border-[#e94560] rounded-2xl h-full flex flex-col overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-[#3e2c20] bg-black/40 flex items-center gap-3">
                            <ScrollText size={18} className="text-[#e94560]" />
                            <h3 className="text-xs font-bold text-[#eecfa1] uppercase tracking-[0.2em]">Field Journal</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                            {state.log.map((entry, i) => <div key={i} className="text-xs font-serif italic text-slate-300 leading-relaxed border-b border-[#3e2c20]/30 pb-2">{formatLogEntry(entry)}</div>)}
                        </div>
                    </div>
                )}
            </div>

            <footer className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black to-transparent z-50 flex items-center justify-center gap-4 px-4 pb-4">
                <ActionBar 
                    onAction={handleAction} 
                    actionsRemaining={activePlayer?.actions || 0} 
                    isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
                    spells={activePlayer?.spells || []} 
                    activeSpell={state.activeSpell} 
                    showCharacter={showLeftPanel} 
                    onToggleCharacter={() => setShowLeftPanel(!showLeftPanel)} 
                    showInfo={showRightPanel} 
                    onToggleInfo={() => setShowRightPanel(!showRightPanel)} 
                    contextAction={selectedTile?.object?.blocking ? { id: 'interact', label: `Break ${selectedTile.object.type}`, iconType: 'strength', difficulty: 4 } : null}
                />
                <button onClick={handleNextTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold rounded-xl uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_#e94560]">
                    {state.activePlayerIndex === state.players.length - 1 ? "End Round" : "Next Turn"}
                </button>
            </footer>
          </>
      )}

      {state.lastDiceRoll && <DiceRoller values={state.lastDiceRoll} onComplete={resolveDiceResult} />}
      {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} onResetData={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }} onUpdateSettings={setGameSettings} />}
    </div>
  );
};

export default App;
