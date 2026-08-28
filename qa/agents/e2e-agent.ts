import type { Finding, QaAgent } from '../types'
import { absoluteUrl, finding } from '../utils'

export const e2eAgent: QaAgent = {
  name: 'Functional E2E',
  async run({ baseUrl, pages, page }) {
    const results: Finding[] = []
    await page.goto(baseUrl, { waitUntil: 'networkidle' })
    for (const href of pages) {
      const response = await page.request.get(absoluteUrl(baseUrl, href))
      if (response.status() >= 400) results.push(finding(this.name, 'critical', href, 'Маршрут sitemap недоступен', `HTTP ${response.status()}`, 'Исправить маршрут или исключить его из sitemap.'))
    }
    await page.goto(absoluteUrl(baseUrl, '/poisk?q=12%D0%A51%D0%9C%D0%A4'), { waitUntil: 'networkidle' })
    if ((await page.getByText(/12Х1МФ/i).count()) === 0) results.push(finding(this.name, 'high', '/poisk', 'Поиск не возвращает марку', 'Не найдено 12Х1МФ', 'Проверить индекс поиска.'))
    await page.goto(absoluteUrl(baseUrl, '/kalkulyator-metalla'), { waitUntil: 'networkidle' })
    if ((await page.getByText(/кг/i).count()) === 0) results.push(finding(this.name, 'high', '/kalkulyator-metalla', 'Нет результата массы', 'Не найдена единица кг', 'Проверить вычисление.'))
    return results
  },
}
