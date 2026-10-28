import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import sharp from 'sharp'

// The complete photograph travels with HTML; no image request can stall the hero.
const htmlPath = new URL('../public/home-static.html', import.meta.url)
const source = new URL('../public/images/hero-mercedes-1440.webp', import.meta.url)
const photo = await sharp(await readFile(source))
  .resize({ width: 320 })
  .avif({ quality: 12, effort: 5 })
  .toBuffer()
const style = `<style data-hero-preview>.hero-canvas{display:block;background-image:url("data:image/avif;base64,${photo.toString('base64')}");background-size:100% 100%;background-repeat:no-repeat}</style>`
const original = await readFile(htmlPath, 'utf8')
if (!/<style data-hero-preview>[\s\S]*?<\/style>/.test(original)) throw new Error('Missing hero style')
const html = original
  .replace(/<style data-hero-preview>[\s\S]*?<\/style>/, style)
  .replace(/<link rel="preload" as="image" href="\/images\/hero-preview-[^>]*>\s*/, '')
if (photo.length > 2_000 || gzipSync(html).length >= 14_700) {
  throw new Error('Embedded photograph exceeds the HTML budget')
}
await writeFile(htmlPath, html)
console.log(`Complete inline photo: ${photo.length} bytes; HTML gzip: ${gzipSync(html).length} bytes; hero requests: zero.`)
