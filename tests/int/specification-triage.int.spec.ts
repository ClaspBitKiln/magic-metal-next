import { describe, expect, it } from 'vitest'
import { inspectSpecification } from '@/lib/specificationTriage'

describe('non-destructive specification triage', () => {
  it('preserves lines and positions exactly, including punctuation', () => {
    const rows = inspectSpecification('Труба 57х3 ГОСТ 8734-75 — 2 т\n\nЛист М1 2×1000 — 50 кг')
    expect(rows).toHaveLength(2)
    expect(rows.map(row => row.lineNumber)).toEqual([1, 3])
    expect(rows[0].raw).toBe('Труба 57х3 ГОСТ 8734-75 — 2 т')
    expect(rows[1].raw).toBe('Лист М1 2×1000 — 50 кг')
  })
  it('flags ambiguous requests without guessing a missing quantity', () => {
    const rows = inspectSpecification('Феррохром ФХ001А\nШвеллер — 10 шт')
    expect(rows).toHaveLength(2)
    expect(rows.every(row => row.status === 'needs-review')).toBe(true)
    expect(rows[0].note).toContain('количество')
  })
  it('does not claim availability or a confirmed quotation', () => {
    const rows = inspectSpecification('Арматура А500С 12х6000 — 10 т')
    expect(rows[0].status).toBe('ready-for-review')
    expect(rows[0].note).toContain('Проверить')
  })
  it('supports CRLF and retains original line content', () => {
    expect(inspectSpecification('Наименование\r\nМ1 — 2 т\r\n')).toEqual([
      expect.objectContaining({ raw: 'М1 — 2 т', lineNumber: 2, status: 'ready-for-review' }),
    ])
  })
  it('returns no positions for empty text and headings', () => {
    expect(inspectSpecification(' \nНаименование\nКоличество')).toEqual([])
  })
})
