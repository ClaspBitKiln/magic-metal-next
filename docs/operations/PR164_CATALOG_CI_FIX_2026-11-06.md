# PR164 — исправление регрессионных тестов каталога

PR создан владельцем: https://github.com/ClaspBitKiln/magic-metal-next/pull/164. На исходном HEAD5ba2d1d проверка Ferroalloy catalog regression завершилась ошибкой. Источник: https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42236025648/job/127953727324?pr=164.

Публичные annotations указывают на два assertions в catalog-structure.int.spec.ts: таблица форматов ожидалась открытой, у оцинковки ожидался один открытый справочник. Это старая компоновка до утверждённого листового подбора. Код ProductSizeSeries намеренно ставит picker выше и сворачивает справочные таблицы.

До изменения воспроизведены те же две ошибки:72PASS/2FAIL/1SKIP. Исправлены только два кейса tests/int/catalog-structure.int.spec.ts; приложение, данные и skips не менялись. Теперь проверяются порядок picker перед справочником, полный список толщин, оба согласованных раскроя, наличие всех исходных строк и возможность раскрыть детали.

После изменения повторён ровно профиль workflow:3файла,74PASS,1прежнийSKIP. diff--checkPASS. Это локальный результат; новый CI после push требуется подтвердить отдельно. Полная сборка и браузер не повторялись, потому что runtime-код не менялся.

На исходном HEAD публичная checks-страница также показала SUCCESS для material-references,build-decisions,Chromium,Firefox. Lighthouse был skipped по условиюPR;pilot-local ещё работал. После нового commit эти результаты не выдавать за CI нового HEAD.

VercelPreviewIgnored вPR ожидаем: preview экономится политикой. Это не состояние Production. Последняя Production5ae036f ранее подтвержденаREADY с основными доменами.
