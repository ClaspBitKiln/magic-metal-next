#!/usr/bin/env node
// Read-only observer of the site's public catalog; never sends forms or changes content.
import { chromium } from 'playwright'
import { writeFile } from 'node:fs/promises'
const args = process.argv.slice(2)
const target = args.find(x => x.startsWith('https://'))
const output = args.find(x => x.startsWith('--out='))?.slice(6)
if (!target || !output || new URL(target).hostname !== 'magicmet.ru') {
  console.error('Expected magicmet.ru HTTPS URL and --out=filename')
  process.exit(2)
}
const result = { url: target, observed_at: new Date().toISOString(), verification_status: 'unverified_extraction', inventory_claim: false }
let browser
try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: {width: 390, height: 844} })
  const response = await page.goto(target, {waitUntil:'domcontentloaded',timeout:25000})
  result.status = response?.status() ?? 0
  result.final_url = page.url()
  result.title = await page.title()
  result.h1 = await page.locator('h1').allTextContents()
  result.links = await page.locator('a[href]').evaluateAll(elements => elements.map(a => ({text:a.textContent?.trim().slice(0,90),href:a.getAttribute('href')})).filter(x => x.text).slice(0,60))
  result.tables = await page.locator('table').count()
  result.text_excerpt = (await page.locator('body').innerText()).slice(0,4500)
  result.note = 'Observation only; not verified grade, size, standard or stock evidence.'
  if (!response || response.status() >= 400 || new URL(page.url()).hostname !== 'magicmet.ru') throw Error('Bad status or unexpected redirect')
} catch (error) {
  result.error = String(error?.message || error)
  process.exitCode = 1
} finally {
  await browser?.close()
  await writeFile(output, JSON.stringify(result,null,2), 'utf8')
}
