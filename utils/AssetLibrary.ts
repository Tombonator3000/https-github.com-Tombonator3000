
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
        if (!saved) return {};
        return JSON.parse(saved);
    } catch (e) {
        console.error("Critical: Could not load Asset Library", e);
        return {};
    }
};

export const saveAssetLibrary = (library: AssetLibrary): boolean => {
    try {
        const data = JSON.stringify(library);
        localStorage.setItem(ASSET_KEY, data);
        console.log(`Asset Library saved. Current size: ${(data.length / 1024).toFixed(2)} KB`);
        return true;
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.error("CRITICAL: LocalStorage is FULL. Cannot save more AI assets. Export to JSON or clear data.");
        } else {
            console.error("Failed to save Asset Library", e);
        }
        return false;
    }
};

export const downloadAssetsAsJSON = () => {
    const library = loadAssetLibrary();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(library));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "shadows_assets_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

// --- ROBUST AI GENERATION ---

export const generateLocationAsset = async (locationName: string, type: 'room' | 'street' | 'building'): Promise<string | null> => {
    if (!process.env.API_KEY) {
        console.warn("API Key missing in process.env.API_KEY");
        return null;
    }
    
    const prompt = `A 1920s Lovecraftian cosmic horror board game battlemap tile. 
    Location: ${locationName}. Top-down view, 90-degree perspective. 
    Art Style: Dark Chiaroscuro oil painting, thick impasto, flickering candlelight, deep ink-black shadows. 
    Constraints: No rutenett, no text, no characters, perfectly flat. 
    Aesthetic: Gritty, terrifying, mysterious.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { 
                imageConfig: { aspectRatio: "1:1" } 
            }
        });
        
        console.log(`API Response for ${locationName}:`, response);

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            console.error("No candidates returned from AI");
            return null;
        }

        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData) {
                console.log(`Success! Image found in parts for ${locationName}`);
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }

        console.warn(`AI returned text instead of an image for ${locationName}`);
        return null;
    } catch (e) {
        console.error(`Fatal AI Error for ${locationName}:`, e);
        return null;
    }
};

export const getCharacterVisual = async (charId: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const charName = CHARACTERS[charId as CharacterType]?.name || charId;
    const prompt = `A dark, stressed 1920s portrait of an investigator named ${charName}. 
    Art Style: High-contrast oil painting, Chiaroscuro, sepia and cold blue tones. 
    Aesthetic: Eldritch horror, cinematic lighting.`;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    } catch (e) {
        console.error(`Character AI Error:`, e);
    }
    return null;
};

export const getEnemyVisual = async (enemyType: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const bestiaryEntry = BESTIARY[enemyType as EnemyType];
    const basePrompt = `Terrifying cosmic horror monster: ${bestiaryEntry?.name || enemyType}. 
    Art Style: Gritty oil painting, Chiaroscuro lighting, emerging from darkness. 1920s style.`;
    const prompt = bestiaryEntry?.visualPrompt ? `${basePrompt} Details: ${bestiaryEntry.visualPrompt}` : basePrompt;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    } catch (e) {
        console.error(`Monster AI Error:`, e);
    }
    return null;
};
