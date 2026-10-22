const { test, expect } = require('@playwright/test')
test.setTimeout(120_000)
const { createNewColonyAndJoin } = require('./support/join')
const { hoverWorld } = require('./support/screen')
const fs = require('fs')
const path = require('path')

async function command(page, text) {
  if (!(await page.evaluate(() => window.game.chatMenu.isOpenAndFocused()))) await page.keyboard.press('Enter')
  await page.locator('#chat_input').fill(text)
  await page.keyboard.press('Enter')
}

test('refreshed creatures and overhead weapon render, equip and turn through real gameplay', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await createNewColonyAndJoin(page, { path: '/?stress=1', keepModePicker: true })
  await page.locator('#select_difficulty_menu .game_mode[data-mode="peaceful"]').click()
  await page.locator('#select_difficulty_menu .accept_game_mode_btn').click()
  await expect.poll(() => page.evaluate(() => window.game.sector.gameMode)).toBe('peaceful')
  const name = await page.evaluate(() => window.player.getName())
  await command(page, '/setequipment hand ' + name + ' AssaultRifle')
  await expect.poll(() => page.evaluate(() => window.player.getHandEquipment()?.getTypeName())).toBe('Assault Rifle')
  const tile = await page.evaluate(() => ({ row: Math.floor(window.player.getY() / 32), col: Math.floor(window.player.getX() / 32) }))
  // Explicit ground coordinates avoid random placement into space at the edge
  // of the starting asteroid. Keep the fixture creatures from fighting each other.
  for (const type of ['Slime', 'Spider', 'Golem']) {
    await command(page, '/spawnmob ' + type + ' 1 ' + tile.row + ' ' + tile.col + ' status:neutral attackables:players')
    await expect.poll(() => page.evaluate(() => Object.values(window.game.sector.mobs).map(m => m.getTypeName()))).toContain(type)
  }
  await expect.poll(() => page.evaluate(() => Object.values(window.game.sector.mobs).map(m => m.getTypeName()))).toEqual(expect.arrayContaining(['Slime', 'Spider', 'Golem']))
  if (await page.evaluate(() => window.game.chatMenu.isOpen())) await page.keyboard.press('Escape')
  const position = await page.evaluate(() => ({ x: window.player.getX(), y: window.player.getY() }))
  await hoverWorld(page, position.x + 150, position.y)
  const first = await page.evaluate(() => window.player.characterSprite.rotation)
  await hoverWorld(page, position.x, position.y + 150)
  await expect.poll(() => page.evaluate(() => window.player.characterSprite.rotation)).not.toBe(first)
  const texture = await page.evaluate(() => {
    const equipment = window.player.getHandEquipment()
    return { valid: equipment.sprite.texture.baseTexture.hasLoaded, width: equipment.sprite.texture.width, height: equipment.sprite.texture.height }
  })
  expect(texture.valid).toBe(true)
  expect(texture.width).toBeGreaterThan(0)
  expect(texture.height).toBeGreaterThan(0)
  const directory = process.env.JUNON_UI_SCREENSHOT_DIR
  if (directory) fs.mkdirSync(directory, { recursive: true })
  await page.screenshot({ path: directory ? path.join(directory, 'refreshed-sprites-in-game.png') : testInfo.outputPath('refreshed-sprites-in-game.png') })
})
