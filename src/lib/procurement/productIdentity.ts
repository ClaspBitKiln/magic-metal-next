const clean = (value?: string | null) => value?.trim().toLowerCase().replace(/ё/g, 'е').replace(/[^a-zа-я0-9]+/gi, '') ?? ''
const cleanNumber = (value?: string | number | null) => {
  if (value == null || value === '') return ''
  const number = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(number) ? String(number) : clean(String(value))
}

export type ProductIdentityInput = {
  product?: string | null
  designation?: string | null
  standard?: string | null
  diameter?: string | number | null
  wall?: string | number | null
  thickness?: string | number | null
  length?: string | number | null
}

export const normalizeProductIdentity = (input: ProductIdentityInput) => ({
  productKey: clean(input.product),
  designationKey: clean(input.designation),
  standardKey: clean(input.standard),
  diameterKey: cleanNumber(input.diameter),
  wallKey: cleanNumber(input.wall),
  thicknessKey: cleanNumber(input.thickness),
  lengthKey: cleanNumber(input.length),
})

export const buildProductIdentityKey = (input: ProductIdentityInput) => {
  const value = normalizeProductIdentity(input)
  return [value.productKey, value.designationKey, value.standardKey, value.diameterKey, value.wallKey, value.thicknessKey, value.lengthKey].join('|')
}
