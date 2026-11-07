# Проверка стартовой инструкции — 6 ноября 2026

- Новая инструкция: версия 3, восемь страниц, DOCX и PDF в /workspace/artifacts. Markdown: docs/ai/START_NEXT_ACCOUNT.md.
- Оригинальный DOCX сохранён неизменным; SHA256: 9b3119aa2ac945f60e4b1ab27114b979c141f0d69a7dd36e1f340e6392a0899f. Прежний Markdown сохранён в docs/ai/archive/START_NEXT_ACCOUNT_before_2026-11-06.md. Все десять файлов резервного manifest проверены по SHA256.
- DOCX повторно открыт python-docx, ZIP CRC исправен; PDF содержит восемь A4-страниц. Проверены рендеры страниц 1, 3, 4, 5, 7, 8 и текстовая раскладка исходных шести страниц. Ключевые идентификаторы и ограничения присутствуют.
- Setup и public-start проверены на Node 24.22.1/npm 11.9.0; повторная установка сохраняет рабочие зависимости. Public smoke из сохранённого start на порту 3019: главная, горячекатаный лист, 12x18n10t — HTTP 200 с ожидаемым содержимым.
- Во время настройки исходники приложения, package.json, package-lock.json и AGENTS.md не менялись. Повторные полные тесты сайта не запускались: изменений приложения после успешного CI нет.
- Проверенный install_script и start_skill сохранены в черновике облачной среды. requires_publish=true: сетевые изменения ещё не применены. Требования FIRECRAWL_API_KEY и YANDEX_METRIKA_TOKEN добавлены как необязательные, значения не настроены. Vercel binding сохранён. Секреты не экспортированы.
- GitHub capacity workflow: https://github.com/ClaspBitKiln/magic-metal-next/actions/runs/42238529583 — Success, но шаг Read storage metrics and protected deployments пропущен. VERCEL_TOKEN не был доступен этому job. Binding среды не равен GitHub Actions Secret.
- Последний read-only снимок сохранён рядом: START_CAPACITY_SNAPSHOT_2026-11-06.json. Замер 14:00 UTC предшествует Production 14:56:42 UTC: Deployment Storage 1,060,275,595 bytes; Functions Storage 842,105,534 bytes. Это датированная точка, статус metrics_pending, а не гарантия текущего свободного объёма. Удаляющий исполнитель не включён.
- Настоящий Obsidian vault не подключён; сохранены локальная очередь и прочитанные доступные правила. Firecrawl-инструмент отсутствует; содержимое каталога Gefestmetal не выдумывалось.
- Новых публикаций сайта или удалений в рамках подготовки этой инструкции не выполнялось. Последняя подтверждённая Production/main: 3efff82, READY.
