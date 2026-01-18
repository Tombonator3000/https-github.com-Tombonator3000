
import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  variant?: 'lore' | 'action' | 'ui';
}

const Tooltip: React.FC<TooltipProps> = ({ content, children, position = 'top', delay = 200, className = '', variant = 'lore' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // Use these to prevent tooltip from going off-screen (basic implementation)
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    const id = setTimeout(() => setIsVisible(true), delay);
    setTimeoutId(id);
  };

  const hideTooltip = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top': return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
      case 'bottom': return 'top-full left-1/2 -translate-x-1/2 mt-3';
      case 'left': return 'right-full top-1/2 -translate-y-1/2 mr-3';
      case 'right': return 'left-full top-1/2 -translate-y-1/2 ml-3';
      default: return 'bottom-full left-1/2 -translate-x-1/2 mb-3';
    }
  };

  const getVariantStyles = () => {
      switch (variant) {
          case 'action': return { 
              box: 'border-[#e94560]/60 text-[#ffced6] bg-[#1a0505]/95', 
              arrow: 'border-[#e94560]/60 bg-[#1a0505]' 
          };
          case 'ui': return { 
              box: 'border-slate-600/60 text-slate-200 bg-[#0f172a]/95', 
              arrow: 'border-slate-600/60 bg-[#0f172a]' 
          };
          case 'lore': default: return { 
              box: 'border-amber-600/40 text-[#d4c5a3] bg-[#0f1219]/95', 
              arrow: 'border-amber-600/40 bg-[#0f1219]' 
          };
      }
  };

  const styles = getVariantStyles();

  const getArrowClasses = () => {
      switch (position) {
          case 'top': return 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b';
          case 'bottom': return 'top-[-6px] left-1/2 -translate-x-1/2 border-l border-t';
          case 'left': return 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r';
          case 'right': return 'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l';
          default: return 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b';
      }
  }

  return (
    <div 
      className={`relative flex items-center justify-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div 
            ref={tooltipRef}
            className={`absolute z-[200] w-max max-w-[250px] pointer-events-none animate-in fade-in zoom-in-95 duration-200 ${getPositionClasses()}`}
        >
          <div className={`border text-xs font-serif px-3 py-2 rounded-lg shadow-[0_4px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl relative ${styles.box}`}>
            <div className="relative z-10">
                {content}
            </div>
            
            {/* Arrow */}
            <div 
                className={`absolute w-3 h-3 transform rotate-45 ${getArrowClasses()} ${styles.arrow}`}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
