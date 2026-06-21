"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  ChevronDown,
  Clock,
  GitBranch,
  Layers3,
  MapPin,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { predictTrafficImpact } from "@/lib/prediction";
import {
  corridors,
  eventCauses,
  type Corridor,
  type EventCause,
  type ImpactLevel,
  type PredictionResponse
} from "@/types/traffic";

const impactStyles: Record<ImpactLevel, string> = {
  Low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Medium: "bg-amber-50 text-amber-700 ring-amber-200",
  High: "bg-orange-50 text-orange-700 ring-orange-200",
  Critical: "bg-rose-50 text-rose-700 ring-rose-200"
};

const futureFeatures = [
  "Live Traffic Feeds",
  "GIS Integration",
  "Route Optimization",
  "Emergency Response Planning",
  "Crowd Forecasting"
];

const resultRows: Array<[string, keyof PredictionResponse, LucideIcon]> = [
  ["Impact Level", "impactLevel", ShieldCheck],
  ["Response Priority", "responsePriority", Workflow],
  ["Police Officers", "policeOfficers", UsersRound],
  ["Volunteers", "volunteers", UsersRound],
  ["Barricades", "barricades", Layers3],
  ["Diversion Recommendation", "diversionRecommendation", Route]
];

function prettyLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-700">{children}</label>;
}

function SelectField({
  value,
  onChange,
  children,
  id
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
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

export default function ExperimentHome() {
  const [eventCause, setEventCause] = useState<EventCause>("accident");
  const [corridor, setCorridor] = useState<Corridor>("Ring Road");
  const [date, setDate] = useState(getToday);
  const [time, setTime] = useState("18:30");
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const payload = useMemo(() => {
    const dateTime = new Date(`${date}T${time || "00:00"}:00`);
    const dayOfWeek = dateTime.getDay();

    return {
      event_cause: eventCause,
      corridor,
      hour: dateTime.getHours(),
      day_of_week: dayOfWeek,
      month: dateTime.getMonth() + 1,
      is_weekend: dayOfWeek === 0 || dayOfWeek === 6
    };
  }, [corridor, date, eventCause, time]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await predictTrafficImpact(payload);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backend is unavailable");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="overflow-hidden">
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

      <section id="top" className="mx-auto flex min-h-[calc(100vh-80px)] max-w-7xl flex-col justify-center px-5 pb-16 pt-10 sm:px-8">
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
              <a href="#how-it-works" className="inline-flex h-12 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">
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
                  ["Event context", "Cause, corridor, date, and time"],
                  ["Impact model", "Derives hour, day, month, weekend signal"],
                  ["Deployment plan", "Resources and diversion recommendation"]
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

      <section id="prediction" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Prediction</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Plan a response in seconds.</h2>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Event Cause</FieldLabel>
                <SelectField id="event-cause" value={eventCause} onChange={(value) => setEventCause(value as EventCause)}>
                  {eventCauses.map((cause) => (
                    <option key={cause} value={cause}>
                      {prettyLabel(cause)}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FieldLabel>Corridor</FieldLabel>
                <SelectField id="corridor" value={corridor} onChange={(value) => setCorridor(value as Corridor)}>
                  {corridors.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectField>
              </div>
              <div className="space-y-2">
                <FieldLabel>Date</FieldLabel>
                <div className="relative">
                  <InputField type="date" value={date} onChange={(event) => setDate(event.target.value)} />
                  <CalendarDays className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <FieldLabel>Time</FieldLabel>
                <div className="relative">
                  <InputField type="time" value={time} onChange={(event) => setTime(event.target.value)} />
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
              {isLoading ? "Predicting..." : "Predict"}
            </button>
            {error ? (
              <p className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </p>
            ) : null}
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <p className="text-sm font-semibold text-slate-500">Prediction Result Card</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Recommended response</h3>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  prediction ? impactStyles[prediction.impactLevel] : "bg-slate-50 text-slate-500 ring-slate-200"
                }`}
              >
                {prediction?.impactLevel ?? "Awaiting Prediction"}
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              {resultRows.map(([label, key, Icon]) => (
                <div key={label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-slate-600">{label}</span>
                  </div>
                  <span className="text-right text-sm font-semibold text-slate-950">
                    {prediction ? String(prediction[key]) : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Input", "Traffic teams enter event cause, corridor, date, and time.", MapPin],
            ["AI Prediction", "The model converts context into temporal and corridor risk signals.", Brain],
            ["Resource Allocation", "The system returns deployment and diversion recommendations.", GitBranch]
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

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-14 sm:px-8 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Future Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Built for the next layer of traffic intelligence.</h2>
          <div className="mt-6 grid gap-3">
            {futureFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                <Check className="h-4 w-4 text-blue-600" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">Architecture</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Clean request-to-recommendation flow.</h2>
          <div className="mt-8 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {["Frontend Form", "Flask API /predict", "Impact Model", "Recommendation Output", "Authority Action"].map((item, index) => (
              <div key={item} className="contents">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-800">
                  {item}
                </div>
                {index < 4 ? <div className="hidden h-px w-8 flow-line md:block" /> : null}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
            The experimental UI sends event context to the Flask prediction endpoint, then displays the model-backed deployment recommendation.
          </div>
        </div>
      </section>
    </main>
  );
}
