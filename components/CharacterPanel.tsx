
import React, { useState, useEffect } from 'react';
import { Player, Item } from '../types';
import { 
    Heart, Brain, Eye, Star, AlertCircle, Trash2, Gift, ShieldCheck, 
    Backpack, Sword, Search, Zap, Cross, FileQuestion, X
} from 'lucide-react';

interface CharacterPanelProps {
  player: Player;
  allPlayers: Player[];
  onTrade: (item: Item, targetPlayerId: string) => void;
  onDrop: (item: Item) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ player, allPlayers, onTrade, onDrop }) => {
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [confirmDrop, setConfirmDrop] = useState(false);

  // Reset selection if inventory changes (e.g. item dropped)
  useEffect(() => {
      if (selectedItem && !player.inventory.includes(selectedItem)) {
          setSelectedItem(null);
          setConfirmDrop(false);
      }
  }, [player.inventory, selectedItem]);

  const hpPercent = (player.hp / player.maxHp) * 100;
  const sanPercent = (player.sanity / player.maxSanity) * 100;

  // Find nearby players for trading
  const potentialTradeTargets = allPlayers.filter(p => 
    p.instanceId !== player.instanceId && 
    p.id !== player.id && 
    !p.isDead &&
    p.position.q === player.position.q && 
    p.position.r === player.position.r
  );

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
    <div className="h-full flex flex-col bg-[#1a120b] text-[#d4c5a3] font-serif relative overflow-hidden">
      {/* Background Texture Effect */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] opacity-40 pointer-events-none"></div>
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.8)] pointer-events-none"></div>

      {/* --- HEADER --- */}
      <div className="p-4 md:p-6 pb-2 md:pb-4 border-b-2 border-[#3e2c20] relative z-10 shrink-0">
        <div className="flex gap-4 items-start">
            {/* Portrait Frame */}
            <div className="relative shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded border-4 border-[#2a1d18] shadow-lg overflow-hidden bg-black">
                    {player.imageUrl ? (
                        <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover sepia-[0.3]" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#2a1d18] text-[#5c4033]">
                            <Star size={32} />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-2xl md:text-3xl font-display italic text-[#eecfa1] tracking-wide leading-none drop-shadow-md truncate">{player.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-[#8b6b4e]">{player.id}</span>
                    {player.traits && player.traits.length > 0 && <span className="text-xs text-[#5c4033]">•</span>}
                    <span className="text-[10px] md:text-xs text-[#8b6b4e] italic">Lvl {player.traits.length + 1}</span>
                </div>
            </div>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 relative z-10 custom-scrollbar pb-20 md:pb-6">
        
        {/* VITALITY & SANITY */}
        <div className="space-y-4">
            {/* Health */}
            <div>
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#a63a3a] flex items-center gap-1"><Heart size={12} fill="currentColor" /> Vitality</span>
                    <span className="text-sm font-display text-[#eecfa1]">{player.hp} / {player.maxHp}</span>
                </div>
                <div className="h-3 bg-[#0f0a08] border border-[#3e2c20] p-[1px]">
                    <div className="h-full bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] transition-all duration-500 relative" style={{ width: `${hpPercent}%` }}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20"></div>
                    </div>
                </div>
            </div>

            {/* Sanity */}
            <div>
                <div className="flex justify-between items-end mb-1 px-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#6d28d9] flex items-center gap-1"><Brain size={12} fill="currentColor" /> Sanity</span>
                    <span className="text-sm font-display text-[#eecfa1]">{player.sanity} / {player.maxSanity}</span>
                </div>
                <div className="h-3 bg-[#0f0a08] border border-[#3e2c20] p-[1px]">
                    <div className="h-full bg-gradient-to-r from-[#4c1d95] to-[#5b21b6] transition-all duration-500 relative" style={{ width: `${sanPercent}%` }}>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise.png')] opacity-20"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* CORE STATS */}
        <div className="flex gap-4">
            <div className="flex-1 bg-[#231710] border border-[#3e2c20] p-3 flex flex-col items-center shadow-inner">
                <span className="text-[10px] text-[#8b6b4e] uppercase tracking-widest mb-1">Insight</span>
                <div className="flex items-center gap-2 text-[#eecfa1]">
                    <Eye size={20} />
                    <span className="text-2xl font-display font-bold">{player.insight}</span>
                </div>
            </div>
            <div className="flex-1 bg-[#231710] border border-[#3e2c20] p-3 flex flex-col items-center shadow-inner">
                <span className="text-[10px] text-[#8b6b4e] uppercase tracking-widest mb-1">Actions</span>
                <div className="flex items-center gap-2 text-[#eecfa1]">
                    <Star size={20} />
                    <span className="text-2xl font-display font-bold">{player.actions}</span>
                </div>
            </div>
        </div>

        {/* MENTAL CONDITION */}
        {player.activeMadness && (
            <div className="bg-[#2a1215] border border-[#7f1d1d] p-4 relative overflow-hidden animate-in fade-in">
                <div className="absolute -right-4 -top-4 text-[#7f1d1d] opacity-20"><Brain size={64} /></div>
                <h3 className="text-[#fca5a5] font-display italic text-lg flex items-center gap-2 mb-1">
                    <AlertCircle size={16} /> {player.activeMadness.name}
                </h3>
                <p className="text-xs text-[#fecaca]/80 italic leading-relaxed">{player.activeMadness.description}</p>
            </div>
        )}

        {/* TRAITS */}
        {player.traits && player.traits.length > 0 && (
            <div>
                <h3 className="text-xs font-bold text-[#8b6b4e] uppercase tracking-widest mb-2 flex items-center gap-2">
                    <ShieldCheck size={14} /> Veteran Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                    {player.traits.map(trait => (
                        <div key={trait.id} className={`px-2 py-1 border text-[10px] uppercase font-bold tracking-wider ${
                            trait.type === 'positive' 
                            ? 'border-[#14532d] bg-[#052e16] text-[#86efac]' 
                            : 'border-[#7f1d1d] bg-[#450a0a] text-[#fca5a5]'
                        }`}>
                            {trait.name}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* PASSIVE */}
        <div className="pt-4 border-t border-[#3e2c20]/50">
            <h3 className="text-[10px] text-[#8b6b4e] uppercase tracking-widest mb-1">Innate Ability</h3>
            <p className="text-sm text-[#d4c5a3] italic font-serif">"{player.special}"</p>
        </div>

        {/* INVENTORY SYSTEM 2.0 */}
        <div className="pt-4 border-t-2 border-[#3e2c20]">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-[#eecfa1] uppercase tracking-widest flex items-center gap-2">
                    <Backpack size={16} /> Inventory
                </h3>
                <span className="text-[10px] text-[#8b6b4e]">{player.inventory.length} / 6 Slots</span>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                {Array.from({ length: 6 }).map((_, index) => {
                    const item = player.inventory[index];
                    const isSelected = selectedItem === item && item !== undefined;

                    return (
                        <button
                            key={index}
                            onClick={() => {
                                if (item) {
                                    setSelectedItem(item);
                                    setConfirmDrop(false); // Reset confirmation when switching items
                                }
                            }}
                            disabled={!item}
                            className={`
                                aspect-square border-2 relative flex items-center justify-center transition-all group
                                ${item 
                                    ? (isSelected 
                                        ? 'bg-[#3e2c20] border-[#eecfa1] shadow-[0_0_10px_rgba(238,207,161,0.2)]' 
                                        : 'bg-[#150f0a] border-[#3e2c20] hover:border-[#8b6b4e]') 
                                    : 'bg-[#0f0a08] border-[#231710] cursor-default'
                                }
                            `}
                        >
                            {item ? (
                                <div className={`flex flex-col items-center gap-1 ${isSelected ? 'text-[#eecfa1]' : 'text-[#8b6b4e]'}`}>
                                    {getItemIcon(item.type)}
                                    {/* Small type indicator dot */}
                                    <div className={`w-1 h-1 rounded-full mt-1 ${item.type === 'weapon' ? 'bg-red-500' : item.type === 'relic' ? 'bg-purple-500' : 'bg-slate-500'}`}></div>
                                </div>
                            ) : (
                                <div className="text-[#231710] opacity-50 text-xs font-display"></div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Selected Item Detail View */}
            {selectedItem ? (
                <div className="bg-[#150f0a] border border-[#3e2c20] p-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h4 className="text-[#eecfa1] font-bold text-sm uppercase tracking-wide">{selectedItem.name}</h4>
                            <span className="text-[10px] text-[#8b6b4e] uppercase">{selectedItem.type}</span>
                        </div>
                        <button onClick={() => setSelectedItem(null)} className="text-[#5c4033] hover:text-[#eecfa1]">
                            <X size={14} />
                        </button>
                    </div>
                    
                    <p className="text-xs text-[#d4c5a3] italic mb-4 leading-relaxed border-l-2 border-[#3e2c20] pl-2">
                        {selectedItem.effect}
                    </p>

                    {/* Stat Bonus Tag */}
                    {selectedItem.statModifier && (
                        <div className="mb-4 inline-block px-2 py-1 bg-[#231710] text-[10px] text-amber-500 uppercase font-bold tracking-widest border border-[#3e2c20]">
                            {selectedItem.statModifier.replace('_', ' ')} +{selectedItem.bonus}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-2">
                        {potentialTradeTargets.length > 0 && (
                            <div className="relative group flex-1">
                                <button className="w-full bg-[#1e3a8a]/20 hover:bg-[#1e3a8a]/40 border border-blue-900 text-blue-300 py-2 px-2 text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-colors">
                                    <Gift size={12} /> Give
                                </button>
                                {/* Hover Menu for Trade */}
                                <div className="absolute bottom-full left-0 w-full mb-1 hidden group-hover:flex flex-col gap-1 bg-[#0f0a08] border border-[#3e2c20] p-1 shadow-xl z-20">
                                    {potentialTradeTargets.map(target => (
                                        <button 
                                            key={target.instanceId || target.id}
                                            onClick={() => onTrade(selectedItem, target.instanceId || target.id)}
                                            className="text-[10px] text-[#d4c5a3] hover:bg-[#231710] p-2 text-left w-full uppercase tracking-wider"
                                        >
                                            To {target.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <button 
                            onClick={() => {
                                if (confirmDrop) {
                                    onDrop(selectedItem);
                                    setSelectedItem(null);
                                    setConfirmDrop(false);
                                } else {
                                    setConfirmDrop(true);
                                    // Auto-reset confirmation after 3 seconds
                                    setTimeout(() => setConfirmDrop(false), 3000);
                                }
                            }}
                            className={`flex-1 border py-2 px-2 text-[10px] uppercase font-bold flex items-center justify-center gap-1 transition-all ${
                                confirmDrop 
                                ? 'bg-red-900 border-red-500 text-white animate-pulse' 
                                : 'bg-[#450a0a]/20 hover:bg-[#450a0a]/40 border-red-900/50 text-red-400'
                            }`}
                        >
                            {confirmDrop ? 'Confirm?' : <><Trash2 size={12} /> Discard</>}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="h-24 flex items-center justify-center border border-dashed border-[#3e2c20] text-[#5c4033] text-xs italic">
                    Select an item to inspect
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default CharacterPanel;
