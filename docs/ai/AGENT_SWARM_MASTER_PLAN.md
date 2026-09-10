# Magic Metal — Master Plan: Agent Swarm

## Цель
Создать управляемый рой специализированных AI-агентов, работающих вокруг единого Procurement Engine и общей базы знаний. Рой не показывает клиенту внутренние источники, закупочные цены, поставщиков или маржинальность.

## Принцип
Один оркестратор → специализированные агенты → единые нормализованные данные → проверка → решение → КП.

Агенты не дублируют друг друга и не принимают независимые финальные решения вне своих полномочий.

## Роли роя
1. **Orchestrator / Диспетчер** — принимает задачу, разбивает на этапы, запускает агентов, собирает результаты.
2. **RFQ Parser** — извлекает из заявки товар, размеры, ГОСТ/ТУ, марку, количество, единицу, документы, сроки, направление поставки.
3. **Product Identity Agent** — нормализует номенклатуру, размеры, марки и стандарты; определяет exact/alternative/uncertain.
4. **Supplier Discovery Agent** — ищет реальные каналы закупки по Master Registry.
5. **Supplier Verification Agent** — проверяет актуальность источника, наличие, цену, условия и свежесть данных.
6. **Offer Normalizer** — приводит предложения к единому формату.
7. **Procurement Ranking Agent** — сравнивает предложения по landed cost, соответствию, наличию, сроку, надежности.
8. **Logistics Agent** — рассчитывает маршрут, pickup, перевозку, перегрузку, границу/таможню, доставку до клиента и риск.
9. **Split Procurement Agent** — определяет, выгоднее ли купить весь заказ у одного источника или разделить по поставщикам с консолидацией.
10. **Benchmark Agent** — сравнивает закупочную экономику с рыночными ориентирами, не подменяя ими реальные предложения.
11. **Margin Agent** — рассчитывает минимальную цену продажи, валовую прибыль, маржу и запас по риску.
12. **Technical Agent** — проверяет ГОСТ/ТУ, химсостав, мехсвойства, сертификаты и допустимость альтернатив.
13. **Risk Agent** — выявляет неопределенности: отсутствие подтверждения, устаревшие цены, слабый источник, логистические риски, технические отклонения.
14. **Quote Agent** — формирует клиентское КП без раскрытия внутренних данных.
15. **QA / Auditor Agent** — проверяет результат перед выдачей: арифметика, соответствие, приватность, отсутствие выдуманных данных.
16. **Knowledge Agent** — фиксирует подтвержденные решения, новые источники, правила и lessons learned в Obsidian/GitHub.

## Инструменты
- GitHub — код, документация, CI и source of truth.
- Payload CMS/PostgreSQL — внутренние поставщики, предложения, источники и операционные данные.
- Procurement Engine — ядро расчета закупки.
- MCP — безопасный доступ агентов к специализированным системам.
- Obsidian — долговременная база знаний и решений.
- Firecrawl — исследование публичных сайтов там, где нет официального API, с обязательной верификацией.
- Activepieces/n8n — автоматизация цепочек и внешних интеграций.
- OpenAI Agents SDK — оркестрация агентных workflow там, где это оправдано.

## Этапы реализации

### Этап 0 — Governance
Зафиксировать роли, права, границы, форматы сообщений, приватность и правила эскалации.
**Готово, если:** ни один агент не может раскрыть supplier/source/purchase price клиентскому слою.

### Этап 1 — Inventory
Инвентаризировать существующий код, источники, Payload, документы и уже созданный Procurement Engine.
**Статус:** выполнено.

### Этап 2 — Master Registry
Единый реестр поставщиков/производителей/агрегаторов: ЧЗСИ, КУМЗ и остальные источники. Для каждого — scope, route, roles, freshness, reliability, integration status.

### Этап 3 — Agent Contracts
Создать типизированные контракты агентов и единый внутренний `AgentTask/AgentResult`.

### Этап 4 — RFQ Pipeline
Parser → Identity → Technical validation → normalized RFQ.

### Этап 5 — Procurement Core
Discovery → Verification → Normalization → deterministic matching → ranking.
Исправить numeric grades, ГОСТ normalization и устойчивость ranking.

### Этап 6 — Logistics Engine
Полный landed-cost calculator с configurable lanes, legs, fixed/variable tariffs, lead time и risk allowance.

### Этап 7 — Split Procurement
Оптимизация одного поставщика против нескольких поставщиков с консолидацией и минимизацией транспортных плеч.

### Этап 8 — Commercial Economics
Закупка → landed cost → минимальная цена → target price → gross profit → margin → risk buffer.

### Этап 9 — Client Quote
Генерация КП из подтвержденного procurement decision. Только клиентские поля.

### Этап 10 — MCP / Plugins
Подключение специализированных инструментов: GitHub, Firecrawl, Obsidian Gateway, Activepieces/n8n и других источников. Каждый инструмент получает минимально необходимый доступ.

### Этап 11 — Autonomous Workflow
Оркестратор автоматически запускает рой по RFQ, ожидает результаты, делает повторные проверки и эскалирует только исключения.

### Этап 12 — Knowledge Loop
Каждый завершенный RFQ обучает систему: accuracy источника, фактические сроки, отклонения цены, claims, новые procurement routes.

### Этап 13 — Website / CRM
Подключить публичную форму заявки и внутренний workspace. Клиентский каталог показывает только позиции с реальным procurement route.

### Этап 14 — QA / Security / Production
CI, integration tests, privacy tests, audit trail, observability, retries, timeouts, rate limits, secrets policy, production build.

### Этап 15 — Continuous Optimization
Ежедневная/еженедельная аналитика: win rate, quote speed, source accuracy, landed-cost variance, gross margin, supplier performance, automation coverage.

## Главный workflow

`Client RFQ → Orchestrator → Parser → Identity → Discovery → Verification → Technical → Offers → Logistics → Split → Ranking → Margin → Risk → QA → Quote → CRM → Knowledge Loop`

## Правило перехода
Следующий этап начинается только после того, как текущий этап имеет:
- код/конфигурацию;
- тесты;
- документацию;
- проверенный результат;
- зафиксированный статус в GitHub.

Не строить следующий слой поверх неподтвержденного предыдущего.

## Приоритет
Сначала рабочая закупка и экономика. Затем автономность. Затем маркетинговая автоматизация. Никакого "AI ради AI".
