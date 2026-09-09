export type SupplierCapabilityEvidence = 'official-catalog' | 'official-stock' | 'official-company-doc'

export type SupplierCapabilityMapItem = {
  supplierCode: string
  role: 'factory' | 'trading' | 'reference' | 'market-signal'
  productFamily: string
  productTypes: string[]
  geometry: string
  grades: string[]
  standards: string[]
  capabilityStatus: 'verified' | 'discovery'
  evidence: SupplierCapabilityEvidence
  sourceUrl: string
  checkedAt: string
  notes?: string
}

/**
 * Internal-only capability seeds. Supplier identity is never rendered in the public catalog.
 * CAPABILITY is deliberately separate from OFFER and current AVAILABILITY.
 */
export const supplierCapabilityMap: SupplierCapabilityMapItem[] = [
  {
    supplierCode: 'KUMZ',
    role: 'factory',
    productFamily: 'Алюминий и магниевые сплавы',
    productTypes: ['листы', 'плиты', 'прокат', 'прессовые профили', 'трубы', 'прутки', 'поковки', 'заготовки теплообменников', 'специальные сплавы', 'резка и черновая мехобработка'],
    geometry: 'Листы 0,3–8 мм; плиты 10–400 мм; профиль/труба/пруток — по заводской номенклатуре и заявке; отдельные позиции имеют складское наличие',
    grades: ['алюминиевые и магниевые сплавы; в официальном каталоге присутствуют, в частности, 1201, 1561, 2014A, 2024, 5005A, 5083, 6061, 7050, 7075, А5, АМГ6, В95, Д16 и др.'],
    standards: ['ГОСТ 17232-2023', 'ГОСТ 21488-2025', 'EN', 'ASTM', 'JIS'],
    capabilityStatus: 'verified',
    evidence: 'official-catalog',
    sourceUrl: 'https://www.kumz.ru/products/',
    checkedAt: '2026-09-09',
    notes: 'Официальный сайт заявляет более 70 тыс. наименований из 150 алюминиевых и магниевых сплавов. Отдельно опубликован официальный список продукции в наличии; наличие требует отдельной проверки по позиции.',
  },
  {
    supplierCode: 'KUMZ',
    role: 'factory',
    productFamily: 'Алюминиевые листы и плиты',
    productTypes: ['лист', 'плита'],
    geometry: 'Лист 0,3–8 мм; ширина 1200–2600 мм; длина 2000–12000 мм. Плита 10–400 мм; ширина 1200–4100 мм; длина 2000–32000 мм.',
    grades: ['серии 1xxx, 2xxx, 3xxx, 5xxx, 6xxx, 7xxx'],
    standards: ['EN', 'ASTM', 'JIS', 'ГОСТ на конкретную марку/полуфабрикат'],
    capabilityStatus: 'verified',
    evidence: 'official-catalog',
    sourceUrl: 'https://www.kumz.ru/en/products/prokatnaya-produktsiya/list/',
    checkedAt: '2026-09-09',
    notes: 'Точные марки, состояния и формат фиксируются из конкретной заводской спецификации.'
  },
  {
    supplierCode: 'KUMZ',
    role: 'factory',
    productFamily: 'Алюминий-литиевые сплавы',
    productTypes: ['профили', 'трубы', 'прутки', 'листы', 'плиты'],
    geometry: 'Профили/трубы/прутки со стенкой от 1,5 мм; стандартная длина 3000 мм. Листы 0,3–10 мм; плиты 12–55 мм; размеры зависят от сплава.',
    grades: ['1420', '1421', '1424', '1430', '1440', '1441', '1450', '1451', '1460', '1461', '1464'],
    standards: ['заводская спецификация; применимый стандарт по продукту'],
    capabilityStatus: 'verified',
    evidence: 'official-catalog',
    sourceUrl: 'https://www.kumz.ru/en/products/spetsialnye-splavy/alyuminiy-litievye-splavy/',
    checkedAt: '2026-09-09',
  },
  {
    supplierCode: 'EVRAZ',
    role: 'factory',
    productFamily: 'Инфраструктурная и трубная сталь',
    productTypes: ['сортовой прокат', 'рельсы', 'балки', 'арматура', 'катанка', 'крупносортный/листовой прокат', 'трубная продукция', 'полуфабрикаты', 'ванадийсодержащая продукция'],
    geometry: 'Диапазоны определяются конкретным заводом, продуктом и рынком; для точного D×S/профиля требуется заводской каталог.',
    grades: ['углеродистые и легированные стали; конкретная марка по продукту и заводу'],
    standards: ['ГОСТ/ТУ/международные стандарты по конкретному продукту'],
    capabilityStatus: 'verified',
    evidence: 'official-company-doc',
    sourceUrl: 'https://ar2021.evraz.com/en/strategic-report/business-review/steel-segment',
    checkedAt: '2026-09-09',
    notes: 'Официальный материал подтверждает широкие группы: construction, railway, tubular, industrial, semi-finished and vanadium products. Точные D×S нельзя выводить из этого общего материала.'
  },
  {
    supplierCode: 'NLMK',
    role: 'factory',
    productFamily: 'Плоский стальной прокат',
    productTypes: ['горячекатаная сталь', 'холоднокатаная сталь', 'оцинкованный прокат', 'окрашенный прокат', 'электротехническая сталь'],
    geometry: 'Размерные диапазоны и марки зависят от конкретной продуктовой линейки; для точного размера использовать официальный каталог/портал клиента.',
    grades: ['по конкретной продуктовой линейке NLMK'],
    standards: ['ГОСТ/EN/ASTM и другие применимые НД по продукту'],
    capabilityStatus: 'verified',
    evidence: 'official-catalog',
    sourceUrl: 'https://nlmk.com/en/products/',
    checkedAt: '2026-09-09',
    notes: 'Официальный каталог подтверждает hot-rolled, cold-rolled, hot-dip galvanized, pre-painted, electrical steel и полуфабрикаты.'
  },
  {
    supplierCode: 'MECHEL',
    role: 'factory',
    productFamily: 'Сортовой и листовой прокат',
    productTypes: ['арматура', 'калиброванный прокат', 'круглый прокат', 'катанка', 'балки', 'швеллеры', 'рельсы', 'листовой прокат', 'плиты'],
    geometry: 'Размерные диапазоны задаются заводским каталогом по конкретному профилю/марке; не выводить из общего корпоративного описания.',
    grades: ['углеродистые и легированные стали по продуктовой линейке'],
    standards: ['ГОСТ/ТУ и иные стандарты по конкретному продукту'],
    capabilityStatus: 'verified',
    evidence: 'official-company-doc',
    sourceUrl: 'https://mechel.com/upload/iblock/7ca/7ca0c375c51d12adc8df55c1b69ae5bc.pdf',
    checkedAt: '2026-09-09',
    notes: 'Официальная презентация группы подтверждает long steel и flat steel products и производство на ЧМК, Ижстали и Белорецком МК.'
  },
]
