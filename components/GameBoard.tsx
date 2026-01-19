
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Tile, Player, Enemy, FloatingText, EnemyType, ScenarioModifier } from '../types';
import { 
  User, Skull, DoorOpen, EyeOff, Target, Eye, Lock, Flame, Hammer, Ban,
  BookOpen, Trees, Anchor, Church, Building2, Box, Ghost,
  Library, Archive, FileText, Radio, Zap, Gem, CloudFog, Milestone,
  Fish, PawPrint, Biohazard, Crown, Crosshair, Bug, Smile
} from 'lucide-react';
import { hasLineOfSight } from '../utils/hexUtils';

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
const VISIBILITY_RANGE = 2; // Default range
const DRAG_THRESHOLD = 5; // Pixels of movement required to count as a drag

// SVG Polygon Points for Flat-Topped Hexagon (0-100 coordinate space)
// Matches clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
const HEX_POLY_POINTS = "25,0 75,0 100,50 75,100 25,100 0,50";

// --- ICON MAPPER FOR MONSTERS ---
const getMonsterIcon = (type: EnemyType) => {
    switch (type) {
        case 'cultist':
        case 'priest':
            return { Icon: User, color: 'text-purple-300' };
        case 'deepone':
            return { Icon: Fish, color: 'text-cyan-400' };
        case 'hound':
            return { Icon: PawPrint, color: 'text-amber-600' };
        case 'ghoul':
            return { Icon: Skull, color: 'text-stone-400' };
        case 'shoggoth':
        case 'formless_spawn':
            return { Icon: Biohazard, color: 'text-green-500' };
        case 'mi-go':
        case 'byakhee':
            return { Icon: Bug, color: 'text-pink-400' }; 
        case 'nightgaunt':
        case 'hunting_horror':
            return { Icon: Ghost, color: 'text-slate-400' };
        case 'star_spawn':
        case 'dark_young':
        case 'boss':
            return { Icon: Crown, color: 'text-red-600' };
        case 'sniper':
            return { Icon: Crosshair, color: 'text-red-400' };
        case 'moon_beast':
            return { Icon: Smile, color: 'text-slate-300' }; 
        default:
            return { Icon: Skull, color: 'text-red-500' };
    }
};

