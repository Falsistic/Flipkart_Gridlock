import type { BackendPredictionResponse, ImpactLevel, PredictionRequest, PredictionResponse } from "@/types/traffic";

const priority: Record<ImpactLevel, string> = {
  Low: "Routine Response",
  Medium: "Standard Response",
  High: "Urgent Response",
  Critical: "Immediate Response"
};

function normalizeImpactLevel(value: string): ImpactLevel {
  const normalized = value.toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "high") return "High";
  if (normalized === "critical") return "Critical";
  return "Medium";
}

export async function predictTrafficImpact(payload: PredictionRequest): Promise<PredictionResponse> {
  const response = await fetch("http://localhost:5000/predict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      ...payload,
      is_weekend: payload.is_weekend ? 1 : 0
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error ?? "Backend is unavailable");
  }

  const data = (await response.json()) as BackendPredictionResponse;
  const impactLevel = normalizeImpactLevel(data.impact_level);

  return {
    impactLevel,
    responsePriority: priority[impactLevel],
    policeOfficers: data.police,
    volunteers: data.volunteers,
    barricades: data.barricades,
    diversionRecommendation: data.diversion
  };
}
