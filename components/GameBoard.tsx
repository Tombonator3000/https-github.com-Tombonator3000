
import React, { useRef, useEffect, useState } from 'react';
import { Tile, Player, Enemy, FloatingText, EnemyType, ScenarioModifier, WeatherType } from '../types';
// Fixed: Added BookOpen, Church, and Anchor to the lucide-react imports
import { 
  User, Skull, DoorOpen, Lock, Flame, Hammer, Sparkles, Ghost,
  CloudFog, Zap, Fish, PawPrint, Biohazard, Bug, ShoppingBag, MapPin,
  Building, Ghost as TrapIcon, CloudRain, Wind, BookOpen, Church, Anchor
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
  doom: number;
  activeModifiers?: ScenarioModifier[];
}

const HEX_SIZE = 95;

const WeatherOverlay: React.FC<{ modifiers: ScenarioModifier[] }> = ({ modifiers }) => {
    const activeWeather = modifiers.find(m => m.weatherType && m.weatherType !== 'clear')?.weatherType;

    if (!activeWeather) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
            {activeWeather === 'fog' && (
                <div className="absolute inset-0 bg-slate-400/10 animate-pulse transition-opacity duration-[3000ms]">
                    {Array.from({ length: 15 }).map((_, i) => (
                        <CloudFog 
                            key={i} 
                            className="absolute text-slate-200/20 blur-xl animate-float-slow" 
                            size={300 + Math.random() * 200}
                            style={{ 
                                top: `${Math.random() * 100}%`, 
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${20 + Math.random() * 20}s`
                            }} 
                        />
                    ))}
                </div>
            )}
            {activeWeather === 'rain' && (
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-blue-900/5"></div>
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div 
                            key={i} 
                            className="absolute w-[1px] h-20 bg-blue-400/30 rotate-[20deg] animate-rain-fall"
                            style={{ 
                                top: `-100px`, 
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${0.5 + Math.random() * 0.5}s`
                            }}
                        />
                    ))}
                </div>
            )}
            {activeWeather === 'miasma' && (
                <div className="absolute inset-0 bg-purple-900/5">
                    {Array.from({ length: 20 }).map((_, i) => (
                        <Sparkles 
                            key={i} 
                            className="absolute text-purple-400/20 blur-sm animate-pulse" 
                            size={50 + Math.random() * 50}
                            style={{ 
                                top: `${Math.random() * 100}%`, 
                                left: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 3}s`
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const getMonsterIcon = (type: EnemyType) => {
    switch (type) {
        case 'cultist':
        case 'priest': return { Icon: User, color: 'text-purple-300' };
        case 'deepone': return { Icon: Fish, color: 'text-cyan-400' };
        case 'hound': return { Icon: PawPrint, color: 'text-amber-600' };
        case 'ghoul': return { Icon: Skull, color: 'text-stone-400' };
        case 'shoggoth':
        case 'formless_spawn': return { Icon: Biohazard, color: 'text-green-500' };
        case 'mi-go':
        case 'byakhee': return { Icon: Bug, color: 'text-pink-400' }; 
        case 'nightgaunt':
        case 'hunting_horror': return { Icon: Ghost, color: 'text-slate-400' };
        default: return { Icon: Skull, color: 'text-red-500' };
    }
};

const getTileVisuals = (name: string, type: 'building' | 'room' | 'street') => {
  const n = name.toLowerCase();
  if (n.includes('hallway') || n.includes('corridor') || n.includes('passage')) return { bg: 'bg-[#1c1917]', strokeColor: '#78716c', Icon: DoorOpen, iconColor: 'text-stone-400' };
  if (n.includes('square') || n.includes('market')) return { bg: 'bg-[#334155]', strokeColor: '#64748b', Icon: ShoppingBag, iconColor: 'text-slate-400' };
  if (n.includes('library') || n.includes('study')) return { bg: 'bg-[#451a03]', strokeColor: '#b45309', Icon: BookOpen, iconColor: 'text-amber-500' };
  if (n.includes('church') || n.includes('crypt')) return { bg: 'bg-[#450a0a]', strokeColor: '#ef4444', Icon: Church, iconColor: 'text-red-400' };
  if (n.includes('dock') || n.includes('river')) return { bg: 'bg-[#172554]', strokeColor: '#60a5fa', Icon: Anchor, iconColor: 'text-blue-400' };
  if (type === 'street') return { bg: 'bg-[#1e293b]', strokeColor: '#cbd5e1', Icon: MapPin, iconColor: 'text-slate-400' };
  return { bg: 'bg-[#262626]', strokeColor: '#737373', Icon: Building, iconColor: 'text-neutral-500' };
};

const GameBoard: React.FC<GameBoardProps> = ({ tiles, players, enemies, selectedEnemyId, onTileClick, onEnemyClick, floatingTexts = [], doom, activeModifiers = [] }) => {
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const hexToPixel = (q: number, r: number) => {
    const x = HEX_SIZE * (3/2 * q);
    const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
  };

  return (
    <div 
      className="w-full h-full overflow-hidden relative cursor-move bg-[#05050a] touch-none"
      onMouseDown={(e) => { isDragging.current = true; dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; }}
      onMouseMove={(e) => { if (isDragging.current) setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); }}
      onMouseUp={() => isDragging.current = false}
      onWheel={(e) => setScale(prev => Math.min(Math.max(prev + (e.deltaY > 0 ? -0.1 : 0.1), 0.3), 1.5))}
    >
      <WeatherOverlay modifiers={activeModifiers} />

      <div style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, transition: isDragging.current ? 'none' : 'transform 0.1s ease-out' }} className="absolute top-0 left-0">
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          return (
            <div key={tile.id} className="absolute flex items-center justify-center" style={{ width: `${HEX_SIZE * 2}px`, height: `${HEX_SIZE * 1.732}px`, left: `${x - HEX_SIZE}px`, top: `${y - HEX_SIZE * 0.866}px` }} onClick={() => onTileClick(tile.q, tile.r)}>
              <div className={`absolute inset-0 hex-clip transition-all duration-500 bg-[#262626] relative overflow-hidden group border border-white/5`}>
                 {tile.object && (
                     <div className="absolute inset-0 flex items-center justify-center z-20 animate-in zoom-in duration-300">
                         {tile.object.type === 'fire' && <Flame className="text-orange-500 animate-pulse" size={40} />}
                         {tile.object.type === 'locked_door' && <Lock className="text-amber-500" size={32} />}
                         {tile.object.type === 'rubble' && <Hammer className="text-stone-500 rotate-12" size={32} />}
                         {tile.object.type === 'trap' && <TrapIcon className="text-red-900/50" size={24} />}
                         {tile.object.type === 'altar' && <Sparkles className="text-purple-500 animate-pulse" size={32} />}
                         {tile.object.type === 'fog_wall' && <CloudFog className="text-slate-400 opacity-50 blur-[2px]" size={48} />}
                         {tile.object.type === 'gate' && <Zap className="text-cyan-400" size={32} />}
                     </div>
                 )}
              </div>
            </div>
          );
        })}

        {players.map(player => {
            const { x, y } = hexToPixel(player.position.q, player.position.r);
            return (
                <div key={player.id} className="absolute w-12 h-12 rounded-full border-2 border-white shadow-[0_0_25px_rgba(255,255,255,0.4)] flex items-center justify-center bg-[#1a1a2e] z-30 transition-all duration-500" style={{ left: `${x - 24}px`, top: `${y - 24}px` }}>
                    {player.imageUrl ? <img src={player.imageUrl} className="w-full h-full object-cover rounded-full" /> : <User className="text-white" size={20} />}
                </div>
            );
        })}

        {enemies.map(enemy => {
            const { x, y } = hexToPixel(enemy.position.q, enemy.position.r);
            const MonsterVisual = getMonsterIcon(enemy.type);
            return (
                <div key={enemy.id} className="absolute w-14 h-14 z-40" style={{ left: `${x - 28}px`, top: `${y - 28}px` }}>
                     <div className="w-full h-full rounded-full bg-[#1a0505] border-2 border-red-900 shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center overflow-hidden">
                         {enemy.imageUrl ? <img src={enemy.imageUrl} className="w-full h-full object-cover" /> : <MonsterVisual.Icon className={MonsterVisual.color} size={24} />}
                     </div>
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default GameBoard;