// --- VISUAL HELPERS ---
const getTileVisuals = (name: string, type: 'building' | 'room' | 'street') => {
  const n = name.toLowerCase();
  
  if (n.includes('hallway') || n.includes('corridor') || n.includes('passage') || n.includes('shaft')) {
      return {
          bg: 'bg-[#1c1917]',
          style: {
              backgroundImage: 'repeating-linear-gradient(90deg, #292524 0, #292524 1px, transparent 1px, transparent 10px)'
          },
          strokeColor: '#78716c', 
          Icon: DoorOpen,
          iconColor: 'text-stone-400'
      };
  }
  if (n.includes('alley') || n.includes('path') || n.includes('tunnel') || n.includes('trail')) {
      return {
          bg: 'bg-[#0f172a]',
          style: {
              backgroundImage: 'radial-gradient(circle, transparent 20%, #000 90%), repeating-radial-gradient(circle at 50% 100%, #334155 0, transparent 2px, transparent 6px)'
          },
          strokeColor: '#475569', 
          Icon: Milestone,
          iconColor: 'text-slate-500'
      };
  }

  if (n.includes('library') || n.includes('study') || n.includes('manor') || n.includes('hall') || n.includes('attic') || n.includes('servant') || n.includes('ballroom') || n.includes('billiard') || n.includes('bedroom') || n.includes('nursery') || n.includes('trophy') || n.includes('staircase')) {
    return {
      bg: 'bg-[#451a03]',
      style: {
        backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 10px)'
      },
      strokeColor: '#b45309', 
      Icon: BookOpen,
      iconColor: 'text-amber-500'
    };
  }

  if (n.includes('hospital') || n.includes('asylum') || n.includes('sanitarium') || n.includes('morgue') || n.includes('lab') || n.includes('operating') || n.includes('padded')) {
    return {
      bg: 'bg-[#334155]', 
      style: {
        backgroundImage: 'linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      },
      strokeColor: '#94a3b8', 
      Icon: Archive,
      iconColor: 'text-slate-300'
    };
  }

  if (n.includes('church') || n.includes('crypt') || n.includes('ritual') || n.includes('temple') || n.includes('altar')) {
    return {
      bg: 'bg-[#450a0a]',
      style: {
        backgroundImage: 'radial-gradient(circle at center, #7f1d1d 0%, transparent 80%)'
      },
      strokeColor: '#ef4444', 
      Icon: Church,
      iconColor: 'text-red-400'
    };
  }

  if (n.includes('warehouse') || n.includes('boiler') || n.includes('factory') || n.includes('station') || n.includes('cellar')) {
    return {
      bg: 'bg-[#292524]',
      style: {
        backgroundImage: 'repeating-linear-gradient(-45deg, #44403c 0, #44403c 2px, transparent 2px, transparent 8px)'
      },
      strokeColor: '#a8a29e', 
      Icon: Box,
      iconColor: 'text-stone-400'
    };
  }

  if (n.includes('swamp') || n.includes('forest') || n.includes('park') || n.includes('garden') || n.includes('graveyard') || n.includes('greenhouse') || n.includes('conservatory') || n.includes('gazebo') || n.includes('overgrown')) {
    return {
      bg: 'bg-[#064e3b]',
      style: {
        backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 20%)'
      },
      strokeColor: '#4ade80', 
      Icon: n.includes('graveyard') ? Skull : Trees,
      iconColor: 'text-green-400'
    };
  }

  if (n.includes('dock') || n.includes('river') || n.includes('pier') || n.includes('bridge')) {
    return {
      bg: 'bg-[#172554]',
      style: {
        backgroundImage: 'repeating-radial-gradient(circle at 50% 100%, rgba(255,255,255,0.05) 0, transparent 5px)'
      },
      strokeColor: '#60a5fa', 
      Icon: Anchor,
      iconColor: 'text-blue-400'
    };
  }

  if (type === 'street' || n.includes('street') || n.includes('square') || n.includes('alley') || n.includes('dead end') || n.includes('junction') || n.includes('roundabout') || n.includes('crossroads') || n.includes('site')) {
    return {
      bg: 'bg-[#1e293b]',
      style: {
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      },
      strokeColor: '#cbd5e1', 
      Icon: Building2,
      iconColor: 'text-slate-400'
    };
  }

  return {
    bg: 'bg-[#262626]',
    style: {},
    strokeColor: '#737373', 
    Icon: Ghost, 
    iconColor: 'text-neutral-500'
  };
};

const getDoomLighting = (doom: number, activeModifiers: ScenarioModifier[] = []) => {
    const danger = Math.max(0, 1 - (doom / 12)); 

    let overlayColor = 'rgba(10, 20, 40, 0.4)'; 
    let vignetteStrength = '60%'; 
    let animation = 'none';
    let contrast = 1;

    const isBloodMoon = activeModifiers.some(m => m.effect === 'strong_enemies');
    if (isBloodMoon) {
        overlayColor = 'rgba(60, 10, 10, 0.3)';
    }

    if (doom <= 3) {
        overlayColor = isBloodMoon ? 'rgba(80, 0, 0, 0.5)' : 'rgba(60, 0, 0, 0.3)'; 
        vignetteStrength = '90%'; 
        animation = isBloodMoon ? 'doom-pulse-red 3s infinite' : 'doom-flicker 4s infinite';
        contrast = 1.2;
    } else if (doom <= 6) {
        overlayColor = isBloodMoon ? 'rgba(60, 20, 20, 0.4)' : 'rgba(40, 10, 40, 0.3)';
        vignetteStrength = '75%';
        animation = 'none';
        contrast = 1.1;
    }

    const gradient = `radial-gradient(circle, transparent 30%, ${overlayColor} ${vignetteStrength}, #000 100%)`;

    return { gradient, animation, contrast, danger };
};

