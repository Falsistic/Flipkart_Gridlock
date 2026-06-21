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
  "protest"
] as const;

export const corridors = [
  "Ring Road",
  "Outer Ring Road",
  "NH-48",
  "Central Corridor",
  "South Corridor",
  "East Corridor",
  "West Corridor",
  "Unknown"
] as const;

export type EventCause = (typeof eventCauses)[number];
export type Corridor = (typeof corridors)[number];
export type ImpactLevel = "Low" | "Medium" | "High" | "Critical";

export type PredictionRequest = {
  event_cause: EventCause;
  corridor: Corridor;
  hour: number;
  day_of_week: number;
  month: number;
  is_weekend: boolean;
};

export type BackendPredictionResponse = {
  impact_level: string;
  event_cause: string;
  police: number;
  volunteers: number;
  barricades: number;
  diversion: string;
};

export type PredictionResponse = {
  impactLevel: ImpactLevel;
  responsePriority: string;
  policeOfficers: number;
  volunteers: number;
  barricades: number;
  diversionRecommendation: string;
};
