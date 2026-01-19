
import React, { useState, useEffect, useMemo } from 'react';
import { 
    X, Trash2, Monitor, AlertTriangle, Image as ImageIcon, Loader, CheckCircle, 
    Download, RefreshCw, Volume2, Speaker, Zap, Eye, Grid, Activity, VolumeX, Save,
    Contrast, Wind, Sparkles, AlertOctagon
} from 'lucide-react';
import { 
    loadAssetLibrary, saveAssetLibrary, generateLocationAsset, AssetLibrary, 
    getMissingAssets, downloadAssetsAsJSON, getCharacterVisual, getEnemyVisual 
} from '../utils/AssetLibrary';
import { INDOOR_LOCATIONS, ALL_LOCATIONS_FULL, BESTIARY, CHARACTERS } from '../constants';
import { GameSettings, EnemyType, CharacterType } from '../types';
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
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [currentGenItem, setCurrentGenItem] = useState('');
  const [genErrors, setGenErrors] = useState(0);

  const assetRegistry = useMemo(() => {
      const lib = loadAssetLibrary();
      const allAssetKeys = [
          ...ALL_LOCATIONS_FULL,
          ...Object.keys(BESTIARY),
          ...Object.keys(CHARACTERS)
      ];
      const missing = allAssetKeys.filter(k => !lib[k]);
      return {
          total: allAssetKeys.length,
          generated: allAssetKeys.length - missing.length,
          missing: missing
      };
  }, [isGenerating]);

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
      setGenErrors(0);
      const lib = loadAssetLibrary();
      const missing = assetRegistry.missing;
      const totalToGen = missing.length;

      for (let i = 0; i < totalToGen; i++) {
          const key = missing[i];
          setGenProgress(Math.round(((i) / totalToGen) * 100));
          
          let img = null;
          try {
            if (Object.keys(BESTIARY).includes(key)) {
                setCurrentGenItem(`Monster: ${key}`);
                img = await getEnemyVisual(key); 
            } else if (Object.keys(CHARACTERS).includes(key)) {
                setCurrentGenItem(`Investigator: ${key}`);
                img = await getCharacterVisual(key);
            } else {
                setCurrentGenItem(`Location: ${key}`);
                const isIndoor = INDOOR_LOCATIONS.includes(key);
                img = await generateLocationAsset(key, isIndoor ? 'room' : 'street');
            }
          } catch (e) {
            console.error(`Generation error for ${key}:`, e);
          }
          
          if (img) {
              lib[key] = img;
              saveAssetLibrary(lib);
          } else {
              setGenErrors(prev => prev + 1);
          }
          // Sequential delay to prevent rate limiting
          await new Promise(r => setTimeout(r, 600)); 
      }

      setGenProgress(100);
      setIsGenerating(false);
      setCurrentGenItem('Complete');
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-6 py-4 w-full text-left transition-all ${activeTab === id ? 'bg-[#e94560] text-white font-bold shadow-lg' : 'text-slate-400 hover:bg-[#1a1a2e] hover:text-white'}`}
      >
          <Icon size={18} /> <span className="uppercase tracking-widest text-xs">{label}</span>
      </button>
  );

  const ToggleItem = ({ label, description, icon: Icon, checked, onChange }: { label: string, description: string, icon: any, checked: boolean, onChange: (val: boolean) => void }) => (
      <div className="flex items-center justify-between p-4 bg-[#0a0a1a] rounded border border-slate-800 hover:border-slate-700 transition-colors group">
          <div className="flex items-center gap-4">
              <div className={`p-2 rounded bg-slate-900 ${checked ? 'text-[#e94560]' : 'text-slate-600'}`}>
                  <Icon size={20} />
              </div>
              <div>
                  <div className="text-sm font-bold text-slate-200 uppercase tracking-wider">{label}</div>
                  <div className="text-[10px] text-slate-500 italic">{description}</div>
              </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#e94560] peer-checked:after:bg-white"></div>
          </label>
      </div>
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

        {/* Content Area */}
        <div className="flex-1 bg-[#16213e] p-8 md:p-12 overflow-y-auto custom-scrollbar pt-20 md:pt-12">
            
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
                            { label: 'Music Volume', key: 'musicVolume', icon: Monitor }, 
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

            {activeTab === 'display' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Display & Visuals</h3>
                    <div className="space-y-4">
                        <ToggleItem 
                            label="High Contrast" 
                            description="Enhances visibility of text and important UI elements."
                            icon={Contrast}
                            checked={settings.graphics.highContrast}
                            onChange={(val) => handleSettingChange('graphics', 'highContrast', val)}
                        />
                        <ToggleItem 
                            label="Reduce Motion" 
                            description="Disables camera shake and complex UI animations."
                            icon={Wind}
                            checked={settings.graphics.reduceMotion}
                            onChange={(val) => handleSettingChange('graphics', 'reduceMotion', val)}
                        />
                        <ToggleItem 
                            label="Particles" 
                            description="Enables atmospheric fog and combat hit effects."
                            icon={Sparkles}
                            checked={settings.graphics.particles}
                            onChange={(val) => handleSettingChange('graphics', 'particles', val)}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'gameplay' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Gameplay Preferences</h3>
                    <div className="space-y-4">
                        <ToggleItem 
                            label="Show Grid" 
                            description="Draws visible borders around all discovered hex tiles."
                            icon={Grid}
                            checked={settings.gameplay.showGrid}
                            onChange={(val) => handleSettingChange('gameplay', 'showGrid', val)}
                        />
                        <ToggleItem 
                            label="Fast Mode" 
                            description="Increases the speed of character movement and enemy turns."
                            icon={Zap}
                            checked={settings.gameplay.fastMode}
                            onChange={(val) => handleSettingChange('gameplay', 'fastMode', val)}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'assets' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="flex justify-between items-end mb-4 border-b border-slate-800 pb-2">
                        <h3 className="text-xl font-bold text-amber-500 uppercase tracking-widest">Asset Studio</h3>
                        <div className="text-right">
                          <span className="text-xs text-slate-400 block">{assetRegistry.generated} / {assetRegistry.total} Assets</span>
                          {genErrors > 0 && <span className="text-[10px] text-red-500 uppercase font-bold tracking-widest flex items-center gap-1 justify-end"><AlertOctagon size={10}/> {genErrors} Failures</span>}
                        </div>
                    </div>
                    
                    <div className="p-6 bg-[#0a0a1a] rounded border border-amber-900/30 shadow-inner">
                        {isGenerating ? (
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs text-amber-400 font-bold uppercase">
                                    <span className="flex items-center gap-2 animate-pulse"><Loader size={12} className="animate-spin"/> Painting {currentGenItem}...</span>
                                    <span>{genProgress}%</span>
                                </div>
                                <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-amber-900/50">
                                    <div className="h-full bg-gradient-to-r from-amber-700 to-amber-500 transition-all duration-300" style={{width: `${genProgress}%`}}></div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Generate high-quality 1920s Chiaroscuro oil-painted assets. Missing items will be rendered and cached in your browser.
                                </p>
                                <div className="flex gap-4">
                                    {assetRegistry.missing.length > 0 ? (
                                        <button 
                                            onClick={handleGenerateAssets}
                                            className="flex-1 py-3 bg-amber-700 hover:bg-amber-600 text-white uppercase tracking-widest font-bold text-xs rounded shadow-lg"
                                        >
                                            <RefreshCw size={14} className="inline mr-2" /> Paint {assetRegistry.missing.length} Missing
                                        </button>
                                    ) : (
                                        <div className="flex-1 py-3 bg-green-900/20 border border-green-600/50 text-green-400 uppercase tracking-widest font-bold text-xs rounded text-center">
                                            <CheckCircle size={14} className="inline mr-2" /> Gallery Complete
                                        </div>
                                    )}
                                    
                                    <button 
                                        onClick={downloadAssetsAsJSON}
                                        disabled={assetRegistry.generated === 0}
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

            {activeTab === 'data' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <h3 className="text-2xl font-display text-white mb-6">Data Management</h3>
                    <div className="bg-red-900/10 border border-red-900/30 p-6 rounded">
                        <p className="text-red-300/60 text-xs mb-6 font-serif italic">This will wipe your current case progress and saved investigators. Assets (images) are preserved.</p>
                        <button 
                            onClick={() => {
                                if (confirmReset) {
                                    onResetData();
                                    setConfirmReset(false);
                                } else {
                                    setConfirmReset(true);
                                    setTimeout(() => setConfirmReset(false), 3000);
                                }
                            }} 
                            className={`w-full py-4 font-bold rounded transition-all uppercase tracking-widest text-sm ${confirmReset ? 'bg-red-500 text-white animate-pulse' : 'bg-red-900/40 text-red-500 border border-red-500/50 hover:bg-red-900/60'}`}
                        >
                            {confirmReset ? 'Are you absolutely sure?' : 'RESET ALL GAME DATA'}
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default OptionsMenu;
