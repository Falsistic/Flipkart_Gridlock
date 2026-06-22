"""
resource_engine.py — Rule-based resource allocation engine.

Improvements over the original:
  - Time-of-day multiplier  : rush hours (7–10, 17–21) demand more resources.
  - Corridor priority weight : NH-48 and Central Corridor are highest-impact.
  - Weekend multiplier       : crowd events on weekends are 20% larger.
  - Minimum guard            : police and volunteers are always ≥ 1.
  - generate_response_plan() now accepts hour, day_of_week, corridor so
    every call path gets the smarter allocation.
"""

# ── base resource table ─────────────────────────────────────────────────────

BASE_RESOURCES: dict[str, dict] = {
    "Low":      {"police": 2,  "volunteers": 2,  "barricades": 0,  "diversion": False},
    "Medium":   {"police": 5,  "volunteers": 4,  "barricades": 2,  "diversion": False},
    "High":     {"police": 10, "volunteers": 8,  "barricades": 5,  "diversion": True},
    "Critical": {"police": 20, "volunteers": 15, "barricades": 10, "diversion": True},
}

# ── event-type multipliers ──────────────────────────────────────────────────

EVENT_MULTIPLIER: dict[str, float] = {
    "vehicle_breakdown": 1.0,
    "pot_holes":         1.0,
    "road_conditions":   1.0,
    "others":            1.0,
    "congestion":        1.2,
    "accident":          1.5,
    "construction":      1.5,
    "water_logging":     1.5,
    "public_event":      2.0,
    "procession":        2.0,
    "vip_movement":      2.5,
    "protest":           3.0,
}

# ── corridor priority weights ───────────────────────────────────────────────
# Busier / more strategic corridors need proportionally more resources.

CORRIDOR_MULTIPLIER: dict[str, float] = {
    "NH-48":            1.5,
    "Central Corridor": 1.4,
    "Ring Road":        1.3,
    "Outer Ring Road":  1.3,
    "South Corridor":   1.1,
    "East Corridor":    1.1,
    "West Corridor":    1.1,
    "Unknown":          1.0,
}

# ── diversion rule sets ─────────────────────────────────────────────────────

_DIVERSION_STRONG   = {"construction", "water_logging", "protest", "vip_movement", "procession"}
_DIVERSION_STANDARD = {"accident", "public_event"}


# ── internal helpers ────────────────────────────────────────────────────────

def _time_of_day_multiplier(hour: int) -> float:
    """Scale resources based on traffic volume at the given hour."""
    if 7 <= hour <= 10:    # morning rush
        return 1.4
    if 17 <= hour <= 21:   # evening rush
        return 1.5
    if 11 <= hour <= 16:   # midday
        return 1.1
    return 0.8              # late night / early morning


def _compute_resources(
    impact_level: str,
    event_cause:  str,
    hour:         int,
    day_of_week:  int,
    corridor:     str,
) -> dict:
    base = BASE_RESOURCES.get(impact_level, BASE_RESOURCES["Medium"])

    ev_mult  = EVENT_MULTIPLIER.get(event_cause, 1.0)
    tod_mult = _time_of_day_multiplier(hour)
    cor_mult = CORRIDOR_MULTIPLIER.get(corridor, 1.0)
    wkd_mult = 1.2 if day_of_week in (5, 6) else 1.0   # Sa / Su

    combined = ev_mult * tod_mult * cor_mult * wkd_mult

    return {
        "police":     max(1, round(base["police"]     * combined)),
        "volunteers": max(1, round(base["volunteers"] * combined)),
        "barricades": max(0, round(base["barricades"] * combined)),
        "diversion":  base["diversion"] or event_cause in (_DIVERSION_STRONG | _DIVERSION_STANDARD),
    }


def _diversion_label(event_cause: str) -> str:
    if event_cause in _DIVERSION_STRONG:
        return "Strongly Recommended"
    if event_cause in _DIVERSION_STANDARD:
        return "Recommended"
    return "Not Required"


# ── public API ──────────────────────────────────────────────────────────────

def generate_response_plan(
    impact_level: str,
    event_cause:  str,
    hour:         int = 12,
    day_of_week:  int = 1,
    corridor:     str = "Unknown",
) -> dict:
    """
    Return a complete resource-and-diversion plan for the given scenario.

    Parameters
    ----------
    impact_level : ML-predicted severity ("Low" | "Medium" | "High" | "Critical")
    event_cause  : one of the 12 recognised event types
    hour         : hour of day (0–23) — used for rush-hour scaling
    day_of_week  : 0 = Monday … 6 = Sunday — used for weekend scaling
    corridor     : road corridor name — used for priority weighting
    """
    resources = _compute_resources(impact_level, event_cause, hour, day_of_week, corridor)
    diversion = _diversion_label(event_cause)

    return {
        "impact_level": impact_level,
        "event_cause":  event_cause,
        "police":       resources["police"],
        "volunteers":   resources["volunteers"],
        "barricades":   resources["barricades"],
        "diversion":    diversion,
    }