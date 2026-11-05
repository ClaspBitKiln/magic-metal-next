# Бесплатный надёжный путь: REA, ТРИЗ и опыт специалистов — 05.11.2026

Требования владельца: бесплатный постоянный вариант, надёжность, использовать профильные форумы/плагины/skills, выполнить рабочий промпт. [Промпт](FREE_RELIABLE_HOSTING_PROMPT.md) сохранён и применяется. Общее согласование владельца не отменяет ограничения только Free и не создаёт отсутствующую авторизацию аккаунтов.

## Факты нашего проекта

GitHub public CI без Vercel полностью прошла (run42047443615); выделенная ветка отключена в Vercel git.deploymentEnabled. Актуальный vinext-kit локально прошёл36UI и liveHTTPsmoke4, но полноценная публичная серияUI была отменена по12-минутному лимиту(run42051425897). Это не browser PASS. Идёт отдельная короткая диагностика: нельзя считать HTTP200 подтверждением живой гидратации.

Railway: скриншот владельца показывает Trial expired/Trial Ended, два проекта0/3servicesonline и предупреждение внешних сетевых блокировок. Аккаунт существовал, но сейчас это не подтверждённое бесплатное постоянное размещение. Upgrade не выполнялся. Прежний URL неизвестен; владелец попросил продолжить без него.

Временный Cloudflare URL истекает примерно21:03Екатеринбург05.11. Он пригоден для демонстрации, не для постоянного рабочего процесса. Автоматический push-триггер временного deployment отключён; workflow оставлен только для явного workflow_dispatch. Никаких циклических продлений.

## Что прочитано в профильных обсуждениях

| Источник | Наблюдение участников | Как применять у нас |
| --- | --- | --- |
| [Payload15876](https://github.com/payloadcms/payload/discussions/15876),08.03.2026 | Bundler/CJS/server-action проблемы vinext с Payload3.79; Collaborator paulpopus10.03 говорит о тестировании и зрелости | Сигнал риска beta, не доказательство сбоя нашей3.88 |
| [Payload16937](https://github.com/payloadcms/payload/discussions/16937),09.06–02.07 | Перенос Sharp в Images/WASM меняет обработку изображений и imageSizes | Нельзя обещать бесплатную drop-in замену nativeSharp |
| [Payload15315](https://github.com/payloadcms/payload/discussions/15315),22.01 | Сообщение о росте RSS200MB→>1GB на Railway, Payload3.71.1/Next15.4.10 | Измерять память; корень и воспроизводимость на нашем коде не доказаны |
| [OpenNext1381](https://github.com/opennextjs/opennextjs-cloudflare/issues/1381),04.09,обновление24.10,OPEN | ПовторныеSSR/1102 на1.20.1/1.20.6, включаяPaid | Нужны cold/repeated runtime проверки; latest1.20.16 этим не признан сломанным |

Обсуждения прочитаны агентом по обычным GitHubстраницам. Официальный Railwaypricing из этой среды не прочитан(403/не найден repo); числа месячных кредитов из памяти не используются как текущая гарантия.

## REA и ТРИЗ: конкретное изменение схемы

Противоречие: простому публичному каталогу нужен дешёвый стабильный runtime, а полный Payload/Sharp несёт отложенную админку, память и зависимости. Принцип разделения: в отдельном preview-артефакте оставить каталог/поиск/UI и защиту заявки, исключить только копии отложенных CMS/admin/cron; оригинал проекта и production не удалять. Почтовый production-маршрут не заменять фиктивным успехом.

REA: GitHub хранит точный source и выполняет проверки один раз; постоянная Git-интеграция хостинга должна получать одобренную версию без переносов токенов/ручных upload. Предпочтительный постоянный канал — native Workers Builds+GitHub App. Официальная интеграция сама создаёт build token, но требует одноразового входа и разрешения обычного Cloudflare account.

Официальные Free ограничения CF: Builds3000min/month,1concurrent,20mintimeout; Workers100000requests/day,10msCPU/request,128MB; assets/Images/R2 отдельны. Эти числа — ограничения, не обещание безлимитной надёжности. В предлагаемой конфигурации R2/Images/Queues не включаются.

Сравниваются адаптеры: CFтекущийNextguide рекомендуетvinextдляNext16, но отмечаетbeta; стабильныйOpenNextадаптируетнастоящийnextbuild. Реестрnpmподтвердил OpenNext1.20.16peerNext>=16.4.5дляветки16; latestNext16.4.5; Payload3.88разрешает>=16.2.6<17. Поэтому стабильный вариант проверяется в изолированной копии, безопасный выбор не делается по названию.

Установка stable-копии: первоначально ошибочно добавленный необязательныйrclone.js остановился на внешнем downloads.rclone.org. Официальный peerDependenciesMeta помечает его optional; безR2 он исключён. Next16.4.5/OpenNext1.20.16/Wrangler4.158.0 установлены сTLS/integrity,1019packages. Root package/lockfile и сайт не менялись. Сборка/runtime ещё требуют результата; выбранным production это пока не называется.

## Официальные источники

- [Шаблон Cloudflare](https://github.com/cloudflare/templates/tree/main/next-starter-template).
- [OpenNext](https://github.com/opennextjs/opennextjs-cloudflare),[существующий проект](https://raw.githubusercontent.com/opennextjs/docs/main/pages/cloudflare/get-started.mdx).
- [CF GitHub integration](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/ci-cd/builds/git-integration/github-integration.mdx).
- [Build token](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/ci-cd/builds/configuration.mdx),[Build limits](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/ci-cd/builds/limits-and-pricing.mdx).
- [Runtime limits](https://raw.githubusercontent.com/cloudflare/cloudflare-docs/production/src/content/docs/workers/platform/limits.mdx).

Следующий критерий — проверенная стабильная сборка и реальная работа UI/runtime; постоянная публикация и почта остаются отдельными воротами. Итоги записывать в память и локальный Obsidian outbox с readback, не выдавая это за синхронизацию Windowsvault.

## Фактический итог стабильного прототипа

Next16.4.5 build203 и OpenNext1.20.16 build прошли. ОшибкаSharp устранена полной изоляцией node_modules и outputFileTracingRoot:dirname; исходный symlink обходил патченные traced files. Loader/stub дляSharp не использовался. ВWranglerassets добавлены html_handling:none/not_found_handling:none по явной ошибке адаптера. Локальный workerd: главная/лист/поиск200noindex,admin404;36профильныхbrowser,15layouts(overflow0,inputs≥16px,targets≥44px),6native200% прошли. Wranglerdeploy--dry-run прошёл:8436.92KiB/gzip1423.86KiB,220assets,толькоASSETSиanalytics0. Публичная постоянная публикация не выполнялась.

Уточнениеbetaпробы: короткий публичныйChromiumprobe42055209228 далHTTP403,H0,UI0. Это блок доотображения страницы, не доказанная ошибкагидратации. Старый публичный полныйнабор отменён12мин,а неpassed. Временнаяссылкаистекает;неиспользоватьеёкакнадёжныйрабочийадрес.

Последнее указаниевладельца: интересуетредактированиеипубликациясайтачерезGPT,остальноеневажно. Контрользаявокисключён. Исследованиеиstablekitсохраняютсякакрезерв,некакобязательнаямиграция. Рабочийвыпуск—существующиепроверенныеправкилистовнаосновномстеке.
