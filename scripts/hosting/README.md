> Production migration completed; public acceptance27Nov2026:192/192pages,37/37assets,SMTPattachments received. See docs/ai/SPACEWEB_MIGRATION_RESULT_20261127.md. The historical experiment below describes preparation; each future artifact still requires acceptance before deployment.

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

## Transfer artifact

```sh
node scripts/hosting/package-static-export.mjs \
  /workspace/work/spaceweb-static-20261123-final2 \
  /workspace/.cloud/magic-metal/spaceweb-site-20261123.tar.gz
```

The packager copies the finalized public `out`, adds only `api/request.php` and
`api/.user.ini`, rejects private/config/dependency paths and symlinks, normalizes
web permissions, and writes an archive plus a private SHA256 manifest. The PHP
library/vendor and **actual SMTP config must stay outside document root** and
are not in this public artifact. Packaging is not permission to switch DNS.

The shared Apache config now maps `/api/request`, redirects **www only** to the
HTTPS apex, and sends `X-Robots-Tag: noindex, nofollow, noarchive` for all hosts
except magicmet.ru/www.magicmet.ru. Confirm mod_setenvif/mod_headers support on
the actual host and verify the header before allowing technical-host crawling.
Technical-host visits also skip Metrika in the static analytics script. Production
analytics and owner opt-out remain intact. HTTP-to-HTTPS enforcement should use
the host's verified TLS setup; do not guess forwarded proxy headers.

All submitting clients guard at 99 selected files so PHP's configured limit100
cannot silently truncate a legitimate form. The PHP handler independently
rejects saturation. The limit is in addition to the existing 4MiB total size.

A temporary **draft** GitHub release can carry the two secret-free archives for
transfer. Use an authenticated API download to obtain a short-lived signed asset
URL, pass it privately to Windows, verify SHA256 after download, and remove the
temporary release after receipt. Never publish the draft or include SMTP config,
tokens, signed URLs or credentials in Git, chat, release notes or public files.

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
