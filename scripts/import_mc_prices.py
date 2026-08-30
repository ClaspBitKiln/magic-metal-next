#!/usr/bin/env python3
"""Normalize the official METALLSERVIS XLS price lists for the public directory."""

from __future__ import annotations

import json
import math
import re
import sys
from pathlib import Path

import pandas as pd


ROOT_TITLES = {
    "Трубы", "Крепеж", "Нержавейка", "Цветной прокат", "Качественный прокат",
    "Метизы метсырьё", "Листовой прокат", "Инженерные системы", "Профнастил",
    "Сортовой прокат (цена от 5 т.)",
}
HEADER_WORDS = {"марка", "диаметр", "стенка", "толщина", "наименование", "полка", "размер", "длина", "ед.изм", "цена"}


def clean(value: object) -> str:
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return ""
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return re.sub(r"\s+", " ", str(value)).strip()


def number_key(value: str) -> list[float]:
    nums = re.findall(r"\d+(?:[.,]\d+)?", value)
    return [float(n.replace(",", ".")) for n in nums] or [float("inf")]


def split_sizes(value: str) -> list[str]:
    # Comma is the decimal separator in Russian price lists; only semicolon separates sizes.
    parts = [p.strip() for p in re.split(r"\s*;\s*", value) if p.strip()]
    return parts or [value]


def standard_from(text: str) -> str:
    matches = re.findall(r"(?:ГОСТ|ТУ|ОСТ|СТО)\s*[РrR]?\s*[\d.-]+(?:-\d+)?", text, flags=re.I)
    normalized = [re.sub(r"^(ГОСТ|ТУ|ОСТ|СТО)\s*", r"\1 ", m.upper().replace("R", "Р")) for m in matches]
    return " · ".join(dict.fromkeys(normalized))


