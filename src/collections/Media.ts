import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Медиафайл', plural: 'Медиафайлы' },
  admin: { useAsTitle: 'alt', group: 'Контент сайта', defaultColumns: ['alt', 'role', 'rights'] },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    { name: 'caption', label: 'Подпись под изображением', type: 'textarea' },
    {
      name: 'role', label: 'Назначение', type: 'select', required: true, defaultValue: 'product-photo', index: true,
      options: [
        { label: 'Главное фото страницы', value: 'hero' },
        { label: 'Фото продукции', value: 'product-photo' },
        { label: 'Техническая схема', value: 'technical-drawing' },
        { label: 'Материал / поверхность', value: 'material' },
        { label: 'Применение / отрасль', value: 'application' },
        { label: 'Логистика / регион', value: 'logistics' },
        { label: 'Инфографика', value: 'infographic' },
      ],
    },
    {
      name: 'rights', label: 'Право использования', type: 'select', required: true, defaultValue: 'owned', index: true,
      options: [
        { label: 'Собственное изображение', value: 'owned' },
        { label: 'Разрешено партнёром / изготовителем', value: 'partner-approved' },
        { label: 'Лицензионный фотобанк', value: 'licensed' },
        { label: 'Создано компанией / AI', value: 'generated' },
      ],
    },
    { name: 'credit', label: 'Автор / правообладатель', type: 'text' },
    { name: 'sourceUrl', label: 'Источник или подтверждение лицензии', type: 'text' },
    { name: 'technicalVerified', label: 'Техническое соответствие проверено', type: 'checkbox', defaultValue: false },
  ],
  upload: {
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'card', width: 720, height: 480, position: 'centre', formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'hero', width: 1600, height: 1067, position: 'centre', formatOptions: { format: 'webp', options: { quality: 82 } } },
    ],
  },
}
