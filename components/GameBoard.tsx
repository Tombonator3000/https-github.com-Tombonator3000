
import React, { useRef, useState, useEffect } from 'react';
import { Tile, Player, Enemy, ScenarioModifier } from '../types';
import {
  User, MapPin, DoorOpen, BookOpen, Church, Anchor, Building,
  Radio, Power, Eye, CloudFog, Lock, ShieldAlert, Ghost, ZoomIn, ZoomOut, Crosshair
} from 'lucide-react';
import { useTouchGestures, useIsMobile } from '../utils/useMobile';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  enemies: Enemy[];
  onTileClick: (q: number, r: number) => void;
  doom: number;
  activeModifiers?: ScenarioModifier[];
}

// Responsive hex size - smaller on mobile for better overview
const HEX_SIZE_DESKTOP = 110;
const HEX_SIZE_MOBILE = 90;

const getTileVisuals = (name: string, type: 'building' | 'room' | 'street') => {
  const n = name.toLowerCase();
  if (n.includes('station') || n.includes('square')) return { bg: 'bg-[#1e293b]', stroke: '#64748b', Icon: MapPin, color: 'text-slate-400' };
  if (n.includes('hallway') || n.includes('corridor')) return { bg: 'bg-[#1c1917]', stroke: '#44403c', Icon: DoorOpen, color: 'text-stone-500' };
  if (n.includes('library')) return { bg: 'bg-[#451a03]', stroke: '#92400e', Icon: BookOpen, color: 'text-amber-500' };
  if (n.includes('church')) return { bg: 'bg-[#450a0a]', stroke: '#ef4444', Icon: Church, color: 'text-red-600' };
  if (n.includes('dock') || n.includes('river')) return { bg: 'bg-[#172554]', stroke: '#3b82f6', Icon: Anchor, color: 'text-blue-500' };
  
  if (type === 'street') return { bg: 'bg-[#0f172a]', stroke: '#334155', Icon: MapPin, color: 'text-slate-600' };
  return { bg: 'bg-[#262626]', stroke: '#525252', Icon: Building, color: 'text-stone-500' };
};

const getObjectIcon = (type: string) => {
    switch (type) {
        case 'radio': return <Radio size={24} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
        case 'switch': return <Power size={24} className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />;
        case 'mirror': return <Eye size={24} className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />;
        case 'fog_wall': return <CloudFog size={32} className="text-slate-200 opacity-80 animate-pulse" />;
        case 'locked_door': return <Lock size={24} className="text-red-500" />;
        default: return <ShieldAlert size={20} className="text-slate-400" />;
    }
};

