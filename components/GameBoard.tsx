
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Tile, Player, Enemy, FloatingText } from '../types';
import { 
  User, Skull, DoorOpen, EyeOff, Target, Eye, Lock, Flame, Hammer, Ban,
  BookOpen, Trees, Anchor, Church, Building2, BedDouble, TestTube, Box, Ghost,
  Library, Archive, FileText
} from 'lucide-react';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  enemies: Enemy[];
  selectedEnemyId?: string | null;
  onTileClick: (q: number, r: number) => void;
  onEnemyClick?: (id: string) => void;
  onEnemyHover?: (id: string | null) => void;
  enemySightMap?: Set<string>;
  floatingTexts?: FloatingText[];
}

const HEX_SIZE = 95;
const VISIBILITY_RANGE = 2;

// --- VISUAL HELPERS ---
const getTileVisuals = (name: string, type: 'building' | 'room' | 'street') => {
  const n = name.toLowerCase();
  
  // 1. WOOD FLOOR (Manors, Libraries, Old Houses)
  if (n.includes('library') || n.includes('study') || n.includes('manor') || n.includes('hall') || n.includes('attic') || n.includes('servant')) {
    return {
      bg: 'bg-[#2a1d18]',
      style: {
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(0,0,0,0.3) 19px, rgba(0,0,0,0.3) 20px)'
      },
      borderColor: 'border-[#4a3627]',
      Icon: BookOpen,
      iconColor: 'text-amber-900'
    };
  }

  // 2. COLD TILES (Hospitals, Asylums, Labs)
  if (n.includes('hospital') || n.includes('asylum') || n.includes('sanitarium') || n.includes('morgue') || n.includes('lab')) {
    return {
      bg: 'bg-[#e2e8f0]', // Light slate
      style: {
        backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1), linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        filter: 'brightness(0.6) sepia(0.2)'
      },
      borderColor: 'border-slate-400',
      Icon: TestTube,
      iconColor: 'text-slate-400'
    };
  }

  // 3. RITUAL / RELIGIOUS (Church, Crypt, Altar)
  if (n.includes('church') || n.includes('crypt') || n.includes('ritual') || n.includes('temple') || n.includes('altar')) {
    return {
      bg: 'bg-[#1a0505]',
      style: {
        backgroundImage: 'radial-gradient(circle at center, #3f0e0e 0%, transparent 70%)'
      },
      borderColor: 'border-red-900',
      Icon: Church,
      iconColor: 'text-red-900'
    };
  }

  // 4. INDUSTRIAL / STORAGE (Warehouse, Boiler Room, Factory)
  if (n.includes('warehouse') || n.includes('boiler') || n.includes('factory') || n.includes('station')) {
    return {
      bg: 'bg-[#1c1917]',
      style: {
        backgroundImage: 'repeating-linear-gradient(45deg, #292524 0, #292524 5px, #1c1917 5px, #1c1917 10px)'
      },
      borderColor: 'border-stone-600',
      Icon: Box,
      iconColor: 'text-stone-700'
    };
  }

  // 5. NATURE / SWAMP (Swamp, Forest, Park, Garden)
  if (n.includes('swamp') || n.includes('forest') || n.includes('park') || n.includes('garden') || n.includes('graveyard')) {
    return {
      bg: 'bg-[#06180e]',
      style: {
        backgroundImage: 'radial-gradient(circle at 20% 80%, #14532d 0%, transparent 40%), radial-gradient(circle at 80% 20%, #064e3b 0%, transparent 40%)'
      },
      borderColor: 'border-green-900',
      Icon: n.includes('graveyard') ? Skull : Trees,
      iconColor: 'text-green-900'
    };
  }

  // 6. WATER / DOCKS (Docks, River, Pier, Bridge)
  if (n.includes('dock') || n.includes('river') || n.includes('pier') || n.includes('bridge')) {
    return {
      bg: 'bg-[#0f172a]',
      style: {
        backgroundImage: 'repeating-radial-gradient(circle at 50% 100%, #1e293b 0, #0f172a 10px)'
      },
      borderColor: 'border-cyan-900',
      Icon: Anchor,
      iconColor: 'text-cyan-900'
    };
  }

  // 7. STREET / URBAN (Street, Square, Alley)
  if (type === 'street' || n.includes('street') || n.includes('square') || n.includes('alley')) {
    return {
      bg: 'bg-[#1e293b]',
      style: {
        backgroundImage: 'linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px)',
        backgroundSize: '58px 58px'
      },
      borderColor: 'border-slate-600',
      Icon: Building2,
      iconColor: 'text-slate-700'
    };
  }

  // 8. GENERIC ROOM
  return {
    bg: 'bg-[#171717]',
    style: {},
    borderColor: 'border-neutral-700',
    Icon: Ghost, // Generic mysterious icon
    iconColor: 'text-neutral-800'
  };
};

