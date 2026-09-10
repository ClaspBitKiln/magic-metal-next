# ФАЗА 1 — ИНВЕНТАРИЗАЦИЯ КОДА И АРХИТЕКТУРЫ

Статус: **завершено** (структурная инвентаризация текущего репозитория по ключевым точкам расширения).

## Найдено

### 1. Supplier Sources уже существуют
`src/collections/SupplierSources.ts`

Коллекция `supplier-sources` уже является внутренним слоем источников. Есть:
- name;
- code;
- website;
- sourceType;
- enabled;
- publicVisible;
- lastCheckedAt;
- lastImportStatus;
- notes.

Доступ ограничен аутентифицированными пользователями. Публичное отображение источников выключено по умолчанию.

### 2. Supplier Offers уже существуют
`src/collections/SupplierOffers.ts`

Коллекция `supplier-offers` уже хранит:
- supplier;
- externalKey;
- category/product/designation;
- size/diameter/wall;
- standard;
- price/currency/unit;
- availability;
- sourceUrl;
- observedAt;
- raw;
- active.

Это означает, что отдельную параллельную модель SupplierOffer создавать нельзя: Procurement Engine должен расширять существующую модель либо работать поверх нее.

### 3. Импорт поставщиков уже реализован
`scripts/import_supplier_catalog.ts`

Сейчас импортная архитектура работает через Payload и имеет генераторы для:
- `metalservice` на основе `public/data/mc-price-snapshot.json`;
- `23met` на основе `private/data/23met-practical-snapshot.json`;
- `e-metall` на основе `private/data/e-metall-products.ndjson.gz`.

Импорт использует upsert источников, dedup по `externalKey`, ограничение параллельных операций и записывает observedAt/raw.

### 4. Публичный каталог уже отделен от внутренних источников
Существующие catalog tests требуют, чтобы публичные snapshots не содержали sourceUrl/sourcePages и чтобы публичные листья имели реальный stock row либо явный RFQ route.

Следовательно, Public Catalog и Supplier Data должны оставаться отдельными слоями.

### 5. Procurement Engine specification уже зафиксирована
Архитектурный pipeline:
`RFQ → normalize → discover → verify → compare → landed cost → benchmark → rank → approve → quote → learn`.

Новый код должен реализовывать эту спецификацию, а не создавать вторую бизнес-логику рядом с ней.

### 6. Obsidian architecture уже зафиксирована
Схема:
`Obsidian → Local REST API / built-in MCP → Gateway → Cloudflare Tunnel → authenticated MCP → AI`.

Физическая установка на Windows не считается завершенной только на основании GitHub-коммитов.

## Решение Фазы 1

1. Не создавать новые дублирующие коллекции SupplierSource/SupplierOffer.
2. Procurement Engine строить как typed domain/service layer поверх существующих Payload-моделей.
3. Master Source Registry остается отдельным справочным слоем и источником конфигурации ролей/маршрутов.
4. Public Catalog не должен получать внутренние поля поставщика.
5. MCP/Plugins использовать как интеграционный слой, а не как замену доменной логике.

## Следующий этап

**ФАЗА 2 — Master Registry поставщиков и производителей:** привести существующий реестр к единой модели ролей, product scopes, procurement route, reliability и integration status, после чего добавить подтвержденные источники ЧЗСИ и КУМЗ как отдельные внутренние слои.
