import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createGzip } from 'node:zlib'
import { once } from 'node:events'

const rootUrl = 'https://e-metall.ru/sitemap.xml'
const outputPath = path.join(process.cwd(), 'private/data/e-metall-products.ndjson.gz')
const metadataPath = path.join(process.cwd(), 'private/data/e-metall-metadata.json')
const concurrency = 18

const decodeXml = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'")
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .trim()

const fetchText = async (url, attempt = 1) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60_000)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'user-agent': 'Magic Metal SaaS supplier index/1.0' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return await response.text()
  } catch (error) {
    if (attempt >= 3) throw new Error(`${url}: ${error instanceof Error ? error.message : String(error)}`)
    return fetchText(url, attempt + 1)
  } finally {
    clearTimeout(timer)
  }
}

const root = await fetchText(rootUrl)
const sitemapUrls = [...new Set([...root.matchAll(/https:\/\/e-metall\.ru\/(?:products|products_pipes)_sitemap_\d+\.xml/g)].map((match) => match[0]))]
if (!sitemapUrls.length) throw new Error('Product sitemaps were not found in e-metall sitemap index')

fs.mkdirSync(path.dirname(outputPath), { recursive: true })
const gzip = createGzip({ level: 9 })
const output = fs.createWriteStream(outputPath)
gzip.pipe(output)

let cursor = 0
let recordCount = 0
let completed = 0
const failures = []
const seenKeys = new Set()

const processDocument = (document) => {
  for (const match of document.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const block = match[1]
    const url = block.match(/<loc>(?:<!\[CDATA\[)?([^<\]]+)/)?.[1]
    const title = block.match(/<image:title>(?:<!\[CDATA\[)?([^<\]]+)/)?.[1]
    const lastmod = block.match(/<lastmod>(?:<!\[CDATA\[)?([^<\]]+)/)?.[1]
    if (!url || !title) continue
    const decodedTitle = decodeXml(title)
    const size = decodedTitle.match(/(\d+(?:[,.]\d+)?(?:\s*[×хx]\s*\d+(?:[,.]\d+)?){0,2})\s*мм/i)?.[1]?.replace(/[хx]/gi, '×').replace(/\s+/g, '') || ''
    const externalKey = `e-metall:${crypto.createHash('sha256').update(url).digest('hex').slice(0, 24)}`
    if (seenKeys.has(externalKey)) continue
    seenKeys.add(externalKey)
    const record = {
      sourceCode: 'e-metall',
      externalKey,
      category: url.includes('/product/truba-') ? 'Трубы' : '',
      product: decodedTitle,
      designation: '',
      size,
      standard: decodedTitle.match(/(?:ГОСТ|ТУ|ОСТ|СТО)\s*[А-ЯA-Z0-9 .\/-]+/i)?.[0] || '',
      availability: 'market-listed',
      sourceUrl: url,
      observedAt: lastmod || new Date().toISOString().slice(0, 10),
    }
    gzip.write(`${JSON.stringify(record)}\n`)
    recordCount += 1
  }
}

const worker = async () => {
  while (cursor < sitemapUrls.length) {
    const index = cursor
    cursor += 1
    const url = sitemapUrls[index]
    try {
      processDocument(await fetchText(url))
    } catch (error) {
      failures.push({ url, error: error instanceof Error ? error.message : String(error) })
    }
    completed += 1
    if (completed % 25 === 0 || completed === sitemapUrls.length) console.log(`Processed ${completed}/${sitemapUrls.length} sitemaps · ${recordCount} records`)
  }
}

await Promise.all(Array.from({ length: Math.min(concurrency, sitemapUrls.length) }, worker))
gzip.end()
await once(output, 'close')

const metadata = {
  sourceCode: 'e-metall',
  sourceUrl: rootUrl,
  checkedAt: new Date().toISOString(),
  sitemapCount: sitemapUrls.length,
  importedSitemapCount: sitemapUrls.length - failures.length,
  recordCount,
  failures,
  output: path.relative(process.cwd(), outputPath),
}
fs.writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
console.log(`Saved ${recordCount} hidden supplier records to ${outputPath}`)
