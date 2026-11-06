import test from 'node:test'
import assert from 'node:assert/strict'
import { auditVerdict } from './product-card-audit-report.mjs'

const clean = { expectedCases: 231, cases: 231, findingCounts: {}, badReferenceLinks: 0,
  visualMatchA: 'not_verified', normativeReview: 'not_performed' }

test('complete clean automated checks pass without claiming visual or normative approval', () => {
  const input = structuredClone(clean)
  assert.deepEqual(auditVerdict(input), { status: 'pass', exitCode: 0, reasons: [] })
  assert.deepEqual(input, clean)
})
test('a rendered card defect fails even after every case completed', () => {
  const result = auditVerdict({ ...clean, findingCounts: { page_overflow: 1 } })
  assert.equal(result.exitCode, 1)
  assert.ok(result.reasons.includes('automated_findings'))
})
test('partial and empty runs cannot report a successful audit', () => {
  for (const patch of [{ cases: 230 }, { expectedCases: 0, cases: 0 }, { cases: 232 }]) {
    assert.ok(auditVerdict({ ...clean, ...patch }).reasons.includes('incomplete_case_coverage'))
  }
})
test('unavailable or redirected-to-wrong-page references fail the verdict', () => {
  assert.ok(auditVerdict({ ...clean, badReferenceLinks: 1 }).reasons.includes('reference_link_failures'))
})
test('request/render failures fail even when accounted for as completed jobs', () => {
  assert.equal(auditVerdict({ ...clean, findingCounts: { request_or_render_failed: 1 } }).exitCode, 1)
})
test('missing and malformed counters fail closed rather than producing a green verdict', () => {
  for (const patch of [
    { expectedCases: undefined }, { cases: NaN }, { badReferenceLinks: undefined },
    { badReferenceLinks: -1 }, { findingCounts: undefined }, { findingCounts: [] },
    { findingCounts: { page_overflow: -1 } }, { findingCounts: { page_overflow: '1' } },
  ]) assert.equal(auditVerdict({ ...clean, ...patch }).exitCode, 1)
})
test('zero-valued finding categories do not fail or alter unverified scope markers', () => {
  const input = { ...clean, findingCounts: { page_overflow: 0, http_status: 0 } }
  assert.equal(auditVerdict(input).exitCode, 0)
  assert.equal(input.visualMatchA, 'not_verified')
  assert.equal(input.normativeReview, 'not_performed')
})
