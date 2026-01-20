
import React, { useState, useEffect, useCallback } from 'react';
import { GamePhase, GameState, Player, Tile, CharacterType, Enemy, EnemyType, GameSettings, TileObject, ScenarioModifier, Item } from './types';
import { CHARACTERS, START_TILE, BESTIARY, INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, INDOOR_CONNECTORS, OUTDOOR_CONNECTORS, SCENARIO_MODIFIERS, ITEMS, SCENARIOS } from './constants';
import GameBoard from './components/GameBoard';
import ActionBar from './components/ActionBar';
import MainMenu from './components/MainMenu';
import OptionsMenu from './components/OptionsMenu';
import TurnNotification from './components/TurnNotification'; 
import PuzzleModal from './components/PuzzleModal';
import CharacterPanel from './components/CharacterPanel';
import LogPanel from './components/LogPanel';
import DiceRoller from './components/DiceRoller';
import JournalModal from './components/JournalModal';
import { loadSettings } from './utils/Settings';

const STORAGE_KEY = 'shadows_1920s_save_v4';
const APP_VERSION = "3.15.0"; 

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

// Neighbor directions for flat-top hexes
const HEX_DIRECTIONS = [
    { q: 1, r: -1 }, // 0: Top-Right
    { q: 1, r: 0 },  // 1: Right
    { q: 0, r: 1 },  // 2: Bottom-Right
    { q: -1, r: 1 }, // 3: Bottom-Left
    { q: -1, r: 0 }, // 4: Left
    { q: 0, r: -1 }  // 5: Top-Left
];

