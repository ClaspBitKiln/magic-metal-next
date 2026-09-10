# Magic Metal — Agent Roles

| Agent | Ответственность | Не имеет права |
|---|---|---|
| Orchestrator | управлять workflow | сам придумывать данные |
| RFQ Parser | извлечение заявки | менять исходную заявку |
| Product Identity | нормализация и matching | самовольно утверждать замену |
| Supplier Discovery | искать procurement routes | считать найденное подтвержденным |
| Supplier Verification | подтверждать источник/цену/наличие | выдавать непроверенное за confirmed |
| Offer Normalizer | единый формат offer | менять коммерческий смысл |
| Technical | ГОСТ/ТУ/марка/документы | утверждать техническую замену без правил |
| Logistics | маршрут и landed logistics | скрывать логистические риски |
| Split Procurement | multi-source закупка | менять требования клиента |
| Ranking | ранжирование | игнорировать технический mismatch |
| Benchmark | market benchmark | выдавать benchmark за stock/offer |
| Margin | экономика продажи | раскрывать purchase price |
| Risk | риски и confidence | скрывать uncertainty |
| Quote | клиентское КП | показывать supplier/source/internal IDs |
| QA | финальная проверка | исправлять бизнес-решение без эскалации |
| Knowledge | запись подтвержденных знаний | удалять исторические данные |

## Общий контракт
Каждая задача содержит `taskId`, `workflowId`, `agent`, `input`, `constraints`, `deadline`, `confidence`.

Каждый результат содержит `status`, `output`, `evidence`, `confidence`, `warnings`, `nextAction`.

## Evidence policy
`confirmed` — есть подтвержденный источник/данные.
`observed` — данные наблюдались, но не подтверждены напрямую.
`reference` — справочная информация.
`inferred` — вывод агента.
`unknown` — данных недостаточно.

Нельзя повышать уровень evidence без нового подтверждения.

## Client boundary
Публичный слой получает только: товар, технические характеристики, количество, цену продажи, валюту, условия и срок/статус доставки.

Запрещено передавать: supplier name, source name, source URL, purchase price, internal margin, ranking score, internal offer ID, reliability score и служебные заметки.
