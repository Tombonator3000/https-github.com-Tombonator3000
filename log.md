# Project Log - Shadows of the 1920s

## [v3.10.20 - Magic Restoration & Phase Logic Fix] - 2024-05-24 20:30
### 🔍 Status Report:
- **FIXED:** Gjeninnført magisystemet. `handleAction` manglet 'cast' og 'cancel_cast'. Magiske angrep og healing kan nå utføres ved å velge en trylleformel og klikke på et mål.
- **FIXED:** "End Round"-knappen fungerer nå stabilt. Problemet skyldtes en "race condition" der Mythos-logikken ble sjekket før state-oppdateringen var ferdig. Dette er nå flyttet til en `useEffect`.
- **RESTORED:** Occultisten starter nå med en tilfeldig trylleformel fra `SPELLS` ved rekruttering.
- **RESTORED:** Item-logikk for Medkit og Whiskey er lagt til i `handleAction('item')`.
- **AI IMPROVEMENT:** Mythos-fasen prosesserer nå fiendens bevegelser (stalking) mer pålitelig før den gir turen tilbake til etterforskerne.

### ✅ Added:
* **Spell Targeting:** Klikk på en fiende eller tile mens en spell er aktiv vil nå utløse effekten (skade, healing, reveal).
* **Mythos Processor:** En dedikert `useEffect` som håndterer overgangen fra mørke til lys.
* **Consumable Usage:** Spilleren kan nå bruke gjenstander i inventory for å heale seg selv.
