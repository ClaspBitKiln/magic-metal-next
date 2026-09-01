import fs from 'node:fs'
import path from 'node:path'

const outputPath = path.join(process.cwd(), 'public/data/practical-size-snapshot.json')
const privateOutputPath = path.join(process.cwd(), 'private/data/23met-practical-snapshot.json')
const sitemapUrls = Array.from({ length: 6 }, (_, index) => `https://23met.ru/sitemaps/sitemap_${index + 1}.xml`)

const sourceGroups = [
  { id: 'pipe-welded', title: 'Трубы электросварные', routes: ['tryba_es'], stockProducts: ['ТРУБЫ ЭЛЕКТРОСВАРНЫЕ'], queries: ['Электросварные прямошовные и спиралешовные'] },
  { id: 'pipe-hot-deformed', title: 'Трубы бесшовные горячедеформированные', routes: ['tryba_gd'], stockProducts: ['ТРУБЫ Г/Д (катаные, нефтепров) ГОСТ8732-78'], queries: ['Бесшовные горячедеформированные'] },
  { id: 'pipe-cold-deformed', title: 'Трубы бесшовные холоднодеформированные', routes: ['tryba_xd'], stockProducts: ['ТРУБЫ Х/Д (тянутые,бесшовные) ГОСТ8734-75'], queries: ['Бесшовные холоднодеформированные'] },
  { id: 'pipe-vgp', title: 'Трубы водогазопроводные', routes: ['tryba_vgp'], stockProducts: ['ТРУБЫ ВОДОГАЗОПРОВ. ЧЕРНЫЕ ГОСТ 3262-75', 'ТРУБЫ ВОДОГАЗОПРОВ. ОЦИНК. ГОСТ 3262-75'], queries: ['Водогазопроводные'] },
  { id: 'pipe-profile-rectangle', title: 'Трубы профильные прямоугольные', routes: ['tryba_es_pr'], stockProducts: ['ТРУБЫ ЭЛЕКТРОСВАРНЫЕ ПРЯМОУГ'], queries: ['Профильные квадратные и прямоугольные'] },
  { id: 'pipe-profile-square', title: 'Трубы профильные квадратные', routes: ['tryba_es_kvadr'], stockProducts: ['ТРУБЫ ЭЛЕКТРОСВАРНЫЕ КВАДРАТ'], queries: ['Профильные квадратные и прямоугольные'] },
  { id: 'elbows', title: 'Отводы стальные', routes: ['otvod'], stockProducts: ['Отводы стальные', 'ДЕТАЛИ ТРУБОПРОВОДОВ - ОТВОД'], queries: ['Отводы бесшовные'] },
  { id: 'tees', title: 'Тройники стальные', routes: ['troynik'], stockProducts: ['Тройники стальные'], queries: ['Тройники бесшовные'] },
  { id: 'reducers', title: 'Переходы стальные', routes: ['perehod'], stockProducts: ['Переходы стальные'], queries: ['Переходы бесшовные'] },
  { id: 'flanges', title: 'Фланцы стальные', routes: ['flanec'], stockProducts: ['Фланцы стальные'], queries: ['Фланцы'] },
  { id: 'heads', title: 'Днища стальные', routes: ['dnishe'], stockProducts: ['Заглушки стальные'], queries: ['Заглушки и днища'] },
  { id: 'sheet-hot-rolled', title: 'Лист горячекатаный', routes: ['list_gk'], stockProducts: ['СТАЛЬ ЛИСТ Г/К КОНСТРУКЦИОННАЯ', 'СТАЛЬ ЛИСТОВАЯ Г/К НИЗКОЛЕГИРОВАННАЯ', 'СТАЛЬ ЛИСТОВАЯ Г/К ОБЫЧ КАЧЕСТВА'], queries: ['Лист и рулон горячекатаный'] },
  { id: 'sheet-cold-rolled', title: 'Лист холоднокатаный', routes: ['list_xk'], stockProducts: ['СТАЛЬ ЛИСТОВАЯ Х/К'], queries: ['Лист и рулон холоднокатаный'] },
  { id: 'sheet-galvanized', title: 'Лист оцинкованный', routes: ['list_ocink'], stockProducts: ['СТАЛЬ ЛИСТОВАЯ ОЦИНКОВАННАЯ Х/К'], queries: ['Оцинкованный прокат'] },
  { id: 'round-bar', title: 'Круг стальной', routes: ['kryg'], stockProducts: ['КРУГ Г/К', 'СТАЛЬ СОРТ КОНСТР КРУГ', 'СТАЛЬ КОНСТРУКЦИОННАЯ НИКЕЛ КРУГ', 'СТАЛЬ СОРТ ИНСТРУМ КРУГ'], queries: ['Круг'] },
  { id: 'square-bar', title: 'Квадрат стальной', routes: ['kvadrat'], stockProducts: ['КВАДРАТ Г/К', 'СТАЛЬ КОНСТРУКЦИОННАЯ НИКЕЛ КВАДРАТ'], queries: ['Квадрат'] },
  { id: 'strip', title: 'Полоса стальная', routes: ['polosa'], stockProducts: ['ПОЛОСА Г/К', 'СТАЛЬ ФАСОН ПРОФИЛИ ПОЛОСА'], queries: ['Полоса'] },
  { id: 'angle', title: 'Уголок стальной', routes: ['ygolok'], stockProducts: ['УГОЛОК', 'УГОЛОК НИЗКОЛЕГИР'], queries: ['Уголок'] },
  { id: 'beam', title: 'Балка двутавровая', routes: ['balka'], stockProducts: ['БАЛКИ ДВУТАВРОВЫЕ'], queries: ['Балка двутавровая'] },
  { id: 'channel', title: 'Швеллер', routes: ['shveller'], stockProducts: ['ШВЕЛЛЕР', 'ШВЕЛЛЕР НИЗКОЛЕГИР'], queries: ['Швеллер'] },
  { id: 'bolts', title: 'Болты', routes: ['bolty'], stockProducts: ['Болты'], queries: ['Крепёж'] },
  { id: 'nuts', title: 'Гайки', routes: ['gaiki'], stockProducts: ['Гайки'], queries: ['Крепёж'] },
  { id: 'washers', title: 'Шайбы', routes: ['shaiby'], stockProducts: ['Шайбы'], queries: ['Крепёж'] },
  { id: 'wire', title: 'Проволока', routes: ['provoloka'], stockProducts: ['ПРОВОЛОКА О/К ТОРГОВАЯ'], queries: ['Проволока'] },
  { id: 'electrodes', title: 'Электроды', routes: ['elektrody'], stockProducts: ['ЭЛЕКТРОДЫ СВАРОЧНЫЕ'], queries: ['Электроды'] },
]

