
import React, { useState, useEffect } from 'react';
import { 
    X, Trash2, Monitor, AlertTriangle, Image as ImageIcon, Loader, CheckCircle, 
    Download, RefreshCw, Volume2, Speaker, Zap, Eye, Grid, Activity, VolumeX, Save
} from 'lucide-react';
import { loadAssetLibrary, saveAssetLibrary, generateLocationAsset, getMissingAssets, downloadAssetsAsJSON } from '../utils/AssetLibrary';
import { INDOOR_LOCATIONS, ALL_LOCATIONS_FULL } from '../constants';
import { GameSettings } from '../types';
import { loadSettings, saveSettings } from '../utils/Settings';

interface OptionsMenuProps {
  onClose: () => void;
  onResetData: () => void;
  onUpdateSettings: (settings: GameSettings) => void;
}

type Tab = 'audio' | 'display' | 'gameplay' | 'assets' | 'data';

const OptionsMenu: React.FC<OptionsMenuProps> = ({ onClose, onResetData, onUpdateSettings }) => {
  const [activeTab, setActiveTab] = useState<Tab>('audio');
  const [settings, setSettings] = useState<GameSettings>(loadSettings());
  
  const [confirmReset, setConfirmReset] = useState(false);
  
  // Asset Gen State
  const [missingCount, setMissingCount] = useState(0);
  const [totalAssets, setTotalAssets] = useState(0);
  const [generatedCount, setGeneratedCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentGenItem, setCurrentGenItem] = useState('');

  useEffect(() => {
      checkAssets();
  }, []);

  const checkAssets = () => {
      const lib = loadAssetLibrary();
      const missing = getMissingAssets(lib, ALL_LOCATIONS_FULL);
      setMissingCount(missing.length);
      setTotalAssets(ALL_LOCATIONS_FULL.length);
      setGeneratedCount(ALL_LOCATIONS_FULL.length - missing.length);
  };

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
          alert("API Key missing. Cannot generate assets.");
          return;
      }
      setIsGenerating(true);
      const lib = loadAssetLibrary();
      const missing = getMissingAssets(lib, ALL_LOCATIONS_FULL);
      const totalToGen = missing.length;

      for (let i = 0; i < totalToGen; i++) {
          const locName = missing[i];
          setCurrentGenItem(locName);
          setGenProgress(Math.round(((i) / totalToGen) * 100));
          
          const isIndoor = INDOOR_LOCATIONS.includes(locName);
          const img = await generateLocationAsset(locName, isIndoor ? 'room' : 'street');
          
          if (img) {
              lib[locName] = img;
              saveAssetLibrary(lib);
              setGeneratedCount(prev => prev + 1);
          }
          await new Promise(r => setTimeout(r, 2000));
      }

      setGenProgress(100);
      setIsGenerating(false);
      setCurrentGenItem('Complete!');
      setMissingCount(0);
      checkAssets();
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
      <div className="bg-[#16213e] border-2 border-[#e94560] w-full max-w-4xl h-[80vh] rounded-xl shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 flex">
        
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

        {/* Mobile Sidebar Replacement (Top Nav) */}
        <div className="absolute top-0 left-0 right-0 bg-[#0a0a1a] flex md:hidden overflow-x-auto z-20 border-b border-[#e94560]/30">
             <button onClick={() => setActiveTab('audio')} className={`p-4 ${activeTab==='audio'?'text-[#e94560] border-b-2 border-[#e94560]':''}`}><Volume2/></button>
             <button onClick={() => setActiveTab('display')} className={`p-4 ${activeTab==='display'?'text-[#e94560] border-b-2 border-[#e94560]':''}`}><Monitor/></button>
             <button onClick={() => setActiveTab('gameplay')} className={`p-4 ${activeTab==='gameplay'?'text-[#e94560] border-b-2 border-[#e94560]':''}`}><Activity/></button>
             <button onClick={() => setActiveTab('assets')} className={`p-4 ${activeTab==='assets'?'text-[#e94560] border-b-2 border-[#e94560]':''}`}><ImageIcon/></button>
             <button onClick={() => setActiveTab('data')} className={`p-4 ${activeTab==='data'?'text-[#e94560] border-b-2 border-[#e94560]':''}`}><Save/></button>
             <button onClick={onClose} className="p-4 text-red-500 ml-auto"><X/></button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-[#16213e] p-8 md:p-12 overflow-y-auto custom-scrollbar pt-20 md:pt-12">
            
            {/* AUDIO TAB */}
            {activeTab === 'audio' && (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-display text-white">Audio Settings</h3>
                        <button 
                            onClick={() => handleSettingChange('audio', 'muted', !settings.audio.muted)}
                            className={`p-3 rounded-full border-2 transition-all ${settings.audio.muted ? 'border-red-500 text-red-500 bg-red-900/20' : 'border-green-500 text-green-500 bg-green-900/20'}`}
                        >
                            {settings.audio.muted ? <VolumeX /> : <Volume2 />}
                        </button>
                    </div>

                    <div className={`space-y-8 ${settings.audio.muted ? 'opacity-50 pointer-events-none' : ''}`}>
                        {[
                            { label: 'Master Volume', key: 'masterVolume', icon: Volume2 },
                            { label: 'Music Volume', key: 'musicVolume', icon: Monitor }, // Placeholder icon
                            { label: 'SFX Volume', key: 'sfxVolume', icon: Speaker }
                        ].map(item => (
                            <div key={item.key}>
                                <div className="flex justify-between mb-2">
                                    <label className="text-sm font-bold uppercase tracking-widest text-slate-300 flex items-center gap-2">
                                        <item.icon size={16} /> {item.label}
                                    </label>
                                    <span className="text-[#e94560] font-mono">{(settings.audio as any)[item.key]}%</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" max="100" 
                                    value={(settings.audio as any)[item.key]}
                                    onChange={(e) => handleSettingChange('audio', item.key, parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#e94560]"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* DISPLAY TAB */}
            {activeTab === 'display' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Visuals & Accessibility</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-700">
                        <div className="flex items-center gap-4">
                            <Eye size={24} className="text-blue-400" />
                            <div>
                                <div className="font-bold text-slate-200">High Contrast</div>
                                <div className="text-xs text-slate-500">Removes vignettes and atmospheric overlays.</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSettingChange('graphics', 'highContrast', !settings.graphics.highContrast)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.graphics.highContrast ? 'bg-[#e94560]' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.graphics.highContrast ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-700">
                        <div className="flex items-center gap-4">
                            <Zap size={24} className="text-yellow-400" />
                            <div>
                                <div className="font-bold text-slate-200">Reduce Motion</div>
                                <div className="text-xs text-slate-500">Disables screen shake and intense animations.</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSettingChange('graphics', 'reduceMotion', !settings.graphics.reduceMotion)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.graphics.reduceMotion ? 'bg-[#e94560]' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.graphics.reduceMotion ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-700">
                        <div className="flex items-center gap-4">
                            <Monitor size={24} className="text-purple-400" />
                            <div>
                                <div className="font-bold text-slate-200">Fullscreen Mode</div>
                                <div className="text-xs text-slate-500">Immersive experience.</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                if (!document.fullscreenElement) document.documentElement.requestFullscreen();
                                else document.exitFullscreen();
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-bold uppercase"
                        >
                            Toggle
                        </button>
                    </div>
                </div>
            )}

            {/* GAMEPLAY TAB */}
            {activeTab === 'gameplay' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Gameplay Preferences</h3>

                    <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-700">
                        <div className="flex items-center gap-4">
                            <Grid size={24} className="text-green-400" />
                            <div>
                                <div className="font-bold text-slate-200">Show Hex Grid</div>
                                <div className="text-xs text-slate-500">Always display tile boundaries.</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSettingChange('gameplay', 'showGrid', !settings.gameplay.showGrid)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.gameplay.showGrid ? 'bg-[#e94560]' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.gameplay.showGrid ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[#0a0a1a]/50 rounded border border-slate-700">
                        <div className="flex items-center gap-4">
                            <Activity size={24} className="text-cyan-400" />
                            <div>
                                <div className="font-bold text-slate-200">Fast Mode</div>
                                <div className="text-xs text-slate-500">Speeds up animations and transitions.</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleSettingChange('gameplay', 'fastMode', !settings.gameplay.fastMode)}
                            className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.gameplay.fastMode ? 'bg-[#e94560]' : 'bg-slate-700'}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.gameplay.fastMode ? 'translate-x-6' : ''}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* ASSETS TAB */}
            {activeTab === 'assets' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
                        <h3 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Generative Art Pipeline</h3>
                        <span className="text-xs text-slate-400">{generatedCount} / {totalAssets} Assets</span>
                    </div>
                    
                    <div className="p-6 bg-[#0a0a1a] rounded border border-amber-900/30 shadow-inner">
                        {isGenerating ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-amber-400 font-bold uppercase">
                                    <span className="flex items-center gap-2 animate-pulse"><Loader size={12} className="animate-spin"/> Painting: {currentGenItem}...</span>
                                    <span>{genProgress}%</span>
                                </div>
                                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-amber-900/50">
                                    <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300" style={{width: `${genProgress}%`}}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Generate AI imagery for all board locations. This uses the Gemini Nano Banana model. 
                                    Assets are stored in your browser.
                                </p>
                                <div className="flex gap-4">
                                    {missingCount > 0 ? (
                                        <button 
                                            onClick={handleGenerateAssets}
                                            className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white uppercase tracking-widest font-bold text-xs rounded shadow-lg"
                                        >
                                            <RefreshCw size={14} className="inline mr-2" /> Generate {missingCount} Missing
                                        </button>
                                    ) : (
                                        <div className="flex-1 py-3 bg-green-900/20 border border-green-600/50 text-green-400 uppercase tracking-widest font-bold text-xs rounded text-center">
                                            <CheckCircle size={14} className="inline mr-2" /> Library Complete
                                        </div>
                                    )}
                                    
                                    <button 
                                        onClick={downloadAssetsAsJSON}
                                        disabled={generatedCount === 0}
                                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 uppercase tracking-widest font-bold text-xs rounded"
                                    >
                                        <Download size={14} className="inline mr-2" /> Export JSON
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DATA TAB */}
            {activeTab === 'data' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Data Management</h3>
                    
                    <div className="bg-red-900/10 border border-red-900/30 p-6 rounded">
                        <div className="flex items-center gap-3 mb-4">
                            <Trash2 className="text-red-500" />
                            <h4 className="text-red-400 font-bold uppercase tracking-wider">Reset Game Data</h4>
                        </div>
                        <p className="text-red-300/60 text-xs mb-6">
                            This will permanently delete your current save game, veteran roster, and local settings.
                            Assets will be preserved.
                        </p>
                        
                        {!confirmReset ? (
                            <button 
                                onClick={() => setConfirmReset(true)}
                                className="w-full py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 uppercase tracking-widest font-bold text-xs rounded"
                            >
                                Delete All Data
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button 
                                    onClick={onResetData}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white uppercase tracking-widest font-bold text-xs rounded shadow-lg"
                                >
                                    Confirm
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
            )}

        </div>
      </div>
    </div>
  );
};

export default OptionsMenu;
