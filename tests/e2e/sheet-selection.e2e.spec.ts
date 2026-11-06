import { expect, test } from '@playwright/test'
import { guardQaContext } from '../../qa/network-guard'

test.beforeEach(async ({ context }) => guardQaContext(context))

for (const width of [320, 390, 1536]) {
  test(`galvanized sheet needs only thickness and cut at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/produkciya/listovoy-prokat/ocinkovannyj')
    const picker = page.locator('.galv-picker')
    await picker.getByLabel('Толщина, мм', { exact: true }).fill('0,7')
    await picker.getByLabel(/^Раскрой, мм/).selectOption('1250x2500')
    const target = new URL((await picker.locator('.galv-submit').getAttribute('href'))!, 'https://magicmet.ru')
    expect(target.searchParams.get('product')).toContain('1250')
    expect(target.searchParams.get('product')).toContain('2500')
    await expect(picker.locator('.galv-additional')).not.toHaveAttribute('open')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })

  for (const slug of ['med', 'bronza']) {
    test(`nonferrous sheet keeps thickness and cut visible: ${slug} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/produkciya/cvetnye-metally/' + slug)
      const picker = page.locator('.nonferrous-picker')
      await picker.getByRole('radio', { name: 'Лист', exact: true }).check()
      await picker.getByLabel('Толщина, мм', { exact: true }).fill('3')
      await picker.getByLabel('Раскрой, мм', { exact: true }).fill('1000 × 2000')
      await expect(picker.locator('.nonferrous-sheet-extra')).not.toHaveAttribute('open')
      const target = new URL((await picker.locator('.nonferrous-submit').getAttribute('href'))!, 'https://magicmet.ru')
      expect(target.searchParams.get('product')).toContain('раскрой 1000 × 2000 мм')
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }
  for (const slug of ['goryachekatanyj', 'holodnokatanyj']) {
    test(`sheet thickness and default cut: ${slug} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/produkciya/listovoy-prokat/' + slug)
      const picker = page.locator('.product-document-selection .sheet-format-picker')
      await expect(picker).toHaveCount(1)
      await expect(picker.getByRole('button', { name: '1500 × 6000 мм', exact: true })).toHaveAttribute('aria-pressed', 'true')
      const thickness = picker.getByLabel(/^Толщина, мм/)
      await expect(thickness).toBeEnabled()
      await thickness.selectOption({ index: 1 })
      const value = await thickness.inputValue()
      await picker.getByRole('button', { name: '2000 × 6000 мм', exact: true }).click()
      await expect(thickness).toHaveValue(value)
      const action = picker.getByRole('link', { name: 'Отправить выбранный размер в заявку ↗', exact: true })
      const request = new URL((await action.getAttribute('href'))!, 'https://magicmet.ru')
      expect(request.searchParams.get('product')).toContain('ширина 2000 мм')
      expect(request.searchParams.get('product')).toContain('длина 6000 мм')
      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44)
      const references = page.locator('#sizes details[id^=sizes-series]')
      await expect(references.first()).not.toHaveAttribute('open')
      const format = references.filter({ has: page.locator(':scope > summary').filter({ hasText: /^Форматы/ }) }).first()
      await format.locator(':scope > summary').click()
      await expect(format.locator('.size-series-reference table')).toBeVisible()
      await expect(format.locator('caption')).toHaveText(/^Форматы/)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }

  for (const slug of ['list-riflenyj', 'list-pvl', 'profnastil']) {
    test(`special sheet keeps only meaningful primary fields: ${slug} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto('/produkciya/listovoy-prokat/' + slug)
      const picker = page.locator('.special-sheet-picker')
      if (slug === 'list-pvl') {
        await picker.getByLabel('Обозначение ПВЛ', { exact: true }).fill('406')
        await expect(picker.getByLabel(/Толщина/)).toHaveCount(0)
      } else {
        if (slug === 'profnastil') await picker.getByLabel('Профиль', { exact: true }).fill('С21')
        await picker.getByLabel(/Толщина/).fill('2')
      }
      await picker.getByLabel('Раскрой, мм (ширина × длина)', { exact: true }).fill('1500 × 3000')
      const target = new URL((await picker.locator('.sheet-format-picker-actions a').first().getAttribute('href'))!, 'https://magicmet.ru')
      expect(target.searchParams.get('product')).toContain('раскрой 1500 × 3000 мм')
      if (slug === 'list-pvl') expect(target.searchParams.get('product')).toContain('обозначение ПВЛ 406')
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
    })
  }

  test(`stainless sheet opens thickness and cut without extra choice at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/produkciya/nerzhaveyushchaya-stal/list')
    const picker = page.locator('.nonferrous-picker')
    await expect(picker.getByRole('radio', { name: 'Лист', exact: true })).toBeChecked()
    await picker.getByLabel('Толщина, мм', { exact: true }).fill('2')
    await picker.getByLabel('Раскрой, мм', { exact: true }).fill('1500 × 3000')
    const href = await picker.locator('.nonferrous-submit').getAttribute('href')
    expect(new URL(href!, 'https://magicmet.ru').searchParams.get('product')).toContain('раскрой 1500 × 3000 мм')
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1)
  })
}
