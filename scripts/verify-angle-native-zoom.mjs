import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const browser = await chromium.launch({ headless: false, args: ['--window-size=1536,900'] })
try {
  const context = await browser.newContext({ viewport: null })
  const page = await context.newPage()
  const response = await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3000') + '/produkciya/sortovoy-i-fasonny-prokat/ugolok', { waitUntil: 'domcontentloaded' })
  assert.equal(response?.status(), 200, 'Angle card should be rendered')
  await page.evaluate(() => document.fonts.ready)
  await page.bringToFront()

  const metrics = () => page.evaluate(() => {
    const summary = document.querySelector('.technical-catalog-summary')
    const action = document.querySelector('.technical-catalog-summary-heading > a')
    return {
      width: window.innerWidth,
      dpr: window.devicePixelRatio,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      summary: Boolean(summary),
      actionHeight: action?.getBoundingClientRect().height || 0,
    }
  })
  execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+0'])
  await page.waitForTimeout(300)
  const before = await metrics()
  for (let i = 0; i < 5; i++) {
    execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+plus'])
    await page.waitForTimeout(150)
  }
  const after = await metrics()
  console.log(JSON.stringify({ before, after, browserZoomRatio: Number((before.width / after.width).toFixed(2)) }))
  assert.ok(before.summary && after.summary, 'The pilot is absent')
  assert.ok(before.width > 1000, 'Before zoom: need a desktop viewport')
  assert.ok(before.width / after.width >= 1.8 && before.width / after.width <= 2.2, 'Native browser zoom must be near 200%')
  assert.ok(after.dpr >= 1.8, 'Native browser zoom must affect devicePixelRatio')
  assert.ok(after.overflow <= 0, 'Document must not overflow horizontally at true browser zoom')
  assert.ok(after.actionHeight >= 44, 'RFQ action must remain accessible')
  await page.screenshot({ path: 'test-results/native-zoom-angle.png', fullPage: true })
  await context.close()
} finally {
  await browser.close()
}
