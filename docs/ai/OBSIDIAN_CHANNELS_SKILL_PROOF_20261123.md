# Obsidian и Windows: проверка записи23.11.2026

Windows DESKTOP-BNPIVK2, **PID18212 exit0**. Из закреплённого коммита `652267ca7c2e075a3aba4fbbb73b7bae7eb75e9b` записаны восемь файлов; SHA256 проверен до копирования и после записи. Старые версии сохранены с `.backup-652267c`.

В `C:\Users\asus\Documents\inn-bot\02 Projects\Magic Metal`:

- `FREE_CHANNELS_PLAN_20261123.md`: `e2ff51f6ea14e5184c33dc19e08e78c38508e2c074529b962a6e4edf4788e51b`.
- `SPACEWEB_RETURN_FEASIBILITY_20261123.md`: `09e8b20f6f9223586f26fff858085782c427a4b1ed413fab91849960998d18af`.
- `00 - Инструкция старт - все подключения.md`: `91d8fb00a62376d8babc57d7b34f73a683209af21ec162ca7cc0a72a970cafb0`.
- В `Automation\free-directory-acquisition`: SKILL.md, references/channels.json, references/campaign-workflow.md, scripts/preflight.mjs и scripts/preflight.test.mjs — все source/readback совпали.

**Пять тестов preflight прошли на Windows**, exit0. Ранее те же профильные проверки прошли в облачном checkout; полный тест приложения не запускался, сайт не менялся.

Локальная проверка пакета запускается по команде:

`node "C:\Users\asus\Documents\inn-bot\02 Projects\Magic Metal\Automation\free-directory-acquisition\scripts\preflight.mjs" "C:\private\placement-package.json"`

Путь JSON — пример, использовать фактический приватный пакет. Предварительная проверка не регистрирует и не публикует объявления; дальнейшее исполнение выполняет агент штатными разрешёнными инструментами. Нативный MCP/плагин в ChatGPT этим не устанавливался.

Квитанция: `%LOCALAPPDATA%\MagicMetalYandex360\obsidian-channels-skill-20261123.json`. Новых расписаний нет. Vercel, SpaceWeb, Beget и DNS не изменены. Поставщики/КП на паузе. Новых публикаций из этого исследования нет.
