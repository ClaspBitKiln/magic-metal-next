#!/usr/bin/env node

const positive = (value, name) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} должно быть положительным числом`);
  }
  return number;
};

export function calculateMetalMass(input) {
  const shape = input.shape;
  const density = positive(input.densityKgM3, 'densityKgM3');
  const quantity = positive(input.quantity ?? 1, 'quantity');
  let unitKgRaw;
  let unitBasis;
  let totalKgRaw;

  if (shape === 'pipe') {
    const diameter = positive(input.diameterMm, 'diameterMm');
    const wall = positive(input.wallMm, 'wallMm');
    const length = positive(input.lengthM, 'lengthM');
    if (wall >= diameter / 2) throw new Error('wallMm должна быть меньше половины diameterMm');
    const areaM2 = (Math.PI / 4) * (diameter ** 2 - (diameter - 2 * wall) ** 2) * 1e-6;
    unitKgRaw = areaM2 * density;
    unitBasis = 'kg/m';
    totalKgRaw = unitKgRaw * length * quantity;
  } else if (shape === 'sheet') {
    const thickness = positive(input.thicknessMm, 'thicknessMm');
    const width = positive(input.widthMm, 'widthMm');
    const length = positive(input.lengthMm, 'lengthMm');
    unitKgRaw = thickness * width * length * 1e-9 * density;
    unitBasis = 'kg/sheet';
    totalKgRaw = unitKgRaw * quantity;
  } else if (shape === 'round') {
    const diameter = positive(input.diameterMm, 'diameterMm');
    const length = positive(input.lengthM, 'lengthM');
    unitKgRaw = (Math.PI / 4) * diameter ** 2 * 1e-6 * density;
    unitBasis = 'kg/m';
    totalKgRaw = unitKgRaw * length * quantity;
  } else if (shape === 'square') {
    const side = positive(input.sideMm, 'sideMm');
    const length = positive(input.lengthM, 'lengthM');
    unitKgRaw = side ** 2 * 1e-6 * density;
    unitBasis = 'kg/m';
    totalKgRaw = unitKgRaw * length * quantity;
  } else {
    throw new Error('shape должно быть pipe, sheet, round или square');
  }

  return {
    shape,
    densityKgM3: density,
    quantity,
    unitBasis,
    unitKgRaw,
    unitKg: Number(unitKgRaw.toFixed(3)),
    totalKgRaw,
    totalKg: Math.round(totalKgRaw),
    disclaimer: 'Теоретическая масса; фактическая масса зависит от допусков, марки, состояния и стандарта продукции.',
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const input = JSON.parse(process.argv[2] ?? '{}');
    process.stdout.write(`${JSON.stringify(calculateMetalMass(input), null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