const numericParts = (value) => [...value.matchAll(/\d+(?:[.,]\d+)?/g)].map((match) => Number(match[0].replace(',', '.')))
const compareSizes = (left, right) => {
  const leftParts = numericParts(left)
  const rightParts = numericParts(right)
  for (let index = 0; index < Math.max(leftParts.length, rightParts.length); index += 1) {
    const difference = (leftParts[index] ?? -1) - (rightParts[index] ?? -1)
    if (difference) return difference
  }
  return left.localeCompare(right, 'ru', { numeric: true })
}

const fetchSitemap = async (url) => {
  const response = await fetch(url, { headers: { 'user-agent': 'Magic Metal technical catalog snapshot/1.0' } })
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

const documents = await Promise.all(sitemapUrls.map(fetchSitemap))
const locations = documents.flatMap((document) => [...document.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]))

const groups = sourceGroups.map((group) => {
  const routeSet = new Set(group.routes)
  const sizes = new Set()
  const sourcePages = new Set()

  for (const location of locations) {
    const url = new URL(location)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length !== 3 || parts[0] !== 'price' || !routeSet.has(parts[1])) continue
    const size = decodeURIComponent(parts[2]).replaceAll('х', '×').replaceAll('x', '×').trim()
    if (!size || !/\d/.test(size)) continue
    sizes.add(size)
    sourcePages.add(`${url.origin}/price/${parts[1]}/`)
  }

  if (!sizes.size) throw new Error(`No practical sizes found for ${group.id}`)
  return { ...group, sizes: [...sizes].sort(compareSizes), sourcePages: [...sourcePages].sort() }
})

const now = new Date()
const privateSnapshot = {
  snapshotDate: now.toISOString().slice(0, 10),
  checkedAt: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(now),
  source: 'Публичный sitemap 23met.ru',
  sourceUrl: 'https://23met.ru/sitemap.xml',
  statusRule: 'Размер есть в практическом каталоге 23met.ru, но это не подтверждает текущий остаток. Зелёный статус присваивается только позиции из официального складского прайса.',
  groupCount: groups.length,
  sizeCount: groups.reduce((count, group) => count + group.sizes.length, 0),
  groups,
}

const publicSnapshot = {
  snapshotDate: privateSnapshot.snapshotDate,
  checkedAt: privateSnapshot.checkedAt,
  statusRule: 'Размер присутствует в практическом рыночном предложении, но это не подтверждает текущий остаток. Зелёный статус присваивается только позиции из официального складского прайса.',
  groupCount: privateSnapshot.groupCount,
  sizeCount: privateSnapshot.sizeCount,
  groups: privateSnapshot.groups.map(({ id, title, stockProducts, queries, sizes }) => ({ id, title, stockProducts, queries, sizes })),
}

fs.mkdirSync(path.dirname(privateOutputPath), { recursive: true })
fs.writeFileSync(privateOutputPath, `${JSON.stringify(privateSnapshot, null, 2)}\n`)
fs.writeFileSync(outputPath, `${JSON.stringify(publicSnapshot, null, 2)}\n`)
console.log(`Saved ${publicSnapshot.sizeCount} practical sizes across ${publicSnapshot.groupCount} groups`)
