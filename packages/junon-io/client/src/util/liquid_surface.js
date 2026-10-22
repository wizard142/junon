const TILE_SIZE = 32
const positiveModulo = (value, period) => ((value % period) + period) % period

// Retain the original under-shore overlap, but sample a single world-aligned
// material field so overlapping sprites show identical pixels.
function getLiquidSurfaceLayout(x, y, rows, cols, period = 64) {
  const row = Math.floor(y / TILE_SIZE), col = Math.floor(x / TILE_SIZE)
  const edge = row === 0 || col === 0 || row === rows - 1 || col === cols - 1
  const size = edge ? TILE_SIZE : 48
  return {
    width: size,
    height: size,
    frameX: positiveModulo(x - size / 2, period),
    frameY: positiveModulo(y - size / 2, period)
  }
}

module.exports = { getLiquidSurfaceLayout }
