# Бесплатные проверки GitHub без Vercel — 05.11.2026

Статус: REMOTE_CI_VERIFIED. Это рабочая проверочная часть цепочки, не перенос публичного сайта.

Ветка `free-ci/sheets-20261105` отправлена в GitHub. Проверенный source `eda0fc4ed225dd912c15af81e1f88ab7519a3fa0` содержит листовую интеграцию f3236ea поверх актуального main 2f526c5 и конфигурацию независимого CI.

[Реальный запуск №1](https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42047443615), [job](https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42047443615/job/127314152344). Через доступную страницу GitHub прочитаны финальные data-conclusion: установка, sheet/context unit, webpack build, локальный сервер, sheet/file browser, навигация цветных форм, summary и Complete job — все success. Это не просто статус queued или зелёная синтаксическая проверка. Содержимое закрытых для анонимного просмотра логов не выдаётся за прочитанное.

## Цепочка

Коммит → push выделенной ветки → public Ubuntu runner → профильные unit → одна production-сборка → локальные Chromium UI-сценарии → аннотации и журнал GitHub → сверка source SHA → память/Obsidian outbox.

Workflow `.github/workflows/free-sheet-check.yml` использует только contents:read и автоматический GITHUB_TOKEN. Job запускается исключительно при repository.private=false, ограничен 20 минутами; concurrency отменяет устаревший запуск. Реальных SMTP/POST/аналитики в QA нет. Workflow не размещает сайт публично и не меняет DNS.

В `vercel.json` добавлена точная карта git.deploymentEnabled: free-ci/sheets-20261105=false. Официальный тип подтверждает, что эта ветка не триггерит auto-deployment, а неуказанные ветки по умолчанию true. Не использовать неподтверждённый wildcard. Main не объединяли и его production-настройки не меняли.

Стандартные public Linux runners бесплатны; отдельное платное хранение не используется: upload-artifact и setup-node cache отсутствуют. Отчёты — run log, check annotations и GITHUB_STEP_SUMMARY. Нельзя переносить обещание бесплатности на private/large runners, платные артефакты или иной хостинг. Workflow YAML/JSON и shell-блоки проверены; приложение повторно локально не пересобиралось без изменения кода. Локальные 41 unit/36 разных UI-сценариев описаны в SHEETS_CURRENT_MAIN_INTEGRATION_2026-11-05.md.

ТРИЗ: противоречие между частыми проверками и лимитом Vercel разрешено разделением места проверки и места публикации. Реинжиниринг: GitHub уже получает код и имеет бесплатный public runner, поэтому шаг проверки больше не зависит от внешнего preview-тарифа. Производственная публикация остаётся отдельным действием с точным SHA и live-подтверждением.

## Что ещё не выполнено

Публичный preview/production не перенесён. В текущей облачной среде нет подключённой Cloudflare-идентичности, custom network permissions не применены. Проверенный ранее Workers-kit сохранён в инфраструктурной ветке и привязан к старому c8c7938; не выдавать его за публичную версию новой листовой интеграции. Для постоянного Cloudflare deployment нужна действующая привязка аккаунта и проверка нового source/runtime/квот/почты. Не создавать аккаунт от чужого имени, платные ресурсы или временный preview как бессрочный хостинг.

Листовые правки доступны в GitHub-ветке и проверены удалённо, но ещё не объединены в main и не опубликованы на magicmet.ru. Новые Vercel builds не запрашивались; отключение ветки реализовано штатным конфигом, прямой API/Vercel-dashboard из этой среды не проверялся.

## Источники

- [Официальный тип Vercel на точном коммите](https://github.com/vercel/vercel/blob/84878e532142f0ac584953695658b324eb9e5b80/packages/config/src/types.ts#L260-L268).
- [GitHub: бесплатные public runners](https://raw.githubusercontent.com/github/docs/main/data/reusables/billing/compute-allowance-model.md).
- [GitHub: автоматический GITHUB_TOKEN](https://raw.githubusercontent.com/github/docs/main/content/actions/concepts/security/github_token.md).

Память обновлена, заметка и память скопированы в локальный Obsidian outbox с побайтным readback. Реальный Windows vault здесь недоступен; синхронизация pending. Документационный push исключён из триггера этой проверки.
