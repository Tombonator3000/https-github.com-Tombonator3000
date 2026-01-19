
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, EnemyType, GameSettings, TileObject, ScenarioModifier } from './types';
import { CHARACTERS, START_TILE, BESTIARY, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS } from './constants';
import GameBoard from './components/GameBoard';
import ActionBar from './components/ActionBar';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import TurnNotification from './components/TurnNotification'; 
import PuzzleModal from './components/PuzzleModal';
import { loadAssetLibrary, saveAssetLibrary, generateLocationAsset, getEnemyVisual } from './utils/AssetLibrary';
import { loadSettings, DEFAULT_SETTINGS } from './utils/Settings';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const APP_VERSION = "3.10.33"; 

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
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const lib = loadAssetLibrary();
        if (saved) {
            const parsed = JSON.parse(saved);
            const mergedState = { ...DEFAULT_STATE, ...parsed };
            if (mergedState.board) {
                mergedState.board = mergedState.board.map((t: Tile) => ({
                    ...t,
                    imageUrl: lib[t.name] || t.imageUrl
                }));
            }
            return mergedState;
        }
    } catch (e) { console.error(e); }
    return DEFAULT_STATE;
  });

  const addToLog = (msg: string) => {
    setState(prev => ({ ...prev, log: [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.log].slice(0, 50) }));
  };

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    
    if (actionType === 'move') {
        const { q, r } = payload;
        const targetTile = state.board.find(t => t.q === q && t.r === r);
        
        if (targetTile?.object?.blocking) {
            addToLog("Vei sperret! Du må fjerne hindringen først.");
            return;
        }

        // Vær-effekt: Tåke begrenser bevegelse (kunne vært brukt her)
        const isFoggy = state.activeModifiers.some(m => m.weatherType === 'fog');
        
        if (!targetTile) spawnRoom(q, r, state.activeScenario?.tileSet || 'mixed');
        
        let hpChange = 0;
        if (targetTile?.object?.type === 'fire') {
            hpChange = -1;
            addToLog("AAARGH! Du brenner deg i flammene!");
        } else if (targetTile?.object?.type === 'trap') {
            hpChange = -1;
            addToLog("KLIKK! En felle ble utløst!");
        }

        setState(prev => ({ 
            ...prev, 
            screenShake: hpChange < 0,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { 
                ...p, 
                position: { q, r }, 
                actions: p.actions - 1,
                hp: Math.max(0, p.hp + hpChange)
            } : p) 
        }));

        setTimeout(() => setState(prev => ({ ...prev, screenShake: false })), 500);
    }

    if (actionType === 'interact') {
        const p = state.players[state.activePlayerIndex];
        const tile = state.board.find(t => t.q === p.position.q && t.r === p.position.r);
        if (tile?.object?.puzzleType === 'sequence') {
            setState(prev => ({ ...prev, activePuzzle: { type: 'sequence', difficulty: tile.object?.difficulty || 3, targetTileId: tile.id } }));
        } else if (tile?.object) {
            addToLog(`Prøver å fjerne ${tile.object.type}...`);
            setState(prev => ({
                ...prev,
                board: prev.board.map(t => t.id === tile.id ? { ...t, object: undefined } : t)
            }));
            addToLog("Hindring fjernet!");
        }
    }
  };

  const spawnRoom = useCallback(async (startQ: number, startR: number, tileSet: 'indoor' | 'outdoor' | 'mixed') => {
      const roomId = `room-${Date.now()}`;
      const isConnector = Math.random() > 0.6; 
      const pool = isConnector ? (tileSet === 'indoor' ? INDOOR_CONNECTORS : OUTDOOR_CONNECTORS) : (tileSet === 'indoor' ? INDOOR_LOCATIONS : OUTDOOR_LOCATIONS);
      const roomName = pool[Math.floor(Math.random() * pool.length)];
      
      let object: TileObject | undefined = undefined;
      const rand = Math.random();
      if (rand > 0.90) {
          object = { type: 'locked_door', blocking: true, searched: false, difficulty: 4, puzzleType: 'sequence' };
      } else if (rand > 0.85) {
          object = { type: 'fire', blocking: false, searched: false };
      }

      const newTile: Tile = {
          id: `tile-${Date.now()}`,
          q: startQ, r: startR,
          name: roomName,
          type: isConnector ? 'street' : 'room',
          category: isConnector ? 'connector' : 'location',
          roomId,
          explored: true,
          searchable: !isConnector,
          searched: false,
          object
      };

      setState(prev => ({ ...prev, board: [...prev.board, newTile] }));
  }, []);

  return (
    <div className={`h-full w-full bg-[#05050a] text-slate-200 overflow-hidden relative ${state.screenShake ? 'animate-shake' : ''}`}>
      {isMainMenuOpen && <MainMenu onNewGame={() => { 
          // Start med et tilfeldig vær-modifier for å teste systemet
          const randomWeather = SCENARIO_MODIFIERS[Math.floor(Math.random() * SCENARIO_MODIFIERS.length)];
          setState({...DEFAULT_STATE, phase: GamePhase.SETUP, activeModifiers: [randomWeather]}); 
          setIsMainMenuOpen(false); 
      }} onContinue={() => setIsMainMenuOpen(false)} onOptions={() => setShowOptions(true)} canContinue={state.phase !== GamePhase.SETUP} version={APP_VERSION} />}
      
      {!isMainMenuOpen && state.phase !== GamePhase.SETUP && (
          <>
            <GameBoard tiles={state.board} players={state.players} enemies={state.enemies} onTileClick={(q, r) => handleAction('move', { q, r })} doom={state.doom} activeModifiers={state.activeModifiers} />
            <footer className="fixed bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-4 z-40 bg-gradient-to-t from-black to-transparent">
                <ActionBar 
                    onAction={handleAction} 
                    actionsRemaining={state.players[state.activePlayerIndex]?.actions || 0} 
                    isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
                    contextAction={state.board.find(t => t.q === state.players[state.activePlayerIndex]?.position.q && t.r === state.players[state.activePlayerIndex]?.position.r)?.object ? { id: 'obj', label: 'Interager', iconType: 'insight', difficulty: 4 } : null}
                    spells={[]} activeSpell={null} onToggleCharacter={() => setShowLeftPanel(!showLeftPanel)} showCharacter={showLeftPanel} onToggleInfo={() => setShowRightPanel(!showRightPanel)} showInfo={showRightPanel} 
                />
            </footer>
          </>
      )}
    </div>
  );
};

export default App;
