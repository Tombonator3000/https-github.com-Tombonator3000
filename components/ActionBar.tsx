
import React, { useState } from 'react';
import { Search, Sword, Heart, Package, LockOpen, Hammer, Wind, Zap, X, Eye, User, BookOpen } from 'lucide-react';
import { ContextAction, Spell } from '../types';
import Tooltip from './Tooltip';

interface ActionBarProps {
  onAction: (action: string, payload?: any) => void;
  actionsRemaining: number;
  isInvestigatorPhase: boolean;
  contextAction?: ContextAction | null; 
  spells: Spell[];
  activeSpell: Spell | null;
  // New props for sidebar toggles
  onToggleCharacter: () => void;
  showCharacter: boolean;
  onToggleInfo: () => void;
  showInfo: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ 
    onAction, actionsRemaining, isInvestigatorPhase, contextAction, spells, activeSpell,
    onToggleCharacter, showCharacter, onToggleInfo, showInfo
}) => {
  const [showSpellMenu, setShowSpellMenu] = useState(false);
  const disabled = actionsRemaining <= 0 || !isInvestigatorPhase;

  // Standard Actions with Descriptions
  const standardActions = [
    { 
        id: 'investigate', 
        label: 'Investigate', 
        icon: Search, 
        color: 'hover:text-green-400',
        title: "Search Area",
        desc: "Roll Investigation dice. Success reveals hidden Items or Clues in your current tile. Essential for progress." 
    },
    { 
        id: 'attack', 
        label: 'Attack', 
        icon: Sword, 
        color: 'hover:text-red-400',
        title: "Combat",
        desc: "Roll Combat dice against a target in range. Hits deal damage based on your weapon."
    },
    { 
        id: 'flee', 
        label: 'Flee', 
        icon: Wind, 
        color: 'hover:text-cyan-400',
        title: "Evasion",
        desc: "Roll Agility to leave a tile containing enemies without taking damage."
    },
    { 
        id: 'rest', 
        label: 'Rest', 
        icon: Heart, 
        color: 'hover:text-pink-400',
        title: "Recover",
        desc: "Spend an action to heal 1 Health OR 1 Sanity. Cannot be performed if enemies are present."
    },
    { 
        id: 'item', 
        label: 'Item', 
        icon: Package, 
        color: 'hover:text-yellow-400',
        title: "Use Item",
        desc: "Use a consumable item from your inventory, such as a Medkit or Whiskey."
    }
  ];

  const getContextIcon = (type: string) => {
      switch(type) {
          case 'strength': return Hammer;
          case 'agility': return Wind;
          case 'insight': return LockOpen;
          default: return Hammer;
      }
  };

  const renderTooltipContent = (title: string, desc: string) => (
      <div className="text-center w-48">
          <div className="font-bold text-[#e94560] uppercase tracking-wider mb-1 border-b border-slate-700 pb-1">{title}</div>
          <div className="text-xs text-slate-300 leading-snug">{desc}</div>
      </div>
  );

  return (
    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto max-w-[90vw] md:max-w-none pb-1 md:pb-0 hide-scrollbar relative">
      
      {/* LEFT TOGGLE: CHARACTER SHEET */}
      <button 
        onClick={onToggleCharacter}
        className={`group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border transition-all duration-200 shrink-0 ${showCharacter ? 'bg-amber-900/40 border-amber-500 text-amber-100' : 'bg-[#1a1a2e] border-slate-700 text-slate-500 hover:border-amber-600 hover:text-amber-500'}`}
      >
          <User size={20} className="mb-1" />
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider hidden md:block">Char</span>
      </button>

      <div className="w-px h-12 bg-slate-800 mx-1"></div>

      {/* MAIN ACTION BAR CONTENT */}
      {contextAction ? (
          <Tooltip 
            variant="action"
            content={renderTooltipContent(contextAction.label, `Test ${contextAction.iconType.toUpperCase()} vs Difficulty ${contextAction.difficulty}. Success removes the obstacle.`)} 
            position="top"
          >
            <button 
                onClick={() => onAction('interact')}
                disabled={disabled}
                className={`
                    flex items-center gap-2 md:gap-4 px-4 py-2 md:px-8 md:py-4 rounded-xl border-2 
                    ${disabled ? 'border-slate-700 bg-slate-900 opacity-50' : 'border-amber-500 bg-amber-900/40 hover:bg-amber-800/60 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}
                    transition-all duration-300 animate-in zoom-in shrink-0
                `}
            >
                {React.createElement(getContextIcon(contextAction.iconType), { className: "text-amber-400 w-6 h-6 md:w-8 md:h-8" })}
                <div className="text-left">
                    <div className="text-xs md:text-sm font-bold text-white uppercase tracking-widest">{contextAction.label}</div>
                    <div className="text-[9px] md:text-[10px] text-amber-300/80">Diff: {contextAction.difficulty}+</div>
                </div>
            </button>
          </Tooltip>
      ) : (
          <div className="flex items-center gap-1 md:gap-2">
            {standardActions.map(action => (
                <Tooltip key={action.id} variant="action" content={renderTooltipContent(action.title, action.desc)} position="top">
                    <button
                    disabled={disabled}
                    onClick={() => onAction(action.id)}
                    className={`
                        group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border 
                        ${disabled ? 'opacity-30 border-slate-800 grayscale cursor-not-allowed' : 'border-slate-700 hover:border-[#e94560] bg-[#1a1a2e]'}
                        transition-all duration-200 shrink-0
                    `}
                    >
                    <action.icon className={`mb-0 md:mb-1 transition-colors ${action.color} w-5 h-5 md:w-6 md:h-6`} />
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white hidden md:block">{action.label}</span>
                    </button>
                </Tooltip>
            ))}
            
            {/* SPELL BUTTON CONTAINER */}
            <div className="relative">
                {/* Spell Menu Popover */}
                {showSpellMenu && !disabled && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-[#1a0525] border-2 border-purple-500 rounded-lg shadow-[0_0_30px_rgba(168,85,247,0.5)] w-56 overflow-hidden z-50 animate-in slide-in-from-bottom-4 duration-200">
                        <div className="bg-purple-900/40 p-2 text-center text-xs font-bold text-purple-300 border-b border-purple-500/30 uppercase tracking-widest">
                            Grimoire
                        </div>
                        <div className="flex flex-col max-h-60 overflow-y-auto">
                            {spells.length === 0 ? (
                                <div className="p-4 text-center text-slate-500 italic text-xs">No spells memorized.</div>
                            ) : (
                                spells.map(spell => (
                                    <button 
                                        key={spell.id}
                                        onClick={() => {
                                            onAction('cast', spell);
                                            setShowSpellMenu(false);
                                        }}
                                        className="text-left p-3 hover:bg-purple-900/30 border-b border-purple-900/20 group transition-colors"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-purple-200 font-bold text-xs uppercase group-hover:text-white">{spell.name}</span>
                                            <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded text-cyan-400 font-bold border border-cyan-900 flex items-center gap-1">
                                                <Eye size={10} /> {spell.cost}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-purple-400/80 italic">{spell.description}</div>
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[9px] uppercase tracking-wider text-slate-500">Range: {spell.range === 0 ? 'Self' : spell.range}</span>
                                            <span className="text-[9px] uppercase tracking-wider text-slate-500">Effect: {spell.effectType}</span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Spell Button / Cancel Button */}
                {activeSpell ? (
                    <Tooltip variant="action" content={renderTooltipContent("Cancel Spell", "Stop targeting and cancel the spell.")} position="top">
                        <button
                            onClick={() => onAction('cancel_cast')}
                            className={`
                                group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border ml-1 md:ml-2
                                border-red-500 bg-red-900/20 hover:bg-red-900/40 animate-pulse
                                transition-all duration-200 shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)]
                            `}
                        >
                            <X className={`mb-0 md:mb-1 text-red-400 w-5 h-5 md:w-6 md:h-6`} />
                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-red-300 hidden md:block">Cancel</span>
                        </button>
                    </Tooltip>
                ) : (
                    spells.length > 0 && (
                        <Tooltip variant="action" content={renderTooltipContent("Cast Spell", "Unleash eldritch powers. Consumes Insight points.")} position="top">
                            <button
                                disabled={disabled}
                                onClick={() => setShowSpellMenu(!showSpellMenu)}
                                className={`
                                    group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border ml-1 md:ml-2
                                    ${disabled ? 'opacity-30 border-slate-800 grayscale cursor-not-allowed' : 'border-purple-600 hover:border-purple-400 bg-purple-900/20'}
                                    transition-all duration-200 shrink-0 ${showSpellMenu ? 'bg-purple-800/40 border-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : ''}
                                `}
                            >
                                <Zap className={`mb-0 md:mb-1 transition-colors text-purple-500 group-hover:text-purple-300 w-5 h-5 md:w-6 md:h-6`} />
                                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-purple-300 group-hover:text-white hidden md:block">Cast</span>
                            </button>
                        </Tooltip>
                    )
                )}
            </div>
          </div>
      )}
      
      {/* Action Points Visualizer */}
      <div className="ml-1 md:ml-2 pl-2 md:pl-4 border-l border-slate-800 flex flex-col justify-center items-center gap-1 md:gap-2 shrink-0">
        <div className="text-[8px] md:text-[9px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-0 md:mb-1">AP</div>
        <div className="flex gap-1 md:gap-2">
          {[1, 2].map(i => {
            const isActive = i <= actionsRemaining;
            return (
                <div 
                    key={i} 
                    className={`
                        w-3 h-3 md:w-5 md:h-5 rounded-full border-2 transition-all duration-500 flex items-center justify-center
                        ${isActive 
                            ? 'bg-[#e94560] border-white shadow-[0_0_15px_#e94560] scale-110' 
                            : 'bg-transparent border-slate-800 scale-90 opacity-40'}
                    `}
                >
                    {isActive && <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-white rounded-full animate-pulse"></div>}
                </div>
            );
          })}
        </div>
      </div>

      <div className="w-px h-12 bg-slate-800 mx-1"></div>

      {/* RIGHT TOGGLE: LOG/INFO */}
      <button 
        onClick={onToggleInfo}
        className={`group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border transition-all duration-200 shrink-0 ${showInfo ? 'bg-slate-800 border-white text-white' : 'bg-[#1a1a2e] border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-300'}`}
      >
          <BookOpen size={20} className="mb-1" />
          <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider hidden md:block">Log</span>
      </button>

    </div>
  );
};

export default ActionBar;
