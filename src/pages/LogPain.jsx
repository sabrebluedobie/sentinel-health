import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

function parseCSVToTextArray(input) {
  if (!input || !input.trim()) return [];
  return input
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export default function LogPain() {
  const navigate = useNavigate();

  const [loggedAt, setLoggedAt] = useState("");
  const [painLocation, setPainLocation] = useState("");
  const [painSide, setPainSide] = useState("");
  const [painLevel, setPainLevel] = useState("");
  const [painType, setPainType] = useState(""); // csv input
  const [relatedTo, setRelatedTo] = useState("");
  const [injuryDate, setInjuryDate] = useState("");
  const [conditionName, setConditionName] = useState("");
  const [medicationTaken, setMedicationTaken] = useState(""); // csv input
  const [medicationDose, setMedicationDose] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const painLocations = [
    "Head",
    "Neck",
    "Shoulders",
    "Back - Upper",
    "Back - Lower",
    "Chest",
    "Abdomen",
    "Hips",
    "Knees",
    "Ankles/Feet",
    "Arms",
    "Hands",
    "Legs",
    "Full Body",
    "Other"
  ];

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // Validate required fields
    if (!loggedAt || loggedAt.trim() === "") {
      setBusy(false);
      setError("Please select a date and time.");
      return;
    }

    if (!painLocation || painLocation.trim() === "") {
      setBusy(false);
      setError("Please select a pain location.");
      return;
    }

    if (painLevel === "" || painLevel === null) {
      setBusy(false);
      setError("Please enter a pain level.");
      return;
    }

    // Convert datetime-local to ISO string
    const loggedAtIso = new Date(loggedAt).toISOString();
    
    // Convert injury date if provided
    const injuryDateConverted = injuryDate ? injuryDate : null;

    // Pain level as integer (NOT NULL in DB)
    const pain_num = Number(painLevel);

    // Arrays from CSV
    const painTypeArr = parseCSVToTextArray(painType);
    const medicationArr = parseCSVToTextArray(medicationTaken);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You must be signed in to save.");
      return;
    }

    const payload = {
      user_id: user.id,
      logged_at: loggedAtIso,
      pain_location: painLocation,
      pain_side: painSide || null,
      pain_level: pain_num,
      pain_type: painTypeArr.length > 0 ? painTypeArr : null,
      related_to: relatedTo || null,
      injury_date: injuryDateConverted,
      condition_name: conditionName || null,
      medication_taken: medicationArr.length > 0 ? medicationArr : null,
      medication_dose: medicationDose || null,
      notes: notes || null
    };

    console.log('Debug - Pain log payload:', payload);

    const { error: insertErr } = await supabase
      .from("pain_logs")
      .insert([payload]);

    setBusy(false);

    if (insertErr) {
      console.error('Debug - Insert error:', insertErr);
      setError(insertErr.message);
      return;
    }

    // Show friendly success message
    alert("🩹 Pain Logged!\n\nYour pain entry has been saved.");
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-semibold text-zinc-900">Log Pain</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Track general pain levels and locations to identify patterns.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Date & time <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={loggedAt}
                onChange={(e) => setLoggedAt(e.target.value)}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Pain location <span className="text-red-600">*</span>
                </label>
                <select
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={painLocation}
                  onChange={(e) => setPainLocation(e.target.value)}
                  required
                >
                  <option value="">Select location</option>
                  {painLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Pain side (optional)
                </label>
                <select
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={painSide}
                  onChange={(e) => setPainSide(e.target.value)}
                >
                  <option value="">Select side</option>
                  <option value="Left">Left</option>
                  <option value="Right">Right</option>
                  <option value="Both">Both</option>
                  <option value="Center">Center</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Pain level (0–10) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                max="10"
                step="1"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={painLevel}
                onChange={(e) => setPainLevel(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Pain type (comma-separated, optional)
              </label>
              <input
                type="text"
                placeholder="sharp, dull, throbbing, burning"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={painType}
                onChange={(e) => setPainType(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Related to (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., migraine, arthritis"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={relatedTo}
                  onChange={(e) => setRelatedTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Condition name (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., chronic back pain"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={conditionName}
                  onChange={(e) => setConditionName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Injury date (optional)
              </label>
              <input
                type="date"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={injuryDate}
                onChange={(e) => setInjuryDate(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Medication taken (comma-separated, optional)
                </label>
                <input
                  type="text"
                  placeholder="ibuprofen, acetaminophen"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={medicationTaken}
                  onChange={(e) => setMedicationTaken(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Medication dose (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., 400mg"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                  value={medicationDose}
                  onChange={(e) => setMedicationDose(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Notes (optional)
              </label>
              <textarea
                rows={4}
                placeholder="What might have triggered it? What helped? Any patterns you noticed?"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-600 disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <Link
                to="/"
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2.5 text-zinc-700 hover:bg-zinc-50"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
