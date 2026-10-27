import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`technical search updates its URL and opens exact product sizes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/poisk?q=Водогазопроводные')
    const search = page.getByLabel('Товар, размер, марка, ГОСТ или назначение')
    await expect(search).toHaveValue('Водогазопроводные')
    await expect(page.locator('.search-results a').first()).toBeVisible()
    await search.fill('57×3')
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('57×3')
    const product = page.locator('.search-results a[href*="size_1=57"][href*="wall_1=3"]').first()
    await expect(product).toBeVisible()
    await product.click()
    await expect(page).toHaveURL(/\/produkciya\/.+size_1=57.*wall_1=3/)
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('.size-series-selection-result').first()).toContainText('57 × 3 мм')
    expect(await page.locator('h1').evaluate((heading) => heading.scrollWidth - heading.clientWidth)).toBeLessThanOrEqual(1)
  })
}

for (const legacy of ['/spravochnik-nalichiya?q=Водогазопроводные', '/poziciya?id=obsolete']) {
  test(`retired route ${legacy.split('?')[0]} redirects to the unified catalog`, async ({ page }) => {
    await page.goto(legacy)
    await expect.poll(() => new URL(page.url()).pathname).toBe('/')
    await expect.poll(() => new URL(page.url()).hash).toBe('#products')
    await expect(page.locator('#products')).toBeInViewport()
    await expect(page.locator('.catalog-group').first()).toBeVisible()
  })
}
