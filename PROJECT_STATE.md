# Project State — Magic Metal

Updated: 2026-10-27

## Repository and current baseline

- Repository: https://github.com/ClaspBitKiln/magic-metal-next
- Production-intended branch: `main`
- Baseline commit checked: `d6cf59199968eeceb591d43622f90b6d067d6fe2` — “Complete size selection analytics” (2026-10-21).
- Stack described by the repository: Next.js 16, Payload CMS 3, PostgreSQL.
- Preview URL recorded in repository metadata: https://magic-metal-next.vercel.app
- Production domain used in project history: https://www.magicmet.ru

## Critical product and brand constraints

- Do not redraw, replace, or otherwise change the Magic Metal emblem/logo.
- Keep the approved hero image/composition unless the owner explicitly approves a change.
- This is a lead-generation B2B supply website, not a generic metal-stock photo catalogue.
- Main CTA: “Отправить заявку”; keep the request path simple and conversion-focused.
- Main navigation: “О компании”, “Продукция”, “Справочник ГОСТ”, “Контакты”; language switch RU/UZ/EN at the top right.
- Product priorities include electric-welded and seamless pipes, СДТ, and insulated pipes/fittings; Uzbekistan is a priority export market.
- In the customer-facing catalogue, use compact table/list presentation rather than card-heavy layouts. Supplier/source layers and internal cost data must not be exposed to customers.
- Availability wording: green “На складе”; yellow “Под заказ”; red absent.
- Keep supplier/source prices internal. Do not invent availability or prices.
- Do not introduce a runtime dependency on the separate inn-bot project.

## Open work discovered on 2026-10-27

1. PR #63 — [Restore approved full homepage after static workaround](https://github.com/ClaspBitKiln/magic-metal-next/pull/63)
   - Open; restore the approved React homepage, search, customer block, GOST section and delivery content.
   - PR notes say desktop/resource checks and ESLint/production webpack build passed, but cross-browser QA was incomplete; Firefox and Yandex Browser were not verified. The public build does not establish full internal TypeScript cleanliness.
2. PR #64 — [Make request validation clear and limit attachments to 4 MiB](https://github.com/ClaspBitKiln/magic-metal-next/pull/64)
   - Open draft; depends on PR #63.
   - PR notes describe form validation, consent and attachment handling improvements. SMTP delivery is explicitly not verified by local tests.
3. Latest `main` commit adds size-selection analytics; preceding commit expands the stock catalogue and speeds up the hero image.

## Safe next steps

1. Inspect current production and preview URLs, especially the first screen, mobile hero crop, catalogue navigation and request form.
2. Finish browser QA for PR #63 (desktop/mobile, Firefox and Yandex Browser where available), verify hero/logo assets remain unchanged, and inspect deployment status.
3. Review PR #63 and its CI/deployment evidence before merging.
4. Rebase/recheck PR #64 after #63 is accepted; test form consent, validation, 4 MiB boundary, file formats, duplicate submission and a real owner-approved email delivery check.
5. Validate the catalogue against the owner’s rules: all row areas clickable, no empty result screens for common pipe categories, internal supplier data hidden, and stock status labels exact.
6. Only publish after the relevant checks pass. Never claim SMTP or production behavior is verified based solely on local mocked tests.

## Verification status

This file records repository metadata and the notes in the two open PR descriptions. It is not itself evidence that the current production website, SMTP, DNS, or every browser scenario was tested on 2026-10-27.
