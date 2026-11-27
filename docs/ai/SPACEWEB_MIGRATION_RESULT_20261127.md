# Перенос magicmet.ru на SpaceWeb — завершение и проверка 27.11.2026

## Результат и ограничения владельца

Публичный magicmet.ru работает на действующем shared SpaceWeb. Переключение webDNS сохранено23.11.2026 в09:38UTC (14:38 Екатеринбург); публичная приёмка повторно проведена27.11.2026. VDS и новые платные услуги не приобретались.

**Актуальная DNS-зона27.11:** apexA `77.222.57.208`, wwwCNAME `magicmet.ru.`. Этот жеIP подтверждён публичным DNS-over-HTTPS, HTTPS-запросом и браузером. SSH/backend-адрес, использованный для загрузки23.11, — `77.222.62.219`. Это разные назначения адресов. Не заменять работающий публичный A на SSH-IP по старой инструкции. При первичном сохранении23.11A был77.222.62.219; причина последующего изменения адреса этим этапом не установлена,27.11 актуальное значение сверено в самой панели. MX/TXT/NS, mail/autoconfig совпали с зоной до переноса.

**Последнее уточнение владельца27.11:** Vercel не продлевать; техническая работа с ним при необходимости разрешена. Не заходить в вопросы продления/оплаты, не менять тариф, автопродление, карты и платежи. По информации владельца оплаченный период примерно до10декабря; точная дата не подтверждалась. Подписка/автопродление нами НЕ отменены и НЕ изменены. Не утверждать, что решение «не продлевать» уже применено в биллинге.

## Размещение и восстановление доступа

- Панель `https://cp.sweb.ru/`, аккаунтmagicmet. Сохранённый браузерный вход Windows использован повторно27.11 без извлечения/публикации пароля.
- Публичная папка `/home/m/magicmet/public_html` теперь содержит современный статический сайт и `api/request.php`.
- Старый WordPress сохранён отдельно: `/home/m/magicmet/public_html-wordpress-before-20261123`, права700. Его MySQL-база и резервные архивы не удалялись.
- Приватная почтовая часть `/home/m/magicmet/magicmet-private/`: request-lib.php, request-config.php, Composer/vendor. Каталог700, секретный конфиг600, вне documentroot.
- PHPMailer6.12.0 установлен официальным Composer, lock сохранён, audit0. PHPCLI по умолчанию у SpaceWeb старый: для обслуживания явно использовать `php8.1`, не просто `php`.
- SSH включали в панели23.11 на24часа; вход по отдельномуed25519ключу работал. На27.11 срок этого включения истёк, повторная проверка SSH не выполнялась. При следующей публикации проверить состояние и при необходимости временно включить штатной кнопкой панели.
- Windows private runner/config/ключ: `%LOCALAPPDATA%\MagicMetalSpaceWebMigration`; remote.cjs выполняет разрешённые SSH-команды. DPAPI smtp.token.dpapi привязан к asus; значения ключей/пароля в Git и Obsidian не переносить.
- Для SpaceWeb создан отдельный пароль приложения Яндекс m1 «Magic Metal SpaceWeb SMTP 20261123». Обычный пароль и существующие пароли приложений не менялись. SMTP465/TLS аутентификация с SpaceWeb подтверждена.
- Let'sEncryptWildcard установлен дляmagicmet.ru/www; TLS действителен до18.12.2026, автопродление сертификата в панели было checked. Новых расписаний не создавали.

## Что проверено

