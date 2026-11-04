import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
  test(`nonferrous request accepts arbitrary specifications at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/produkciya/cvetnye-metally/med')
    const picker = page.locator('.nonferrous-picker')
    const action = picker.getByRole('link', { name: /Передать параметры в заявку/ })
    await expect(action).toBeVisible()
    await expect(action).toHaveAttribute('href', /#request$/)
    await picker.getByLabel('Форма изделия').selectOption('Труба')
    await picker.getByLabel('Наружный диаметр, мм').fill('10')
    await picker.getByLabel('Толщина стенки, мм').fill('99')
    await picker.getByLabel('Количество').fill('0')
    const href = await action.getAttribute('href')
    const params = new URL(href!, 'https://magicmet.ru').searchParams.get('product') || ''
    expect(params).toContain('Труба Ø10×99 мм')
    expect(params).toContain('количество 0')
    await action.click()
    await expect(page).toHaveURL(/#request$/)
    await expect(page.locator('#request-form textarea[name="message"]')).toHaveValue(/Труба Ø10×99 мм/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}
