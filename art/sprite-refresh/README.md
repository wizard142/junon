# Junon survival sprites

These are the reviewed source atlases for 175 mob/character-component and portable
item textures. Built-in ImageGen produced original artwork using existing Junon
textures as edit targets. No Taming.io or Devast.io assets were copied.

## Final prompt set and direction

- **Creatures and characters:** exact 8x8 layout and original subjects/facing;
  original industrial space-station ecosystem, chipped hexagonal armor,
  segmented tendrils, inset vents, bolted hulls and dim organic cores. Thick dark
  outlines and restrained 2–3 tone cel shading; muted graphite, moss, dusty violet,
  slate, oxblood and worn bronze. Keep hands, wings, body/core/light layers and
  corpses separate; tintable masks remain neutral gray. No bright neon, bloom,
  scenery, text or shadows. Empty bottom cells stay empty. Transparent alpha.
- **Equipment and supplies (both sheets):** exact 8x8 layout, same item identities
  and cells. Every weapon/tool is directly overhead, pointing right, showing top
  receiver/barrel surfaces without side-profile grips or hanging magazines.
  Original pressure-rated industrial casings, split panels, inset inspection
  windows, hex fasteners, ceramic shrouds, vents and quiet ochre bands. Muted dark
  charcoal/steel/bronze/olive/oxblood, tiny subdued status accents. Food, medicine
  and resources remain distinguishable. Armor remains an overhead round overlay;
  helmet shell and eye masks remain isolated neutral components. Thick outlines,
  flat cel shading, no pixelation, scenery, labels or bright glow. Transparent
  background with padding; last four cells of sheet 2 stay empty.

Earlier side-view and brighter drafts were rejected. For weapons, the final
overhead sheet overrides the intermediate drafts in the base item sheets.
The three base source sheets are 1254px square; cell boundaries use rounded
eighths. The final 1536x1024 `overhead-weapons.png` supersedes the 16 weapon/tool
cells in the base sheets. Its reviewed crop rectangles are recorded in the
manifest to preserve complete long rifle silhouettes. This final sheet was
generated independently to establish true overhead housings, then refined to
remove side grips, hide optic mounts and keep all background pixels transparent.

## Packaging

Run `node scripts/refresh-sprites.cjs` from the repository root. `manifest.json`
maps every sheet cell to its established texture filename. `geometry.json`
records the original canvas and alpha bounds, so regeneration retains pivots and
on-screen size. The script extracts and resizes art, then updates the two legacy
packed atlases, respecting their trimmed frames. It does not recolor textures.

Runtime source PNGs live in `packages/junon-io/client/assets/images/`; packed
frames remain in `background/atlas-1111.png` and `background/atlas-2222.png`.
No IDs, stats, hitboxes or animation transforms change. Terrain, building art,
world colors, status symbols and plain tint textures remain outside this pass.

`test/world/sprite_assets.test.js` checks every canvas/alpha channel and verifies
that both packed atlases match the corresponding standalone PNGs.
