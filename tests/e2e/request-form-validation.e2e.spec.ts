import { test, expect, type Page } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

const target = process.env.BASE_URL || 'http://localhost:3000'
const pdf = { name: 'qa-request.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4\nQA request fixture\n%%EOF') }

async function nextStep(page: Page) {
  const form = page.locator('.request-form')
  await form.locator('[name="message"]').fill('Тестовая заявка: труба 57×3, 1 тонна.')
  await form.locator('.form-next').click()
  return form
}

test.beforeEach(async ({ page }) => {
  await page.goto(`${target}/?utm_source=form-validation-qa#request`, { waitUntil: 'networkidle' })
})

test('обязательные условия понятны до отправки, необязательные поля не требуются', async ({ page }) => {
  const form = page.locator('.request-form')
  await expect(form.getByText('Обязательно: прикрепите файл или заполните описание.')).toBeVisible()
  await expect(form.getByRole('alert')).toHaveCount(0)
  await nextStep(page)
  await expect(form.getByText('Обязательно: телефон или email. Достаточно одного контакта.')).toBeVisible()
  await expect(form.getByText('Имя, компания, город и направление — необязательные поля.')).toBeVisible()
  await expect(form.locator('.consent')).toContainText('(обязательно)')
  for (const name of ['name', 'company', 'phone', 'email', 'delivery', 'productDirection']) await expect(form.locator(`[name="${name}"]`)).not.toHaveAttribute('required')
  await expect(form.locator('[name="files"]')).not.toHaveAttribute('accept', /audio|mp3|m4a|wav|ogg|webm/)
})

test('пустая заявка показывает красную подсказку у описания и переводит фокус', async ({ page }) => {
  let posts = 0
  page.on('request', request => { if (request.url().endsWith('/api/request')) posts++ })
  const form = page.locator('.request-form')
  await form.locator('.form-next').click()
  const error = form.locator('[id$="-request-error"]')
  await expect(error).toHaveText('Прикрепите файл или опишите, что требуется.')
  await expect(error).toHaveCSS('color', 'rgb(180, 35, 24)')
  await expect(form.locator('[name="message"]')).toBeFocused()
  await expect(form.locator('[name="message"]')).toHaveAttribute('aria-invalid', 'true')
  await form.locator('[name="message"]').fill('Тестовая заявка')
  await expect(error).toHaveCount(0)
  expect(posts).toBe(0)
})

test('все пропущенные условия подсвечены, исправления снимают ошибки', async ({ page }, testInfo) => {
  let posts = 0
  await page.route('**/api/request', async route => { posts++; await route.fulfill({ status: 200, json: { ok: true } }) })
  const form = await nextStep(page)
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('[id$="-contact-error"]')).toBeVisible()
  await expect(form.locator('[id$="-consent-error"]')).toBeVisible()
  await expect(form.locator('[name="phone"]')).toBeFocused()
  await expect(form.locator('[name="phone"]')).toHaveCSS('border-bottom-color', 'rgb(180, 35, 24)')
  await expect(form.locator('[name="email"]')).toHaveAttribute('aria-invalid', 'true')
  await expect(form.locator('[name="consent"]')).toHaveAttribute('aria-invalid', 'true')
  expect(posts).toBe(0)
  await form.screenshot({ path: testInfo.outputPath('required-field-errors.png') })
  await form.locator('[name="email"]').fill('qa@example.invalid')
  await form.locator('[name="consent"]').check()
  await expect(form.locator('.field-error')).toHaveCount(0)
  await expect(form.locator('[name="phone"]')).not.toHaveAttribute('aria-invalid')
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('.form-status.success')).toBeVisible()
  expect(posts).toBe(1)
})

test('ошибка email понятна, фокус стоит в email, исправление позволяет отправить', async ({ page }) => {
  let posts = 0
  await page.route('**/api/request', async route => { posts++; await route.fulfill({ status: 200, json: { ok: true } }) })
  const form = await nextStep(page)
  await form.locator('[name="email"]').fill('invalid-email')
  await form.locator('[name="consent"]').check()
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('[id$="-email-error"]')).toHaveText('Проверьте email: например, name@example.com.')
  await expect(form.locator('[name="email"]')).toBeFocused()
  expect(posts).toBe(0)
  await form.locator('[name="email"]').fill('qa@example.invalid')
  await expect(form.locator('[id$="-email-error"]')).toHaveCount(0)
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('.form-status.success')).toBeVisible()
})

