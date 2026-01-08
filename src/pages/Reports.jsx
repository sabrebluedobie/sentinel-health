// src/pages/Reports.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Activity,
  Heart,
  Moon,
  Droplet,
  Printer,
  AlertCircle,
  Pill,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const DEFAULT_SECTIONS = {
  migraines: true,
  glucose: true,
  sleep: true,
  pain: true,
  medications: true,
};

function isoDayStart(dateStr) {
  // dateStr: YYYY-MM-DD
  return `${dateStr}T00:00:00.000Z`;
}

function isoDayEnd(dateStr) {
  return `${dateStr}T23:59:59.999Z`;
}

function daysBetweenInclusive(startDateStr, endDateStr) {
  const start = new Date(isoDayStart(startDateStr));
  const end = new Date(isoDayEnd(endDateStr));
  // inclusive-ish day count; avoids 0-day when same day
  return Math.max(1, Math.ceil((end - start + 1) / (1000 * 60 * 60 * 24)));
}

export default function Reports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [dateRange, setDateRange] = useState('30'); // days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // What gets included in the report (promise: share only what you want)
  const [sections, setSections] = useState(DEFAULT_SECTIONS);

  // Extra privacy knobs
  const [includeNotes, setIncludeNotes] = useState(false); // excludes free-text by default

  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('auth.getUser error:', error);
      setUser(data?.user ?? null);
      setLoading(false);
    })();
  }, []);

  const computedRange = useMemo(() => {
    const endDate = customEndDate || new Date().toISOString().split('T')[0];
    let startDate;

    if (dateRange === 'custom' && customStartDate) {
      startDate = customStartDate;
    } else {
      const days = parseInt(dateRange, 10);
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split('T')[0];
    }

    return {
      startDate,
      endDate,
      startISO: isoDayStart(startDate),
      endISO: isoDayEnd(endDate),
      periodDays: daysBetweenInclusive(startDate, endDate),
    };
  }, [dateRange, customStartDate, customEndDate]);

  function handlePrint() {
    window.print();
  }

  function handleDownloadPDF() {
    window.print();
  }

  function toggleSection(key) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function generateReport() {
    if (!user) return;

    setGenerating(true);
    setReportData(null);

    const { startDate, endDate, startISO, endISO, periodDays } = computedRange;

    // Build select lists so "Include notes" truly excludes those fields.
    // (We still use .select(...) instead of '*' to reduce exposure.)
    const migraineSelect = includeNotes
      ? 'id,user_id,started_at,pain,symptoms,notes,weather_temp,weather_pressure,weather_humidity,weather_conditions,weather_location'
      : 'id,user_id,started_at,pain,symptoms,weather_temp,weather_pressure,weather_humidity,weather_conditions,weather_location';

    const glucoseSelect =
       'id,user_id,device_time,value_mgdl,trend,source'
       'id,user_id,device_time,value_mgdl,trend,source';

    const sleepSelect = includeNotes
      ? 'id,user_id,start_time,total_sleep_hours,efficiency,notes'
      : 'id,user_id,start_time,total_sleep_hours,efficiency';

    // pain_logs schema: logged_at, pain_location, pain_level, pain_type, notes, etc. :contentReference[oaicite:2]{index=2}
    const painSelect = includeNotes
      ? 'id,user_id,logged_at,pain_location,pain_side,pain_level,pain_type,related_to,injury_date,condition_name,medication_taken,medication_dose,notes'
      : 'id,user_id,logged_at,pain_location,pain_side,pain_level,pain_type,related_to,injury_date,condition_name,medication_taken,medication_dose';

    const medsSelect = includeNotes
      ? 'id,user_id,name,dosage,times,is_active,is_critical,purpose,prescriber,notes'
      : 'id,user_id,name,dosage,times,is_active,is_critical,purpose,prescriber';

    const medLogsSelect = includeNotes
      ? 'id,user_id,medication_id,taken_at,status,notes'
      : 'id,user_id,medication_id,taken_at,status';

    try {
      // Build query promises conditionally based on filters
      const queries = [];

      let migraineRes = { data: [], error: null };
      let glucoseRes = { data: [], error: null };
      let sleepRes = { data: [], error: null };
      let painRes = { data: [], error: null };
      let medicationRes = { data: [], error: null };
      let medLogsRes = { data: [], error: null };

      if (sections.migraines) {
        queries.push(
          supabase
            .from('migraine_episodes')
            .select(migraineSelect)
            .eq('user_id', user.id)
            .gte('started_at', startISO)
            .lte('started_at', endISO)
            .order('started_at', { ascending: false })
            .then((res) => (migraineRes = res))
        );
      }

      if (sections.glucose) {
        queries.push(
          supabase
            .from('glucose_readings')
            .select(glucoseSelect)
            .eq('user_id', user.id)
            .gte('device_time', startISO)
            .lte('device_time', endISO)
            .order('device_time', { ascending: false })
            .then((res) => (glucoseRes = res))
        );
      }

      if (sections.sleep) {
        queries.push(
          supabase
            .from('sleep_data')
            .select(sleepSelect)
            .eq('user_id', user.id)
            .gte('start_time', startISO)
            .lte('start_time', endISO)
            .order('start_time', { ascending: false })
            .then((res) => (sleepRes = res))
        );
      }

      if (sections.pain) {
        queries.push(
          supabase
            .from('pain_logs')
            .select(painSelect)
            .eq('user_id', user.id)
            .gte('logged_at', startISO)
            .lte('logged_at', endISO)
            .order('logged_at', { ascending: false })
            .then((res) => (painRes = res))
        );
      }

      if (sections.medications) {
        queries.push(
          supabase
            .from('medications')
            .select(medsSelect)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('name')
            .then((res) => (medicationRes = res))
        );

        queries.push(
          supabase
            .from('medication_logs')
            .select(medLogsSelect)
            .eq('user_id', user.id)
            .gte('taken_at', startISO)
            .lte('taken_at', endISO)
            .order('taken_at', { ascending: false })
            .then((res) => (medLogsRes = res))
        );
      }

      await Promise.all(queries);

      // Surface specific errors (this is *gold* for debugging)
      const errors = [
        ['migraine_episodes', migraineRes.error],
        ['glucose_readings', glucoseRes.error],
        ['sleep_data', sleepRes.error],
        ['pain_logs', painRes.error],
        ['medications', medicationRes.error],
        ['medication_logs', medLogsRes.error],
      ].filter(([, err]) => err);

      if (errors.length) {
        console.error('Report query errors:', errors);
        const readable = errors
          .map(([table, err]) => `${table}: ${err?.message || 'Unknown error'}`)
          .join('\n');
        alert(`Failed to generate report.\n\n${readable}`);
        return;
      }

      const raw = {
        startDate,
        endDate,
        periodDays,
        migraines: migraineRes.data || [],
        glucose: glucoseRes.data || [],
        sleep: sleepRes.data || [],
        pain: painRes.data || [],
        medications: medicationRes.data || [],
        medLogs: medLogsRes.data || [],
      };

      setReportData(calculateMetrics(raw));
    } catch (error) {
      console.error('Error generating report (catch):', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function calculateMetrics(data) {
    const {
      migraines,
      glucose,
      sleep,
      pain,
      medications,
      medLogs,
      startDate,
      endDate,
      periodDays,
    } = data;

    // Migraine metrics
    const migraineCount = migraines.length;
    const avgMigraineSeverity =
      migraines.length > 0
        ? (
            migraines.reduce((sum, m) => sum + (Number(m.pain) || 0), 0) /
            migraines.length
          ).toFixed(1)
        : '0.0';

    const migrainesByDay = {};
    migraines.forEach((m) => {
      const day = new Date(m.started_at).toLocaleDateString();
      migrainesByDay[day] = (migrainesByDay[day] || 0) + 1;
    });
    const migraineDays = Object.keys(migrainesByDay).length;

    // Glucose metrics
    const glucoseReadings = glucose.length;
    const avgGlucose =
      glucose.length > 0
        ? (
            glucose.reduce((sum, g) => sum + Number(g.value_mgdl || 0), 0) /
            glucose.length
          ).toFixed(0)
        : '0';

    const highGlucose = glucose.filter((g) => Number(g.value_mgdl) > 180).length;
    const lowGlucose = glucose.filter((g) => Number(g.value_mgdl) < 70).length;
    const inRangeGlucose = glucose.length - highGlucose - lowGlucose;
    const timeInRange =
      glucose.length > 0 ? ((inRangeGlucose / glucose.length) * 100).toFixed(1) : '0.0';

    // Sleep metrics
    const avgSleep =
      sleep.length > 0
        ? (
            sleep.reduce((sum, s) => sum + Number(s.total_sleep_hours || 0), 0) /
            sleep.length
          ).toFixed(1)
        : '0.0';

    const avgEfficiency =
      sleep.length > 0
        ? (
            sleep.reduce((sum, s) => sum + Number(s.efficiency || 0), 0) / sleep.length
          ).toFixed(0)
        : '0';

    // Pain metrics (schema uses pain_level) :contentReference[oaicite:3]{index=3}
    const avgPain =
      pain.length > 0
        ? (pain.reduce((sum, p) => sum + Number(p.pain_level || 0), 0) / pain.length).toFixed(1)
        : '0.0';

    // Medication metrics
    const totalMeds = medications.length;
    const criticalMeds = medications.filter((m) => m.is_critical);

    const takenDoses = medLogs.filter((log) => log.status === 'taken').length;
    const missedDoses = medLogs.filter((log) => log.status === 'missed').length;
    const skippedDoses = medLogs.filter((log) => log.status === 'skipped').length;

    const medAdherence = medications.map((med) => {
      const medScheduledTimes = Array.isArray(med.times) ? med.times.length : 1;
      const expectedDoses = medScheduledTimes * periodDays;

      const medTaken = medLogs.filter(
        (log) => log.medication_id === med.id && log.status === 'taken'
      ).length;

      const adherenceRate = expectedDoses > 0 ? ((medTaken / expectedDoses) * 100).toFixed(0) : '0';

      return {
        ...med,
        expectedDoses,
        takenDoses: medTaken,
        adherenceRate,
      };
    });

    return {
      period: {
        start: new Date(startDate).toLocaleDateString(),
        end: new Date(endDate).toLocaleDateString(),
        days: periodDays,
      },
      sectionsUsed: { ...sections },
      privacy: { includeNotes },
      migraines: {
        count: migraineCount,
        avgSeverity: avgMigraineSeverity,
        migraineDays,
        frequency:
          migraineCount > 0 ? `${((migraineCount / periodDays) * 30).toFixed(1)} per month` : '0 per month',
        data: migraines,
      },
      glucose: {
        avgValue: avgGlucose,
        readingCount: glucoseReadings,
        timeInRange,
        highCount: highGlucose,
        lowCount: lowGlucose,
        inRangeCount: inRangeGlucose,
        data: glucose.slice(0, 20),
      },
      sleep: {
        avgHours: avgSleep,
        avgEfficiency,
        nightsTracked: sleep.length,
        data: sleep.slice(0, 10),
      },
      pain: {
        avgSeverity: avgPain,
        logCount: pain.length,
        data: pain.slice(0, 10),
      },
      medications: {
        totalMeds,
        criticalMeds,
        takenDoses,
        missedDoses,
        skippedDoses,
        adherence: medAdherence,
        hasMissedCritical: medAdherence.some(
          (m) => m.is_critical && Number(m.adherenceRate) < 90
        ),
      },
    };
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header - Hidden in print */}
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Reports</h1>
        <p className="text-gray-600">
          Generate a shareable health report — and include only what you want.
        </p>
      </div>

      {/* Report Configuration - Hidden in print */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 print:hidden">
        <h2 className="text-lg font-semibold mb-4">Report Settings</h2>

        {/* Share Filters */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Report Share Filters</h3>
          <p className="text-sm text-gray-600 mb-3">
            These control what gets pulled and what appears in the PDF/printout.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sections.migraines}
                onChange={() => toggleSection('migraines')}
              />
              <Activity className="w-4 h-4" />
              <span className="text-sm font-medium">Migraines</span>
            </label>

            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sections.glucose}
                onChange={() => toggleSection('glucose')}
              />
              <Droplet className="w-4 h-4" />
              <span className="text-sm font-medium">Glucose</span>
            </label>

            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sections.sleep}
                onChange={() => toggleSection('sleep')}
              />
              <Moon className="w-4 h-4" />
              <span className="text-sm font-medium">Sleep</span>
            </label>

            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sections.pain}
                onChange={() => toggleSection('pain')}
              />
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Pain</span>
            </label>

            <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sections.medications}
                onChange={() => toggleSection('medications')}
              />
              <Pill className="w-4 h-4" />
              <span className="text-sm font-medium">Medications</span>
            </label>
          </div>

          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeNotes}
                onChange={(e) => setIncludeNotes(e.target.checked)}
              />
              <span className="text-sm text-gray-700">
                Include notes / free-text fields (more detail, less privacy)
              </span>
            </label>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="60">Last 60 days</option>
              <option value="90">Last 90 days</option>
              <option value="custom">Custom date range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}
        </div>

        <button
          onClick={generateReport}
          disabled={generating || Object.values(sections).every((v) => !v)}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          <FileText className="w-5 h-5" />
          {generating ? 'Generating Report...' : 'Generate Report'}
        </button>

        {Object.values(sections).every((v) => !v) && (
          <p className="text-sm text-red-600 mt-2">
            Select at least one section to generate a report.
          </p>
        )}
      </div>

      {/* Generated Report */}
      {reportData && (
        <>
          {/* Action Buttons - Hidden in print */}
          <div className="flex gap-3 mb-6 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Save as PDF
            </button>
          </div>

          {/* Printable Report */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 print:border-0 print:p-0">
            {/* Report Header */}
            <div className="mb-8 pb-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Sentrya Health Report</h1>
                  <p className="text-gray-600">Patient: {user?.email}</p>
                  <p className="text-gray-600">
                    Report Period: {reportData.period.start} - {reportData.period.end} ({reportData.period.days} days)
                  </p>
                  <p className="text-sm text-gray-500">Generated: {new Date().toLocaleString()}</p>
                  <p className="text-sm text-gray-500">
                    Notes included: {reportData.privacy.includeNotes ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">Sentrya Whole Health</div>
                    <div>Bluedobie Developing LLC</div>
                    <div>sentrya.com</div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <strong>For Healthcare Provider Review:</strong> This report contains patient-generated tracking data.
                  Please review in context of clinical findings and patient history.
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sections.migraines && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      <div className="text-sm font-medium text-gray-700">Migraines</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reportData.migraines.count}</div>
                    <div className="text-xs text-gray-600">{reportData.migraines.migraineDays} days affected</div>
                  </div>
                )}

                {sections.glucose && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className="w-5 h-5 text-blue-600" />
                      <div className="text-sm font-medium text-gray-700">Avg Glucose</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.glucose.avgValue} <span className="text-lg">mg/dL</span>
                    </div>
                    <div className="text-xs text-gray-600">{reportData.glucose.timeInRange}% in range</div>
                  </div>
                )}

                {sections.sleep && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Moon className="w-5 h-5 text-purple-600" />
                      <div className="text-sm font-medium text-gray-700">Avg Sleep</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.sleep.avgHours} <span className="text-lg">hrs</span>
                    </div>
                    <div className="text-xs text-gray-600">{reportData.sleep.avgEfficiency}% efficiency</div>
                  </div>
                )}

                {sections.pain && (
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-orange-600" />
                      <div className="text-sm font-medium text-gray-700">Avg Pain</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.pain.avgSeverity} <span className="text-lg">/10</span>
                    </div>
                    <div className="text-xs text-gray-600">{reportData.pain.logCount} logs</div>
                  </div>
                )}
              </div>
            </div>

            {/* Migraine Details */}
            {sections.migraines && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-red-600" />
                  Migraine Episodes
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Episodes</div>
                    <div className="text-2xl font-bold">{reportData.migraines.count}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Average Severity</div>
                    <div className="text-2xl font-bold">{reportData.migraines.avgSeverity} / 10</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Days with Migraines</div>
                    <div className="text-2xl font-bold">{reportData.migraines.migraineDays}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Monthly Frequency</div>
                    <div className="text-lg font-bold">{reportData.migraines.frequency}</div>
                  </div>
                </div>

                {reportData.migraines.data.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Date/Time</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Severity</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Symptoms</th>
                          {includeNotes && (
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportData.migraines.data.slice(0, 10).map((migraine, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{new Date(migraine.started_at).toLocaleString()}</td>
                            <td className="px-4 py-3">{migraine.pain ?? 'N/A'} / 10</td>
                            <td className="px-4 py-3 text-gray-600">{migraine.symptoms || '-'}</td>
                            {includeNotes && (
                              <td className="px-4 py-3 text-gray-600">
                                {(migraine.notes || '-').toString().slice(0, 80)}
                                {(migraine.notes || '').toString().length > 80 ? '…' : ''}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Glucose Details */}
            {sections.glucose && reportData.glucose.readingCount > 0 && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Droplet className="w-6 h-6 text-blue-600" />
                  Glucose Metrics
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Average</div>
                    <div className="text-2xl font-bold">{reportData.glucose.avgValue} mg/dL</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Time in Range</div>
                    <div className="text-2xl font-bold text-green-700">{reportData.glucose.timeInRange}%</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">High Readings</div>
                    <div className="text-2xl font-bold text-red-700">{reportData.glucose.highCount}</div>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Low Readings</div>
                    <div className="text-2xl font-bold text-orange-700">{reportData.glucose.lowCount}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date/Time</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Value (mg/dL)</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Trend</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.glucose.data.map((reading, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(reading.device_time).toLocaleString()}</td>
                          <td className="px-4 py-3">{reading.value_mgdl}</td>
                          <td className="px-4 py-3 text-gray-600">{reading.trend || '-'}</td>
                          <td className="px-4 py-3">{reading.source || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sleep Details */}
            {sections.sleep && reportData.sleep.nightsTracked > 0 && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Moon className="w-6 h-6 text-purple-600" />
                  Sleep Metrics
                </h2>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Nights Tracked</div>
                    <div className="text-2xl font-bold">{reportData.sleep.nightsTracked}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Avg Hours</div>
                    <div className="text-2xl font-bold">{reportData.sleep.avgHours}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Avg Efficiency</div>
                    <div className="text-2xl font-bold">{reportData.sleep.avgEfficiency}%</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Duration</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Efficiency</th>
                        {includeNotes && (
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.sleep.data.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(s.start_time).toLocaleDateString()}</td>
                          <td className="px-4 py-3 font-medium">{s.total_sleep_hours} hours</td>
                          <td className="px-4 py-3">{s.efficiency ? `${s.efficiency}%` : '-'}</td>
                          {includeNotes && (
                            <td className="px-4 py-3 text-gray-600">
                              {(s.notes || '-').toString().slice(0, 80)}
                              {(s.notes || '').toString().length > 80 ? '…' : ''}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pain Details */}
            {sections.pain && reportData.pain.logCount > 0 && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-orange-600" />
                  Pain Logs
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Logs</div>
                    <div className="text-2xl font-bold">{reportData.pain.logCount}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Average Pain Level</div>
                    <div className="text-2xl font-bold">{reportData.pain.avgSeverity} / 10</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date/Time</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Level</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Type</th>
                        {includeNotes && (
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.pain.data.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">{new Date(p.logged_at).toLocaleString()}</td>
                          <td className="px-4 py-3">{p.pain_location || '-'}</td>
                          <td className="px-4 py-3">{p.pain_level ?? '-'} / 10</td>
                          <td className="px-4 py-3 text-gray-600">
                            {Array.isArray(p.pain_type) ? p.pain_type.join(', ') : '-'}
                          </td>
                          {includeNotes && (
                            <td className="px-4 py-3 text-gray-600">
                              {(p.notes || '-').toString().slice(0, 80)}
                              {(p.notes || '').toString().length > 80 ? '…' : ''}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Medication Adherence */}
            {sections.medications && reportData.medications.totalMeds > 0 && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Pill className="w-6 h-6 text-indigo-600" />
                  Medication Adherence
                </h2>

                {reportData.medications.hasMissedCritical && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <strong>Provider Note:</strong> Patient has &lt;90% adherence on one or more critical medications.
                      Please discuss medication management and barriers to adherence.
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Medication</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Dosage</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Schedule</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Purpose</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Adherence</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Flags</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.medications.adherence.map((med, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 ${
                            med.is_critical && Number(med.adherenceRate) < 90 ? 'bg-red-50' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{med.name}</div>
                            {med.prescriber && <div className="text-xs text-gray-500">Rx: {med.prescriber}</div>}
                          </td>
                          <td className="px-4 py-3">{med.dosage || '-'}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {Array.isArray(med.times) ? med.times.join(', ') : 'As needed'}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{med.purpose || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium">{med.adherenceRate}%</div>
                            <div className="text-xs text-gray-500">
                              {med.takenDoses}/{med.expectedDoses} doses
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {med.is_critical && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <AlertCircle className="w-3 h-3" />
                                Critical
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Medications</div>
                    <div className="text-2xl font-bold">{reportData.medications.totalMeds}</div>
                    <div className="text-xs text-gray-500">{reportData.medications.criticalMeds.length} critical</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Doses Taken</div>
                    <div className="text-2xl font-bold">{reportData.medications.takenDoses}</div>
                    <div className="text-xs text-gray-500">
                      {reportData.medications.missedDoses} missed, {reportData.medications.skippedDoses} skipped
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Overall Adherence</div>
                    <div className="text-2xl font-bold">
                      {reportData.medications.adherence.length > 0
                        ? (
                            reportData.medications.adherence.reduce(
                              (sum, m) => sum + Number(m.adherenceRate || 0),
                              0
                            ) / reportData.medications.adherence.length
                          ).toFixed(0)
                        : 0}
                      %
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Data Source:</strong> Patient self-reported via Sentrya Whole Health platform
              </p>
              <p className="mb-2">
                <strong>Disclaimer:</strong> This report contains patient-generated data and should be reviewed in
                conjunction with clinical assessments. Data accuracy depends on consistent patient logging.
              </p>
              <p>For questions about this report, contact: support@sentrya.com</p>
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {!reportData && !generating && (
        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-600 mb-4">
            Select a time period and what you want to include, then click “Generate Report”.
          </p>
        </div>
      )}
    </div>
  );
}
