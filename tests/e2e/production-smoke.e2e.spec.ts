import { expect, test } from '@playwright/test'

const maintenanceTitle = 'САЙТ НА РЕКОНСТРУКЦИИ'

test('production loads the approved public state without critical resource failures', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const failures: string[] = []
  const translateRequests: string[] = []
  let fullCssStatus: number | undefined
  let fullCssType: string | undefined

  page.on('response', (response) => {
    if (new URL(response.url()).pathname === '/site.css') {
      fullCssStatus = response.status()
      fullCssType = response.headers()['content-type']
    }
    if (response.url().startsWith(origin) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()} ${response.url()}`)
    }
  })
  page.on('requestfailed', (failed) => {
    if (failed.url().startsWith(origin)) {
      failures.push(`REQUEST_FAILED ${failed.url()} ${failed.failure()?.errorText || ''}`)
    }
  })
  page.on('request', (request) => {
    if (/translate\.google|translate-pa\.googleapis/.test(request.url())) {
      translateRequests.push(request.url())
    }
  })
  page.on('pageerror', (error) => failures.push(`PAGE_ERROR ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') failures.push(`CONSOLE_ERROR ${message.text()}`)
  })

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  // Firefox can fail while reading a navigation response body through the
  // protocol even though the document loaded successfully. Measure the
  // serialized document instead; this keeps the size budget browser-neutral.
  // Only the first screen is inlined. The complete September design is loaded
  // in the background so slow clients can paint useful content immediately.
  expect(Buffer.byteLength(await page.content(), 'utf8')).toBeLessThan(110_000)

  const heading = page.locator('h1')
  await expect(heading).toBeVisible()
  const headingText = (await heading.innerText()).trim()
  const isMaintenance = headingText === maintenanceTitle

  const applied = await page.evaluate(() => ({
    styleSheets: document.styleSheets.length,
    fontFamily: getComputedStyle(document.body).fontFamily,
    bodyMargin: getComputedStyle(document.body).margin,
  }))
  expect(applied.styleSheets).toBeGreaterThan(0)
  expect(applied.fontFamily).toMatch(/Segoe UI|Arial|sans-serif/i)
  expect(applied.fontFamily).not.toMatch(/Times New Roman/i)
  expect(applied.bodyMargin).toBe('0px')

  const inlinedCss = page.locator('style[data-precedence="next"]')
  await expect(inlinedCss).toHaveCount(1)
  const criticalCss = await inlinedCss.textContent()
  expect(Buffer.byteLength(criticalCss || '', 'utf8')).toBeLessThan(15_000)
  expect(criticalCss).not.toContain('fonts.googleapis.com')
  const fullCss = page.locator('link#full-site-css')
  await expect(fullCss).toHaveCount(1)
  await expect(fullCss).toHaveAttribute('href', '/site.css?v=20261005')
  await expect.poll(() => fullCss.evaluate((link: HTMLLinkElement) => link.media)).toBe('all')
  await expect.poll(() => fullCss.evaluate((link: HTMLLinkElement) => Boolean(link.sheet))).toBe(true)
  expect(fullCssStatus).toBe(200)
  expect(fullCssType).toContain('text/css')
  expect(await page.locator('#products').evaluate((node) => getComputedStyle(node).position)).toBe('relative')

  if (isMaintenance) {
    await expect(page.getByRole('heading', { name: maintenanceTitle, exact: true })).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  } else {
    expect(headingText).toContain('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
    await expect(page.locator('#request')).toBeAttached()

    const logo = page.locator('.brand')
    await expect(logo).toBeVisible()
    await expect(logo).toContainText('Мэджик')
    await expect(page.locator('.brand-mark')).toContainText('MM')

    const hero = page.locator('.hero')
    await expect(hero).toBeVisible()
    await expect(page.locator('.hero-fallback-art')).toBeVisible()
    await expect(page.locator('.hero-photo')).toBeAttached()
    await expect(page.locator('#products')).toBeVisible()

    await page.getByRole('link', { name: /Отправить заявку/i }).first().click()
    await expect(page.locator('#request')).toBeVisible()
  }

  expect(failures, failures.join('\n')).toEqual([])
  expect(translateRequests, translateRequests.join('\n')).toEqual([])
})

test('mobile receives the small hero and has no horizontal overflow', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)

  const hero = page.locator('.hero')
  await expect(hero).toBeVisible()
  await expect(page.locator('.hero-fallback-art')).toBeVisible()
  await expect(page.locator('.hero-photo')).toBeAttached()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('critical branding stays visible when standalone image requests fail', async ({ page, baseURL }) => {
  await page.route('**/images/**', (route) => route.abort('failed'))
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()

  await expect(page.locator('.brand')).toBeVisible()
  await expect(page.locator('.brand')).toContainText('Мэджик')

  const hero = page.locator('.hero')
  await expect(hero).toBeVisible()
  await expect(page.locator('.hero-fallback-art')).toBeVisible()
})

test('www hostname redirects to the canonical apex host', async ({ page }) => {
  const response = await page.goto('https://www.magicmet.ru/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).hostname).toBe('magicmet.ru')

  const headingText = (await page.locator('h1').innerText()).trim()
  expect(
    headingText === maintenanceTitle || headingText.includes('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ'),
  ).toBe(true)
  expect(await page.evaluate(() => getComputedStyle(document.body).margin)).toBe('0px')
})

test('critical public content stays visible when JavaScript is unavailable', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  const response = await page.goto(baseURL!, { waitUntil: 'domcontentloaded' })

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { name: /СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ/i })).toBeVisible()
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeVisible()
  await expect(page.getByRole('link', { name: /\+7 922 711-73-63/ }).first()).toBeVisible()
  await expect(page.locator('.brand img')).toBeVisible()
  await expect(page.locator('.hero')).toBeVisible()

  await context.close()
})