for (const contact of ['phone', 'email']) {
  test(`достаточно только ${contact === 'phone' ? 'телефона' : 'email'}; остальные поля можно оставить пустыми`, async ({ page }) => {
    let body = ''
    await page.route('**/api/request', async route => { body = route.request().postDataBuffer()?.toString() || ''; await route.fulfill({ status: 200, json: { ok: true } }) })
    const form = await nextStep(page)
    await form.locator(`[name="${contact}"]`).fill(contact === 'phone' ? '+7 (000) 000-00-00' : 'qa@example.invalid')
    await form.locator('[name="consent"]').check()
    await form.locator('button[type="submit"]').click()
    await expect(form.locator('.form-status.success')).toBeVisible()
    expect(body).toContain(contact === 'phone' ? '+7 (000) 000-00-00' : 'qa@example.invalid')
    expect(body).toContain('form-validation-qa')
  })
}

test('файл можно отправить без описания', async ({ page }) => {
  let body = ''
  await page.route('**/api/request', async route => { body = route.request().postDataBuffer()?.toString() || ''; await route.fulfill({ status: 200, json: { ok: true } }) })
  const form = page.locator('.request-form')
  await form.locator('[name="files"]').setInputFiles(pdf)
  await form.locator('.form-next').click()
  await form.locator('[name="email"]').fill('qa@example.invalid')
  await form.locator('[name="consent"]').check()
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('.form-status.success')).toBeVisible()
  expect(body).toContain(pdf.name)
})

for (const extension of ['mp3', 'm4a', 'wav', 'ogg', 'webm']) {
  test(`голосовой файл .${extension} отклоняется до отправки`, async ({ page }) => {
    let posts = 0
    page.on('request', request => { if (request.url().endsWith('/api/request')) posts++ })
    const form = page.locator('.request-form')
    await form.locator('[name="files"]').setInputFiles({ name: `voice.${extension}`, mimeType: 'application/octet-stream', buffer: Buffer.from('unsupported voice fixture') })
    await form.locator('.form-next').click()
    await expect(form.locator('[id$="-files-error"]')).toHaveText('Этот формат файла не поддерживается. Выберите фото, документ или чертёж.')
    await expect(form.locator('[name="files"]')).toBeFocused()
    await form.locator('[name="files"]').setInputFiles(pdf)
    await expect(form.locator('[id$="-files-error"]')).toHaveCount(0)
    await form.locator('.form-next').click()
    await expect(form.locator('[name="email"]')).toBeVisible()
    expect(posts).toBe(0)
  })
}

test('слишком большой файл отклоняется с понятным пояснением до отправки', async ({ page }, testInfo) => {
  let posts = 0
  page.on('request', request => { if (request.url().endsWith('/api/request')) posts++ })
  const form = page.locator('.request-form')
  const filename = testInfo.outputPath('over-limit.pdf')
  await writeFile(filename, Buffer.alloc(5 * 1024 * 1024))
  await form.locator('[name="files"]').setInputFiles(filename)
  await form.locator('.form-next').click()
  await expect(form.locator('[id$="-files-error"]')).toHaveText('Общий размер файлов должен быть не больше 4 МБ.')
  expect(posts).toBe(0)
})

test('ошибка сервера не теряет введённую заявку и позволяет повторить отправку', async ({ page }) => {
  await page.route('**/api/request', route => route.fulfill({ status: 503, json: { error: 'Не удалось сохранить или доставить заявку.' } }))
  const form = await nextStep(page)
  await form.locator('[name="email"]').fill('qa@example.invalid')
  await form.locator('[name="consent"]').check()
  await form.locator('button[type="submit"]').click()
  await expect(form.locator('.form-status.error')).toHaveText('Не удалось сохранить или доставить заявку.')
  await expect(form.locator('[name="email"]')).toHaveValue('qa@example.invalid')
  await expect(form.locator('[name="message"]')).toHaveValue('Тестовая заявка: труба 57×3, 1 тонна.')
  await expect(form.locator('button[type="submit"]')).toBeEnabled()
})
