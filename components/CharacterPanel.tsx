
import React from 'react';
import { Player } from '../types';
import { Heart, Brain, Eye, Star, AlertCircle } from 'lucide-react';

interface CharacterPanelProps {
  player: Player;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ player }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const sanPercent = (player.sanity / player.maxSanity) * 100;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-3xl font-display text-white italic leading-none">{player.name}</h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Investigator</p>
      </div>

      <div className="space-y-6">
        {/* HP Bar */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-bold text-red-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Heart size={14} /> Health</span>
            <span>{player.hp} / {player.maxHp}</span>
          </div>
          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-red-600 transition-all duration-500 shadow-[0_0_10px_rgba(220,38,38,0.5)]" 
              style={{ width: `${hpPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Sanity Bar */}
        <div>
          <div className="flex justify-between items-center mb-1 text-xs font-bold text-purple-400 uppercase tracking-widest">
            <span className="flex items-center gap-1"><Brain size={14} /> Sanity</span>
            <span>{player.sanity} / {player.maxSanity}</span>
          </div>
          <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-purple-600 transition-all duration-500 shadow-[0_0_10px_rgba(124,58,237,0.5)]" 
              style={{ width: `${sanPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Mental Condition (Active Madness) */}
        {player.activeMadness && (
          <div className="bg-purple-900/10 border border-purple-500/50 p-4 rounded animate-in fade-in duration-500">
             <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold text-purple-300 uppercase tracking-widest">Mental Condition</h3>
             </div>
             <p className="text-lg font-display text-white italic mb-1">{player.activeMadness.name}</p>
             <p className="text-[10px] text-purple-200/70 italic leading-relaxed">{player.activeMadness.description}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1a2e] p-3 rounded border border-slate-800 text-center">
            <Eye className="mx-auto text-green-500 mb-1" size={20} />
            <div className="text-lg font-bold text-white">{player.insight}</div>
            <div className="text-[10px] text-slate-500 uppercase">Insight</div>
          </div>
          <div className="bg-[#1a1a2e] p-3 rounded border border-slate-800 text-center">
             <Star className="mx-auto text-yellow-500 mb-1" size={20} />
             <div className="text-lg font-bold text-white">{player.actions}</div>
             <div className="text-[10px] text-slate-500 uppercase">Actions</div>
          </div>
        </div>

        {/* Abilities */}
        <div className="pt-4 border-t border-slate-800">
           <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Passive Ability</h3>
           <p className="text-sm text-slate-300 italic">"{player.special}"</p>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
