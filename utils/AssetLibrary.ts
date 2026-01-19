
import { GoogleGenAI } from "@google/genai";
import { INDOOR_LOCATIONS, OUTDOOR_LOCATIONS, BESTIARY, CHARACTERS } from '../constants';
import { Enemy, Player, CharacterType, EnemyType } from '../types';

const ASSET_KEY = 'shadows_1920s_assets_v1';

export interface AssetLibrary {
    [locationName: string]: string; // Maps location name to Base64 image string or URL path
}

const toFileName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
};

export const loadAssetLibrary = (): AssetLibrary => {
    try {
        const saved = localStorage.getItem(ASSET_KEY);
        if (!saved || saved === "undefined") return {};
        const parsed = JSON.parse(saved);
        return (parsed && typeof parsed === 'object') ? parsed : {};
    } catch (e) {
        console.error("Critical: Could not load Asset Library", e);
        return {};
    }
};

export const saveAssetLibrary = (library: AssetLibrary): boolean => {
    try {
        const data = JSON.stringify(library);
        localStorage.setItem(ASSET_KEY, data);
        return true;
    } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.error("CRITICAL: LocalStorage is FULL. Cannot save more AI assets.");
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

export const generateLocationAsset = async (locationName: string, type: 'room' | 'street' | 'building'): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    
    const prompt = `A top-down bird's-eye view 90-degree battlemap tile for a board game set in 1920s Lovecraftian horror. Location: ${locationName}. Art Style: Gritty dark oil painting, heavy Chiaroscuro lighting, deep shadows. Constraints: No grid, no text, no people.`;

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1" } }
        });
        
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content.parts;
            for (const part of parts) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (e) {
        console.error(`AI Tile Generation Failed for ${locationName}:`, e);
        return null;
    }
};

export const getCharacterVisual = async (charId: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const charName = CHARACTERS[charId as CharacterType]?.name || charId;
    const prompt = `A dark, moody 1920s portrait of ${charName}. Art Style: High-contrast oil painting, heavy brushstrokes, Chiaroscuro lighting. Aesthetic: Eldritch horror, cinematic framing.`;
    
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
        console.error(`AI Character Generation Failed:`, e);
    }
    return null;
};

export const getEnemyVisual = async (enemyType: string): Promise<string | null> => {
    if (!process.env.API_KEY) return null;
    const bestiaryEntry = BESTIARY[enemyType as EnemyType];
    const prompt = `A nightmarish cosmic horror monster: ${bestiaryEntry?.name || enemyType}. Art Style: Gritty oil painting, Chiaroscuro lighting, emerging from darkness. 1920s aesthetic.`;

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
        console.error(`AI Monster Generation Failed:`, e);
    }
    return null;
};
