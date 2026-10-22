const { test, expect } = require('@playwright/test')
const { createNewColonyAndJoin } = require('./support/join')
const fs = require('fs')
const path = require('path')

test.setTimeout(180_000)
async function command(page, text) {
  if (!(await page.evaluate(() => window.game.chatMenu.isOpenAndFocused()))) await page.keyboard.press('Enter')
  await page.locator('#chat_input').fill(text)
  await page.keyboard.press('Enter')
}


test('original coast shapes and continuous water/lava/oil textures render in a real colony', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await createNewColonyAndJoin(page, { path: '/?stress=1&row=128&col=128', keepModePicker: true })
  await page.locator('#select_difficulty_menu .game_mode[data-mode="peaceful"]').click()
  await page.locator('#select_difficulty_menu .accept_game_mode_btn').click()
  await expect.poll(() => page.evaluate(() => window.game.sector.gameMode)).toBe('peaceful')
  await command(page, '/tp 71 71')
  await page.waitForFunction(() => Math.abs(window.player.getX() - 71 * 32) < 5, null, { timeout: 15000 })
  // Keep the fixture in one streamed chunk; teleporting across its boundary
  // need not populate tiles in the previously invisible neighboring chunk.
  await command(page, '/fill 64 64 78 78 Rock')
  await command(page, '/fill 66 65 69 68 Water')
  await command(page, '/fill 72 65 75 68 Lava')
  await command(page, '/fill 66 73 69 76 Oil')
  await command(page, '/fill 73 73 75 75 CopperAsteroid')
  await command(page, '/fill 76 76 77 77 MeteoriteAsteroid')
  await expect.poll(() => page.evaluate(() => [[67, 66], [73, 66], [67, 74]].map(([row, col]) => {
    const tile = window.game.sector.undergroundMap.get(row, col)
    return tile ? tile.getTypeName() : null
  })), { timeout: 15000 }).toEqual(['Water', 'Lava', 'Oil'])
  const surfaces = await page.evaluate(() => {
    const sector = window.game.sector
    return [[67, 66], [73, 66], [67, 74]].map(([row, col]) => {
      const tile = sector.undergroundMap.get(row, col)
      return tile ? { type: tile.getTypeName(), batched: tile.sprite instanceof PIXI.Sprite && !(tile.sprite instanceof PIXI.extras.TilingSprite),
        rotation: tile.sprite.rotation, width: tile.sprite.width, textureWidth: tile.sprite.texture.width } : null
    })
  })
  expect(surfaces).toEqual([
    { type: 'Water', batched: true, rotation: 0, width: 48, textureWidth: 48 },
    { type: 'Lava', batched: true, rotation: 0, width: 48, textureWidth: 48 },
    { type: 'Oil', batched: true, rotation: 0, width: 48, textureWidth: 48 }
  ])
  if (await page.evaluate(() => window.game.chatMenu.isOpen())) await page.keyboard.press('Escape')
  // Validate actual GPU sampling, including anchor handling, not only UV math.
  const render = await page.evaluate(() => {
    const renderer = window.game.app.renderer
    const texture = PIXI.utils.TextureCache['water_surface.png']
    const make = (width, x, anchor) => {
      const left = x - width * anchor
      const frame = new PIXI.Rectangle(((left % 64) + 64) % 64, 24, width, 48)
      const sprite = new PIXI.Sprite(new PIXI.Texture(texture.baseTexture, frame))
      sprite.anchor.set(anchor, anchor)
      sprite.position.set(x, anchor ? 48 : 24)
      return sprite
    }
    const a = new PIXI.Container(), b = new PIXI.Container()
    a.addChild(make(80, 24, 0))
    b.addChild(make(48, 48, 0.5)); b.addChild(make(48, 80, 0.5))
    const first = PIXI.RenderTexture.create(128, 96), second = PIXI.RenderTexture.create(128, 96)
    renderer.render(a, first, true); renderer.render(b, second, true)
    const p = renderer.plugins.extract.pixels(first), q = renderer.plugins.extract.pixels(second)
    let maximumDifference = 0
    for (let y = 26; y < 70; y++) for (let x = 26; x < 102; x++) for (let c = 0; c < 4; c++) {
      const i = (y * 128 + x) * 4 + c
      maximumDifference = Math.max(maximumDifference, Math.abs(p[i] - q[i]))
    }
    a.destroy({ children: true }); b.destroy({ children: true }); first.destroy(true); second.destroy(true)
    return { maximumDifference }
  })
  expect(render.maximumDifference).toBeLessThanOrEqual(2)
  const directory = process.env.JUNON_UI_SCREENSHOT_DIR
  if (directory) fs.mkdirSync(directory, { recursive: true })
  await page.screenshot({ path: directory ? path.join(directory, 'junon-terrain-polish.png') : testInfo.outputPath('junon-terrain-polish.png') })
})
