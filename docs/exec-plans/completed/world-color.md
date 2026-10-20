# Outcome
Remove the home intro heading/paragraph. Brighten environment and colony colors
while keeping approved UI colors, creature art, animation, simulation, lighting
and visibility rules intact.

## Context
ClientContainer builds named layers for sectors and ships. Static terrain,
structures and ceilings can be graded separately from players/mobs/units.

## Progress
- [x] Inspect renderer layering and lighting.
- [x] Apply environment-only color grading and remove intro copy/styles.
- [x] Compare matched screenshots and validate mob exclusion and gameplay.

## Implementation
Use a few grouped color passes at the original z-order positions, rather than
filters on every tile or the whole game canvas. Leave the existing global light
map and fog-of-war after these layers. Preserve canvas-renderer compatibility.

## Validation
Client build; real-browser matched before/after world screenshots; assert static
layers are graded and movable layers remain outside the grading containers;
focused movement/building/mining flows.

## Decisions
No mob asset, model, behavior or network changes. No global CSS canvas filter.

## Discoveries and risks
Render filters require WebGL; canvas mode retains original rendering. Grouping
must preserve original static/movable/ceiling order and chunk caching.

## Result
Completed. Removed the intro heading, paragraph, unused styles and locale keys.
Added environment-only grouped grading and a richer space-blue backdrop.

Validation:
- `npm run client:build`: passed (existing translation warnings remain).
- `npm exec --workspace packages/junon-io -- playwright test world_colors.spec.js building.spec.js mining.spec.js --timeout=90000`: 5 passed.
- The world test uses matched screenshots of a disposable colony, asserts a
  measurable brightness increase and ungraded movable layers, checks lighting/fog
  order, and verifies the removed home block stays absent after returning home.
- JavaScript syntax and diff whitespace checks pass.

Canvas mode keeps original rendering. The filter adds three grouped sector
passes rather than per-entity work. No creature assets/behavior, server state,
lighting rules, collision or save/protocol formats changed.
