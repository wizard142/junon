// Extract the reviewed, AI-drawn source sheets into the established texture keys.
// This performs packaging only: no tinting or procedural replacement artwork.
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
      // The final independent overhead weapon redraw has reviewed per-subject
      // crops because its wider rifle silhouettes cross the nominal cell edges.
      const region = batch.crops ? batch.crops[index] : { left, top, width, height }
      const crop = await sharp(sheet).extract(region).png().toBuffer()
      const bounds = await alphaBounds(crop)
      const target = geometry[name]
      const glyph = await sharp(crop).extract(bounds).resize(target.bounds.width, target.bounds.height, { fit: 'fill', kernel: 'lanczos3' }).png().toBuffer()
      const png = await sharp({ create: { width: target.width, height: target.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: glyph, left: target.bounds.left, top: target.bounds.top }]).png().toBuffer()
      await fs.promises.writeFile(dest, png)
      replacements.set(name, png)
    }
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
