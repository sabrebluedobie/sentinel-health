// src/components/Education.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ============================ Types ============================ */
type Topic = {
  id: string;
  title: string;
  short: string;
  badge_text?: string | null;
  badge_color?: string | null; // Tailwind classes, e.g. "bg-yellow-100 text-yellow-800"
  symptoms?: string[];
  notes?: string[];
  lookalikes?: string[];
  sort_index?: number;
};

type Reference = { title: string; url: string; note?: string };

/* =================== Sources (clinician-reviewed) =================== */
const REFERENCES: Reference[] = [
  { title: "ICHD-3: International Classification of Headache Disorders", url: "https://ichd-3.org/", note: "Official diagnostic criteria" },
  { title: "ICHD-3 — Migraine without aura", url: "https://ichd-3.org/1-migraine/1-1-migraine-without-aura/" },
  { title: "ICHD-3 — Chronic migraine", url: "https://ichd-3.org/1-migraine/1-3-chronic-migraine/" },
  { title: "ICHD-3 — Migraine with brainstem aura", url: "https://ichd-3.org/1-migraine/1-2-migraine-with-aura/1-2-2-migraine-with-brainstem-aura/" },
  { title: "American Migraine Foundation — Resource Library", url: "https://americanmigrainefoundation.org/resources/" },
  { title: "American Migraine Foundation — Vestibular Migraine", url: "https://americanmigrainefoundation.org/resource-library/vestibular-migraine/" },
  { title: "American Headache Society — Diagnosing Migraine", url: "https://americanheadachesociety.org/resources/primary-care/diagnosing-migraine" },
  { title: "Mayo Clinic — Migraine: Symptoms & causes", url: "https://www.mayoclinic.org/diseases-conditions/migraine-headache/symptoms-causes/syc-20360201" },
  { title: "Cleveland Clinic — Hemiplegic Migraine", url: "https://my.clevelandclinic.org/health/diseases/hemiplegic-migraine" },
  { title: "Cleveland Clinic — Vestibular Migraine", url: "https://my.clevelandclinic.org/health/diseases/25217-vestibular-migraine" },
  { title: "Johns Hopkins Medicine — Vestibular Migraine", url: "https://www.hopkinsmedicine.org/health/conditions-and-diseases/vestibular-migraine" },
];

