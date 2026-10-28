import { readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

// Standard responsive AVIF sources; existing WebP files are browser fallbacks.
const root = new URL('../', import.meta.url)
const source = await readFile(new URL('public/images/hero-mercedes-1440.webp', root))
for (const width of [640, 1024, 1440]) {
  const bytes = await sharp(source).resize({ width }).avif({ quality: 50, effort: 6 }).toBuffer()
  await writeFile(new URL(`public/images/hero-photo-${width}.avif`, root), bytes)
  console.log(`${width}px AVIF: ${bytes.length} bytes`)
}

// Mobile art direction: retain the visible 66%-positioned crop without hidden pixels.
const mobile = sharp(source).extract({ left: 396, top: 0, width: 840, height: 810 })
await writeFile(new URL('public/images/hero-photo-mobile.avif', root), await mobile.clone().avif({ quality: 50, effort: 6 }).toBuffer())
await writeFile(new URL('public/images/hero-photo-mobile.webp', root), await mobile.clone().webp({ quality: 82, effort: 6 }).toBuffer())
