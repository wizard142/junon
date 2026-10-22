const FloodFillManager = require('../../common/entities/flood_fill_manager')

describe('rectangular world flood fill', () => {
  test.each([[4, 8], [8, 4]])('visits the entire %i by %i world without crossing its boundaries', (rows, cols) => {
    const manager = new FloodFillManager({})
    manager.setGrids([{
      getRowCount: () => rows,
      getColCount: () => cols,
      get: () => null
    }])
    expect(manager.getCell(rows - 1, cols - 1)).not.toBeNull()
    expect(manager.getCell(0, cols)).toBeNull()
    expect(manager.getCell(rows, 0)).toBeNull()
    const visited = manager.floodFill(rows - 1, cols - 1, { shouldCalculateDistance: true })
    expect(visited).toHaveLength(rows * cols)
  })
})
