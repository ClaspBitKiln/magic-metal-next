import type { Finding, QaAgent } from '../types'
import { absoluteUrl, finding } from '../utils'

export const performanceAgent: QaAgent = {
  name: 'Performance',
  async run({ baseUrl, pages, page }) {
    const results: Finding[] = []
    for (const pathname of pages) {
      await page.goto(absoluteUrl(baseUrl, pathname), { waitUntil: 'networkidle' })
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
        return {
          loadMs: Math.round(navigation.loadEventEnd - navigation.startTime),
          transferKb: Math.round(resources.reduce((sum, item) => sum + (item.transferSize || 0), 0) / 1024),
          requests: resources.length,
          largeImages: resources.filter((item) => /\.(png|jpe?g|webp)(\?|$)/i.test(item.name) && item.transferSize > 500_000).map((item) => `${Math.round(item.transferSize / 1024)}KB ${item.name.split('/').pop()}`).slice(0, 5),
        }
      })
      if (metrics.loadMs > 3500) results.push(finding(this.name, 'high', pathname, 'Медленная загрузка', `${metrics.loadMs} мс`, 'Оптимизировать критические изображения, шрифты и JS.'))
      if (metrics.transferKb > 5000) results.push(finding(this.name, 'medium', pathname, 'Большой объём страницы', `${metrics.transferKb} КБ / ${metrics.requests} запросов`, 'Сжать ресурсы.'))
      if (metrics.largeImages.length) results.push(finding(this.name, 'medium', pathname, 'Тяжёлые изображения', metrics.largeImages.join('; '), 'Использовать AVIF/WebP и responsive sizes.'))
    }
    return results
  },
}
