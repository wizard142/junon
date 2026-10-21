const { test, expect } = require('@playwright/test')
const fs = require('fs')
const path = require('path')
const { createNewColonyAndJoin } = require('./support/join')
const { readInitialEscapePod } = require('./support/scenario')
const { hoverWorld } = require('./support/screen')

// Optional screenshots stay outside source control, like the other e2e artifacts.
async function capture(page, name, testInfo) {
  const directory = process.env.JUNON_UI_SCREENSHOT_DIR
  if (directory) fs.mkdirSync(directory, { recursive: true })
  await page.screenshot({ path: directory ? path.join(directory, name + '.png') : testInfo.outputPath(name + '.png') })
}

async function expectContained(page, selector, vertically = true) {
  const box = await page.locator(selector).boundingBox()
  const size = page.viewportSize()
  expect(box).toBeTruthy()
  expect(box.x).toBeGreaterThanOrEqual(0)
  if (vertically) expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.x + box.width).toBeLessThanOrEqual(size.width + 1)
  if (vertically) expect(box.y + box.height).toBeLessThanOrEqual(size.height + 1)
}

test('home navigation, settings and compact entry screen remain usable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.locator('.default_play_btn')).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.locator('.mine_colonies_tab').click()
  await expect(page.locator('.colony_empty_state')).toBeVisible()
  await capture(page, 'overhaul-home', testInfo)
  await page.locator('.home_user_action_container .settings_menu_btn').focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('.settings_container')).toBeVisible()
  const slider = page.locator('.effects_volume_slider')
  const before = await slider.inputValue()
  await slider.focus()
  await slider.press(before === '10' ? 'ArrowLeft' : 'ArrowRight')
  expect(await slider.inputValue()).not.toBe(before)
  await capture(page, 'overhaul-settings', testInfo)
  await page.locator('.back_main_menu_btn').click()
  await expect(page.locator('.default_play_btn')).toBeVisible()
  await page.locator('.list_mode_btn').click()
  await expect(page.locator('.main_colony_list')).toHaveClass(/list_mode/)
  await page.locator('.gallery_mode_btn').click()
  await expect(page.locator('.main_colony_list')).not.toHaveClass(/list_mode/)
  await page.locator('.default_play_btn').click()
  await expect(page.locator('.new_game_container')).toBeVisible()
  await expect(page.locator('.row_count_select')).toHaveValue('128')
  await capture(page, 'overhaul-new-colony', testInfo)
  await page.locator('.back_main_menu_btn').click()
  for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size)
    await expectContained(page, '.middle_container', false)
    await page.locator('.default_play_btn').scrollIntoViewIfNeeded()
    await capture(page, 'overhaul-home-' + size.width, testInfo)
  }
})

test('new colony, storage, game mode and pause panels retain their actions', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await createNewColonyAndJoin(page)
  await capture(page, 'overhaul-hud', testInfo)
  const pod = await readInitialEscapePod(page)
  expect(pod.error).toBeUndefined()
  await hoverWorld(page, pod.x, pod.y)
  await page.waitForFunction(id => window.game.getHighlightedEntity()?.id === id, pod.id)
  await page.keyboard.press('KeyE')
  await expect(page.locator('#storage_menu')).toBeVisible()
  await capture(page, 'overhaul-storage', testInfo)
  for (const size of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size)
    await expectContained(page, '#storage_menu')
  }
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.locator('#storage_menu .cancel_btn').click()
  await expect(page.locator('#storage_menu')).toBeHidden()
  // The join helper dismisses the automatic chooser for gameplay scenarios;
  // reopen it here to check the layout and selection styling.
  await page.evaluate(() => window.game.selectDifficultyMenu.open())
  await page.locator('.game_mode[data-mode="hardcore"]').click()
  await expect(page.locator('.game_mode[data-mode="hardcore"]')).toHaveClass(/selected/)
  await capture(page, 'overhaul-game-modes', testInfo)
  await page.locator('#select_difficulty_menu .cancel_btn').click()
  await page.keyboard.press('Escape')
  await expect(page.locator('.resume_menu_btn')).toBeVisible()
  await capture(page, 'overhaul-pause', testInfo)
  await page.locator('.resume_menu_btn').click()
  await expect(page.locator('.resume_menu_btn')).toBeHidden()
})
