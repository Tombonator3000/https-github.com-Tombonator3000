
import { GoogleGenAI } from "@google/genai";
import { INDOOR_LOCATIONS, OUTDOOR_LOCATIONS } from '../constants';

const ASSET_KEY = 'shadows_1920s_assets_v1';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface AssetLibrary {
    [locationName: string]: string; // Maps location name to Base64 image string
}

// Try to load static assets (This will be empty initially, but user can populate it)
let STATIC_ASSETS: AssetLibrary = {};
try {
    // In a real build step, we might import a JSON file.
    // For this prototype, we will rely on the user pasting data or loading it via a mechanism if we had fs access.
    // We will simulate "checking" for it.
    // import assets from '../game_assets.json'; 
    // STATIC_ASSETS = assets;
} catch (e) {
    // No static assets found
}

// Load library from local storage OR static file
export const loadAssetLibrary = (): AssetLibrary => {
    try {
        const saved = localStorage.getItem(ASSET_KEY);
        const localLib = saved ? JSON.parse(saved) : {};
        
        // Merge: Local storage overrides static (dev mode), but static fills gaps
        return { ...STATIC_ASSETS, ...localLib };
    } catch (e) {
        console.error("Failed to load asset library", e);
        return {};
    }
};

// Save library to local storage
export const saveAssetLibrary = (library: AssetLibrary) => {
    try {
        localStorage.setItem(ASSET_KEY, JSON.stringify(library));
    } catch (e) {
        console.error("Failed to save asset library (likely quota exceeded)", e);
    }
};

// Generate a single asset
export const generateLocationAsset = async (locationName: string, type: 'room' | 'street' | 'building'): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    
    // Strict, consistent prompt for uniform game art style
    const prompt = `A top-down, tabletop RPG battlemap tile of a ${locationName} (${type}) in a 1920s Lovecraftian horror setting. 
    Style: Dark, gritty, hand-painted oil painting aesthetic. High contrast, atmospheric lighting, ominous shadows. 
    Perspective: Strictly top-down (bird's eye view). 
    Constraints: No grid lines, no text, no UI elements. 
    The image should look like a finished board game component.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: { aspectRatio: "1:1" }
            }
        });
        
        const candidates = response.candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.warn(`Failed to generate asset for ${locationName}:`, e);
        return null;
    }
};

// Helper to get list of all missing assets
export const getMissingAssets = (currentLib: AssetLibrary, allLocations: string[]): string[] => {
    return allLocations.filter(loc => !currentLib[loc]);
};

// DOWNLOAD FUNCTION
export const downloadAssetsAsJSON = () => {
    const lib = loadAssetLibrary();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lib));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "game_assets.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};