/* =================== Local Fallback (works offline) =================== */
/* If Supabase is unavailable, we’ll show these. You can trim if desired. */
const FALLBACK_TOPICS: Topic[] = [
  {
    id: "without-aura",
    title: "Migraine without Aura",
    short: "The most common type; no preceding aura.",
    badge_text: "Most common",
    badge_color: "bg-green-100 text-green-800",
    symptoms: [
      "Moderate to severe throbbing/pulsing pain (often one-sided)",
      "Worsened by routine activity",
      "Nausea and/or vomiting",
      "Sensitivity to light (photophobia) and sound (phonophobia)"
    ],
    notes: ["Attacks often last 4–72 hours without treatment."],
    lookalikes: ["Tension-type headache", "Cluster headache", "Sinus headache"],
    sort_index: 10
  },
  {
    id: "with-aura",
    title: "Migraine with Aura",
    short: "Neurologic symptoms (visual, sensory, speech) that precede or accompany headache.",
    symptoms: [
      "Visual: flashing lights, zigzag lines, blind spots (scotomas)",
      "Sensory: numbness or pins-and-needles that spread over minutes",
      "Speech/language difficulty (dysphasia)",
      "Headache usually follows within 60 minutes, or starts during aura"
    ],
    notes: [
      "Not all aura is visual; sensory and speech auras are common.",
      "If aura is new, prolonged, or atypical, seek medical care."
    ],
    lookalikes: ["Transient ischemic attack (TIA)", "Seizure (occipital)", "Retinal detachment (if visual aura atypical)"],
    sort_index: 20
  },
  {
    id: "silent-acephalgic",
    title: "Silent Migraine (Acephalgic)",
    short: "Aura-like symptoms occur without the headache phase.",
    badge_text: "Headache optional",
    badge_color: "bg-yellow-100 text-yellow-800",
    symptoms: [
      "Visual changes (zigzags, shimmering, blind spots)",
      "Dizziness or vertigo, confusion, or speech difficulty",
      "Sensory symptoms like tingling or numbness",
      "Nausea and/or vomiting",
      "Little to no head pain"
    ],
    notes: [
      "Often mistaken for anxiety or TIA; pattern recognition is key.",
      "New or stroke-like symptoms require urgent evaluation."
    ],
    lookalikes: ["Transient ischemic attack (TIA)", "Anxiety/panic attack", "Seizure"],
    sort_index: 30
  },
  {
    id: "hemiplegic",
    title: "Hemiplegic Migraine",
    short: "Temporary one-sided weakness with aura.",
    badge_text: "Stroke mimic — urgent care",
    badge_color: "bg-red-100 text-red-800",
    symptoms: [
      "Weakness or paralysis on one side of the body",
      "Numbness, visual aura, speech difficulty",
      "Headache may follow neurologic symptoms"
    ],
    notes: [
      "Can mimic stroke — urgent evaluation is important, especially for a first episode.",
      "Familial and sporadic forms exist; treatment may differ."
    ],
    lookalikes: ["Stroke", "Multiple sclerosis", "TIA"],
    sort_index: 40
  },
  {
    id: "vestibular",
    title: "Vestibular Migraine",
    short: "Prominent dizziness/vertigo and balance issues; headache may be absent.",
    badge_text: "Headache optional",
    badge_color: "bg-yellow-100 text-yellow-800",
    symptoms: [
      "Spinning vertigo or rocking/swaying imbalance",
      "Motion sensitivity, visual dependence",
      "Nausea (± vomiting)",
      "Light/sound sensitivity with or without head pain"
    ],
    notes: ["Attacks range from minutes to hours; often triggered by visual motion or stress."],
    lookalikes: ["Motion sickness", "Benign paroxysmal positional vertigo (BPPV)", "Ménière’s disease", "Anxiety/panic attacks"],
    sort_index: 50
  },
  {
    id: "retinal",
    title: "Retinal Migraine",
    short: "Repeated, reversible vision loss in one eye only.",
    badge_text: "Headache optional",
    badge_color: "bg-yellow-100 text-yellow-800",
    symptoms: [
      "Transient monocular vision loss or blind spot in a single eye",
      "May include eye pain or ipsilateral headache",
      "Episodes are brief (usually <60 minutes) and recurring"
    ],
    notes: [
      "Other eye conditions can look similar — medical evaluation is recommended.",
      "Track which eye is affected; cover each eye to test."
    ],
    lookalikes: ["Amaurosis fugax (ocular TIA)", "Retinal detachment", "Optic neuritis"],
    sort_index: 60
  },
  {
    id: "chronic",
    title: "Chronic Migraine",
    short: "≥15 headache days/month for 3+ months, with ≥8 migraine-like days.",
    symptoms: [
      "Frequent headaches with migraine features (throbbing, light/sound sensitivity, nausea)",
      "Neck pain, fatigue, cognitive fog are common",
      "Medication overuse can maintain frequency"
    ],
    notes: [
      "Preventive strategies are central (sleep, triggers, lifestyle, meds/devices).",
      "Work with a clinician on a personalized prevention plan."
    ],
    lookalikes: ["Tension-type headache", "Medication overuse headache", "Fibromyalgia (chronic pain overlap)"],
    sort_index: 70
  },
  {
    id: "menstrual",
    title: "Menstrual-Related Migraine",
    short: "Attacks tied to hormonal fluctuations around menses.",
    symptoms: [
      "Attacks often occur from two days before to three days after menses onset",
      "Similar features to migraine without aura",
      "May be more severe or treatment-resistant"
    ],
    notes: ["Logging cycle patterns helps time acute or mini-preventive options."],
    lookalikes: ["Primary dysmenorrhea", "Hormonal headache (non-migraine)", "Tension-type headache"],
    sort_index: 80
  },
  {
    id: "brainstem",
    title: "Migraine with Brainstem Aura (Basilar-type)",
    short: "Brainstem aura without motor weakness.",
    badge_text: "Stroke mimic — urgent care",
    badge_color: "bg-red-100 text-red-800",
    symptoms: [
      "Vertigo, double vision, slurred speech, tinnitus",
      "Ataxia (unsteady movements), decreased alertness",
      "Often followed by headache"
    ],
    notes: ["Appears alarming; rule-out of other causes is important with a clinician."],
    lookalikes: ["Stroke", "Seizure", "Brainstem ischemia", "Ménière’s disease"],
    sort_index: 90
  }
];

