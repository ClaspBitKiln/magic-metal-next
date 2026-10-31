import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { unnamedControls } from './accessibility.ts'
import { visualAgent } from './agents/visual-agent.ts'
import { guardQaContext } from './network-guard.ts'

// No external requests, analytics, email or real leads. Run with:
// node --import=tsx/esm --test qa/regression.test.mjs
async function fixture(run) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox'],
  })
  try { await run(await browser.newPage()) } finally { await browser.close() }
}

test('QA blocks analytics and writes while preserving public reads and unrelated hosts', async () => {
  let handler
  await guardQaContext({ route: async (_pattern, callback) => { handler = callback } })
  const outcome = async (url, method = 'GET') => {
    let result
    await handler({
      request: () => ({ url: () => url, method: () => method }),
      abort: () => { result = 'blocked' },
      continue: () => { result = 'allowed' },
    })
    return result
  }
  assert.equal(await outcome('https://mc.yandex.ru/metrika/tag.js'), 'blocked')
  assert.equal(await outcome('https://sub.mc.yandex.com/watch/1'), 'blocked')
  assert.equal(await outcome('https://mc.webvisor.org/watch/1'), 'blocked')
  assert.equal(await outcome('https://magicmet.ru/api/request', 'POST'), 'blocked')
  assert.equal(await outcome('https://magicmet.ru/api/request', 'DELETE'), 'blocked')
  assert.equal(await outcome('https://magicmet.ru/images/hero-photo-1440.avif'), 'allowed')
  assert.equal(await outcome('https://magicmet.ru/', 'HEAD'), 'allowed')
  assert.equal(await outcome('https://mc.yandex.ru.other.example/'), 'allowed')
})

test('associated labels, naming references and image links are named; truly unnamed controls remain findings', async () => {
  await fixture(async page => {
    await page.setContent(`
      <label>Wrapped<input></label><label for="external">External</label><input id="external">
      <span id="hidden" hidden>Hidden reference</span><input aria-labelledby="hidden">
      <button aria-label="Name"></button><a href="/x"><img alt="Image name"></a>
      <label>Upload<input type="file"></label><input type="file"><input type="file" title="File title">
      <input data-case="unnamed-text"><input data-case="unnamed-upload" type="file">
      <button data-case="unnamed-button"></button>
      <div aria-hidden="true"><button>Ignored</button><input></div>
    `)
    const findings = await unnamedControls(page)
    assert.equal(findings.length, 4)
    assert.equal(findings.filter(html => html.includes('type="file"')).length, 2)
    assert.equal(findings.filter(html => html.includes('data-case="unnamed-')).length, 3)
  })
})

test('actual clipping remains a finding; visible overflow, scrolling and an ongoing request do not block the audit', async () => {
  await fixture(async page => {
    const outputDir = await mkdtemp(path.join(tmpdir(), 'magicmet-qa-fixture-'))
    try {
      await page.route('http://qa.fixture/**', async route => {
        if (new URL(route.request().url()).pathname === '/never') return
        return route.fulfill({ contentType: 'text/html', body: `
          <style>h1,h2,h3{font-size:20px;width:70px;white-space:nowrap}
            h1{overflow:hidden}h2{overflow:visible}h3{overflow:auto}</style>
          <h1>Actually clipped</h1><h2>Visible overflow</h2><h3>Intentional scrolling</h3>
          <script>fetch('/never')</script>
        ` })
      })
      const findings = await visualAgent.run({
        baseUrl: 'http://qa.fixture', visualPages: ['/'], pages: ['/'], page, outputDir,
        viewport: { name: 'desktop', width: 1440, height: 1000 },
      })
      const clipped = findings.find(item => item.title === 'Обрезанный текст')
      assert.ok(clipped)
      assert.equal(clipped.evidence, 'Actually clipped')
    } finally { await rm(outputDir, { recursive: true, force: true }) }
  })
})
