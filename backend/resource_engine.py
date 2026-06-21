resource_rules = {
    "Low": {
        "police": 2,
        "volunteers": 2,
        "barricades": 0,
        "diversion": False
    },
    "Medium": {
        "police": 5,
        "volunteers": 4,
        "barricades": 2,
        "diversion": False
    },
    "High": {
        "police": 10,
        "volunteers": 8,
        "barricades": 5,
        "diversion": True
    },
    "Critical": {
        "police": 20,
        "volunteers": 15,
        "barricades": 10,
        "diversion": True
    }
}

event_multiplier = {
    "vehicle_breakdown": 1.0,
    "pot_holes": 1.0,
    "road_conditions": 1.0,
    "others": 1.0,
    "congestion": 1.2,
    "accident": 1.5,
    "construction": 1.5,
    "water_logging": 1.5,
    "public_event": 2.0,
    "procession": 2.0,
    "vip_movement": 2.5,
    "protest": 3.0
}

def recommend_resources(impact_level, event_cause):
    base = resource_rules.get(
        impact_level,
        resource_rules["Medium"]
    )

    multiplier = event_multiplier.get(
        event_cause,
        1.0
    )

    police = round(base["police"] * multiplier)
    volunteers = round(base["volunteers"] * multiplier)
    barricades = round(base["barricades"] * multiplier)

    diversion = (
        base["diversion"]
        or event_cause in [
            "accident",
            "construction",
            "water_logging",
            "public_event",
            "procession",
            "vip_movement",
            "protest"
        ]
    )

    return {
        "police": police,
        "volunteers": volunteers,
        "barricades": barricades,
        "diversion": diversion
    }

def recommend_diversion(event_cause):
    if event_cause in [
        "construction",
        "water_logging",
        "protest",
        "vip_movement",
        "procession"
    ]:
        return "Strongly Recommended"

    if event_cause in [
        "accident",
        "public_event"
    ]:
        return "Recommended"

    return "Not Required"

def generate_response_plan(impact_level, event_cause):
    resources = recommend_resources(
        impact_level,
        event_cause
    )

    diversion = recommend_diversion(
        event_cause
    )

    return {
        "impact_level": impact_level,
        "event_cause": event_cause,
        "police": resources["police"],
        "volunteers": resources["volunteers"],
        "barricades": resources["barricades"],
        "diversion": diversion
    }
