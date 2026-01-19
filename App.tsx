
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Tone from 'tone';
import { GoogleGenAI } from "@google/genai";
import { 
  Skull, ChevronRight, ChevronLeft, RotateCcw, Minimize2, ScrollText, Target, FolderOpen, 
  ArrowLeft, Users, Star, Trash2, Edit2, ShoppingBag, Book, CloudFog, Zap, 
  User, Save, MapPin, CheckCircle, HelpCircle, FileText, History, Heart, Brain, Settings, Edit3,
  Hammer, Wind, Lock, Flame, Sparkles
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
const APP_VERSION = "3.10.30"; 

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

const App: React.FC = () => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [gameSettings, setGameSettings] = useState<GameSettings>(loadSettings());

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

  const refreshAssets = useCallback(() => {
      const lib = loadAssetLibrary();
      setState(prev => {
          const newBoard = prev.board.map(t => ({
              ...t,
              imageUrl: lib[t.name] || t.imageUrl
          }));
          const newEnemies = prev.enemies.map(e => ({
              ...e,
              imageUrl: lib[e.type] || e.imageUrl
          }));
          const newPlayers = prev.players.map(p => ({
              ...p,
              imageUrl: lib[p.id] || p.imageUrl
          }));

          // Only update state if something actually changed to avoid cycles
          const boardChanged = JSON.stringify(newBoard) !== JSON.stringify(prev.board);
          if (!boardChanged && newEnemies.length === prev.enemies.length && newPlayers.length === prev.players.length) {
              return prev;
          }

          return {
              ...prev,
              board: newBoard,
              enemies: newEnemies,
              players: newPlayers
          };
      });
  }, []);

  const spawnEnemy = useCallback(async (type: EnemyType, q: number, r: number) => {
      const bestiary = BESTIARY[type];
      const lib = loadAssetLibrary();
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
          imageUrl: lib[type] || undefined
      };

      setState(prev => ({ ...prev, enemies: [...prev.enemies, newEnemy] }));
      
      if (!newEnemy.imageUrl) {
          getEnemyVisual(type).then(img => {
              if (img) {
                  const updatedLib = loadAssetLibrary();
                  updatedLib[type] = img;
                  saveAssetLibrary(updatedLib);
                  refreshAssets();
              }
          });
      }
  }, [refreshAssets]);

  const spawnRoom = useCallback(async (startQ: number, startR: number, tileSet: 'indoor' | 'outdoor' | 'mixed') => {
      const roomId = `room-${Date.now()}`;
      const isConnector = Math.random() > 0.6; 
      const pool = isConnector 
        ? (tileSet === 'indoor' ? INDOOR_CONNECTORS : OUTDOOR_CONNECTORS)
        : (tileSet === 'indoor' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS);
      const roomName = pool[Math.floor(Math.random() * pool.length)];
      
      const lib = loadAssetLibrary();
      const existingImg = lib[roomName];

      const newTiles: Tile[] = [{
          id: `tile-${Date.now()}`,
          q: startQ, r: startR,
          name: roomName,
          type: isConnector ? 'street' : 'room',
          category: isConnector ? 'connector' : 'location',
          roomId,
          explored: true,
          searchable: !isConnector,
          searched: false,
          imageUrl: existingImg
      }];

      setState(prev => ({ ...prev, board: [...prev.board, ...newTiles] }));
      
      if (!existingImg) {
          generateLocationAsset(roomName, isConnector ? 'street' : 'room').then(img => {
              if (img) {
                  const updatedLib = loadAssetLibrary();
                  updatedLib[roomName] = img;
                  saveAssetLibrary(updatedLib);
                  refreshAssets();
              }
          });
      }
  }, [refreshAssets]);

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    
    if (actionType === 'move') {
        const { q, r } = payload;
        const targetTile = state.board.find(t => t.q === q && t.r === r);
        if (!targetTile) spawnRoom(q, r, state.activeScenario?.tileSet || 'mixed');
        
        setState(prev => ({ 
            ...prev, 
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { ...p, position: { q, r }, actions: p.actions - 1 } : p) 
        }));
    }
  };

  const handleNextTurn = () => {
      setState(prev => {
          const nextIndex = prev.activePlayerIndex + 1;
          const isEndOfRound = nextIndex >= prev.players.length;
          if (isEndOfRound) return { ...prev, phase: GamePhase.MYTHOS, activePlayerIndex: 0, doom: prev.doom - 1, round: prev.round + 1 };
          return { ...prev, activePlayerIndex: nextIndex };
      });
  };

  return (
    <div className={`h-screen w-screen bg-[#05050a] text-slate-200 overflow-hidden select-none font-serif relative ${state.screenShake ? 'animate-shake' : ''}`}>
      {isMainMenuOpen && <MainMenu onNewGame={() => { setState({...DEFAULT_STATE, phase: GamePhase.SETUP}); setIsMainMenuOpen(false); }} onContinue={() => setIsMainMenuOpen(false)} onOptions={() => setShowOptions(true)} canContinue={state.phase !== GamePhase.SETUP} version={APP_VERSION} />}
      {state.phase === GamePhase.SETUP && !isMainMenuOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-8 bg-[#05050a]">
               <button onClick={() => {
                   const charKeys = Object.keys(CHARACTERS) as CharacterType[];
                   const selectedChar = charKeys[Math.floor(Math.random() * charKeys.length)];
                   const baseChar = CHARACTERS[selectedChar];
                   const lib = loadAssetLibrary();
                   
                   const newPlayer: Player = {
                       ...baseChar,
                       position: { q: 0, r: 0 },
                       inventory: [],
                       spells: [],
                       actions: 2,
                       isDead: false,
                       madness: [],
                       activeMadness: null,
                       traits: [],
                       imageUrl: lib[baseChar.id]
                   };

                   setState(prev => ({ 
                       ...prev, 
                       players: [newPlayer],
                       phase: GamePhase.INVESTIGATOR, 
                       doom: 12 
                   }));
                   spawnEnemy('cultist', 1, 0);
               }} className="px-12 py-4 bg-[#e94560] text-white font-bold uppercase tracking-widest text-2xl rounded shadow-[0_0_30px_#e94560]">Start Investigation</button>
          </div>
      )}
      {state.phase !== GamePhase.SETUP && !isMainMenuOpen && (
          <>
            <div className="absolute inset-0 z-0">
                <GameBoard tiles={state.board} players={state.players} enemies={state.enemies} selectedEnemyId={state.selectedEnemyId} onTileClick={(q, r) => handleAction('move', { q, r })} doom={state.doom} />
            </div>
            <footer className="fixed bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-4 px-4 pb-4">
                <ActionBar onAction={handleAction} actionsRemaining={state.players[state.activePlayerIndex]?.actions || 0} isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} spells={[]} activeSpell={null} onToggleCharacter={() => setShowLeftPanel(!showLeftPanel)} showCharacter={showLeftPanel} onToggleInfo={() => setShowRightPanel(!showRightPanel)} showInfo={showRightPanel} />
                <button onClick={handleNextTurn} className="px-8 py-4 bg-[#e94560] text-white font-bold rounded-xl uppercase tracking-widest">Next Turn</button>
            </footer>
          </>
      )}
      {showOptions && <OptionsMenu onClose={() => setShowOptions(false)} onResetData={() => window.location.reload()} onUpdateSettings={setGameSettings} onAssetsUpdated={refreshAssets} />}
    </div>
  );
};

export default App;