const App: React.FC = () => {
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
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

  const spawnEnemy = useCallback((type: EnemyType, q: number, r: number) => {
      const info = BESTIARY[type];
      const newEnemy: Enemy = {
          id: `enemy-${Date.now()}-${Math.random()}`,
          name: info.name,
          type: type,
          hp: info.hp,
          maxHp: info.hp,
          damage: info.damage,
          horror: info.horror,
          speed: 1,
          position: { q, r },
          visionRange: 3,
          attackRange: 1,
          attackType: 'melee',
          traits: info.traits
      };
      
      setState(prev => ({ 
          ...prev, 
          enemies: [...prev.enemies, newEnemy],
          encounteredEnemies: prev.encounteredEnemies.includes(type) 
            ? prev.encounteredEnemies 
            : [...prev.encounteredEnemies, type]
      }));
  }, []);

  const spawnRoom = useCallback((q: number, r: number, fromCoord?: { q: number, r: number }) => {
      const isConnector = Math.random() > 0.7; 
      const pool = isConnector ? OUTDOOR_CONNECTORS : OUTDOOR_LOCATIONS;
      const roomName = pool[Math.floor(Math.random() * pool.length)];
      
      let object: TileObject | undefined = undefined;
      const rand = Math.random();
      
      if (!isConnector) {
          if (rand > 0.96) {
              object = { type: 'radio', searched: false };
          } else if (rand > 0.92) {
              object = { type: 'switch', activated: false, searched: false };
          } else if (rand > 0.88) {
              object = { type: 'mirror', activated: false, searched: false };
          } else if (rand > 0.82) {
              object = { type: 'fog_wall', blocking: true, searched: false };
          } else if (rand > 0.75) {
              object = { type: 'locked_door', blocking: true, searched: false, puzzleType: 'sequence', difficulty: 3 };
          }
      }

      // Generate walls (dead ends)
      // Connectors have more open sides than locations
      const openCount = isConnector ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 3);
      const walls = Array(6).fill(true);
      let indices = [0, 1, 2, 3, 4, 5];
      
      // Ensure the side we came from is always open
      if (fromCoord) {
          const dq = q - fromCoord.q;
          const dr = r - fromCoord.r;
          const enteringIndex = HEX_DIRECTIONS.findIndex(d => d.q === -dq && d.r === -dr);
          if (enteringIndex !== -1) {
              walls[enteringIndex] = false;
              indices = indices.filter(i => i !== enteringIndex);
          }
      } else {
          // If no fromCoord, pick a random starting open side
          const startOpen = Math.floor(Math.random() * 6);
          walls[startOpen] = false;
          indices = indices.filter(i => i !== startOpen);
      }

      // Open other random sides
      for (let i = 0; i < openCount - 1; i++) {
          if (indices.length === 0) break;
          const randIdx = Math.floor(Math.random() * indices.length);
          const wallIdx = indices[randIdx];
          walls[wallIdx] = false;
          indices.splice(randIdx, 1);
      }

      const newTile: Tile = {
          id: `tile-${Date.now()}-${Math.random()}`,
          q, r,
          name: roomName,
          type: isConnector ? 'street' : 'room',
          explored: true,
          searchable: !isConnector,
          searched: false,
          object,
          walls
      };

      setState(prev => ({ ...prev, board: [...prev.board, newTile] }));
      addToLog(`Utforsket: ${roomName}${object ? ' (Noe virker merkelig her...)' : ''}`);

      if (!isConnector && Math.random() > 0.85) {
          const types: EnemyType[] = ['cultist', 'ghoul', 'deepone', 'shade', 'dimensional_shambler', 'nightgaunt'];
          const randomType = types[Math.floor(Math.random() * types.length)];
          setTimeout(() => spawnEnemy(randomType, q, r), 500);
          addToLog(`En skikkelse beveger seg i skyggene av ${roomName}!`);
      }
  }, [spawnEnemy]);

  // Handle dropping an item from the investigator's inventory
  const handleDropItem = (item: Item) => {
    setState(prev => ({
        ...prev,
        players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
            ...p,
            inventory: p.inventory.filter(it => it.id !== item.id)
        } : p)
    }));
    addToLog(`You dropped: ${item.name}`);
  };

  // Handle using a consumable item from the investigator's inventory
  const handleUseItem = (item: Item) => {
    const p = state.players[state.activePlayerIndex];
    if (!p) return;

    let hpChange = 0;
    let sanChange = 0;

    // Apply specific item effects
    if (item.id === 'med') hpChange = 2;
    if (item.id === 'whiskey') sanChange = 2;

    setState(prev => ({
        ...prev,
        players: prev.players.map((pl, i) => i === prev.activePlayerIndex ? {
            ...pl,
            hp: Math.min(pl.maxHp, pl.hp + hpChange),
            sanity: Math.min(pl.maxSanity, pl.sanity + sanChange),
            inventory: pl.inventory.filter(it => it.id !== item.id)
        } : pl)
    }));
    addToLog(`You used ${item.name}.`);
  };

  const handleAction = (actionType: string, payload?: any) => {
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || state.phase !== GamePhase.INVESTIGATOR || activePlayer.actions <= 0) return;

    if (actionType === 'move') {
        const { q, r } = payload;
        const currentTile = state.board.find(t => t.q === activePlayer.position.q && t.r === activePlayer.position.r);
        const targetTile = state.board.find(t => t.q === q && t.r === r);
        
        // Check connectivity if moving between existing tiles
        if (currentTile && targetTile) {
            const dq = q - currentTile.q;
            const dr = r - currentTile.r;
            const sideIndex = HEX_DIRECTIONS.findIndex(d => d.q === dq && d.r === dr);
            const oppositeSideIndex = HEX_DIRECTIONS.findIndex(d => d.q === -dq && d.r === -dr);

            if (currentTile.walls?.[sideIndex]) {
                addToLog("Du ser en vegg foran deg. Denne veien er stengt.");
                return;
            }
            if (targetTile.walls?.[oppositeSideIndex]) {
                addToLog("Vei blokkert fra den andre siden!");
                return;
            }
        } else if (currentTile && !targetTile) {
            // Check if exiting the current tile is allowed
            const dq = q - currentTile.q;
            const dr = r - currentTile.r;
            const sideIndex = HEX_DIRECTIONS.findIndex(d => d.q === dq && d.r === dr);
            if (currentTile.walls?.[sideIndex]) {
                addToLog("En massiv mur stanser din ferd her.");
                return;
            }
        }

        if (targetTile?.object?.blocking) {
            addToLog(`Vei sperret av ${targetTile.object.type.replace('_', ' ')}! Du må fjerne den først.`);
            return;
        }

        if (!targetTile) spawnRoom(q, r, activePlayer.position);

        setState(prev => ({
            ...prev,
            players: prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                ...p,
                position: { q, r },
                actions: p.actions - 1
            } : p)
        }));
    }

    if (actionType === 'interact') {
        const p = state.players[state.activePlayerIndex];
        const tile = state.board.find(t => t.q === p.position.q && t.r === p.position.r);
        
        if (tile?.object) {
            const obj = tile.object;
            let hpChange = 0;
            let sanChange = 0;
            let insChange = 0;
            let globalClearFog = false;
            let removeObject = false;
            let actionCost = 1;

            const roll = Math.floor(Math.random() * 6) + 1;
            setState(prev => ({ ...prev, lastDiceRoll: [roll] }));

            switch(obj.type) {
                case 'radio':
                    if (roll === 6) {
                        addToLog("Radioen fanger opp 'Sannheten'. Du hører stemmer fra det ytre rom.");
                        insChange = 3;
                        sanChange = -1;
                    } else if (roll >= 3) {
                        addToLog("Bunnløs statisk støy fyller rommet. Du føler deg uvel.");
                        sanChange = -1;
                    } else {
                        addToLog("Radioen skriker av eldgammel smerte før den brenner ut.");
                        sanChange = -2;
                    }
                    removeObject = true;
                    break;

                case 'switch':
                    addToLog("Du legger over den tunge kobberbryteren. Strømmen suser gjennom veggene!");
                    globalClearFog = true;
                    sanChange = 1;
                    removeObject = true; 
                    break;

                case 'mirror':
                    if (roll === 6) {
                        addToLog("Speilbildet ditt hvisker hemmeligheter om fremtiden.");
                        insChange = 2;
                        sanChange = 1;
                    } else if (roll === 1) {
                        addToLog("Noe kryper UT av speilet! En skygge tar form!");
                        spawnEnemy('hound', p.position.q, p.position.r);
                        sanChange = -2;
                    } else {
                        addToLog("Du ser deg selv råtne i speilet. Forstanden din vakler.");
                        sanChange = -1;
                    }
                    removeObject = true;
                    break;

                case 'fog_wall':
                    if (roll >= 4) {
                        addToLog("Du klarer å mane bort tåken med ren viljestyrke.");
                        removeObject = true;
                    } else {
                        addToLog("Tåken er for tett! Du mister orienteringen og blir skremt.");
                        sanChange = -1;
                        removeObject = false; 
                    }
                    break;

                case 'locked_door':
                    if (obj.puzzleType === 'sequence') {
                        setState(prev => ({ ...prev, activePuzzle: { type: 'sequence', difficulty: obj.difficulty || 3, targetTileId: tile.id } }));
                        return; 
                    }
                    break;

                default:
                    addToLog(`Du undersøker ${obj.type}, men ingenting skjer.`);
                    actionCost = 0;
            }

            setState(prev => ({
                ...prev,
                board: prev.board.map(t => {
                    if (globalClearFog && t.object?.type === 'fog_wall') {
                        return { ...t, object: undefined };
                    }
                    if (t.id === tile.id && removeObject) {
                        return { ...t, object: undefined };
                    }
                    return t;
                }),
                players: prev.players.map((pl, i) => i === prev.activePlayerIndex ? {
                    ...pl,
                    hp: Math.max(0, Math.min(pl.maxHp, pl.hp + hpChange)),
                    sanity: Math.max(0, Math.min(pl.maxSanity, pl.sanity + sanChange)),
                    insight: pl.insight + insChange,
                    actions: pl.actions - actionCost
                } : pl)
            }));
        }
    }

    if (actionType === 'investigate') {
        const dice = [Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1];
        setState(prev => ({ ...prev, lastDiceRoll: dice }));
        
        const success = dice.some(v => v >= 5);
        if (success) {
            let foundItem: Item;
            
            const currentScenario = state.activeScenario;
            const questStep = currentScenario?.steps.find(s => s.type === 'find_item' && !s.completed);
            
            if (questStep && Math.random() > 0.6) {
                foundItem = ITEMS.find(it => it.id === questStep.targetId) || ITEMS[Math.floor(Math.random() * ITEMS.length)];
            } else {
                foundItem = ITEMS.filter(it => !it.isQuestItem)[Math.floor(Math.random() * (ITEMS.length - 2))];
            }

            if (activePlayer.inventory.length >= 6) {
                addToLog(`Lommene dine er fulle! Du ser ${foundItem.name}, men kan ikke bære den.`);
            } else {
                addToLog(`Suksess! Du fant: ${foundItem.name}`);
                
                setState(prev => {
                    const newPlayers = prev.players.map((p, i) => i === prev.activePlayerIndex ? {
                        ...p,
                        inventory: [...p.inventory, foundItem],
                        actions: p.actions - 1
                    } : p);

                    const newQuestItems = foundItem.isQuestItem && !prev.questItemsCollected.includes(foundItem.id) 
                        ? [...prev.questItemsCollected, foundItem.id] 
                        : prev.questItemsCollected;

                    let newScenario = prev.activeScenario;
                    if (newScenario && foundItem.isQuestItem) {
                        newScenario = {
                            ...newScenario,
                            steps: newScenario.steps.map(s => s.targetId === foundItem.id ? { ...s, completed: true } : s)
                        };
                    }

                    return {
                        ...prev,
                        players: newPlayers,
                        questItemsCollected: newQuestItems,
                        activeScenario: newScenario
                    };
                });
            }
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
        board: [{ ...START_TILE, id: 'start', walls: [false, false, false, false, false, false] }],
        activeModifiers: [SCENARIO_MODIFIERS[0]],
        activeScenario: SCENARIOS[0],
        log: [`Velkommen, ${char.name}. Etterforskningen i Arkham begynner.`]
    });
    setIsMainMenuOpen(false);
  };

  const activeTile = state.board.find(t => t.q === state.players[state.activePlayerIndex]?.position.q && t.r === state.players[state.activePlayerIndex]?.position.r);

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
            screenShake={state.screenShake}
          />

          <TurnNotification player={state.players[state.activePlayerIndex]} phase={state.phase} />

          <div className={`fixed left-0 top-0 bottom-0 w-80 z-[60] transition-transform duration-500 shadow-2xl ${showLeftPanel ? 'translate-x-0' : '-translate-x-full'}`}>
            <CharacterPanel 
                player={state.players[state.activePlayerIndex]} 
                allPlayers={state.players} 
                onTrade={() => {}} 
                onDrop={handleDropItem}
                onUse={handleUseItem}
            />
          </div>

          <div className={`fixed right-0 top-0 bottom-0 w-80 z-[60] transition-transform duration-500 shadow-2xl ${showRightPanel ? 'translate-x-0' : 'translate-x-full'}`}>
            <LogPanel logs={state.log} onClose={() => setShowRightPanel(false)} />
          </div>

          <footer className="fixed bottom-0 left-0 right-0 h-24 flex items-center justify-center gap-4 z-50 bg-gradient-to-t from-black to-transparent">
              <ActionBar 
                  onAction={(type) => {
                      if (type === 'end_turn') handleEndTurn();
                      else if (type === 'journal') setShowJournal(true);
                      else handleAction(type);
                  }} 
                  actionsRemaining={state.players[state.activePlayerIndex]?.actions || 0} 
                  isInvestigatorPhase={state.phase === GamePhase.INVESTIGATOR} 
                  contextAction={activeTile?.object ? { 
                      id: 'obj', 
                      label: activeTile.object.type.replace('_', ' '), 
                      iconType: activeTile.object.type === 'switch' ? 'agility' : activeTile.object.type === 'fog_wall' ? 'strength' : 'insight', 
                      difficulty: activeTile.object.difficulty || 4 
                  } : null}
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

          {state.activePuzzle && (
                <PuzzleModal 
                    difficulty={state.activePuzzle.difficulty} 
                    onSolve={(success) => {
                        if (success) {
                            addToLog("Låsen klikker opp! Hindringen er borte.");
                            setState(prev => ({
                                ...prev,
                                activePuzzle: null,
                                board: prev.board.map(t => t.id === prev.activePuzzle?.targetTileId ? { ...t, object: undefined } : t)
                            }));
                        } else {
                            addToLog("Du klarte ikke å knekke koden.");
                            setState(prev => ({ ...prev, activePuzzle: null }));
                        }
                    }}
                />
            )}

          {showJournal && (
              <JournalModal unlockedIds={state.encounteredEnemies} onClose={() => setShowJournal(false)} />
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
