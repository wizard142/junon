# Outcome

Restore the automatic Peaceful / Survival / Hardcore choice for newly created
local colonies and refresh every portable item and mob sprite in an original
survival-game art style inspired by Taming.io and Devast.io.

## Context

SelectDifficultyMenu.showGameMode suppresses worlds with createdAt=0; local
Firebase-off worlds have no persisted creation timestamp. The sprite inventory
covers equipment, armor, resources, ammo, food/drink, creatures, character parts
and corpses. Buildings/world terrain and UI symbols remain in their dark style.

## Progress

- [x] 2026-10-21: Inventory the sprite consumers and trace missing mode selection.
- [x] Restore local mode selection; all three choices pass the live browser check.
- [x] Generate and inspect three base sheets plus a dedicated muted overhead weapon atlas.
- [x] Integrate 175 textures with original canvases/bounds and both trimmed packed atlases.
- [x] Validate 175 textures, atlas consistency, real mode selection, creature rendering and rifle equip/turn; production build passes.

## Implementation

Keep all type IDs, physics, stats and animation transforms. Redesign atlas art,
then extract into the existing named PNG assets and synchronize the packed atlas
so world rendering, inventory/crafting and held items use the same artwork.
Retain existing dark world rendering. No third-party game assets are copied.

## Validation

Mode picker should open automatically for an owning player without an assigned
mode; all three choices should apply through SectorAction. Verify dimensions,
alpha, atlas consistency, image changes, client build and focused real gameplay.

## Decisions

- 2026-10-21: Exclude simple tint masks, UI symbols, terrain and structures from
  raster redesign. Preserve component sprites as components, including hands,
  wings, helmet lenses and robot parts.

## Follow-up direction

The user rejected side-view weapons and bright/generic finishes. A dedicated
4x4 sheet now establishes original overhead industrial designs. Reviewed manual
crop bounds preserve its long rifle silhouettes where they cross nominal cells.
No brightness filter was added.

## Discoveries and risks

Packed atlas-2222.json has 561 frames. Changing standalone PNGs alone would
leave most world textures stale. Both representations must be updated.

## Result

Mode unit checks pass (11); the first asset coverage/atlas run passes (3). All
three automatic mode-choice paths pass against the live development/MariaDB
stack with a temporary Playwright configuration that disables globalSetup.
Final weapon art passes all 175 canvas/alpha checks and both packed atlas
comparisons. The runtime scene passes with real sandbox commands, an equipped
rifle turning via mouse input, and Slime/Spider/Golem rendering. Production
`npm run client:build` passes, with pre-existing missing-translation warnings.
All untouched atlas frames were compared with HEAD and remain byte-identical
at decoded pixel level. The test uses the existing stress flag to avoid disconnecting
the user's anonymous colony on the same local IP.

The runtime fixture uses explicit player-ground coordinates and excludes other
mobs from the command-spawned creatures' attack targets. This avoids random
placement into space or creatures killing each other before render assertions;
it does not modify runtime AI or stats. New browser scenarios allow 120 seconds
for the real asset and gameplay flow. Existing world-color/join helpers dismiss
the newly automatic picker before ordinary gameplay checks.

Final verification: 14 focused Jest checks pass (asset validation decodes each
atlas once); all 5 browser scenarios pass across the three mode choices,
creature/rifle rendering and the 64 x 96 dark-world regression. Syntax and diff
checks pass. The development server remains running, with no restart of the
user's active game during the sprite refresh.
