// src/pages/LogMedication.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Pill,
  Plus,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LogMedication() {
  const [user, setUser] = useState(null);
  const [medications, setMedications] = useState([]);
  const [todayDoses, setTodayDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMed, setShowAddMed] = useState(false);
  const [expandedMed, setExpandedMed] = useState(null);

  // Add/Edit medication form state
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    form: 'pill',
    frequency: 'daily',
    times: ['08:00'],
    purpose: '',
    prescriber: '',
    notes: '',
    is_critical: false,
    reminders_enabled: false,
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadMedications();
      loadTodayDoses();
    }
  }, [user]);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  async function loadMedications() {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error loading medications:', error);
    } else {
      setMedications(data || []);
    }
  }

  async function loadTodayDoses() {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('taken_at', `${today}T00:00:00`)
      .lte('taken_at', `${today}T23:59:59`);

    if (error) {
      console.error('Error loading today doses:', error);
    } else {
      setTodayDoses(data || []);
    }
  }

  async function handleAddMedication(e) {
    e.preventDefault();

    const cleanedTimes = (formData.times || [])
      .map((t) => (typeof t === 'string' ? t.trim() : ''))
      .filter(Boolean);

    const { error } = await supabase
      .from('medications')
      .insert([{
        user_id: user.id,
        ...formData,
        times: cleanedTimes.length ? cleanedTimes : ['08:00'],
        started_at: new Date().toISOString(),
      }]);

    if (error) {
      console.error('Error adding medication:', error);
      alert('Failed to add medication');
    } else {
      setShowAddMed(false);
      resetForm();
      loadMedications();
    }
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function timeToMinutes(timeStr) {
    const [h, m] = String(timeStr || '').split(':');
    const hh = Number(h);
    const mm = Number(m);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return hh * 60 + mm;
  }

  function minutesToTime(mins) {
    const hh = Math.floor(mins / 60);
    const mm = mins % 60;
    return `${pad2(hh)}:${pad2(mm)}`;
  }

  function formatHHMMFromISO(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  }

  // Ensure consistent sorting + de-dupe times
  function getSortedTimes(med) {
    const times = Array.isArray(med?.times) ? med.times : [];
    const unique = Array.from(new Set(times.map((t) => String(t).trim()).filter(Boolean)));
    return unique
      .map((t) => ({ t, m: timeToMinutes(t) }))
      .filter((x) => x.m !== null)
      .sort((a, b) => a.m - b.m)
      .map((x) => x.t);
  }

  // Find the most recent log for a given medication+slot (by scheduled_time HH:MM)
  function getDoseLogForSlot(medicationId, timeStr) {
    const candidates = todayDoses
      .filter((dose) => dose.medication_id === medicationId)
      .filter((dose) => formatHHMMFromISO(dose.scheduled_time) === timeStr);

    if (!candidates.length) return null;

    // Most recent first (fallback to created_at if present)
    return candidates.sort((a, b) => {
      const aT = new Date(a.taken_at || a.created_at || 0).getTime();
      const bT = new Date(b.taken_at || b.created_at || 0).getTime();
      return bT - aT;
    })[0];
  }

  function makeScheduledISOForToday(timeStr) {
    const mins = timeToMinutes(timeStr);
    if (mins === null) return null;

    const now = new Date();
    const scheduled = new Date(now);
    scheduled.setHours(Math.floor(mins / 60), mins % 60, 0, 0);

    // Important: This is intentional. We set local hours, then store as ISO (UTC),
    // which round-trips back to the same local HH:MM when read as Date().
    return scheduled.toISOString();
  }

  async function handleLogDose(medication, timeStr, status = 'taken') {
    const now = new Date();
    const scheduledTime = makeScheduledISOForToday(timeStr);

    if (!scheduledTime) {
      alert('Invalid scheduled time');
      return;
    }

    const { error } = await supabase
      .from('medication_logs')
      .insert([{
        user_id: user.id,
        medication_id: medication.id,
        scheduled_time: scheduledTime,
        taken_at: now.toISOString(),
        dosage_taken: medication.dosage,
        status,
      }]);

    if (error) {
      console.error('Error logging dose:', error);
      alert('Failed to log dose');
    } else {
      loadTodayDoses();
    }
  }

  // Optional convenience: determine if all scheduled slots are completed (taken)
  const medDoseSummary = useMemo(() => {
    const map = new Map();

    for (const med of medications) {
      const times = getSortedTimes(med);
      const slots = times.map((t) => {
        const log = getDoseLogForSlot(med.id, t);
        return { time: t, log };
      });

      const total = slots.length;
      const takenCount = slots.filter((s) => s.log?.status === 'taken').length;
      const loggedCount = slots.filter((s) => !!s.log).length;

      map.set(med.id, {
        times,
        slots,
        total,
        takenCount,
        loggedCount,
        allTaken: total > 0 && takenCount === total,
        anyLogged: loggedCount > 0,
      });
    }

    return map;
  }, [medications, todayDoses]);

  function resetForm() {
    setFormData({
      name: '',
      dosage: '',
      form: 'pill',
      frequency: 'daily',
      times: ['08:00'],
      purpose: '',
      prescriber: '',
      notes: '',
      is_critical: false,
      reminders_enabled: false,
    });
  }

  function addTimeSlot() {
    setFormData({
      ...formData,
      times: [...formData.times, '12:00'],
    });
  }

  function removeTimeSlot(index) {
    setFormData({
      ...formData,
      times: formData.times.filter((_, i) => i !== index),
    });
  }

  function updateTimeSlot(index, value) {
    const newTimes = [...formData.times];
    newTimes[index] = value;
    setFormData({ ...formData, times: newTimes });
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Pill className="w-7 h-7 text-blue-600" />
          Medication Tracker
        </h1>
        <p className="text-gray-600">
          Track your medications and monitor adherence
        </p>
      </div>

      {/* Today's Medications */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Today&apos;s Medications
        </h2>

        {medications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No medications added yet</p>
            <button
              onClick={() => setShowAddMed(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Add your first medication
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med) => {
              const summary = medDoseSummary.get(med.id);
              const times = summary?.times?.length ? summary.times : getSortedTimes(med);
              const allTaken = summary?.allTaken ?? false;
              const anyLogged = summary?.anyLogged ?? false;
              const partial = anyLogged && !allTaken;

              return (
                <div
                  key={med.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    allTaken
                      ? 'border-green-200 bg-green-50'
                      : med.is_critical
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 truncate">{med.name}</h3>

                        {med.is_critical && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="w-3 h-3" />
                            Critical
                          </span>
                        )}

                        {allTaken && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Check className="w-3 h-3" />
                            All taken
                          </span>
                        )}

                        {partial && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3" />
                            Partial
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4" />
                          <span>{med.dosage} • {med.form}</span>
                        </div>

                        {times.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{times.join(', ')}</span>
                          </div>
                        )}

                        {med.purpose && (
                          <div className="text-gray-500 italic">{med.purpose}</div>
                        )}
                      </div>

                      {/* Dose slots */}
                      {times.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {times.map((t) => {
                            const log = getDoseLogForSlot(med.id, t);
                            const isTaken = log?.status === 'taken';
                            const isSkipped = log?.status === 'skipped';

                            return (
                              <div
                                key={t}
                                className="flex items-center justify-between gap-2 bg-white/70 rounded-md border border-gray-200 px-3 py-2"
                              >
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{t}</span>

                                  {isTaken && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <Check className="w-3 h-3" />
                                      Taken
                                    </span>
                                  )}

                                  {isSkipped && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                      <X className="w-3 h-3" />
                                      Skipped
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {!log ? (
                                    <>
                                      <button
                                        onClick={() => handleLogDose(med, t, 'taken')}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm font-medium"
                                      >
                                        <Check className="w-4 h-4" />
                                        Taken
                                      </button>
                                      <button
                                        onClick={() => handleLogDose(med, t, 'skipped')}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-1 text-sm"
                                      >
                                        <X className="w-4 h-4" />
                                        Skip
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => setExpandedMed(expandedMed === med.id ? null : med.id)}
                                      className="px-2 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                                      title="Details"
                                    >
                                      {expandedMed === med.id ? (
                                        <ChevronUp className="w-5 h-5" />
                                      ) : (
                                        <ChevronDown className="w-5 h-5" />
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Always allow expanding details */}
                    <button
                      onClick={() => setExpandedMed(expandedMed === med.id ? null : med.id)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title="More details"
                    >
                      {expandedMed === med.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {expandedMed === med.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
                      {med.prescriber && (
                        <div>
                          <span className="font-medium text-gray-700">Prescribed by:</span>{' '}
                          <span className="text-gray-600">{med.prescriber}</span>
                        </div>
                      )}
                      {med.notes && (
                        <div>
                          <span className="font-medium text-gray-700">Notes:</span>{' '}
                          <span className="text-gray-600">{med.notes}</span>
                        </div>
                      )}
                      {med.reminders_enabled && (
                        <div className="flex items-center gap-2 text-blue-600">
                          <Clock className="w-4 h-4" />
                          <span>Reminders enabled</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Medication Button */}
      {!showAddMed && medications.length > 0 && (
        <button
          onClick={() => setShowAddMed(true)}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Medication
        </button>
      )}

      {/* Add Medication Form */}
      {showAddMed && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Add Medication</h2>

          <form onSubmit={handleAddMedication} className="space-y-4">
            {/* Medication Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lithium, Sumatriptan, Metformin"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Dosage & Form */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 300mg, 10 units"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Form
                </label>
                <select
                  value={formData.form}
                  onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pill">Pill/Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="liquid">Liquid</option>
                  <option value="injection">Injection</option>
                  <option value="inhaler">Inhaler</option>
                  <option value="patch">Patch</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Schedule
              </label>
              <div className="space-y-2">
                {formData.times.map((time, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateTimeSlot(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {formData.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTimeSlot(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTimeSlot}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add another time
                </button>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="e.g., Mood stabilizer, Migraine preventive"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Prescriber */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prescribed By
              </label>
              <input
                type="text"
                value={formData.prescriber}
                onChange={(e) => setFormData({ ...formData, prescriber: e.target.value })}
                placeholder="Dr. Smith"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Take with food, avoid grapefruit, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Critical Medication */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_critical}
                  onChange={(e) => setFormData({ ...formData, is_critical: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    Critical Medication
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Mark this if missing a dose could be dangerous (e.g., Lithium, Insulin, Blood Pressure meds)
                  </p>
                </div>
              </label>
            </div>

            {/* Reminders */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminders_enabled}
                  onChange={(e) => setFormData({ ...formData, reminders_enabled: e.target.checked })}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Enable Reminders
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Get notified 15 minutes before each dose (optional - only if you want them!)
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Add Medication
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddMed(false);
                  resetForm();
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
