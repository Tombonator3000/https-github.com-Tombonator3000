
import React from 'react';
import { ScrollText, X, Clock } from 'lucide-react';

interface LogPanelProps {
  logs: string[];
  onClose: () => void;
}

const LogPanel: React.FC<LogPanelProps> = ({ logs, onClose }) => {
  return (
    <div className="h-full flex flex-col bg-[#0a0a1a] text-[#d4c5a3] font-serif border-l-2 border-[#16213e] shadow-2xl">
      <div className="p-6 border-b border-[#16213e] flex items-center justify-between">
        <h2 className="text-2xl font-display italic text-[#e94560] flex items-center gap-2">
          <ScrollText size={24} /> Case Journal
        </h2>
        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {logs.length === 0 ? (
          <p className="text-slate-600 italic text-center mt-10">No entries yet...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3 text-sm border-b border-slate-800/30 pb-3 group">
              <Clock size={14} className="text-slate-700 shrink-0 mt-0.5 group-hover:text-[#e94560] transition-colors" />
              <p className="leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                {log}
              </p>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-black/40 text-[10px] uppercase tracking-widest text-slate-600 text-center">
        Entries are archived automatically
      </div>
    </div>
  );
};

export default LogPanel;
