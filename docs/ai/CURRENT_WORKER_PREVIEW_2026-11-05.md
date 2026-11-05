# Актуальные листы в Worker preview — 05.11.2026

App source: f3236eabd5b3f3113d35729e6db5a6701d47e50c (каталог PR160–163 и простые листовые формы). Workflow/kit source: 83974c1 (первый запуск8163270). Версии закреплены в deploy/cloudflare-preview/versions.json; зависимости root package/lockfile не менялись.

## Локально подтверждено

Очищенный git archive актуального app source, сохранённый route patch и неизменённый утверждённый HTML f119e5a2ac7e56ff990d5fbef704005d9146080f637e468653257f54ebaaaeb0. Закреплённые изолированные зависимости повторно использованы из прежнего прототипа; root React19.2.6 не менялся, isolated React19.3.1 обусловлен vinext.

Реальная Worker-сборка и запуск в workerd прошли. Главная/холодный лист/поиск HTTP200; HTML noindex, admin404, RFQ503. На этом runtime прошли 32 sheet/file E2E и 4 существующих nonferrous kind/no-JS сценария. Это новые проверки актуальной сборки, не перенос старых результатов c8c7938.

Три теста fake CLI подтверждают сохранение claim credential в приватном runner log и отсутствие его в stdout/summary/outputs при успехе, ошибке и неоднозначных URL. YAML/JS синтаксис проверен; независимый review подтвердил команды и пути. Исправлено разделение app source и workflow SHA, срок обозначен ориентировочно. Исходный sandbox EPERM при prepare устранён штатным запуском с разрешением; неверный флаг Vite --root заменён запуском из рабочего каталога.

Профильные лимиты temporary assets проверены до deployment: 257 файлов, максимум 1 157 072 байта (допустимо ≤1000 и ≤5MiB). Новых БД, SMTP или платных bindings в конфигурации нет. Native Sharp/Payload и production SMTP/TLS не объявлены совместимыми.

## Публичная проба

[Успешный публичный запуск](https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42050850604) выполнил штатный cf deploy --prebuilt --temporary-account --no-provision и live smoke:200/noindex на главной и листе,404admin,503RFQ. URL: https://magic-metal-plan-b-preview.peach-tuna.workers.dev . Публикация начата05.11 в20:03:04Екатеринбург, закончена20:03:23; ориентировочное удаление около21:03UTC+5, не гарантированный серверныйexpiry.

Первый запуск42049802723 создал deployment, но smoke упал; точная причина не установлена, задержка распространения не доказана. Вместо слепого повторения добавлены bounded retry и безопасные HTTP-диагностики. Повторный запуск успешно подтвердил все4реальныхответа. Диагностическое название read-onlyjob публично показывает URL и200-noindex1,200-noindex1,404,503. Claim credential не раскрывается.

Попытку дать workflowcontents:write для записи результата вGitHub отклонил автоматический review: лишняя постоянная возможность commit/push. Команда не исполнялась, права не расширялись. Выбрана разрешённая безопасная альтернатива:contents:read и публичные job metadata. Записи вGitHub делает основной агент обычнымавторизованнымGitpush, не workflow.

[Дополнительный браузерный запуск по существующему URL](https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42051425897) проверяет живые формы/вложения/kind/no-JS. Он не пересобирает и не публикует сайт, не создаёт/продлевает аккаунт. Результат:cancelledпо12-минутномулимиту,неPASS. Короткийprobe42055209228показалHTTP403дляChromiumдоотображениястраницы;NodeHTTPsmokeприэтомпрошёл. Причинанеустановлена,кодгидратациинеобъявляетсясломавшимся.

Это временный аккаунт: CLI в CI принимает стандартные Terms/Privacy и не требует payment/token/login. Если claim не завершён за60мин, аккаунт и ресурсы удаляются. Не выполнять автоматическое продление; не обещать постоянный Git→hosting. [Официальный контракт](https://developers.cloudflare.com/workers/platform/claim-deployments/). Для постоянного размещения всё ещё нужен действующий аккаунт и проверка настоящих Free runtime-квот.

Raw cf stdout/stderr может содержать секретный claim URL. Он не публикуется в Actions/артефактах/Git/памяти/Obsidian; в summary допускается лишь публичный workers.dev URL. Постоянные credentials в этот workflow не добавлять.

Vercel deployment на выделенной ветке отключён. Main, DNS и magicmet.ru не изменялись. Бесплатный public runner без cache/artifact storage; прежняя Node CI не повторяется на изменениях только preview-kit. Реальные заявки preview не отправляет.

Локальные артефакты /tmp/current-worker-* могут не перенестись в другую среду. Память/локальный Obsidian outbox обновляются по финальному результату; прямой Windows vault здесь недоступен.