/* ============================ UI Helpers ============================ */
function Badge({ text, color }: { text?: string | null; color?: string | null }) {
  if (!text) return null;
  return (
    <span className={`ml-2 inline-block rounded px-2 py-0.5 text-xs font-medium ${color ?? "bg-blue-100 text-blue-800"}`}>
      {text}
    </span>
  );
}

function MiniUrgentFlag() {
  return (
    <div className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">
      Stroke-like symptoms can occur. If new, severe, or different from usual, seek urgent care.
    </div>
  );
}

function RedFlagBanner() {
  return (
    <div className="mt-4 rounded border border-red-300 bg-red-50 p-4" role="note" aria-label="Urgent care guidance">
      <div className="flex items-start gap-3">
        <span aria-hidden="true">🚨</span>
        <div>
          <h3 className="font-semibold text-red-900">When to seek urgent care</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-red-900 space-y-1">
            <li>Sudden new neurologic symptoms (weakness, numbness, trouble speaking)</li>
            <li>Vision loss in one eye, double vision, or “curtain” over vision</li>
            <li>“Worst headache of life,” abrupt onset (thunderclap)</li>
            <li>New severe headache with fever, stiff neck, confusion, or after head injury</li>
            <li>New or markedly different headache pattern, especially after age 50</li>
          </ul>
          <p className="mt-2 text-xs text-red-900/80">
            These can mimic or coexist with migraine but may signal a medical emergency (e.g., stroke).
            Call emergency services or seek immediate evaluation. See{" "}
            <a href="#refs-list" className="underline">Sources &amp; Citations</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================ Subcomponents ============================ */
function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: Topic;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isStrokeMimic = item.badge_text?.toLowerCase().includes("stroke mimic");
  return (
    <div className="border rounded mb-2">
      <button
        className="w-full text-left px-4 py-3"
        aria-expanded={isOpen}
        aria-controls={`sect-${item.id}`}
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold">{item.title}</span>
          <Badge text={item.badge_text} color={item.badge_color ?? undefined} />
        </div>
        <div className="text-sm font-normal text-gray-600">{item.short}</div>
      </button>

      {isOpen && (
        <div id={`sect-${item.id}`} className="px-4 pb-4">
          {!!item.symptoms?.length && (
            <div className="mt-2">
              <h4 className="font-semibold">Common Symptoms</h4>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                {item.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}

          {!!item.notes?.length && (
            <div className="mt-3">
              <h4 className="font-semibold">Notes</h4>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                {item.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}

          {!!item.lookalikes?.length && (
            <div className="mt-3">
              <h4 className="font-semibold">Possible Look-alikes</h4>
              <ul className="list-disc ml-5 mt-1 space-y-1">
                {item.lookalikes.map((l, i) => <li key={i}>{l}</li>)}
              </ul>
            </div>
          )}

          {isStrokeMimic && <MiniUrgentFlag />}
        </div>
      )}
    </div>
  );
}

function References({ items }: { items: Reference[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button
        className="w-full text-left border rounded px-4 py-3 font-semibold hover:bg-gray-50"
        aria-expanded={open}
        aria-controls="refs-list"
        onClick={() => setOpen(o => !o)}
      >
        Sources &amp; Citations
        <span className="ml-2 text-xs font-normal text-gray-600">(clinician-reviewed / official references)</span>
      </button>
      {open && (
        <div id="refs-list" className="border-l border-r border-b rounded-b px-4 py-3">
          <ul className="list-disc ml-5 space-y-1 text-sm" id="refs-list">
            {items.map((r, i) => (
              <li key={i}>
                <a className="underline" href={r.url} target="_blank" rel="noopener noreferrer">
                  {r.title}
                </a>
                {r.note ? <span className="text-gray-600"> — {r.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ============================ Main Exports ============================ */
export function EducationButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50"
      aria-haspopup="dialog"
      aria-controls="education-modal"
    >
      <span role="img" aria-label="book">📘</span>
      Education
    </button>
  );
}

export function EducationModal({ open, onClose }: { open: boolean; onClose: () => void; }) {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fetch from Supabase (with safe fallback)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("education_topics")
        .select("*")
        .order("sort_index", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.warn("Supabase education_topics fetch error:", error.message);
        setError(error.message);
        setTopics(FALLBACK_TOPICS);
      } else if (!data || data.length === 0) {
        setTopics(FALLBACK_TOPICS);
      } else {
        // normalize keys to our Topic type
        const normalized = (data as any[]).map(row => ({
          ...row,
          symptoms: row.symptoms ?? [],
          notes: row.notes ?? [],
          lookalikes: row.lookalikes ?? [],
        })) as Topic[];
        setTopics(normalized);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics;
    return topics.filter(t =>
      [t.title, t.short, ...(t.symptoms || []), ...(t.notes || []), ...(t.lookalikes || [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [topics, query]);

  if (!open) return null;

  return (
    <div id="education-modal" role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      {/* Panel */}
      <div ref={panelRef} className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-auto rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Education Hub</h2>
            <p className="text-sm text-gray-600">
              Recognize symptoms early. For education only — not a substitute for medical advice.
            </p>
          </div>
          <button onClick={onClose} className="rounded border px-2 py-1 text-sm hover:bg-gray-50" aria-label="Close Education">✕</button>
        </div>

        {/* Search */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Search topics &amp; symptoms</label>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., vertigo, visual aura, one-sided weakness"
            type="search"
          />
        </div>

        {/* Urgent-care global banner */}
        <RedFlagBanner />

        {/* Overview */}
        <div className="mt-4 border rounded p-4 bg-gray-50">
          <h3 className="font-semibold">Overview</h3>
          <p className="text-sm text-gray-700 mt-1">
            Migraine presents in different patterns (with/without aura, vestibular, retinal, etc.). Some types (like
            silent migraine) can have minimal or no head pain. If symptoms are new, severe, or mimic stroke
            (weakness, trouble speaking, vision loss in one eye), seek urgent medical evaluation.
          </p>
        </div>

        {/* List */}
        <div className="mt-4">
          {loading && <p className="text-sm text-gray-600">Loading education topics…</p>}
          {error && <p className="text-sm text-red-700">Couldn’t load from Supabase: {error}</p>}
          {!loading && filtered.map(item => (
            <AccordionItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(openId === item.id ? null : item.id)}
            />
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-gray-600">No matches. Try a different search term.</p>
          )}
        </div>

        {/* Sources & citations */}
        <References items={REFERENCES} />

        {/* Footer disclaimer */}
        <div className="mt-4 text-xs text-gray-500">
          This content is informational and not medical advice. Consult a licensed healthcare professional for diagnosis and treatment.
        </div>
      </div>
    </div>
  );
}