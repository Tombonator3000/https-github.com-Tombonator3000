
import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Trash2, Monitor, AlertTriangle, Image as ImageIcon, Loader, CheckCircle, 
    Download, RefreshCw, Volume2, Speaker, Zap, Eye, Grid, Activity, VolumeX, Save,
    Contrast, Wind, Sparkles, AlertOctagon, Terminal
} from 'lucide-react';
import { 
    loadAssetLibrary, saveAssetLibrary, generateLocationAsset, AssetLibrary, 
    downloadAssetsAsJSON, getCharacterVisual, getEnemyVisual 
} from '../utils/AssetLibrary';
import { INDOOR_LOCATIONS, ALL_LOCATIONS_FULL, BESTIARY, CHARACTERS } from '../constants';
import { GameSettings } from '../types';
import { loadSettings, saveSettings } from '../utils/Settings';

interface OptionsMenuProps {
  onClose: () => void;
  onResetData: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
  onAssetsUpdated: () => void;
}

type Tab = 'audio' | 'display' | 'gameplay' | 'assets' | 'data';

const OptionsMenu: React.FC<OptionsMenuProps> = ({ onClose, onResetData, onUpdateSettings, onAssetsUpdated }) => {
  const [activeTab, setActiveTab] = useState<Tab>('audio');
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  const [confirmReset, setConfirmReset] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentGenItem, setCurrentGenItem] = useState('');
  const [lastGenImage, setLastGenImage] = useState<string | null>(null);
  const [genErrors, setGenErrors] = useState(0);
  const [localLib, setLocalLib] = useState<AssetLibrary>(loadAssetLibrary());
  const [consoleLogs, setConsoleLogs] = useState<string[]>(["System initialized."]);

  const addLog = (msg: string) => setConsoleLogs(prev => [msg, ...prev].slice(0, 5));

  const assetRegistry = useMemo(() => {
      const allAssetKeys = [
          ...ALL_LOCATIONS_FULL,
          ...Object.keys(BESTIARY),
          ...Object.keys(CHARACTERS)
      ];
      const missing = allAssetKeys.filter(k => !localLib[k]);
      return {
          total: allAssetKeys.length,
          generated: allAssetKeys.length - missing.length,
          missing: missing
      };
  }, [localLib]);

  const handleSettingChange = (category: keyof GameSettings, key: string, value: any) => {
      const newSettings = {
          ...settings,
          [category]: {
              ...settings[category],
              [key]: value
          }
      };
      setSettings(newSettings);
      saveSettings(newSettings);
      onUpdateSettings(newSettings);
  };

  const handleGenerateAssets = async () => {
      if (!process.env.API_KEY) {
          addLog("ERROR: API KEY NOT FOUND.");
          return;
      }
      setIsGenerating(true);
      setGenErrors(0);
      const missing = assetRegistry.missing;
      const totalToGen = missing.length;
      const workingLib = { ...localLib };

      for (let i = 0; i < totalToGen; i++) {
          const key = missing[i];
          setGenProgress(Math.round(((i) / totalToGen) * 100));
          
          let img = null;
          try {
            if (Object.keys(BESTIARY).includes(key)) {
                addLog(`Summoning ${key}...`);
                setCurrentGenItem(`Monster: ${key}`);
                img = await getEnemyVisual(key); 
            } else if (Object.keys(CHARACTERS).includes(key)) {
                addLog(`Sketching ${key}...`);
                setCurrentGenItem(`Investigator: ${key}`);
                img = await getCharacterVisual(key);
            } else {
                addLog(`Painting ${key}...`);
                setCurrentGenItem(`Location: ${key}`);
                const isIndoor = INDOOR_LOCATIONS.includes(key);
                img = await generateLocationAsset(key, isIndoor ? 'room' : 'street');
            }
          } catch (e) {
            addLog(`FAILURE: ${key}`);
            console.error(e);
          }
          
          if (img) {
              workingLib[key] = img;
              const success = saveAssetLibrary(workingLib);
              if (success) {
                  setLocalLib({ ...workingLib });
                  setLastGenImage(img);
                  onAssetsUpdated();
                  addLog(`SUCCESS: ${key} stored.`);
              } else {
                  addLog("STORAGE FULL! Stopping.");
                  setGenErrors(prev => prev + (totalToGen - i));
                  break; 
              }
          } else {
              setGenErrors(prev => prev + 1);
              addLog(`EMPTY RESPONSE: ${key}`);
          }
          await new Promise(r => setTimeout(r, 800)); 
      }

      setGenProgress(100);
      setIsGenerating(false);
      setCurrentGenItem('Ritual Finished.');
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-6 py-4 w-full text-left transition-all ${activeTab === id ? 'bg-[#e94560] text-white font-bold shadow-lg' : 'text-slate-400 hover:bg-[#1a1a2e] hover:text-white'}`}
      >
          <Icon size={18} /> <span className="uppercase tracking-widest text-xs">{label}</span>
      </button>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#16213e] border-2 border-[#e94560] w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl relative overflow-hidden flex">
        
        {/* Sidebar */}
        <div className="w-64 bg-[#0a0a1a] border-r border-[#e94560]/30 flex flex-col hidden md:flex">
            <div className="p-6 border-b border-[#e94560]/30">
                <h2 className="text-xl font-display text-[#e94560] italic tracking-wider">OPTIONS</h2>
            </div>
            <nav className="flex-1 py-4">
                <TabButton id="audio" label="Audio" icon={Volume2} />
                <TabButton id="display" label="Display" icon={Monitor} />
                <TabButton id="gameplay" label="Gameplay" icon={Activity} />
                <TabButton id="assets" label="Asset Studio" icon={ImageIcon} />
                <TabButton id="data" label="System" icon={Save} />
            </nav>
            <div className="p-4 border-t border-[#e94560]/30">
                <button onClick={onClose} className="flex items-center justify-center gap-2 w-full py-3 border border-slate-700 hover:border-white text-slate-400 hover:text-white uppercase text-xs font-bold tracking-widest transition-all rounded">
                    <X size={16} /> Close
                </button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#16213e] p-8 md:p-12 overflow-y-auto custom-scrollbar pt-20 md:pt-12">
            
            {activeTab === 'assets' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
                        <h3 className="text-xl font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={18}/> Asset Studio</h3>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">{assetRegistry.generated} / {assetRegistry.total} Assets</span>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-[#0a0a1a] rounded border border-amber-900/30 shadow-inner">
                        {isGenerating ? (
                            <div className="flex gap-6 items-center">
                                {lastGenImage && (
                                    <div className="w-24 h-24 border-2 border-amber-500 rounded overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-in zoom-in shrink-0">
                                        <img src={lastGenImage} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <div className="flex-1 space-y-3">
                                    <div className="flex justify-between text-xs text-amber-400 font-bold uppercase">
                                        <span className="flex items-center gap-2 animate-pulse"><Loader size={12} className="animate-spin"/> {currentGenItem}</span>
                                        <span>{genProgress}%</span>
                                    </div>
                                    <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-amber-900/50">
                                        <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300" style={{width: `${genProgress}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <p className="text-xs text-slate-400 leading-relaxed italic">
                                    "I have seen the truth in the ink. The world is but a painting of horrors."
                                </p>
                                <div className="flex gap-4">
                                    {assetRegistry.missing.length > 0 ? (
                                        <button 
                                            onClick={handleGenerateAssets}
                                            className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white uppercase tracking-widest font-bold text-xs rounded shadow-lg transition-all"
                                        >
                                            <RefreshCw size={14} className="inline mr-2" /> Start Ritual ({assetRegistry.missing.length} Left)
                                        </button>
                                    ) : (
                                        <div className="flex-1 py-3 bg-green-900/20 border border-green-600/50 text-green-400 uppercase tracking-widest font-bold text-xs rounded text-center">
                                            <CheckCircle size={14} className="inline mr-2" /> Grimoire is Complete
                                        </div>
                                    )}
                                    
                                    <button 
                                        onClick={downloadAssetsAsJSON}
                                        disabled={assetRegistry.generated === 0}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 uppercase tracking-widest font-bold text-xs rounded"
                                    >
                                        <Download size={14} className="inline mr-2" /> Backup to JSON
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ritual Log Console */}
                    <div className="bg-black/80 rounded-lg p-4 font-mono text-[10px] text-green-500 border border-slate-800 shadow-inner min-h-[100px]">
                        <div className="flex items-center gap-2 text-slate-500 mb-2 border-b border-slate-900 pb-1">
                            <Terminal size={12} /> RITUAL CONSOLE
                        </div>
                        {consoleLogs.map((log, i) => (
                            <div key={i} className={log.includes('ERROR') || log.includes('FAILURE') ? 'text-red-500' : ''}>
                                > {log}
                            </div>
                        ))}
                        {genErrors > 0 && <div className="text-red-600 font-bold mt-2 animate-pulse">! {genErrors} ENTITIES RESISTED SUMMONING.</div>}
                    </div>
                </div>
            )}

            {/* Default Data Tab */}
            {activeTab === 'data' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">System Data</h3>
                    <div className="bg-red-900/10 border border-red-900/30 p-6 rounded">
                        <button 
                            onClick={() => {
                                localStorage.removeItem('shadows_1920s_assets_v1');
                                setLocalLib({});
                                addLog("ASSET LIBRARY CLEARED.");
                            }} 
                            className="w-full py-4 bg-red-900/40 text-red-500 border border-red-500/50 hover:bg-red-900/60 font-bold rounded uppercase tracking-widest text-sm mb-4"
                        >
                            CLEAR ASSET CACHE (FREES STORAGE)
                        </button>
                        <p className="text-red-300/60 text-[10px] text-center italic">Clearing assets will delete all AI-generated images. Use if storage is full.</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OptionsMenu;