const getWeatherVisuals = (activeModifiers: ScenarioModifier[] = []) => {
    const isFoggy = activeModifiers.some(m => m.effect === 'reduced_vision');
    const isBloodMoon = activeModifiers.some(m => m.effect === 'strong_enemies');
    
    let bgImage = 'url("https://www.transparenttextures.com/patterns/foggy-birds.png")';
    let opacity = 0.3;
    let blendMode = 'screen';
    let filter = 'blur(2px)';
    let animation = 'animate-fog';

    if (isFoggy) {
        opacity = 0.6; 
        filter = 'blur(4px) contrast(1.2)';
    } else if (isBloodMoon) {
        bgImage = 'url("https://www.transparenttextures.com/patterns/dark-matter.png")';
        opacity = 0.4;
        blendMode = 'color-dodge';
        filter = 'sepia(1) hue-rotate(-50deg)'; 
    }

    return { bgImage, opacity, blendMode, filter, animation };
}


const GameBoard: React.FC<GameBoardProps> = ({ 
  tiles, 
  players, 
  enemies, 
  selectedEnemyId,
  onTileClick, 
  onEnemyClick,
  onEnemyHover,
  enemySightMap,
  floatingTexts = [],
  doom,
  activeModifiers = []
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);
  const lastTouchDistance = useRef<number | null>(null);
  
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartRaw, setDragStartRaw] = useState({ x: 0, y: 0 }); 

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
    setDragStartRaw({ x: e.clientX, y: e.clientY });
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const dx = e.clientX - dragStartRaw.x;
    const dy = e.clientY - dragStartRaw.y;
    if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        hasDragged.current = true;
    }

    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
          setIsDragging(true);
          const t = e.touches[0];
          setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
          setDragStartRaw({ x: t.clientX, y: t.clientY });
          hasDragged.current = false;
      } 
      else if (e.touches.length === 2) {
          setIsDragging(false); 
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          lastTouchDistance.current = dist;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDragging) {
          const t = e.touches[0];
          const dx = t.clientX - dragStartRaw.x;
          const dy = t.clientY - dragStartRaw.y;
          
          if (Math.hypot(dx, dy) > DRAG_THRESHOLD) {
              hasDragged.current = true;
          }

          setPosition({
              x: t.clientX - dragStart.x,
              y: t.clientY - dragStart.y
          });
      } 
      else if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );

          if (lastTouchDistance.current !== null) {
              const delta = dist - lastTouchDistance.current;
              const sensitivity = 0.005; 
              setScale(prev => Math.min(Math.max(prev + delta * sensitivity, 0.3), 1.5));
          }
          lastTouchDistance.current = dist;
      }
  };

  const handleTouchEnd = () => {
      setIsDragging(false);
      lastTouchDistance.current = null;
  };

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
    const modRange = activeModifiers.some(m => m.effect === 'reduced_vision') ? -1 : 0;
    const finalRange = Math.max(1, VISIBILITY_RANGE + modRange);

    players.filter(p => !p.isDead).forEach(p => {
      tiles.forEach(t => {
        if (getDistance(p.position.q, p.position.r, t.q, t.r) <= finalRange) {
          visible.add(`${t.q},${t.r}`);
        }
      });
    });
    return visible;
  }, [players, tiles, activeModifiers]);

  // LINE OF SIGHT VISUALIZATION FOR SELECTED ENEMY
  const selectedEnemyVisionTiles = useMemo(() => {
      if (!selectedEnemyId) return new Set<string>();
      const enemy = enemies.find(e => e.id === selectedEnemyId);
      if (!enemy) return new Set<string>();

      const vision = new Set<string>();
      const range = enemy.visionRange;

      tiles.forEach(t => {
          if (hasLineOfSight(enemy.position, t, tiles, range)) {
              vision.add(`${t.q},${t.r}`);
          }
      });
      return vision;
  }, [selectedEnemyId, enemies, tiles]);

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

  const lighting = getDoomLighting(doom, activeModifiers);
  const weather = getWeatherVisuals(activeModifiers);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-hidden relative cursor-move bg-[#05050a] touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div 
        className="absolute inset-0 pointer-events-none z-20 transition-all duration-1000"
        style={{
            background: lighting.gradient,
            animation: lighting.animation,
            mixBlendMode: 'overlay' 
        }}
      />

      <div 
        className={`absolute inset-0 pointer-events-none z-25 transition-opacity duration-1000 ${weather.animation}`}
        style={{
            backgroundImage: weather.bgImage,
            backgroundSize: '600px',
            opacity: weather.opacity,
            mixBlendMode: weather.blendMode as any,
            filter: weather.filter
        }}
      />
      
      <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000_100%)] opacity-80" />
      
      <div 
        style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="absolute top-0 left-0 will-change-transform z-10"
      >
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const isVisible = visibleTiles.has(`${tile.q},${tile.r}`);
          const isInEnemySight = selectedEnemyVisionTiles.has(`${tile.q},${tile.r}`);
          const visual = getTileVisuals(tile.name, tile.type);
          
          if (!isVisible && !tile.explored) return null;

          return (
            <div
              key={tile.id}
              className={`absolute flex items-center justify-center transition-all duration-500`}
              style={{
                width: `${HEX_SIZE * 2}px`,
                height: `${HEX_SIZE * 1.732}px`,
                left: `${x - HEX_SIZE}px`,
                top: `${y - HEX_SIZE * 0.866}px`
              }}
              onClick={() => {
                if (!hasDragged.current) onTileClick(tile.q, tile.r);
              }}
            >
              <div 
                className={`absolute inset-0 hex-clip transition-all duration-500 ${visual.bg} relative overflow-hidden`}
              >
                 {tile.imageUrl && (
                     <img src={tile.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
                 )}

                 {!tile.imageUrl && (
                    <div 
                        className="absolute inset-0 opacity-20" 
                        style={visual.style}
                    ></div>
                 )}

                 {/* Enemy Vision Overlay */}
                 {isInEnemySight && (
                     <div className="absolute inset-0 bg-red-600/20 mix-blend-color animate-pulse pointer-events-none z-10"></div>
                 )}

                 <div className="relative z-10 flex flex-col items-center opacity-80 pointer-events-none">
                     <visual.Icon size={24} className={visual.iconColor} />
                 </div>

                 {tile.object && (
                     <div className="absolute bottom-4 z-20 flex flex-col items-center animate-in zoom-in duration-300">
                         {tile.object.type === 'fire' && <Flame className="text-orange-500 animate-pulse" size={20} />}
                         {tile.object.type === 'locked_door' && <Lock className="text-amber-500" size={20} />}
                         {tile.object.type === 'rubble' && <Hammer className="text-stone-500" size={20} />}
                         {tile.object.type === 'barricade' && <Ban className="text-red-500" size={20} />}
                         {tile.object.type === 'fog_wall' && <CloudFog className="text-purple-300 animate-pulse" size={20} />}
                         {tile.object.type === 'bookshelf' && <Library className="text-amber-700" size={18} />}
                         {tile.object.type === 'cabinet' && <Archive className="text-slate-500" size={18} />}
                         {tile.object.type === 'chest' && <Box className="text-yellow-600" size={18} />}
                         {tile.object.type === 'altar' && <Gem className="text-red-600" size={18} />}
                         {tile.object.type === 'switch' && <Zap className="text-yellow-400" size={18} />}
                         {tile.object.type === 'radio' && <Radio className="text-green-800" size={18} />}
                         {tile.object.type === 'trap' && <EyeOff className="text-red-500 opacity-0 group-hover:opacity-100" size={18} />} 
                     </div>
                 )}

                 <div className={`absolute inset-0 transition-all duration-1000 backdrop-blur-[2px] z-30 pointer-events-none ${isVisible ? 'opacity-0' : 'opacity-80 bg-black'}`}></div>
              </div>

              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
                  <polygon 
                     points={HEX_POLY_POINTS} 
                     fill="none" 
                     stroke={isInEnemySight ? '#ef4444' : visual.strokeColor} 
                     strokeWidth={isInEnemySight ? "3.5" : "2.5"}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className="transition-all duration-300"
                  />
                  {tile.object?.blocking && (
                      <polygon 
                         points={HEX_POLY_POINTS} 
                         fill="none" 
                         stroke="#ef4444" 
                         strokeWidth="2"
                         className="opacity-60"
                      />
                  )}
              </svg>
            </div>
          );
        })}

        {possibleMoves.map((move, i) => {
          const { x, y } = hexToPixel(move.q, move.r);
          return (
             <div
                key={`move-${i}`}
                className="absolute flex items-center justify-center cursor-pointer transition-opacity z-20 group"
                style={{
                    width: `${HEX_SIZE * 2}px`,
                    height: `${HEX_SIZE * 1.732}px`,
                    left: `${x - HEX_SIZE}px`,
                    top: `${y - HEX_SIZE * 0.866}px`,
                }}
                onClick={() => {
                   if (!hasDragged.current) onTileClick(move.q, move.r);
                }}
             >
                 <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
                    <polygon 
                        points={HEX_POLY_POINTS} 
                        fill="rgba(255,255,255,0.05)" 
                        stroke="#e94560" 
                        strokeWidth="2" 
                        strokeDasharray="6,4"
                        className="group-hover:stroke-white group-hover:stroke-[3px] transition-all duration-300"
                    />
                 </svg>
             </div>
          );
        })}

        {players.map(player => {
            if (player.isDead) return null;
            const { x, y } = hexToPixel(player.position.q, player.position.r);
            return (
                <div
                    key={player.id}
                    className="absolute w-12 h-12 rounded-full border-2 border-white shadow-[0_0_15px_rgba(255,255,255,0.6)] flex items-center justify-center bg-[#1a1a2e] z-30 transition-all duration-500 ease-in-out"
                    style={{
                        left: `${x - 24}px`,
                        top: `${y - 24}px`,
                    }}
                >
                    {player.imageUrl ? (
                        <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                        <User className="text-white" size={20} />
                    )}
                    <div className="absolute inset-0 bg-amber-200/20 rounded-full animate-lantern pointer-events-none blur-xl scale-[3]"></div>
                    
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle cx="22" cy="22" r="21" fill="none" stroke="#7e22ce" strokeWidth="2" strokeDasharray="132" strokeDashoffset={132 * (1 - player.sanity/player.maxSanity)} className="transition-all duration-500" />
                    </svg>
                </div>
            );
        })}

        {enemies.map(enemy => {
            if (!visibleTiles.has(`${enemy.position.q},${enemy.position.r}`)) return null;
            const { x, y } = hexToPixel(enemy.position.q, enemy.position.r);
            const MonsterVisual = getMonsterIcon(enemy.type);
            const isSelected = selectedEnemyId === enemy.id;

            return (
                <div
                    key={enemy.id}
                    className={`absolute w-14 h-14 transition-all duration-500 ease-in-out z-40 cursor-pointer group ${enemy.isDying ? 'death-dissolve pointer-events-none' : ''}`}
                    style={{
                        left: `${x - 28}px`,
                        top: `${y - 28}px`,
                        transform: isSelected ? 'scale(1.2)' : 'scale(1)'
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!hasDragged.current && onEnemyClick) onEnemyClick(enemy.id);
                    }}
                    onMouseEnter={() => onEnemyHover && onEnemyHover(enemy.id)}
                    onMouseLeave={() => onEnemyHover && onEnemyHover(null)}
                >
                     {isSelected && <div className="absolute inset-[-4px] border-2 border-red-500 rounded-full animate-ping opacity-50"></div>}

                     <div className={`w-full h-full rounded-full bg-[#1a0505] border-2 ${isSelected ? 'border-red-500' : 'border-red-900'} flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.4)] relative`}>
                         {enemy.imageUrl ? (
                             <img src={enemy.imageUrl} alt={enemy.name} className="w-full h-full object-cover" />
                         ) : (
                             <MonsterVisual.Icon className={`${MonsterVisual.color}`} size={24} />
                         )}
                         
                         <div className="absolute bottom-0 left-0 right-0 h-1 bg-black">
                             <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                         </div>
                     </div>
                </div>
            );
        })}

        {floatingTexts.map(ft => {
            const { x, y } = hexToPixel(ft.q, ft.r);
            return (
                <div 
                    key={ft.id}
                    className={`absolute z-50 pointer-events-none font-bold text-sm md:text-lg animate-float-up text-stroke-sm whitespace-nowrap ${ft.colorClass}`}
                    style={{
                        left: `${x + ft.randomOffset.x}px`,
                        top: `${y - 40 + ft.randomOffset.y}px`
                    }}
                >
                    {ft.content}
                </div>
            );
        })}

      </div>
      
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-50 md:hidden">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 1.5))} className="p-3 bg-slate-800/80 rounded-full text-white border border-slate-600">+</button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="p-3 bg-slate-800/80 rounded-full text-white border border-slate-600">-</button>
      </div>
    </div>
  );
};

export default GameBoard;
