
import React, { useState } from 'react';
import { Player, Item } from '../types';
import { Heart, Brain, Eye, Star, AlertCircle, RefreshCw, Trash2, Gift } from 'lucide-react';

interface CharacterPanelProps {
  player: Player;
  allPlayers: Player[]; // Needed to find trade targets
  onTrade: (item: Item, targetPlayerId: string) => void;
  onDrop: (item: Item) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ player, allPlayers, onTrade, onDrop }) => {
  const hpPercent = (player.hp / player.maxHp) * 100;
  const sanPercent = (player.sanity / player.maxSanity) * 100;

  // Find players on the same tile (excluding self)
  const potentialTradeTargets = allPlayers.filter(p => 
    p.instanceId !== player.instanceId && // Using instanceId for robustness, though id works for non-veterans
    p.id !== player.id && // Fallback
    !p.isDead &&
    p.position.q === player.position.q && 
    p.position.r === player.position.r
  );

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-display text-white italic leading-none">{player.name}</h2>
        <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Investigator</p>
      </div>

      <div className="space-y-6 overflow-y-auto flex-1 pr-2">
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
        
        {/* INVENTORY MANAGEMENT */}
        <div className="pt-4 border-t border-slate-800">
           <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">Inventory Management</h3>
           <div className="space-y-3">
             {player.inventory.length === 0 ? (
                <p className="text-[10px] italic text-slate-600">No items to manage.</p>
             ) : (
                player.inventory.map((item, idx) => (
                    <div key={idx} className="bg-slate-900/50 p-2 rounded border border-slate-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-300">{item.name}</span>
                            <span className="text-[9px] text-slate-500 uppercase">{item.type}</span>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onDrop(item)}
                                className="flex-1 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 py-1 px-2 rounded text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-colors"
                            >
                                <Trash2 size={10} /> Drop
                            </button>
                            
                            {potentialTradeTargets.length > 0 && (
                                <div className="flex-1 relative group">
                                     <button className="w-full bg-blue-900/20 hover:bg-blue-900/40 border border-blue-900/30 text-blue-400 py-1 px-2 rounded text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-colors">
                                        <Gift size={10} /> Give
                                     </button>
                                     <div className="absolute bottom-full left-0 w-full mb-1 hidden group-hover:flex flex-col gap-1 bg-slate-900 border border-slate-700 p-1 rounded shadow-xl z-50">
                                         {potentialTradeTargets.map(target => (
                                             <button 
                                                key={target.instanceId || target.id}
                                                onClick={() => onTrade(item, target.instanceId || target.id)}
                                                className="text-[9px] text-slate-300 hover:text-white hover:bg-slate-800 p-1 rounded text-left whitespace-nowrap"
                                             >
                                                 To {target.name}
                                             </button>
                                         ))}
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterPanel;
