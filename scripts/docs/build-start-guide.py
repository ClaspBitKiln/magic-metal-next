#!/usr/bin/env python3
"""Build the standalone startup guide from maintained sections; no service actions."""
from pathlib import Path
import re
root = Path(__file__).resolve().parents[2]
docs = root / "docs/ai"
sections = [("A. Порядок начала работы", "START_HERE.md"), ("B. Все подключения и восстановление", "CONNECTIONS_RUNBOOK.md"), ("C. Текущая передача задач", "CURRENT_HANDOFF.md"), ("D. Полнота, расчёты и первый запрос", "START_COMPLETENESS.md")]
parts = ["# Полная стартовая инструкция Magic Metal\n\nВерсия 5, 27.11.2026. Часовой пояс: Asia/Yekaterinburg.\n\nЭто единый самодостаточный документ для нового аккаунта ИИ. Все необходимые сведения включены ниже; переходить по ссылкам для получения основных настроек не требуется. Ссылки служат доказательствами и дополнительными материалами. Короткая памятка — вспомогательная.\n\nСостояния сервисов и товаров датированы; перед действием проверять нужный доступ. Инструкция не переносит OAuth и не заменяет личный вход владельца.\n"]
for title, filename in sections:
    text = (docs / filename).read_text()
    text = text.split("\n", 1)[1].lstrip()
    text = re.sub(r"^Версия 3[^\n]*\n", "", text).lstrip()
    if filename == "START_HERE.md":
        text = re.sub(r"^Это вспомогательная памятка[^\n]*\n\n", "", text).lstrip()
        text = text.replace("Прочитай `AGENTS.md`, верхние актуальные записи `MEMORY.md` и [текущую передачу задач](CURRENT_HANDOFF.md). Подробные подключения открывай по необходимости в [справочнике](CONNECTIONS_RUNBOOK.md).", "Прочитай AGENTS.md и актуальные записи MEMORY.md. Текущая передача задач включена в раздел C, все подключения — в раздел B этой инструкции.")
    text = re.sub(r"^(#{2,5}) ", lambda m: "#" + m.group(1) + " ", text, flags=re.M)
    parts.append("\n## " + title + "\n\n" + text)
parts.append("\n## Обновление документа\n\nКанонические разделы поддерживаются вGit. После их изменения выполнить `python3 scripts/docs/build-start-guide.py`, проверить ссылки и перенести собранный START_FULL.md в основную заметку Obsidian сbackup/readback. Нельзя оставлять основной старт только короткой памяткой или набором ссылок. Снимки и квитанции хранить отдельно, секреты в документ не включать.\n")
(docs / "START_FULL.md").write_text("\n".join(parts))
print("Built docs/ai/START_FULL.md")
