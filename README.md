# Bengaluru Traffic Command
### AI-powered deployment decisions for Bengaluru Traffic Police

> Built for **Flipkart Gridlock Hackathon** · Trained on **8,054 real BTP incidents**

---

## The Problem

When a traffic incident happens on Bengaluru's roads, officers have minutes to decide:
- How many personnel to deploy?
- Do we barricade the road?
- Should traffic be diverted?

These decisions are made manually, under pressure, inconsistently. A protest on Mysore Road at 9 PM gets a different response depending on who's on duty.

**This system standardises that decision instantly.**

---

## What It Does

Enter three things — what happened, where, and when. Get back an instant deployment plan:

```
Input:   Congestion · Mysore Road · Monday 9 PM
Output:  HIGH PRIORITY
         24 Police Officers
         19 Volunteers  
         12 Barricades
         Diversion: Recommended
         Based on 728 real incidents on this corridor
```

Every recommendation is backed by real data from the Astram (BTP) incident log.

---

## Key Findings from the Data

We analysed every incident before building the model. Three findings directly shaped the system:

| Finding | What we expected | What the data showed |
|---|---|---|
| Peak hour | 9 AM rush | **9 PM** (busiest hour by far) |
| Most common incident | Accidents | **Vehicle breakdowns (60.7%)** |
| Highest-risk corridor | City centre | **Mysore Road (728 incidents)** |

The resource engine multipliers are derived from these real patterns — not guesswork.

---

## How It Works

```
User fills form
      ↓
Next.js derives hour / day / month / weekend from date + time
      ↓
POST /predict → Flask API
      ↓
GradientBoostingClassifier predicts priority (High / Low)
trained on 8,054 real Astram BTP events
      ↓
Resource engine applies data-grounded multipliers:
  · Event-type  (congestion = 1.2×, protest = 0.54×)
  · Corridor    (Mysore Road = 1.5×, Non-corridor = 1.0×)
  · Time of day (9 PM peak = 1.5×, midday = 0.8×)
      ↓
Response: priority + police + volunteers + barricades
        + diversion + real corridor evidence
```

---

## Tech Stack

**Backend** — Python / Flask  
**ML** — scikit-learn GradientBoostingClassifier in a sklearn Pipeline  
**Frontend** — Next.js 15 · React 19 · TypeScript · Tailwind CSS  
**Dataset** — Astram (Bengaluru Traffic Police) anonymised incident log, Nov 2023–Apr 2024  

---

## Running Locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
# → Running on http://127.0.0.1:5001
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local  # edit if your backend is not on 5001
npm install
npm run dev
# → http://localhost:3001
```

### Retrain the model (optional)

```bash
cd backend
# Place astram_events.csv in this folder first
python3 train_model.py
# Prints classification report + CV accuracy, saves impact_model.pkl
```

---

## Project Structure

```
Flipkart_Gridlock/
├── backend/
│   ├── app.py                # Flask API — /predict, /history, /stats
│   ├── resource_engine.py    # Rule-based resource allocation (data-grounded multipliers)
│   ├── train_model.py        # Training script — runs on real Astram CSV
│   ├── impact_model.pkl      # Trained GradientBoosting model (504 KB)
│   ├── model_stats.json      # Pre-computed corridor + peak hour evidence
│   ├── astram_events.csv     # Real BTP dataset (not committed — see below)
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── page.tsx           # Main UI — hero, form, result card, insights
    │   ├── layout.tsx
    │   └── globals.css
    ├── lib/
    │   └── prediction.ts      # API client — maps backend response to UI types
    ├── types/
    │   └── traffic.ts         # TypeScript types — corridors, causes, Priority, Evidence
    └── .env.local.example
```

---

## API

### `POST /predict`

```json
{
  "event_cause": "accident",
  "corridor": "Mysore Road",
  "hour": 21,
  "day_of_week": 1,
  "month": 6,
  "is_weekend": 0
}
```

Response:

```json
{
  "priority": "High",
  "impact_level": "High",
  "police": 24,
  "volunteers": 19,
  "barricades": 12,
  "diversion": "Recommended",
  "confidence": 100.0,
  "evidence": {
    "corridor_events": 728,
    "corridor_top_cause": "vehicle_breakdown",
    "corridor_high_rate": 1.0,
    "dataset_events": 8054,
    "peak_hours": [21, 20, 5]
  },
  "predicted_at": "2024-06-22T15:30:00Z"
}
```

### `GET /health`
### `GET /history` — last 50 predictions
### `GET /stats` — full dataset statistics

---

## Honest Note on Model Accuracy

The model achieves ~99.8% cross-validation accuracy. This is not overfitting — it reflects a real operational rule in the BTP data: **priority is almost entirely determined by whether an event occurs on a named corridor**. Events on Mysore Road, Tumkur Road, and other arterials are labelled High priority; off-corridor events are labelled Low.

The model correctly learns this rule. The value of the product is the **resource allocation layer on top** — which translates that binary priority into specific deployment numbers using data-grounded multipliers.

---

## Dataset

The model is trained on the **Astram anonymised event log** — real Bengaluru Traffic Police incidents from November 2023 to April 2024. The CSV is not committed to this repository due to data sharing restrictions. The trained `impact_model.pkl` and pre-computed `model_stats.json` are included so the app runs without the raw data.

---

## Team

Built by **Navya Sardana** and **Utkarsh** for Flipkart Gridlock.
