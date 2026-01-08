// src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  AlertCircle,
  Activity,
  Droplet,
  Moon,
  Heart,
  Pill
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Reports() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [dateRange, setDateRange] = useState('30'); // days
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // ✅ Share controls (allowlist)
  const [include, setInclude] = useState({
    migraines: true,
    glucose: true,
    sleep: true,
    pain: true,
    medications: true,
  });

  // ✅ Privacy controls (sensitive fields)
  const [privacy, setPrivacy] = useState({
    includeNotes: false,     // default OFF
    includeSymptoms: true,   // optional
  });

  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  }

  function toggleInclude(key) {
    setInclude(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function togglePrivacy(key) {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function resolveDateRange() {
    const endDate = (customEndDate || new Date().toISOString().split('T')[0]);

    let startDate;
    if (dateRange === 'custom' && customStartDate) {
      startDate = customStartDate;
    } else {
      const days = parseInt(dateRange, 10);
      const start = new Date();
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split('T')[0];
    }

    return { startDate, endDate };
  }

  async function generateReport() {
    if (!user) return;

    setGenerating(true);
    try {
      const { startDate, endDate } = resolveDateRange();

      // Build SAFE select lists (no *), and only include notes if explicitly allowed
      const migraineSelect = (() => {
        const base = ['id', 'user_id', 'started_at', 'pain'];
        if (privacy.includeSymptoms) base.push('symptoms');
        if (privacy.includeNotes) base.push('notes');
        return base.join(',');
      })();

      const sleepSelect = (() => {
        const base = ['id', 'user_id', 'start_time', 'total_sleep_hours', 'efficiency'];
        if (privacy.includeNotes) base.push('notes');
        return base.join(',');
      })();

      const painSelect = (() => {
        const base = ['id', 'user_id', 'logged_at', 'severity', 'location'];
        if (privacy.includeNotes) base.push('notes');
        return base.join(',');
      })();

      const jobs = [];

      if (include.migraines) {
        jobs.push(
          supabase
            .from('migraine_episodes')
            .select(migraineSelect)
            .eq('user_id', user.id)
            .gte('started_at', startDate)
            .lte('started_at', endDate)
            .order('started_at', { ascending: false })
            .then(r => ({ key: 'migraines', ...r }))
        );
      }

      if (include.glucose) {
        jobs.push(
          supabase
            .from('glucose_readings')
            .select('id,user_id,device_time,value_mgdl,trend,source')
            .eq('user_id', user.id)
            .gte('device_time', startDate)
            .lte('device_time', endDate)
            .order('device_time', { ascending: false })
            .then(r => ({ key: 'glucose', ...r }))
        );
      }

      if (include.sleep) {
        jobs.push(
          supabase
            .from('sleep_data')
            .select(sleepSelect)
            .eq('user_id', user.id)
            .gte('start_time', startDate)
            .lte('start_time', endDate)
            .order('start_time', { ascending: false })
            .then(r => ({ key: 'sleep', ...r }))
        );
      }

      if (include.pain) {
        jobs.push(
          supabase
            .from('pain_logs')
            .select(painSelect)
            .eq('user_id', user.id)
            .gte('logged_at', startDate)
            .lte('logged_at', endDate)
            .order('logged_at', { ascending: false })
            .then(r => ({ key: 'pain', ...r }))
        );
      }

      if (include.medications) {
        jobs.push(
          supabase
            .from('medications')
            .select('id,user_id,name,dosage,times,purpose,prescriber,is_critical,is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('name')
            .then(r => ({ key: 'medications', ...r }))
        );

        jobs.push(
          supabase
            .from('medication_logs')
            .select('id,user_id,medication_id,taken_at,status')
            .eq('user_id', user.id)
            .gte('taken_at', startDate)
            .lte('taken_at', endDate)
            .order('taken_at', { ascending: false })
            .then(r => ({ key: 'medLogs', ...r }))
        );
      }

      const results = await Promise.all(jobs);

      const data = {
        startDate,
        endDate,
        migraines: [],
        glucose: [],
        sleep: [],
        pain: [],
        medications: [],
        medLogs: [],
      };

      for (const res of results) {
        if (res.error) throw res.error;
        data[res.key] = res.data || [];
      }

      setReportData(calculateMetrics(data));
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function calculateMetrics(data) {
    const {
      migraines = [],
      glucose = [],
      sleep = [],
      pain = [],
      medications = [],
      medLogs = [],
      startDate,
      endDate
    } = data;

    const periodDaysRaw = Math.ceil(
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
    );
    const periodDays = Math.max(1, periodDaysRaw);

    // Migraine metrics
    const migraineCount = migraines.length;
    const avgMigraineSeverity = migraines.length > 0
      ? (migraines.reduce((sum, m) => sum + (m.pain || 0), 0) / migraines.length).toFixed(1)
      : 0;

    const migrainesByDay = {};
    migraines.forEach(m => {
      const day = new Date(m.started_at).toLocaleDateString();
      migrainesByDay[day] = (migrainesByDay[day] || 0) + 1;
    });
    const migraineDays = Object.keys(migrainesByDay).length;

    // Glucose metrics
    const glucoseReadings = glucose.length;
    const avgGlucose = glucose.length > 0
      ? (glucose.reduce((sum, g) => sum + parseFloat(g.value_mgdl), 0) / glucose.length).toFixed(0)
      : 0;

    const highGlucose = glucose.filter(g => parseFloat(g.value_mgdl) > 180).length;
    const lowGlucose = glucose.filter(g => parseFloat(g.value_mgdl) < 70).length;
    const inRangeGlucose = glucose.length - highGlucose - lowGlucose;

    const timeInRange = glucose.length > 0
      ? ((inRangeGlucose / glucose.length) * 100).toFixed(1)
      : 0;

    // Sleep metrics
    const avgSleep = sleep.length > 0
      ? (sleep.reduce((sum, s) => sum + parseFloat(s.total_sleep_hours), 0) / sleep.length).toFixed(1)
      : 0;

    const avgEfficiency = sleep.length > 0
      ? (sleep.reduce((sum, s) => sum + (parseFloat(s.efficiency) || 0), 0) / sleep.length).toFixed(0)
      : 0;

    // Pain metrics
    const avgPain = pain.length > 0
      ? (pain.reduce((sum, p) => sum + (p.severity || 0), 0) / pain.length).toFixed(1)
      : 0;

    // Medication metrics
    const totalMeds = medications.length;
    const criticalMeds = medications.filter(m => m.is_critical);
    const takenDoses = medLogs.filter(log => log.status === 'taken').length;
    const missedDoses = medLogs.filter(log => log.status === 'missed').length;
    const skippedDoses = medLogs.filter(log => log.status === 'skipped').length;

    const medAdherence = medications.map(med => {
      const medScheduledTimes = Array.isArray(med.times) ? med.times.length : 1;
      const expectedDoses = medScheduledTimes * periodDays;

      const medTaken = medLogs.filter(log =>
        log.medication_id === med.id && log.status === 'taken'
      ).length;

      const adherenceRate = expectedDoses > 0
        ? ((medTaken / expectedDoses) * 100).toFixed(0)
        : 0;

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
      migraines: {
        count: migraineCount,
        avgSeverity: avgMigraineSeverity,
        migraineDays,
        frequency: migraineCount > 0
          ? `${(migraineCount / periodDays * 30).toFixed(1)} per month`
          : '0 per month',
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
        hasMissedCritical: medAdherence.some(m => m.is_critical && parseFloat(m.adherenceRate) < 90),
      },
    };
  }

  function handlePrint() {
    window.print();
  }

  function handleDownloadPDF() {
    window.print();
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const includedLabels = [
    include.migraines ? 'Migraines' : null,
    include.glucose ? 'Glucose' : null,
    include.sleep ? 'Sleep' : null,
    include.pain ? 'Pain' : null,
    include.medications ? 'Medications' : null,
  ].filter(Boolean);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header - Hidden in print */}
      <div className="mb-8 print:hidden">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Reports</h1>
        <p className="text-gray-600">
          Generate curated health reports to share with your healthcare provider
        </p>
      </div>

      {/* Report Configuration - Hidden in print */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 print:hidden">
        <h2 className="text-lg font-semibold mb-4">Report Settings</h2>

        {/* Time period */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
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

        {/* Include / Privacy controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-3">Include in report</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={include.migraines} onChange={() => toggleInclude('migraines')} />
                Migraine episodes
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={include.glucose} onChange={() => toggleInclude('glucose')} />
                Glucose readings
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={include.sleep} onChange={() => toggleInclude('sleep')} />
                Sleep data
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={include.pain} onChange={() => toggleInclude('pain')} />
                Pain logs
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={include.medications} onChange={() => toggleInclude('medications')} />
                Medications & adherence
              </label>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-medium text-gray-900 mb-3">Privacy controls</div>
            <div className="space-y-3">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={privacy.includeNotes}
                  onChange={() => togglePrivacy('includeNotes')}
                  className="mt-0.5"
                />
                <span>
                  Include free-text notes
                  <div className="text-xs text-gray-500">
                    Off by default (recommended). Notes often contain sensitive details.
                  </div>
                </span>
              </label>

              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={privacy.includeSymptoms}
                  onChange={() => togglePrivacy('includeSymptoms')}
                  className="mt-0.5"
                />
                <span>
                  Include symptoms fields (when available)
                  <div className="text-xs text-gray-500">
                    If unchecked, symptom lists are excluded from the report.
                  </div>
                </span>
              </label>

              <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                Report pulls only the selected categories and only the allowed fields (no wildcard selects).
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={generateReport}
          disabled={generating || includedLabels.length === 0}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
        >
          <FileText className="w-5 h-5" />
          {includedLabels.length === 0 ? 'Select at least one category' : (generating ? 'Generating Report...' : 'Generate Report')}
        </button>
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
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Sentrya Health Report
                  </h1>
                  <p className="text-gray-600">
                    Patient: {user?.email}
                  </p>
                  <p className="text-gray-600">
                    Report Period: {reportData.period.start} - {reportData.period.end}
                  </p>
                  <p className="text-sm text-gray-500">
                    Included: {includedLabels.join(', ') || 'None'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Notes: {privacy.includeNotes ? 'Included' : 'Excluded'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Generated: {new Date().toLocaleString()}
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
                  <strong>For Healthcare Provider Review:</strong> This report contains patient-generated health data.
                  Please review in context of clinical findings and patient history.
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Executive Summary</h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {include.migraines && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-5 h-5 text-red-600" />
                      <div className="text-sm font-medium text-gray-700">Migraines</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{reportData.migraines.count}</div>
                    <div className="text-xs text-gray-600">{reportData.migraines.migraineDays} days affected</div>
                  </div>
                )}

                {include.glucose && (
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

                {include.sleep && (
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

                {include.pain && (
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
            {include.migraines && (
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
                          {privacy.includeSymptoms && (
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Symptoms</th>
                          )}
                          {privacy.includeNotes && (
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reportData.migraines.data.slice(0, 10).map((migraine, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {new Date(migraine.started_at).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                migraine.pain >= 7 ? 'bg-red-100 text-red-800' :
                                migraine.pain >= 4 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {migraine.pain || 'N/A'} / 10
                              </span>
                            </td>
                            {privacy.includeSymptoms && (
                              <td className="px-4 py-3 text-gray-600">
                                {migraine.symptoms || '-'}
                              </td>
                            )}
                            {privacy.includeNotes && (
                              <td className="px-4 py-3 text-gray-600">
                                {migraine.notes?.substring(0, 50) || '-'}
                                {migraine.notes?.length > 50 && '...'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reportData.migraines.data.length === 0 && (
                  <div className="text-sm text-gray-500">No migraine episodes logged in this period.</div>
                )}
              </div>
            )}

            {/* Glucose Details */}
            {include.glucose && reportData.glucose.readingCount > 0 && (
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
                          <td className="px-4 py-3">
                            {new Date(reading.device_time).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${
                              reading.value_mgdl > 180 ? 'text-red-600' :
                              reading.value_mgdl < 70 ? 'text-orange-600' :
                              'text-green-600'
                            }`}>
                              {reading.value_mgdl}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {reading.trend || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                              {reading.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {include.glucose && reportData.glucose.readingCount === 0 && (
              <div className="mb-8 text-sm text-gray-500">No glucose readings logged in this period.</div>
            )}

            {/* Sleep Details */}
            {include.sleep && reportData.sleep.nightsTracked > 0 && (
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
                        {privacy.includeNotes && (
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.sleep.data.map((s, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(s.start_time).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {s.total_sleep_hours} hours
                          </td>
                          <td className="px-4 py-3">
                            {s.efficiency ? `${s.efficiency}%` : '-'}
                          </td>
                          {privacy.includeNotes && (
                            <td className="px-4 py-3 text-gray-600">
                              {s.notes?.substring(0, 30) || '-'}
                              {s.notes?.length > 30 && '...'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {include.sleep && reportData.sleep.nightsTracked === 0 && (
              <div className="mb-8 text-sm text-gray-500">No sleep data logged in this period.</div>
            )}

            {/* Pain Details (simple table, since you already fetch it) */}
            {include.pain && reportData.pain.logCount > 0 && (
              <div className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-orange-600" />
                  Pain Logs
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Average Severity</div>
                    <div className="text-2xl font-bold">{reportData.pain.avgSeverity} / 10</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Logs</div>
                    <div className="text-2xl font-bold">{reportData.pain.logCount}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Date/Time</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Severity</th>
                        <th className="px-4 py-2 text-left font-medium text-gray-700">Location</th>
                        {privacy.includeNotes && (
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Notes</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData.pain.data.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            {new Date(p.logged_at).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {p.severity ?? '-'} / 10
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {p.location || '-'}
                          </td>
                          {privacy.includeNotes && (
                            <td className="px-4 py-3 text-gray-600">
                              {p.notes?.substring(0, 40) || '-'}
                              {p.notes?.length > 40 && '...'}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {include.pain && reportData.pain.logCount === 0 && (
              <div className="mb-8 text-sm text-gray-500">No pain logs in this period.</div>
            )}

            {/* Medication Adherence */}
            {include.medications && reportData.medications.totalMeds > 0 && (
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

                {reportData.medications.hasMissedCritical || reportData.medications.adherence.some(m => parseFloat(m.adherenceRate) < 80) ? (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-3">Current Medications (Full List)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Medication</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Dosage</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Schedule</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Purpose</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Adherence</th>
                            <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {reportData.medications.adherence.map((med, idx) => (
                            <tr key={idx} className={`hover:bg-gray-50 ${
                              med.is_critical && parseFloat(med.adherenceRate) < 90 ? 'bg-red-50' : ''
                            }`}>
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">{med.name}</div>
                                {med.prescriber && (
                                  <div className="text-xs text-gray-500">Rx: {med.prescriber}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">{med.dosage}</td>
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
                                <div className="flex flex-col gap-1">
                                  {med.is_critical && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                      <AlertCircle className="w-3 h-3" />
                                      Critical
                                    </span>
                                  )}
                                  {parseFloat(med.adherenceRate) >= 90 && (
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 w-fit">
                                      Good
                                    </span>
                                  )}
                                  {parseFloat(med.adherenceRate) < 90 && parseFloat(med.adherenceRate) >= 70 && (
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 w-fit">
                                      Fair
                                    </span>
                                  )}
                                  {parseFloat(med.adherenceRate) < 70 && (
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 w-fit">
                                      Poor
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Pill className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <strong>Good Adherence:</strong> Patient is maintaining good adherence across all medications.
                        Current medication list: {reportData.medications.adherence.map(m => m.name).join(', ')}.
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600">Total Medications</div>
                    <div className="text-2xl font-bold">{reportData.medications.totalMeds}</div>
                    <div className="text-xs text-gray-500">
                      {reportData.medications.criticalMeds.length} critical
                    </div>
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
                        ? (reportData.medications.adherence.reduce((sum, m) => sum + parseFloat(m.adherenceRate), 0) / reportData.medications.adherence.length).toFixed(0)
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {include.medications && reportData.medications.totalMeds === 0 && (
              <div className="mb-8 text-sm text-gray-500">No active medications found for this patient.</div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-600">
              <p className="mb-2">
                <strong>Data Source:</strong> Patient self-reported via Sentrya Whole Health platform
              </p>
              <p className="mb-2">
                <strong>Disclaimer:</strong> This report contains patient-generated health data and should be reviewed
                in conjunction with clinical assessments. Data accuracy depends on consistent patient logging.
              </p>
              <p>
                For questions about this report, contact: support@sentrya.com
              </p>
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
            Select what you want to include and click "Generate Report" to create a curated health summary
          </p>
        </div>
      )}
    </div>
  );
}
