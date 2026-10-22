# Outcome

Replace the rejected redesign with Junon's original mob/item art, and improve
lava, water, oil and terrain materials while preserving
the dark style, original shapes, shoreline masks and gameplay.

## Context

920fb79 introduced replacement designs the user rejected. ceed23e contains the
original game art and already-fixed world creation/dark rendering. Keep mode
selection and all gameplay fixes. Source sprite canvases and alpha masks remain
authoritative; no new silhouettes, weapon families or creature features.

## Progress

- [x] 2026-10-22: Restore original source art and inventory active terrain textures.
- [x] 2026-10-22: Compare constrained retouches; retain the cleaner original 175 mob/item PNGs byte for byte.
- [x] 2026-10-22: Integrate 39 understated terrain materials and continuous liquid sampling through batched sprite crops.
- [x] 2026-10-22: Validate original art, terrain masks, both atlases, GPU continuity, dark-world creation and final production build.

## Implementation

Store original reference PNGs and the terrain source sheet. Copy original
portable art unchanged. Package generated color art through original alpha masks
and preserve the original dark outlines. Update
both packed atlases. Retain tile edge variants and UV/world-space continuity for
liquid overlap; preserve the 48px under-shore coverage, bubbles and game rules.

## Validation

Exact original alpha-mask checks, packed/standalone consistency, liquid neighbor
sampling tests, real lava/water/ore scene and the existing dark-world/mode checks,
plus client build. Review matched original/refined asset and world images.

Executed commands:

- `npm exec --workspace packages/junon-io -- jest test/world/sprite_assets.test.js test/world/liquid_surface.test.js test/menus/select_difficulty_menu.test.js --runInBand`: 20 checks pass.
- `npm exec --workspace packages/junon-io -- playwright test --config ../../../debug/playwright-live.config.cjs terrain_materials.spec.js world_colors.spec.js --timeout=180000`: both real-browser scenarios pass. The external live config reuses the running local stack, disables global setup and trace/video capture, and leaves repository test configuration unchanged.
- `npm run client:build`: production build passes; existing missing-translation warnings remain.
- Decoded atlas comparison against HEAD: no pixel changes outside the 214 managed texture frames.


## Decisions

- Visual comparison rejected generated portable retouches; original art is cleaner.
- No new gear silhouettes, colored lights, face designs or creature plating.
- No global brightness or saturation filters. Terrain work is local material art.

## Discoveries and risks

Underground tiles overlap at 48px while world cells are 32px. Flat fills conceal
that, but textured fluids require world-aligned sampling to avoid visible seams.
Default neighbor-based rotation is also unsuitable for a continuous fluid field.
Per-tile TilingSprite was replaced with shared ordinary Sprite crop textures to
retain batching. The 64px repeat is duplicated into a 128px sheet so a 48px crop
can straddle the repeat boundary without wrapping geometry.
The real-colony fixture keeps materials inside one streamed chunk; teleporting
across a chunk edge does not guarantee adjacent unseen chunks are loaded.

## Result

Original 175 mob/item designs restored; 39 terrain materials refined with original
silhouettes, dark outlines and lighting. Shared liquid crops preserve continuity
and batching. All 20 focused checks, both live-browser scenarios and final
production build pass. Final interior-rock material crop was rechecked with the
terrain browser scenario (50.8s) and all focused checks; the final build completed
in 1.28 minutes. Existing missing-translation warnings remain. No game rules,
protocols, stats, enabled terrain types or mode-picker behavior changed.
