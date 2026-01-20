
import React, { useRef, useState, useMemo } from 'react';
import { Tile, Player, Enemy, ScenarioModifier, WeatherType } from '../types';
import { 
  User, MapPin, DoorOpen, BookOpen, Church, Anchor, Building, 
  Radio, Power, Eye, CloudFog, Lock, ShieldAlert, Ghost
} from 'lucide-react';

interface GameBoardProps {
  tiles: Tile[];
  players: Player[];
  enemies: Enemy[];
  onTileClick: (q: number, r: number) => void;
  doom: number;
  activeModifiers?: ScenarioModifier[];
  screenShake?: boolean;
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

const HexWall: React.FC<{ index: number; color: string }> = ({ index, color }) => {
    const angles = [30, 90, 150, 210, 270, 330];
    const angle = angles[index];
    
    return (
        <div 
            className="absolute h-1.5 rounded-full z-20 shadow-[0_0_10px_rgba(0,0,0,0.8)]"
            style={{ 
                width: `${HEX_SIZE}px`,
                backgroundColor: color,
                top: '50%',
                left: '50%',
                transformOrigin: 'center center',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-${HEX_SIZE * 0.866}px)`,
                border: '1px solid rgba(255,255,255,0.2)'
            }}
        />
    );
};

const WeatherOverlay: React.FC<{ weather?: WeatherType }> = ({ weather }) => {
    if (!weather || weather === 'clear') return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            {weather === 'fog' && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] animate-pulse">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/fog.png')] opacity-30 animate-float-slow"></div>
                </div>
            )}
            {weather === 'rain' && (
                <div className="absolute inset-0 overflow-hidden">
                    {Array.from({ length: 50 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute bg-blue-400/30 w-[1px] h-10 animate-rain-fall"
                            style={{ 
                                left: `${Math.random() * 100}%`, 
                                top: `-${Math.random() * 20}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`
                            }}
                        ></div>
                    ))}
                </div>
            )}
            {weather === 'miasma' && (
                <div className="absolute inset-0 bg-purple-900/10 mix-blend-color-dodge">
                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.1)_0%,transparent_70%)] animate-pulse"></div>
                </div>
            )}
            {weather === 'void_storm' && (
                <div className="absolute inset-0 overflow-hidden bg-black/20">
                     {Array.from({ length: 20 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute w-8 h-8 bg-black border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)] animate-voxel-drift"
                            style={{ 
                                left: `${Math.random() * 100}%`, 
                                top: `${Math.random() * 100}%`,
                                animationDuration: `${20 + Math.random() * 40}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        ></div>
                    ))}
                </div>
            )}
        </div>
    );
};

const GameBoard: React.FC<GameBoardProps> = ({ tiles, players, enemies, onTileClick, activeModifiers, screenShake }) => {
  const [scale, setScale] = useState(0.85);
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const activeWeather = useMemo(() => activeModifiers?.find(m => m.weatherType)?.weatherType, [activeModifiers]);

  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  // Generate background voxel blocks for depth
  const backgroundVoxels = useMemo(() => Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 40 + Math.random() * 100,
      duration: 30 + Math.random() * 60,
      delay: Math.random() * -60
  })), []);

  return (
    <div 
      className={`w-full h-full overflow-hidden relative cursor-move bg-[#020205] touch-none ${screenShake ? 'animate-shake' : ''}`}
      onMouseDown={(e) => { isDragging.current = true; dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }}
      onMouseMove={(e) => { if (isDragging.current) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); }}
      onMouseUp={() => isDragging.current = false}
      onWheel={(e) => setScale(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.05 : 0.05), 0.3), 1.5))}
    >
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {backgroundVoxels.map(v => (
              <div 
                key={v.id}
                className="voxel-block animate-voxel-drift"
                style={{
                    left: `${v.left}%`,
                    top: `${v.top}%`,
                    width: `${v.size}px`,
                    height: `${v.size}px`,
                    animationDuration: `${v.duration}s`,
                    animationDelay: `${v.delay}s`
                }}
              />
          ))}
      </div>

      <div 
        style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' }} 
        className="absolute top-0 left-0"
      >
        {/* Render Tiles */}
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const visuals = getTileVisuals(tile.name, tile.type);
          const wallColor = tile.type === 'street' ? '#334155' : '#450a0a';

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
              <div className={`absolute inset-0 hex-clip transition-all duration-300 ${visuals.bg} border-2 border-[${visuals.stroke}] group-hover:brightness-125 shadow-2xl overflow-hidden`}>
                 {tile.imageUrl && (
                     <img src={tile.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay" alt="" />
                 )}
                 
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

              {/* Render Walls (Blocked Sides) */}
              {tile.walls?.map((isWall, idx) => (
                  isWall && <HexWall key={idx} index={idx} color={wallColor} />
              ))}
            </div>
          );
        })}

        {/* Possible movement indicators */}
        {players.length > 0 && (
            (() => {
                const player = players[0];
                const p = player.position;
                const currentTile = tiles.find(t => t.q === p.q && t.r === p.r);
                
                const HEX_DIRECTIONS = [
                    { q: 1, r: -1 }, { q: 1, r: 0 }, { q: 0, r: 1 }, 
                    { q: -1, r: 1 }, { q: -1, r: 0 }, { q: 0, r: -1 }
                ];

                return HEX_DIRECTIONS.map((dir, i) => {
                    const n = { q: p.q + dir.q, r: p.r + dir.r };
                    const { x, y } = hexToPixel(n.q, n.r);
                    const alreadyExists = tiles.find(t => t.q === n.q && t.r === n.r);
                    
                    if (currentTile?.walls?.[i]) return null;
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
            return (
                <div key={player.id} className="absolute w-16 h-16 rounded-full border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.7)] flex items-center justify-center bg-[#1a1a2e] z-50 transition-all duration-500" style={{ left: `${x - 32}px`, top: `${y - 32}px` }}>
                    {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover rounded-full" /> : <User className="text-white" size={32} />}
                </div>
            );
        })}
      </div>

      {/* Global Atmosphere Layers */}
      <WeatherOverlay weather={activeWeather} />
      <div className="fixed inset-0 pointer-events-none z-[110] shadow-[inset_0_0_150px_rgba(0,0,0,0.9)]"></div>
    </div>
  );
};

export default GameBoard;
