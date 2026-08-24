import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Позиция каталога', plural: 'Каталог продукции' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'group', 'priority', 'active'],
    group: 'Контент сайта',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'title', label: 'Название', type: 'text', required: true, index: true },
    { name: 'slug', label: 'Адрес страницы', type: 'text', required: true, unique: true, index: true },
    {
      name: 'group', label: 'Товарная группа', type: 'select', required: true, index: true,
      options: [
        { label: 'Трубы электросварные', value: 'electrowelded-pipes' },
        { label: 'Трубы бесшовные', value: 'seamless-pipes' },
        { label: 'Соединительные детали трубопроводов', value: 'pipeline-parts' },
        { label: 'Трубы и фасонные изделия в изоляции', value: 'insulated' },
        { label: 'Листовой и рулонный прокат', value: 'sheet' },
        { label: 'Сортовой и фасонный прокат', value: 'sections' },
        { label: 'Поковки и заготовки', value: 'forgings' },
        { label: 'Нержавеющие и специальные стали', value: 'special-steel' },
        { label: 'Цветной металлопрокат', value: 'non-ferrous' },
        { label: 'Сварочные материалы и метизы', value: 'consumables' },
        { label: 'Оборудование и комплектующие', value: 'equipment' },
      ],
    },
    { name: 'summary', label: 'Краткое описание', type: 'textarea', required: true },
    { name: 'heroImage', label: 'Главное изображение', type: 'upload', relationTo: 'media' },
    { name: 'technicalDrawing', label: 'Техническая схема', type: 'upload', relationTo: 'media' },
    { name: 'gallery', label: 'Исполнения и детали', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'dimensions', label: 'Диапазон размеров', type: 'text' },
    { name: 'standards', label: 'ГОСТ, ТУ, DIN, ASTM', type: 'textarea' },
    { name: 'steelGrades', label: 'Марки стали и материалы', type: 'textarea' },
    {
      name: 'originOptions', label: 'Варианты происхождения', type: 'select', hasMany: true,
      options: [
        { label: 'Россия', value: 'russia' },
        { label: 'СНГ', value: 'cis' },
        { label: 'Китай', value: 'china' },
        { label: 'Другие страны', value: 'other' },
      ],
    },
    { name: 'priority', label: 'Порядок', type: 'number', required: true, defaultValue: 100, index: true },
    { name: 'active', label: 'Опубликовано', type: 'checkbox', defaultValue: true, index: true },
  ],
}
