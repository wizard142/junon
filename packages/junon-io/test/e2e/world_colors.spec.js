const { test, expect } = require('@playwright/test')
const path = require('path')
const fs = require('fs')
const sharp = require('sharp')
const { createNewColonyAndJoin } = require('./support/join')
const { evaluateInServer } = require('./support/server_console')

function output(name, testInfo) {
  const directory = process.env.JUNON_UI_SCREENSHOT_DIR
  if (directory) fs.mkdirSync(directory, { recursive: true })
  return directory ? path.join(directory, name + '.png') : testInfo.outputPath(name + '.png')
}

test('environment is brighter while creatures and visibility stay outside the grade', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await createNewColonyAndJoin(page)
  const sectorId = await page.evaluate(() => window.game.sector.uid)
  // Build a disposable, real colony scene with representative ground, floors,
  // and machines. No production/debug endpoints or creature changes.
  const fixture = await evaluateInServer(({ sectorId }) => {
    const sector = global.server.getGame(sectorId).sector
    const player = sector.getFirstPlayer()
    for (let row = 57; row <= 70; row++) {
      for (let col = 56; col <= 74; col++) {
        sector.removeStructures(row, col)
        const ground = sector.groundMap.get(row, col)
        if (ground) ground.remove({ removeAll: true })
        sector.createTerrain('Rock', row, col)
        if (row >= 60 && row <= 67 && col >= 59 && col <= 71) {
          sector.placeBuilding({ type: 'Floor', x: col * 32 + 16, y: row * 32 + 16, owner: player.getBuildOwner(), placer: player })
        }
      }
    }
    const placed = []
    for (const [type, row, col] of [['Bed', 61, 60], ['SteelCrate', 61, 64], ['Furnace', 61, 68], ['OxygenGenerator', 65, 60], ['SolarPanel', 65, 64], ['Lamp', 65, 68]]) {
      const building = sector.placeBuilding({ type, x: col * 32 + 16, y: row * 32 + 16, owner: player.getBuildOwner(), placer: player })
      if (building) placed.push(type)
    }
    player.repositionTo(65 * 32 + 16, 64 * 32 + 16)
    return { placed }
  }, { sectorId })
  expect(fixture.placed.length).toBeGreaterThan(3)
  await page.waitForFunction(() => Math.abs(window.player.getX() - (65 * 32 + 16)) < 5)
  await expect.poll(() => page.evaluate(() => Object.values(window.game.sector.buildings).filter(b => b.getTypeName() === 'Floor').length)).toBeGreaterThan(80)
  const layers = await page.evaluate(() => {
    const sector = window.game.sector
    const graded = [sector.environmentGroundLayer, sector.environmentStructureLayer, sector.environmentCeilingLayer]
    const excluded = ['mobs', 'players', 'units', 'corpses', 'pickups', 'projectiles']
    return {
      webgl: !window.game.isCanvasMode(),
      gradeCount: graded.filter(layer => layer.filters && layer.filters.length).length,
      ungradedMovables: excluded.every(group => sector.spriteLayers[group].parent === sector.sprite && !sector.spriteLayers[group].filters),
      lightingAfterEnvironment: sector.sprite.getChildIndex(sector.lightMapContainer) > sector.sprite.getChildIndex(sector.environmentCeilingLayer),
      fogOutsideGrade: sector.fovMapSprite.parent === sector.sprite
    }
  })
  expect(layers).toEqual({ webgl: true, gradeCount: 3, ungradedMovables: true, lightingAfterEnvironment: true, fogOutsideGrade: true })
  await page.evaluate(() => {
    const s = window.game.sector
    window.worldGrades = [s.environmentGroundLayer, s.environmentStructureLayer, s.environmentCeilingLayer].map(layer => ({ layer, filters: layer.filters }))
    window.worldGrades.forEach(({ layer }) => { layer.filters = null })
  })
  const before = await page.screenshot({ path: output('world-before', testInfo) })
  await page.evaluate(() => window.worldGrades.forEach(({ layer, filters }) => { layer.filters = filters }))
  const after = await page.screenshot({ path: output('world-brighter', testInfo) })
  const mean = async buffer => {
    const stats = await sharp(buffer).stats()
    return stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3
  }
  expect(await mean(after)).toBeGreaterThan(await mean(before) + 0.5)
  await page.keyboard.press('Escape')
  await page.locator('.exit_game_menu_btn').click()
  await expect(page.locator('.default_play_btn')).toBeVisible()
  await expect(page.locator('.station_home_intro')).toHaveCount(0)
  await page.screenshot({ path: output('home-without-intro', testInfo) })
})
