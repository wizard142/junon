// Grade only static world art before the existing lighting/fog pass. The black
// point and alpha stay unchanged, retaining pixel outlines and transparent edges.
const createEnvironmentLayer = (game, name) => {
  const layer = new PIXI.Container()
  layer.name = name
  if (!game.isCanvasMode()) {
    const grade = new PIXI.filters.ColorMatrixFilter()
    grade.brightness(1.42, false)
    grade.saturate(0.24, true)
    layer.filters = [grade]
  }
  return layer
}

module.exports = { createEnvironmentLayer }
