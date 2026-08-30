#!/usr/bin/env python3
"""Fail when normalized public price-list dimensions are structurally unsafe."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path


def numeric_key(value: str) -> list[float]:
    return [float(v.replace(',', '.')) for v in re.findall(r"\d+(?:[.,]\d+)?", value)]


data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
rows = data['rows']
keys = [(r['category'].casefold(), r['product'].casefold(), r['designation'].casefold(), r['size'].casefold(), r['standard'].casefold()) for r in rows]
assert data['rowCount'] == len(rows), 'rowCount does not match rows'
assert len(keys) == len(set(keys)), 'duplicate public rows'
assert all(r['status'] == 'green' for r in rows), 'unexpected status in official price snapshot'
assert all(r['category'] and r['product'] and r['size'] and r['checkedAt'] for r in rows), 'required field is blank'
assert all(re.fullmatch(r'[0-9a-f]{16}', r.get('id', '')) for r in rows), 'stable row id is missing'
assert len({r['id'] for r in rows}) == len(rows), 'row id collision'
assert all(r['product'] != r['category'] for r in rows), 'unclassified root product remains'
assert not any({'price', 'unit', 'sourceFile', 'region'} & set(r) for r in rows), 'private/source fields leaked'
assert not any(re.search(r'уценка|неконд|\bимп(?:орт)?\b|РТ-Те(?:х)?приемка|\b(?:ММК|НЛМК|ОМК|ТМК|Северсталь|ЕВРАЗ|ЗСМК|ЧМК|АМЗ|Тагмет|HALSEN|OASIS|THERMA|Temper|MZTA)\b', f"{r['designation']} {r['size']}", re.I) for r in rows), 'sales, brand, or plant note leaked'
assert not any(re.search(r'×\s*[БШКМУП]\d*$', r['size'], re.I) for r in rows), 'profile number incorrectly uses multiplication sign before series'

pipes = [r for r in rows if r['category'] == 'Трубы']
assert pipes, 'pipe rows missing'
assert all(r.get('diameter') and r.get('wall') for r in pipes), 'pipe diameter or wall is missing'
assert all(r['size'] == f"{r['diameter']}×{r['wall']}" for r in pipes), 'combined pipe size disagrees with diameter/wall'
assert not any(r['standard'] == 'ГОСТ 3262-75' and 'водогаз' not in r['product'].lower() and 'вгп' not in r['product'].lower() for r in pipes), 'ГОСТ 3262-75 leaked to another pipe section'

all_dimensioned_pipes = [r for r in rows if r.get('diameter') and r.get('wall')]

for row in all_dimensioned_pipes:
    diameter = re.match(r"^(?:ДУ\s*)?(\d+(?:[.,]\d+)?)$", row['diameter'], flags=re.I)
    wall = re.match(r"^(\d+(?:[.,]\d+)?)$", row['wall'])
    if diameter and wall:
        assert float(wall.group(1).replace(',', '.')) < float(diameter.group(1).replace(',', '.')), f"impossible pipe size: {row['size']}"

for product in {(r['category'], r['product']) for r in rows}:
    sizes = [r['size'] for r in rows if (r['category'], r['product']) == product]
    assert [numeric_key(s) for s in sizes] == sorted([numeric_key(s) for s in sizes]), f"size order failed: {product}"

beams = [r for r in rows if r['product'] == 'БАЛКИ ДВУТАВРОВЫЕ']
assert beams, 'beam rows missing'
assert not any('×' in r['size'] for r in beams), 'dimensional product leaked into beam section'
assert all(r['standard'] == 'ГОСТ Р 57837-2017' for r in beams if re.fullmatch(r'\d+(?:Б|Ш|К)\d+', r['size'])), 'beam series standard is missing or wrong'
assert all(r['standard'] == 'ГОСТ 8239-89' for r in beams if re.fullmatch(r'\d+(?:[.,]\d+)?', r['size'])), 'classic I-beam standard is missing or wrong'
assert all(r['standard'] == 'ГОСТ 8240-97' for r in rows if r['product'] == 'ШВЕЛЛЕР' and re.fullmatch(r'\d+(?:[.,]\d+)?(?:[ПУ])?', r['size'])), 'channel standard is missing or wrong'
assert not any(re.search(r'[БШК]\d+$', r['size']) for r in rows if r['product'] == 'ШВЕЛЛЕР'), 'beam profile leaked into channel section'
assert not any(r['size'].count('×') == 2 for r in rows if r['product'] == 'ШВЕЛЛЕР'), 'bent channel geometry leaked into hot-rolled channel section'

semantic_rules = {
    'Грязевики': r'радиатор',
    'Заглушки стальные': r'переход',
    'Фланцы стальные': r'отвод',
    'АЛЮМИНИЕВАЯ ТРУБА': r'\bБр[A-Я]',
    'БРОНЗОВЫЙ КРУГ': r'\b(?:Д\d+|В\d+)',
}
for product, forbidden in semantic_rules.items():
    assert not any(re.search(forbidden, f"{r['designation']} {r['size']}", re.I) for r in rows if r['product'] == product), f'semantic contamination: {product}'

print(json.dumps({'rows': len(rows), 'pipes': len(pipes), 'beams': len(beams), 'checks': 24, 'status': 'passed'}, ensure_ascii=False))
