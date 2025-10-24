import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { insertPainLog } from "@/services/painLog";

export default function LogPain() {
  const navigate = useNavigate();

  // Basic pain info
  const [overallPainLevel, setOverallPainLevel] = useState(5);
  const [painLocations, setPainLocations] = useState({
    head: false,
    neck: false,
    jaw: false,
    shoulders: false,
    back: false,
    other: false
  });
  const [painTypes, setPainTypes] = useState([]);
  const [side, setSide] = useState("");
  
  // Migraine-specific
  const [isMigrainEvent, setIsMigrainEvent] = useState(false);
  const [headPainLevel, setHeadPainLevel] = useState(0);
  const [symptoms, setSymptoms] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [medicationEffective, setMedicationEffective] = useState(false);
  
  // Common fields
  const [triggers, setTriggers] = useState("");
  const [medications, setMedications] = useState([]);
  const [medicationDose, setMedicationDose] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const painTypeOptions = [
    "Throbbing", "Sharp", "Dull", "Burning", "Aching",
    "Stabbing", "Shooting", "Cramping", "Tingling"
  ];

  const medicationOptions = [
    "Ibuprofen", "Acetaminophen", "Aspirin", "Naproxen",
    "Sumatriptan", "Excedrin", "Muscle Relaxer", "Other"
  ];

  const togglePainType = (type) => {
    if (painTypes.includes(type)) {
      setPainTypes(painTypes.filter(t => t !== type));
    } else {
      setPainTypes([...painTypes, type]);
    }
  };

  const toggleMedication = (med) => {
    if (medications.includes(med)) {
      setMedications(medications.filter(m => m !== med));
    } else {
      setMedications([...medications, med]);
    }
  };

  const toggleLocation = (location) => {
    setPainLocations(prev => ({
      ...prev,
      [location]: !prev[location]
    }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");

    // Check if at least one location is selected
    if (!Object.values(painLocations).some(v => v)) {
      setBusy(false);
      setError("Please select at least one pain location.");
      return;
    }

    try {
      const payload = {
        overall_pain_level: Number(overallPainLevel),
        pain_locations: painLocations,
        pain_types: painTypes,
        side: side || null,
        is_migraine_event: isMigrainEvent,
        triggers: triggers ? triggers.split(',').map(t => t.trim()) : [],
        medications_taken: medications,
        medication_dose: medicationDose || null,
        notes: notes || null,
        timestamp: new Date().toISOString(),
      };

      // Add migraine-specific details if this is a migraine
      if (isMigrainEvent) {
        payload.migraine_details = {
          head_pain_level: Number(headPainLevel) || Number(overallPainLevel),
          symptoms: symptoms ? symptoms.split(',').map(s => s.trim()) : [],
          duration_hours: durationHours ? Number(durationHours) : null,
          medication_effective: medicationEffective,
        };
      }

      await insertPainLog(payload);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8 px-4">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-6">
          <h1 className="text-lg font-semibold text-zinc-900">Log Pain</h1>
          <p className="text-sm text-zinc-600 mb-6">
            Track all types of pain - migraine or otherwise
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Overall Pain Level */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-2">
                Overall Pain Level: {overallPainLevel}/10
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={overallPainLevel}
                onChange={(e) => setOverallPainLevel(e.target.value)}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-zinc-500 mt-1">
                <span>No pain</span>
                <span>Worst pain</span>
              </div>
            </div>

            {/* Pain Locations */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-2">
                Pain Location(s) *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.keys(painLocations).map(location => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => toggleLocation(location)}
                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      painLocations[location]
                        ? 'bg-indigo-100 border-indigo-600 text-indigo-900'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Side */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Side (if applicable)
              </label>
              <select
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={side}
                onChange={(e) => setSide(e.target.value)}
              >
                <option value="">Not applicable</option>
                <option value="Left">Left</option>
                <option value="Right">Right</option>
                <option value="Both">Both</option>
                <option value="Center">Center</option>
              </select>
            </div>

            {/* Pain Types */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-2">
                Pain Type(s)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {painTypeOptions.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => togglePainType(type)}
                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      painTypes.includes(type)
                        ? 'bg-indigo-100 border-indigo-600 text-indigo-900'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Triggers */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Triggers (comma-separated)
              </label>
              <input
                type="text"
                placeholder="stress, bright lights, food"
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={triggers}
                onChange={(e) => setTriggers(e.target.value)}
              />
            </div>

            {/* Medications */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-2">
                Medications Taken
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {medicationOptions.map(med => (
                  <button
                    key={med}
                    type="button"
                    onClick={() => toggleMedication(med)}
                    className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                      medications.includes(med)
                        ? 'bg-green-100 border-green-600 text-green-900'
                        : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    {med}
                  </button>
                ))}
              </div>
              
              {medications.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-1">
                    Dosage/Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 50mg, 2 tablets"
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={medicationDose}
                    onChange={(e) => setMedicationDose(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Is this a migraine? */}
            <div className="border-t border-zinc-200 pt-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isMigrainEvent}
                  onChange={(e) => setIsMigrainEvent(e.target.checked)}
                  className="h-5 w-5 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                />
                <span className="text-sm font-medium text-zinc-800">
                  This is a migraine event
                </span>
              </label>
            </div>

            {/* Migraine-specific fields (conditional) */}
            {isMigrainEvent && (
              <div className="space-y-4 bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <h3 className="text-sm font-semibold text-indigo-900">Migraine Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-2">
                    Head Pain Level: {headPainLevel}/10
                    <span className="text-xs text-zinc-500 ml-2">(can be 0 for silent migraine)</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={headPainLevel}
                    onChange={(e) => setHeadPainLevel(e.target.value)}
                    className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-1">
                    Symptoms (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="aura, nausea, light sensitivity, sound sensitivity"
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-800 mb-1">
                    Duration (hours)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="optional"
                    className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={medicationEffective}
                    onChange={(e) => setMedicationEffective(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-600"
                  />
                  <span className="text-sm text-zinc-800">Medication was effective</span>
                </label>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-zinc-800 mb-1">
                Notes
              </label>
              <textarea
                rows={4}
                placeholder="Any additional details..."
                className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-2.5 text-white font-medium shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy ? "Saving..." : "Save Pain Log"}
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center rounded-md border border-zinc-300 px-6 py-2.5 text-zinc-700 font-medium hover:bg-zinc-50"
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