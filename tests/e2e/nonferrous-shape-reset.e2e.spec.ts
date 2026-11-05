import { expect, test } from '@playwright/test'

for (const width of [390, 1536]) {
  test(`alloy request resets form-dependent details on shape change at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/request', (route) => route.abort())
    await page.goto('/produkciya/cvetnye-metally/bronza')
    const picker = page.locator('.nonferrous-picker')
    const shape = (name: string) => picker.getByRole('radio', { name, exact: true })
    await shape('Квадрат').check()
    await picker.getByLabel('Сторона, мм').fill('20')
    await picker.getByLabel('Марка металла / сплава').selectOption('БрАМц9-2')
    await picker.locator('.nonferrous-advanced > summary').click()
    await picker.getByLabel('Состояние / способ изготовления').fill('тянутый')
    await picker.getByLabel('Поверхность / покрытие').fill('без покрытия')
    await picker.getByLabel('ГОСТ / ТУ / ASTM').fill('ГОСТ 1628-2019')
    await picker.getByLabel('Количество').fill('12')
    const action = picker.getByRole('link', { name: /Передать параметры в заявку/ })
    await expect.poll(async () => new URL((await action.getAttribute('href'))!, 'https://magicmet.ru').searchParams.get('product')).toContain('БрАМц9-2')
    await shape('Шестигранник').check()
    await expect(picker.getByLabel('Марка металла / сплава')).toHaveValue('')
    await expect(picker.getByLabel('Состояние / способ изготовления')).toHaveValue('')
    await expect(picker.getByLabel('Поверхность / покрытие')).toHaveValue('')
    await expect(picker.getByLabel('ГОСТ / ТУ / ASTM')).toHaveValue('')
    await expect(picker.getByLabel('Количество')).toHaveValue('12')
    await expect(picker.getByLabel('Размер под ключ, мм')).toHaveValue('')
    await picker.getByLabel('Размер под ключ, мм').fill('24')
    const href = await action.getAttribute('href')
    const request = new URL(href!, 'https://magicmet.ru').searchParams.get('product') || ''
    expect(request).toContain('количество 12')
    expect(request).toContain('Шестигранник под ключ 24 мм')
    expect(request).not.toContain('БрАМц9-2')
    expect(request).not.toContain('1628-2019')
    expect(request).not.toContain('без покрытия')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
  })
}

