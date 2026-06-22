"""
train_model.py — Train and save the Flipkart Gridlock impact prediction model.

Usage
-----
    pip install -r requirements.txt
    python train_model.py

What this does
--------------
1. Generates 15 000 synthetic but *realistically weighted* training samples.
   Impact labels are derived from a domain-knowledge scoring function, not
   random assignment, so the model learns meaningful patterns:
     - protest + evening rush + NH-48  → Critical
     - vehicle breakdown + 2 AM + West Corridor → Low
2. Builds a scikit-learn Pipeline:
     ColumnTransformer (OneHotEncoder for categoricals, passthrough for ints)
     → GradientBoostingClassifier (300 estimators, depth 5)
   This keeps encoding and the classifier in one serialisable artifact.
3. Prints a classification report and per-class accuracy so you can verify
   the model is learning signal, not noise.
4. Saves impact_model.pkl next to this file, overwriting any existing model.

The GradientBoosting classifier supports predict_proba() natively, so the
API will always return a confidence score (no fallback path needed).
"""

import random
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

# ── reproducibility ─────────────────────────────────────────────────────────

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# ── domain constants ─────────────────────────────────────────────────────────

EVENT_CAUSES = [
    "vehicle_breakdown", "pot_holes", "road_conditions", "others",
    "congestion", "accident", "construction", "water_logging",
    "public_event", "procession", "vip_movement", "protest",
]

CORRIDORS = [
    "Ring Road", "Outer Ring Road", "NH-48", "Central Corridor",
    "South Corridor", "East Corridor", "West Corridor", "Unknown",
]

# Domain-knowledge base scores — drives realistic label distribution
_EVENT_SCORE: dict[str, int] = {
    "vehicle_breakdown": 0, "pot_holes": 0, "road_conditions": 1,
    "others": 0,            "congestion": 2, "accident": 3,
    "construction": 3,      "water_logging": 3, "public_event": 4,
    "procession": 4,        "vip_movement": 5, "protest": 6,
}

_CORRIDOR_SCORE: dict[str, int] = {
    "NH-48": 2, "Central Corridor": 2, "Ring Road": 1,
    "Outer Ring Road": 1, "South Corridor": 0,
    "East Corridor": 0,  "West Corridor": 0, "Unknown": 0,
}


def _hour_score(hour: int) -> int:
    if 7 <= hour <= 10 or 17 <= hour <= 21:   # rush hours
        return 2
    if 11 <= hour <= 16:                       # midday
        return 1
    return 0                                   # night


def _score_to_label(score: int) -> str:
    if score <= 2:  return "Low"
    if score <= 4:  return "Medium"
    if score <= 7:  return "High"
    return "Critical"


# ── dataset generation ───────────────────────────────────────────────────────

def generate_dataset(n: int = 15_000) -> pd.DataFrame:
    """
    Produce a DataFrame of n samples with realistic impact-level labels.

    Labels are not random — they're calculated from a domain-scoring function
    plus bounded noise, so the model learns genuine traffic-severity patterns.
    """
    rows = []
    for _ in range(n):
        event_cause = random.choice(EVENT_CAUSES)
        corridor    = random.choice(CORRIDORS)
        hour        = random.randint(0, 23)
        day_of_week = random.randint(0, 6)
        month       = random.randint(1, 12)
        is_weekend  = int(day_of_week in (5, 6))

        score = (
            _EVENT_SCORE[event_cause]
            + _CORRIDOR_SCORE[corridor]
            + _hour_score(hour)
            + is_weekend                       # weekends add 1 point
            + random.randint(-1, 2)            # bounded noise
        )
        score = max(0, score)

        rows.append({
            "event_cause":  event_cause,
            "corridor":     corridor,
            "hour":         hour,
            "day_of_week":  day_of_week,
            "month":        month,
            "is_weekend":   is_weekend,
            "impact_level": _score_to_label(score),
        })

    return pd.DataFrame(rows)


# ── pipeline ─────────────────────────────────────────────────────────────────

def build_pipeline() -> Pipeline:
    cat_cols = ["event_cause", "corridor"]
    num_cols = ["hour", "day_of_week", "month", "is_weekend"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
            ("num", "passthrough", num_cols),
        ]
    )

    # GradientBoosting natively supports predict_proba — required for
    # confidence scores in the API.
    clf = GradientBoostingClassifier(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.1,
        subsample=0.8,
        min_samples_split=10,
        random_state=SEED,
    )

    return Pipeline([("preprocessor", preprocessor), ("classifier", clf)])


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    print("=" * 60)
    print("Flipkart Gridlock — Model Training")
    print("=" * 60)

    print("\n[1/4] Generating training data …")
    df = generate_dataset(15_000)

    print("\n  Class distribution:")
    dist = df["impact_level"].value_counts()
    for label, count in dist.items():
        bar = "█" * (count // 100)
        print(f"    {label:<10} {count:>5}  {bar}")

    X = df.drop(columns=["impact_level"])
    y = df["impact_level"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=SEED, stratify=y
    )

    print(f"\n  Train: {len(X_train):>5} samples")
    print(f"  Test : {len(X_test):>5} samples")

    print("\n[2/4] Training model …  (this takes ~30 s)")
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    print("\n[3/4] Evaluating …")
    y_pred = pipeline.predict(X_test)

    print("\n  Classification report:")
    print(classification_report(y_test, y_pred, digits=3))

    print("  Confusion matrix (rows=actual, cols=predicted):")
    labels = ["Low", "Medium", "High", "Critical"]
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    header = "          " + "  ".join(f"{l:>8}" for l in labels)
    print(header)
    for label, row in zip(labels, cm):
        print(f"  {label:<8}  " + "  ".join(f"{v:>8}" for v in row))

    # 5-fold cross-validation for robustness check
    print("\n  5-fold CV accuracy …")
    cv_scores = cross_val_score(
        build_pipeline(), X, y,
        cv=StratifiedKFold(n_splits=5, shuffle=True, random_state=SEED),
        scoring="accuracy",
        n_jobs=-1,
    )
    print(f"    {cv_scores.round(3)}  →  mean {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")

    out_path = Path(__file__).resolve().parent / "impact_model.pkl"
    print(f"\n[4/4] Saving model → {out_path}")
    joblib.dump(pipeline, out_path)
    print("\nDone. ✓")
    print("=" * 60)


if __name__ == "__main__":
    main()