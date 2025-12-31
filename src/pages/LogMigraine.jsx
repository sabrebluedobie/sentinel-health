import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import WeatherWidget from "@/components/WeatherWidget";
import VoiceControls from "@/components/VoiceControls";
import useVoiceInput from "@/hooks/useVoiceInput";
import useVoiceOutput from "@/hooks/useVoiceOutput";

function parseCSVToTextArray(input) {
  if (!input || !input.trim()) return [];
  return input
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

export default function LogMigraine() {
  const navigate = useNavigate();

  const [date, setDate] = useState(""); // datetime-local (ISO w/out zone)
  const [painLevel, setPainLevel] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [symptoms, setSymptoms] = useState(""); // csv
  const [triggers, setTriggers] = useState(""); // csv
  const [medicationTaken, setMedicationTaken] = useState("");
  const [medicationEffective, setMedicationEffective] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [voiceMode, setVoiceMode] = useState(false); // Toggle for voice input

  // Voice hooks
  const voiceInput = useVoiceInput({
    continuous: true,
    lang: 'en-US',
  });

  const voiceOutput = useVoiceOutput({
    lang: 'en-US',
    rate: 0.9, // Calm, gentle voice
  });

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // Validate date is provided
    if (!date || date.trim() === "") {
      setBusy(false);
      setError("Please select a start time.");
      return;
    }

    // Convert datetime-local (no tz) to ISO string
    const dateIso = new Date(date).toISOString();
    console.log('Debug - Date input:', date);
    console.log('Debug - Date ISO:', dateIso);

    // optional numerics -> null when empty
    const pain_num = painLevel === "" ? null : Number(painLevel);
    const dur_num = durationHours === "" ? null : Number(durationHours);

    // arrays
    const symptomsArr = parseCSVToTextArray(symptoms);
    const triggersArr = parseCSVToTextArray(triggers);

    // current user for RLS / user_id column if needed
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      setError("You must be signed in to save.");
      return;
    }

    const payload = {
  user_id: user.id,
  started_at: dateIso,
  pain_level: pain_num,
  duration_hours: dur_num,
  symptoms: symptomsArr,
  triggers: triggersArr,
  medication_taken: medicationTaken || null,
  medication_effective: !!medicationEffective,
  source: "manual",
  notes: notes || null,
  // Include weather data if available
  weather_temp: weatherData?.temp || null,
  weather_pressure: weatherData?.pressure || null,
  weather_humidity: weatherData?.humidity || null,
  weather_conditions: weatherData?.conditions || null,
  weather_location: weatherData?.location || null
};

    console.log('Debug - Payload:', payload);

    const { error: insertErr } = await supabase
      .from("migraine_episodes")
      .insert([payload]);

    setBusy(false);

    if (insertErr) {
      console.error('Debug - Insert error:', insertErr);
      setError(insertErr.message);
      // Speak error if in voice mode
      if (voiceMode) {
        voiceOutput.speakCalmly(`Sorry, there was an error saving your migraine entry. ${insertErr.message}`);
      }
      return;
    }

    // Success - speak confirmation if in voice mode
    if (voiceMode) {
      voiceOutput.speakBriefly("Migraine entry saved successfully. You're all set.");
    }

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
          <h1 className="text-lg font-semibold text-zinc-900">Log Migraine</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Fill the fields below. Comma-separate multiple items for symptoms or triggers.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Start time
              </label>
              <input
                type="datetime-local"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
              <WeatherWidget onWeatherData={setWeatherData} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Pain level (0–10)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  max="10"
                  step="0.5"
                  placeholder="optional"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={painLevel}
                  onChange={(e) => setPainLevel(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Duration (hours)
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.25"
                  placeholder="optional"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Symptoms (comma-separated)
              </label>
              <input
                type="text"
                placeholder="nausea, aura, dizziness"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Triggers (comma-separated)
              </label>
              <input
                type="text"
                placeholder="stress, bright light"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-800 mb-1">
                  Medication taken
                </label>
                <input
                  type="text"
                  placeholder="e.g., sumatriptan 50mg"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={medicationTaken}
                  onChange={(e) => setMedicationTaken(e.target.value)}
                />
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                    checked={medicationEffective}
                    onChange={(e) => setMedicationEffective(e.target.checked)}
                  />
                  Medication was effective
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-zinc-800">
                  Notes
                </label>
                <button
                  type="button"
                  onClick={() => setVoiceMode(!voiceMode)}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    voiceMode 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {voiceMode ? '🎤 Voice Mode' : '⌨️ Keyboard'}
                </button>
              </div>

              {voiceMode ? (
                <div className="space-y-3">
                  {/* Voice Controls */}
                  <VoiceControls
                    voiceInput={voiceInput}
                    onTranscriptChange={setNotes}
                    placeholder="Tap microphone and describe your migraine..."
                    showTranscript={true}
                    autoApplyTranscript={true}
                  />
                  
                  {/* Current notes preview */}
                  {notes && (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-gray-700">Your notes:</p>
                        <button
                          type="button"
                          onClick={() => voiceOutput.speakCalmly(notes)}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          🔊 Read aloud
                        </button>
                      </div>
                      <p className="text-sm text-gray-800">{notes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  rows={4}
                  placeholder="Anything else to remember?"
                  className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              )}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 disabled:opacity-50"
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
