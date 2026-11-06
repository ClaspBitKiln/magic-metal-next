/** Verdict for the automated card checks only; no visual/normative approval. */
export function auditVerdict(summary) {
  const reasons = []
  const validCount = (value) => Number.isSafeInteger(value) && value >= 0
  if (!validCount(summary.expectedCases) || summary.expectedCases === 0
      || !validCount(summary.cases) || summary.cases !== summary.expectedCases) {
    reasons.push('incomplete_case_coverage')
  }
  const counts = summary.findingCounts
  if (!counts || typeof counts !== 'object' || Array.isArray(counts)
      || Object.values(counts).some((value) => !validCount(value))) {
    reasons.push('invalid_finding_counts')
  } else if (Object.values(counts).some((value) => value > 0)) {
    reasons.push('automated_findings')
  }
  if (!validCount(summary.badReferenceLinks) || summary.badReferenceLinks > 0) {
    reasons.push('reference_link_failures')
  }
  return { status: reasons.length ? 'fail' : 'pass', exitCode: reasons.length ? 1 : 0, reasons }
}
