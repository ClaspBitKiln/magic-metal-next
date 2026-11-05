# MCP-доступ к Obsidian vault

Подготовлены конфигурации для Windows-клиента на компьютере владельца: JSON MCP и Codex TOML. Использован закреплённый официальный `@modelcontextprotocol/server-filesystem@2.2.0`, доступ ограничен только `C:\Users\asus\Documents\inn-bot\02 Projects\Magic Metal`. Это MCP-доступ к Markdown-файлам vault, а не отдельный Obsidian REST plugin. API-ключи и открытый сетевой порт не требуются.

Конфигурация не активирована: в текущем cloud-клиенте нет инструмента регистрации MCP и доступа к диску Windows. Её нужно добавить в MCP-настройки Windows-клиента, где доступны Node.js и существующий vault. Не переносить этот Windows-путь в Linux как якобы существующую папку и не подставлять local outbox вместо настоящего vault.

После подключения: проверить list_allowed_directories, прочитать существующую заметку проекта; записать одну проектную заметку и прочитать её обратно. Только после этого считать MCP/запись подтверждёнными. До подключения локальная очередь остаётся pending, её readback не равен Windows readback.

Файл с `.example` — готовый шаблон для конкретного хоста, не автоматически загружаемый конфиг этой облачной сессии. Секретов в нём нет. Источник: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem .
