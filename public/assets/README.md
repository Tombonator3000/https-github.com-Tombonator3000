# Assets Folder Structure

This folder contains manual assets for the game. If files are present here, they will be used instead of AI-generated content.

## Audio

### Music
- `music/ambience.mp3` - Background ambience track

### Sound Effects (SFX)
- `sfx/roll.mp3` - Dice roll sound
- `sfx/horror.mp3` - Horror/Sanity loss sound
- `sfx/click.mp3` - UI click sound
- `sfx/combat.mp3` - Combat/attack sound
- `sfx/success.mp3` - Success/positive feedback
- `sfx/fail.mp3` - Failure/negative feedback
- `sfx/doom.mp3` - Doom clock advance sound

## Graphics

### Tiles
Place top-down tile images for locations here. Files should be named after the location (e.g., `library.png`, `dark_altar.png`).

Example locations:
- StartLocation.png
- Library.png
- DarkAltar.png
- Cemetery.png
- HarbourDistrict.png

### Monsters
Place creature/enemy images here. Files should match the enemy type (e.g., `cultist.png`, `deepone.png`).

Available enemy types:
- cultist.png
- deepone.png
- ghoul.png
- shoggoth.png
- darkpriest.png
- nightgaunt.png
- houndoftindalos.png
- starspawn.png
- byakhee.png
- migo.png
- formlesshorror.png
- dimensionalshambler.png
- flyingpolyp.png
- moonbeast.png
- elderthing.png
- greatoldone.png

### Characters
Place investigator portrait images here. Files should match the character ID (e.g., `detective.png`, `veteran.png`).

Available characters:
- detective.png
- professor.png
- journalist.png
- veteran.png
- occultist.png
- doctor.png

## Fallback Behavior

If a file is missing from this folder:
- **Graphics**: The game will attempt to generate it using Gemini AI (if API key is configured)
- **Audio**: The game will use procedural sound synthesis via Tone.js
