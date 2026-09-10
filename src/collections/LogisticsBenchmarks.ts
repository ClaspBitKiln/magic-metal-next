import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const LogisticsBenchmarks: CollectionConfig = {
  slug: 'logistics-benchmarks',
  labels: { singular: 'Логистический benchmark', plural: 'Логистические benchmarks' },
  admin: {
    useAsTitle: 'routeId',
    defaultColumns: ['routeId', 'origin', 'destination', 'averagePriceRub', 'dateFrom', 'source', 'observedAt'],
    group: 'SaaS · снабжение',
  },
  access: { read: isAuthenticated, create: isAuthenticated, update: isAuthenticated, delete: isAuthenticated },
  fields: [
    { name: 'routeId', type: 'text', required: true, index: true },
    { name: 'origin', type: 'text', required: true, index: true },
    { name: 'destination', type: 'text', required: true, index: true },
    { name: 'mode', type: 'select', required: true, options: ['road', 'rail', 'sea', 'multimodal'] },
    { name: 'dateFrom', type: 'date', required: true, index: true },
    { name: 'dateTo', type: 'date' },
    { name: 'averagePriceRub', type: 'number', required: true },
    { name: 'lowerPriceRub', type: 'number' },
    { name: 'upperPriceRub', type: 'number' },
    { name: 'averagePricePerKm', type: 'number' },
    { name: 'distanceKm', type: 'number' },
    { name: 'loadsCount', type: 'number' },
    { name: 'tonnage', type: 'number' },
    { name: 'carType', type: 'text' },
    { name: 'withNds', type: 'checkbox', defaultValue: false },
    { name: 'source', type: 'text', required: true, index: true },
    { name: 'evidenceLevel', type: 'select', required: true, options: ['observed', 'verified'] },
    { name: 'observedAt', type: 'date', required: true, index: true },
  ],
}
