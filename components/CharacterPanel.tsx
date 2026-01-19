
import React, { useState, useEffect } from 'react';
import { Player, Item } from '../types';
import { 
    Heart, Brain, Eye, Star, AlertCircle, Trash2, Gift, ShieldCheck, 
    Backpack, Sword, Search, Zap, Cross, FileQuestion, X, Syringe, User
} from 'lucide-react';
import Tooltip from './Tooltip';

interface CharacterPanelProps {
  player: Player | null;
  allPlayers: Player[];
  onTrade: (item: Item, targetPlayerId: string) => void;
  onDrop: (item: Item) => void;
  onUse?: (item: Item) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ player, allPlayers, onTrade, onDrop, onUse }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  if (!player) return null;

  const hpPercent = (player.hp / player.maxHp) * 100;
  const sanPercent = (player.sanity / player.maxSanity) * 100;

  const getItemIcon = (type: string) => {
      switch (type) {
          case 'weapon': return <Sword size={18} />;
          case 'tool': return <Search size={18} />;
          case 'relic': return <Zap size={18} />;
          case 'armor': return <ShieldCheck size={18} />;
          case 'consumable': return <Cross size={18} />;
          default: return <FileQuestion size={18} />;
      }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a120b] text-[#d4c5a3] font-serif relative overflow-hidden border-2 border-[#e94560] rounded-2xl shadow-[0_0_30px_rgba(233,69,96,0.3)]">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] pointer-events-none"></div>

      <div className="p-6 pb-4 border-b-2 border-[#3e2c20] relative z-10 shrink-0">
        <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-xl border-4 border-[#2a1d18] shadow-lg overflow-hidden bg-black shrink-0">
                {player.imageUrl ? (
                    <img src={player.imageUrl} alt="" className="w-full h-full object-cover sepia-[0.3]" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#5c4033]"><User size={40} /></div>
                )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl font-display italic text-[#eecfa1] tracking-wide leading-none truncate">{player.name}</h2>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8b6b4e] mt-2">{player.id}</div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 custom-scrollbar momentum-scroll">
        <div className="space-y-4">
            <div>
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#a63a3a] flex items-center gap-1"><Heart size={10} fill="currentColor" /> Vitality</span>
                    <span className="text-sm font-display text-[#eecfa1]">{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-2.5 bg-black border border-[#3e2c20] p-[1px] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7f1d1d] to-[#ef4444] transition-all duration-700" style={{ width: `${hpPercent}%` }}></div>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#6d28d9] flex items-center gap-1"><Brain size={10} fill="currentColor" /> Sanity</span>
                    <span className="text-sm font-display text-[#eecfa1]">{player.sanity} / {player.maxSanity}</span>
                </div>
                <div className="h-2.5 bg-black border border-[#3e2c20] p-[1px] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#4c1d95] to-[#a855f7] transition-all duration-700" style={{ width: `${sanPercent}%` }}></div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#231710] border border-[#3e2c20] p-3 rounded flex flex-col items-center">
                <span className="text-[9px] text-[#8b6b4e] uppercase tracking-widest mb-1">Insight</span>
                <div className="flex items-center gap-2 text-[#eecfa1]">
                    <Eye size={16} />
                    <span className="text-xl font-bold">{player.insight}</span>
                </div>
            </div>
            <div className="bg-[#231710] border border-[#3e2c20] p-3 rounded flex flex-col items-center">
                <span className="text-[9px] text-[#8b6b4e] uppercase tracking-widest mb-1">Actions</span>
                <div className="flex items-center gap-2 text-[#eecfa1]">
                    <Star size={16} />
                    <span className="text-xl font-bold">{player.actions}</span>
                </div>
            </div>
        </div>

        <div className="pt-4 border-t border-[#3e2c20]/50">
            <h3 className="text-[10px] text-[#8b6b4e] uppercase tracking-widest mb-1">Ability</h3>
            <p className="text-sm text-[#d4c5a3] italic">"{player.special}"</p>
        </div>

        <div className="pt-4 border-t-2 border-[#3e2c20]">
            <h3 className="text-[10px] font-bold text-[#eecfa1] uppercase tracking-widest mb-3 flex items-center gap-2">
                <Backpack size={12} /> Inventory ({player.inventory.length}/6)
            </h3>
            <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 6 }).map((_, index) => {
                    const item = player.inventory[index];
                    return (
                        <div key={index} className={`aspect-square border-2 rounded-lg flex items-center justify-center transition-all ${item ? 'bg-[#150f0a] border-[#eecfa1] text-[#eecfa1]' : 'bg-black/40 border-[#3e2c20] opacity-30'}`}>
                            {item && getItemIcon(item.type)}
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;
