export const priorityPages = [
  '/',
  '/produkciya/truby-elektrosvarnye',
  '/produkciya/truby-besshovnye',
  '/produkciya/listovoj-prokat',
  '/spravochnik-gost',
  '/spravochnik-materialov',
  '/poisk?q=12%D0%A51%D0%9C%D0%A4',
  '/kalkulyator-metalla',
  '/postavki/uzbekistan',
]

export async function loadPages(baseUrl: string) {
  try {
    const response = await fetch(new URL('/sitemap.xml', baseUrl))
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const xml = await response.text()
    const routes = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)]
      .map((match) => new URL(match[1]).pathname)
      .filter((pathname, index, items) => items.indexOf(pathname) === index)
    return routes.length ? routes : priorityPages
  } catch {
    return priorityPages
  }
}

export const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'mobile', width: 390, height: 844 },
]

export const forbiddenContent = ['Enter Engineering', 'UzGTL', 'космодром «Восточный»', 'АЛРОСА', 'Отправить спецификацию']
