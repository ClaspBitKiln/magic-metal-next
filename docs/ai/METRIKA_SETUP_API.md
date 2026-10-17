# Подготовка счётчика и целей Метрики

`node scripts/metrika-setup.mjs` — проверка без изменений. Нужна защищённая переменная `YANDEX_METRIKA_SETUP_TOKEN` с OAuth-разрешением `metrika:write`; токен не передавайте аргументом и не записывайте в Git/`NEXT_PUBLIC_*`. Без токена запросов нет.

```sh
node scripts/metrika-setup.mjs
node scripts/metrika-setup.mjs --apply
# Только при нескольких подходящих счётчиках:
node scripts/metrika-setup.mjs --counter 12345678 --apply
node --test scripts/metrika-setup.test.mjs
```

Скрипт выполняет запросы только к `https://api-metrika.yandex.net`; без `--apply` только GET. При `--apply` повторно использует активный счётчик основного домена magicmet.ru (www эквивалентен). Если счётчиков несколько, останавливается до записи и требует ID. Отсутствующий счётчик создаётся с именем magicmet.ru, `site2.site=magicmet.ru`, типом `simple` и часовым поясом `Asia/Yekaterinburg`. Настройки существующего счётчика, фильтры роботов, код, доступы и согласия не меняются. Счётчик, где magicmet.ru указан только зеркалом другого основного домена, автоматически не выбирается.

Создаются только 12 заранее определённых JS-целей: `phone_click`, `email_click`, `request_click`, `catalog_product_opened`, `standard_opened`, `size_filter_used`, `size_selected`, `request_started`, `request_step_2`, `specification_attached`, `request_sent`, `request_error`. Payload — `{goal:{name,type:'action',conditions:[{type:'exact',url:name}]}}`. Точное существующее условие используется повторно, независимо от отображаемого имени. Конфликт имени или дубликаты требуют ручной проверки до создания целей. После записи цели перечитываются. Транзакции между запросами API нет: при сетевом сбое сначала повторите проверку без `--apply`; последовательный повтор не дублирует завершённые действия. Параллельно несколько экземпляров не запускайте.

Вывод содержит только публичный ID счётчика и статусы целей; OAuth, владельцы, сырые ответы и ошибки API не выводятся. Автоматических изменений Vercel, файлов env, репозитория и установки пакетов нет. После подготовки публичный ID нужно передать отдельному процессу публикации сайта. Для чтения истории используйте `metrika-report.mjs` с отдельным read-only токеном. До запуска клиента сбор посещений не начинается, прошлую историю создание счётчика не восстанавливает.

Схема сверена чтением явных примеров и схем зеркала документации на GitHub (это **не официальный репозиторий Яндекса**; никакой код оттуда не запускался):

- <https://github.com/az6ru/metrika-docs/blob/main/ru/management/addgoal-example.md>
- <https://github.com/az6ru/metrika-docs/blob/main/ru/management/openapi/goal/addgoal.md>
- <https://github.com/az6ru/metrika-docs/blob/main/ru/management/openapi/counter/addcounter.md>

Официальный API: <https://yandex.ru/dev/metrika/ru/management/>. Официальный сайт документации из текущего облака был недоступен через прокси. Авторизованные запросы к настоящему API не выполнялись: успех офлайн-тестов проверяет управление запросами и идемпотентность, а не права конкретного аккаунта.