const GameBoard: React.FC<GameBoardProps> = ({ tiles, players, enemies, onTileClick }) => {
  const isMobile = useIsMobile();
  const HEX_SIZE = isMobile ? HEX_SIZE_MOBILE : HEX_SIZE_DESKTOP;

  // Use touch gestures hook for pan/zoom
  const {
    position,
    setPosition,
    scale,
    setScale,
    isDragging,
    handlers
  } = useTouchGestures(
    { x: typeof window !== 'undefined' ? window.innerWidth / 2 : 400, y: typeof window !== 'undefined' ? window.innerHeight / 2 - 50 : 300 },
    isMobile ? 0.7 : 0.85,
    0.3,
    1.5
  );

  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3 / 2 * q);
    const y = HEX_SIZE * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // Center on player
  const centerOnPlayer = () => {
    if (players.length > 0) {
      const playerPos = hexToPixel(players[0].position.q, players[0].position.r);
      setPosition({
        x: window.innerWidth / 2 - playerPos.x * scale,
        y: window.innerHeight / 2 - playerPos.y * scale
      });
    }
  };

  // Zoom controls for mobile
  const zoomIn = () => setScale(prev => Math.min(prev + 0.15, 1.5));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.3));

  return (
    <div
      className="w-full h-full overflow-hidden relative cursor-move bg-[#020205]"
      style={{ touchAction: 'none' }}
      {...handlers}
    >
      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' }} 
        className="absolute top-0 left-0"
      >
        {/* Render Tiles */}
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const visuals = getTileVisuals(tile.name, tile.type);
          return (
            <div 
              key={tile.id} 
              className="absolute flex items-center justify-center cursor-pointer group" 
              style={{ width: `${HEX_SIZE * 2}px`, height: `${HEX_SIZE * 1.732}px`, left: `${x - HEX_SIZE}px`, top: `${y - HEX_SIZE * 0.866}px` }} 
              onClick={(e) => {
                  e.stopPropagation();
                  onTileClick(tile.q, tile.r);
              }}
            >
              <div className={`absolute inset-0 hex-clip transition-all duration-300 ${visuals.bg} border-2 border-[${visuals.stroke}] group-hover:brightness-125 shadow-2xl`}>
                 <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40 group-hover:opacity-80 transition-opacity">
                    <visuals.Icon className={visuals.color} size={44} />
                    <span className="text-[10px] uppercase tracking-tighter text-white font-bold mt-2 text-center px-4 leading-none drop-shadow-md">{tile.name}</span>
                 </div>
                 
                 {/* Render Tile Object */}
                 {tile.object && (
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                         <div className={`bg-black/40 p-2 rounded-full backdrop-blur-sm border border-white/10 ${tile.object.type === 'switch' ? 'animate-pulse' : ''}`}>
                            {getObjectIcon(tile.object.type)}
                         </div>
                     </div>
                 )}
              </div>
            </div>
          );
        })}

        {/* Possible movement indicators */}
        {players.length > 0 && (
            (() => {
                const p = players[0].position;
                const neighbors = [
                    {q: p.q + 1, r: p.r}, {q: p.q - 1, r: p.r},
                    {q: p.q, r: p.r + 1}, {q: p.q, r: p.r - 1},
                    {q: p.q + 1, r: p.r - 1}, {q: p.q - 1, r: p.r + 1}
                ];
                return neighbors.map((n, i) => {
                    const { x, y } = hexToPixel(n.q, n.r);
                    const alreadyExists = tiles.find(t => t.q === n.q && t.r === n.r);
                    if (alreadyExists) return null;
                    return (
                        <div 
                            key={`neighbor-${i}`} 
                            className="absolute flex items-center justify-center cursor-pointer group animate-pulse" 
                            style={{ width: `${HEX_SIZE * 2}px`, height: `${HEX_SIZE * 1.732}px`, left: `${x - HEX_SIZE}px`, top: `${y - HEX_SIZE * 0.866}px` }} 
                            onClick={() => onTileClick(n.q, n.r)}
                        >
                            <div className="absolute inset-0 hex-clip bg-white/5 border-2 border-dashed border-white/20 group-hover:bg-white/10 group-hover:border-white/40">
                                <span className="text-white/20 uppercase text-[10px] font-bold">Utforsk</span>
                            </div>
                        </div>
                    );
                });
            })()
        )}

        {/* Render Enemies */}
        {enemies.map(enemy => {
            const { x, y } = hexToPixel(enemy.position.q, enemy.position.r);
            return (
                <div key={enemy.id} className="absolute w-12 h-12 rounded-full border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.7)] flex items-center justify-center bg-black z-40 transition-all duration-700" style={{ left: `${x - 24}px`, top: `${y - 24}px` }}>
                    <Ghost size={24} className="text-red-500" />
                </div>
            );
        })}

        {/* Render Players */}
        {players.map(player => {
            const { x, y } = hexToPixel(player.position.q, player.position.r);
            const playerSize = isMobile ? 12 : 16;
            return (
                <div key={player.id} className={`absolute ${isMobile ? 'w-12 h-12 border-2' : 'w-16 h-16 border-4'} rounded-full border-white shadow-[0_0_30px_rgba(255,255,255,0.7)] flex items-center justify-center bg-[#1a1a2e] z-50 transition-all duration-500`} style={{ left: `${x - playerSize * 2}px`, top: `${y - playerSize * 2}px` }}>
                    {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover rounded-full" alt="" /> : <User className="text-white" size={isMobile ? 24 : 32} />}
                </div>
            );
        })}
      </div>

      {/* Mobile Zoom Controls */}
      {isMobile && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[100]">
          <button
            onClick={zoomIn}
            className="w-12 h-12 rounded-full bg-[#1a1a2e]/90 border-2 border-slate-600 flex items-center justify-center text-white active:scale-95 active:bg-[#2a2a3e] shadow-lg"
            aria-label="Zoom inn"
          >
            <ZoomIn size={22} />
          </button>
          <button
            onClick={centerOnPlayer}
            className="w-12 h-12 rounded-full bg-[#1a1a2e]/90 border-2 border-[#e94560] flex items-center justify-center text-[#e94560] active:scale-95 active:bg-[#2a2a3e] shadow-lg"
            aria-label="Sentrer på spiller"
          >
            <Crosshair size={22} />
          </button>
          <button
            onClick={zoomOut}
            className="w-12 h-12 rounded-full bg-[#1a1a2e]/90 border-2 border-slate-600 flex items-center justify-center text-white active:scale-95 active:bg-[#2a2a3e] shadow-lg"
            aria-label="Zoom ut"
          >
            <ZoomOut size={22} />
          </button>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute left-3 bottom-28 md:bottom-3 bg-black/60 px-2 py-1 rounded text-[10px] text-slate-400 z-[100]">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
};

export default GameBoard;
