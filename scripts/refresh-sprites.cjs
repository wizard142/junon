// Package restrained refinements through the original Junon silhouettes.
// Original alpha masks and dark outline pixels are authoritative.
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const root = path.resolve(__dirname, '..')
const art = path.join(root, 'art/sprite-refresh')
const imageRoot = path.join(root, 'packages/junon-io/client/assets/images')
const manifest = require(path.join(art, 'manifest.json'))

async function alphaBounds(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let left = info.width, top = info.height, right = -1, bottom = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > 24) {
        left = Math.min(left, x); top = Math.min(top, y)
        right = Math.max(right, x); bottom = Math.max(bottom, y)
      }
    }
  }
  if (right < 0) throw new Error('Empty source sprite')
  return { left, top, width: right - left + 1, height: bottom - top + 1 }
}

async function main() {
  const replacements = new Map()
  const geometryPath = path.join(art, 'geometry.json')
  const geometry = fs.existsSync(geometryPath) ? JSON.parse(fs.readFileSync(geometryPath)) : {}
  for (const batch of manifest) {
    if (batch.preserveOriginal) {
      for (const name of batch.files) {
        const png = fs.readFileSync(path.join(art, 'originals', name))
        fs.writeFileSync(path.join(imageRoot, name), png)
        replacements.set(name, png)
      }
      continue
    }
    const sheet = path.join(art, batch.name + '.png')
    const meta = await sharp(sheet).metadata()
    const columns = batch.columns || 8, rows = batch.rows || 8
    const cellWidth = meta.width / columns, cellHeight = meta.height / rows
    for (let index = 0; index < batch.files.length; index++) {
      const name = batch.files[index]
      const dest = path.join(imageRoot, name)
      if (!geometry[name]) {
        const original = await sharp(dest).metadata()
        geometry[name] = { width: original.width, height: original.height, bounds: await alphaBounds(dest) }
      }
      // The reviewed sheets have no labels. Each entire cell is its own sprite.
      const left = Math.round((index % columns) * cellWidth), top = Math.round(Math.floor(index / columns) * cellHeight)
      const width = Math.round(((index % columns) + 1) * cellWidth) - left
      const height = Math.round((Math.floor(index / columns) + 1) * cellHeight) - top
      const region = batch.crops ? batch.crops[index] : { left, top, width, height }
      const crop = await sharp(sheet).extract(region).png().toBuffer()
      let bounds = await alphaBounds(crop)
      if (['water.png', 'lava.png', 'oil.png', 'ice.png', 'rock_4.png'].includes(name)) {
        // Material swatches use their interior, without the contact-sheet edge.
        // Interior rock has no shoreline; exclude the generated swatch vignette.
        const inset = Math.max(1, Math.round(Math.min(bounds.width, bounds.height) * (name === 'rock_4.png' ? 0.12 : 0.035)))
        bounds = { left: bounds.left + inset, top: bounds.top + inset, width: bounds.width - inset * 2, height: bounds.height - inset * 2 }
      }
      const target = geometry[name]
      const glyph = await sharp(crop).extract(bounds).resize(target.bounds.width, target.bounds.height, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer()
      const placed = await sharp({ create: { width: target.width, height: target.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: glyph, left: target.bounds.left, top: target.bounds.top }]).png().toBuffer()
      const original = await sharp(path.join(art, 'originals', name)).ensureAlpha().raw().toBuffer()
      const data = await sharp(placed).ensureAlpha().raw().toBuffer()
      for (let i = 0; i < data.length; i += 4) {
        const isOutline = name !== 'oil.png' && Math.max(original[i], original[i + 1], original[i + 2]) < 24
        if (isOutline || data[i + 3] < 64) {
          data[i] = original[i]; data[i + 1] = original[i + 1]; data[i + 2] = original[i + 2]
        }
        data[i + 3] = original[i + 3]
      }
      const png = await sharp(data, { raw: { width: target.width, height: target.height, channels: 4 } }).png().toBuffer()
      await fs.promises.writeFile(dest, png)
      replacements.set(name, png)
    }
  }
  // Mirrored 2x2 material sheets meet with identical boundary pixels. This is
  // texture packing, not a brightness pass; retain the generated material colors.
  for (const name of ['water', 'lava', 'oil']) {
    const png = replacements.get(name + '.png')
    const m = await sharp(png).metadata()
    const mirroredX = await sharp(png).flop().png().toBuffer()
    const mirroredY = await sharp(png).flip().png().toBuffer()
    const mirroredXY = await sharp(png).flop().flip().png().toBuffer()
    const repeat = await sharp({ create: { width: m.width * 2, height: m.height * 2, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: png, left: 0, top: 0 }, { input: mirroredX, left: m.width, top: 0 }, { input: mirroredY, left: 0, top: m.height }, { input: mirroredXY, left: m.width, top: m.height }])
      .png().toBuffer()
    // A doubled repeat permits contiguous 48px frame crops across the wrap.
    await sharp({ create: { width: 128, height: 128, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: repeat, left: 0, top: 0 }, { input: repeat, left: 64, top: 0 }, { input: repeat, left: 0, top: 64 }, { input: repeat, left: 64, top: 64 }])
      .png().toFile(path.join(imageRoot, name + '_surface.png'))
  }
  fs.writeFileSync(geometryPath, JSON.stringify(geometry, null, 2) + '\n')
  for (const atlasName of ['atlas-1111', 'atlas-2222']) {
    const json = require(path.join(imageRoot, 'background', atlasName + '.json'))
    const dest = path.join(imageRoot, 'background', atlasName + '.png')
    const { data, info } = await sharp(dest).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    let count = 0
    for (const [name, png] of replacements) {
      const entry = json.frames[name]
      if (!entry) continue
      if (entry.rotated) throw new Error('Unsupported rotated atlas frame: ' + name)
      const frame = entry.frame
      // SOURCE replacement must fully replace alpha, including transparent holes.
      const source = entry.spriteSourceSize
      const full = await sharp(png).resize(entry.sourceSize.w, entry.sourceSize.h, { fit: 'fill' }).png().toBuffer()
      const input = await sharp(full).extract({ left: source.x, top: source.y, width: source.w, height: source.h })
        .resize(frame.w, frame.h, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
      for (let row = 0; row < frame.h; row++) {
        input.copy(data, ((frame.y + row) * info.width + frame.x) * 4, row * frame.w * 4, (row + 1) * frame.w * 4)
      }
      count++
    }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(dest + '.new')
    await fs.promises.rename(dest + '.new', dest)
    console.log(atlasName + ': updated ' + count + ' frames')
  }
  console.log('Updated ' + replacements.size + ' named textures; original canvas and alpha bounds retained.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
