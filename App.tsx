
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Skull, ChevronRight, ChevronLeft, RotateCcw, Minimize2, ScrollText, Target, FolderOpen, 
  ArrowLeft, Users, Star, Trash2, Edit2, ShoppingBag, Book, CloudFog, Zap, 
  User, Save, MapPin, CheckCircle, HelpCircle, FileText, History, Heart, Brain, Settings, Edit3
} from 'lucide-react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, TileObjectType, Scenario, ContextAction, SavedInvestigator, Item, Spell, Trait, GameSettings, ScenarioStep, DoomEvent, EnemyType, VictoryType } from './types';
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
const ROSTER_KEY = 'shadows_1920s_roster';
const SETUP_CONFIG_KEY = 'shadows_1920s_setup_config_v1';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const APP_VERSION = "3.10.13"; // Unified UI & Options Fix

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

const formatLogEntry = (entry: string) => {
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
        { regex: /(ENTERED:|LOCATION:)/gi, color: 'text-[#eecfa1] font-bold tracking-widest' }
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

  useEffect(() => {
      if (state.phase === GamePhase.INVESTIGATOR || state.phase === GamePhase.MYTHOS) {
          setShowTurnNotification(true);
          const timer = setTimeout(() => setShowTurnNotification(false), 2000);
          return () => clearTimeout(timer);
      }
  }, [state.activePlayerIndex, state.phase]);

  const addToLog = (message: string) => {
    setState(prev => ({ ...prev, log: [message, ...prev.log].slice(0, 50) }));
  };

  const generateTileVisual = async (tile: Tile) => {
      const lib = loadAssetLibrary();
      if (lib[tile.name]) {
          setState(prev => ({ ...prev, board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: lib[tile.name] } : t) }));
          return;
      }
      const img = await generateLocationAsset(tile.name, tile.type);
      if (img) {
          lib[tile.name] = img;
          saveAssetLibrary(lib);
          setState(prev => ({ ...prev, board: prev.board.map(t => t.id === tile.id ? { ...t, imageUrl: img } : t) }));
      }
  };

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;

    switch (actionType) {
      case 'move':
        const { q, r } = payload;
        const targetTile = state.board.find(t => t.q === q && t.r === r);
        
        if (!targetTile) {
             const pool = INDOOR_LOCATIONS; 
             const newTileName = pool[Math.floor(Math.random() * pool.length)];
             const newTile: Tile = { id: `tile-${Date.now()}`, q, r, name: newTileName, type: 'room', explored: true, searchable: true, searched: false };
             generateTileVisual(newTile);
             
             const flavor = LOCATION_DESCRIPTIONS[newTileName] || "A place untouched by time.";
             
             setState(prev => ({ 
                 ...prev, 
                 log: [`ENTERED: ${newTileName}. ${flavor}`, ...prev.log],
                 board: [...prev.board, newTile], 
                 players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p) 
             }));
        } else {
             const flavor = LOCATION_DESCRIPTIONS[targetTile.name] || "You step into familiar shadows.";
             setState(prev => ({ 
                 ...prev, 
                 log: [`ENTERED: ${targetTile.name}. ${flavor}`, ...prev.log],
                 players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p) 
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
    }
  };

  const handleNextTurn = () => {
      setState(prev => {
          const nextIndex = prev.activePlayerIndex + 1;
          const isEndOfRound = nextIndex >= prev.players.length;
          if (isEndOfRound) return { ...prev, phase: GamePhase.MYTHOS, activePlayerIndex: 0 };
          return { ...prev, activePlayerIndex: nextIndex };
      });
  };

  const selectScenario = (scenario: Scenario) => { 
      let finalScenario = scenario;
      if (scenario.id === 's5') {
          const goals: VictoryType[] = ['escape', 'assassination', 'collection', 'survival'];
          const victory = goals[Math.floor(Math.random() * goals.length)];
          const steps: ScenarioStep[] = [];
          
          if (victory === 'escape') {
              steps.push({ id: 'rs1', description: 'Find the Hidden Idol', type: 'find_item', targetId: 'quest_idol', completed: false });
              steps.push({ id: 'rs2', description: 'Locate the secret exit', type: 'find_tile', targetId: 'Secret Passage', completed: false });
          } else if (victory === 'assassination') {
              steps.push({ id: 'rs1', description: 'Kill the Abomination', type: 'kill_enemy', targetId: 'boss', amount: 1, completed: false });
          } else if (victory === 'survival') {
              steps.push({ id: 'rs1', description: 'Survive the night', type: 'survive', amount: 8, completed: false });
          } else {
              steps.push({ id: 'rs1', description: 'Collect the pieces of the seal', type: 'collection' as any, targetId: 'seal_fragment', amount: 3, completed: false } as any);
          }

          finalScenario = {
              ...scenario,
              victoryType: victory,
              steps: steps,
              startDoom: 10 + Math.floor(Math.random() * 6),
              difficulty: ['Normal', 'Hard', 'Nightmare'][Math.floor(Math.random() * 3)] as any
          };
      }
      setState(prev => ({ ...prev, activeScenario: finalScenario })); 
  };

  const toggleCharacterSelection = (type: CharacterType) => {
    if (state.phase !== GamePhase.SETUP) return;
    setState(prev => {
      const existing = prev.players.find(p => p.id === type && !p.instanceId);
      if (existing) return { ...prev, players: prev.players.filter(p => p !== existing) };
      if (prev.players.length >= 4) return prev;
      const char = CHARACTERS[type];
      const newPlayer: Player = { 
          ...char, 
          position: { q: 0, r: 0 }, 
          inventory: [], 
          spells: [], 
          actions: 2, 
          isDead: false, 
          madness: [], 
          activeMadness: null, 
          traits: [] 
      };
      return { ...prev, players: [...prev.players, newPlayer] };
    });
  };

  const updatePlayerName = (type: CharacterType, newName: string) => {
      setState(prev => ({
          ...prev,
          players: prev.players.map(p => p.id === type ? { ...p, name: newName } : p)
      }));
  };

  const startGame = () => {
    if (state.players.length === 0 || !state.activeScenario) return;
    setState(prev => ({ ...prev, phase: GamePhase.INVESTIGATOR, activePlayerIndex: 0, doom: prev.activeScenario?.startDoom || 12 }));
    addToLog("The investigation begins...");
  };

  const activePlayer = state.players[state.activePlayerIndex] || state.players[0] || null;
  const currentStep = state.activeScenario?.steps?.[state.currentStepIndex];
  const selectedEnemy = state.enemies.find(e => e.id === state.selectedEnemyId);

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative transition-all duration-1000 ${state.screenShake ? 'animate-shake' : ''}`}>
      
      {/* 1. TITLE SCREEN OVERLAY */}
      {isMainMenuOpen && (
          <MainMenu 
            onNewGame={() => { setState({...DEFAULT_STATE, phase: GamePhase.SETUP}); setIsMainMenuOpen(false); }} 
            onContinue={() => setIsMainMenuOpen(false)} 
            onOptions={() => setShowOptions(true)} 
            canContinue={state.phase !== GamePhase.SETUP} 
            version={APP_VERSION} 
          />
      )}

      {/* 2. SETUP PHASE UI */}
      {!isMainMenuOpen && state.phase === GamePhase.SETUP && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 bg-[#05050a] overflow-y-auto">
              {!state.activeScenario ? (
                  <div className="bg-[#16213e] p-12 rounded-2xl border-2 border-[#e94560] shadow-[0_0_50px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center animate-in zoom-in duration-300">
                      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                          <button onClick={() => setIsMainMenuOpen(true)} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"><RotateCcw size={16}/> Back to Title</button>
                          <h1 className="text-3xl font-display text-[#e94560] italic uppercase tracking-widest">Select a Case File</h1>
                          <button onClick={() => setShowOptions(true)} className="text-[#e94560] hover:text-white p-2 transition-all"><Settings size={20}/></button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                          {SCENARIOS.map(s => (
                              <button key={s.id} onClick={() => selectScenario(s)} className="p-6 bg-[#0a0a1a] border border-slate-700 hover:border-[#e94560] rounded-xl text-left transition-all group">
                                  <h3 className="text-xl font-bold text-white group-hover:text-[#e94560] mb-2">{s.title}</h3>
                                  <p className="text-xs text-slate-400 italic leading-relaxed">{s.description}</p>
                              </button>
                          ))}
                      </div>
                  </div>
              ) : (
                  <div className="bg-[#16213e] p-12 rounded-2xl border-2 border-[#e94560] shadow-[0_0_50px_rgba(233,69,96,0.3)] max-w-4xl w-full text-center animate-in slide-in-from-right duration-300">
                      <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
                          <button onClick={() => setState(prev => ({...prev, activeScenario: null}))} className="text-slate-500 hover:text-white flex items-center gap-2 text-xs uppercase tracking-widest transition-colors"><ArrowLeft size={16}/> Back</button>
                          <h1 className="text-2xl font-display text-[#e94560] uppercase tracking-[0.2em]">{state.activeScenario.title}</h1>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-12">
                          {(Object.keys(CHARACTERS) as CharacterType[]).map(type => {
                              const player = state.players.find(p => p.id === type);
                              const isSelected = !!player;
                              return (
                                  <div key={type} className={`p-4 bg-[#0a0a1a] border-2 rounded-xl transition-all relative ${isSelected ? 'border-[#e94560] shadow-[0_0_15px_rgba(233,69,96,0.3)] scale-105' : 'border-slate-800'}`}>
                                      <button onClick={() => toggleCharacterSelection(type)} className="w-full text-left mb-2 group">
                                          <div className="text-lg font-bold text-white group-hover:text-[#e94560] uppercase tracking-tighter">{CHARACTERS[type].name}</div>
                                          <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-3">{type}</div>
                                      </button>
                                      
                                      {isSelected && (
                                          <div className="mb-4 flex items-center gap-2 bg-black/40 p-2 rounded border border-[#e94560]/30 animate-in slide-in-from-top-1">
                                              <Edit3 size={12} className="text-[#e94560]" />
                                              <input 
                                                type="text" 
                                                value={player.name} 
                                                onChange={(e) => updatePlayerName(type, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="bg-transparent text-xs text-amber-100 border-none focus:ring-0 w-full font-serif"
                                                placeholder="Custom Name"
                                              />
                                          </div>
                                      )}

                                      <div className="flex justify-center gap-4 text-xs font-bold pointer-events-none">
                                          <span className="text-red-500 flex items-center gap-1"><Heart size={12}/> {CHARACTERS[type].hp}</span>
                                          <span className="text-purple-500 flex items-center gap-1"><Brain size={12}/> {CHARACTERS[type].sanity}</span>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      <button disabled={state.players.length === 0} onClick={startGame} className={`px-12 py-4 font-display text-2xl tracking-[0.3em] uppercase border-2 transition-all ${state.players.length > 0 ? 'bg-[#e94560] border-white text-white shadow-[0_0_30px_#e94560]' : 'bg-slate-900 border-slate-800 text-slate-700 cursor-not-allowed'}`}>Assemble Team</button>
                  </div>
              )}
          </div>
      )}

      {/* 3. ACTIVE GAMEPLAY UI */}
      {!isMainMenuOpen && state.phase !== GamePhase.SETUP && (
          <>
            {showTurnNotification && activePlayer && <TurnNotification player={activePlayer} phase={state.phase === GamePhase.MYTHOS ? 'mythos' : 'investigator'} />}

            <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl flex items-center gap-4">
                <div className="flex-1 bg-[#1a120b]/90 border-2 border-[#e94560] rounded-2xl p-4 shadow-[0_0_30px_rgba(233,69,96,0.3)] backdrop-blur-md text-center pointer-events-none">
                    <div className="flex items-center justify-center gap-8 text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-[#8b6b4e] mb-1">
                        <span className="flex items-center gap-2"><History size={14}/> ROUND: <span className="text-white">{state.round}</span></span>
                        <span className="w-1.5 h-1.5 bg-[#e94560] rounded-full"></span>
                        <span className="flex items-center gap-2"><Skull size={14}/> DOOM: <span className="text-[#e94560]">{state.doom}</span></span>
                    </div>
                    {currentStep && (
                        <div className="text-sm md:text-lg font-display italic text-[#eecfa1] mt-1 border-t border-[#3e2c20] pt-2">
                            {currentStep.description}
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => setShowOptions(true)}
                    className="bg-[#1a120b]/90 border-2 border-[#e94560] rounded-xl p-3 shadow-lg hover:bg-[#e94560]/20 transition-all text-[#e94560] active:scale-95"
                >
                    <Settings size={24} />
                </button>
            </div>

            <div className="absolute inset-0 z-0">
                <GameBoard tiles={state.board} players={state.players} enemies={state.enemies} selectedEnemyId={state.selectedEnemyId} onTileClick={(q, r) => handleAction('move', { q, r })} onEnemyClick={(id) => setState(prev => ({...prev, selectedEnemyId: id}))} floatingTexts={state.floatingTexts} doom={state.doom} activeModifiers={state.activeModifiers} />
            </div>

            {activePlayer && (
                <div className={`fixed top-1/2 -translate-y-1/2 left-6 h-[80vh] w-80 z-40 transition-all duration-500 ease-in-out ${showLeftPanel ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+40px)] opacity-0'}`}>
                    <CharacterPanel player={activePlayer} allPlayers={state.players} onTrade={()=>{}} onDrop={()=>{}} />
                </div>
            )}

            <div className={`fixed top-1/2 -translate-y-1/2 right-6 h-[80vh] w-80 z-40 transition-all duration-500 ease-in-out ${showRightPanel ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+40px)] opacity-0'}`}>
                {selectedEnemy ? (
                    <EnemyPanel enemy={selectedEnemy} onClose={() => setState(prev => ({ ...prev, selectedEnemyId: null }))} />
                ) : (
                    <div className="bg-[#1a120b]/95 border-2 border-[#e94560] rounded-2xl shadow-[0_0_30px_rgba(233,69,96,0.2)] backdrop-blur-md flex flex-col h-full overflow-hidden">
                        <div className="p-4 border-b border-[#3e2c20] bg-black/40 flex items-center gap-3">
                            <ScrollText size={18} className="text-[#e94560]" />
                            <h3 className="text-xs font-bold text-[#eecfa1] uppercase tracking-[0.2em]">Field Journal</h3>
                        </div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-10 pointer-events-none"></div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar relative z-10">
                            {state.log.map((entry, i) => (
                                <div key={i} className="text-xs font-serif italic text-slate-300 leading-relaxed border-b border-[#3e2c20]/30 pb-2">
                                    {formatLogEntry(entry)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <footer className="fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black via-[#0a0a1a] to-transparent z-50 flex items-center justify-center gap-4 px-4 pb-4">
                <ActionBar onAction={handleAction} actionsRemaining={activePlayer?.actions || 0} isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} spells={activePlayer?.spells || []} activeSpell={state.activeSpell} showCharacter={showLeftPanel} onToggleCharacter={() => setShowLeftPanel(!showLeftPanel)} showInfo={showRightPanel} onToggleInfo={() => setShowRightPanel(!showRightPanel)} />
                <div className="w-px h-12 bg-slate-800 mx-2"></div>
                <button onClick={handleNextTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(233,69,96,0.4)] hover:bg-red-600 hover:scale-105 transition-all shrink-0">
                    {state.activePlayerIndex === state.players.length - 1 ? "End Round" : "Next"}
                </button>
            </footer>
          </>
      )}

      {/* 4. GLOBAL OVERLAYS (Highest Z-Index) */}
      {showOptions && (
          <OptionsMenu 
            onClose={() => setShowOptions(false)} 
            onResetData={() => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload();
            }} 
            onUpdateSettings={setGameSettings} 
          />
      )}
    </div>
  );
};

export default App;
