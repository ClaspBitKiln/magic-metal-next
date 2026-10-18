import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LanguageSwitcher from '@/components/LanguageSwitcher'

type TranslateTestWindow = Window & {
  google?: { translate: { TranslateElement: new () => void } }
  googleTranslateElementInit?: () => void
}
const translateWindow = window as TranslateTestWindow

let root: Root | undefined
let container: HTMLDivElement
function render(element: ReturnType<typeof createElement>) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root!.render(element))
  return { container, unmount: () => { act(() => root!.unmount()); root = undefined } }
}
function dispatch(element: Element, event: string) {
  act(() => element.dispatchEvent(new Event(event, { bubbles: true })))
}
function status() { return container.querySelector('[role="status"]')! }

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.useFakeTimers()
  localStorage.clear()
  document.cookie = 'googtrans=;path=/;max-age=0'
})
afterEach(() => {
  if (root) act(() => root!.unmount())
  root = undefined
  container?.remove()
  document.getElementById('google-translate-script')?.remove()
  delete translateWindow.google
  delete translateWindow.googleTranslateElementInit
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function translatedPage() {
  localStorage.setItem('magicmet-language', 'en')
  return render(createElement(LanguageSwitcher))
}

describe('optional machine translation', () => {
  it('keeps Russian independent of the SDK and uses native button semantics', () => {
    render(createElement(LanguageSwitcher))
    expect(document.getElementById('google-translate-script')).toBeNull()
    expect(container.querySelector('[role="menu"]')).toBeNull()
    expect(container.querySelector('[role="menuitem"]')).toBeNull()
    expect(container.textContent).toContain('машинный перевод Google')
  })

  it('opens an accessible error when the external script is blocked', () => {
    const { container } = translatedPage()
    dispatch(document.getElementById('google-translate-script')!, 'error')
    expect(status().textContent).toContain('Перевод недоступен')
    expect(container.querySelector('details')?.open).toBe(true)
    expect(container.querySelector('details')?.style.display).toBe('block')
  })

  it('reports an incomplete SDK even when its script load event succeeds', () => {
    translatedPage()
    dispatch(document.getElementById('google-translate-script')!, 'load')
    act(() => vi.advanceTimersByTime(12000))
    expect(status().textContent).toContain('Перевод недоступен')
  })

  it('does not call an empty widget a successful initialization', () => {
    translateWindow.google = { translate: { TranslateElement: class {} } }
    translatedPage()
    act(() => vi.advanceTimersByTime(12000))
    expect(status().textContent).toContain('Перевод недоступен')
  })

  it('detects the requested selector without promising a verified translation', async () => {
    translateWindow.google = { translate: { TranslateElement: class {
      constructor() {
        document.getElementById('google_translate_element')!.innerHTML = '<select class="goog-te-combo"><option value="en">English</option></select>'
      }
    } } }
    translatedPage()
    act(() => vi.advanceTimersByTime(12000))
    await act(async () => {})
    expect(status().textContent).toContain('Перевод может быть неполным')
    expect(status().textContent).not.toContain('Перевод недоступен')
  })

  it('returns to Russian without invoking a failed external SDK', () => {
    const reload = vi.fn()
    const originalWindow = window
    vi.stubGlobal('window', new Proxy(originalWindow, {
      get(target, property) {
        if (property === 'location') return { hostname: 'localhost', reload }
        const value = Reflect.get(target, property, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    }))
    const { container } = translatedPage()
    dispatch(document.getElementById('google-translate-script')!, 'error')
    const russian = Array.from(container.querySelectorAll('button')).find(button => button.textContent?.includes('Русский'))!
    dispatch(russian, 'click')
    expect(localStorage.getItem('magicmet-language')).toBe('ru')
    expect(document.cookie).not.toContain('googtrans=')
    expect(reload).toHaveBeenCalledOnce()
  })

  it('cleans up the timeout and callback when the component unmounts', () => {
    const { unmount } = translatedPage()
    unmount()
    act(() => vi.advanceTimersByTime(12000))
    expect(translateWindow.googleTranslateElementInit).toBeUndefined()
    expect(vi.getTimerCount()).toBe(0)
  })
})
