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
    await expect(page.getByRole('link', { name: /Отправить спецификацию/ })).toBeVisible()
  })
})
