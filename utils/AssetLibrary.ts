
import { GoogleGenAI } from "@google/genai";
import { INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, BESTIARY, CHARACTERS } from '../constants';
import { Enemy, Player, CharacterType, EnemyType } from '../types';

const ASSET_KEY = 'shadows_1920s_assets_v1';

export interface AssetLibrary {
    [locationName: string]: string; // Maps location name to Base64 image string or URL path
}

// Helper to check if a local file exists
const checkLocalAsset = async (path: string): Promise<boolean> => {
    try {
        const response = await fetch(path, { method: 'HEAD' });
        // Ensure it's actually an image and not a redirected index.html
        const contentType = response.headers.get('content-type');
        return response.ok && (contentType?.startsWith('image/') ?? false);
    } catch (e) {
        return false;
    }
};

const toFileName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

export const loadAssetLibrary = (): AssetLibrary => {
    try {
        const saved = localStorage.getItem(ASSET_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Failed to load asset library", e);
        return {};
    }
};

export const saveAssetLibrary = (library: AssetLibrary) => {
    try {
        localStorage.setItem(ASSET_KEY, JSON.stringify(library));
    } catch (e) {
        console.warn("Asset library storage limit approached. Consider exporting to JSON.", e);
    }
};

// --- CORE GENERATION LOGIC ---

export const generateLocationAsset = async (locationName: string, type: 'room' | 'street' | 'building'): Promise<string | null> => {
    const fileName = toFileName(locationName);
    const localPath = `/assets/graphics/tiles/${fileName}.png`;
    
    if (await checkLocalAsset(localPath)) return localPath;
    if (!process.env.API_KEY) return null;
    
    const prompt = `A strict 90-degree top-down bird's-eye view battlemap tile for a board game. 
    Location: ${locationName} (${type}). 
    Art Style: Gritty 1920s Lovecraftian horror, dark oil painting, heavy Chiaroscuro lighting, deep shadows, flickering gaslight. 
    Constraints: No grid, no text, no UI, no people. Perspective must be perfectly flat top-down. 
    ${type === 'room' ? 'Indoor floorboards and dusty furniture.' : 'Outdoor wet cobblestones and swirling mist.'}`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [{ text: prompt }] 
            },
            config: { 
                imageConfig: { aspectRatio: "1:1" } 
            }
        });
        
        if (!response.candidates?.[0]?.content?.parts) return null;

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error(`AI Tile Generation Failed for ${locationName}:`, e);
        return null;
    }
};

export const getCharacterVisual = async (charId: string): Promise<string | null> => {
    const localPath = `/assets/graphics/characters/${charId}.png`;
    if (await checkLocalAsset(localPath)) return localPath;
    if (!process.env.API_KEY) return null;

    const charName = CHARACTERS[charId as CharacterType]?.name || charId;
    const prompt = `A dark, moody 1920s portrait of ${charName}. 
    Art Style: High-contrast oil painting, heavy brushstrokes, Chiaroscuro lighting, vintage sepia and cold blue tones. 
    Aesthetic: Eldritch horror, stressed investigator, cinematic framing. No text.`;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [{ text: prompt }] 
            },
            config: { 
                imageConfig: { aspectRatio: "1:1" } 
            }
        });
        
        if (!response.candidates?.[0]?.content?.parts) return null;

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error(`AI Character Generation Failed for ${charId}:`, e);
    }
    return null;
};

export const getEnemyVisual = async (enemyType: string): Promise<string | null> => {
    const localPath = `/assets/graphics/monsters/${enemyType}.png`;
    if (await checkLocalAsset(localPath)) return localPath;
    if (!process.env.API_KEY) return null;

    const bestiaryEntry = BESTIARY[enemyType as EnemyType];
    const basePrompt = `A nightmarish, terrifying creature from cosmic horror: ${bestiaryEntry?.name || enemyType}. 
    Art Style: Gritty oil painting, Chiaroscuro lighting, emerging from absolute black shadows. 
    Atmosphere: Distressing, detailed textures of slime or scales, 1920s aesthetic. 
    No text, no UI.`;
    
    const prompt = bestiaryEntry?.visualPrompt ? `${basePrompt} Details: ${bestiaryEntry.visualPrompt}` : basePrompt;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { 
                parts: [{ text: prompt }] 
            },
            config: { 
                imageConfig: { aspectRatio: "1:1" } 
            }
        });
        
        if (!response.candidates?.[0]?.content?.parts) return null;

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.error(`AI Monster Generation Failed for ${enemyType}:`, e);
    }
    return null;
};

export const getMissingAssets = (currentLib: AssetLibrary, allLocations: string[]): string[] => {
    return allLocations.filter(loc => !currentLib[loc]);
};

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
