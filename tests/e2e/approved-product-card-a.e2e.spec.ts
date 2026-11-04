import { expect, test } from '@playwright/test'

for (const width of [320, 390, 1536]) {
  test(`approved product card has no illustrative photo or empty photo column at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/produkciya/truby-elektrosvarnye/vodogazoprovodnye')
    const summary = page.locator('.technical-catalog-summary')
    await expect(summary).toBeVisible()
    await expect(summary.locator('.product-document-image')).toHaveCount(0)
    await expect(summary.locator('.product-document-summary-body')).toHaveClass(/product-document-summary-no-image/)
    const columns = await summary.locator('.product-document-summary-body').evaluate(el => getComputedStyle(el).gridTemplateColumns)
    expect(columns.trim().split(/\\s+/)).toHaveLength(1)
    await expect(page.getByRole('link', { name: 'Отправить заявку ↗' }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}
