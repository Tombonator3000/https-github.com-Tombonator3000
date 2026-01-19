
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, EnemyType, GameSettings, TileObject, ScenarioModifier } from './types';
import { CHARACTERS, START_TILE, BESTIARY, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS, ITEMS } from './constants';
import GameBoard from './components/GameBoard';
import ActionBar from './components/ActionBar';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import TurnNotification from './components/TurnNotification'; 
import PuzzleModal from './components/PuzzleModal';
import CharacterPanel from './components/CharacterPanel';
import LogPanel from './components/LogPanel';
import DiceRoller from './components/DiceRoller';
import { loadSettings } from './utils/Settings';

const STORAGE_KEY = 'shadows_1920s_save_v4';
const APP_VERSION = "3.10.40"; 

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
    setState(prev => ({ ...prev, log: [msg, ...prev.log].slice(0, 50) }));
  };

  const spawnRoom = useCallback((q: number, r: number) => {
      const isConnector = Math.random() > 0.7; 
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
    if (!activePlayer || state.phase !== GamePhase.INVESTIGATOR || activePlayer.actions <= 0) return;

    if (actionType === 'move') {
        const { q, r } = payload;
        // Sjekk om flisen finnes, hvis ikke generer den
        const exists = state.board.find(t => t.q === q && t.r === r);
        if (!exists) spawnRoom(q, r);

        setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                ...p,
                position: { q, r },
                actions: p.actions - 1
            } : p)
        }));
    }

    if (actionType === 'investigate') {
        const dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        setState(prev => ({ ...prev, lastDiceRoll: dice }));
        
        const success = dice.some(v => v >= 5);
        if (success) {
            const foundItem = ITEMS[Math.floor(Math.random() * ITEMS.length)];
            addToLog(`Suksess! Du fant: ${foundItem.name}`);
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                    ...p,
                    inventory: [...p.inventory, foundItem].slice(0, 6),
                    actions: p.actions - 1
                } : p)
            }));
        } else {
            addToLog("Du lette overalt, men fant ingenting av verdi.");
            setState(prev => ({
                ...prev,
                players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                    ...p,
                    actions: p.actions - 1
                } : p)
            }));
        }
    }

    if (actionType === 'rest') {
        addToLog("Du tar en pust i bakken for å roe nervene.");
        setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                ...p,
                hp: Math.min(p.maxHp, p.hp + 1),
                sanity: Math.min(p.maxSanity, p.sanity + 1),
                actions: p.actions - 1
            } : p)
        }));
    }
  };

  const handleEndTurn = () => {
    if (state.phase !== GamePhase.INVESTIGATOR) return;
    
    addToLog("Et gufs av ondskap stryker over byen...");
    setState(prev => ({
        ...prev,
        phase: GamePhase.MYTHOS,
        players: prev.players.map(p => ({ ...p, actions: 2 }))
    }));

    // Mythos logic simulation
    setTimeout(() => {
        setState(prev => ({
            ...prev,
            phase: GamePhase.INVESTIGATOR,
            round: prev.round + 1,
            doom: Math.max(0, prev.doom - 1)
        }));
        addToLog(`Runde ${state.round + 1} begynner.`);
    }, 2000);
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
        activeModifiers: [SCENARIO_MODIFIERS[0]],
        log: [`Velkommen, ${char.name}. Etterforskningen i Arkham begynner.`]
    });
    setIsMainMenuOpen(false);
  };

  return (
    <div className="h-full w-full bg-[#05050a] text-slate-200 overflow-hidden relative">
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

          {/* Sidebar UI */}
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

          {/* Action Bar */}
          <footer className="fixed bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-4 z-50 bg-gradient-to-t from-black to-transparent">
              <ActionBar 
                  onAction={(type) => {
                      if (type === 'end_turn') handleEndTurn();
                      else handleAction(type);
                  }} 
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
                className="bg-[#e94560] px-6 py-3 rounded-xl border border-white/20 font-bold uppercase tracking-widest text-xs hover:bg-[#c9354d] transition-all shadow-lg active:scale-95"
              >
                End Turn
              </button>
          </footer>

          {state.lastDiceRoll && (
              <DiceRoller values={state.lastDiceRoll} onComplete={() => setState(prev => ({ ...prev, lastDiceRoll: null }))} />
          )}

          {showOptions && (
              <OptionsMenu 
                onClose={() => setShowOptions(false)} 
                onResetData={() => { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }}
                onUpdateSettings={setGameSettings}
                onAssetsUpdated={() => {}}
              />
          )}
        </>
      )}
    </div>
  );
};

export default App;