const GameBoard: React.FC<GameBoardProps> = ({ 
  tiles, 
  players, 
  enemies, 
  selectedEnemyId,
  onTileClick, 
  onEnemyClick,
  onEnemyHover,
  enemySightMap,
  floatingTexts = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setPosition({ x: width / 2, y: height / 2 });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.3), 1.5));
  };

  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  const getDistance = (q1: number, r1: number, q2: number, r2: number) => {
    return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
  };

  const visibleTiles = useMemo(() => {
    const visible = new Set<string>();
    players.filter(p => !p.isDead).forEach(p => {
      tiles.forEach(t => {
        if (getDistance(p.position.q, p.position.r, t.q, t.r) <= VISIBILITY_RANGE) {
          visible.add(`${t.q},${t.r}`);
        }
      });
    });
    return visible;
  }, [players, tiles]);

  const possibleMoves = useMemo(() => {
    const moves: { q: number, r: number }[] = [];
    tiles.forEach(tile => {
      if (visibleTiles.has(`${tile.q},${tile.r}`)) {
        const neighbors = [
          { q: tile.q + 1, r: tile.r }, { q: tile.q + 1, r: tile.r - 1 }, { q: tile.q, r: tile.r - 1 },
          { q: tile.q - 1, r: tile.r }, { q: tile.q - 1, r: tile.r + 1 }, { q: tile.q, r: tile.r + 1 }
        ];
        neighbors.forEach(neighbor => {
          if (!tiles.find(t => t.q === neighbor.q && t.r === neighbor.r) &&
              !moves.find(m => m.q === neighbor.q && m.r === neighbor.r)) {
            moves.push(neighbor);
          }
        });
      }
    });
    return moves;
  }, [tiles, visibleTiles]);

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full relative overflow-hidden bg-[#05050a] cursor-move ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>

      <div 
        className="absolute transition-transform duration-100 ease-out"
        style={{ 
          left: position.x, 
          top: position.y, 
          transform: `scale(${scale})`
        }}
      >
        {/* Ghost Tiles (Possible Movement) */}
        {possibleMoves.map((pos, idx) => {
          const { x, y } = hexToPixel(pos.q, pos.r);
          return (
            <div 
              key={`ghost-${idx}`}
              onClick={(e) => { e.stopPropagation(); onTileClick(pos.q, pos.r); }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[180px] h-[156px] hex-clip border-2 border-dashed border-slate-700 bg-black/20 hover:border-[#e94560] hover:bg-[#e94560]/5 transition-all cursor-pointer flex flex-col items-center justify-center group z-0 backdrop-blur-sm"
              style={{ left: x, top: y }}
            >
              <DoorOpen className="opacity-0 group-hover:opacity-100 transition-opacity text-[#e94560] mb-1" size={24} />
              <span className="opacity-0 group-hover:opacity-100 text-[10px] uppercase tracking-widest text-[#e94560] font-bold">Utforsk</span>
            </div>
          );
        })}

        {/* Active Tiles */}
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const isVisible = visibleTiles.has(`${tile.q},${tile.r}`);
          const isThreatened = enemySightMap?.has(`${tile.q},${tile.r}`);
          const isBlocking = tile.object?.blocking;
          
          const visuals = getTileVisuals(tile.name, tile.type);

          return (
            <div 
              key={tile.id}
              onClick={() => onTileClick(tile.q, tile.r)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[180px] h-[156px] hex-clip transition-all duration-700"
              style={{ 
                left: x, 
                top: y,
                filter: isVisible ? 'none' : isThreatened ? 'brightness(0.6) grayscale(0.8)' : 'brightness(0.15) grayscale(0.9) blur(1px)'
              }}
            >
              <div 
                className={`
                  w-full h-full flex flex-col items-center justify-center p-6 text-center border-4 relative overflow-hidden
                  ${isThreatened ? 'border-red-500 shadow-[inset_0_0_50px_rgba(220,38,38,0.4)] z-10' : visuals.borderColor}
                  ${visuals.bg}
                  transition-all duration-300
                `}
                style={isThreatened ? {} : visuals.style}
              >
                 {/* Background Watermark Icon */}
                 <visuals.Icon 
                    size={80} 
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none ${visuals.iconColor}`} 
                    strokeWidth={1}
                 />

                 {/* Content */}
                 <div className="relative z-10 bg-black/60 px-2 py-1 rounded backdrop-blur-[2px]">
                    <h4 className={`text-[10px] font-bold font-display italic tracking-tight ${isThreatened ? 'text-red-300' : 'text-slate-200'}`}>{tile.name}</h4>
                 </div>
                
                {/* OBSTACLE & CONTAINER RENDERING */}
                {tile.object && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300 mt-2 relative z-20">
                        {/* BLOCKERS */}
                        {isBlocking && (
                          <>
                            {tile.object.type === 'locked_door' && <Lock size={20} className="text-amber-500 mb-1 drop-shadow-md" />}
                            {tile.object.type === 'rubble' && <Hammer size={20} className="text-stone-400 mb-1 drop-shadow-md" />}
                            {tile.object.type === 'fire' && <Flame size={20} className="text-orange-500 mb-1 animate-pulse drop-shadow-md" />}
                            {tile.object.type === 'barricade' && <Ban size={20} className="text-amber-700 mb-1 drop-shadow-md" />}
                            <span className="text-[8px] uppercase font-bold text-white bg-red-900/80 px-2 py-0.5 rounded shadow-sm border border-red-700">
                                {tile.object.type === 'locked_door' ? 'LÅST' : tile.object.type === 'rubble' ? 'RUBBEL' : 'HINDER'}
                            </span>
                          </>
                        )}

                        {/* SEARCHABLES */}
                        {!isBlocking && (
                          <div className={`transition-all ${tile.object.searched ? 'opacity-40 grayscale' : 'opacity-100'}`}>
                             {tile.object.type === 'bookshelf' && <Library size={24} className="text-amber-200 mb-1 drop-shadow-md" />}
                             {tile.object.type === 'chest' && <Archive size={24} className="text-yellow-400 mb-1 drop-shadow-md" />}
                             {tile.object.type === 'crate' && <Box size={24} className="text-amber-600 mb-1 drop-shadow-md" />}
                             {tile.object.type === 'cabinet' && <FileText size={24} className="text-stone-300 mb-1 drop-shadow-md" />}
                             {!tile.object.searched && (
                               <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                             )}
                          </div>
                        )}
                    </div>
                )}

                {isThreatened && (
                    <div className="absolute top-3 right-3 text-red-500 animate-pulse z-20">
                        <Eye size={16} />
                    </div>
                )}
              </div>
              
              {!isVisible && !isThreatened && (
                 <div className="absolute inset-0 bg-black/40 mix-blend-multiply pointer-events-none flex items-center justify-center">
                    <EyeOff size={24} className="text-slate-500 opacity-20" />
                 </div>
              )}
            </div>
          );
        })}

        {enemies.map(enemy => {
          const { x, y } = hexToPixel(enemy.position.q, enemy.position.r);
          const isVisible = visibleTiles.has(`${enemy.position.q},${enemy.position.r}`);
          const isSelected = selectedEnemyId === enemy.id;
          
          if (!isVisible) return null;

          return (
            <div 
              key={enemy.id} 
              className={`
                 absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-crosshair group 
                 ${enemy.isDying ? 'death-dissolve pointer-events-none' : ''}
              `}
              style={{ left: x, top: y + 25 }}
              onClick={(e) => { e.stopPropagation(); onEnemyClick?.(enemy.id); }}
              onMouseEnter={() => onEnemyHover?.(enemy.id)}
              onMouseLeave={() => onEnemyHover?.(null)}
            >
               <div className={`
                 w-14 h-14 bg-black/90 rounded-full flex items-center justify-center border-2 transition-all duration-300
                 ${isSelected ? 'border-purple-400 scale-125 shadow-[0_0_30px_rgba(168,85,247,0.8)]' : 'border-purple-600/60 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 group-hover:border-purple-400'}
                 ${!enemy.isDying && 'animate-spooky-pulse'}
               `}>
                  <Skull size={24} className={`${isSelected ? 'text-purple-300' : 'text-purple-500'}`} />
                  {isSelected && !enemy.isDying && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1 border border-white shadow-lg animate-bounce">
                      <Target size={12} className="text-white" />
                    </div>
                  )}
               </div>
               {!enemy.isDying && (
                <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-black/80 border border-purple-500/30 rounded text-[9px] uppercase tracking-widest text-purple-300 font-bold transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    {enemy.name}
                </div>
               )}
            </div>
          );
        })}

        {players.map((player) => {
          const { x, y } = hexToPixel(player.position.q, player.position.r);
          const isCurrent = player.actions > 0 && !player.isDead;
          return (
            <div key={player.id} className="absolute -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-700 pointer-events-none" style={{ left: x, top: y }}>
              <div className="relative flex flex-col items-center">
                <div className={`
                  w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all 
                  ${player.isDead ? 'bg-slate-900 border-slate-700 grayscale opacity-40 scale-75 shadow-none' : 
                    isCurrent ? 'bg-[#e94560] border-white scale-110 shadow-[0_0_30px_rgba(233,69,96,0.6)]' : 
                    'bg-slate-800 border-slate-600 scale-90 opacity-80'}
                `}>
                  {player.isDead ? <Skull size={24} className="text-slate-600" /> : <User size={30} className="text-white" />}
                </div>
                {!player.isDead && (
                  <div className="mt-1 flex gap-0.5 w-12">
                     <div className="h-1 bg-red-600 rounded-full flex-1" style={{ width: `${(player.hp/player.maxHp)*100}%` }}></div>
                     <div className="h-1 bg-purple-600 rounded-full flex-1" style={{ width: `${(player.sanity/player.maxSanity)*100}%` }}></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* FLOATING TEXTS */}
        {floatingTexts.map(ft => {
            const { x, y } = hexToPixel(ft.q, ft.r);
            return (
                <div 
                    key={ft.id} 
                    className="absolute z-50 pointer-events-none animate-float-up"
                    style={{ 
                        left: x + (ft.randomOffset?.x || 0), 
                        top: y + (ft.randomOffset?.y || 0) 
                    }}
                >
                    <div className={`text-3xl font-bold ${ft.colorClass} drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-display stroke-black text-stroke-sm`}>
                        {ft.content}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
