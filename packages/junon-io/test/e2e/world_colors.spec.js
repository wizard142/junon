const { test, expect } = require('@playwright/test')
const path = require('path')
const fs = require('fs')

function output(name, testInfo) {
  const directory = process.env.JUNON_UI_SCREENSHOT_DIR
  if (directory) fs.mkdirSync(directory, { recursive: true })
  return directory ? path.join(directory, name + '.png') : testInfo.outputPath(name + '.png')
}

test('custom-sized colony creates and retains original dark world rendering', async ({ page }, testInfo) => {
  await page.context().addCookies([{ name: 'tutorial_done', value: 'true', url: 'http://localhost:8001' }])
  await page.goto('/?stress=1')
  await expect(page.locator('.station_home_intro')).toHaveCount(0)
  await page.click('.default_play_btn')
  await page.selectOption('.row_count_select', '64')
  await page.selectOption('.col_count_select', '96')
  await page.click('.new_colony_menu_btn')
  await page.waitForFunction(() => !!window.player, { timeout: 30_000 })
  const world = await page.evaluate(() => {
    const sector = window.game.sector
    const groups = [].concat(sector.terrainGroups, sector.buildingGroups,
      sector.wallGroups, sector.structureGroups, sector.movableGroups, sector.ceilingGroups)
    return {
      rows: sector.getRowCount(),
      cols: sector.getColCount(),
      tint: sector.gameBoundsSprite.tint,
      originalLayers: groups.every(group => sector.spriteLayers[group].parent === sector.sprite && !sector.spriteLayers[group].filters),
      fog: sector.fovMapSprite.parent === sector.sprite
    }
  })
  expect(world).toEqual({ rows: 64, cols: 96, tint: 0x112944, originalLayers: true, fog: true })
  if (await page.locator('#select_difficulty_menu').isVisible()) await page.click('#select_difficulty_menu .cancel_btn')
  if (await page.locator('#welcome_menu').isVisible()) await page.click('#welcome_menu .cancel_btn')
  await page.screenshot({ path: output('world-dark', testInfo) })
})
