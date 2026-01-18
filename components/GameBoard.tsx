
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Tile, Player, Enemy, FloatingText, EnemyType } from '../types';
import { 
  User, Skull, DoorOpen, EyeOff, Target, Eye, Lock, Flame, Hammer, Ban,
  BookOpen, Trees, Anchor, Church, Building2, Box, Ghost,
  Library, Archive, FileText, Radio, Zap, Gem, CloudFog, Milestone,
  Fish, PawPrint, Biohazard, Crown, Crosshair, Bug, Smile
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
}

const HEX_SIZE = 95;
const VISIBILITY_RANGE = 2; // Default range
const DRAG_THRESHOLD = 5; // Pixels of movement required to count as a drag

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
            return { Icon: Bug, color: 'text-pink-400' }; // Use Bug if available, or fallback
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
            return { Icon: Smile, color: 'text-slate-300' }; // Creepy smile
        default:
            return { Icon: Skull, color: 'text-red-500' };
    }
};

// --- VISUAL HELPERS ---
const getTileVisuals = (name: string, type: 'building' | 'room' | 'street') => {
  const n = name.toLowerCase();
  
  // 0. CONNECTORS (Hallways/Alleys)
  if (n.includes('hallway') || n.includes('corridor') || n.includes('passage') || n.includes('shaft')) {
      return {
          bg: 'bg-[#15100e]',
          style: {
              backgroundImage: 'linear-gradient(90deg, #000 0%, transparent 20%, transparent 80%, #000 100%), repeating-linear-gradient(0deg, #1f1510 0, #1f1510 5px, #15100e 5px, #15100e 10px)'
          },
          strokeColor: '#44403c', // Stone 700
          Icon: DoorOpen,
          iconColor: 'text-stone-700'
      };
  }
  if (n.includes('alley') || n.includes('path') || n.includes('tunnel') || n.includes('trail')) {
      return {
          bg: 'bg-[#0f1115]',
          style: {
              backgroundImage: 'radial-gradient(circle, transparent 20%, #000 90%), repeating-radial-gradient(circle at 50% 100%, #1e293b 0, #0f1115 5px)'
          },
          strokeColor: '#334155', // Slate 700
          Icon: Milestone,
          iconColor: 'text-slate-800'
      };
  }

  // 1. WOOD FLOOR (Manors, Libraries, Old Houses)
  if (n.includes('library') || n.includes('study') || n.includes('manor') || n.includes('hall') || n.includes('attic') || n.includes('servant') || n.includes('ballroom') || n.includes('billiard') || n.includes('bedroom') || n.includes('nursery') || n.includes('trophy') || n.includes('staircase')) {
    return {
      bg: 'bg-[#2a1d18]',
      style: {
        backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(0,0,0,0.3) 19px, rgba(0,0,0,0.3) 20px)'
      },
      strokeColor: '#78350f', // Amber 900
      Icon: BookOpen,
      iconColor: 'text-amber-900'
    };
  }

  // 2. COLD TILES (Hospitals, Asylums, Labs)
  if (n.includes('hospital') || n.includes('asylum') || n.includes('sanitarium') || n.includes('morgue') || n.includes('lab') || n.includes('operating') || n.includes('padded')) {
    return {
      bg: 'bg-[#e2e8f0]', // Light slate
      style: {
        backgroundImage: 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1), linear-gradient(45deg, #cbd5e1 25%, transparent 25%, transparent 75%, #cbd5e1 75%, #cbd5e1)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        filter: 'brightness(0.6) sepia(0.2)'
      },
      strokeColor: '#94a3b8', // Slate 400
      Icon: Archive,
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
      strokeColor: '#7f1d1d', // Red 900
      Icon: Church,
      iconColor: 'text-red-900'
    };
  }

  // 4. INDUSTRIAL / STORAGE (Warehouse, Boiler Room, Factory, Cellar)
  if (n.includes('warehouse') || n.includes('boiler') || n.includes('factory') || n.includes('station') || n.includes('cellar')) {
    return {
      bg: 'bg-[#1c1917]',
      style: {
        backgroundImage: 'repeating-linear-gradient(45deg, #292524 0, #292524 5px, #1c1917 5px, #1c1917 10px)'
      },
      strokeColor: '#57534e', // Stone 600
      Icon: Box,
      iconColor: 'text-stone-700'
    };
  }

  // 5. NATURE / SWAMP (Swamp, Forest, Park, Garden, Greenhouse)
  if (n.includes('swamp') || n.includes('forest') || n.includes('park') || n.includes('garden') || n.includes('graveyard') || n.includes('greenhouse') || n.includes('conservatory') || n.includes('gazebo') || n.includes('overgrown')) {
    return {
      bg: 'bg-[#06180e]',
      style: {
        backgroundImage: 'radial-gradient(circle at 20% 80%, #14532d 0%, transparent 40%), radial-gradient(circle at 80% 20%, #064e3b 0%, transparent 40%)'
      },
      strokeColor: '#14532d', // Green 900
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
      strokeColor: '#164e63', // Cyan 900
      Icon: Anchor,
      iconColor: 'text-cyan-900'
    };
  }

  // 7. STREET / URBAN (Street, Square, Alley, Junction)
  if (type === 'street' || n.includes('street') || n.includes('square') || n.includes('alley') || n.includes('dead end') || n.includes('junction') || n.includes('roundabout') || n.includes('crossroads') || n.includes('site')) {
    return {
      bg: 'bg-[#1e293b]',
      style: {
        backgroundImage: 'linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px), linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px)',
        backgroundSize: '58px 58px'
      },
      strokeColor: '#475569', // Slate 600
      Icon: Building2,
      iconColor: 'text-slate-700'
    };
  }

  // 8. GENERIC ROOM
  return {
    bg: 'bg-[#171717]',
    style: {},
    strokeColor: '#404040', // Neutral 700
    Icon: Ghost, // Generic mysterious icon
    iconColor: 'text-neutral-800'
  };
};

