# Этап 14 — QA / Security / Production

## Цель
Минимальный production-gate перед публикацией: проверить сайт, API-доступы, клиентскую границу и обязательные переменные окружения.

## 1. QA
- `pnpm lint`
- `pnpm test:int`
- `pnpm test:e2e`
- `pnpm qa:production`
- при публикации дополнительно: `pnpm build`

При недоступном окружении команда считается **не выполненной**, а не успешной.

## 2. Security
### Публично
- Products: read public; create/update/delete только authenticated.
- Requests: create public; read/update/delete только authenticated.
- RequestFiles: create public; read/update/delete только authenticated.
- SupplierSources, SupplierOffers, LogisticsBenchmarks: только authenticated.
- Users: Payload auth.

### Секреты
- `PAYLOAD_SECRET` и `DATABASE_URL` обязательны и читаются только из environment.
- `.env*` не коммитятся.
- Секреты не помещаются в client-facing quote или публичный каталог.

### Клиентская граница
Client Quote содержит только product, size, quantity, selling price, currency, delivery и status. Внутренние supplier/source/purchase price/margin/ranking данные запрещены.

## 3. HTTP security
Уже установлен базовый набор headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Permissions-Policy`; `poweredByHeader` отключён.

## 4. Production gate
Публиковать только если:
1. lint проходит;
2. unit/integration tests проходят;
3. E2E/QA production проходит;
4. build проходит;
5. нет критических security findings;
6. client boundary не содержит внутренних закупочных данных.

Если любой обязательный пункт не подтверждён — статус **NOT READY**.

## Ограничение этапа
Не добавляем WAF, сложный RBAC, SIEM, rate-limit инфраструктуру или отдельный security-сервис без реальной необходимости. Сначала закрываем очевидные production-риски существующего приложения.
