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
assert all(r['product'] != r['category'] for r in rows), 'unclassified root product remains'
assert not any({'price', 'unit', 'sourceFile', 'region'} & set(r) for r in rows), 'private/source fields leaked'
assert not any(re.search(r'уценка|неконд|\bимп(?:орт)?\b|\b(?:ММК|НЛМК|ОМК|ТМК|Северсталь|ЕВРАЗ|ЗСМК|ЧМК|АМЗ)\b', f"{r['designation']} {r['size']}", re.I) for r in rows), 'sales or plant note leaked'

pipes = [r for r in rows if r['category'] == 'Трубы']
assert pipes, 'pipe rows missing'
assert all(r.get('diameter') and r.get('wall') for r in pipes), 'pipe diameter or wall is missing'
assert all(r['size'] == f"{r['diameter']}×{r['wall']}" for r in pipes), 'combined pipe size disagrees with diameter/wall'
assert not any(r['standard'] == 'ГОСТ 3262-75' and 'водогаз' not in r['product'].lower() and 'вгп' not in r['product'].lower() for r in pipes), 'ГОСТ 3262-75 leaked to another pipe section'

for row in pipes:
    diameter = re.match(r"^(?:ДУ\s*)?(\d+(?:[.,]\d+)?)$", row['diameter'], flags=re.I)
    wall = re.match(r"^(\d+(?:[.,]\d+)?)$", row['wall'])
    if diameter and wall:
        assert float(wall.group(1).replace(',', '.')) < float(diameter.group(1).replace(',', '.')), f"impossible pipe size: {row['size']}"

for product in {(r['category'], r['product']) for r in rows}:
    sizes = [r['size'] for r in rows if (r['category'], r['product']) == product]
    assert [numeric_key(s) for s in sizes] == sorted([numeric_key(s) for s in sizes]), f"size order failed: {product}"

print(json.dumps({'rows': len(rows), 'pipes': len(pipes), 'checks': 11, 'status': 'passed'}, ensure_ascii=False))
