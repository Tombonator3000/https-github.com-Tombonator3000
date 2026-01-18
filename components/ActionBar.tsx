
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
    { id: 'item', label: 'Use Item', icon: Package, color: 'hover:text-yellow-400' }
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
    <div className="flex items-center gap-4">
      
      {/* If we have a context action (selected a blocker), show BIG button */}
      {contextAction ? (
          <button 
            onClick={() => onAction('interact')}
            disabled={disabled}
            className={`
                flex items-center gap-4 px-8 py-4 rounded-xl border-2 
                ${disabled ? 'border-slate-700 bg-slate-900 opacity-50' : 'border-amber-500 bg-amber-900/40 hover:bg-amber-800/60 shadow-[0_0_20px_rgba(245,158,11,0.4)]'}
                transition-all duration-300 animate-in zoom-in
            `}
          >
             {React.createElement(getContextIcon(contextAction.iconType), { size: 32, className: "text-amber-400" })}
             <div className="text-left">
                 <div className="text-sm font-bold text-white uppercase tracking-widest">{contextAction.label}</div>
                 <div className="text-[10px] text-amber-300/80">Difficulty: {contextAction.difficulty}+</div>
             </div>
          </button>
      ) : (
          <div className="flex items-center gap-2">
            {standardActions.map(action => (
                <button
                key={action.id}
                disabled={disabled}
                onClick={() => onAction(action.id)}
                className={`
                    group flex flex-col items-center justify-center w-20 h-20 rounded border 
                    ${disabled ? 'opacity-30 border-slate-800 grayscale cursor-not-allowed' : 'border-slate-700 hover:border-[#e94560] bg-[#1a1a2e]'}
                    transition-all duration-200
                `}
                >
                <action.icon className={`mb-1 transition-colors ${action.color}`} size={24} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-white">{action.label}</span>
                </button>
            ))}
            
            {/* SPELL BUTTON */}
            {hasSpells && (
                <button
                disabled={disabled}
                onClick={() => onAction('cast')}
                className={`
                    group flex flex-col items-center justify-center w-20 h-20 rounded border ml-2
                    ${disabled ? 'opacity-30 border-slate-800 grayscale cursor-not-allowed' : 'border-purple-600 hover:border-purple-400 bg-purple-900/20'}
                    transition-all duration-200
                `}
                >
                <Zap className={`mb-1 transition-colors text-purple-500 group-hover:text-purple-300`} size={24} />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 group-hover:text-white">Cast</span>
                </button>
            )}
          </div>
      )}
      
      <div className="ml-2 pl-4 border-l border-slate-800 flex flex-col justify-center">
        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Actions Left</div>
        <div className="flex gap-1">
          {[1, 2].map(i => (
            <div key={i} className={`w-4 h-4 rounded-sm rotate-45 border ${i <= actionsRemaining ? 'bg-[#e94560] border-white' : 'bg-slate-900 border-slate-800'}`}></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActionBar;