| Проверка | Результат |
|---|---|
| Статическая production-сборка |196страниц, sourceSHA8deef5981e26e4d214deed857dcd71b92abe5205 |
| Публичные страницы27.11 |192/192URL sitemap:200, корректныйcanonical, productionnoindex отсутствует |
| Публичные ресурсы27.11 |37/37:23JS,1CSS,13изображений, корректныеMIME |
| HTTPS |apex200;www301→HTTPSapex, сертификат проверен |
| HTTP |301→HTTPS; опасное понижениеHTTPS→HTTP устранено |
| Поиск |марка12Х1МФ,труба57×3,канат12 работают, JSerrors0 |
| Мобильный390px |главная/медь/справочник безoverflow, битыхизображений0 |
| Заявка23.11 на сервере доDNS |браузер→PHP→SMTP200,emailDeliveredtrue;2PDF получены вm1 |
| Заявка27.11 по публичному домену |тот же полный путь200;2PDF получены в папке01, по654байта; владелец прислал скриншот письма |
| Закрытые файлы |/.env и/magicmet-private/request-config.php дают404 |
| Метрика |код счётчика113661397 сохранён; внешние вызовы в тестах блокировались, тестовые цели не создавались |
| PHP |43проверки логики,6HTTPmultipart, MIME2вложения/кириллица/байты PASS |
| Исходники хостинга |eslint scripts/hosting/*.mjs PASS, diffcheck PASS |

Полный линтер репозитория запускался27.11 и завершился с33ошибками и10предупреждениями. Ошибки относятся к старым служебным CommonJS-скриптам исследований площадок в docs/ai/research, отсутствующим в публичном артефакте; это НЕ зелёный общийlint. В рамках переноса эти несвязанные файлы не переписывались. Публичная сборка и приведённые проверки пройдены отдельно.

Исправление фактического Apache: DirectorySlashOff; отдельное сопоставление .html для путей со слешем/без него; HTTP→HTTPS с учётом TLS-прокси;www→apex; техническому хосту noindex;невыдача каталога. Эти правила сохранены в scripts/hosting/spaceweb-static.htaccess.

Главная: VercelHTML78184байта/gzip15975/2script →SpaceWeb78144/gzip15935/2script. Сравнение27.11 напрямую с обоими серверами. Старый Vercel поIP76.76.21.21 сHost/SNI magicmet.ru ответил200 — технический откат на дату проверки доступен. Проект Vercel не удалён; публичный трафик уже идёт на SpaceWeb.

## Резервы и квитанции

Gitbundle/patch/untracked и manifest: `/workspace/.cloud/magic-metal/backups/20261123T045117Z/`. Windowsкопии: `%LOCALAPPDATA%\MagicMetalMigrationBackups\20261123` — sourceZIP, spaceweb-2026-11-23.tgz (4445записей), отдельный SQLgzip (12CREATE TABLE иINSERT), DNS-зона. Пробное восстановлениеMySQL не выполнялось. Не считать это резервом всех сторонних Blob/CMS-хранилищ.

Квитанции Windows: `%LOCALAPPDATA%\MagicMetalSpaceWebMigration`:
- dns-cutover-proof.json;before-cutover.zone;after-cutover.zone;
- verified-20261127.zone;dns-current-20261127.json;
- spaceweb-sitemap-acceptance.json;spaceweb-sitemap-acceptance-20261127.json;
- public-browser-20261127.json;postcutover-public-proof.json;
- staging-rfq-proof.json;postcutover-rfq-20261127.json;
- postcutover-mail-confirmation-20261127.json;
- rollback-and-html-budget-20261127.json.

Публичный архив передачибезсекретов был сохранён во временной ветке transfer/spaceweb-20261123. Пустойdraftrelease migration-spaceweb-20261123 не опубликован. Не путать эти средства передачи с рабочей веткой сайта; автоматической публикации из них нет.

## Следующие публикации сайта

Рабочая ветка документации/средств: feat/free-directory-registration-20261112. Изменения сайта брать из последнего явно выбранного полногоSHA, не подменять более новым docsHEAD. Для воспроизведения:

```sh
node scripts/hosting/prepare-static-export.mjs --source FULL_SHA --target /absolute/new/preparation --deps /absolute/node_modules
cd /absolute/new/preparation
NEXT_PUBLIC_SITE_URL=https://magicmet.ru npm run build -- --webpack
node /absolute/repository/scripts/hosting/finalize-static-export.mjs /absolute/new/preparation
node /absolute/repository/scripts/hosting/package-static-export.mjs /absolute/new/preparation /absolute/new/site.tar.gz
```

Пакетник создаёт только публичные файлы+PHPendpoint; реальные SMTPconfig/vendor отдельно внеpublic_html. Текущая конфигурация вPHPберётся из существующего приватного каталога, не создавать пустой конфиг поверх рабочего. При изменении PHPMailer использовать composer.lock. До замены release — резерв старой папки, проверка нового пакета, технический проход с корректнымHost/TLS. Во внешнем Windows браузере для проверки targetIP использовать отдельныйChrome с --no-proxy-server и --host-resolver-rules; системныеhosts/proxy/VPN владельца не менять. Обычный gitpush/nextstart/Verceldeploy теперь НЕ публикует сайт на SpaceWeb.

## Откат

Если необходим откат веб-DNS: сохранить текущую зону, вернуть apexA76.76.21.21 иwwwCNAME996d484916a38720.vercel-dns-017.com. только пока сохранённый Verceldeployment технически доступен. Наличие оплаченного периода не гарантировать после приблизительно10декабря; биллинг не трогать по указанию владельца. Почтовые записи не менять.

ВозвратWordPress не требуется дляDNSотката и не должен случайно подменить современный каталог. Если отдельно нужно вернуть прежнюю папкуSpaceWeb: сохранить текущийpublic_html под новым именем, вернуть backupWordPress вpublic_html и права755. Не удалять ни одну копию без новой задачи.

Следующая обязательная задача — сохранить этот итог и полный старт в Obsidian с SHAreadback. После этого перенос считается задокументированным; новые проверки без изменений не повторять. По уточнению владельца27.11 далее выполнять только пункт3—бесплатные площадки/модерация/товарные группы. АнализМетрики и обработку обращений сейчас не выполнять.
