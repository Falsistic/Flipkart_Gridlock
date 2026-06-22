"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  GitBranch,
  History,
  Layers3,
  MapPin,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { predictTrafficImpact } from "@/lib/prediction";
import {
  corridors,
  eventCauses,
  type Corridor,
  type EventCause,
  type HistoryEntry,
  type ImpactLevel,
  type PredictionResponse,
} from "@/types/traffic";

// ── style maps ───────────────────────────────────────────────────────────────

const impactStyles: Record<ImpactLevel, string> = {
  Low:      "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium:   "bg-amber-50  text-amber-700  ring-amber-200",
  High:     "bg-orange-50 text-orange-700 ring-orange-200",
  Critical: "bg-rose-50   text-rose-700   ring-rose-200",
};

const confidenceBarColor = (c: number) =>
  c >= 75 ? "bg-emerald-500" : c >= 50 ? "bg-amber-500" : "bg-rose-500";

// ── static data ──────────────────────────────────────────────────────────────

const futureFeatures = [
  "Live Traffic Feeds",
  "GIS Integration",
  "Route Optimization",
  "Emergency Response Planning",
  "Crowd Forecasting",
];

// Impact Level row is shown in the badge — exclude from the repeating rows.
const resultRows: Array<[string, keyof PredictionResponse, LucideIcon]> = [
  ["Response Priority",        "responsePriority",        Workflow],
  ["Police Officers",          "policeOfficers",          UsersRound],
  ["Volunteers",               "volunteers",              UsersRound],
  ["Barricades",               "barricades",              Layers3],
  ["Diversion Recommendation", "diversionRecommendation", Route],
];

// ── helpers ──────────────────────────────────────────────────────────────────

function prettyLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── small reusable components ────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}

function SelectField({
  id, value, onChange, children,
}: {
  id: string; value: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function InputField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  );
}

/** Animated progress bar showing the model's confidence in its prediction. */
function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Model Confidence</span>
        </div>
        <span className="text-sm font-bold text-slate-950">{confidence}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${confidenceBarColor(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
    </div>
  );
}

