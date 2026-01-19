
import React from 'react';
import { Play, RotateCcw, Settings, Skull, BookOpen } from 'lucide-react';

interface MainMenuProps {
  onNewGame: () => void;
  onContinue: () => void;
  onOptions: () => void;
  canContinue: boolean;
  version: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNewGame, onContinue, onOptions, canContinue, version }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05050a] text-slate-200 overflow-hidden font-serif">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 animate-pulse"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-transparent to-[#0a0a1a]"></div>
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-1000 w-full px-4">
        
        {/* Title */}
        <div className="mb-8 md:mb-12">
            <h1 className="text-5xl md:text-9xl font-display italic tracking-tighter text-[#e94560] drop-shadow-[0_0_15px_rgba(233,69,96,0.4)] mb-2 md:mb-4 text-stroke-sm">
                Shadows
            </h1>
            <h2 className="text-xl md:text-5xl font-display text-slate-300 tracking-widest uppercase">
                of the 1920s
            </h2>
            <div className="w-24 md:w-32 h-1 bg-[#e94560] mx-auto mt-4 md:mt-6 shadow-[0_0_10px_#e94560]"></div>
        </div>

        {/* Menu Actions */}
        <div className="flex flex-col gap-4 md:gap-6 w-full max-w-xs md:max-w-md">
            {canContinue && (
                <button 
                    onClick={onContinue}
                    className="group relative px-4 py-3 md:px-8 md:py-4 bg-[#16213e]/80 border-2 border-slate-600 hover:border-green-500 hover:bg-green-900/20 text-slate-300 hover:text-green-400 transition-all uppercase tracking-[0.2em] font-bold text-sm md:text-lg rounded backdrop-blur-sm"
                >
                    <span className="flex items-center justify-center gap-3">
                        <Play size={20} className="group-hover:fill-current" /> Continue
                    </span>
                </button>
            )}

            <button 
                onClick={onNewGame}
                className="group relative px-4 py-3 md:px-8 md:py-4 bg-[#16213e]/80 border-2 border-[#e94560]/60 hover:border-[#e94560] hover:bg-[#e94560]/10 text-slate-200 hover:text-white transition-all uppercase tracking-[0.2em] font-bold text-sm md:text-lg rounded backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(233,69,96,0.3)]"
            >
                <span className="flex items-center justify-center gap-3">
                    <Skull size={20} className="group-hover:animate-wiggle" /> New Case
                </span>
            </button>

            <button 
                onClick={onOptions}
                className="group relative px-4 py-3 bg-transparent border border-slate-700 hover:border-amber-500 text-slate-500 hover:text-amber-500 transition-all uppercase tracking-[0.2em] font-bold text-xs md:text-sm rounded hover:bg-amber-900/10"
            >
                <span className="flex items-center justify-center gap-3">
                    <Settings size={16} className="group-hover:rotate-90 transition-transform duration-700" /> Options
                </span>
            </button>
        </div>

        {/* Footer */}
        <div className="mt-8 md:mt-16 text-slate-600 text-[10px] md:text-xs uppercase tracking-widest font-sans">
            <p>Version {version} • A Cosmic Horror Experience</p>
        </div>
    </div>
    </div>
  );
};

export default MainMenu;
