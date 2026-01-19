
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, EnemyType, GameSettings, TileObject, ScenarioModifier } from './types';
import { CHARACTERS, START_TILE, BESTIARY, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS } from './constants';
import GameBoard from './components/GameBoard';
import ActionBar from './components/ActionBar';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import TurnNotification from './components/TurnNotification'; 
import PuzzleModal from './components/PuzzleModal';
import CharacterPanel from './components/CharacterPanel';
import LogPanel from './components/LogPanel';
import { loadAssetLibrary } from './utils/AssetLibrary';
import { loadSettings } from './utils/Settings';

const STORAGE_KEY = 'shadows_1920s_save_v3';
const APP_VERSION = "3.10.35"; 

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
        if (saved) return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    } catch (e) { console.error(e); }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    if (state.phase !== GamePhase.SETUP) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addToLog = (msg: string) => {
    setState(prev => ({ ...prev, log: [msg, ...prev.log].slice(0, 100) }));
  };

  const handleEndTurn = () => {
    setState(prev => {
        const isLastPlayer = prev.activePlayerIndex === prev.players.length - 1;
        if (isLastPlayer) {
            // Skift til MYTHOS fase
            addToLog("Et gufs av ondskap stryker over byen... (Mythos Phase)");
            return {
                ...prev,
                phase: GamePhase.MYTHOS,
                activePlayerIndex: 0,
                players: prev.players.map(p => ({ ...p, actions: 2 })) // Reset actions for neste runde
            };
        }
        return { ...prev, activePlayerIndex: prev.activePlayerIndex + 1 };
    });

    // Simulert Mythos fase for nå
    setTimeout(() => {
        setState(prev => {
            if (prev.phase === GamePhase.MYTHOS) {
                addToLog(`Runde ${prev.round + 1} starter.`);
                return { ...prev, phase: GamePhase.INVESTIGATOR, round: prev.round + 1 };
            }
            return prev;
        });
    }, 2000);
  };

  const spawnRoom = useCallback((q: number, r: number, tileSet: string) => {
      const isConnector = Math.random() > 0.6; 
      const pool = isConnector ? OUTDOOR_CONNECTORS : OUTDOOR_LOCATIONS;
      const roomName = pool[Math.floor(Math.random() * pool.length)];
      
      const newTile: Tile = {
          id: `tile-${Date.now()}-${Math.random()}`,
          q, r,
          name: roomName,
          type: isConnector ? 'street' : 'room',
          explored: true,
          searchable: !isConnector,
          searched: false
      };

      setState(prev => ({ ...prev, board: [...prev.board, newTile] }));
      addToLog(`Du oppdaget: ${roomName}`);
  }, []);

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.actions <= 0 || activePlayer.isDead || state.phase !== GamePhase.INVESTIGATOR) return;
    
    if (actionType === 'move') {
        const { q, r } = payload;
        const exists = state.board.find(t => t.q === q && t.r === r);
        if (!exists) spawnRoom(q, r, 'outdoor');

        setState(prev => ({ 
            ...prev, 
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? { 
                ...p, 
                position: { q, r }, 
                actions: p.actions - 1 
            } : p) 
        }));
    }

    if (actionType === 'rest') {
        setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                ...p,
                hp: Math.min(p.maxHp, p.hp + 1),
                actions: p.actions - 1
            } : p)
        }));
        addToLog("Du hviler og henter deg inn.");
    }
  };

  const handleStartNewGame = (charType: CharacterType) => {
    const char = CHARACTERS[charType];
    const startPlayer: Player = {
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
    
    setState({
        ...DEFAULT_STATE,
        players: [startPlayer],
        phase: GamePhase.INVESTIGATOR,
        board: [{ ...START_TILE, id: 'start' }],
        log: [`Velkommen, ${char.name}. Etterforskningen begynner.`]
    });
    setIsMainMenuOpen(false);
  };

  return (
    <div className={`h-full w-full bg-[#05050a] text-slate-200 overflow-hidden relative ${state.screenShake ? 'animate-shake' : ''}`}>
      {isMainMenuOpen && (
        <MainMenu 
            onNewGame={handleStartNewGame} 
            onContinue={() => setIsMainMenuOpen(false)} 
            onOptions={() => setShowOptions(true)} 
            canContinue={state.players.length > 0} 
            version={APP_VERSION} 
        />
      )}

      {!isMainMenuOpen && (
        <>
          <GameBoard 
            tiles={state.board} 
            players={state.players} 
            enemies={state.enemies} 
            onTileClick={(q, r) => handleAction('move', { q, r })} 
            doom={state.doom} 
            activeModifiers={state.activeModifiers} 
          />

          <TurnNotification player={state.players[state.activePlayerIndex]} phase={state.phase} />

          {/* Side Panels */}
          <div className={`fixed left-0 top-0 bottom-0 w-80 z-[60] transition-transform duration-500 shadow-2xl ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}`}>
            <CharacterPanel 
                player={state.players[state.activePlayerIndex]} 
                allPlayers={state.players} 
                onTrade={() => {}} 
                onDrop={() => {}} 
            />
          </div>

          <div className={`fixed right-0 top-0 bottom-0 w-80 z-[60] transition-transform duration-500 shadow-2xl ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}`}>
            <LogPanel logs={state.log} onClose={() => setShowRightPanel(false)} />
          </div>

          <footer className="fixed bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-4 z-50 bg-gradient-to-t from-black to-transparent">
              <ActionBar 
                  onAction={(type) => type === 'end_turn' ? handleEndTurn() : handleAction(type)} 
                  actionsRemaining={state.players[state.activePlayerIndex]?.actions || 0} 
                  isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
                  spells={[]} 
                  activeSpell={null} 
                  onToggleCharacter={() => setShowLeftPanel(!showLeftPanel)} 
                  showCharacter={showLeftPanel} 
                  onToggleInfo={() => setShowRightPanel(!showRightPanel)} 
                  showInfo={showRightPanel} 
              />
              <button 
                onClick={handleEndTurn}
                className="bg-[#e94560] px-4 py-2 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#c9354d] transition-colors"
              >
                End Turn
              </button>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
