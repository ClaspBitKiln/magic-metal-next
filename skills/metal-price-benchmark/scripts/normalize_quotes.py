#!/usr/bin/env python3
"""Normalize collected metal quotes and produce internal/client benchmarks."""

from __future__ import annotations

import argparse
import datetime as dt
import json
import math
import statistics
import sys
from pathlib import Path

BASE_TRUST = {
    "market.omk.ru": 0.92,
    "market.severstal.com": 0.90,
    "mechelservice.ru": 0.88,
    "market.mmk.ru": 0.86,
    "nlmk.shop": 0.86,
    "pmsmk.ru": 0.84,
    "uralmpc.ru": 0.84,
    "metpromural.com": 0.82,
    "mc.ru": 0.85,
    "evraz.market": 0.85,
    "spk.ru": 0.80,
    "metallotorg.ru": 0.55,
    "23met.ru": 0.35,
}


def parse_date(value: str) -> dt.date:
    return dt.date.fromisoformat(value[:10])


def rub_per_tonne(q: dict, vat_rate: float) -> float:
    price = float(q["price"])
    unit = q.get("unit", "rub_t")
    if unit == "rub_t":
        result = price
    elif unit == "rub_kg":
        result = price * 1000
    elif unit == "rub_m":
        result = price / float(q["kg_per_m"]) * 1000
    elif unit == "rub_piece":
        result = price / float(q["kg_per_piece"]) * 1000
    else:
        raise ValueError(f"unknown unit: {unit}")
    return result if q.get("vat_included", True) else result * (1 + vat_rate)


def weighted_median(values: list[tuple[float, float]]) -> float:
    ordered = sorted(values)
    half = sum(weight for _, weight in ordered) / 2
    running = 0.0
    for value, weight in ordered:
        running += weight
        if running >= half:
            return value
    return ordered[-1][0]


def evaluate(payload: dict) -> dict:
    today = parse_date(payload.get("calculation_date", dt.date.today().isoformat()))
    vat_rate = float(payload["vat_rate"])
    accepted, excluded = [], []

    for raw in payload.get("quotes", []):
        q = dict(raw)
        reasons = []
        source = q.get("source", "").lower().removeprefix("www.")
        trust = BASE_TRUST.get(source, 0.40)
        try:
            normalized = rub_per_tonne(q, vat_rate)
            age = (today - parse_date(q["observed_at"])).days
        except (KeyError, TypeError, ValueError, ZeroDivisionError) as exc:
            excluded.append({**q, "reasons": [f"ошибка данных: {exc}"]})
            continue

        if age < 0:
            reasons.append("дата наблюдения находится в будущем")
        if age > 30:
            reasons.append("цена старше 30 дней")
        if q.get("availability") is False:
            reasons.append("нет подтверждённого наличия")
        if not q.get("exact_match", False):
            reasons.append("неполное совпадение позиции")
        if float(q.get("quantity_min_t", 0)) > float(payload.get("quantity_t", math.inf)):
            reasons.append("минимальная партия выше заявки")
        if source == "23met.ru" and not q.get("corroborated", False):
            reasons.append("23met не подтверждён вторым источником")

        if reasons:
            excluded.append({**q, "normalized_rub_t_vat": round(normalized, 2), "reasons": reasons})
            continue
        if age > 7:
            trust -= 0.15
        elif age > 3:
            trust -= 0.07
        if not q.get("date_visible", True):
            trust -= 0.12
        accepted.append({**q, "normalized_rub_t_vat": normalized, "trust": max(0.05, trust), "age_days": age})

    if not accepted:
        return {"status": "manual_confirmation_required", "accepted": [], "excluded": excluded}

    raw_median = statistics.median(q["normalized_rub_t_vat"] for q in accepted)
    kept = []
    for q in accepted:
        deviation = abs(q["normalized_rub_t_vat"] - raw_median) / raw_median
        if deviation > 0.20:
            excluded.append({**q, "reasons": ["отклонение от медианы более 20 %"]})
        else:
            kept.append(q)
    accepted = kept
    if not accepted:
        return {"status": "manual_confirmation_required", "accepted": [], "excluded": excluded}

    benchmark = weighted_median([(q["normalized_rub_t_vat"], q["trust"]) for q in accepted])
    low = min(q["normalized_rub_t_vat"] for q in accepted)
    high = max(q["normalized_rub_t_vat"] for q in accepted)
    spread = 0 if benchmark == 0 else (high - low) / benchmark
    primary = {"market.omk.ru", "market.severstal.com", "mechelservice.ru", "market.mmk.ru", "nlmk.shop", "pmsmk.ru", "uralmpc.ru", "metpromural.com", "mc.ru", "evraz.market", "spk.ru"}
    primary_count = sum(q["source"].lower().removeprefix("www.") in primary for q in accepted)
    if len(accepted) >= 3 and primary_count >= 2 and spread <= 0.08:
        confidence = "высокий"
    elif len(accepted) >= 2 and spread <= 0.15:
        confidence = "средний"
    else:
        confidence = "низкий"

    markups = payload.get("markups", {})
    logistics = float(markups.get("logistics_rub_t", 0))
    processing = float(markups.get("processing_rub_t", 0))
    margin = float(markups.get("margin_percent", 0)) / 100
    client_price = (benchmark + logistics + processing) * (1 + margin)
    quantity = float(payload.get("quantity_t", 0))

    return {
        "status": "ok" if confidence != "низкий" else "manual_confirmation_required",
        "position": payload.get("position"),
        "calculation_date": today.isoformat(),
        "accepted": [{**q, "normalized_rub_t_vat": round(q["normalized_rub_t_vat"], 2)} for q in accepted],
        "excluded": excluded,
        "internal": {
            "benchmark_rub_t_vat": round(benchmark, 2),
            "market_range_rub_t_vat": [round(low, 2), round(high, 2)],
            "spread_percent": round(spread * 100, 2),
            "confidence": confidence,
            "formula": "(медианный ориентир + логистика + обработка) × (1 + маржа)",
        },
        "client": {
            "label": f"Ориентировочная цена на {today.strftime('%d.%m.%Y')}",
            "price_rub_t_vat": round(client_price, 2),
            "total_rub_vat": round(client_price * quantity, 2) if quantity else None,
            "confidence": confidence,
            "notice": "Цена и наличие подтверждаются перед выставлением счёта.",
        },
    }


EXAMPLE = {
    "position": "Лист г/к 10×1500×6000 Ст3",
    "quantity_t": 10,
    "vat_rate": 0.22,
    "calculation_date": "2026-08-25",
    "markups": {"logistics_rub_t": 3500, "processing_rub_t": 0, "margin_percent": 8},
    "quotes": [
        {"source": "mc.ru", "url": "https://example", "price": 64000, "unit": "rub_t", "vat_included": True, "observed_at": "2026-08-25", "date_visible": True, "region": "Челябинск", "availability": True, "quantity_min_t": 5, "exact_match": True}
    ],
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", nargs="?", help="JSON file; stdin when omitted")
    parser.add_argument("--example", action="store_true")
    args = parser.parse_args()
    if args.example:
        json.dump(EXAMPLE, sys.stdout, ensure_ascii=False, indent=2)
        print()
        return
    raw = Path(args.input).read_text("utf-8") if args.input else sys.stdin.read()
    json.dump(evaluate(json.loads(raw)), sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main()
