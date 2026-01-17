
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Tile, Player, Enemy } from '../types';
import { User, Skull, DoorOpen, EyeOff, Target, Eye, Lock, Flame, Hammer, Ban } from 'lucide-react';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  enemies: Enemy[];
  selectedEnemyId?: string | null;
  onTileClick: (q: number, r: number) => void;
  onEnemyClick?: (id: string) => void;
  onEnemyHover?: (id: string | null) => void;
  enemySightMap?: Set<string>;
}

const HEX_SIZE = 95;
const VISIBILITY_RANGE = 2;

const GameBoard: React.FC<GameBoardProps> = ({ 
  tiles, 
  players, 
  enemies, 
  selectedEnemyId,
  onTileClick, 
  onEnemyClick,
  onEnemyHover,
  enemySightMap
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
        // NOTE: Currently showing 'ghost' neighbors for all visible tiles.
        // The movement restriction logic happens in App.tsx handleAction
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
        {possibleMoves.map((pos, idx) => {
          const { x, y } = hexToPixel(pos.q, pos.r);
          return (
            <div 
              key={`ghost-${idx}`}
              onClick={(e) => { e.stopPropagation(); onTileClick(pos.q, pos.r); }}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[180px] h-[156px] hex-clip border-2 border-slate-900 bg-black/30 hover:border-[#e94560] hover:bg-[#e94560]/5 transition-all cursor-pointer flex flex-col items-center justify-center group z-0"
              style={{ left: x, top: y }}
            >
              <DoorOpen className="opacity-0 group-hover:opacity-100 transition-opacity text-[#e94560] mb-1" size={20} />
            </div>
          );
        })}

        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const isVisible = visibleTiles.has(`${tile.q},${tile.r}`);
          const isThreatened = enemySightMap?.has(`${tile.q},${tile.r}`);
          const isBlocking = tile.object?.blocking;

          return (
            <div 
              key={tile.id}
              onClick={() => onTileClick(tile.q, tile.r)}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-[180px] h-[156px] hex-clip transition-all duration-700"
              style={{ 
                left: x, 
                top: y,
                // If threatened, slightly reveal it even if it's in fog of war, to show the danger
                filter: isVisible ? 'none' : isThreatened ? 'brightness(0.6) grayscale(0.8)' : 'brightness(0.15) grayscale(0.9)'
              }}
            >
              <div className={`
                w-full h-full flex flex-col items-center justify-center p-6 text-center border-2 
                ${isThreatened 
                  ? 'bg-red-900/40 border-red-500 shadow-[inset_0_0_50px_rgba(220,38,38,0.4)] z-10' 
                  : isBlocking 
                    ? 'border-amber-900/50 bg-black/80' 
                    : tile.type === 'street' ? 'border-white/5 bg-[#1e293b]' : 'border-white/5 bg-[#16213e]'}
                transition-all duration-300
              `}>
                <h4 className={`text-[10px] font-bold font-display italic tracking-tight ${isThreatened ? 'text-red-300' : 'text-slate-400'}`}>{tile.name}</h4>
                
                {/* OBSTACLE RENDERING */}
                {isBlocking && tile.object && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        {tile.object.type === 'locked_door' && <Lock size={24} className="text-amber-500 mb-1" />}
                        {tile.object.type === 'rubble' && <Hammer size={24} className="text-slate-500 mb-1" />}
                        {tile.object.type === 'fire' && <Flame size={24} className="text-orange-500 mb-1 animate-pulse" />}
                        {tile.object.type === 'barricade' && <Ban size={24} className="text-amber-700 mb-1" />}
                        <span className="text-[9px] uppercase font-bold text-white bg-black/50 px-2 rounded">
                            {tile.object.type === 'locked_door' ? 'LÅST' : tile.object.type === 'rubble' ? 'RUBBEL' : 'HINDER'}
                        </span>
                    </div>
                )}

                {isThreatened && (
                    <div className="absolute top-3 right-3 text-red-500 animate-pulse">
                        <Eye size={16} />
                    </div>
                )}
              </div>
              
              {!isVisible && !isThreatened && (
                 <div className="absolute inset-0 bg-indigo-950/30 mix-blend-multiply pointer-events-none flex items-center justify-center">
                    <EyeOff size={24} className="text-slate-800 opacity-20" />
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
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-crosshair group"
              style={{ left: x, top: y + 25 }}
              onClick={(e) => { e.stopPropagation(); onEnemyClick?.(enemy.id); }}
              onMouseEnter={() => onEnemyHover?.(enemy.id)}
              onMouseLeave={() => onEnemyHover?.(null)}
            >
               <div className={`
                 w-14 h-14 bg-black/90 rounded-full flex items-center justify-center border-2 transition-all duration-300
                 ${isSelected ? 'border-purple-400 scale-125 shadow-[0_0_30px_rgba(168,85,247,0.8)]' : 'border-purple-600/60 shadow-[0_0_20px_rgba(168,85,247,0.4)] group-hover:scale-110 group-hover:border-purple-400'}
                 animate-spooky-pulse
               `}>
                  <Skull size={24} className={`${isSelected ? 'text-purple-300' : 'text-purple-500'}`} />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-1 border border-white shadow-lg animate-bounce">
                      <Target size={12} className="text-white" />
                    </div>
                  )}
               </div>
               <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-black/80 border border-purple-500/30 rounded text-[9px] uppercase tracking-widest text-purple-300 font-bold transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                 {enemy.name}
               </div>
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
      </div>
    </div>
  );
};

export default GameBoard;
