# Stable OpenNext read-only preview

This isolated kit archives source `f3236eabd5b3f3113d35729e6db5a6701d47e50c`; it does not modify the application checkout or production hosting. It uses actual Next.js `16.4.5` + OpenNext `1.20.16` + Wrangler `4.158.0`, not vinext. The preview dependency manifest and lockfile are retained for `npm ci`; the source project's original lockfile remains unchanged.

Preview-only transformations:

- Remove the archived Payload route group and cron routes; replace the request route with a 503 stub. No CMS, SMTP, database or real lead is tested.
- Remove only the `withPayload` import/wrapper from the copied Next config; keep other options, add standalone output and `images.unoptimized: true`. No Cloudflare Images resource is configured.
- Replace homepage filesystem loading with a generated JSON string containing the same hash-checked approved HTML. Catalog-grade injection and analytics selection logic remain intact; build with analytics disabled.
- Use default dummy OpenNext cache/tag/queue implementations. There are no R2, Images, Queue, database or SMTP bindings.
- After packaging, install a wrapper that blocks admin/other APIs, returns RFQ503 and non-read requests405, and adds noindex. Assets run through that policy too.

## Prepare and build locally

From the repository root (Node24 was used for the pinned dependency installation):

```bash
node deploy/opennext-preview/prepare.mjs --name=opennext-preview-check
cd .plan-b/opennext-preview-check
NEXT_PUBLIC_YANDEX_METRIKA_ID=0 npm run build -- --webpack
NEXT_PUBLIC_YANDEX_METRIKA_ID=0 node_modules/.bin/opennextjs-cloudflare build --skipNextBuild
node ../../deploy/opennext-preview/buildfinish.mjs
node_modules/.bin/wrangler dev --ip 127.0.0.1 --port 3031
```

`--skipNextBuild` is the installed OpenNext CLI flag (aliases `--skipBuild`, `-s`); it reuses the one standalone Next build instead of rebuilding. Do not use `--dangerouslyUseUnsupportedNextVersion`, disable TLS, or add paid bindings to make it pass.

For controlled local reuse of an existing pinned dependency installation, prepare with `--no-install` and supply the same manifest/lock and node_modules separately. The helper refuses an existing target instead of overwriting another account's work. `buildfinish.mjs` must run in this prepared directory after OpenNext creates `.open-next/worker.js`.

A local GET/POST policy check should verify homepage and a sheet200/noindex, admin404, catalog search behavior, RFQ503, and blocked other API routes. UI QA must block analytics and business submissions. A missing original A reference, full Payload compatibility, Free CPU limits and real manager delivery are not established by a successful build.

## Publication boundary

This kit does not run login or deploy. A public deployment needs a separately authorized account/temporary-account action; permanent GitHub Builds also needs the owner's one-time Cloudflare/GitHub authorization. It is a read-only preview, not production or a complete replacement for the current site. Do not set DNS, enable payment or attach business SMTP/CRM credentials as part of this preparation.
