#!/usr/bin/env node
// Evidence-only crawler for public catalog pages. No external npm dependencies beyond existing Playwright.
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'

const targets = process.argv.slice(2).filter(arg => !arg.startsWith('--'))
const out = process.argv.find(arg => arg.startsWith('--out='))?.slice(6)
if (!targets.length || targets.length > 5) {
  console.error('Usage: node scripts/research/observe_catalog.mjs <https://public-url> [<https://public-url>] [--out=result.json] (max 5)')
  process.exit(2)
}
const userAgent = 'MagicMetalResearch/1.0 (+https://magicmet.ru)'
const results = []
const browser = await chromium.launch({ headless: true })
try {
  for (const address of targets) {
    const started = new Date().toISOString()
    const item = { url: address, observed_at: started, verification_status: 'unverified_extraction', inventory_claim: false }
    const page = await browser.newPage({ userAgent, viewport: { width: 1280, height: 800 } })
    try {
      const url = new URL(address)
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password)
        throw new Error('Public HTTPS URL required')
      const robotsResponse = await fetch(new URL('/robots.txt', url), { signal: AbortSignal.timeout(12000) })
      if (!robotsResponse.ok) throw new Error('robots.txt cannot be verified')
      const robotsText = await robotsResponse.text()
      // Conservative policy: do not continue when any Disallow rule exists: manual robots review is required.
      if (/^\s*Disallow\s*:\s*\S+/im.test(robotsText)) throw new Error('robots.txt contains restrictions: manual scope review required')
      await page.route('**/*', async route => {
        const target = new URL(route.request().url())
        if (target.hostname !== url.hostname) return route.abort()
        if (['image','media','font','websocket'].includes(route.request().resourceType())) return route.abort()
        return route.continue()
      })
      const response = await page.goto(address, { waitUntil: 'domcontentloaded', timeout: 20000 })
      if (!response || response.status() >= 400) throw new Error(`HTTP ${response?.status() ?? 'no response'}`)
      if (new URL(page.url()).hostname !== url.hostname) throw new Error('Unexpected cross-host redirect')
      item.final_url = page.url()
      item.title = await page.title()
      item.headings = (await page.locator('h1, h2').allTextContents()).map(x => x.trim()).filter(Boolean).slice(0, 30)
      item.table_count = await page.locator('table').count()
      item.text_excerpt = (await page.locator('body').innerText()).replace(/\s+/g,' ').slice(0, 10000)
      item.evidence_type = 'browser_observation'
      item.note = 'Not evidence of stock, normative applicability, or prices'
    } catch (error) {
      item.error = String(error?.message || error)
    } finally {
      await page.close()
    }
    results.push(item)
  }
} finally {
  await browser.close()
}
const body = JSON.stringify({ tool:'playwright-public-catalog-observer', records:results },null,2)
if(out) await writeFile(out,body,'utf8')
else console.log(body)
if(results.some(x=>x.error)) process.exitCode=1