/** 2×2 grid showing each impact class's predicted probability. */
function ClassProbabilities({
  probs,
}: {
  probs: Partial<Record<ImpactLevel, number>>;
}) {
  const levels: ImpactLevel[] = ["Low", "Medium", "High", "Critical"];
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {levels.map((level) => {
        const pct = Math.round((probs[level] ?? 0) * 100);
        return (
          <div key={level} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{level}</span>
              <span className="text-xs font-bold text-slate-800">{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-1 rounded-full bg-blue-500 transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Compact card for the prediction history strip. */
function HistoryCard({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${impactStyles[entry.impactLevel]}`}>
          {entry.impactLevel}
        </span>
        <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.predictedAt)}</span>
      </div>
      <p className="mt-3 truncate text-sm font-semibold text-slate-950">
        {prettyLabel(entry.eventCause)}
      </p>
      <p className="truncate text-xs text-slate-500">{entry.corridor}</p>

      {entry.confidence != null && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-slate-400">Confidence</span>
            <span className="text-xs font-semibold text-slate-700">{entry.confidence}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-1 rounded-full ${confidenceBarColor(entry.confidence)}`}
              style={{ width: `${entry.confidence}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        {(
          [
            ["Police",  entry.policeOfficers],
            ["Vol.",    entry.volunteers],
            ["Barr.",   entry.barricades],
          ] as [string, number][]
        ).map(([label, val]) => (
          <div key={label} className="rounded-lg bg-slate-50 py-1.5">
            <p className="text-xs font-bold text-slate-950">{val}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ExperimentHome() {
  const [eventCause, setEventCause] = useState<EventCause>("accident");
  const [corridor,   setCorridor]   = useState<Corridor>("Ring Road");
  const [date,       setDate]       = useState(getToday);
  const [time,       setTime]       = useState("18:30");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history,    setHistory]    = useState<HistoryEntry[]>([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [error,      setError]      = useState("");

  const payload = useMemo(() => {
    const dt        = new Date(`${date}T${time || "00:00"}:00`);
    const dayOfWeek = dt.getDay();
    return {
      event_cause:  eventCause,
      corridor,
      hour:         dt.getHours(),
      day_of_week:  dayOfWeek,
      month:        dt.getMonth() + 1,
      is_weekend:   dayOfWeek === 0 || dayOfWeek === 6,
    };
  }, [corridor, date, eventCause, time]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await predictTrafficImpact(payload);
      setPrediction(result);
      // Prepend to history (cap at 10 entries)
      setHistory((prev) =>
        [
          { ...result, eventCause, corridor, predictedAt: new Date().toISOString() },
          ...prev,
        ].slice(0, 10)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend is unavailable");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="overflow-hidden">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#top" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-soft">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-slate-950">Traffic AI</span>
        </a>
        <a
          href="#prediction"
          className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:text-slate-950 sm:inline-flex"
        >
          Start Prediction
        </a>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section
        id="top"
        className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-center px-5 pb-16 pt-10 sm:px-8"
      >
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm backdrop-blur">
              <Brain className="h-4 w-4 text-blue-600" />
              AI deployment planning for traffic authorities
            </div>
            <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              AI-Powered Event Traffic Management System
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
              Predict traffic impact and receive instant deployment recommendations.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <a
                href="#prediction"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-slate-950 px-6 text-sm font-semibold text-white shadow-premium transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                Start Prediction
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#how-it-works"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
              >
                See workflow
                <ArrowDown className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-white p-5 shadow-premium">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Prediction workflow</p>
                  <p className="mt-1 text-sm text-slate-500">One request. One operational answer.</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                  Ready
                </span>
              </div>
              <div className="mt-7 space-y-3">
                {[
                  ["Event context",   "Cause, corridor, date, and time"],
                  ["Impact model",    "Derives hour, day, month, weekend signal"],
                  ["Deployment plan", "Resources and diversion recommendation"],
                ].map(([title, copy], index) => (
                  <div key={title} className="flex gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm font-semibold text-slate-950 shadow-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">{title}</p>
                      <p className="mt-1 text-sm text-slate-500">{copy}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PREDICTION ───────────────────────────────────────────────────── */}
      <section id="prediction" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Prediction</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Plan a response in seconds.
          </h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Event Cause</FieldLabel>
                <SelectField
                  id="event-cause"
                  value={eventCause}
                  onChange={(v) => setEventCause(v as EventCause)}
                >
                  {eventCauses.map((c) => (
                    <option key={c} value={c}>{prettyLabel(c)}</option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Corridor</FieldLabel>
                <SelectField
                  id="corridor"
                  value={corridor}
                  onChange={(v) => setCorridor(v as Corridor)}
                >
                  {corridors.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </SelectField>
              </div>

              <div className="space-y-2">
                <FieldLabel>Date</FieldLabel>
                <div className="relative">
                  <InputField
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div className="space-y-2">
                <FieldLabel>Time</FieldLabel>
                <div className="relative">
                  <InputField
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  <Clock className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Send className="h-4 w-4" />
              {isLoading ? "Predicting…" : "Predict"}
            </button>

            {error && (
              <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </p>
            )}
          </form>

          {/* Result Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm font-semibold text-slate-500">Prediction Result Card</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Recommended response
                </h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  prediction
                    ? impactStyles[prediction.impactLevel]
                    : "bg-slate-50 text-slate-500 ring-slate-200"
                }`}
              >
                {prediction?.impactLevel ?? "Awaiting Prediction"}
              </span>
            </div>

            {/* Confidence bar — only shown after a successful prediction */}
            {prediction?.confidence != null && (
              <ConfidenceBar confidence={prediction.confidence} />
            )}

            {/* Result rows */}
            <div className="mt-4 grid gap-3">
              {resultRows.map(([label, key, Icon]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-600">{label}</span>
                  </div>
                  <span className="text-right text-sm font-semibold text-slate-950">
                    {prediction ? String(prediction[key]) : "—"}
                  </span>
                </div>
              ))}
            </div>

            {/* Class probabilities breakdown */}
            {prediction?.classProbabilities &&
              Object.keys(prediction.classProbabilities).length > 0 && (
                <>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Class Probabilities
                  </p>
                  <ClassProbabilities probs={prediction.classProbabilities} />
                </>
              )}
          </div>
        </div>
      </section>

      {/* ── PREDICTION HISTORY ───────────────────────────────────────────── */}
      {history.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <History className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-950">Recent Predictions</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {history.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {history.map((entry, i) => (
              <HistoryCard key={`${entry.predictedAt}-${i}`} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Input",               "Traffic teams enter event cause, corridor, date, and time.",              MapPin],
            ["AI Prediction",       "The model converts context into temporal and corridor risk signals.",     Brain],
            ["Resource Allocation", "The system returns deployment and diversion recommendations.",           GitBranch],
          ].map(([title, copy, Icon]) => (
            <div key={title as string} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{copy as string}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FUTURE + ARCHITECTURE ────────────────────────────────────────── */}
      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Future Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Built for the next layer of traffic intelligence.
          </h2>
          <div className="mt-6 grid gap-3">
            {futureFeatures.map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
              >
                <Check className="h-4 w-4 text-blue-600" />
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Architecture</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
            Clean request-to-recommendation flow.
          </h2>
          <div className="mt-8 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              "Frontend Form",
              "Flask API /predict",
              "Impact Model",
              "Recommendation Output",
              "Authority Action",
            ].map((item, index) => (
              <div key={item} className="contents">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-800">
                  {item}
                </div>
                {index < 4 && <div className="hidden h-px w-8 flow-line md:block" />}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            The experimental UI sends event context to the Flask prediction endpoint, then displays the
            model-backed deployment recommendation.
          </div>
        </div>
      </section>

    </main>
  );
}