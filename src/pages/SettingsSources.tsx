// src/pages/SettingsSources.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type RefItem = {
  id?: string;
  title: string;
  url: string;
  note?: string | null;
  category?: string | null;   // e.g., "Guidelines", "Clinician-reviewed", "Patient education"
  source?: string | null;     // e.g., ICHD-3, AMF, AHS, Mayo, Cleveland Clinic
  reviewed_by?: string | null;
  reviewed_on?: string | null; // ISO date
  sort_index?: number | null;
};

const FALLBACK: RefItem[] = [
  { title: "ICHD-3: International Classification of Headache Disorders", url: "https://ichd-3.org/", note: "Official diagnostic criteria", category: "Guidelines", source: "ICHD-3", sort_index: 10 },
  { title: "ICHD-3 — Migraine without aura", url: "https://ichd-3.org/1-migraine/1-1-migraine-without-aura/", category: "Guidelines", source: "ICHD-3", sort_index: 11 },
  { title: "ICHD-3 — Chronic migraine", url: "https://ichd-3.org/1-migraine/1-3-chronic-migraine/", category: "Guidelines", source: "ICHD-3", sort_index: 12 },
  { title: "ICHD-3 — Migraine with brainstem aura", url: "https://ichd-3.org/1-migraine/1-2-migraine-with-aura/1-2-2-migraine-with-brainstem-aura/", category: "Guidelines", source: "ICHD-3", sort_index: 13 },
  { title: "American Migraine Foundation — Resource Library", url: "https://americanmigrainefoundation.org/resources/", category: "Patient education", source: "AMF", sort_index: 20 },
  { title: "American Migraine Foundation — Vestibular Migraine", url: "https://americanmigrainefoundation.org/resource-library/vestibular-migraine/", category: "Patient education", source: "AMF", sort_index: 21 },
  { title: "American Headache Society — Diagnosing Migraine", url: "https://americanheadachesociety.org/resources/primary-care/diagnosing-migraine", category: "Clinician-reviewed", source: "AHS", sort_index: 30 },
  { title: "Mayo Clinic — Migraine: Symptoms & causes", url: "https://www.mayoclinic.org/diseases-conditions/migraine-headache/symptoms-causes/syc-20360201", category: "Clinician-reviewed", source: "Mayo Clinic", sort_index: 40 },
  { title: "Cleveland Clinic — Hemiplegic Migraine", url: "https://my.clevelandclinic.org/health/diseases/hemiplegic-migraine", category: "Clinician-reviewed", source: "Cleveland Clinic", sort_index: 50 },
  { title: "Cleveland Clinic — Vestibular Migraine", url: "https://my.clevelandclinic.org/health/diseases/25217-vestibular-migraine", category: "Clinician-reviewed", source: "Cleveland Clinic", sort_index: 51 },
  { title: "Johns Hopkins Medicine — Vestibular Migraine", url: "https://www.hopkinsmedicine.org/health/conditions-and-diseases/vestibular-migraine", category: "Clinician-reviewed", source: "Johns Hopkins", sort_index: 60 },
];

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-block rounded-full border px-2 py-0.5 text-xs text-gray-700">{children}</span>;
}

export default function SettingsSources() {
  const [items, setItems] = useState<RefItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("education_refs")
        .select("*")
        .order("sort_index", { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn("education_refs fetch error:", error.message);
        setError(error.message);
        setItems(FALLBACK);
      } else if (!data || data.length === 0) {
        setItems(FALLBACK);
      } else {
        setItems(data as RefItem[]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(items.map(i => i.category).filter(Boolean) as string[]))], [items]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter(i => {
      const inCat = cat === "All" || (i.category || "") === cat;
      const text = [i.title, i.url, i.note, i.category, i.source, i.reviewed_by].join(" ").toLowerCase();
      const inQ = !query || text.includes(query);
      return inCat && inQ;
    });
  }, [items, q, cat]);

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="text-2xl font-bold">Sources &amp; Citations</h1>
      <p className="text-sm text-gray-600 mt-1">
        Clinician-reviewed and official references for the Sentinel Health Education Hub.
      </p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          <select
            value={cat}
            onChange={e => setCat(e.target.value)}
            className="border rounded p-2 text-sm"
            aria-label="Filter by category"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => window.print()}
            className="rounded border px-3 py-2 text-sm hover:bg-gray-50"
          >
            Print
          </button>
        </div>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full md:w-72 border rounded p-2 text-sm"
          placeholder="Search titles, notes, sources…"
          type="search"
        />
      </div>

      {error && (
        <div className="mt-3 rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900">
          Couldn’t load from Supabase. Showing built-in references.
        </div>
      )}

      <ul className="mt-4 space-y-3">
        {filtered.map((r, i) => (
          <li key={`${r.id ?? "local"}-${i}`} className="rounded border p-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div>
                <a className="text-base font-semibold underline" href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
                {r.note && <p className="text-sm text-gray-700 mt-1">{r.note}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  {r.category && <Pill>{r.category}</Pill>}
                  {r.source && <Pill>{r.source}</Pill>}
                  {r.reviewed_by && <Pill>Reviewed by: {r.reviewed_by}</Pill>}
                  {r.reviewed_on && <Pill>Reviewed on: {new Date(r.reviewed_on).toLocaleDateString()}</Pill>}
                </div>
              </div>
              <div className="shrink-0">
                <a className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50 inline-block" href={r.url} target="_blank" rel="noopener noreferrer">
                  Open
                </a>
              </div>
            </div>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-gray-600">No references match your filters.</li>
        )}
      </ul>

      <div className="mt-6 text-xs text-gray-500">
        These sources inform symptom descriptions and look-alike conditions in the Education Hub. This page is for transparency and is not medical advice.
      </div>
    </div>
  );
}