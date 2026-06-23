import type {
  BackendPredictionResponse,
  ImpactLevel,
  PredictionRequest,
  PredictionResponse,
} from "@/types/traffic";

// Set NEXT_PUBLIC_API_URL in .env.local to point at your backend.
// Falls back to localhost for local development.
const API_URL = "https://flipkart-gridlock-jb9e.vercel.app/predict";
const PRIORITY: Record<ImpactLevel, string> = {
  Low:      "Routine Response",
  Medium:   "Standard Response",
  High:     "Urgent Response",
  Critical: "Immediate Response",
};

function normalizeImpactLevel(value: string): ImpactLevel {
  const v = value.toLowerCase();
  if (v === "low")      return "Low";
  if (v === "medium")   return "Medium";
  if (v === "high")     return "High";
  if (v === "critical") return "Critical";
  return "Medium";  // safe fallback
}

export async function predictTrafficImpact(
  payload: PredictionRequest
): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...payload,
      is_weekend: payload.is_weekend ? 1 : 0,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    const msg = Array.isArray(err?.error)
      ? err.error.join("; ")
      : (err?.error ?? "Backend is unavailable");
    throw new Error(msg);
  }

  const data = (await response.json()) as BackendPredictionResponse;
  const impactLevel = normalizeImpactLevel(data.impact_level);

  return {
    impactLevel,
    responsePriority:        PRIORITY[impactLevel],
    policeOfficers:          data.police,
    volunteers:              data.volunteers,
    barricades:              data.barricades,
    diversionRecommendation: data.diversion,
    confidence:              data.confidence ?? null,
    classProbabilities:      data.class_probabilities ?? {},
    predictedAt:             data.predicted_at ?? new Date().toISOString(),
  };
}