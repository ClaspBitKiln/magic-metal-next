import { createElement } from 'react'
import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import MeshRopeRequestPicker from '@/components/MeshRopeRequestPicker'
import { matchesCatalogQuery } from '@/lib/catalogSearch'

describe('steel rope procurement', () => {
  it('finds steel ropes without discarding diameter or standard requirements', () => {
    const row = { category: 'Метизы', product: 'КАНАТЫ', designation: '', size: '13', standard: 'ГОСТ 2688-80' }
    expect(matchesCatalogQuery(row, 'канаты стальные 13 ГОСТ 2688')).toBe(true)
    expect(matchesCatalogQuery(row, 'стальные канаты 13 ГОСТ 2688')).toBe(true)
    expect(matchesCatalogQuery(row, 'канаты стальные 24')).toBe(false)
    expect(matchesCatalogQuery(row, 'канаты стальные ГОСТ 7668')).toBe(false)
    expect(matchesCatalogQuery({ ...row, product: 'ПРОВОЛОКА' }, 'канаты стальные')).toBe(false)
  })

  it('offers required breaking force only for ropes without inventing a default', () => {
    const rope = new DOMParser().parseFromString(renderToStaticMarkup(createElement(MeshRopeRequestPicker, { type: 'rope', requestHref: '/#request' })), 'text/html')
    const mesh = new DOMParser().parseFromString(renderToStaticMarkup(createElement(MeshRopeRequestPicker, { type: 'mesh', requestHref: '/#request' })), 'text/html')
    const label = Array.from(rope.querySelectorAll('label')).find(node => node.textContent?.includes('Разрывное усилие, кН (если задано)'))
    expect(label?.querySelector('input')?.getAttribute('value')).toBe('')
    expect(mesh.body.textContent).not.toContain('Разрывное усилие, кН (если задано)')
    expect(rope.querySelector('.mesh-rope-submit')).toBeNull()
  })
})
