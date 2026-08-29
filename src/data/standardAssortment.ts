export type MarketSignal = 'green' | 'yellow' | 'red'

export type AssortmentRow = {
  size: string
  note: string
  signal: MarketSignal
}

export type StandardAssortment = {
  dimensionLabel: string
  rows: AssortmentRow[]
}

export const marketSources = [
  { label: 'МЕТАЛЛСЕРВИС', href: 'https://mc.ru/' },
  { label: 'ЕВРАЗ Маркет', href: 'https://evraz.market/metalloprokat/' },
  { label: 'Металлоторг', href: 'https://www.metallotorg.ru/' },
  { label: 'СПК', href: 'https://www.spk.ru/catalog/catalog/' },
  { label: 'Северсталь Маркет', href: 'https://market.severstal.com/ru/ru' },
  { label: 'ММК Маркет', href: 'https://market.mmk.ru/catalog/' },
  { label: '23met', href: 'https://www.23met.ru/' },
  { label: 'e-metall', href: 'https://e-metall.ru/' },
  { label: 'УМПЦ', href: 'https://uralmpc.ru/' },
] as const

export const referenceSources = [
  { label: 'ФГИС Росстандарта', href: 'https://protect.gost.ru/' },
  { label: 'MetalLine', href: 'https://metalline.ru/catalog/' },
  { label: 'ПМ СМК', href: 'https://www.pmsmk.ru/' },
  { label: 'УАЗ-74', href: 'https://uaz74.ru/' },
] as const

export const standardAssortments: Record<string, StandardAssortment> = {
  'gost-8732-2025': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '57×3,5 · 76×4 · 89×4', note: 'типовые складские позиции', signal: 'green' },
      { size: '108×4 · 133×4,5 · 159×6', note: 'часто представлены в открытых каталогах', signal: 'green' },
      { size: '219×8 · 273×8 · 325×10', note: 'наличие зависит от марки и региона', signal: 'yellow' },
      { size: '377×12 · 426×12', note: 'чаще запрашиваются под заказ', signal: 'yellow' },
      { size: '500×30 · 530×40 · 550×50', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-8734-75': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '8×1 · 10×1 · 12×1', note: 'типовые малые диаметры', signal: 'green' },
      { size: '16×1,5 · 20×2 · 25×2,5', note: 'часто представлены в каталогах', signal: 'green' },
      { size: '32×3 · 38×3 · 45×3,5 · 57×4', note: 'распространённый промышленный ряд', signal: 'green' },
      { size: '76×6 · 89×8 · 108×10', note: 'ограниченное открытое наличие', signal: 'yellow' },
      { size: '140×14 · 168×18 · 193×24', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-10704-91': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '20×2 · 25×2 · 32×2 · 40×2', note: 'массовые складские позиции', signal: 'green' },
      { size: '57×3 · 76×3 · 89×3,5 · 108×4', note: 'широко представлены в каталогах', signal: 'green' },
      { size: '159×4,5 · 219×6 · 325×8', note: 'наличие зависит от региона', signal: 'yellow' },
      { size: '426×10 · 530×8 · 630×10', note: 'преимущественно проектная поставка', signal: 'yellow' },
      { size: '820×10 · 1020×12 · 1420×16', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-17375-2001': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '57×3,5 · 76×4 · 89×4 · 108×4', note: 'ходовые отводы 90°', signal: 'green' },
      { size: '159×6 · 219×8', note: 'регулярное открытое предложение', signal: 'green' },
      { size: '273×10 · 325×12', note: 'наличие и угол требуют проверки', signal: 'yellow' },
      { size: '426×16 · 530×18', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-30753-2001': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '57×3,5 · 76×4 · 89×4 · 108×4', note: 'ходовые отводы 2D', signal: 'green' },
      { size: '159×6 · 219×8', note: 'представлены у нескольких поставщиков', signal: 'yellow' },
      { size: '273×10 · 325×12 · 426×16', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-17376-2001': {
    dimensionLabel: 'Корпус × ответвление, мм',
    rows: [
      { size: '57×57 · 89×89 · 108×108', note: 'ходовые равнопроходные тройники', signal: 'green' },
      { size: '159×108 · 219×159 · 273×219', note: 'наличие зависит от исполнения', signal: 'yellow' },
      { size: '325×273 · 426×325', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-17378-2001': {
    dimensionLabel: 'Больший × меньший диаметр, мм',
    rows: [
      { size: '57×38 · 76×57 · 89×57 · 108×76', note: 'ходовые концентрические переходы', signal: 'green' },
      { size: '159×108 · 219×159 · 273×219', note: 'наличие зависит от стенок и типа', signal: 'yellow' },
      { size: '325×273 · 426×325', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-17379-2001': {
    dimensionLabel: 'Наружный диаметр × стенка, мм',
    rows: [
      { size: '57×3,5 · 89×4 · 108×4', note: 'ходовые заглушки', signal: 'green' },
      { size: '159×6 · 219×8 · 273×10', note: 'наличие требует проверки', signal: 'yellow' },
      { size: '325×12 · 426×16', note: 'не найдено в открытом складском предложении', signal: 'red' },
    ],
  },
  'gost-33259-2015': {
    dimensionLabel: 'Номинальный диаметр и давление',
    rows: [
      { size: 'DN 15–100 · PN 6–16', note: 'широкое складское предложение', signal: 'green' },
      { size: 'DN 125–300 · PN 16–40', note: 'исполнение и поверхность уточняются', signal: 'yellow' },
      { size: 'DN 350–800 · PN 63–160', note: 'преимущественно заказное изготовление', signal: 'red' },
    ],
  },
}

export const assortmentCheckedAt = 'пилотная проверка · 29 августа 2026'
