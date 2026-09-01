import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const SupplierOffers: CollectionConfig = {
  slug: 'supplier-offers',
  labels: { singular: 'Предложение поставщика', plural: 'Предложения поставщиков' },
  admin: {
    useAsTitle: 'product',
    defaultColumns: ['supplier', 'product', 'size', 'price', 'availability', 'observedAt'],
    group: 'SaaS · снабжение',
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'supplier', label: 'Поставщик', type: 'relationship', relationTo: 'supplier-sources', required: true, index: true },
    { name: 'externalKey', label: 'Ключ источника', type: 'text', required: true, unique: true, index: true },
    { name: 'category', label: 'Категория', type: 'text', index: true },
    { name: 'product', label: 'Номенклатура', type: 'text', required: true, index: true },
    { name: 'designation', label: 'Марка / исполнение', type: 'text', index: true },
    { name: 'size', label: 'Размер', type: 'text', required: true, index: true },
    { name: 'diameter', label: 'Диаметр / профиль', type: 'text', index: true },
    { name: 'wall', label: 'Толщина стенки', type: 'text', index: true },
    { name: 'standard', label: 'ГОСТ / ТУ', type: 'text', index: true },
    { name: 'price', label: 'Цена', type: 'number' },
    { name: 'currency', label: 'Валюта', type: 'select', defaultValue: 'RUB', options: ['RUB', 'USD', 'EUR', 'UZS', 'KZT', 'CNY'] },
    { name: 'unit', label: 'Единица цены', type: 'text' },
    {
      name: 'availability', label: 'Сигнал наличия', type: 'select', required: true, index: true,
      options: [
        { label: 'Подтверждено прайсом', value: 'price-confirmed' },
        { label: 'Есть в рыночном каталоге', value: 'market-listed' },
        { label: 'Под заказ', value: 'on-request' },
        { label: 'Неактуально', value: 'inactive' },
      ],
    },
    { name: 'sourceUrl', label: 'Исходная страница', type: 'text' },
    { name: 'observedAt', label: 'Дата проверки', type: 'date', required: true, index: true },
    { name: 'raw', label: 'Исходные данные', type: 'json', admin: { hidden: true } },
    { name: 'active', label: 'Учитывать в SaaS', type: 'checkbox', defaultValue: true, index: true },
  ],
}
