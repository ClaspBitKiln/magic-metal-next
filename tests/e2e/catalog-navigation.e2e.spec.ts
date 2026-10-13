import { test, expect } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`filter URL updates preserve product navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const filterNavigations: string[] = []
    page.on('request', (request) => {
      if (request.headers().rsc === '1' && new URL(request.url()).pathname === '/spravochnik-nalichiya') {
        filterNavigations.push(request.url())
      }
    })
    await page.goto('/spravochnik-nalichiya?q=Водогазопроводные')
    const search = page.getByPlaceholder('Номенклатура, размер, марка или ГОСТ')
    await expect(search).toHaveValue('Водогазопроводные')
    await expect(page.locator('.market-group').first()).toBeVisible()
    await search.fill('Бесшовные холоднодеформированные')
    await expect(page).toHaveURL(/q=.*category=/)
    await expect(page.locator('.market-group').first()).toContainText('холоднодеформированные')
    const group = page.locator('.market-group').first()
    if (await group.getAttribute('open') === null) await group.locator('summary').click()
    await expect(group.locator('.market-position-row').first()).toBeVisible()
    expect(filterNavigations).toEqual([])
    await group.locator('.market-position-row').first().click()
    await expect(page).toHaveURL(/\/poziciya\?id=/)
    await expect(page.locator('.position-hero').getByRole('link', { name: 'Отправить заявку' })).toBeVisible()
    expect(await page.locator('.position-hero h1').evaluate((heading) => heading.scrollWidth - heading.clientWidth)).toBeLessThanOrEqual(1)
  })
}
