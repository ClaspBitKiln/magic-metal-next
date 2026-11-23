# PHP request handler — not deployed

Port of production SHA `8deef5981e26e4d214deed857dcd71b92abe5205` public
`/api/request` to PHP8.1+/PHPMailer for existing SpaceWeb shared hosting.

## Layout and dependencies

- Deploy only `request.php` to `public_html/api/request.php`.
- Put `request-lib.php`, actual `request-config.php`, composer.json/lock and
  installed vendor directory in `/home/m/magicmet/magicmet-private/` outside
  public_html. Directory0700/config0600; never store credentials in Git/chat/logs.
- Run `composer install --no-dev --prefer-dist --no-interaction` in that private
  directory. Dependency is official `phpmailer/phpmailer` ^6.10; no custom SMTP.
- Optional `MAGICMET_REQUEST_CONFIG` points outside document root. Otherwise
  config is at the account private path above. Public config is rejected.
- Apache mapping before ordinary static routes:
  `RewriteRule ^api/request/?$ api/request.php [END]`.
- Install `.user.ini.example` as `public_html/api/.user.ini`; confirm effective
  values in staging. max_file_uploads100, explicit browser guard99. Handler rejects
  saturation of PHP's effective count cap rather than accepting truncated lists.
- Static native form and JS must use `files[]` instead of repeated `files` keys,
  including append/getAll calls, to preserve all attachments in PHP.
- Copy SMTP configuration from authorized existing production source privately.
  ALLOWED_ORIGINS may include exact staging origin during staging; remove afterward.

## Behavior and limitations

Same consent/contact/timing/honeypot/spam rules, five attempts per15min, 4MiB
attachments, 4.5MB request size, extension/signature checks, escaped mail body,
real SMTP attachments and response contract. Success only after SMTP accepts
mail; all unconfirmed deliveries return503, including files. SMTP TLS peer and
hostname verification remain enabled. No debugauth output.

Rate files use HMAC(IP), not rawIP; private0700 directory, locked updates,
0600 files. REMOTE_ADDR is trusted, never arbitrary X-Forwarded-For. Verify actual
per-visitor addresses on SpaceWeb before production. No automatic cleanup timer
created: review small per-IP files during ordinary maintenance/inode checks.

Optional Payload persistence and CRM webhook are not implemented. This SMTP-only
port is eligible only if production does not depend on those paths; no empty DB,
new service or supplier automation introduced. Response explicitly has id:null,
crmDelivered:false. Original Node handler had no count cap; PHP practical cap99
must be documented and validated in client rather than dropping files silently.

## Verification

`php -l request.php; php -l request-lib.php; php tests/request.test.php`.
Pure unit tests send no email. Before DNS, stage native multipart POST with two
real files; missing consent, invalid contact, fake PDF, overlimit and SMTP failure.
Confirm effective PHP count/byte limits and that actual received attachments match
bytes in manager mailbox. Local tests do not establish remote SMTP readiness.
