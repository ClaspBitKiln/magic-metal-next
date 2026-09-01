import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can go on homepage', async ({ page }) => {
    await page.goto('http://localhost:3000')

    await expect(page).toHaveTitle(/Мэджик Металл/)

    const heading = page.locator('h1').first()
    await expect(heading).toContainText('Металл')
  })

  test('can search the technical catalog', async ({ page }) => {
    await page.goto('http://localhost:3000/poisk?q=12Х1МФ')
    await expect(page.getByRole('link', { name: /12Х1МФ/ }).first()).toBeVisible()
  })

  test('can open the metal calculator', async ({ page }) => {
    await page.goto('http://localhost:3000/kalkulyator-metalla')
    await expect(page.getByRole('heading', { name: /Калькулятор/ })).toBeVisible()
  })

  test('can open a detailed pipe page with its technical image', async ({ page }) => {
    await page.goto('http://localhost:3000/produkciya/truby-elektrosvarnye/pryamoshovnye')
    await expect(page.getByRole('heading', { name: 'Трубы электросварные прямошовные' })).toBeVisible()
    await expect(page.getByAltText(/Техническая схема/)).toBeVisible()
    await expect(page.getByRole('link', { name: /Отправить заявку/ })).toBeVisible()
  })

  test('shows the practical size series without a nested vertical scroll', async ({ page }) => {
    await page.goto('http://localhost:3000/spravochnik-nalichiya?q=Бесшовные%20горячедеформированные')
    const group = page.locator('.market-group').first()
    await expect(group).toHaveAttribute('open', '')
    await expect(group.locator('.market-position-row')).toHaveCount(50)
    await expect(group).toContainText('Практический размерный ряд')
    await expect(page.locator('body')).not.toContainText('23met.ru')
    await expect(group.locator('.market-table-wrap')).toHaveCSS('max-height', 'none')
    await group.getByRole('button', { name: /Показать ещё 50/ }).click()
    await expect(group.locator('.market-position-row')).toHaveCount(100)
  })

  test('renders SDT through the same catalog structure as every other category', async ({ page }) => {
    await page.goto('http://localhost:3000/#products')
    const sdtGroup = page.locator('.catalog-group').filter({ hasText: /^СДТ/ }).first()
    await expect(sdtGroup).toBeVisible()
    await sdtGroup.locator('summary').first().click()
    await expect(sdtGroup.locator('.catalog-table')).toBeVisible()
    await expect(sdtGroup.locator('.catalog-item')).toHaveCount(5)
  })
})
