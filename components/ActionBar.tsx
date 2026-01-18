
import React from 'react';
import { Search, Sword, Heart, Package, LockOpen, Hammer, Wind, Zap } from 'lucide-react';
import { ContextAction } from '../types';

interface ActionBarProps {
  onAction: (action: string) => void;
  actionsRemaining: number;
  isInvestigatorPhase: boolean;
  contextAction?: ContextAction | null; // Context specific action (e.g. "Break Door")
  hasSpells?: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({ onAction, actionsRemaining, isInvestigatorPhase, contextAction, hasSpells }) => {
  const disabled = actionsRemaining <= 0 || !isInvestigatorPhase;

  // Standard Actions
  const standardActions = [
    { id: 'investigate', label: 'Investigate', icon: Search, color: 'hover:text-green-400' },
    { id: 'attack', label: 'Attack', icon: Sword, color: 'hover:text-red-400' },
    { id: 'flee', label: 'Flee', icon: Wind, color: 'hover:text-cyan-400' },
    { id: 'rest', label: 'Rest', icon: Heart, color: 'hover:text-pink-400' },
    { id: 'item', label: 'Item', icon: Package, color: 'hover:text-yellow-400' }
  ];

  const getContextIcon = (type: string) => {
      switch(type) {
          case 'strength': return Hammer;
          case 'agility': return Wind;
          case 'insight': return LockOpen;
          default: return Hammer;
      }
  };

  return (
    <div className="flex items-center gap-2 md:gap-4 overflow-x-auto max-w-[90vw] md:max-w-none pb-1 md:pb-0 hide-scrollbar">
      
      {/* If we have a context action (selected a blocker), show BIG button */}
      {contextAction ? (
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
      ) : (
          <div className="flex items-center gap-1 md:gap-2">
            {standardActions.map(action => (
                <button
                key={action.id}
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
            ))}
            
            {/* SPELL BUTTON */}
            {hasSpells && (
                <button
                disabled={disabled}
                onClick={() => onAction('cast')}
                className={`
                    group flex flex-col items-center justify-center w-14 h-14 md:w-20 md:h-20 rounded border ml-1 md:ml-2
                    ${disabled ? 'opacity-30 border-slate-800 grayscale cursor-not-allowed' : 'border-purple-600 hover:border-purple-400 bg-purple-900/20'}
                    transition-all duration-200 shrink-0
                `}
                >
                <Zap className={`mb-0 md:mb-1 transition-colors text-purple-500 group-hover:text-purple-300 w-5 h-5 md:w-6 md:h-6`} />
                <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-wider text-purple-300 group-hover:text-white hidden md:block">Cast</span>
                </button>
            )}
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
    </div>
  );
};

export default ActionBar;
