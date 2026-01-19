# Assets Directory

This folder contains static game assets (graphics, audio, music).

## Asset Pipeline

The game uses an **Asset Pipeline** system defined in `utils/AssetLibrary.ts`:

1. **Manual Assets First**: The game checks this folder for manually created assets
2. **AI Fallback**: If no asset is found, the game uses Gemini AI to generate it
3. **Cache**: Generated assets are cached in localStorage

## Directory Structure

```
/assets
  /audio
    /music
      ambience.mp3        # Background ambience music
      combat.mp3          # Combat music
      horror.mp3          # Horror stinger
      ...
    /sfx
      roll.mp3            # Dice roll sound
      click.mp3           # Button click
      success.mp3         # Success sound
      fail.mp3            # Failure sound
      combat_hit.mp3      # Combat hit
      door_open.mp3       # Door opening
      ...
  /graphics
    /tiles
      start_location.png  # Starting tile
      library.png
      harbor.png
      church.png
      ...
    /monsters
      cultist.png
      deep_one.png
      ghoul.png
      shoggoth.png
      ...
    /characters
      detective.png
      veteran.png
      antiquarian.png
      professor.png
      ...
```

## Naming Convention

All asset filenames are **lowercase with underscores**:
- "Dark Altar" -> `dark_altar.png`
- "Deep One" -> `deep_one.png`
- "Start Location" -> `start_location.png`

## File Formats

- **Graphics**: PNG (transparent background preferred), 256x256 or 512x512 pixels
- **Audio**: MP3 or WAV

## Style Guidelines

### Graphics
- Dark, gritty 1920s Lovecraftian aesthetic
- Oil painting style with high contrast
- Top-down perspective for tiles
- Isolated on dark/transparent background for characters/monsters

### Audio
- Atmospheric, moody sounds
- 1920s era appropriate
- Short stingers (1-5 seconds) for SFX
- Loopable for music/ambience
