"""
District database — JSON-backed storage for county & school district
AI education policy scores entered by users.

Schema (district_scores.json):
{
  "CA": {
    "06001": {                         # county FIPS
      "county_name": "Alameda County",
      "county_score": 0.72,
      "county_level": "ESTABLISHED",
      "districts": {
        "OUSD": {                      # district key
          "district_name": "Oakland USD",
          "nces_id": "0622710",
          "policy_indicators": {...},
          "notes": "...",
          "entered_by": "...",
          "last_updated": "2025-10-29"
        }
      }
    }
  }
}
"""

import json
from pathlib import Path
from datetime import date
from typing import Optional

DB_PATH = Path("data/district_scores.json")

POLICY_INDICATORS = [
    "AI_CURRICULUM",
    "AI_GUIDELINES",
    "TEACHER_TRAINING",
    "AI_TOOLS",
    "ETHICS_POLICY",
    "PILOT_PROGRAMS",
    "DATA_PRIVACY",
    "EQUITY_POLICY",
    "AI_GOVERNANCE",
    "RESEARCH_PARTNERSHIPS",
]

# Adoption level thresholds (same as state-level)
LEVEL_THRESHOLDS = [
    (0.8, "LEADING"),
    (0.6, "ESTABLISHED"),
    (0.4, "DEVELOPING"),
    (0.2, "EMERGING"),
    (0.0, "NONE"),
]

INDICATOR_WEIGHTS = {
    "AI_CURRICULUM":       0.20,
    "AI_GUIDELINES":       0.15,
    "TEACHER_TRAINING":    0.15,
    "AI_TOOLS":            0.12,
    "ETHICS_POLICY":       0.10,
    "PILOT_PROGRAMS":      0.08,
    "DATA_PRIVACY":        0.08,
    "EQUITY_POLICY":       0.07,
    "AI_GOVERNANCE":       0.03,
    "RESEARCH_PARTNERSHIPS": 0.02,
}


def _load() -> dict:
    if DB_PATH.exists():
        try:
            return json.loads(DB_PATH.read_text())
        except json.JSONDecodeError:
            return {}
    return {}


def _save(db: dict):
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    DB_PATH.write_text(json.dumps(db, indent=2, ensure_ascii=False))


def score_to_level(score: float) -> str:
    for threshold, level in LEVEL_THRESHOLDS:
        if score >= threshold:
            return level
    return "NONE"


def compute_district_score(indicators: dict) -> float:
    """Compute weighted adoption score from indicator dict {name: True/False}."""
    score = sum(
        INDICATOR_WEIGHTS.get(name, 0)
        for name, present in indicators.items()
        if present
    )
    return round(min(score, 1.0), 4)


# ─── County ───────────────────────────────────────────────────────────────────

def get_county(state_abbr: str, county_fips: str) -> Optional[dict]:
    db = _load()
    return db.get(state_abbr, {}).get(county_fips)


def upsert_county(state_abbr: str, county_fips: str, county_name: str,
                  indicators: dict, notes: str = "", entered_by: str = ""):
    db = _load()
    db.setdefault(state_abbr, {})
    score = compute_district_score(indicators)
    db[state_abbr][county_fips] = {
        "county_name":  county_name,
        "county_score": score,
        "county_level": score_to_level(score),
        "indicators":   indicators,
        "notes":        notes,
        "entered_by":   entered_by,
        "last_updated": str(date.today()),
        "districts":    db[state_abbr].get(county_fips, {}).get("districts", {}),
    }
    _save(db)
    return score


def get_all_counties(state_abbr: str) -> dict:
    return _load().get(state_abbr, {})


def get_all_states_with_data() -> list[str]:
    return list(_load().keys())


# ─── District ─────────────────────────────────────────────────────────────────

def get_district(state_abbr: str, county_fips: str, district_key: str) -> Optional[dict]:
    db = _load()
    return db.get(state_abbr, {}).get(county_fips, {}).get("districts", {}).get(district_key)


def upsert_district(state_abbr: str, county_fips: str, county_name: str,
                    district_key: str, district_name: str, nces_id: str,
                    indicators: dict, notes: str = "", entered_by: str = ""):
    db = _load()
    db.setdefault(state_abbr, {})
    db[state_abbr].setdefault(county_fips, {
        "county_name": county_name, "county_score": 0.0,
        "county_level": "NONE", "indicators": {}, "notes": "",
        "entered_by": "", "last_updated": str(date.today()), "districts": {},
    })
    score = compute_district_score(indicators)
    db[state_abbr][county_fips]["districts"][district_key] = {
        "district_name": district_name,
        "nces_id":       nces_id,
        "district_score": score,
        "district_level": score_to_level(score),
        "indicators":    indicators,
        "notes":         notes,
        "entered_by":    entered_by,
        "last_updated":  str(date.today()),
    }
    _save(db)
    return score


def get_all_districts(state_abbr: str, county_fips: str) -> dict:
    db = _load()
    return db.get(state_abbr, {}).get(county_fips, {}).get("districts", {})


def delete_district(state_abbr: str, county_fips: str, district_key: str):
    db = _load()
    try:
        del db[state_abbr][county_fips]["districts"][district_key]
        _save(db)
    except KeyError:
        pass


def export_to_records() -> list[dict]:
    """Flat list of all county + district records for CSV export."""
    db = _load()
    rows = []
    for state, counties in db.items():
        for fips, county in counties.items():
            rows.append({
                "level": "county",
                "state": state,
                "fips": fips,
                "name": county.get("county_name", ""),
                "score": county.get("county_score", 0.0),
                "adoption_level": county.get("county_level", "NONE"),
                "last_updated": county.get("last_updated", ""),
            })
            for dk, dist in county.get("districts", {}).items():
                rows.append({
                    "level": "district",
                    "state": state,
                    "fips": fips,
                    "name": dist.get("district_name", ""),
                    "score": dist.get("district_score", 0.0),
                    "adoption_level": dist.get("district_level", "NONE"),
                    "last_updated": dist.get("last_updated", ""),
                })
    return rows
