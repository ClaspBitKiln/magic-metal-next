import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getPayload: vi.fn(), createTransport: vi.fn(), sendMail: vi.fn(), fetch: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('nodemailer', () => ({ default: { createTransport: mocks.createTransport } }))
import { POST } from '@/app/(frontend)/api/request/route'

const defaults = { consent: 'on', email: 'buyer@example.invalid', phone: '12345678', startedAt: '1' }
let ip = 0
const submit = (values: Record<string, string>) => {
  const form = new FormData()
  for (const [key, value] of Object.entries({ ...defaults, ...values })) form.set(key, value)
  return POST({ headers: new Headers({ 'x-forwarded-for': `192.0.2.${++ip}` }), formData: async () => form } as Request)
}

describe('request spam rejection precedes delivery', () => {
  afterEach(() => vi.unstubAllGlobals())
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    mocks.createTransport.mockReturnValue({ sendMail: mocks.sendMail })
  })

  it.each([
    { message: 'aBcDeFgHiJkLmNoP', delivery: 'qRsTuVwXyZaBcDeFgHiJkLmNoP' },
    { message: 'WordPress SEO backlink services. Free audit, 20% off. Visit https://example.invalid/offer. To unsubscribe visit https://example.invalid/stop.', delivery: 'Example' },
  ])('rejects a spam pattern before storage, SMTP and CRM', async (values) => {
    const response = await submit(values)
    expect(response.status).toBe(400)
    expect((await response.json()).error).toBeTruthy()
    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.createTransport).not.toHaveBeenCalled()
    expect(mocks.sendMail).not.toHaveBeenCalled()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('rejects an unusable contact before storage or delivery', async () => {
    const response = await submit({ phone: 'не телефон', email: '', message: 'Труба 57×3, 12 метров' })
    expect(response.status).toBe(400)
    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.sendMail).not.toHaveBeenCalled()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('rejects an oversized attachment before reading, storage or delivery', async () => {
    const form = new FormData()
    for (const [key, value] of Object.entries({ ...defaults, message: 'Труба 57×3' })) form.set(key, value)
    form.set('files', new File([new Uint8Array(4 * 1024 * 1024 + 1)], 'specification.pdf', { type: 'application/pdf' }))
    const response = await POST({ headers: new Headers({ 'x-forwarded-for': `192.0.2.${++ip}` }), formData: async () => form } as Request)
    expect(response.status).toBe(413)
    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.sendMail).not.toHaveBeenCalled()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it('handles malformed multipart without a server error or side effects', async () => {
    const response = await POST({ headers: new Headers(), formData: async () => { throw new Error('Malformed multipart') } } as unknown as Request)
    expect(response.status).toBe(400)
    expect(mocks.getPayload).not.toHaveBeenCalled()
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })
})
