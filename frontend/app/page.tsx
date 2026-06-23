"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  History,
  MapPin,
  Route,
  Shield,
  Siren,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { predictTrafficImpact } from "@/lib/prediction";
import {
  corridors,
  eventCauses,
  type Corridor,
  type EventCause,
  type HistoryEntry,
  type PredictionResponse,
  type Priority,
} from "@/types/traffic";

// ── priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<Priority, {
  banner: string; badge: string; label: string; sub: string; Icon: React.ElementType;
}> = {
  High: {
    banner: "bg-rose-600",
    badge:  "bg-rose-100 text-rose-700 ring-rose-300",
    label:  "HIGH PRIORITY",
    sub:    "Immediate deployment required",
    Icon:   Siren,
  },
  Low: {
    banner: "bg-emerald-600",
    badge:  "bg-emerald-100 text-emerald-700 ring-emerald-300",
    label:  "LOW PRIORITY",
    sub:    "Routine response",
    Icon:   CheckCircle,
  },
};

// ── helpers ──────────────────────────────────────────────────────────────────

function prettyLabel(v: string) {
  return v.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
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

// ── hero demo card ────────────────────────────────────────────────────────────
// A static preview of what the system outputs — shown in the hero so judges
// immediately understand the value before they scroll.

function HeroDemo() {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-white/10">
      {/* priority banner */}
      <div className="bg-rose-600 px-6 py-5">
        <div className="flex items-center gap-3">
          <Siren className="h-6 w-6 text-white" />
          <div>
            <p className="text-xl font-extrabold tracking-tight text-white">HIGH PRIORITY</p>
            <p className="text-sm text-white/70">Immediate deployment required</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 px-6 py-5">
        {/* scenario tags */}
        <div className="mb-5 flex flex-wrap gap-2">
          {["Congestion", "Mysore Road", "Mon · 9 PM"].map((tag) => (
            <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {tag}
            </span>
          ))}
        </div>

        {/* deployment numbers */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[["24", "Police"], ["19", "Volunteers"], ["12", "Barricades"]].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-white/5 py-4 ring-1 ring-white/10">
              <p className="text-4xl font-extrabold text-white">{v}</p>
              <p className="mt-1 text-xs text-white/50">{l}</p>
            </div>
          ))}
        </div>

        {/* diversion */}
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
          <Route className="h-3.5 w-3.5 text-white/50" />
          <span className="text-xs text-white/60">Diversion</span>
          <span className="ml-auto text-xs font-bold text-white">Recommended</span>
        </div>

        {/* evidence */}
        <div className="mt-3 rounded-xl bg-blue-500/10 px-4 py-3 ring-1 ring-blue-400/20">
          <div className="flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-blue-400" />
            <p className="text-xs text-blue-300">
              Based on <span className="font-bold text-blue-200">728 real incidents</span> on Mysore Road
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-white/30">
          ↑ Example output · Fill the form to get yours
        </p>
      </div>
    </div>
  );
}

// ── form select ──────────────────────────────────────────────────────────────

function SelectField({
  id, label, value, onChange, children,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <select
          id={id} value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  );
}

// ── result card ──────────────────────────────────────────────────────────────

