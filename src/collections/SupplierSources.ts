import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const SupplierSources: CollectionConfig = {
  slug: 'supplier-sources',
  labels: { singular: 'Поставщик', plural: 'Поставщики' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'sourceType', 'lastCheckedAt', 'lastImportStatus', 'enabled'],
    group: 'SaaS · снабжение',
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'name', label: 'Название', type: 'text', required: true, index: true },
    { name: 'code', label: 'Системный код', type: 'text', required: true, unique: true, index: true },
    { name: 'website', label: 'Сайт', type: 'text', required: true },
    {
      name: 'sourceType', label: 'Тип источника', type: 'select', required: true, index: true,
      options: [
        { label: 'Прайс поставщика', value: 'price-file' },
        { label: 'Публичный каталог', value: 'public-catalog' },
        { label: 'Маркетплейс', value: 'marketplace' },
        { label: 'API', value: 'api' },
      ],
    },
    { name: 'enabled', label: 'Использовать при импорте', type: 'checkbox', defaultValue: true, index: true },
    { name: 'publicVisible', label: 'Показывать на публичном сайте', type: 'checkbox', defaultValue: false, admin: { readOnly: true } },
    { name: 'lastCheckedAt', label: 'Последняя проверка', type: 'date', index: true },
    {
      name: 'lastImportStatus', label: 'Статус импорта', type: 'select', defaultValue: 'pending', index: true,
      options: [
        { label: 'Ожидает импорта', value: 'pending' },
        { label: 'Импортирован', value: 'success' },
        { label: 'Частично импортирован', value: 'partial' },
        { label: 'Ошибка', value: 'error' },
      ],
    },
    { name: 'notes', label: 'Служебная заметка', type: 'textarea' },
  ],
}
