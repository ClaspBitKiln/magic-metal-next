#!/usr/bin/env python3
"""Normalize the official METALLSERVIS XLS price lists for the public directory."""

from __future__ import annotations

import json
import hashlib
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
    value = re.sub(
        r"\b(?:ММК|НЛМК|ОМК|ТМК|Северсталь|ЕВРАЗ|ЗСМК|ЧМК|АМЗ|Тагмет|HALSEN|OASIS(?:\s+ECO)?|THERMA|Temper|MZTA)\b",
        "",
        value,
        flags=re.I,
    )
    value = re.sub(r"РТ-Те(?:х)?приемка", "", value, flags=re.I)
    value = re.sub(r"Тагмет", "", value, flags=re.I)
    value = re.sub(r"\bКитай\b", "", value, flags=re.I)
    value = re.sub(r"\s+", " ", value).strip(" ,;/")
    if value.upper() in {"ГОСТ", "ТУ", "ОСТ", "СТО"}:
        return ""
    match = re.match(r"^(.+?)\s+\1$", value, flags=re.I)
    return match.group(1) if match else value


def normalize_section(value: str) -> str:
    return re.sub(r"\s*\(продолжение\)\s*$", "", value, flags=re.I).strip()


def visual_rows(df: pd.DataFrame):
    """Yield a two-column print export in page reading order."""
    starts = [0, *range(73, len(df), 72)]
    for page_index, start in enumerate(starts):
        end = starts[page_index + 1] if page_index + 1 < len(starts) else len(df)
        for cols in ((0, 1, 2, 3), (5, 6, 7, 8)):
            if cols[-1] >= df.shape[1]:
                continue
            for index in range(start, end):
                raw = df.iloc[index]
                yield [clean(raw.iloc[c]) if c < len(raw) else "" for c in cols]


def split_pipe_primary(value: str) -> tuple[str, str]:
    value = normalize_designation(value)
    match = re.match(r"^(ДУ\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?(?:[xх×]\d+(?:[.,]\d+)?)?)(?:\s+|$)(.*)$", value, flags=re.I)
    if not match:
        # Non-ferrous price lists put the grade first: "АД31Т1 20".
        match = re.match(r"^(.*?)\s+(\d+(?:[.,]\d+)?)$", value, flags=re.I)
        if not match:
            return value, ""
        return match.group(2), normalize_designation(match.group(1).strip())
    primary = re.sub(r"(?<=\d)[xх](?=\d)", "×", match.group(1), flags=re.I)
    return primary, normalize_designation(match.group(2).strip())


def normalize_primary_size(value: str) -> tuple[str, str]:
    """Return the technical size plus a separate length/execution note."""
    notes: list[str] = []
    if re.search(r"\bн\s*/\s*д\b", value, flags=re.I):
        notes.append("НД")
        value = re.sub(r"\bн\s*/\s*д\b", "", value, flags=re.I)
    length = re.search(r"\b(\d+(?:[.,]\d+)?)\s*м\b", value, flags=re.I)
    if length:
        notes.append(f"длина {length.group(1)} м")
        value = re.sub(r"\b\d+(?:[.,]\d+)?\s*м\b", "", value, flags=re.I)
    value = re.sub(r"(?<=\d)[xх](?=\d)", "×", normalize_designation(value), flags=re.I).strip()
    return value, " · ".join(notes)


def join_profile_size(primary: str, secondary: str) -> str:
    secondary = secondary.lstrip("; ")
    if not secondary:
        return primary
    # Profile series are written as 20Б1/25Ш2/30К3, never as 20×Б1.
    if re.match(r"^[А-ЯA-ZЁ]", secondary, flags=re.I):
        return f"{primary}{secondary}"
    return f"{primary}×{secondary}" if re.search(r"\d", secondary) else f"{primary}{secondary}"


def normalize_profile_product(product: str, size: str) -> str:
    compact = re.sub(r"\s+", "", size.upper())
    if "ШВЕЛЛЕР" in product.upper() and re.fullmatch(r"\d+(?:Б|Ш|К)\d+", compact):
        return "БАЛКИ ДВУТАВРОВЫЕ"
    if product.upper() == "ШВЕЛЛЕР" and re.fullmatch(r"\d+(?:[.,]\d+)?×\d+(?:[.,]\d+)?×\d+(?:[.,]\d+)?", compact):
        return "ШВЕЛЛЕР ГНУТЫЙ"
    if "БАЛКИ ДВУТАВРОВЫЕ" in product.upper() and re.fullmatch(r"\d+(?:[.,]\d+)?×\d+(?:[.,]\d+)?×\d+(?:[.,]\d+)?", compact):
        return "ШВЕЛЛЕР ГНУТЫЙ"
    return product


