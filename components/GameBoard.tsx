
import React, { useRef, useState } from 'react';
import { Tile, Player, Enemy, ScenarioModifier } from '../types';
import { 
  User, MapPin, DoorOpen, BookOpen, Church, Anchor, Building 
} from 'lucide-react';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  enemies: Enemy[];
  onTileClick: (q: number, r: number) => void;
  doom: number;
  activeModifiers?: ScenarioModifier[];
}

const HEX_SIZE = 110;

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

const GameBoard: React.FC<GameBoardProps> = ({ tiles, players, enemies, onTileClick }) => {
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  return (
    <div 
      className="w-full h-full overflow-hidden relative cursor-move bg-[#020205] touch-none"
      onMouseDown={(e) => { isDragging.current = true; dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }}
      onMouseMove={(e) => { if (isDragging.current) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); }}
      onMouseUp={() => isDragging.current = false}
      onWheel={(e) => setScale(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.05 : 0.05), 0.3), 1.5))}
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
              </div>
            </div>
          );
        })}

        {/* Possible movement indicators (neighbor tiles) */}
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

        {/* Render Players */}
        {players.map(player => {
            const { x, y } = hexToPixel(player.position.q, player.position.r);
            return (
                <div key={player.id} className="absolute w-16 h-16 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.7)] flex items-center justify-center bg-[#1a1a2e] z-50 transition-all duration-500" style={{ left: `${x - 32}px`, top: `${y - 32}px` }}>
                    {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover rounded-full" /> : <User className="text-white" size={32} />}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
