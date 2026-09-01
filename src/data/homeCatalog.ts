import { pipeCatalog } from '@/data/pipeCatalog'
import { productDetailCatalog } from '@/data/productDetailCatalog'

export type HomeCatalogItem = {
  title: string
  size: string
  standards: string
  grades: string
  href: string
  availabilityQuery: string
  requestOnly?: boolean
  practicalSeries?: boolean
}

export type HomeCatalogGroup = {
  title: string
  note: string
  items: HomeCatalogItem[]
}

const requestOnlyQueries = new Set([
  'Котельные и крекинговые',
  'Нефтяного сортамента',
  'Титан',
  'Олово',
  'Свинец',
  'Цинк',
  'Нихром',
  'Баббит',
  'Кольца и диски',
  'Валы и оси',
  'Поковки по чертежу',
  'Проволока и электроды',
  'ППУ-изоляция',
  'ВУС-изоляция',
  'Цементно-песчаное покрытие',
  'Эпоксидное покрытие',
  'СДТ в изоляции',
  'Оборудование и комплектующие',
])

const practicalSeriesQueries = new Set([
  'Электросварные прямошовные и спиралешовные',
  'Водогазопроводные',
  'Профильные квадратные и прямоугольные',
  'Бесшовные горячедеформированные',
  'Бесшовные холоднодеформированные',
  'Отводы бесшовные',
  'Тройники бесшовные',
  'Переходы бесшовные',
  'Фланцы',
  'Заглушки и днища',
  'Лист и рулон горячекатаный',
  'Лист и рулон холоднокатаный',
  'Оцинкованный прокат',
  'Круг',
  'Квадрат',
  'Полоса',
  'Уголок',
  'Балка двутавровая',
  'Швеллер',
  'Крепёж',
])

const catalogItem = (item: Omit<HomeCatalogItem, 'requestOnly' | 'practicalSeries'>): HomeCatalogItem => ({
  ...item,
  requestOnly: requestOnlyQueries.has(item.availabilityQuery),
  practicalSeries: practicalSeriesQueries.has(item.availabilityQuery),
})

const pipeItems: HomeCatalogItem[] = [
  catalogItem({ title: 'Электросварные прямошовные и спиралешовные', size: 'Ø 15–1420 мм', standards: 'ГОСТ 10704, 10705, 10706, 20295', grades: 'Ст3, 20, 09Г2С, 17Г1СУ, 10Г2ФБЮ', href: '/produkciya/truby-elektrosvarnye', availabilityQuery: 'Электросварные прямошовные и спиралешовные' }),
  catalogItem({ title: 'Водогазопроводные', size: 'Ду 10–100', standards: 'ГОСТ 3262-75', grades: 'малоуглеродистые стали', href: '/produkciya/truby-elektrosvarnye/vodogazoprovodnye', availabilityQuery: 'Водогазопроводные' }),
  catalogItem({ title: 'Профильные квадратные и прямоугольные', size: '15×15–400×200 мм', standards: 'ГОСТ 8639, 8645, 30245', grades: 'Ст3, 09Г2С, С245, С255, С355', href: '/produkciya/truby-elektrosvarnye/profilnye', availabilityQuery: 'Профильные квадратные и прямоугольные' }),
  catalogItem({ title: 'Бесшовные горячедеформированные', size: 'Ø 57–550 мм', standards: 'ГОСТ 8732, ГОСТ 550; ТУ 14-3Р-55, 460, 1128', grades: '10, 20, 35, 45, 09Г2С, 15ХМ, 12Х1МФ, 15Х1М1Ф, 10Х9МФБ', href: '/produkciya/truby-besshovnye/goryachedeformirovannye', availabilityQuery: 'Бесшовные горячедеформированные' }),
  catalogItem({ title: 'Бесшовные холоднодеформированные', size: 'Ø 5–193 мм', standards: 'ГОСТ 8734', grades: '10, 20, 35, 45, 10Г2, 15Х, 20Х, 40Х, 30ХГСА, 15ХМ', href: '/produkciya/truby-besshovnye/holodnodeformirovannye', availabilityQuery: 'Бесшовные холоднодеформированные' }),
  catalogItem({ title: 'Котельные и крекинговые', size: 'По спецификации', standards: 'ТУ 14-3Р-55; ГОСТ 550; ASTM A335', grades: '20, 15ХМ, 12Х1МФ, 15Х1М1Ф, P5, P11, P22, P91', href: '/produkciya/truby-besshovnye/kotelnye', availabilityQuery: 'Котельные и крекинговые' }),
  catalogItem({ title: 'Нержавеющие и коррозионностойкие', size: 'Ø 5–273 мм', standards: 'ГОСТ 9940, 9941; ASTM A312', grades: '08Х18Н10, 12Х18Н10Т, 10Х17Н13М2Т, TP304, TP316, TP321', href: '/produkciya/truby-besshovnye/nerzhaveyushchie', availabilityQuery: 'Нержавеющие трубы' }),
  catalogItem({ title: 'Нефтяного сортамента', size: 'По проекту', standards: 'ГОСТ 632, 633; API 5CT', grades: 'НКТ, обсадные, бурильные трубы и муфты', href: '/produkciya/truby-besshovnye', availabilityQuery: 'Нефтяного сортамента' }),
]

