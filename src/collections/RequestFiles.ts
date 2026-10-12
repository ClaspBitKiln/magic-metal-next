import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access/isAuthenticated'

export const RequestFiles: CollectionConfig = {
  slug: 'request-files',
  labels: { singular: 'Файл заявки', plural: 'Файлы заявок' },
  admin: { group: 'Заявки' },
  access: {
    read: isAuthenticated,
    create: () => true,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  fields: [{ name: 'description', label: 'Описание', type: 'text' }],
  upload: {
    mimeTypes: [
      'application/pdf',
      'application/msword',
      // Payload detects legacy DOC/XLS containers as CFB and ASCII DXF as text.
      // /api/request validates the extension and file signature before storage.
      'application/x-cfb',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/*',
      'application/dxf',
      'text/plain',
      'image/vnd.dwg',
      'application/octet-stream',
    ],
  },
}
