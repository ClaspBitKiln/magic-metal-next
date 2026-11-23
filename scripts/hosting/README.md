# SpaceWeb static preparation

This is an isolated migration experiment, not a production deployment. It never
edits the checked-out application, uploads to hosting, changes DNS, or disables
Vercel. The default source is the production SHA verified on 23 November 2026:
`8deef5981e26e4d214deed857dcd71b92abe5205`.

```sh
node scripts/hosting/prepare-static-export.mjs \
  --target /workspace/work/spaceweb-static-20261123 \
  --deps /workspace/start-connections-20261108/node_modules
cd /workspace/work/spaceweb-static-20261123
NEXT_PUBLIC_SITE_URL=https://magicmet.ru npm run build -- --webpack
node /workspace/start-connections-20261108/scripts/hosting/finalize-static-export.mjs "$PWD"
```

The target must not exist and must be outside this repository. To repeat the
experiment choose a new target; the script never deletes an existing tree.
Production credentials are not copied from the working directory: sources come
from `git archive` of the pinned commit. The optional dependencies link is for
local builds only; it is not part of a deployable artifact.

The script excludes unfinished CMS/admin and internal API routes in the isolated
tree, enables Next static export, and keeps existing public page components and
catalog data. Catalog query strings initialize in the browser. Dimension/rope
search lazily imports the **same** existing algorithm and normative data instead
of calling a missing Node API. The homepage's hardcoded Next image optimizer URL
becomes its original local image. Apache rules preserve old redirect paths,
extensionless public paths and basic security headers.
Multipart upload fields use `files[]`, including native HTML and client-side
validation, so PHP receives every selected file instead of the last file only.
The finalizer renames the generated root Route Handler from `index` to
`index.html`, checks every sitemap page and hashes output files into a proof
outside `out`. It still marks the artifact **not deployment-ready**.

**Do not publish `out` yet.** The existing `/api/request` Node handler is absent
from a static export. A replacement SMTP endpoint must retain contact/consent,
anti-spam, rate limits, file count/type/signature/total-size checks, attachments,
accurate success/failure responses and the existing recipient. PHP SMTP support
on the actual hosting and secure credential placement must be established. No
paid retained backend is assumed. `mailto` is not an equivalent replacement.

Before cutover: back up Git/dirty files, existing SpaceWeb files/database and DNS;
finish the request handler; verify one complete production build; check sitemap
URL coverage, deep links, search by sizes/grades/ropes, images/CSS/JS, languages,
the prefilled RFQ flow, approved test SMTP delivery and attachments, and analytics
without adding schedules. Keep production canonical URLs, prevent technical-host
indexing, verify TLS for apex and www, and preserve mail MX/TXT/DKIM/DMARC records.
Only publish the approved `out` artifact plus verified server endpoint; never the
source tree, dependencies, `.env`, private data or `STATIC_PREPARATION.json`.

## Experiment readback: 23 November 2026

The isolated build from the pinned production SHA succeeded using the existing
public-build TypeScript policy. It generated 196 pages and about 89 MiB of output.
The finalizer checked all 192 sitemap URLs (none missing), and hashed 1,323 files.
One local Chromium run verified URL initialization and results for `12Х1МФ`
(8 results), `труба 57×3` (11), and `канат 12` (1), with no API requests, no
JavaScript errors, intact homepage images and `Медный прокат` detail page.
External analytics were blocked during this local run. No forms were submitted.

This does not verify actual Apache rules, hosting PHP/SMTP, production delivery,
all browser flows or cutover readiness. Query-string search results now initialize
after hydration, since a static HTML file cannot vary by query string. The old
server-query-specific test must not be reported as passing for this experiment.
