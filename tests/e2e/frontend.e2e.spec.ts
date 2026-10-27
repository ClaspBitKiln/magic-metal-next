import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Мэджик Металл/)

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('СЛОЖНЫЕ ПРОМЫШЛЕННЫЕ')
  })

  test('can search the technical catalog', async ({ page }) => {
    await page.goto('http://localhost:3000/poisk?q=12Х1МФ')
    await expect(page.getByRole('link', { name: /12Х1МФ/ }).first()).toBeVisible()
  })

  test('can open the metal calculator', async ({ page }) => {
    await page.goto('http://localhost:3000/kalkulyator-metalla')
    await expect(page.getByRole('heading', { name: /Калькулятор/ })).toBeVisible()
  })

  test('can open a detailed pipe page with its normative sizes', async ({ page }) => {
    await page.goto('http://localhost:3000/produkciya/truby-elektrosvarnye/pryamoshovnye')
    await expect(page.getByRole('heading', { name: 'Трубы электросварные прямошовные' })).toBeVisible()
    await expect(page.locator('#sizes')).toBeVisible()
    await expect(page.locator('#sizes summary').first()).toContainText('ГОСТ 10704-91')
    await expect(page.locator('#sizes table').first()).toBeVisible()
    await expect(page.locator('.pipe-nav').getByRole('link', { name: /Отправить заявку/ })).toBeVisible()
  })

  test('expands compact pipe sizes and keeps their scroll region keyboard accessible', async ({ page }) => {
    await page.goto('/produkciya/truby-besshovnye/goryachedeformirovannye#sizes')
    const list = page.locator('.size-series-pair-list').first()
    await expect(list.locator('tbody tr')).toHaveCount(20)
    await expect(page.locator('body')).not.toContainText('23met.ru')
    await expect(list).toHaveAttribute('role', 'region')
    await expect(list).toHaveAttribute('tabindex', '0')
    await list.focus()
    await page.keyboard.press('ArrowDown')
    await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
    await page.getByRole('button', { name: /Ещё размеры/ }).click()
    await expect(list.locator('tbody tr')).toHaveCount(40)
  })

  test('renders SDT through the same catalog structure as every other category', async ({ page }) => {
    await page.goto('http://localhost:3000/#products')
    const sdtGroup = page.locator('.catalog-group').filter({ has: page.locator(':scope > summary strong', { hasText: /^СДТ$/ }) })
    await expect(sdtGroup).toHaveCount(1)
    await sdtGroup.locator('summary').first().click()
    await expect(sdtGroup.locator('.catalog-item').first()).toBeVisible()
    await expect(sdtGroup.locator('.catalog-item').first().locator('summary')).toBeVisible()
  })
})