// DOOM LIGHTING CONFIG
const getDoomLighting = (doom: number) => {
    // 0 is dead, 12 is safe.
    // Inverse scale: 0 is safe, 1.0 is danger.
    const danger = Math.max(0, 1 - (doom / 12)); 

    let overlayColor = 'rgba(10, 20, 40, 0.4)'; // Default cool blue
    let vignetteStrength = '60%'; // Open
    let animation = 'none';
    let contrast = 1;

    if (doom <= 3) {
        // Critical
        overlayColor = 'rgba(60, 0, 0, 0.2)'; 
        vignetteStrength = '90%'; // Tight
        animation = 'doom-flicker 4s infinite, doom-pulse-red 2s infinite';
        contrast = 1.2;
    } else if (doom <= 6) {
        // Warning
        overlayColor = 'rgba(40, 10, 40, 0.3)';
        vignetteStrength = '75%';
        animation = 'none';
        contrast = 1.1;
    }

    // Dynamic gradient
    const gradient = `radial-gradient(circle, transparent 30%, ${overlayColor} ${vignetteStrength}, #000 100%)`;

    return { gradient, animation, contrast, danger };
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
  floatingTexts = [],
  doom
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);
  const lastTouchDistance = useRef<number | null>(null);
  
  const [scale, setScale] = useState(0.8);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartRaw, setDragStartRaw] = useState({ x: 0, y: 0 }); // For threshold check

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setPosition({ x: width / 2, y: height / 2 });
    }
  }, []);

  // --- MOUSE HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    setDragStartRaw({ x: e.clientX, y: e.clientY });
    hasDragged.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    // Check threshold to avoid micro-movements counting as drags
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

  // --- TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent) => {
      // If 1 finger, treat as Drag/Pan start
      if (e.touches.length === 1) {
          setIsDragging(true);
          const t = e.touches[0];
          setDragStart({ x: t.clientX - position.x, y: t.clientY - position.y });
          setDragStartRaw({ x: t.clientX, y: t.clientY });
          hasDragged.current = false;
      } 
      // If 2 fingers, treat as Zoom start
      else if (e.touches.length === 2) {
          setIsDragging(false); // Stop dragging if we are now pinching
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );
          lastTouchDistance.current = dist;
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      // Pan
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
      // Zoom
      else if (e.touches.length === 2) {
          const dist = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY
          );

          if (lastTouchDistance.current !== null) {
              const delta = dist - lastTouchDistance.current;
              const sensitivity = 0.005; // Zoom speed
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

  // Calculate dynamic lighting based on Doom
  const lighting = getDoomLighting(doom);

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
      {/* Dynamic Lighting Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-20 transition-all duration-1000"
        style={{
            background: lighting.gradient,
            animation: lighting.animation,
            mixBlendMode: 'overlay' // Blend with the map
        }}
      />
      
      {/* Game Content */}
      <div 
        style={{ 
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
        className="absolute top-0 left-0 will-change-transform"
      >
        {/* TILES */}
        {tiles.map(tile => {
          const { x, y } = hexToPixel(tile.q, tile.r);
          const isVisible = visibleTiles.has(`${tile.q},${tile.r}`);
          const visual = getTileVisuals(tile.name, tile.type);
          
          if (!isVisible && !tile.explored) return null;

          return (
            <div
              key={tile.id}
              className={`absolute hex-clip flex items-center justify-center transition-all duration-500`}
              style={{
                width: `${HEX_SIZE * 2}px`,
                height: `${HEX_SIZE * 1.732}px`,
                left: `${x - HEX_SIZE}px`,
                top: `${y - HEX_SIZE * 0.866}px`,
              }}
              onClick={() => {
                if (!hasDragged.current) onTileClick(tile.q, tile.r);
              }}
            >
              {/* Inner Hex (Border + Background) */}
              <div 
                className={`absolute inset-[2px] hex-clip transition-all duration-500 ${visual.bg} relative overflow-hidden`}
              >
                 {/* Generated AI Image */}
                 {tile.imageUrl && (
                     <img src={tile.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay" />
                 )}

                 {/* CSS Pattern Fallback */}
                 {!tile.imageUrl && <div className="absolute inset-0 opacity-20" style={visual.style}></div>}

                 {/* Fog of War / Exploration Tint */}
                 <div className={`absolute inset-0 transition-opacity duration-1000 ${isVisible ? 'opacity-0' : 'opacity-70 bg-black'}`}></div>

                 {/* Tile Icon */}
                 <div className="relative z-10 flex flex-col items-center opacity-80 pointer-events-none">
                     <visual.Icon size={24} className={visual.iconColor} />
                 </div>

                 {/* Objects on Tile */}
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
              </div>

              {/* Selection Highlight */}
              <div className={`absolute inset-0 hex-clip pointer-events-none border-[3px] transition-all duration-300 ${tile.object?.blocking ? 'border-red-500/50' : 'border-transparent hover:border-white/30'}`}></div>
            </div>
          );
        })}

        {/* Possible Move Indicators */}
        {possibleMoves.map((move, i) => {
          const { x, y } = hexToPixel(move.q, move.r);
          return (
             <div
                key={`move-${i}`}
                className="absolute hex-clip flex items-center justify-center cursor-pointer opacity-30 hover:opacity-60 transition-opacity bg-white border-2 border-white border-dashed"
                style={{
                    width: `${HEX_SIZE * 2}px`,
                    height: `${HEX_SIZE * 1.732}px`,
                    left: `${x - HEX_SIZE}px`,
                    top: `${y - HEX_SIZE * 0.866}px`,
                }}
                onClick={() => {
                   if (!hasDragged.current) onTileClick(move.q, move.r);
                }}
             />
          );
        })}

        {/* PLAYERS */}
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
                    {/* Lantern Light Source */}
                    <div className="absolute inset-0 bg-amber-200/20 rounded-full animate-lantern pointer-events-none blur-xl scale-[3]"></div>
                    {/* Sanity Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                        <circle cx="22" cy="22" r="21" fill="none" stroke="#7e22ce" strokeWidth="2" strokeDasharray="132" strokeDashoffset={132 * (1 - player.sanity/player.maxSanity)} className="transition-all duration-500" />
                    </svg>
                </div>
            );
        })}

        {/* ENEMIES */}
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
                     {/* Selection Ring */}
                     {isSelected && <div className="absolute inset-[-4px] border-2 border-red-500 rounded-full animate-ping opacity-50"></div>}

                     <div className={`w-full h-full rounded-full bg-[#1a0505] border-2 ${isSelected ? 'border-red-500' : 'border-red-900'} flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.4)] relative`}>
                         {enemy.imageUrl ? (
                             <img src={enemy.imageUrl} alt={enemy.name} className="w-full h-full object-cover" />
                         ) : (
                             <MonsterVisual.Icon className={`${MonsterVisual.color}`} size={24} />
                         )}
                         
                         {/* Health Bar */}
                         <div className="absolute bottom-0 left-0 right-0 h-1 bg-black">
                             <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                         </div>
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
      
      {/* Zoom Controls (Mobile Friendly Overlay) */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-50 md:hidden">
          <button onClick={() => setScale(s => Math.min(s + 0.2, 1.5))} className="p-3 bg-slate-800/80 rounded-full text-white border border-slate-600">+</button>
          <button onClick={() => setScale(s => Math.max(s - 0.2, 0.3))} className="p-3 bg-slate-800/80 rounded-full text-white border border-slate-600">-</button>
      </div>
    </div>
  );
};

export default GameBoard;
