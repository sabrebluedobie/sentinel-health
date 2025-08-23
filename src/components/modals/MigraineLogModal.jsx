import React, { useState } from "react";

/** Drop-in Tailwind modal for logging migraines.
 *  Labels align LEFT on desktop and stack ABOVE on mobile.
 *  Buttons are sleek with gradient + ring focus.
 */
export default function MigraineLogModal({ open, onClose, onSave }) {
  const defaultSymptoms = [
    { id: "nausea", label: "Nausea" },
    { id: "vomiting", label: "Vomiting" },
    { id: "photophobia", label: "Photophobia" },
    { id: "phonophobia", label: "Phonophobia" },
    { id: "aura", label: "Aura" },
    { id: "dizziness", label: "Dizziness" },
    { id: "neckpain", label: "Neck pain" },
    { id: "numb", label: "Numbness/tingling" },
    { id: "blurred", label: "Blurred vision" },
    { id: "fatigue", label: "Fatigue" },
    { id: "osmophobia", label: "Osmophobia" },
    { id: "allodynia", label: "Allodynia" },
  ];

  const defaultTriggers = [
    { id: "stress", label: "Stress" },
    { id: "sleep", label: "Lack of sleep" },
    { id: "dehydration", label: "Dehydration" },
    { id: "skipped", label: "Skipped meal" },
    { id: "bright", label: "Bright lights" },
    { id: "smells", label: "Strong smells" },
    { id: "hormonal", label: "Hormonal" },
    { id: "weather", label: "Weather" },
    { id: "heat", label: "Heat" },
    { id: "screen", label: "Screen time" },
    { id: "alcohol", label: "Alcohol" },
    { id: "choc", label: "Chocolate" },
    { id: "caffeine", label: "Caffeine change" },
  ];

  // Form state
  const [dateTime, setDateTime] = useState("");
  const [pain, setPain] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("");
  const [symptoms, setSymptoms] = useState([]); // stores ids and custom strings
  const [triggers, setTriggers] = useState([]);
  const [symptomAdd, setSymptomAdd] = useState("");
  const [triggerAdd, setTriggerAdd] = useState("");
  const [medication, setMedication] = useState("");
  const [effective, setEffective] = useState(false);
  const [weather, setWeather] = useState("");
  const [pressure, setPressure] = useState("");
  const [place, setPlace] = useState("");
  const [notes, setNotes] = useState("");

  if (!open) return null;

  const toggle = (list, setList, id) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const addCommaSeparated = (raw, list, setList, clear) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) setList([...list, ...parts]);
    clear("");
  };

  const defaultSymIds = new Set(defaultSymptoms.map((s) => s.id));
  const customSymptoms = symptoms.filter((s) => !defaultSymIds.has(s));

  const defaultTrigIds = new Set(defaultTriggers.map((t) => t.id));
  const customTriggers = triggers.filter((t) => !defaultTrigIds.has(t));

  const handleSave = () =>
    onSave?.({
      dateTime,
      pain: pain === "" ? null : Number(pain),
      duration: duration === "" ? null : Number(duration),
      location,
      symptoms,
      triggers,
      medication,
      effective,
      weather,
      barometricPressure: pressure,
      place,
      notes,
    });

  const Pill = ({ label, active, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-full border px-3 py-1 text-sm transition",
        active
          ? "border-indigo-400/60 bg-indigo-500/20 text-indigo-100"
          : "border-slate-600/60 bg-slate-800/60 text-slate-200 hover:bg-slate-800",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40",
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/70 p-5">
          <h3 className="text-lg font-semibold tracking-wide text-slate-100">
            Log Migraine
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl border border-slate-600/60 px-3 py-1.5 text-slate-200 hover:bg-slate-800/60 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Labels left on md+, stacked on sm */}
          <div className="grid grid-cols-1 gap-x-4 gap-y-3 md:grid-cols-[220px_1fr]">
            {/* Date & Time */}
            <label htmlFor="dt" className="text-slate-300 md:pt-2">
              Date &amp; Time
            </label>
            <input
              id="dt"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
            />

            {/* Pain / Duration / Location */}
            <span className="text-slate-300 md:pt-2">
              Pain (1–10) / Duration (h)
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                inputMode="numeric"
                placeholder="Pain"
                value={pain}
                onChange={(e) => setPain(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
              <input
                inputMode="numeric"
                placeholder="Duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
              <input
                placeholder="Location (optional)"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
            </div>

            {/* Symptoms */}
            <span className="text-slate-300 md:pt-2">Symptoms</span>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {defaultSymptoms.map((opt) => (
                  <Pill
                    key={opt.id}
                    label={opt.label}
                    active={symptoms.includes(opt.id)}
                    onClick={() => toggle(symptoms, setSymptoms, opt.id)}
                  />
                ))}
                {/* Custom-added symptom pills */}
                {customSymptoms.map((c) => (
                  <Pill
                    key={`c-${c}`}
                    label={c}
                    active
                    onClick={() => toggle(symptoms, setSymptoms, c)}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={symptomAdd}
                  onChange={(e) => setSymptomAdd(e.target.value)}
                  placeholder="Add more, comma-separated"
                  className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
                />
                <button
                  type="button"
                  onClick={() =>
                    addCommaSeparated(
                      symptomAdd,
                      symptoms,
                      setSymptoms,
                      setSymptomAdd
                    )
                  }
                  className="rounded-xl border border-slate-600/60 px-3 py-2.5 text-slate-100 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Triggers */}
            <span className="text-slate-300 md:pt-2">Triggers</span>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {defaultTriggers.map((opt) => (
                  <Pill
                    key={opt.id}
                    label={opt.label}
                    active={triggers.includes(opt.id)}
                    onClick={() => toggle(triggers, setTriggers, opt.id)}
                  />
                ))}
                {customTriggers.map((c) => (
                  <Pill
                    key={`t-${c}`}
                    label={c}
                    active
                    onClick={() => toggle(triggers, setTriggers, c)}
                  />
                ))}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  value={triggerAdd}
                  onChange={(e) => setTriggerAdd(e.target.value)}
                  placeholder="Add more, comma-separated"
                  className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
                />
                <button
                  type="button"
                  onClick={() =>
                    addCommaSeparated(
                      triggerAdd,
                      triggers,
                      setTriggers,
                      setTriggerAdd
                    )
                  }
                  className="rounded-xl border border-slate-600/60 px-3 py-2.5 text-slate-100 hover:bg-slate-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/40"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Medication */}
            <span className="text-slate-300 md:pt-2">Medication taken</span>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                placeholder="Name / dose"
                value={medication}
                onChange={(e) => setMedication(e.target.value)}
                className="w-full max-w-md rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
              <label className="inline-flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-indigo-500"
                  checked={effective}
                  onChange={(e) => setEffective(e.target.checked)}
                />
                Effective?
              </label>
            </div>

            {/* Weather / Pressure / Place */}
            <span className="text-slate-300 md:pt-2">Weather</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <input
                placeholder="Condition"
                value={weather}
                onChange={(e) => setWeather(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
              <input
                placeholder="Barometric pressure"
                value={pressure}
                onChange={(e) => setPressure(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
              <input
                placeholder="Location"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                className="rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
              />
            </div>

            {/* Notes */}
            <label htmlFor="notes" className="text-slate-300 md:pt-2">
              Notes
            </label>
            <textarea
              id="notes"
              placeholder="Anything else…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[92px] w-full resize-y rounded-xl border border-slate-700/70 bg-slate-800/80 px-3 py-2.5 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex items-center gap-3 border-t border-slate-700/70 p-5">
          <button
            onClick={handleSave}
            className="rounded-xl bg-gradient-to-b from-indigo-400 to-indigo-600 px-5 py-2.5 font-semibold text-white shadow-lg transition hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-600/60 px-5 py-2.5 font-semibold text-slate-100 transition hover:bg-slate-800/40 focus:outline-none focus:ring-4 focus:ring-sky-300/40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}