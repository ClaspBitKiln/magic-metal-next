import type { Page } from '@playwright/test'

// Playwright uses the accessible-name algorithm, including labels, aria-labelledby,
// descendant image alt text, naming fallbacks and hidden naming references.
export async function unnamedControls(page: Page) {
  const roles = ['button', 'link', 'textbox', 'searchbox', 'checkbox', 'radio', 'combobox', 'listbox', 'slider', 'spinbutton', 'switch'] as const
  const findings: string[] = []
  for (const role of roles) {
    const unnamed = page.getByRole(role, { name: '', exact: true })
    for (const element of await unnamed.all()) {
      findings.push(await element.evaluate(node => node.outerHTML.slice(0, 240)))
    }
  }
  // File inputs have no implicit role in Playwright's role selector. Their
  // native/ARIA labels (or title fallback) still need to be checked.
  const uploads = page.locator('input[type="file"]').filter({ visible: true })
  const namedUploads = uploads.and(page.getByLabel(/\S/).or(page.getByTitle(/\S/)))
  for (const element of await uploads.all()) {
    if (await element.and(namedUploads).count() === 0) {
      findings.push(await element.evaluate(node => node.outerHTML.slice(0, 240)))
    }
  }
  return findings
}
