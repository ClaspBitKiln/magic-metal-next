import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const DealResults: CollectionConfig = {
  slug: 'deal-results',
  labels: { singular: 'Фактический результат сделки', plural: 'Фактические результаты сделок' },
  admin: {
    useAsTitle: 'request',
    defaultColumns: ['request', 'result', 'actualSellingTotal', 'actualGrossProfit', 'recordedAt'],
    group: 'Заявки',
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [
    { name: 'request', label: 'Заявка', type: 'relationship', relationTo: 'requests', required: true, unique: true, index: true },
    {
      name: 'result', label: 'Результат', type: 'select', required: true, index: true,
      options: [
        { label: 'Выиграна', value: 'won' },
        { label: 'Проиграна', value: 'lost' },
        { label: 'Отменена', value: 'cancelled' },
      ],
    },
    { name: 'lossReason', label: 'Причина проигрыша / отмены', type: 'text' },
    { name: 'quoteTotal', label: 'Сумма КП', type: 'number' },
    { name: 'actualSellingTotal', label: 'Фактическая сумма продажи', type: 'number' },
    { name: 'currency', label: 'Валюта', type: 'select', defaultValue: 'RUB', options: ['RUB', 'USD', 'EUR', 'UZS', 'KZT', 'CNY'] },
    { name: 'actualPurchaseCost', label: 'Фактическая закупочная стоимость', type: 'number' },
    { name: 'actualLogisticsCost', label: 'Фактическая логистика', type: 'number' },
    { name: 'actualLandedCost', label: 'Фактическая себестоимость', type: 'number' },
    { name: 'actualGrossProfit', label: 'Фактическая валовая прибыль', type: 'number' },
    { name: 'actualLeadTimeDays', label: 'Фактический срок поставки, дней', type: 'number' },
    { name: 'deliverySuccessful', label: 'Поставка выполнена', type: 'checkbox' },
    { name: 'reclamation', label: 'Была рекламация', type: 'checkbox' },
    { name: 'reclamationNote', label: 'Комментарий по рекламации', type: 'textarea' },
    { name: 'actualProcurementRoute', label: 'Фактический маршрут закупки', type: 'text' },
    { name: 'actualSupplier', label: 'Фактический источник закупки', type: 'text' },
    { name: 'recordedAt', label: 'Дата фиксации результата', type: 'date', required: true, index: true },
    { name: 'notes', label: 'Внутренний комментарий', type: 'textarea' },
  ],
}