function ResultCard({ prediction }: { prediction: PredictionResponse }) {
  const cfg            = PRIORITY_CONFIG[prediction.priority];
  const corridorEvents = prediction.evidence?.corridor_events ?? 0;
  const activityPct    = Math.min(Math.round((corridorEvents / 728) * 100), 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
      <div className={`${cfg.banner} px-6 py-5 text-white`}>
        <div className="flex items-center gap-3">
          <cfg.Icon className="h-7 w-7" />
          <div>
            <p className="text-2xl font-extrabold tracking-tight">{cfg.label}</p>
            <p className="text-sm opacity-80 mt-0.5">{cfg.sub}</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
            Deployment Plan
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Police",     value: prediction.policeOfficers, Icon: Shield        },
              { label: "Volunteers", value: prediction.volunteers,     Icon: Users         },
              { label: "Barricades", value: prediction.barricades,     Icon: AlertTriangle },
            ].map(({ label, value, Icon }) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4 text-center">
                <Icon className="mx-auto mb-2 h-5 w-5 text-slate-400" />
                <p className="text-4xl font-extrabold text-slate-950">{value}</p>
                <p className="mt-1 text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <Route className="h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Traffic Diversion</p>
            <p className="text-sm font-bold text-slate-950">{prediction.diversionRecommendation}</p>
          </div>
        </div>

        {corridorEvents > 0 && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500">Corridor Activity Level</span>
              </div>
              <span className="text-xs font-bold text-slate-950">{activityPct}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${
                  activityPct >= 70 ? "bg-rose-500" : activityPct >= 40 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${activityPct}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              {corridorEvents.toLocaleString()} real incidents logged — relative to busiest corridor (728)
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              Why this decision?
            </span>
          </div>
          {corridorEvents > 0 ? (
            <p className="text-sm leading-relaxed text-slate-700">
              This corridor has logged{" "}
              <span className="font-bold text-slate-950">{corridorEvents.toLocaleString()} real incidents</span>.
              {prediction.evidence?.corridor_top_cause && (
                <> The most common cause is{" "}
                  <span className="font-bold text-slate-950">
                    {prettyLabel(prediction.evidence.corridor_top_cause)}
                  </span>.
                </>
              )}{" "}
              Model trained on{" "}
              <span className="font-bold text-slate-950">
                {(prediction.evidence?.dataset_events ?? 8054).toLocaleString()} real BTP events
              </span>.
            </p>
          ) : (
            <p className="text-sm leading-relaxed text-slate-700">
              This event is <span className="font-bold text-slate-950">off the major corridor network</span> —
              historically lower priority. Model trained on{" "}
              <span className="font-bold text-slate-950">8,054 real BTP events</span>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── empty state ──────────────────────────────────────────────────────────────

function EmptyResult() {
  return (
    <div className="flex min-h-[460px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
        <Zap className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-950">Ready to predict</h3>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        Fill in the incident details and click{" "}
        <span className="font-semibold text-slate-700">Get Deployment Plan</span>.
      </p>
    </div>
  );
}

// ── history card ─────────────────────────────────────────────────────────────

function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const cfg = PRIORITY_CONFIG[entry.priority];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${cfg.badge}`}>
          {entry.priority}
        </span>
        <span className="shrink-0 text-xs text-slate-400">{timeAgo(entry.predictedAt)}</span>
      </div>
      <p className="mt-3 truncate text-sm font-bold text-slate-950">{prettyLabel(entry.eventCause)}</p>
      <p className="truncate text-xs text-slate-500">{entry.corridor}</p>
      <div className="mt-3 grid grid-cols-3 gap-1 text-center">
        {([["Police", entry.policeOfficers], ["Vol.", entry.volunteers], ["Barr.", entry.barricades]] as [string, number][]).map(
          ([l, v]) => (
            <div key={l} className="rounded-lg bg-slate-50 py-1.5">
              <p className="text-sm font-extrabold text-slate-950">{v}</p>
              <p className="text-[10px] text-slate-400">{l}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TrafficCommand() {
  const [eventCause, setEventCause] = useState<EventCause>("accident");
  const [corridor,   setCorridor]   = useState<Corridor>("Mysore Road");
  const [date,       setDate]       = useState(getToday);
  const [time,       setTime]       = useState("21:00");
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
      setHistory((prev) =>
        [{ ...result, eventCause, corridor, predictedAt: new Date().toISOString() }, ...prev].slice(0, 10)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend is unavailable");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── NAV ── */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600">
              <Siren className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-white">
                Bengaluru Traffic Command
              </p>
              <p className="text-xs text-slate-500">AI-powered deployment decisions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Live
            </span>
            <a
              href="#predict"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-slate-100"
            >
              Try it <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* left — problem + CTA */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-950 px-3 py-1.5 text-xs font-semibold text-rose-300 ring-1 ring-rose-800 mb-6">
                <Siren className="h-3.5 w-3.5" />
                Flipkart Gridlock Hackathon
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                When Bengaluru's roads stop moving,
                <span className="text-rose-400"> every second counts.</span>
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-slate-400 max-w-lg">
                Traffic officers make high-stakes deployment decisions manually — under pressure, in seconds.
                This system does it for them, backed by <span className="text-white font-semibold">8,054 real BTP incidents</span>.
              </p>

              {/* problem → data → solution */}
              <div className="mt-10 space-y-3">
                {[
                  {
                    step: "The problem",
                    text: "Manual deployment decisions waste critical minutes during incidents.",
                    color: "bg-rose-500",
                  },
                  {
                    step: "The data",
                    text: "We analysed every Bengaluru traffic incident from Nov 2023 to Apr 2024.",
                    color: "bg-amber-500",
                  },
                  {
                    step: "The solution",
                    text: "One form. Instant AI-backed deployment plan. Police, volunteers, barricades.",
                    color: "bg-emerald-500",
                  },
                ].map(({ step, text, color }) => (
                  <div key={step} className="flex items-start gap-4 rounded-2xl bg-white/5 px-4 py-4 ring-1 ring-white/10">
                    <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${color}`} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{step}</p>
                      <p className="mt-0.5 text-sm text-slate-300">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <a
                  href="#predict"
                  className="inline-flex h-12 items-center gap-2 rounded-xl bg-rose-600 px-6 text-sm font-bold text-white transition hover:bg-rose-700"
                >
                  Get a Deployment Plan <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#insights"
                  className="inline-flex h-12 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-400 transition hover:text-white"
                >
                  See the data <ArrowDown className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* right — live demo preview */}
            <div className="lg:pl-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                Example output
              </p>
              <HeroDemo />
            </div>

          </div>
        </div>
      </div>

      {/* ── PREDICTION ── */}
      <div id="predict" className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">Live Prediction</p>
          <h2 className="text-3xl font-extrabold text-slate-950">Get a Deployment Plan</h2>
          <p className="mt-2 text-slate-500 max-w-xl">
            Enter the incident details below. The model predicts priority from real BTP data and
            calculates exact resource numbers.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          {/* form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-8"
          >
            <div className="space-y-5">
              <SelectField id="event-cause" label="What happened?" value={eventCause} onChange={(v) => setEventCause(v as EventCause)}>
                {eventCauses.map((c) => <option key={c} value={c}>{prettyLabel(c)}</option>)}
              </SelectField>

              <SelectField id="corridor" label="Where? (Corridor)" value={corridor} onChange={(v) => setCorridor(v as Corridor)}>
                {corridors.map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectField>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Date</label>
                  <div className="relative">
                    <input
                      type="date" value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Time</label>
                  <div className="relative">
                    <input
                      type="time" value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    <Clock className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 text-sm font-bold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analysing incident…
                </>
              ) : (
                <>Get Deployment Plan <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            {error && (
              <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {error}
              </p>
            )}

            <div className="mt-6 rounded-2xl bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">How it works</p>
              <div className="space-y-2.5">
                {[
                  "Enter what happened, where, and when",
                  "ML model predicts priority from 8,054 real BTP incidents",
                  "Resource engine calculates exact deployment numbers",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <p className="text-xs leading-relaxed text-slate-600">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </form>

          {/* result */}
          {prediction ? <ResultCard prediction={prediction} /> : <EmptyResult />}
        </div>
      </div>

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <div className="mx-auto max-w-7xl px-5 pb-10 sm:px-8">
          <div className="mb-4 flex items-center gap-3">
            <History className="h-5 w-5 text-slate-400" />
            <h2 className="text-lg font-extrabold text-slate-950">Recent Predictions</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {history.length}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {history.map((entry, i) => (
              <HistoryCard key={`${entry.predictedAt}-${i}`} entry={entry} />
            ))}
          </div>
        </div>
      )}

      {/* ── DATA INSIGHTS ── */}
      <div id="insights" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-2">
            What the data tells us
          </p>
          <h2 className="text-3xl font-extrabold text-slate-950">
            Real insights from 8,054 Bengaluru incidents
          </h2>
          <p className="mt-2 mb-10 text-slate-500 max-w-2xl">
            Before building the model, we analysed every incident in the dataset.
            These findings directly shape how the resource engine works.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                Icon: Clock,
                stat: "9 PM",
                headline: "Peak incident hour — not 9 AM",
                insight: "Most deployment systems assume morning rush. Real data says the busiest hour is 9 PM. Our resource engine scales accordingly.",
                color: "text-rose-600", bg: "bg-rose-50",
              },
              {
                Icon: MapPin,
                stat: "728",
                headline: "Incidents on Mysore Road alone",
                insight: "One incident every 5 hours, on average. It's the most incident-prone corridor in Bengaluru — and gets the highest resource weighting in our model.",
                color: "text-amber-600", bg: "bg-amber-50",
              },
              {
                Icon: BarChart3,
                stat: "60.7%",
                headline: "Of all incidents are vehicle breakdowns",
                insight: "Not accidents, not protests — breakdowns dominate. Our multipliers reflect this: breakdowns on high-traffic corridors trigger significant deployment.",
                color: "text-blue-600", bg: "bg-blue-50",
              },
            ].map(({ Icon, stat, headline, insight, color, bg }) => (
              <div key={stat} className="rounded-2xl border border-slate-200 p-6">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className={`text-4xl font-extrabold ${color}`}>{stat}</p>
                <p className="mt-3 text-sm font-extrabold text-slate-950">{headline}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{insight}</p>
              </div>
            ))}
          </div>

          {/* corridor heatmap strip */}
          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="mb-5 text-sm font-extrabold text-slate-950">Top corridors by incident volume</p>
            <div className="space-y-3">
              {[
                ["Mysore Road",     728, "bg-rose-500"],
                ["Bellary Road 1",  607, "bg-rose-400"],
                ["Tumkur Road",     458, "bg-amber-500"],
                ["Bellary Road 2",  379, "bg-amber-400"],
                ["Hosur Road",      297, "bg-amber-300"],
                ["ORR North 1",     274, "bg-emerald-400"],
                ["Old Madras Road", 257, "bg-emerald-400"],
              ].map(([name, count, color]) => (
                <div key={name as string} className="flex items-center gap-4">
                  <span className="w-40 shrink-0 text-xs font-semibold text-slate-700 truncate">
                    {name as string}
                  </span>
                  <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-2.5 rounded-full ${color as string}`}
                      style={{ width: `${Math.round((count as number) / 728 * 100)}%` }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-right text-xs font-bold text-slate-500">
                    {count as number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600">
                <Siren className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm font-extrabold text-white">Bengaluru Traffic Command</p>
            </div>
            <p className="text-xs text-slate-500">
              Built for Flipkart Gridlock · Trained on real Astram BTP data · 8,054 events
            </p>
          </div>
        </div>
      </div>

    </main>
  );
}