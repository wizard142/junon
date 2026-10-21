const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const root = path.resolve(__dirname, '../../../..')
const art = path.join(root, 'art/sprite-refresh')
const imageRoot = path.join(root, 'packages/junon-io/client/assets/images')
const batches = require(path.join(art, 'manifest.json'))
const geometry = require(path.join(art, 'geometry.json'))
const names = [...new Set(batches.flatMap(batch => batch.files))]

test('all 175 refreshed mob/item textures retain their runtime canvas and alpha channel', async () => {
  expect(new Set(names).size).toBe(175)
  for (const name of names) {
    const input = path.join(imageRoot, name)
    const meta = await sharp(input).metadata()
    expect({ name, width: meta.width, height: meta.height, alpha: meta.hasAlpha }).toEqual({
      name, width: geometry[name].width, height: geometry[name].height, alpha: true
    })
    const { data } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let hasPixels = false
    for (let i = 3; i < data.length; i += 4) if (data[i] > 24) { hasPixels = true; break }
    expect({ name, hasPixels }).toEqual({ name, hasPixels: true })
  }
}, 30000)

for (const atlasName of ['atlas-1111', 'atlas-2222']) {
  test(atlasName + ' matches standalone textures, including trimmed frames', async () => {
    const atlas = path.join(imageRoot, 'background', atlasName)
    const frames = JSON.parse(fs.readFileSync(atlas + '.json')).frames
    const atlasPixels = await sharp(atlas + '.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let checked = 0
    for (const name of names) {
      const entry = frames[name]
      if (!entry) continue
      expect(entry.rotated).toBe(false)
      const s = entry.spriteSourceSize, f = entry.frame
      const full = await sharp(path.join(imageRoot, name)).resize(entry.sourceSize.w, entry.sourceSize.h, { fit: 'fill' }).png().toBuffer()
      const expected = await sharp(full).extract({ left: s.x, top: s.y, width: s.w, height: s.h }).resize(f.w, f.h, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
      const actual = await sharp(atlasPixels.data, { raw: { width: atlasPixels.info.width, height: atlasPixels.info.height, channels: 4 } })
        .extract({ left: f.x, top: f.y, width: f.w, height: f.h }).raw().toBuffer()
      expect({ name, matches: actual.equals(expected) }).toEqual({ name, matches: true })
      checked++
    }
    expect(checked).toBe(atlasName === 'atlas-1111' ? 118 : 129)
  }, 30000)
}
