import { forbiddenContent } from '../config'
import type { Finding, QaAgent } from '../types'
import { absoluteUrl, finding } from '../utils'

export const contentAgent: QaAgent = {
  name: 'Content & SEO',
  async run({ baseUrl, pages, page }) {
    const results: Finding[] = []
    for (const pathname of pages) {
      await page.goto(absoluteUrl(baseUrl, pathname), { waitUntil: 'domcontentloaded' })
      const data = await page.evaluate(() => ({
        title: document.title.trim(),
        description: document.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '',
        text: document.body.innerText,
        wrappedGost: [...document.querySelectorAll<HTMLElement>('a,h2,h3')].filter((element) => /ГОСТ\s+\d/i.test(element.innerText)).filter((element) => element.getClientRects().length > 1 || element.scrollHeight > Number.parseFloat(getComputedStyle(element).lineHeight) * 1.5).map((element) => element.innerText.trim()).slice(0, 10),
      }))
      if (!data.title) results.push(finding(this.name, 'high', pathname, 'Нет title', 'Пустой title', 'Добавить уникальный title.'))
      if (!data.description) results.push(finding(this.name, 'medium', pathname, 'Нет meta description', 'Пустое описание', 'Добавить описание.'))
      for (const phrase of forbiddenContent) if (data.text.toLocaleLowerCase('ru').includes(phrase.toLocaleLowerCase('ru'))) results.push(finding(this.name, 'high', pathname, 'Устаревшая формулировка', phrase, 'Удалить или заменить.'))
      if (data.wrappedGost.length) results.push(finding(this.name, 'medium', pathname, 'Номер ГОСТ переносится', data.wrappedGost.join('; '), 'Применить единый размер и nowrap.'))
    }
    return results
  },
}
