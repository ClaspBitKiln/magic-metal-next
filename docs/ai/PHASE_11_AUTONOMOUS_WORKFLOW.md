# Phase 11 — Autonomous Workflow

## Принцип
Один оркестратор последовательно запускает уже готовые блоки.

`RFQ → Identity → Discovery → Verification → Offers → Logistics → Split → Ranking → Margin → Risk → QA → Quote`

## Правила
- Один поток выполнения.
- Следующий шаг запускается после завершения предыдущего.
- При `completed` — продолжаем.
- При `needs_clarification`, `blocked` или `failed` — останавливаемся и передаём исключение человеку.
- Не создаём отдельные автономные агенты-оркестраторы.
- Не добавляем ML, сложные очереди и распределённую систему.

## Результат
Минимальный оркестратор реализован в `src/lib/agents/autonomousWorkflow.ts`.
