import path from 'node:path'
import type { Finding, QaAgent } from '../types'
import { absoluteUrl, ensureDir, finding } from '../utils'

export const visualAgent: QaAgent = {
  name: 'Visual QA',
  async run({ baseUrl, outputDir, visualPages, page, viewport }) {
    const results: Finding[] = []
    const screenshots = path.join(outputDir, 'screenshots', viewport.name)
    await ensureDir(screenshots)
    for (const pathname of visualPages) {
      await page.goto(absoluteUrl(baseUrl, pathname), { waitUntil: 'networkidle' })
      const slug = pathname === '/' ? 'home' : pathname.replace(/[?&#=/]+/g, '-').replace(/^-|-$/g, '')
      await page.screenshot({ path: path.join(screenshots, `${slug}.png`), fullPage: true })
      const layout = await page.evaluate(() => {
        const oversizedHeadings = [...document.querySelectorAll<HTMLElement>('h1,h2,h3')]
          .filter((element) => element.offsetParent !== null)
          .map((element) => ({ text: element.innerText.trim().slice(0, 90), size: Number.parseFloat(getComputedStyle(element).fontSize) }))
          .filter((item) => item.size > (innerWidth < 600 ? 48 : 80))
        const clipped = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,a,button')]
          .filter((element) => element.offsetParent !== null && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2))
          .map((element) => element.innerText.trim().slice(0, 90)).filter(Boolean).slice(0, 10)
        return { horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, oversizedHeadings, clipped }
      })
      if (layout.horizontalOverflow > 2) results.push(finding(this.name, 'high', pathname, 'Горизонтальная прокрутка', `${layout.horizontalOverflow}px`, 'Исправить ширину сетки или перенос содержимого.'))
      for (const heading of layout.oversizedHeadings) results.push(finding(this.name, 'medium', pathname, 'Слишком крупный заголовок', `${heading.size}px: ${heading.text}`, 'Снизить размер в общей типографической шкале.'))
      if (layout.clipped.length) results.push(finding(this.name, 'high', pathname, 'Обрезанный текст', layout.clipped.join('; '), 'Убрать фиксированную высоту или скорректировать перенос.'))
    }
    return results
  },
}
