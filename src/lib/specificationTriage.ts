export type SpecificationLine = {
  raw: string
  lineNumber: number
  status: 'needs-review' | 'ready-for-review'
  note: string
}

const heading = /^(?:№|no\.?|поз(?:иция)?\.?|наименование|количество|ед\.?\s*изм\.?)$/iu
const dimension = /\d+(?:[.,]\d+)?\s*(?:[xх×*]\s*\d+(?:[.,]\d+)?)+/iu
const amount = /\d+(?:[.,]\d+)?\s*(?:кг|т|тонн(?:а|ы)?|шт\.?|м|пог\.?\s*м|метр(?:а|ов)?|км)(?=$|[\s,.;)])/iu
const grade = /(?:\b(?:ГОСТ|ТУ|СТО)\s*[\w.\-–]+|\b\d{1,2}Г2С\b|\b(?:М1|М2|Л63|А500С)\b)/iu

/**
 * Non-destructive triage only. It never invents dimensions, grade, quantity,
 * inventory, or a supplier quote. The original text is submitted untouched.
 */
export function inspectSpecification(message: string): SpecificationLine[] {
  return message.split(/\r?\n/).map((raw, index) => ({ raw, lineNumber: index + 1 }))
    .filter(({ raw }) => raw.trim().length > 0)
    .filter(({ raw }) => !heading.test(raw.trim()))
    .map(({ raw, lineNumber }) => {
      const hasAmount = amount.test(raw)
      const hasTechnicalDetail = dimension.test(raw) || grade.test(raw)
      const status = hasAmount && hasTechnicalDetail ? 'ready-for-review' : 'needs-review'
      return {
        raw,
        lineNumber,
        status,
        note: status === 'ready-for-review'
          ? 'Проверить марку, размер, норматив и количество по исходной строке.'
          : !hasAmount
            ? 'Уточнить количество и единицу измерения.'
            : 'Уточнить изделие, марку, размер или ГОСТ/ТУ.',
      }
    })
}
