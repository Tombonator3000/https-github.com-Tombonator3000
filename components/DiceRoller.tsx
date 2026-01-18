
import React, { useEffect, useState } from 'react';
import { Sparkles, Skull, Check, X } from 'lucide-react';

interface DiceRollerProps {
  values: number[];
  onComplete: () => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ values, onComplete }) => {
  const [displayValues, setDisplayValues] = useState<number[]>(values.map(() => 1));
  const [rotations, setRotations] = useState<number[]>(values.map(() => 0));
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    // Rolling phase: Rapidly change numbers and rotate dice
    let interval = setInterval(() => {
      setDisplayValues(values.map(() => Math.floor(Math.random() * 6) + 1));
      setRotations(values.map(() => Math.random() * 360)); // Random spin
    }, 80);

    // Settle phase
    let timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValues(values);
      setRotations(values.map(() => 0)); // Reset rotation to 0 for legibility
      setIsRolling(false);
      
      // Keep result visible for 2.5 seconds then complete
      setTimeout(onComplete, 2500);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [values, onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
      {/* Backdrop Blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>

      <div className="relative flex gap-6 items-center bg-[#0f172a]/90 px-12 py-10 rounded-3xl border-4 border-[#e94560]/50 shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-90 duration-300">
        
        {displayValues.map((val, idx) => {
          // Determine State
          const isCritSuccess = !isRolling && val === 6;
          const isSuccess = !isRolling && val >= 4 && val < 6;
          const isCritFail = !isRolling && val === 1;
          const isFail = !isRolling && val > 1 && val < 4;

          // Base Styles
          let containerClass = "w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-bold shadow-2xl transition-all duration-500 relative overflow-hidden ";
          let textClass = "";
          
          if (isRolling) {
            containerClass += "bg-slate-100 border-4 border-slate-300 text-slate-800 scale-90 blur-[1px]";
          } else if (isCritSuccess) {
            containerClass += "bg-gradient-to-br from-amber-100 to-amber-300 border-4 border-amber-500 scale-125 z-20 shadow-[0_0_50px_rgba(251,191,36,0.8)] animate-bounce";
            textClass = "text-amber-700 drop-shadow-md";
          } else if (isSuccess) {
            containerClass += "bg-white border-4 border-green-500 scale-110 shadow-[0_0_20px_rgba(34,197,94,0.5)]";
            textClass = "text-green-600";
          } else if (isCritFail) {
            containerClass += "bg-[#2a0a0a] border-4 border-red-700 rotate-6 scale-95 shadow-[0_0_30px_rgba(185,28,28,0.6)] grayscale contrast-125";
            textClass = "text-red-500 line-through decoration-4 decoration-red-900";
          } else if (isFail) {
            containerClass += "bg-slate-300 border-4 border-slate-500 opacity-60 scale-90";
            textClass = "text-slate-600";
          }

          return (
            <div 
              key={idx} 
              className={containerClass}
              style={{ 
                transform: isRolling ? `rotate(${rotations[idx]}deg)` : isCritFail ? 'rotate(12deg)' : 'rotate(0deg)' 
              }}
            >
              {/* Internal Effects/Icons */}
              {!isRolling && isCritSuccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="text-amber-500 w-full h-full opacity-20 animate-spin-slow" />
                  <div className="absolute top-1 right-1"><Sparkles size={16} className="text-amber-600 animate-pulse" /></div>
                </div>
              )}

              {!isRolling && isCritFail && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Skull className="text-red-900 w-full h-full opacity-20" />
                  <div className="absolute top-1 right-1"><X size={16} className="text-red-600" /></div>
                </div>
              )}

              {!isRolling && isSuccess && (
                <div className="absolute top-1 right-1"><Check size={16} className="text-green-500" /></div>
              )}

              {/* The Number */}
              <span className={`relative z-10 font-display ${textClass}`}>
                {val}
              </span>

              {/* Shine Effect for standard rolls */}
              {(isRolling || isSuccess) && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Result Text */}
      {!isRolling && (
        <div className="absolute bottom-20 text-center animate-in slide-in-from-bottom-4 duration-500">
             {values.some(v => v === 6) ? (
                 <div className="text-amber-400 font-display text-4xl uppercase tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">Critical Success!</div>
             ) : values.filter(v => v >= 4).length > 0 ? (
                 <div className="text-green-400 font-display text-3xl uppercase tracking-widest drop-shadow-md">Success</div>
             ) : values.some(v => v === 1) ? (
                 <div className="text-red-500 font-display text-4xl uppercase tracking-widest font-bold drop-shadow-[0_0_15px_rgba(220,38,38,0.8)] shake">Catastrophe!</div>
             ) : (
                 <div className="text-slate-400 font-display text-2xl uppercase tracking-widest">Failure</div>
             )}
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
