const { test, expect } = require('@playwright/test')
test.setTimeout(120_000)
const { createNewColonyAndJoin } = require('./support/join')
const fs = require('fs')
const path = require('path')

for (const mode of ['peaceful', 'survival', 'hardcore']) {
  test('new local colony automatically offers and applies ' + mode, async ({ page }, testInfo) => {
    // The existing stress flag avoids disconnecting another anonymous player
    // on the same local IP when this spec runs against a live developer server.
    await createNewColonyAndJoin(page, { path: '/?stress=1', keepModePicker: true })
    const picker = page.locator('#select_difficulty_menu')
    await expect(picker).toBeVisible()
    await expect(picker.locator('.game_mode')).toHaveCount(3)
    await expect(picker.locator('.game_mode[data-mode="survival"]')).toHaveClass(/selected/)
    if (process.env.JUNON_UI_SCREENSHOT_DIR && mode === 'peaceful') {
      fs.mkdirSync(process.env.JUNON_UI_SCREENSHOT_DIR, { recursive: true })
      await page.screenshot({ path: path.join(process.env.JUNON_UI_SCREENSHOT_DIR, 'restored-game-modes.png') })
    }
    await picker.locator('.game_mode[data-mode="' + mode + '"]').click()
    await picker.locator('.accept_game_mode_btn').click()
    await expect.poll(() => page.evaluate(() => window.game.sector.gameMode)).toBe(mode)
    await expect(picker).toBeHidden()
  })
}
