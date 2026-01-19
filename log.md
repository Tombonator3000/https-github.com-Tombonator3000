# Project Log - Shadows of the 1920s

## [v3.10.16 - Core Mechanics Restoration] - 2024-05-24 15:30
### 🔍 Status Report:
- **AUDIT:** Identifisert at kampsystem og etterforskning var deaktivert i `App.tsx` etter UI-refaktorering.
- **FIXED:** Implementert `handleInvestigation` for å finne items/ledetråder.
- **FIXED:** Implementert `handleAttack` for å skade monstre.
- **FIXED:** Lagt til spawn-logikk for fiender slik at brettet ikke forblir tomt.
- **FIXED:** Gjeninnført sjekk for quest-items i scenario-steg.

### 🚩 REMOVAL AUDIT (Hva som var fjernet/manglet):
1. **Combat Engine:** `attack` i `handleAction` var tom. Spiller kunne ikke skade monstre.
2. **Investigation Loot:** Ingen kobling mellom `investigate` og `ITEMS` tabellen.
3. **Enemy AI:** Monstre stod stille og angrep aldri (Mythos-fasen manglet iterasjon).
4. **Victory/Loss Conditions:** Sjekk for om alle spillere er døde eller Doom har nådd 0 manglet.
5. **Quest State:** `questItemsCollected` ble aldri oppdatert.

### ✅ Added:
* **Functional Dice Bridge:** Terningkast utløser nå faktiske spill-effekter.
* **Loot Table Integration:** Etterforskning kan nå gi faktiske gjenstander fra `constants.ts`.
* **Monster Spawn Logic:** Lagt til `spawnEnemy` helper.
