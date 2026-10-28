import { readFile, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import sharp from 'sharp'

// One complete photo, with a tiny inline fallback if its request stalls.
const htmlPath = new URL('../public/home-static.html', import.meta.url)
const source = new URL('../public/images/hero-mercedes-1440.webp', import.meta.url)
const sourceBytes = await readFile(source)
const preview = await sharp(sourceBytes)
  .resize({ width: 160 })
  .webp({ quality: 20, effort: 6 })
  .toBuffer()
const poster = await sharp(sourceBytes).resize({ width: 640 }).webp({ quality: 25, effort: 6 }).toBuffer()
const posterPath = '/images/hero-preview-640.webp?v=20261027-2'
const style = `<style data-hero-preview>.hero-canvas{display:block;background-image:url("${posterPath}"),url("data:image/webp;base64,${preview.toString('base64')}");background-size:100% 100%;background-repeat:no-repeat}</style>`
const original = await readFile(htmlPath, 'utf8')
const marker = /<style data-hero-preview>[\s\S]*?<\/style>/
let html = marker.test(original)
  ? original.replace(marker, style)
  : original.replace('</head>', `${style}\n</head>`)
html = html.replace(/(<div class="hero-mosaic" aria-hidden="true"><div class="hero-canvas">)[\s\S]*?(<\/div><\/div>\s*<div class="hero-copy">)/, '$1$2')
html = html.replace('display:grid;grid-template-rows:repeat(18,1fr)', 'display:block')
html = html.replace(/\.hero-tile,\.hero-tile img\{[^}]*\}\.hero-tile\{[^}]*\}\.hero-tile img\{[^}]*\}/, '')
if (!html.includes(`rel="preload" as="image" href="${posterPath}"`)) {
  html = html.replace('</head>', `<link rel="preload" as="image" href="${posterPath}" fetchpriority="high">\n</head>`)
}
if (html === original && !marker.test(original)) throw new Error('Missing HTML head')
if (preview.length > 2_000 || poster.length >= 15_000 || gzipSync(html).length >= 14_500) {
  throw new Error('Preview exceeds the budget reserved for HTML and analytics')
}
await writeFile(new URL('../public/images/hero-preview-640.webp', import.meta.url), poster)
await writeFile(htmlPath, html)
console.log(`Inline preview: ${preview.length} bytes; full poster: ${poster.length} bytes; HTML gzip: ${gzipSync(html).length} bytes.`)
