import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'

// Run each case in its own Xvfb display. This checks real Chromium zoom, not
// viewport emulation or deviceScaleFactor. No request is ever submitted.
const cases = {
  hot: { path: '/produkciya/listovoy-prokat/goryachekatanyj', section: '.product-document-selection .sheet-format-picker', action: '.sheet-format-picker-actions > a', kind: 'sheet' },
  cold: { path: '/produkciya/listovoy-prokat/holodnokatanyj', section: '.product-document-selection .sheet-format-picker', action: '.sheet-format-picker-actions > a', kind: 'sheet' },
  galvanized: { path: '/produkciya/listovoy-prokat/ocinkovannyj', section: '.galv-picker', action: '.galv-submit' },
  copper: { path: '/produkciya/cvetnye-metally/med', section: '.nonferrous-picker', action: '.nonferrous-submit', kind: 'copper' },
  stainless: { path: '/produkciya/nerzhaveyushchaya-stal/list', section: '.nonferrous-picker', action: '.nonferrous-submit' },
  material: { path: '/spravochnik-materialov/12x18n10t', section: '.material-content', action: '.material-intro > a' },
}
const caseKey = process.argv[2] || 'hot'
assert.ok(Object.hasOwn(cases, caseKey), 'Unknown native zoom case')
const selected = cases[caseKey]
const base = new URL(process.env.BASE_URL || 'http://127.0.0.1:3000')
assert.ok(['http:', 'https:'].includes(base.protocol), 'BASE_URL must use HTTP or HTTPS')
assert.ok(['127.0.0.1', 'localhost', '[::1]', '::1'].includes(base.hostname), 'BASE_URL must be local')
assert.ok(!base.username && !base.password && !base.search && !base.hash, 'BASE_URL must not contain credentials, query, or fragment')

const browser = await chromium.launch({
  headless: false,
  args: ['--window-size=1536,900'],
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
    : {}),
})
try {
  const context = await browser.newContext({ viewport: null, serviceWorkers: 'block' })
  await context.route('**/*', route => {
    const request = route.request()
    const url = new URL(request.url())
    const analytics = ['mc.yandex.ru', 'mc.yandex.com', 'mc.webvisor.org']
      .some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))
    // Same-origin GET/HEAD only: blocks analytics, external traffic, redirects
    // to the live website, and all mutations, including every POST endpoint.
    return analytics || url.origin !== base.origin || !['GET', 'HEAD'].includes(request.method())
      ? route.abort()
      : route.continue()
  })
  const page = await context.newPage()
  const response = await page.goto(new URL(selected.path, base).href, { waitUntil: 'domcontentloaded' })
  assert.equal(response?.status(), 200, 'Local page must render with HTTP 200')
  await page.evaluate(() => document.fonts.ready)
  const section = page.locator(selected.section).first()
  await section.waitFor({ state: 'visible' })
  if (selected.kind === 'sheet') {
    await section.getByLabel(/^Толщина, мм/).selectOption({ index: 1 })
  }
  if (selected.kind === 'copper') {
    await section.getByRole('radio', { name: 'Лист', exact: true }).check()
  }
  const action = section.locator(selected.action).first()
  await action.waitFor({ state: 'visible' })
  await action.scrollIntoViewIfNeeded()
  await page.bringToFront()

  const metrics = async () => ({
    ...await page.evaluate(({ sectionSelector, actionSelector }) => {
      const block = document.querySelector(sectionSelector)
      const cta = block?.querySelector(actionSelector)
      const visible = element => Boolean(element && element.getBoundingClientRect().width > 0
        && element.getBoundingClientRect().height > 0 && getComputedStyle(element).visibility !== 'hidden'
        && getComputedStyle(element).display !== 'none')
      return {
        width: window.innerWidth,
        dpr: window.devicePixelRatio,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        sectionVisible: visible(block),
        actionVisible: visible(cta),
        actionHeight: cta?.getBoundingClientRect().height || 0,
        h1FontSize: Number.parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
      }
    }, { sectionSelector: selected.section, actionSelector: selected.action }),
  })
  execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+0'])
  await page.waitForTimeout(300)
  const before = await metrics()
  for (let index = 0; index < 5; index++) {
    execFileSync('xdotool', ['key', '--clearmodifiers', 'ctrl+plus'])
    await page.waitForTimeout(150)
  }
  await action.scrollIntoViewIfNeeded()
  const after = await metrics()
  const browserZoomRatio = before.width / after.width
  const summary = { caseKey, path: selected.path, before, after, browserZoomRatio: Number(browserZoomRatio.toFixed(3)) }
  const checks = {
    desktopBeforeZoom: before.width > 1000,
    nativeZoomNear200: browserZoomRatio >= 1.8 && browserZoomRatio <= 2.2,
    nativeDpr: after.dpr >= 1.8,
    noOverflow: after.overflow <= 0,
    sectionVisible: before.sectionVisible && after.sectionVisible,
    actionAccessible: before.actionVisible && after.actionVisible && after.actionHeight >= 44,
  }
  const pass = Object.values(checks).every(Boolean)
  console.log(JSON.stringify({ ...summary, checks, status: pass ? 'PASS' : 'FAIL' }))
  if (process.env.NATIVE_ZOOM_SCREENSHOT === '1') {
    mkdirSync('test-results', { recursive: true })
    try {
      await page.screenshot({ path: `test-results/native-zoom-${caseKey}.png`, fullPage: true })
    } catch {
      // Some headed Xvfb sessions cannot capture; metrics remain the gate.
      console.log(JSON.stringify({ caseKey, screenshot: 'unavailable' }))
    }
  }
  assert.ok(pass, 'Native zoom checks failed; see JSON metrics')
  await context.close()
} finally {
  await browser.close()
}
