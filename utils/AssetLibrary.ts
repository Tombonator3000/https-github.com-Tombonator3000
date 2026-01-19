
import { GoogleGenAI } from "@google/genai";
import { INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, BESTIARY, CHARACTERS } from '../constants';
import { Enemy, Player, CharacterType, EnemyType } from '../types';

const ASSET_KEY = 'shadows_1920s_assets_v1';

// Lazy-initialize AI to prevent crash when API_KEY is undefined (e.g., on GitHub Pages)
let _ai: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI | null => {
    if (_ai) return _ai;
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    try {
        _ai = new GoogleGenAI({ apiKey });
        return _ai;
    } catch (e) {
        console.warn("Failed to initialize GoogleGenAI:", e);
        return null;
    }
};

// Get base URL for assets (handles GitHub Pages deployment)
const getBaseUrl = () => import.meta.env.BASE_URL || '/';

export interface AssetLibrary {
    [locationName: string]: string; // Maps location name to Base64 image string or URL path
}

// Try to load static assets
let STATIC_ASSETS: AssetLibrary = {};

// Helper to check if a local file exists (Head request)
const checkLocalAsset = async (path: string): Promise<boolean> => {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        return response.ok;
    } catch (e) {
        return false;
    }
};

// Helper to sanitize names for filenames (e.g. "Dark Altar" -> "dark_altar")
const toFileName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

// Load library from local storage OR static file
export const loadAssetLibrary = (): AssetLibrary => {
    try {
        const saved = localStorage.getItem(ASSET_KEY);
        const localLib = saved ? JSON.parse(saved) : {};
        return { ...STATIC_ASSETS, ...localLib };
    } catch (e) {
        console.error("Failed to load asset library", e);
        return {};
    }
};

export const saveAssetLibrary = (library: AssetLibrary) => {
    try {
        localStorage.setItem(ASSET_KEY, JSON.stringify(library));
    } catch (e) {
        console.warn("Failed to save asset library (likely quota exceeded). Assets will persist per session only.", e);
    }
};

// --- TILES ---

export const generateLocationAsset = async (locationName: string, type: 'room' | 'street' | 'building'): Promise<string | null> => {
    // 1. Check Manual File
    const fileName = toFileName(locationName);
    const localPath = `${getBaseUrl()}assets/graphics/tiles/${fileName}.png`;
    
    if (await checkLocalAsset(localPath)) {
        console.log(`[AssetLibrary] Found local asset for ${locationName}`);
        return localPath;
    }

    // 2. Check AI / API
    const ai = getAI();
    if (!ai) return null;

    const prompt = `A top-down, tabletop RPG battlemap tile of a ${locationName} (${type}) in a 1920s Lovecraftian horror setting.
    Style: Dark, gritty, hand-painted oil painting aesthetic. High contrast, atmospheric lighting, ominous shadows.
    Perspective: Strictly top-down (bird's eye view).
    Constraints: No grid lines, no text, no UI elements.
    The image should look like a finished board game component.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
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

// --- CHARACTERS ---

export const getCharacterVisual = async (player: Player): Promise<string | null> => {
    // 1. Check Manual File
    const fileName = player.id; // e.g. 'detective'
    const localPath = `${getBaseUrl()}assets/graphics/characters/${fileName}.png`;

    if (await checkLocalAsset(localPath)) {
        return localPath;
    }

    // 2. Check AI Generation
    const ai = getAI();
    if (!ai) return null;

    const prompt = `A dark, moody, oil painting style portrait of a 1920s ${CHARACTERS[player.id].name} (${player.id}) in a Lovecraftian horror setting. High contrast, atmospheric, vintage.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            return `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
        }
    } catch (e) {
        console.warn("Character gen failed", e);
    }
    return null;
};

// --- ENEMIES ---

export const getEnemyVisual = async (enemy: Enemy): Promise<string | null> => {
    // 1. Check Manual File
    const fileName = enemy.type;
    const localPath = `${getBaseUrl()}assets/graphics/monsters/${fileName}.png`;

    if (await checkLocalAsset(localPath)) {
        return localPath;
    }

    // 2. Check AI Generation
    const ai = getAI();
    if (!ai) return null;

    const bestiaryEntry = BESTIARY[enemy.type];
    const specificPrompt = bestiaryEntry?.visualPrompt || `A terrifying, nightmarish illustration of a ${enemy.name} (${enemy.type}) from Cthulhu mythos. Dark fantasy art, creature design, horror, menacing, detailed, isolated on dark background.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: specificPrompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
            return `data:image/png;base64,${response.candidates[0].content.parts[0].inlineData.data}`;
        }
    } catch (e) {
        console.warn("Enemy gen failed", e);
    }
    return null;
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
