# Привлечение РФ/СНГ: локальная рабочая программа

`scripts/growth/acquisition.mjs` дополняет существующую воронку из
`CONTINUOUS_FUNNEL_OPTIMIZATION.md` и офлайн-анализатор `prioritize-funnel.mjs`.
Она ведёт площадки, готовит карточки и UTM-ссылки, хранит состояния размещений и
частную очередь `new → qualified → proposal_sent → won/lost`. Новую CRM,
подписку, зависимости или постоянное расписание не создаёт.

**Программа не регистрирует аккаунты, не публикует карточки, не отправляет
сообщения и не обходит CAPTCHA.** Для исследованных площадок нет подтверждённого
разрешённого API регистрации; некоторые правила прямо ограничивают программный
доступ. Реальные регистрации выполняются отдельно с необходимыми подтверждениями.
Подготовленный черновик не считается размещением или привлечённым клиентом.

## Начало

Нужен Node.js из рабочего окружения проекта, установка пакетов не требуется.
Приватное состояние по умолчанию:
`/workspace/.cloud/magic-metal/growth/operations`.
Команды не выводят имена/контакты/содержание лидов. Каталог состояния имеет права
0700, файлы 0600 на POSIX; на Windows дополнительно нужны соответствующие ACL.

```bash
node scripts/growth/acquisition.mjs init
node scripts/growth/acquisition.mjs platforms
node scripts/growth/acquisition.mjs plan --market RF
node scripts/growth/acquisition.mjs plan --market KZ
node scripts/growth/acquisition.mjs plan --market UZ
node scripts/growth/acquisition.mjs draft --platform prom-uz --market UZ
node scripts/growth/acquisition.mjs stats
```

Для Windows или другого executor добавьте к каждой команде
`--state-dir <приватная-папка-вне-репозитория>`. Не размещайте состояние в Git,
в том числе через symlink. Команды откажутся писать в текущий публичный worktree.
Повторный `init` сохраняет старое состояние и профиль. Параллельный запуск
блокируется `.lock`; после аварии сначала убедитесь, что старый процесс не
работает, и только затем разберите оставшийся lock.

Исходный профиль содержит только опубликованные контакты компании. Для своих
подтверждённых данных подготовьте приватный JSON и передайте
`init --profile /private/company.json` до первой инициализации. Допустимы поля
`name`, `website`, `email`, `phone`, `description`, `legalName`, `taxId`, `address`.
Не добавляйте секреты, местные офисы, наличие, цены и сроки по предположению.
Профиль уже существующего состояния повторный `init` не заменяет.

## План и черновики

`platforms.json` содержит публичные источники и ограничения, проверенные
8 ноября 2026 года. Тарифы и допуск российской компании перепроверяются перед
регистрацией. `automationAllowed=false/unknown` не является разрешением
автоматизировать форму. GoldenPages без местного юрлица и Satu как платный
каталог не включать в бесплатное размещение.

План показывает и ограничения, а не только кандидатов. Черновики лежат в
приватной папке `drafts`. Повторная генерация не перезаписывает ручные изменения.
UTM-ссылки содержат только идентификатор площадки, канал `directory` и рынок;
контакты и спецификации в URL не передаются. Наличие ссылки `/postavki/kazakhstan`
в черновике само по себе не доказывает её публикацию — проверить live перед
размещением.

## Фиксация реальных результатов

```bash
node scripts/growth/acquisition.mjs record --platform prom-uz --market UZ --status needs_verification
node scripts/growth/acquisition.mjs record --platform prom-uz --market UZ --status submitted --evidence https://www.prom.uz/company/REAL-PAGE --confirmed yes
node scripts/growth/acquisition.mjs record --platform prom-uz --market UZ --status published_verified --evidence https://www.prom.uz/company/REAL-PAGE --confirmed yes
```

Заменить `REAL-PAGE` фактической публичной страницей или подтверждением
площадкой. URL должен быть HTTPS на домене площадки, без токенов/query.
`--confirmed yes` означает **подтверждение уполномоченным владельцем**, а не
автоматическую проверку сети программой. Она хранит `evidenceType=owner_confirmed`.
Без такого подтверждения статус нельзя выставить. Повторная запись той же
площадки/рынка не создаёт второй результат. В `stats` поле
`verifiedRegistrations` считает уникальные подтверждённые площадки: одна Allbiz
с задачами РФ и Казахстана даёт 1, а не 2. Это не независимая проверка количества
аккаунтов. `verifiedPlacements` и `tasks.published_verified` отдельно считают
региональные задачи размещения.

## Частная очередь обращений

Подготовьте JSON вне Git с обязательными `contact`, `request`, `market`
(`RF`, `KZ`, `UZ`); необязательны `reference`, `company`, `platform`.
Используйте стабильный `reference` обращения, если он есть. При отсутствии
reference дедупликация идёт по нормализованному контакту и описанию.

```bash
node scripts/growth/acquisition.mjs lead-add --file /private/new-lead.json
node scripts/growth/acquisition.mjs lead-move --id ID_ИЗ_КОМАНДЫ --stage qualified
node scripts/growth/acquisition.mjs lead-move --id ID_ИЗ_КОМАНДЫ --stage proposal_sent
node scripts/growth/acquisition.mjs lead-move --id ID_ИЗ_КОМАНДЫ --stage won
node scripts/growth/acquisition.mjs stats
```

Переход прямо из `new` в `won` запрещён; потеря обращения допускается на любом
открытом этапе. Данные не передаются в LLM, CRM или сторонние сервисы.
`stats` показывает только агрегаты. Число карточек, посещений и действий
Метрики не подменяет реальные полученные обращения, КП и сделки.
