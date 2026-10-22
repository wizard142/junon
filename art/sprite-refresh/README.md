# Original Junon art and terrain polish

The 175 mob, character-part and portable item PNGs are restored from ceed23e,
byte for byte. The replacement industrial designs from 920fb79 were rejected.
The first three contact sheets document the original art; their manifest batches
use `preserveOriginal: true`, so packaging always copies `originals/` exactly.
An attempted constrained retouch also changed interior details too much in
side-by-side review and was not shipped.

## Terrain edit

Built-in ImageGen, edit mode, produced `terrain-polish.png` using the original
39-texture terrain contact sheet as the edit target. No external game assets
were copied. The prompt direction was: preserve the exact 8x8 cell arrangement,
original Junon top-down shapes, shoreline edges and ore cluster placement;
refine existing materials with restrained water ripples, dark lava crust with
red fissures, near-black oil, subdued rock grain, dirt and ice detail. Keep the
dark brown/slate palette, original black outlines, transparent background and
empty cells; no new terrain geometry, text, scenery, bloom or global brightness.

The source contains water, lava, lava bubble, oil, ice, lava rock, ground, four
dirt variants, meteor rock, asteroid texture, dark rock, grass floor, and the
existing rock/asteroid/copper/meteorite edge variants. Disabled terrain types
remain disabled. Oil gets a separate material instead of changing the shared
black mask texture.

## Packaging

Run `node scripts/refresh-sprites.cjs` from the repository root. Manifest entries
map source cells to runtime filenames. `geometry.json` records original canvas
sizes and visible bounds. Original PNG alpha channels and near-black outline
pixels remain authoritative for the 39 terrain edits. Material swatches are
cropped inside their contact-sheet borders; interior rock excludes the swatch
vignette so adjoining ground does not acquire a panel border. Both legacy packed atlases
are updated by replacing the complete frame pixels, including transparent holes.
The original 175 assets are copied without image processing.

Water, lava and oil also get mirrored 64px repeating materials, packed twice
into a 128px sheet to support crops across the repeat boundary. The client
samples these in world space through shared frame crops on ordinary sprites, retaining the original 48px
under-shore overlap (32px at world edges) without independently rotating each
tile. Lighting, fog, bubbles, trails, stats and terrain behavior are unchanged.

`test/world/sprite_assets.test.js` verifies 214 canvases and alpha masks, original
175-file byte identity, and both atlas mappings. `liquid_surface.test.js` checks
neighbor sampling and repeating boundaries. `test/e2e/terrain_materials.spec.js`
checks actual liquid instances and GPU sampling in a real sandbox colony.
