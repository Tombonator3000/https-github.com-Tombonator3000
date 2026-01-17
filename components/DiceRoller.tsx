
import React, { useEffect, useState } from 'react';

interface DiceRollerProps {
  values: number[];
  onComplete: () => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ values, onComplete }) => {
  const [displayValues, setDisplayValues] = useState<number[]>(values.map(() => 1));
  const [isRolling, setIsRolling] = useState(true);

  useEffect(() => {
    let interval = setInterval(() => {
      setDisplayValues(values.map(() => Math.floor(Math.random() * 6) + 1));
    }, 100);

    let timeout = setTimeout(() => {
      clearInterval(interval);
      setDisplayValues(values);
      setIsRolling(false);
      
      // Keep result visible for 2 seconds then complete
      setTimeout(onComplete, 2000);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [values, onComplete]);

  return (
    <div className="flex gap-4 items-center bg-black/60 px-8 py-6 rounded-2xl border-2 border-[#e94560] backdrop-blur-md animate-in zoom-in duration-300">
      {displayValues.map((val, idx) => (
        <div 
          key={idx} 
          className={`
            w-16 h-16 rounded-lg bg-white flex items-center justify-center text-3xl font-bold shadow-xl
            ${isRolling ? 'animate-bounce' : 'animate-none'}
            ${!isRolling && val >= 4 ? 'ring-4 ring-green-500 text-green-600' : 'text-slate-900'}
            ${!isRolling && val < 4 ? 'ring-4 ring-red-400 opacity-80' : ''}
            transition-all duration-300
          `}
        >
          {val}
        </div>
      ))}
    </div>
  );
};

export default DiceRoller;
