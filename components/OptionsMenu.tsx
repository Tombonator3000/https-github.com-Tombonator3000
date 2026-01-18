
import React, { useState, useEffect } from 'react';
import { X, Trash2, Monitor, AlertTriangle, Image as ImageIcon, Loader, CheckCircle } from 'lucide-react';
import { loadAssetLibrary, saveAssetLibrary, generateLocationAsset, getMissingAssets } from '../utils/AssetLibrary';
import { INDOOR_LOCATIONS, OUTDOOR_LOCATIONS } from '../constants';

interface OptionsMenuProps {
  onClose: () => void;
  onResetData: () => void;
}

const OptionsMenu: React.FC<OptionsMenuProps> = ({ onClose, onResetData }) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  
  // Asset Gen State
  const [missingCount, setMissingCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentGenItem, setCurrentGenItem] = useState('');

  useEffect(() => {
      const lib = loadAssetLibrary();
      const missing = getMissingAssets(lib);
      setMissingCount(missing.length);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => console.log(e));
        setIsFullscreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    }
  };

  const handleGenerateAssets = async () => {
      if (!process.env.API_KEY) {
          alert("API Key missing.");
          return;
      }
      setIsGenerating(true);
      const lib = loadAssetLibrary();
      const missing = getMissingAssets(lib);
      const total = missing.length;

      for (let i = 0; i < total; i++) {
          const locName = missing[i];
          setCurrentGenItem(locName);
          setGenProgress(Math.round(((i) / total) * 100));
          
          const isIndoor = INDOOR_LOCATIONS.includes(locName);
          const img = await generateLocationAsset(locName, isIndoor ? 'room' : 'street');
          
          if (img) {
              lib[locName] = img;
              saveAssetLibrary(lib); // Save incrementally
          }
          
          // Small delay to be nice to the API
          await new Promise(r => setTimeout(r, 1000));
      }

      setGenProgress(100);
      setIsGenerating(false);
      setCurrentGenItem('Done!');
      setMissingCount(0);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16213e] border-2 border-slate-600 w-full max-w-lg rounded-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-[#0a0a1a]">
            <h2 className="text-2xl font-display text-slate-200 tracking-widest uppercase">System Options</h2>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        <div className="p-8 space-y-6">
            
            {/* Display Settings */}
            <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-800">
                <div className="flex items-center gap-3">
                    <Monitor className="text-blue-400" />
                    <div>
                        <div className="text-slate-200 font-bold uppercase text-sm tracking-wider">Fullscreen Mode</div>
                        <div className="text-slate-500 text-xs">Immersive experience</div>
                    </div>
                </div>
                <button 
                    onClick={toggleFullscreen}
                    className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-widest border transition-all ${isFullscreen ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-400'}`}
                >
                    {isFullscreen ? 'Active' : 'Enable'}
                </button>
            </div>

            {/* Asset Generation */}
            <div className="p-4 bg-[#0a0a1a]/50 rounded border border-slate-800">
                <div className="flex items-center gap-3 mb-4">
                    <ImageIcon className="text-amber-400" />
                    <div>
                        <div className="text-slate-200 font-bold uppercase text-sm tracking-wider">Game Assets</div>
                        <div className="text-slate-500 text-xs">
                            {missingCount === 0 ? "All assets generated & cached." : `${missingCount} assets missing from library.`}
                        </div>
                    </div>
                </div>

                {isGenerating ? (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-amber-400 font-bold uppercase">
                            <span className="flex items-center gap-2"><Loader size={12} className="animate-spin"/> Painting: {currentGenItem}</span>
                            <span>{genProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 transition-all duration-300" style={{width: `${genProgress}%`}}></div>
                        </div>
                    </div>
                ) : (
                    missingCount > 0 ? (
                        <button 
                            onClick={handleGenerateAssets}
                            className="w-full py-2 bg-amber-900/20 hover:bg-amber-900/40 border border-amber-600/50 text-amber-400 uppercase tracking-widest font-bold text-xs rounded transition-colors flex items-center justify-center gap-2"
                        >
                            <ImageIcon size={14} /> Generate All Missing Assets (AI)
                        </button>
                    ) : (
                        <div className="w-full py-2 bg-green-900/20 border border-green-600/50 text-green-400 uppercase tracking-widest font-bold text-xs rounded flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> Assets Ready
                        </div>
                    )
                )}
            </div>

            {/* Data Management */}
            <div className="flex flex-col gap-4 p-4 bg-red-900/10 rounded border border-red-900/30">
                <div className="flex items-center gap-3">
                    <Trash2 className="text-red-500" />
                    <div>
                        <div className="text-red-400 font-bold uppercase text-sm tracking-wider">Reset Game Data</div>
                        <div className="text-red-300/60 text-xs">Clears all progress, rosters, and saves. Irreversible.</div>
                    </div>
                </div>
                
                {!confirmReset ? (
                    <button 
                        onClick={() => setConfirmReset(true)}
                        className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 uppercase tracking-widest font-bold text-xs rounded transition-colors"
                    >
                        Delete All Data
                    </button>
                ) : (
                    <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                        <button 
                            onClick={onResetData}
                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white uppercase tracking-widest font-bold text-xs rounded shadow-lg flex items-center justify-center gap-2"
                        >
                            <AlertTriangle size={14} /> Confirm Deletion
                        </button>
                        <button 
                            onClick={() => setConfirmReset(false)}
                            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 uppercase tracking-widest font-bold text-xs rounded"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

        </div>

        <div className="p-4 bg-[#0a0a1a] border-t border-slate-700 text-center">
            <button onClick={onClose} className="text-slate-500 hover:text-white uppercase tracking-[0.2em] text-xs font-bold">Return to Menu</button>
        </div>
      </div>
    </div>
  );
};

export default OptionsMenu;
