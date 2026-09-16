import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.fn()

vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ auth })) }))
vi.mock('@payload-config', () => ({ default: {} }))

import { POST } from '../../src/app/api/rfq-workbench/search/route'

describe('RFQ workbench authorization', () => {
  beforeEach(() => auth.mockReset())

  it('rejects an unauthenticated search before parsing the request', async () => {
    auth.mockResolvedValue({ user: null })

    const response = await POST(new Request('http://localhost/api/rfq-workbench/search', {
      method: 'POST',
      body: JSON.stringify({ text: 'Труба 219×10 09Г2С ГОСТ 8732-78, 20 т' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Требуется вход менеджера' })
  })

  it('validates the RFQ body after manager authentication', async () => {
    auth.mockResolvedValue({ user: { id: 1, email: 'manager@example.com' } })

    const response = await POST(new Request('http://localhost/api/rfq-workbench/search', {
      method: 'POST',
      body: JSON.stringify({ text: '   ' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: 'RFQ text is required' })
  })
})
