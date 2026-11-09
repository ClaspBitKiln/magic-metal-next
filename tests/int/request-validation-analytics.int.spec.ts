import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import RequestForm from '@/components/RequestForm'

const source = fs.readFileSync('public/home.js', 'utf8')
let root: Root | undefined
let container: HTMLDivElement | undefined
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container?.remove()
  container = undefined
  vi.unstubAllGlobals()
})

describe('private request validation measurements', () => {
  it.each([
    ['', '', 'PRIVATE SPEC', 'Укажите телефон или email.'],
    ['bad-phone', '', 'PRIVATE SPEC', 'Проверьте телефон или email'],
    ['', 'private@example.invalid', '', 'Прикрепите файл или опишите'],
  ])('records the static home validation flag without sending a request (%s/%s)', (phone, email, message, error) => {
    const dom = new JSDOM('<form id="request-form"><input name="phone"><input name="email"><textarea name="message"></textarea><input type="file" name="files"><button>Send</button></form><p id="form-status"></p>', {
      url: 'https://magicmet.ru/', runScripts: 'outside-only',
    })
    try {
      const events: unknown[] = []
      dom.window.document.addEventListener('magicmet:goal', ((event: CustomEvent) => events.push(event.detail)) as EventListener)
      const fetch = vi.fn()
      Object.assign(dom.window, { fetch })
      dom.window.eval(source)
      const form = dom.window.document.querySelector('form')!
      ;(form.elements.namedItem('phone') as HTMLInputElement).value = phone
      ;(form.elements.namedItem('email') as HTMLInputElement).value = email
      ;(form.elements.namedItem('message') as HTMLTextAreaElement).value = message
      form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }))
      expect(dom.window.document.querySelector('#form-status')!.textContent).toContain(error)
      expect(events.filter(name => name === 'request_validation_error')).toHaveLength(1)
      expect(JSON.stringify(events)).not.toContain('PRIVATE')
      expect(JSON.stringify(events)).not.toContain('private@example.invalid')
      expect(fetch).not.toHaveBeenCalled()
    } finally { dom.window.close() }
  })

  it('records the React form first-step validation without transmitting its contents', () => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
    const events: unknown[] = []
    const collect = (event: Event) => events.push((event as CustomEvent).detail)
    document.addEventListener('magicmet:goal', collect)
    try {
      container = document.createElement('div')
      document.body.appendChild(container)
      root = createRoot(container)
      act(() => root!.render(createElement(RequestForm)))
      const button = container.querySelector('button[type="button"]') as HTMLButtonElement
      expect(button).toBeTruthy()
      act(() => button.click())
      expect(container.textContent).toContain('Прикрепите заявку или кратко опишите')
      expect(events).toEqual(['request_validation_error'])
    } finally { document.removeEventListener('magicmet:goal', collect) }
  })
})
