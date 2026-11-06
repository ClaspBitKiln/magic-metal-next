import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import MaterialStandardReference from '@/components/MaterialStandardReference'
import { getMaterialStandardParts } from '@/data/materialStandardLinks'
import { materials } from '@/data/materials'
import { standards } from '@/data/standards'

const render = (reference: string) => new DOMParser().parseFromString(
  renderToStaticMarkup(createElement(MaterialStandardReference, { reference })), 'text/html')

describe('material references link each known standard independently', () => {
  it('fixes the actual compound reference without assigning its qualifier to one standard', () => {
    const reference = materials.find(item => item.slug === '12x18n10t')!.standards[1]
    expect(reference).toBe('ГОСТ 9940 и ГОСТ 9941 для соответствующих труб')
    const document = render(reference)
    expect(document.body.textContent).toBe(reference)
    expect([...document.querySelectorAll('a')].map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['ГОСТ 9940', '/spravochnik-gost/gost-9940-81'],
      ['ГОСТ 9941', '/spravochnik-gost/gost-9941-2022'],
    ])
  })

  it('preserves typography, punctuation and edition labels verbatim', () => {
    const reference = 'По ГОСТ\u00a09940–81; ГОСТ 9941-2022 (трубы) / ГОСТ 99999-2025'
    const parts = getMaterialStandardParts(reference)
    expect(parts.map(part => part.text).join('')).toBe(reference)
    expect(parts.filter(part => part.standard).map(part => part.text)).toEqual(['ГОСТ\u00a09940–81', 'ГОСТ 9941-2022'])
    expect(render(reference).body.textContent).toBe(reference)
  })

  it.each(['ГОСТ 9940-9999', 'ГОСТ 99400', 'ГОСТ 9940-81234', 'ГОСТ 9940.1', 'ГОСТ 9940-8', 'ГОСТ 9940 - 8', 'ГОСТ 9940‑9999', 'ГОСТ 9940 - 812', 'ГОСТ 9940 -', 'ASTM A240/A240M для листа'])('keeps unsupported references as plain text: %s', reference => {
    const document = render(reference)
    expect(document.querySelectorAll('a')).toHaveLength(0)
    expect(document.body.textContent).toBe(reference)
  })

  it('retains the existing single-standard row and uses no prefetch', () => {
    const document = render('ГОСТ 1050')
    const link = document.querySelector('a')!
    expect(link.getAttribute('href')).toBe('/spravochnik-gost/gost-1050-2013')
    expect(link.classList.contains('fact-link')).toBe(true)
    expect(link.textContent).toBe('ГОСТ 1050 →')
    expect(link.querySelector('b')?.textContent).toBe('→')
  })

  it('never loses the original text or invents destinations for any existing material reference', () => {
    const slugs = new Set(standards.map(item => item.slug))
    for (const material of materials) {
      for (const reference of material.standards) {
        const parts = getMaterialStandardParts(reference)
        expect(parts.map(part => part.text).join('')).toBe(reference)
        for (const part of parts) {
          if (part.standard) expect(slugs.has(part.standard.slug)).toBe(true)
        }
      }
    }
  })
})
