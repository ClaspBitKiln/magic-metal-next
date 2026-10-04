import { expect, test } from '@playwright/test'

const maintenanceTitle = 'САЙТ НА РЕКОНСТРУКЦИИ'

test('production loads the approved public state without critical resource failures', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  const failures: string[] = []
  const translateRequests: string[] = []

  page.on('response', (response) => {
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

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  // Firefox can fail while reading a navigation response body through the
  // protocol even though the document loaded successfully. Measure the
  // serialized document instead; this keeps the size budget browser-neutral.
  expect(Buffer.byteLength(await page.content(), 'utf8')).toBeLessThan(80_000)

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
  expect(await inlinedCss.textContent()).not.toContain('fonts.googleapis.com')
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(0)

  if (isMaintenance) {
    await expect(page.getByRole('heading', { name: maintenanceTitle, exact: true })).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  } else {
    expect(headingText).toContain('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
    await expect(page.locator('#request')).toBeAttached()

    const hero = page.locator('.hero-picture img')
    await expect(hero).toBeVisible()
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
    const currentHero = await hero.evaluate((image: HTMLImageElement) => image.currentSrc)
    expect(new URL(currentHero, origin).pathname).toMatch(/^\/images\/hero-mercedes-(640|1024|1440)\.webp$/)
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

  const hero = page.locator('.hero-picture img')
  await expect(hero).toBeVisible()
  await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
  expect(new URL(await hero.evaluate((image: HTMLImageElement) => image.currentSrc)).pathname).toBe('/images/hero-mercedes-640.webp')
  await expect(page.locator('#products')).toBeVisible()
  await expect(page.locator('#request')).toBeAttached()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('www hostname serves the same approved public state', async ({ page }) => {
  const response = await page.goto('https://www.magicmet.ru/', { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)

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

  await context.close()
})
