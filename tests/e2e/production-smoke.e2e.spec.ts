import { expect, test } from '@playwright/test'

const maintenanceTitle = 'САЙТ НА РЕКОНСТРУКЦИИ'

test('production loads the approved public state without critical resource failures', async ({ page, request, baseURL }) => {
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

  const stylesheet = await page.locator('link[rel="stylesheet"]').first().getAttribute('href')
  expect(stylesheet).toBeTruthy()
  const cssResponse = await request.get(new URL(stylesheet!, origin).toString())
  expect(cssResponse.status()).toBe(200)
  expect(cssResponse.headers()['content-type']).toContain('text/css')
  expect(await cssResponse.text()).not.toContain('fonts.googleapis.com')

  if (isMaintenance) {
    await expect(page.getByRole('heading', { name: maintenanceTitle, exact: true })).toHaveCount(1)
    await expect(page.locator('main')).toBeVisible()
  } else {
    expect(headingText).toContain('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
    await expect(page.locator('#request')).toBeAttached()

    const hero = page.locator('img.hero-visual')
    await expect(hero).toBeVisible()
    await expect.poll(() => hero.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)

    await page.getByRole('link', { name: /Отправить заявку/i }).first().click()
    await expect(page.locator('#request')).toBeVisible()
  }

  expect(failures, failures.join('\n')).toEqual([])
  expect(translateRequests, translateRequests.join('\n')).toEqual([])
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
