const sharp = require('sharp')
const path = require('path')
const { getLiquidSurfaceLayout } = require('../../client/src/util/liquid_surface')

const modulo = value => ((value % 64) + 64) % 64
function sample(layout, centerX, centerY, worldX, worldY) {
  return [modulo(worldX - (centerX - layout.width / 2) + layout.frameX),
    modulo(worldY - (centerY - layout.height / 2) + layout.frameY)]
}

test('neighboring liquid sprites sample identical material pixels throughout their overlap', () => {
  const first = getLiquidSurfaceLayout(48, 48, 8, 8)
  const right = getLiquidSurfaceLayout(80, 48, 8, 8)
  const down = getLiquidSurfaceLayout(48, 80, 8, 8)
  expect(first.width).toBe(48)
  for (let x = 56; x < 72; x++) for (let y = 24; y < 72; y++) {
    expect(sample(first, 48, 48, x, y)).toEqual(sample(right, 80, 48, x, y))
    expect(sample(first, 48, 48, y, x)).toEqual(sample(down, 48, 80, y, x))
  }
})

test('map edges retain the original 32px boundary and align with interior surfaces', () => {
  const edge = getLiquidSurfaceLayout(16, 48, 8, 8)
  const next = getLiquidSurfaceLayout(48, 48, 8, 8)
  expect(edge.width).toBe(32)
  for (let x = 24; x < 32; x++) expect(sample(edge, 16, 48, x, 48)).toEqual(sample(next, 48, 48, x, 48))
})

test.each(['water', 'lava', 'oil'])('%s surface repeats without a boundary-color jump', async name => {
  const file = path.resolve(__dirname, '../../client/assets/images', name + '_surface.png')
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const pixel = (x, y) => data.subarray((y * info.width + x) * 4, (y * info.width + x) * 4 + 4)
  expect(info.width).toBe(128)
  expect(info.height).toBe(128)
  for (let i = 0; i < 64; i++) {
    expect(pixel(0, i).equals(pixel(63, i))).toBe(true)
    expect(pixel(i, 0).equals(pixel(i, 63))).toBe(true)
    expect(pixel(31, i).equals(pixel(32, i))).toBe(true)
    expect(pixel(i, 31).equals(pixel(i, 32))).toBe(true)
  }
})
