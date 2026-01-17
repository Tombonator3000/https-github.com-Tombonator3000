
import React from 'react';
import { Enemy } from '../types';
import { Skull, Swords, Brain, Activity, Crosshair, Zap } from 'lucide-react';

interface EnemyPanelProps {
  enemy: Enemy;
  onClose?: () => void;
}

const EnemyPanel: React.FC<EnemyPanelProps> = ({ enemy, onClose }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;

  return (
    <div className="bg-[#0a0a1a]/95 backdrop-blur-2xl border-2 border-purple-600/50 rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.2)] overflow-hidden animate-in slide-in-from-right duration-300 w-full">
      <div className="bg-purple-900/20 p-4 border-b border-purple-600/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skull className="text-purple-500" size={20} />
          <h2 className="text-xl font-display text-white italic tracking-tight uppercase">{enemy.name}</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-sans font-bold">Lukk</button>
        )}
      </div>

      {enemy.imageUrl && (
          <div className="w-full h-48 bg-black relative">
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
          <div className="bg-black/40 border border-slate-800 p-3 rounded flex flex-col items-center relative overflow-hidden">
            {enemy.attackType === 'ranged' && <div className="absolute top-1 right-1 text-[8px] bg-red-900 text-white px-1 rounded">RANGED</div>}
            {enemy.attackType === 'doom' && <div className="absolute top-1 right-1 text-[8px] bg-purple-900 text-white px-1 rounded">DOOM</div>}
            
            <Swords size={18} className="text-red-500 mb-1" />
            <span className="text-lg font-bold text-white tabular-nums">{enemy.damage}</span>
            <span className="text-[8px] text-slate-500 uppercase font-sans tracking-tighter">Kampstyrke</span>
          </div>
          <div className="bg-black/40 border border-slate-800 p-3 rounded flex flex-col items-center">
            <Brain size={18} className="text-purple-400 mb-1" />
            <span className="text-lg font-bold text-white tabular-nums">{enemy.horror}</span>
            <span className="text-[8px] text-slate-500 uppercase font-sans tracking-tighter">Skrekk-nivå</span>
          </div>
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
        <div className="pt-2 border-t border-slate-800">
          <div className="text-[9px] text-slate-600 uppercase tracking-widest font-sans font-bold mb-1">Klassifisering</div>
          <p className="text-xs text-slate-400 italic">
            {enemy.type === 'cultist' && "En hjernevasket tjener av de ytre gudene."}
            {enemy.type === 'sniper' && "En kultist bevæpnet med rifle, trener siktet fra skyggene."}
            {enemy.type === 'priest' && "En mørk prest som kaster forbannelser for å fremskynde undergangen."}
            {enemy.type === 'ghoul' && "En kjøttetende skikkelse som trives i mørket."}
            {enemy.type === 'deepone' && "En vederstyggelighet fra dypet."}
            {enemy.type === 'shoggoth' && "En formløs masse av boblende kjøtt og øyne."}
            {enemy.type === 'boss' && "En eldgammel kraft hinsides menneskelig fatteevne."}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnemyPanel;