def normalize_designation(value: str) -> str:
    """Remove supplier-only sales notes while preserving technical properties."""
    value = re.sub(r"\bуценка\b", "", value, flags=re.I)
    value = re.sub(r"\b(?:имп|импорт)\b", "", value, flags=re.I)
    value = re.sub(r"\b(?:неконд(?:иция)?)\b", "", value, flags=re.I)
    value = re.sub(r"\b(?:пр-?во|производство)\s+[А-ЯA-ZЁ0-9«»\"._-]+", "", value, flags=re.I)
    value = re.sub(r"\b(?:ММК|НЛМК|ОМК|ТМК|Северсталь|ЕВРАЗ|ЗСМК|ЧМК|АМЗ)\b", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip(" ,;/")
    match = re.match(r"^(.+?)\s+\1$", value, flags=re.I)
    return match.group(1) if match else value


def normalize_section(value: str) -> str:
    return re.sub(r"\s*\(продолжение\)\s*$", "", value, flags=re.I).strip()


def scan_context(df: pd.DataFrame, cols: tuple[int, int, int, int], root: str) -> dict[int, dict]:
    section = root
    headers = ["Наименование", "Размер", "Ед.изм", "Цена"]
    result: dict[int, dict] = {}
    for index, raw in df.iterrows():
        cells = [clean(raw.iloc[c]) if c < len(raw) else "" for c in cols]
        low = [c.lower().replace(" ", "") for c in cells]
        heading = header = False
        if any("ед.изм" in c for c in low) and any("цена" in c for c in low):
            headers = cells
            header = True
        elif len([c for c in cells if c]) == 1 and cells[0] and cells[0] not in ROOT_TITLES:
            candidate = cells[0]
            if candidate.lower() not in HEADER_WORDS and not candidate.startswith("+"):
                section = candidate
                heading = True
        result[index] = {"section": normalize_section(section), "headers": headers[:], "heading": heading, "header": header}
    return result


def split_pipe_primary(value: str) -> tuple[str, str]:
    match = re.match(r"^(ДУ\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?(?:[xх×]\d+(?:[.,]\d+)?)?)(?:\s+|$)(.*)$", value, flags=re.I)
    if not match:
        return value, ""
    primary = match.group(1).replace("x", "×").replace("х", "×")
    return primary, normalize_designation(match.group(2).strip())


def parse_half(df: pd.DataFrame, cols: tuple[int, int, int, int], source_file: str, root: str, initial_section: str | None = None, peer_context: dict[int, dict] | None = None) -> list[dict]:
    rows: list[dict] = []
    section = initial_section or root
    headers = ["Наименование", "Размер", "Ед.изм", "Цена"]
    previous_name = ""
    previous_price = ""
    previous_unit = ""

    for index, raw in df.iterrows():
        cells = [clean(raw.iloc[c]) if c < len(raw) else "" for c in cols]
        low = [c.lower().replace(" ", "") for c in cells]
        if peer_context and index in peer_context:
            peer = peer_context[index]
            if peer["heading"] and not cells[0]:
                section = peer["section"]
            if peer["header"] and normalize_section(section).casefold() == peer["section"].casefold():
                headers = peer["headers"][:]
        if not any(cells):
            continue
        if "прайс-лист" in " ".join(cells).lower() or "https://mc.ru" in cells:
            continue
        if any("ед.изм" in c for c in low) and any("цена" in c for c in low):
            headers = cells
            previous_name = previous_price = previous_unit = ""
            continue
        nonempty = [c for c in cells if c]
        if len(nonempty) == 1 and cells[0] and cells[0] not in ROOT_TITLES:
            candidate = cells[0]
            if candidate.lower() not in HEADER_WORDS and not candidate.startswith("+"):
                section = candidate
                previous_name = previous_price = previous_unit = ""
            continue
        if cells[0] in ROOT_TITLES:
            continue

        name, size, unit, price = cells
        if not name and size and previous_name and not unit and not price:
            name, unit, price = previous_name, previous_unit, previous_price
        if not name or not size:
            continue
        if name.lower().replace(" ", "") in HEADER_WORDS or size.lower().replace(" ", "") in HEADER_WORDS:
            continue
        if not unit and not price:
            continue

        previous_name, previous_unit, previous_price = name, unit, price
        product = normalize_section(section)
        header0 = clean(headers[0]).lower()
        combine_dimensions = any(token in header0 for token in ("диаметр", "номер профиля", "полка", "наим.,диаметр", "размер"))
        dimension_base, pipe_designation = split_pipe_primary(name) if root == "Трубы" and combine_dimensions else (normalize_designation(name), "")
        display_designation = pipe_designation if root == "Трубы" and combine_dimensions else ("" if combine_dimensions else normalize_designation(name))
        standard = standard_from(product + " " + name)
        for one_size in split_sizes(size):
            wall = one_size if root == "Трубы" and combine_dimensions else ""
            if combine_dimensions:
                one_size = f"{dimension_base}×{one_size}" if re.search(r"\d", one_size) else f"{dimension_base}{one_size}"
            row = {
                "category": root,
                "product": product,
                "designation": normalize_designation(display_designation),
                "size": one_size,
                "standard": standard,
                "status": "green",
                "checkedAt": "28.08.2026",
            }
            if wall:
                row["diameter"] = dimension_base
                row["wall"] = wall
            rows.append(row)
    return rows


def main(price_dir: Path, output: Path) -> None:
    all_rows: list[dict] = []
    for path in sorted(price_dir.glob("*.xls")):
        df = pd.read_excel(path, sheet_name=0, header=None)
        root = next((clean(v) for v in df.iloc[:6, 0].tolist() if clean(v) in ROOT_TITLES), path.stem)
        first_section = root
        for _, raw in df.iterrows():
            cells = [clean(raw.iloc[c]) if c < len(raw) else "" for c in (0, 1, 2, 3)]
            if cells[0] and not any(cells[1:]) and cells[0] not in ROOT_TITLES and cells[0].lower() not in HEADER_WORDS:
                first_section = cells[0]
                break
        all_rows.extend(parse_half(df, (0, 1, 2, 3), path.name, root))
        if df.shape[1] >= 9:
            left_context = scan_context(df, (0, 1, 2, 3), root)
            all_rows.extend(parse_half(df, (5, 6, 7, 8), path.name, root, first_section, left_context))

    unique: dict[tuple[str, ...], dict] = {}
    for row in all_rows:
        key = tuple(row[k].casefold() for k in ("category", "product", "designation", "size", "standard"))
        unique[key] = row
    normalized = sorted(unique.values(), key=lambda r: (r["category"], r["product"], number_key(r["size"]), r["designation"]))
    payload = {
        "snapshotDate": "28.08.2026",
        "statusRule": "Строка официального прайса МЕТАЛЛСЕРВИС — На складе",
        "rowCount": len(normalized),
        "rows": normalized,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"files": len(list(price_dir.glob('*.xls'))), "rows": len(normalized), "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
