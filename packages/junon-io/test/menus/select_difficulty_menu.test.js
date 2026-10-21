jest.mock('../../client/src/menus/base_menu', () => class {})
jest.mock('../../client/src/util/socket_util', () => ({ emit: jest.fn() }))
const SelectDifficultyMenu = require('../../client/src/menus/select_difficulty_menu')
const SocketUtil = require('../../client/src/util/socket_util')

function fixture({ createdAt = 0, owner = true, tutorial = false, player = true } = {}) {
  const menu = new SelectDifficultyMenu()
  menu.game = { sector: { createdAt, isTutorial: () => tutorial }, player: player ? { isSectorOwner: () => owner } : null }
  const selected = { dataset: { mode: 'survival' }, classList: { add: jest.fn(), remove: jest.fn() } }
  menu.el = { querySelector: () => selected }
  menu.open = jest.fn()
  return { menu, selected }
}

test.each([0, undefined, Date.now() / 1000])('new local/current worlds offer modes with timestamp %s', createdAt => {
  const { menu, selected } = fixture({ createdAt })
  menu.showGameMode(null)
  expect(menu.open).toHaveBeenCalledTimes(1)
  expect(selected.classList.add).toHaveBeenCalledWith('selected')
})
test.each([{ createdAt: 1 }, { owner: false }, { player: false }, { tutorial: true }])('does not offer an inapplicable mode choice: %j', options => {
  const { menu } = fixture(options)
  menu.showGameMode(null)
  expect(menu.open).not.toHaveBeenCalled()
})
test('an assigned game mode stays assigned', () => {
  const { menu } = fixture()
  menu.showGameMode('hardcore')
  expect(menu.open).not.toHaveBeenCalled()
})
test.each(['peaceful', 'survival', 'hardcore'])('accept sends the existing %s action', mode => {
  const { menu, selected } = fixture()
  selected.dataset.mode = mode
  menu.onAcceptGameModeBtnClick()
  expect(SocketUtil.emit).toHaveBeenLastCalledWith('SectorAction', { action: mode + 'Mode' })
})
