
import React from 'react';
import { Enemy } from '../types';
import { BESTIARY } from '../constants';
import { Skull, Swords, Brain, Activity, Crosshair, BookOpen, X } from 'lucide-react';
import Tooltip from './Tooltip';

interface EnemyPanelProps {
  enemy: Enemy;
  onClose?: () => void;
}

const EnemyPanel: React.FC<EnemyPanelProps> = ({ enemy, onClose }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  const info = BESTIARY[enemy.type];

  return (
    <div className="bg-[#0a0a1a]/95 backdrop-blur-2xl border-2 border-purple-600/50 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden animate-in slide-in-from-right duration-300 w-full h-full flex flex-col">
      <div className="bg-purple-900/20 p-4 border-b border-purple-600/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Skull className="text-purple-500" size={20} />
          <h2 className="text-xl font-display text-white italic tracking-tight uppercase">{enemy.name}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
              <X size={20} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {enemy.imageUrl && (
            <div className="w-full h-48 bg-black relative shrink-0">
                <img src={enemy.imageUrl} alt={enemy.name} className="w-full h-full object-cover opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a1a] to-transparent"></div>
            </div>
        )}

        <div className="p-6 space-y-5">
            {/* Enemy HP */}
            <div>
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                <span className="flex items-center gap-1"><Activity size={12} /> Vitalitet</span>
                <span>{enemy.hp} / {enemy.maxHp}</span>
            </div>
            <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div 
                className="h-full bg-purple-600 transition-all duration-700 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
                style={{ width: `${hpPercent}%` }}
                ></div>
            </div>
            </div>

            {/* Threat Stats */}
            <div className="grid grid-cols-2 gap-3">
            <Tooltip variant="action" content="Damage dealt to your Health when this enemy attacks." position="top">
                <div className="bg-black/40 border border-slate-800 p-3 rounded flex flex-col items-center relative overflow-hidden w-full cursor-help">
                    {enemy.attackType === 'ranged' && <div className="absolute top-1 right-1 text-[8px] bg-red-900 text-white px-1 rounded">RANGED</div>}
                    {enemy.attackType === 'doom' && <div className="absolute top-1 right-1 text-[8px] bg-purple-900 text-white px-1 rounded">DOOM</div>}
                    
                    <Swords size={18} className="text-red-500 mb-1" />
                    <span className="text-lg font-bold text-white tabular-nums">{enemy.damage}</span>
                    <span className="text-[8px] text-slate-500 uppercase font-sans tracking-tighter">Kampstyrke</span>
                </div>
            </Tooltip>
            <Tooltip variant="lore" content="Sanity damage dealt when you encounter or are attacked by this horror." position="top">
                <div className="bg-black/40 border border-slate-800 p-3 rounded flex flex-col items-center w-full cursor-help">
                    <Brain size={18} className="text-purple-400 mb-1" />
                    <span className="text-lg font-bold text-white tabular-nums">{enemy.horror}</span>
                    <span className="text-[8px] text-slate-500 uppercase font-sans tracking-tighter">Skrekk-nivå</span>
                </div>
            </Tooltip>
            </div>

            {/* Ranged Info */}
            {(enemy.attackRange > 1 || enemy.attackType !== 'melee') && (
                <div className="bg-slate-900/50 border border-slate-700 p-2 rounded flex items-center gap-3">
                    <Crosshair size={16} className="text-amber-500" />
                    <div>
                        <div className="text-[10px] font-bold text-slate-300 uppercase">Attack Range: {enemy.attackRange}</div>
                        <div className="text-[9px] text-slate-500 italic">
                            {enemy.attackType === 'ranged' ? 'Fires projectiles from distance.' : enemy.attackType === 'doom' ? 'Chants rituals to increase Doom.' : 'Psychic attacks.'}
                        </div>
                    </div>
                </div>
            )}

            {/* Classification */}
            <div className="pt-2 border-t border-slate-800 pb-16 md:pb-0">
            <div className="text-[9px] text-slate-600 uppercase tracking-widest font-sans font-bold mb-1 flex items-center gap-2">
                <BookOpen size={10} /> Arkham Files
            </div>
            <p className="text-xs text-slate-400 italic">
                "{info?.description || 'A creature of unknown origin.'}"
            </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EnemyPanel;
