from pathlib import Path
import sys

import joblib
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from resource_engine import generate_response_plan

MODEL_PATH = BASE_DIR / "impact_model.pkl"
FEATURES = [
    "event_cause",
    "corridor",
    "hour",
    "day_of_week",
    "month",
    "is_weekend",
]

app = Flask(__name__)
CORS(app)

impact_model = joblib.load(MODEL_PATH)


def normalize_impact_level(value):
    if hasattr(value, "item"):
        value = value.item()

    text = str(value)
    return text[:1].upper() + text[1:].lower()


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True) or {}
    missing = [feature for feature in FEATURES if feature not in payload]

    if missing:
        return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

    try:
        row = {
            "event_cause": payload["event_cause"],
            "corridor": payload["corridor"],
            "hour": int(payload["hour"]),
            "day_of_week": int(payload["day_of_week"]),
            "month": int(payload["month"]),
            "is_weekend": int(payload["is_weekend"]),
        }
        frame = pd.DataFrame([[row[feature] for feature in FEATURES]], columns=FEATURES)
        prediction = impact_model.predict(frame)[0]
        impact_level = normalize_impact_level(prediction)
        response_plan = generate_response_plan(impact_level, row["event_cause"])

        return jsonify(response_plan)
    except Exception as exc:
        app.logger.exception("Prediction failed")
        return jsonify({"error": "Prediction failed", "details": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