def profile_standard(product: str, size: str, current: str) -> str:
    compact = re.sub(r"\s+", "", size.upper())
    if product == "БАЛКИ ДВУТАВРОВЫЕ" and re.fullmatch(r"\d+(?:Б|Ш|К)\d+", compact):
        return "ГОСТ Р 57837-2017"
    if product == "БАЛКИ ДВУТАВРОВЫЕ" and re.fullmatch(r"\d+М", compact):
        return "ГОСТ 19425-74"
    if product == "БАЛКИ ДВУТАВРОВЫЕ" and re.fullmatch(r"\d+(?:[.,]\d+)?", compact):
        return "ГОСТ 8239-89"
    if product == "ШВЕЛЛЕР" and re.fullmatch(r"\d+(?:[.,]\d+)?(?:[ПУ])?", compact):
        return "ГОСТ 8240-97"
    if product == "ШВЕЛЛЕР ГНУТЫЙ" and compact.count("×") == 2:
        return "ГОСТ 8278-83"
    return current


def parse_sheet(df: pd.DataFrame, root: str) -> list[dict]:
    rows: list[dict] = []
    section = root
    headers = ["Наименование", "Размер", "Ед.изм", "Цена"]
    previous_name = ""
    previous_price = ""
    previous_unit = ""

    for cells in visual_rows(df):
        low = [c.lower().replace(" ", "") for c in cells]
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
        header0 = clean(headers[0]).lower()
        header1 = clean(headers[1]).lower()
        combine_dimensions = any(token in header0 for token in ("диаметр", "номер профиля", "полка", "наим.,диаметр", "размер"))
        profile_without_series = combine_dimensions and "хар" in header1 and not size
        if not name or (not size and not profile_without_series):
            continue
        if name.lower().replace(" ", "") in HEADER_WORDS or size.lower().replace(" ", "") in HEADER_WORDS:
            continue
        if not unit and not price:
            continue

        previous_name, previous_unit, previous_price = name, unit, price
        product = normalize_section(section)
        is_pipe = "ТРУБ" in product.upper() and any(token in header1 for token in ("стен", "толщ"))
        dimension_base, pipe_designation = split_pipe_primary(name) if is_pipe and combine_dimensions else (normalize_designation(name), "")
        dimension_base, size_note = normalize_primary_size(dimension_base)
        display_designation = pipe_designation if is_pipe and combine_dimensions else ("" if combine_dimensions else normalize_designation(name))
        standard = standard_from(product + " " + name)
        for one_size in split_sizes(size):
            one_size = normalize_designation(one_size)
            wall = one_size if is_pipe and combine_dimensions else ""
            if combine_dimensions:
                one_size = join_profile_size(dimension_base, one_size)
            normalized_product = normalize_profile_product(product, one_size)
            # In the welded stainless export, rectangular profiles are encoded as
            # side A / side B under the generic "size / wall" heading.
            primary_number = re.fullmatch(r"\d+(?:[.,]\d+)?", dimension_base)
            secondary_number = re.fullmatch(r"\d+(?:[.,]\d+)?", wall)
            if is_pipe and "НЕРЖАВ" in root.upper() and primary_number and secondary_number:
                first = float(dimension_base.replace(",", "."))
                second = float(wall.replace(",", "."))
                if second >= first * 0.3:
                    normalized_product = "ТРУБЫ НЕРЖАВ. ЭЛ/СВАРНЫЕ ПРОФИЛЬНЫЕ"
                    wall = ""
            if wall and primary_number and secondary_number:
                first = float(dimension_base.replace(",", "."))
                second = float(wall.replace(",", "."))
                if second >= first / 2:
                    continue
            normalized_standard = profile_standard(normalized_product, one_size, standard)
            normalized_designation = normalize_designation(display_designation)
            if size_note:
                normalized_designation = " · ".join(filter(None, (normalized_designation, size_note)))
            row = {
                "category": root,
                "product": normalized_product,
                "designation": normalized_designation,
                "size": one_size,
                "standard": normalized_standard,
                "status": "green",
                "checkedAt": "30.08.2026",
            }
            if wall:
                row["diameter"] = dimension_base
                row["wall"] = wall
            identity = "\x1f".join(str(row[key]).casefold() for key in ("category", "product", "designation", "size", "standard"))
            row["id"] = hashlib.sha1(identity.encode("utf-8")).hexdigest()[:16]
            rows.append(row)
    return rows


def main(price_dir: Path, output: Path) -> None:
    all_rows: list[dict] = []
    for path in sorted(price_dir.glob("*.xls")):
        df = pd.read_excel(path, sheet_name=0, header=None)
        root = next((clean(v) for v in df.iloc[:6, 0].tolist() if clean(v) in ROOT_TITLES), path.stem)
        all_rows.extend(parse_sheet(df, root))

    unique: dict[tuple[str, ...], dict] = {}
    for row in all_rows:
        key = tuple(row[k].casefold() for k in ("category", "product", "designation", "size", "standard"))
        unique[key] = row
    normalized = sorted(unique.values(), key=lambda r: (r["category"], r["product"], number_key(r["size"]), r["designation"]))
    payload = {
        "snapshotDate": "30.08.2026",
        "statusRule": "Строка официального прайса МЕТАЛЛСЕРВИС — На складе",
        "rowCount": len(normalized),
        "rows": normalized,
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps({"files": len(list(price_dir.glob('*.xls'))), "rows": len(normalized), "output": str(output)}, ensure_ascii=False))


if __name__ == "__main__":
    main(Path(sys.argv[1]), Path(sys.argv[2]))
