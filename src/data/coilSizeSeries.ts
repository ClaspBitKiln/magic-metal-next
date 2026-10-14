import type { SizeSeries } from './sizeSeriesTypes'

// Source URLs are internal provenance and are not rendered in the public UI.
const sourceRoot = 'https://raw.githubusercontent.com/SlyusarVA/metal-site/7e0f80d43ac2721e23b663823fddbc997b2e96de/GOST%20METALL/'
const dimensions = (values: number[]) => values.map((value) => String(value).replace('.', ',')).join('; ')

const hotThicknesses = [1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.2, 3.5, 3.8, 3.9, 4, 4.5, 5, 5.3, 5.5, 6, 6.3, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.7, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 17.5, 18, 18.5, 19, 19.5, 20, 20.5, 21, 21.5, 22, 22.5, 23, 23.5, 24, 24.5, 25]
const hotGroups = [
  { widths: ['500', '530', '600', '630', '1000', '1100', '1250'], thicknesses: hotThicknesses },
  { widths: ['550'], thicknesses: hotThicknesses.filter((value) => value <= 12.7 && value !== 11) },
  { widths: ['650', '670', '700', '(710)', '750', '800', '850', '900', '950', '1400', '(1420)', '1500'], thicknesses: hotThicknesses.filter((value) => value >= 1.5) },
  { widths: ['1600', '1700', '1800'], thicknesses: hotThicknesses.filter((value) => value >= 3) },
  { widths: ['1900', '2000'], thicknesses: [6, 6.3, 7, 7.5, 8, 8.5, 9, 9.5, 10] },
  { widths: ['2100', '2200'], thicknesses: [7, 7.5, 8, 8.5, 9, 9.5, 10] },
]
const numericWidth = (value: string) => Number(value.replace(/[()]/g, ''))
const hotRows = hotGroups.flatMap((group) => group.widths.map((width) => [width, dimensions(group.thicknesses)])).sort((left, right) => numericWidth(left[0]) - numericWidth(right[0]))

const coldThicknesses = [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 2, 2.2, 2.5, 2.8, 3, 3.2, 3.5]
const coldGroups = [
  { widths: [500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1100, 1200, 1250], thicknesses: coldThicknesses, lowCarbon: [] },
  { widths: [1400, 1450, 1500, 1600, 1700], thicknesses: coldThicknesses.filter((value) => value >= 0.55), lowCarbon: [] },
  { widths: [1800], thicknesses: coldThicknesses.filter((value) => value >= 1.1), lowCarbon: [0.7, 0.75, 0.8, 0.9, 1] },
  { widths: [1900, 2000], thicknesses: [2.2, 2.5], lowCarbon: [0.9, 1, 1.1, 1.2, 1.3, 1.4] },
  { widths: [2100, 2200, 2300], thicknesses: [2.2, 2.5], lowCarbon: [] },
]
const coldRows = coldGroups.flatMap((group) => group.widths.map((width) => [String(width), dimensions(group.thicknesses), group.lowCarbon.length ? dimensions(group.lowCarbon) : '—']))

export const coilSizeSeries: SizeSeries[] = [
  {
    categorySlug: 'listovoy-prokat',
    productSlug: 'goryachekatanyj',
    title: 'Размеры горячекатаного рулона',
    standard: 'ГОСТ 19903-2015',
    scope: 'Рулонный прокат: точные сочетания ширины и номинальной толщины таблицы 2. Выберите ширину рулона и толщину из соответствующей строки; размеры листа сюда не перенесены.',
    columns: ['Ширина, мм', 'Толщина, мм'],
    rows: hotRows,
    notes: [
      'Ширина 550 мм имеет отдельный перечень толщин: 11,0 мм в нём не указано. Толщины 5,3; 6,3 и 12,7 мм перечислены именно в таблице рулонов.',
      'Другие размеры допускаются по согласованию изготовителя с потребителем. Марку стали, кромку, точность и технические условия задают отдельно.',
    ],
    source: { label: 'ГОСТ 19903-2015, таблица 2, страница PDF 5', url: `${sourceRoot}GOST-19903_15.pdf` },
  },
  {
    categorySlug: 'listovoy-prokat',
    productSlug: 'holodnokatanyj',
    title: 'Размеры холоднокатаного рулона',
    standard: 'ГОСТ 19904-90',
    scope: 'Сочетания ширины и номинальной толщины рулонов по справочному приложению 2, таблице 10. Толщины в колонке со звёздочкой допускаются только для низкоуглеродистых марок стали.',
    columns: ['Ширина, мм', 'Толщина, мм', 'Толщина*, мм'],
    rows: coldRows,
    notes: [
      '* Только для низкоуглеродистых марок стали: дополнительные толщины в последней колонке.',
      'Приложение 2 имеет справочный статус. Толщины перечислены номиналами таблицы 1 внутри интервалов таблицы 10.',
      'При заказе рулонов длина не оговаривается: развёрнутая длина рулона стандартом не регламентируется. Внутренний диаметр — 500–1000 мм, масса — 1,5–20 т.',
      'Марку стали, поверхность, способность к вытяжке, точность и кромку указывают отдельно.',
    ],
    source: { label: 'ГОСТ 19904-90, таблица 1; справочное приложение 2, таблица 10; пункты 15–16; страницы PDF 1, 4 и 6', url: `${sourceRoot}GOST_19904_90.pdf` },
  },
]
