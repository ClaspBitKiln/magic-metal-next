import { describe, expect, it } from 'vitest'
import { normalizeSearch, searchIndex } from '@/data/searchIndex'

const search = (query: string) => {
  const tokens = normalizeSearch(query).split(' ').filter(Boolean)
  return searchIndex.filter(item => {
    const haystack = normalizeSearch(`${item.title} ${item.searchText}`)
    return tokens.every(token => haystack.includes(token))
  })
}

describe('ferroalloy technical search', () => {
  it.each([
    ['ФВд50У0,4', 'ferrovanadij'],
    ['FeV80', 'ferrovanadij'],
    ['ГОСТ 27130-94', 'ferrovanadij'],
    ['ФХ001А/Б', 'ferrohrom'],
    ['ФТи35С5', 'ferrotitan'],
    ['ФМо60', 'ferromolibden'],
    ['ФНб60', 'ferroniobij'],
    ['ФС75', 'ferrosilicij'],
  ])('finds the canonical ferroalloy card for %s', (query, slug) => {
    const matches = search(query)
    expect(matches.some(item => item.href === `/produkciya/ferrosplavy/${slug}`)).toBe(true)
    expect(matches.some(item => item.href.includes('/ferrosplavy/') && item.type !== 'product')).toBe(false)
  })

  it('does not advertise inventory or availability in the ferroalloy search snippets', () => {
    const cards = searchIndex.filter(item => item.href.startsWith('/produkciya/ferrosplavy/'))
    expect(cards).toHaveLength(8)
    for (const card of cards) {
      expect(card.searchText).toBeTruthy()
      expect(card.href).toMatch(/^\/produkciya\/ferrosplavy\/[a-z-]+$/)
    }
  })
})
