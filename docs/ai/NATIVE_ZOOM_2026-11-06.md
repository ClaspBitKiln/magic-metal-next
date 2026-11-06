# Настоящий масштаб 200% — 6 ноября 2026

Локальная проверка завершена: **6 из 6 PASS** — г/к, х/к, оцинковка, медь, нержавеющий лист и материал 12Х18Н10Т. Закрыт ранее отсутствовавший критерий; прежние адаптивные тесты не повторялись.

## Метод и результат

Headed Chromium с `/usr/bin/chromium`, viewport:null, отдельный Xvfb-дисплей на каждый сценарий. Xdotool отправляет ctrl+0, затем пять ctrl+plus. Во всех случаях innerWidth изменился с 1536 до 768 px, devicePixelRatio с 1 до 2: настоящий browser zoom 2.0, без эмуляции viewport/deviceScaleFactor.

Переполнение документа — 0 px во всех шести сценариях, основные CTA сохраняют высоту не менее 44 px. Разделы и CTA доступны. Проверена имеющаяся production-сборка с листовыми формами и исправленным renderer ГОСТ. Общая сборка повторно не запускалась; последний отрицательный edge-case helper не меняет отображаемых реальных данных. Новый PR-CI соберёт текущий SHA.

Скрипт `scripts/verify-sheet-native-zoom.mjs` принимает только шесть фиксированных сценариев и локальный BASE_URL. Блокирует POST, аналитику, чужие origin и service workers. Реальные заявки и обращения к Production исключены. JSON численных проверок: [native-zoom-2026-11-06.json](../operations/native-zoom-2026-11-06.json).

## Инструменты и повтор

Xvfb и xdotool получены из официального Debian trixie по подписанному индексу и распакованы только в `/tmp/mm-zoom-tools`. Системные пакеты, источники apt и приложение не менялись. Проверка подписей и TLS не отключалась. Системный apt был недоступен для записи; исходный snapshot.debian.org блокировался прокси. Использован доступный официальный deb.debian.org с отдельными временными индексом, кэшем и списком источников.

Команда для этой подготовленной сессии:

```sh
PATH=/tmp/mm-zoom-tools/root/usr/bin:$PATH LD_LIBRARY_PATH=/tmp/mm-zoom-tools/root/usr/lib/x86_64-linux-gnu BASE_URL=http://127.0.0.1:3017 PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium xvfb-run -a -s '-screen 0 1920x1080x24' node scripts/verify-sheet-native-zoom.mjs material
```

Временные инструменты не гарантированы после замены среды. CI использует штатную установку Xvfb/xdotool в Ubuntu и Chromium из Playwright. Шесть сценариев добавлены в существующий native-zoom шаг technical-catalog-pilot: дополнительная установка или сборка не требуются. YAML разобран успешно; фактический запуск в GitHub CI пока не подтверждён.

Новых публикаций Vercel, удалений, реальных заявок или изменений DNS не было. Блокер сети GitHub API/live остаётся отдельным внешним условием.
