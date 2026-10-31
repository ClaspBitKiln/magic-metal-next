import type { Finding, QaAgent } from '../types'
import { absoluteUrl, finding } from '../utils'
import { unnamedControls } from '../accessibility'

export const accessibilityAgent: QaAgent = {
  name: 'Accessibility',
  async run({ baseUrl, pages, page }) {
    const results: Finding[] = []
    for (const pathname of pages) {
      await page.goto(absoluteUrl(baseUrl, pathname), { waitUntil: 'domcontentloaded' })
      const audit = await page.evaluate(() => ({
        imagesWithoutAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
        h1Count: document.querySelectorAll('h1').length,
        mainCount: document.querySelectorAll('main').length,
      }))
      if (audit.imagesWithoutAlt) results.push(finding(this.name, 'medium', pathname, 'Изображения без alt', `${audit.imagesWithoutAlt} шт.`, 'Добавить alt.'))
      const unnamed = await unnamedControls(page)
      if (unnamed.length) results.push(finding(this.name, 'high', pathname, 'Элементы без доступного имени', `${unnamed.length} шт.: ${unnamed.slice(0, 3).join('; ')}`, 'Добавить подпись или aria-label.'))
      if (audit.h1Count !== 1) results.push(finding(this.name, 'medium', pathname, 'Неверное количество H1', `${audit.h1Count}`, 'Оставить один H1.'))
      if (audit.mainCount !== 1) results.push(finding(this.name, 'medium', pathname, 'Неверное количество main', `${audit.mainCount}`, 'Использовать один main.'))
    }
    return results
  },
}
