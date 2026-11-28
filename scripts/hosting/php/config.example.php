<?php
// Copy outside public_html as /home/m/magicmet/magicmet-private/request-config.php.
// Use permissions 0600. Never put real values in Git or under the document root.
return [
    'SMTP_HOST' => '',
    'SMTP_PORT' => 465,
    'SMTP_SECURE' => true,
    'SMTP_USER' => '',
    'SMTP_PASSWORD' => '',
    'REQUEST_TO_EMAIL' => 'm1@magicmet.ru',
    // Non-public path, owned by this account. Each IP is stored as an HMAC only.
    'RATE_LIMIT_DIR' => '/home/m/magicmet/magicmet-private/request-rate',
    'RATE_LIMIT_SECRET' => '', // Generate 32 random bytes; do not reuse SMTP password.
    'ALLOWED_ORIGINS' => ['https://magicmet.ru', 'https://www.magicmet.ru'],
];