const sdtItems: HomeCatalogItem[] = [
  catalogItem({ title: 'Отводы бесшовные', size: 'DN 15–1000', standards: 'ГОСТ 17375, 30753, 17380', grades: '2D и 3D · углеродистые, низколегированные и нержавеющие стали', href: '/produkciya/sdt/otvody-besshovnye', availabilityQuery: 'Отводы бесшовные' }),
  catalogItem({ title: 'Тройники бесшовные', size: 'DN 15–500', standards: 'ГОСТ 17376, 17380', grades: 'равнопроходные и переходные исполнения', href: '/produkciya/sdt/troyniki-besshovnye', availabilityQuery: 'Тройники бесшовные' }),
  catalogItem({ title: 'Переходы бесшовные', size: 'DN 20–500', standards: 'ГОСТ 17378, 17380', grades: 'концентрические и эксцентрические исполнения', href: '/produkciya/sdt/perekhody-besshovnye', availabilityQuery: 'Переходы бесшовные' }),
  catalogItem({ title: 'Фланцы', size: 'DN 10–4000', standards: 'ГОСТ 33259', grades: 'плоские, воротниковые, свободные · PN 1–250', href: '/produkciya/sdt/flantsy', availabilityQuery: 'Фланцы' }),
  catalogItem({ title: 'Заглушки и днища', size: 'По стандарту и чертежу', standards: 'ГОСТ 17379, 6533; ОСТ, АТК', grades: 'эллиптические, плоские и специальные исполнения', href: '/produkciya/sdt/zaglushki-i-dnishcha', availabilityQuery: 'Заглушки и днища' }),
]

const detailGroupDefinitions = [
  { title: 'Листовой и рулонный прокат', note: 'Горячекатаный, холоднокатаный, оцинкованный и прокат с покрытиями', categorySlug: 'listovoy-prokat' },
  { title: 'Сортовой и фасонный прокат', note: 'Арматура, круг, квадрат, полоса, уголок, балка и швеллер', categorySlug: 'sortovoy-i-fasonny-prokat' },
  { title: 'Нержавеющие и специальные стали', note: 'Лист, трубы, сортовой прокат и специальные марки', categorySlug: 'nerzhaveyushchaya-stal' },
  { title: 'Поковки и заготовки', note: 'Кольца, диски, валы, оси и поковки по чертежу', categorySlug: 'pokovki-i-zagotovki' },
  { title: 'Цветной металлопрокат', note: 'Алюминий и дюраль; медь, бронза и латунь; титан; олово; свинец; цинк; нихром; баббит', categorySlug: 'cvetnye-metally' },
  { title: 'Метизы и сварочные материалы', note: 'Крепёж, сетка, лента, проволока, электроды и расходные материалы', categorySlug: 'metizy-i-svarochnye-materialy' },
] as const

const hiddenDetailSlugs = new Set(['krug-i-kvadrat', 'balka-shveller-ugolok'])

const detailGroups: HomeCatalogGroup[] = detailGroupDefinitions.map((group) => ({
  title: group.title,
  note: group.note,
  items: productDetailCatalog
    .filter((item) => item.categorySlug === group.categorySlug && !hiddenDetailSlugs.has(item.slug))
    .map((item) => catalogItem({
      title: item.shortTitle,
      size: item.range.map((entry) => entry.value).join(' · '),
      standards: item.standards.join(' · '),
      grades: item.grades.join(' · '),
      href: `/produkciya/${item.categorySlug}/${item.slug}`,
      availabilityQuery: item.shortTitle,
    })),
}))

const insulatedItems = pipeCatalog
  .filter((item) => item.categorySlug === 'truby-i-sdt-v-izolyacii')
  .map((item) => catalogItem({
    title: item.shortTitle,
    size: item.range.map((entry) => entry.value).join(' · '),
    standards: item.standards.join(' · '),
    grades: item.grades.join(' · '),
    href: `/produkciya/${item.categorySlug}/${item.slug}`,
    availabilityQuery: item.shortTitle,
  }))

export const homeCatalogGroups: HomeCatalogGroup[] = [
  { title: 'Трубы', note: 'Электросварные, бесшовные, профильные, котельные, нержавеющие и нефтяного сортамента', items: pipeItems },
  { title: 'СДТ', note: 'Отводы, тройники, переходы, фланцы, заглушки и днища', items: sdtItems },
  { title: 'Трубы и СДТ в изоляции', note: 'ППУ, ВУС, ЦПП и эпоксидные покрытия заводского нанесения', items: insulatedItems },
  ...detailGroups,
  {
    title: 'Оборудование и комплектующие',
    note: 'Промышленное оборудование, детали и нестандартные позиции по техническому заданию',
    items: [catalogItem({
      title: 'Оборудование и комплектующие',
      size: 'По техническому заданию',
      standards: 'По проекту и ТУ изготовителя',
      grades: 'Исполнение и комплектность по заявке',
      href: '/?product=komplektuyushchie#request',
      availabilityQuery: 'Оборудование и комплектующие',
    })],
  },
]

export const homeCatalogItemCount = homeCatalogGroups.reduce((count, group) => count + group.items.length, 0)
