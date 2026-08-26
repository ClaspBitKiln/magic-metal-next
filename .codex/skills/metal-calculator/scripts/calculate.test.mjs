import assert from 'node:assert/strict';
import { calculateMetalMass } from './calculate.mjs';

const steel = 7850;

assert.equal(calculateMetalMass({ shape: 'pipe', densityKgM3: steel, diameterMm: 168, wallMm: 8, lengthM: 12, quantity: 123 }).totalKg, 46592);
assert.equal(calculateMetalMass({ shape: 'pipe', densityKgM3: steel, diameterMm: 219, wallMm: 8, lengthM: 12, quantity: 1 }).totalKg, 500);
assert.equal(calculateMetalMass({ shape: 'sheet', densityKgM3: steel, thicknessMm: 10, widthMm: 1500, lengthMm: 6000, quantity: 1 }).totalKg, 707);
assert.equal(calculateMetalMass({ shape: 'round', densityKgM3: steel, diameterMm: 100, lengthM: 12, quantity: 1 }).totalKg, 740);
assert.equal(calculateMetalMass({ shape: 'square', densityKgM3: steel, sideMm: 100, lengthM: 12, quantity: 1 }).totalKg, 942);
assert.throws(() => calculateMetalMass({ shape: 'pipe', densityKgM3: steel, diameterMm: 100, wallMm: 50, lengthM: 1 }), /меньше половины/);

console.log('metal-calculator: 6 tests passed');
