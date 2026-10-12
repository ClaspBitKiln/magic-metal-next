import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const rows = 18
const variants = [
  { name: '640', width: 640, height: 360 },
  { name: '1024', width: 1024, height: 576 },
  { name: '1440', width: 1440, height: 810 },
]

const outputRoot = path.resolve('public/images/hero-tiles')
await rm(outputRoot, { recursive: true, force: true })

for (const variant of variants) {
  const source = path.resolve(`public/images/hero-mercedes-${variant.name}.webp`)
  const outputDir = path.join(outputRoot, variant.name)
  const rowHeight = variant.height / rows

  if (!Number.isInteger(rowHeight)) {
    throw new Error(`${variant.name}: height ${variant.height} is not divisible by ${rows}`)
  }

  await mkdir(outputDir, { recursive: true })
  for (let index = 0; index < rows; index += 1) {
    const output = path.join(outputDir, `${String(index + 1).padStart(2, '0')}.webp`)
    await sharp(source)
      .extract({ left: 0, top: index * rowHeight, width: variant.width, height: rowHeight })
      .webp({ quality: 82, effort: 6 })
      .toFile(output)

    const { size } = await stat(output)
    if (size >= 15_000) {
      throw new Error(`${path.relative(process.cwd(), output)} is ${size} bytes; expected less than 15000`)
    }
  }
}

console.log(`Generated ${variants.length * rows} hero tiles; every response is below 15 KB.`)
