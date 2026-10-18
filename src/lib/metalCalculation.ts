export type MetalShape = 'pipe' | 'sheet' | 'round' | 'square'

export type MetalCalculationInput = {
  shape: MetalShape
  density: number
  diameter: string
  wall: string
  thickness: string
  width: string
  pieceLength: string
  side: string
  length: string
  quantity: string
}

const positiveNumber = (value: string) => {
  const clean = value.trim().replace(',', '.')
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(clean)) return NaN
  const number = Number(clean)
  return Number.isFinite(number) && number > 0 ? number : NaN
}

export function calculateMetalMass(input: MetalCalculationInput) {
  const quantity = positiveNumber(input.quantity)
  if (!Number.isInteger(quantity)) return { error: 'Укажите целое количество штук больше нуля.' } as const
  if (!Number.isFinite(input.density) || input.density <= 0) return { error: 'Выберите материал.' } as const
  const dimensions = input.shape === 'sheet'
    ? [input.thickness, input.width, input.pieceLength]
    : input.shape === 'pipe' ? [input.diameter, input.wall, input.length]
      : [input.shape === 'round' ? input.diameter : input.side, input.length]
  if (dimensions.some(value => !Number.isFinite(positiveNumber(value)))) {
    return { error: 'Укажите положительные размеры и длину в единицах, указанных у полей.' } as const
  }
  const [first, second, third] = dimensions.map(positiveNumber)
  if (input.shape === 'pipe' && second * 2 >= first) {
    return { error: 'Стенка трубы должна быть меньше половины наружного диаметра.' } as const
  }
  const unit = input.shape === 'sheet' ? first * second * third * input.density * 1e-9
    : input.shape === 'pipe' ? Math.PI * second * (first - second) * input.density * 1e-6
      : input.shape === 'round' ? Math.PI / 4 * first ** 2 * input.density * 1e-6
        : first ** 2 * input.density * 1e-6
  const total = unit * quantity * (input.shape === 'sheet' ? 1 : positiveNumber(input.length))
  if (!Number.isFinite(total) || !Number.isFinite(unit) || total <= 0 || unit <= 0) {
    return { error: 'Проверьте размеры: результат выходит за пределы расчёта.' } as const
  }
  return { unit, total, unitLabel: input.shape === 'sheet' ? 'кг/лист' : 'кг/м' } as const
}

export const formatMetalMass = (value: number) => value > 0 && value < 0.001
  ? '< 0,001' : new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 }).format(value)
