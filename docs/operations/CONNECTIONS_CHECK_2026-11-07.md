# Проверка связок проекта «Сайт» — 7 ноября 2026

## Подтверждено запросами

- GitHub Git read: magic-metal-next HEAD 3efff82a5fbf96fecfee0503681c1f41d9e606b4; inn-bot HEAD bf33f4a89a015ca2e01e4707b78ebbccbc93b9b0. Через штатный HTTPS Git-прокси вне sandbox. В sandbox соединение с proxy:8080 недоступно; это отдельный механизм, не отказ GitHub.
- Vercel: Production 3efff82 READY; 31 deployment. /workspace/artifacts/vercel-capacity-2026-11-07.json: read_only=true, within_budget, automatic_deletion_enabled=false. Deployment 1152146545 bytes, точка 6 ноября 15:00 UTC; Functions 891501892 bytes, точка 16:00 UTC. Проверено 7 ноября 04:47 UTC. Две метрики fresh по настроенному сроку, очистка не нужна.
- Публичная страница capacity workflow GitHub доступна HTTP200. Последний перечисленный run 42238529583, ранее подтверждён Success со skipped у шага чтения метрик. Свежая авторизованная проверка GitHub Actions secrets заблокирована; не утверждать отсутствие секрета сейчас без такой проверки.

## Наблюдаемые блокеры

- magicmet.ru, api.github.com, api.firecrawl.dev, api-metrika.yandex.net, mcp.desktopcommander.app: свежие GET через штатный proxy получили CONNECT403. Не тестировалась действительность ключей на удалённых сервисах, а только доступность маршрута.
- Runtime allowlist enforced: api.vercel.com + пакетные presets; VERCEL_TOKEN binding ready. Firecrawl/Метрика/Obsidian переменные отсутствуют; загруженный файл содержит ключи, это не настройка runtime.
- Реальных MCP-команд Remote Desktop Commander, Vercel, Firecrawl, Cloudflare, Google Drive, Gmail после отметок приложений не появилось. Не было отправки писем, изменения DNS, аккаунтов или внешних документов.

## Obsidian: найдена прежняя привязка

- PC DESKTOP-BNPIVK2; Remote device 91db0d8b-6299-4299-a643-6f8c45e512e4; broker mcp.desktopcommander.app:443.
- Vault C:/Users/asus/Documents/inn-bot; Local REST HTTPS127.0.0.1:27124, MCP /mcp/. Broker не подставлять в OBSIDIAN_API_URL.
- Последняя исторически доказанная запись/readback через Remote: 3 ноября, Мэджик Металл/Карточки — утверждённый дизайн и публикация — 2026-11-03.md. Запуск Obsidian сейчас подтверждён владельцем, состояние Remote-устройства не проверено.
- Публичный hostname отдельного Obsidian gateway не найден в целевых документах/Git-истории и доступных файлах памяти inn-bot. В inn-bot прочитаны CLAUDE_MEMORY/01_LOCAL_OBSIDIAN_MEMORY_MAP.md, 04_MCP_AND_CONNECTIONS.md, .cursor/mcp.example.windows.json, collab/obsidian_mirror/README.md: описан локальный filesystem/MCP, удалённого endpoint нет. Не объявлять зеркало текущим vault.

## Сохранённые изменения и следующий шаг

Сетевой черновик дополнен mcp.desktopcommander.app с сохранением прежних доменов; start_skill дополнен известным device ID и запретом запускать Remote в облаке вместо Windows. Ответ saved, requires_publish=true. В настройках среды требуется сохранить изменения и опубликовать среду; это отдельное действие интерфейса, которого инструмент не выполнил. После применения повторить проверку доступа свежим соединением.

Для реального Obsidian нужен предоставленный этой сессии коннектор Remote Desktop Commander с существующей привязкой устройства. После его появления сначала проверить устройство/list/read, прочитать правила, затем дописывать накопленные заметки без перезаписи ручных изменений и подтвердить readback. Установку нового туннеля, отключение TLS и переавторизацию чужих сервисов не проводить.

Инструкция v5 DOCX/PDF от 7 ноября обновлена; v4 сохранена в /workspace/backups/magic-metal-start-2026-11-07/revision-4. Ключи и пароли не включены. Сайт не публиковался, публикации Vercel не удалялись.
