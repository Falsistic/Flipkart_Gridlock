export const eventCauses = [
  "vehicle_breakdown",
  "pot_holes",
  "road_conditions",
  "others",
  "congestion",
  "accident",
  "construction",
  "water_logging",
  "public_event",
  "procession",
  "vip_movement",
  "protest",
] as const;

export const corridors = [
  "Non-corridor",
  "Mysore Road",
  "Bellary Road 1",
  "Tumkur Road",
  "Bellary Road 2",
  "Hosur Road",
  "ORR North 1",
  "Old Madras Road",
  "Magadi Road",
  "ORR East 1",
  "ORR North 2",
  "Bannerghata Road",
  "ORR East 2",
  "West of Chord Road",
  "ORR West 1",
  "CBD 2",
  "Hennur Main Road",
  "IRR(Thanisandra road)",
  "Varthur Road",
  "Old Airport Road",
  "Airport New South Road",
  "CBD 1",
] as const;

export type EventCause  = (typeof eventCauses)[number];
export type Corridor    = (typeof corridors)[number];
export type ImpactLevel = "Low" | "Medium" | "High" | "Critical";

// ── request / response shapes ────────────────────────────────────────────────

export type PredictionRequest = {
  event_cause:  EventCause;
  corridor:     Corridor;
  hour:         number;
  day_of_week:  number;
  month:        number;
  is_weekend:   boolean;
};

/** Raw shape returned by the Flask /predict endpoint. */
export type BackendPredictionResponse = {
  impact_level:        string;
  event_cause:         string;
  police:              number;
  volunteers:          number;
  barricades:          number;
  diversion:           string;
  confidence?:         number | null;
  class_probabilities?: Partial<Record<ImpactLevel, number>>;
  predicted_at?:        string;
};

/** Camel-cased, UI-ready prediction result. */
export type PredictionResponse = {
  impactLevel:             ImpactLevel;
  responsePriority:        string;
  policeOfficers:          number;
  volunteers:              number;
  barricades:              number;
  diversionRecommendation: string;
  confidence:              number | null;
  classProbabilities:      Partial<Record<ImpactLevel, number>>;
  predictedAt:             string;
};

/** One entry stored in the recent-predictions history. */
export type HistoryEntry = PredictionResponse & {
  eventCause: EventCause;
  corridor:   Corridor;
};