import { getPayload } from 'payload'
import config from './payload.config'

const products = [
  { title: 'Трубы электросварные', slug: 'truby-elektrosvarnye', group: 'electrowelded-pipes', summary: 'Прямошовные, спиралешовные и водогазопроводные трубы.', dimensions: 'Ø 15–1420 мм; обечайки до 3500 мм', standards: 'ГОСТ 3262, 10704, 10705, 10706, 20295', steelGrades: 'Ст3, 20, 09Г2С, 17Г1СУ, 10Г2ФБЮ', priority: 10 },
  { title: 'Трубы бесшовные горячедеформированные', slug: 'truby-besshovnye-goryachedeformirovannye', group: 'seamless-pipes', summary: 'Трубы общего и специального назначения, включая котельное и крекинговое исполнение.', dimensions: 'По действующему сортаменту', standards: 'ГОСТ 8731-2025, 8732-2025, 550-2020; ТУ 14-3Р-55', steelGrades: '10, 20, 35, 45, 09Г2С, 15ХМ, 12Х1МФ, 15Х1М1Ф', priority: 20 },
  { title: 'Трубы бесшовные холоднодеформированные', slug: 'truby-besshovnye-holodnodeformirovannye', group: 'seamless-pipes', summary: 'Холодно- и теплодеформированные трубы, включая прецизионные исполнения.', dimensions: 'По действующему сортаменту', standards: 'ГОСТ 8733-74, 8734-75, 9567-75, 550-2020', steelGrades: '10, 20, 35, 45, 10Г2, 15Х, 20Х, 40Х, 15ХМ', priority: 21 },
  { title: 'Трубы нержавеющие и коррозионностойкие', slug: 'truby-nerzhaveyushchie', group: 'seamless-pipes', summary: 'Бесшовные и сварные трубы из коррозионностойких сталей.', dimensions: 'Ø 5–273 мм', standards: 'ГОСТ 9940, 9941; ASTM A312', steelGrades: '08Х18Н10, 12Х18Н10Т, 10Х17Н13М2Т, TP304, TP316, TP321', priority: 22 },
  { title: 'Соединительные детали трубопроводов', slug: 'sdt', group: 'pipeline-parts', summary: 'Отводы, переходы, тройники, фланцы, заглушки и днища.', dimensions: 'По стандарту и спецификации', standards: 'ГОСТ 17375-2001, 17376-2001, 17378-2001, 17379-2001, 30753-2001, 33259-2015', steelGrades: 'Углеродистые, низколегированные, жаропрочные и нержавеющие стали', priority: 30 },
  { title: 'Трубы и фасонные изделия в изоляции', slug: 'truby-i-sdt-v-izolyacii', group: 'insulated', summary: 'Комплектные поставки труб и фасонных деталей с заводской изоляцией.', dimensions: 'По проекту', standards: 'ППУ, ВУС, ЦПП, эпоксидные системы', steelGrades: 'Подбираются по рабочей среде и проектной документации', priority: 40 },
  { title: 'Лист холоднокатаный', slug: 'list-holodnokatanyj', group: 'sheet', summary: 'Холоднокатаный листовой прокат.', dimensions: '0,3–3 мм', standards: 'ГОСТ 19904-90, ГОСТ 16523-89', steelGrades: 'Ст08пс, Ст08кп', priority: 100 },
  { title: 'Лист горячекатаный', slug: 'list-goryachekatanyj', group: 'sheet', summary: 'Горячекатаный лист для промышленного применения.', dimensions: '2–200 мм', standards: 'ГОСТ 19903-2015, 14637-89, 19281-89, 5520-2017', steelGrades: 'Ст3, 09Г2С, 20, 45, С245, С255, С345 и другие', priority: 101 },
  { title: 'Лист нержавеющий', slug: 'list-nerzhaveyushchij', group: 'special-steel', summary: 'Лист из коррозионностойких и жаропрочных сталей.', dimensions: '3–200 мм', standards: 'ГОСТ 5582-75, 5632-2014, 7350-77, ASTM', steelGrades: '08Х18Н10, 12Х18Н10Т, AISI 304, 316L, 321 и другие', priority: 102 },
  { title: 'Рулонная сталь оцинкованная', slug: 'rulonnaya-stal-ocinkovannaya', group: 'sheet', summary: 'Оцинкованная рулонная сталь.', dimensions: 'По спецификации', standards: 'ГОСТ 14918-2020', steelGrades: '08пс, 08сп', priority: 103 },
  { title: 'Круг горячекатаный', slug: 'krug-goryachekatanyj', group: 'sections', summary: 'Круг из конструкционных, инструментальных и специальных сталей.', dimensions: 'Ø 8–300 мм', standards: 'ГОСТ 2590-88, ГОСТ 535-88, ТУ', steelGrades: '10, 20, 35, 40, 45, 09Г2С, 40Х, 30ХГСА и другие', priority: 110 },
  { title: 'Квадрат', slug: 'kvadrat', group: 'sections', summary: 'Стальной квадрат горячекатаный и калиброванный.', dimensions: '6–200 мм', standards: 'ГОСТ 2591-2006, ГОСТ 8559-75', steelGrades: 'Ст0–Ст6, 20, 09Г2С, 45', priority: 111 },
  { title: 'Поковки', slug: 'pokovki', group: 'forgings', summary: 'Поковки и заготовки по стандартам и чертежам.', dimensions: 'Ø 40–1500+ мм', standards: 'ГОСТ 8479-70, 7829-70, 25054-81, 1133-71, 4400-85, 19200-80', steelGrades: 'Углеродистые, легированные, нержавеющие и специальные стали', priority: 120 },
  { title: 'Уголок', slug: 'ugolok', group: 'sections', summary: 'Равнополочный, неравнополочный и гнутый уголок.', dimensions: 'По сортаменту', standards: 'ГОСТ 8509-93, 8510-86, 19771-93, 19772-93, ТУ', steelGrades: 'Ст3, 09Г2С, С245, С255, С355', priority: 130 },
  { title: 'Балка двутавровая', slug: 'balka-dvutavrovaya', group: 'sections', summary: 'Двутавровые балки для строительства и промышленности.', dimensions: 'По сортаменту', standards: 'ГОСТ 8239-89, ГОСТ Р 57837-2017, СТО АСЧМ 20-93', steelGrades: 'С235–С375, Ст3, 09Г2С', priority: 131 },
  { title: 'Швеллер', slug: 'shveller', group: 'sections', summary: 'Стальной горячекатаный швеллер.', dimensions: 'По сортаменту', standards: 'ГОСТ 8240-97', steelGrades: 'С235–С375, Ст3, 09Г2С', priority: 132 },
  { title: 'Днища и заглушки', slug: 'dnishcha-i-zaglushki', group: 'pipeline-parts', summary: 'Детали для герметизации концевых участков трубопроводов и аппаратов.', dimensions: 'По спецификации', standards: 'ГОСТ 6533-78', steelGrades: 'Углеродистые, низколегированные, жаропрочные и нержавеющие стали', priority: 140 },
  { title: 'Цветной металлопрокат', slug: 'cvetnoj-metalloprokat', group: 'non-ferrous', summary: 'Цветной прокат различного фасона.', dimensions: 'По спецификации', standards: 'ГОСТ, ТУ, международные стандарты', steelGrades: 'Титан, олово, латунь, медь, бронза, алюминий', priority: 150 },
  { title: 'Сварочные материалы', slug: 'svarochnye-materialy', group: 'consumables', summary: 'Сварочная проволока и электроды.', dimensions: 'По запросу', standards: 'ГОСТ, ТУ', steelGrades: 'По условиям сварки и основному металлу', priority: 160 },
  { title: 'Метизная продукция', slug: 'metizy', group: 'consumables', summary: 'Болты, гайки, шайбы и другой крепёж.', dimensions: 'По спецификации', standards: 'ГОСТ, ТУ, DIN', steelGrades: 'Углеродистые, легированные и нержавеющие стали', priority: 161 },
  { title: 'Промышленное оборудование', slug: 'oborudovanie', group: 'equipment', summary: 'Оборудование по техническому заданию заказчика.', dimensions: 'По запросу', standards: 'По проектной документации', steelGrades: 'По запросу', priority: 170 },
  { title: 'Материалы, детали и комплектующие', slug: 'materialy-detali-komplektuyushchie', group: 'equipment', summary: 'Нестандартные материалы, детали, запчасти, комплектующие и грузы.', dimensions: 'По запросу', standards: 'По техническому заданию', steelGrades: 'По запросу', priority: 171 },
]

async function seed() {
  const payload = await getPayload({ config })
  for (const product of products) {
    const existing = await payload.find({ collection: 'products', where: { slug: { equals: product.slug } }, limit: 1 })
    if (existing.docs.length) continue
    await payload.create({ collection: 'products', data: { ...product, group: product.group as never, originOptions: ['russia', 'cis', 'china', 'other'] } })
  }
  console.log(`Seed complete: ${products.length} catalog entries checked.`)
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
