import { test, expect } from '@playwright/test'

const url = '/produkciya/sortovoy-i-fasonny-prokat/ugolok'

for (const width of [320, 390, 1536]) {
  test(`Technical Catalog UI: angle buyer summary at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await page.evaluate(() => document.fonts.ready)

    await expect(page.getByRole('heading', { name: 'Уголок: основные параметры' })).toBeVisible()
    const summary = page.locator('.technical-catalog-summary')
    await expect(summary).toContainText('09Г2С')
    await expect(summary).toContainText('ГОСТ 8509-93')
    await expect(summary).toContainText('Ст3')
    await expect(summary.getByRole('link', { name: /В заявку/ })).toHaveAttribute('href', /[?&]product=.*#request$/)
    await expect(summary.getByRole('link', { name: /Посмотреть размерный ряд/ })).toHaveAttribute('href', '#sizes')
    await expect(page.locator('#sizes')).toHaveCount(1)

    const layout = await page.evaluate(() => {
      const title = document.querySelector<HTMLElement>('.technical-catalog-summary h2')!
      const action = document.querySelector<HTMLElement>('.technical-catalog-summary-heading > a')!
      const heading = document.querySelector<HTMLElement>('.pipe-hero h1')!
      return {
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        titleSize: parseFloat(getComputedStyle(title).fontSize),
        headingSize: parseFloat(getComputedStyle(heading).fontSize),
        buttonHeight: action.getBoundingClientRect().height,
        firstSummaryTop: title.getBoundingClientRect().top + window.scrollY,
      }
    })
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth)
    expect(layout.titleSize).toBeGreaterThanOrEqual(21)
    expect(layout.titleSize).toBeLessThanOrEqual(29)
    expect(layout.headingSize).toBeLessThanOrEqual(41)
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44)
    expect(layout.firstSummaryTop).toBeLessThan(900)
    await page.screenshot({ path: `test-results/technical-angle-${width}.png`, fullPage: true })
  })
}

test('Technical Catalog UI does not leak to other products', async ({ page }) => {
  await page.goto('/produkciya/sortovoy-i-fasonny-prokat/kvadrat')
  await expect(page.locator('.technical-catalog-summary')).toHaveCount(0)
  await expect(page.locator('main.technical-catalog-pilot')).toHaveCount(0)
})
