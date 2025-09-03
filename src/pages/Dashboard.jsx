import React from "react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, Legend
} from "recharts";

// ---- Sample demo data (replace with real queries later)
const migraineData = [
  { day: "Mon", attacks: 1, intensity: 3 },
  { day: "Tue", attacks: 0, intensity: 0 },
  { day: "Wed", attacks: 2, intensity: 6 },
  { day: "Thu", attacks: 1, intensity: 4 },
  { day: "Fri", attacks: 0, intensity: 0 },
  { day: "Sat", attacks: 1, intensity: 5 },
  { day: "Sun", attacks: 0, intensity: 0 },
];

const sleepData = [
  { day: "Mon", hours: 6.2 },
  { day: "Tue", hours: 7.8 },
  { day: "Wed", hours: 5.1 },
  { day: "Thu", hours: 7.2 },
  { day: "Fri", hours: 8.0 },
  { day: "Sat", hours: 7.5 },
  { day: "Sun", hours: 6.8 },
];

const glucoseData = [
  { time: "08:00", mgdl: 88 }, { time: "10:00", mgdl: 95 },
  { time: "12:00", mgdl: 108 }, { time: "14:00", mgdl: 101 },
  { time: "16:00", mgdl: 112 }, { time: "18:00", mgdl: 106 },
  { time: "20:00", mgdl: 98 },
];

export default function Dashboard() {
  return (
    <div className="app-shell p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Weekly overview of migraines, sleep, and glucose.
            </p>
          </div>
          <div className="hidden sm:block">
            <span className="inline-flex items-center rounded-xl bg-brand-600/10 px-3 py-1.5 text-sm text-brand-800">
              Sentinel Health
            </span>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>Migraine days</CardHeader>
            <CardBody>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                  {migraineData.filter(d => d.attacks > 0).length}
                </span>
                <span className="text-sm text-slate-500">/ 7 days</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                Peak intensity {Math.max(...migraineData.map(d=>d.intensity))}/10.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Avg sleep</CardHeader>
            <CardBody>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                  {(sleepData.reduce((a,b)=>a+b.hours,0)/sleepData.length).toFixed(1)}
                </span>
                <span className="text-sm text-slate-500">hours</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Target: 7–9 hours.</p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>Glucose range</CardHeader>
            <CardBody>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-semibold text-slate-900 dark:text-slate-100">
                  {Math.min(...glucoseData.map(d=>d.mgdl))}–{Math.max(...glucoseData.map(d=>d.mgdl))}
                </span>
                <span className="text-sm text-slate-500">mg/dL</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">Daily daytime readings.</p>
            </CardBody>
          </Card>
        </div>

        {/* Charts row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="h-[380px]">
            <CardHeader>Migraines this week</CardHeader>
            <CardBody className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={migraineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" tickCount={6} />
                  <YAxis yAxisId="right" orientation="right" tickCount={6} />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="attacks" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="intensity" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>

          <Card className="h-[380px]">
            <CardHeader>Sleep hours</CardHeader>
            <CardBody className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sleepData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 10]} tickCount={6} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-6">
          <Card className="h-[380px]">
            <CardHeader>Glucose (today)</CardHeader>
            <CardBody className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={glucoseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="glucoseFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="currentColor" stopOpacity={0.28}/>
                      <stop offset="95%" stopColor="currentColor" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[70, 140]} tickCount={8} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="mgdl" strokeWidth={3} fill="url(#glucoseFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}