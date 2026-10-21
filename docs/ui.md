# Survival interface

The DOM interface keeps the original game event hooks. Its visual
layer is `packages/junon-io/client/stylesheets/station.css`, loaded after legacy
and mobile styles by Gulp. Never edit generated bundles.

## Direction

The references are Taming.io (https://taming.io) and Devast.io
(https://devast.io): heavy silhouettes, raised buttons, illustrated item wells,
bold short labels and compact floating controls. This project uses original
Junon artwork with a dark charcoal and space-blue hull / muted amber accent palette, rather than copying
reference assets. The raised silhouettes were retained after review; the light gray metal palette was replaced with darker colors drawn from Junon’s world.

- The game world remains visible behind the HUD; black edge strips are transparent.
- Survival bars sit beside the larger hotbar on desktop, with compact layouts
  moving them upward to avoid collisions.
- Inventory opens as a six-column backpack with an equipment shelf and gold count.
- Crafting shows an icon-card grid, category tabs, search and a recipe detail panel.
- Existing slot indexes, visibility, input handlers and disabled/ingredient states
  remain authoritative. Empty slots remain usable destinations for item moves.
- System/body fonts support longer text; locally bundled Lilita One adds weight
  to short labels. Its SIL Open Font License is included alongside the font.
- Mobile legacy `!important` panel rules need targeted overrides. Check landscape
  and portrait as well as desktop before changing layout.

## Verification

Build with `npm run client:build`. Exercise the existing crafting, building and
storage Playwright specs against the real server, including material deductions
and item transfers. Verify search and panel containment at 1440x900, 844x390 and
390x844. Inspect inventory, HUD and recipe screenshots, not only DOM assertions.

## Full shell

`interface.css` extends the shared palette to the home/world browser, navigation,
new-colony setup, settings/pause, shared interaction panels, social/trade tabs,
notifications and tooltips. It loads after `station.css`. Home layouts can scroll
vertically on small displays; modal interaction panels stay inside the viewport.
Do not force hidden menus or tabs visible to implement a layout.

Home play/settings controls and empty close controls use native buttons with
localized accessible names, retaining the original classes and event listeners.
Added entry-screen copy and empty-state messages are included in English, Japanese and Russian. The
original desktop-transition notice and external links remain present.

`test/e2e/interface.spec.js` checks home navigation, volume controls, compact home
width, real colony join/storage, game-mode selection and pause/resume. Set
`JUNON_UI_SCREENSHOT_DIR` to an external directory to save UI captures; otherwise
captures use the test artifact directory. Existing crafting/building/storage specs
remain the regression checks for authoritative gameplay and item transfers.

The colony browser derives its empty state from the currently visible list and
filtered entries. A scoped MutationObserver tracks list/filter changes without
changing the existing matchmaker/search protocol. Its own hidden attribute is
excluded from observation to avoid a mutation loop.

The new-colony row/column controls send numeric dimensions to the matchmaker.
Existing `?row=` / `?col=` overrides still take precedence and are converted to
numbers before the server applies its allowed-size validation.

## World colors

The world uses the original dark Junon rendering and `#112944` space backdrop.
The previous environment brightness/saturation filters and their wrapper layers
have been removed. Terrain, structures, ships and creatures use their original
render ordering, lighting and fog.

The home intro heading and paragraph remain removed. The play buttons and colony
browser remain the primary entry controls.

`test/e2e/world_colors.spec.js` creates a colony using non-default dimensions,
checks the dark backdrop and unfiltered world layers, and confirms that the intro
stays removed. Screenshots honor `JUNON_UI_SCREENSHOT_DIR`.

## Creature and item art

`art/sprite-refresh/` contains reviewed source atlases, prompt direction, the
175-texture manifest and original geometry. The final overhead weapon sheet
supersedes the weapon cells in the base item sheets: muted industrial receivers,
vents and panels, with top surfaces visible and no hanging side-view grips.
`node scripts/refresh-sprites.cjs` extracts these into named source PNGs and both
legacy packed atlases, respecting trimmed-frame coordinates. The world terrain,
colony structures, lighting and dark palette remain unchanged.

The three mode cards (Sandbox, Survival, Hardcore) open automatically for a new
owner-controlled non-tutorial colony without an assigned mode. A missing/zero
creation timestamp no longer hides them. Known saves from before the mode
system keep their legacy behavior. `game_modes.spec.js` checks every real choice;
`sprite_runtime.spec.js` checks equipping/turning a weapon and rendering real
spawned mobs through normal sandbox commands.
