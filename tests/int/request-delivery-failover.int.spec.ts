import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPayload: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  createTransport: vi.fn(),
  sendMail: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('@/payload.config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }))

import { POST } from '@/app/(frontend)/api/request/route'

let requestNumber = 0

function submit(attachment?: { name: string; bytes: Uint8Array; mimeType: string }, options: { referer?: string; context?: string } = {}) {
  const form = new FormData()
  for (const [key, value] of Object.entries({
    consent: 'on',
    email: 'buyer@example.invalid',
    message: 'Труба 57×3, 12 метров',
    startedAt: '1',
  })) form.set(key, value)

  if (options.context !== undefined) form.set('context', options.context)

  if (attachment) {
    // jsdom File lacks arrayBuffer(), while real browser/Node multipart files expose it.
    // Polyfill only this test fixture; keep production upload parsing unchanged.
    const file = new File([attachment.bytes], attachment.name, { type: attachment.mimeType })
    Object.defineProperty(file, 'arrayBuffer', {
      value: async () => Uint8Array.from(attachment.bytes).buffer,
    })
    form.append('files', file)
  }

  return POST({
    url: 'https://magicmet.ru/api/request',
    headers: new Headers({ 'x-forwarded-for': `192.0.2.${++requestNumber}`, ...(options.referer ? { referer: options.referer } : {}) }),
    formData: async () => form,
  } as Request)
}

describe('request delivery failover without external services', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    for (const [key, value] of Object.entries({
      SMTP_HOST: 'smtp.example.invalid',
      SMTP_PORT: '587',
      SMTP_SECURE: 'false',
      SMTP_USER: 'sender@example.invalid',
      SMTP_PASSWORD: 'offline-test-only',
      REQUEST_TO_EMAIL: 'recipient@example.invalid',
      N8N_WEBHOOK_URL: '',
      CRM_WEBHOOK_URL: 'https://crm.example.invalid/request',
      N8N_WEBHOOK_SECRET: '',
    })) vi.stubEnv(key, value)
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.getPayload.mockResolvedValue({ create: mocks.create, update: mocks.update })
    mocks.create.mockResolvedValue({ id: 42 })
    mocks.update.mockResolvedValue({ id: 42 })
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
    mocks.sendMail.mockResolvedValue({ messageId: 'offline-test-only' })
    mocks.fetch.mockResolvedValue({ ok: false, status: 503 })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('recovers selected item from same-origin Referer when JavaScript did not set context', async () => {
    const response = await submit(undefined, {
      referer: 'https://magicmet.ru/?product=%D0%A3%D0%B3%D0%BE%D0%BB%D0%BE%D0%BA%2040x40x4&standard=%D0%93%D0%9E%D0%A1%D0%A2%208509-93#request',
    })
    expect(response.status).toBe(200)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'requests',
      data: expect.objectContaining({ context: 'Уголок 40x40x4; ГОСТ 8509-93' }),
    }))
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      html: expect.stringContaining('Уголок 40x40x4; ГОСТ 8509-93'),
    }))
  })

  it('ignores foreign Referer even if it supplies a selected item', async () => {
    const response = await submit(undefined, { referer: 'https://other.example/?product=Spoofed' })
    expect(response.status).toBe(200)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'requests', data: expect.objectContaining({ context: '' }),
    }))
  })

  it('preserves explicitly submitted context over Referer fallback', async () => {
    const response = await submit(undefined, {
      context: 'Указано закупщиком',
      referer: 'https://magicmet.ru/?product=Other',
    })
    expect(response.status).toBe(200)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'requests', data: expect.objectContaining({ context: 'Указано закупщиком' }),
    }))
  })

  it('accepts SMTP delivery when database initialization fails', async () => {
    mocks.getPayload.mockRejectedValue(new Error('Offline database failure'))

    const response = await submit()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, id: null, emailDelivered: true, crmDelivered: false })
    expect(mocks.sendMail).toHaveBeenCalledOnce()
    expect(mocks.create).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('returns 503 when database, SMTP and CRM all fail', async () => {
    mocks.getPayload.mockRejectedValue(new Error('Offline database failure'))
    mocks.sendMail.mockRejectedValue(Object.assign(new Error('Offline SMTP failure'), { code: 'ECONNREFUSED' }))
    mocks.fetch.mockRejectedValue(new Error('Offline CRM failure'))

    const response = await submit()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Не удалось подтвердить доставку заявки менеджеру. Она могла сохраниться. Уточните получение по телефону или напишите на m1@magicmet.ru.',
      deliveryFailure: 'smtp-connection',
    })
    expect(mocks.sendMail).toHaveBeenCalledOnce()
    expect(mocks.fetch).toHaveBeenCalledOnce()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('returns 503 instead of false success when SMTP fails and CRM returns non-2xx despite CMS storage', async () => {
    mocks.sendMail.mockRejectedValue(new Error('Offline SMTP failure'))

    const response = await submit()

    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Не удалось подтвердить доставку заявки менеджеру. Она могла сохраниться. Уточните получение по телефону или напишите на m1@magicmet.ru.',
      deliveryFailure: 'smtp-error',
    })
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'requests', overrideAccess: true }))
    expect(mocks.fetch).toHaveBeenCalledWith('https://crm.example.invalid/request', expect.objectContaining({ method: 'POST' }))
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it('sends the actual PDF bytes as SMTP attachment and reports acceptance', async () => {
    const bytes = new TextEncoder().encode('%PDF-1.4\nSynthetic PDF content\n%%EOF\n')
    const response = await submit({ name: 'synthetic-spec.pdf', bytes, mimeType: 'application/pdf' })
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, id: 42, emailDelivered: true, crmDelivered: false })
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [expect.objectContaining({
        filename: 'synthetic-spec.pdf',
        content: expect.any(Buffer),
        contentType: 'application/pdf',
      })],
    }))
    const mail = mocks.sendMail.mock.calls[0][0] as { attachments: { content: Buffer }[] }
    expect(mail.attachments[0].content.equals(Buffer.from(bytes))).toBe(true)
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ collection: 'request-files' }))
  })

  it('does not accept PDF requests when SMTP fails, even if CRM accepts metadata', async () => {
    mocks.sendMail.mockRejectedValue(Object.assign(new Error('SMTP unavailable'), { code: 'ECONNREFUSED' }))
    mocks.fetch.mockResolvedValue({ ok: true, status: 200 })
    const bytes = new TextEncoder().encode('%PDF-1.4\nQA attachment\n%%EOF')
    const response = await submit({ name: 'synthetic-spec.pdf', bytes, mimeType: 'application/pdf' })
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({
      error: 'Не удалось подтвердить отправку прикреплённых файлов менеджеру. Заявка могла сохраниться. Уточните получение по телефону или отправьте файлы на m1@magicmet.ru.',
      deliveryFailure: 'smtp-connection',
    })
    expect(mocks.fetch).toHaveBeenCalledOnce()
    expect(mocks.sendMail).toHaveBeenCalledOnce()
  })

  it('rejects disguised PDF files before any upload or delivery attempt', async () => {
    const bytes = new TextEncoder().encode('this is not a PDF')
    const response = await submit({ name: 'fake.pdf', bytes, mimeType: 'application/pdf' })
    expect(response.status).toBe(415)
    expect(mocks.sendMail).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it('keeps acceptance when recording successful delivery flags fails', async () => {
    mocks.update.mockRejectedValue(new Error('Offline status update failure'))

    const response = await submit()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, id: 42, emailDelivered: true, crmDelivered: false })
    expect(mocks.sendMail).toHaveBeenCalledOnce()
    expect(mocks.update).toHaveBeenCalledWith({
      collection: 'requests', id: 42, data: { emailDelivered: true, crmDelivered: false }, overrideAccess: true,
    })
  })
})
