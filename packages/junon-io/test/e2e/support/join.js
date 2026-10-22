// Drives the real main-menu UI through the real matchmaker -> game-server
// handshake (client/src/main.js: .default_play_btn -> .new_colony_menu_btn ->
// requestNewColonyFromMatchmaker()), the same path a human player takes.
async function createNewColonyAndJoin(page, options = {}) {
  // client checks Cookies.get('tutorial_done') and otherwise shows a
  // "play tutorial?" confirm dialog before creating the colony
  await page.context().addCookies([
    { name: 'tutorial_done', value: 'true', url: 'http://localhost:8001' }
  ])

  await page.goto(options.path || '/')
  await page.click('.default_play_btn')
  await page.click('.new_colony_menu_btn')

  // client/src/entities/game.js sets window.player only once JoinGame is
  // handled, i.e. once the real join handshake has fully completed
  await page.waitForFunction(() => !!window.player, { timeout: 30_000 })

  // Local worlds now get the real mode picker automatically. Tests which
  // exercise the picker keep it open; other gameplay scenarios dismiss it
  // without assigning a mode, preserving their existing gameplay assumptions.
  if (options.keepModePicker) return
  const modePicker = page.locator('#select_difficulty_menu')
  if (await modePicker.isVisible()) await modePicker.locator('.cancel_btn').click()
  const welcome = page.locator('#welcome_menu')
  if (await welcome.isVisible()) await welcome.locator('.cancel_btn').click()
}

// Picks the colony's game mode through the real "Choose a Game Mode" menu
// (client/src/menus/select_difficulty_menu.js -> SectorAction ->
// server/entities/game.js#setGameMode).
//
// A new colony starts with no game mode at all, and a lot of behaviour hangs
// off it - most chat commands only run in a peaceful/sandbox colony
// (server/commands/base_command.js#canExecute), and crafting in a peaceful
// colony skips the ingredient check for the owner
// (server/entities/inventory.js#isSandboxMode). So a test that cares either way
// has to say so.
//
// Reopen the chooser for scenarios that explicitly change mode after joining.
// The ordinary new-world auto-open path is covered by game_modes.spec.js.
async function selectGameMode(page, gameMode) {
  await page.evaluate(() => window.game.selectDifficultyMenu.open())
  await page.click(`#select_difficulty_menu .game_mode[data-mode='${gameMode}']`)
  await page.click('#select_difficulty_menu .accept_game_mode_btn')

  await page.waitForFunction(
    (mode) => window.game.sector.gameMode === mode,
    gameMode,
    { timeout: 15_000 }
  )

  // the menu closes itself on SectorUpdated (sector.js#onGameModeChanged), but
  // only when the mode actually changed; closing again is harmless and keeps
  // the modal from blocking mouse aiming if it ever doesn't
  await page.evaluate(() => window.game.selectDifficultyMenu.close())
}

module.exports = { createNewColonyAndJoin, selectGameMode }
