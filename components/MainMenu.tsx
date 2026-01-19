
import React, { useState } from 'react';
import { Play, RotateCcw, Settings, Skull, User, Shield, Zap, Eye, Heart, Brain } from 'lucide-react';
import { CHARACTERS } from '../constants';
import { CharacterType, Character } from '../types';

interface MainMenuProps {
  onNewGame: (charType: CharacterType) => void;
  onContinue: () => void;
  onOptions: () => void;
  canContinue: boolean;
  version: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onContinue, onOptions, canContinue, version }) => {
  const [selectingChar, setSelectingChar] = useState(false);

  if (selectingChar) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05050a] text-slate-200 p-8 overflow-y-auto">
        <h2 className="text-4xl font-display text-[#e94560] mb-8 uppercase tracking-widest italic">Choose Your Investigator</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl w-full">
          {(Object.keys(CHARACTERS) as CharacterType[]).map((key) => {
            const char = CHARACTERS[key];
            return (
              <button 
                key={key}
                onClick={() => onNewGame(key)}
                className="group relative bg-[#16213e]/40 border-2 border-slate-800 hover:border-[#e94560] p-6 rounded-xl transition-all hover:scale-[1.02] text-left flex flex-col gap-4 shadow-lg"
              >
                <div className="flex justify-between items-start">
                   <h3 className="text-2xl font-display text-white italic">{char.name}</h3>
                   <div className="bg-[#e94560]/20 p-2 rounded-full"><User size={20} className="text-[#e94560]" /></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <Heart size={16} /> <span className="text-sm font-bold">HP: {char.hp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <Brain size={16} /> <span className="text-sm font-bold">SAN: {char.sanity}</span>
                  </div>
                </div>
                
                <div className="text-xs text-slate-400 italic">"{char.special}"</div>
                
                <div className="mt-auto pt-4 border-t border-slate-800 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-amber-500">
                  <span>Insight: {char.insight}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity">Select Case &rarr;</span>
                </div>
              </button>
            );
          })}
        </div>
        <button 
          onClick={() => setSelectingChar(false)}
          className="mt-12 text-slate-500 hover:text-white uppercase tracking-widest text-xs"
        >
          &larr; Back to Title
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05050a] text-slate-200 overflow-hidden font-serif">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-transparent to-[#0a0a1a]"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000 w-full px-4">
        <div className="mb-8 md:mb-12">
            <h1 className="text-5xl md:text-9xl font-display italic tracking-tighter text-[#e94560] drop-shadow-[0_0_15px_rgba(233,69,96,0.4)] mb-2 md:mb-4">
                Shadows
            </h1>
            <h2 className="text-xl md:text-5xl font-display text-slate-300 tracking-widest uppercase">
                of the 1920s
            </h2>
            <div className="w-24 md:w-32 h-1 bg-[#e94560] mx-auto mt-4 md:mt-6 shadow-[0_0_10px_#e94560]"></div>
        </div>

        <div className="flex flex-col gap-4 md:gap-6 w-full max-w-xs md:max-w-md">
            {canContinue && (
                <button 
                    onClick={onContinue}
                    className="group relative px-4 py-3 md:px-8 md:py-4 bg-[#16213e]/80 border-2 border-slate-600 hover:border-green-500 hover:bg-green-900/20 text-slate-300 hover:text-green-400 transition-all uppercase tracking-[0.2em] font-bold text-sm md:text-lg rounded backdrop-blur-sm"
                >
                    <Play size={20} className="inline mr-2" /> Continue
                </button>
            )}

            <button 
                onClick={() => setSelectingChar(true)}
                className="group relative px-4 py-3 md:px-8 md:py-4 bg-[#16213e]/80 border-2 border-[#e94560]/60 hover:border-[#e94560] hover:bg-[#e94560]/10 text-slate-200 hover:text-white transition-all uppercase tracking-[0.2em] font-bold text-sm md:text-lg rounded backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            >
                <Skull size={20} className="inline mr-2" /> New Case
            </button>

            <button 
                onClick={onOptions}
                className="group relative px-4 py-3 bg-transparent border border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-500 transition-all uppercase tracking-[0.2em] font-bold text-xs md:text-sm rounded hover:bg-amber-900/10"
            >
                <Settings size={16} className="inline mr-2" /> Options
            </button>
        </div>

        <div className="mt-8 md:mt-16 text-slate-600 text-[10px] md:text-xs uppercase tracking-widest font-sans">
            <p>Version {version} • Cosmic Horror Co-op</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
