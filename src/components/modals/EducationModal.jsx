// src/components/modals/EducationModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Modal from "../common/Modal.jsx";
import supabase from "../../services/supabaseClient.js";
import { REFERENCES, FALLBACK_TOPICS } from "../../data/migraineEducation.js";

function Badge({ text, color }) {
  if (!text) return null;
  return (
    <span style={{
      marginLeft: 6, display: "inline-block", borderRadius: 6, padding: "2px 6px",
      fontSize: 12, fontWeight: 600, background: color || "#dbeafe", color: "#1e3a8a"
    }}>
      {text}
    </span>
  );
}

function MiniUrgentFlag() {
  return (
    <div style={{ marginTop: 8, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", padding: "6px 10px", fontSize: 12, color: "#7f1d1d" }}>
      Stroke-like symptoms can occur. If new, severe, or different from usual, seek urgent care.
    </div>
  );
}

function RedFlagBanner() {
  return (
    <div style={{ marginTop: 12, borderRadius: 10, border: "1px solid #fca5a5", background: "#fef2f2", padding: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <span aria-hidden="true">🚨</span>
        <div>
          <h3 style={{ margin: 0, fontWeight: 700, color: "#7f1d1d" }}>When to seek urgent care</h3>
          <ul style={{ margin: "6px 0 0 18px", padding: 0, fontSize: 14, color: "#7f1d1d", lineHeight: 1.5 }}>
            <li>Sudden new neurologic symptoms (weakness, numbness, trouble speaking)</li>
            <li>Vision loss in one eye, double vision, or “curtain” over vision</li>
            <li>“Worst headache of life,” abrupt onset (thunderclap)</li>
            <li>New severe headache with fever, stiff neck, confusion, or after head injury</li>
            <li>New or markedly different headache pattern, especially after age 50</li>
          </ul>
          <p style={{ marginTop: 6, fontSize: 12, color: "#7f1d1d" }}>
            These can mimic or coexist with migraine but may signal a medical emergency (e.g., stroke).
            Call emergency services or seek immediate evaluation. See <a href="#refs-list">Sources &amp; Citations</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function AccordionItem({ item, isOpen, onToggle }) {
  const isStrokeMimic = (item.badge_text || "").toLowerCase().includes("stroke mimic");
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8 }}>
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`sect-${item.id}`}
        style={{ width: "100%", textAlign: "left", padding: "10px 12px", background: "transparent", border: "none", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>{item.title}</span>
          <Badge text={item.badge_text} color={item.badge_color} />
        </div>
        <div style={{ fontSize: 13, color: "#4b5563" }}>{item.short}</div>
      </button>

      {isOpen && (
        <div id={`sect-${item.id}`} style={{ padding: "0 12px 12px 12px" }}>
          {!!(item.symptoms || []).length && (
            <div style={{ marginTop: 8 }}>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Common Symptoms</h4>
              <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.5 }}>
                {item.symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
          {!!(item.notes || []).length && (
            <div style={{ marginTop: 10 }}>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Notes</h4>
              <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.5 }}>
                {item.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          )}
          {!!(item.lookalikes || []).length && (
            <div style={{ marginTop: 10 }}>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Possible Look-alikes</h4>
              <ul style={{ margin: "6px 0 0 18px", lineHeight: 1.5 }}>
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

function ReferencesList({ items }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="refs-list"
        style={{ width: "100%", textAlign: "left", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontWeight: 600, background: "#fff" }}
      >
        Sources &amp; Citations <span style={{ marginLeft: 6, fontSize: 12, color: "#6b7280", fontWeight: 400 }}>(clinician-reviewed / official references)</span>
      </button>
      {open && (
        <div id="refs-list" style={{ border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "10px 12px" }}>
          <ul style={{ margin: "0 0 0 18px", lineHeight: 1.5, fontSize: 14 }}>
            {items.map((r, i) => (
              <li key={i}>
                <a href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>{r.title}</a>
                {r.note ? <span style={{ color: "#6b7280" }}> — {r.note}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function EducationModal({ onClose }) {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
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
          const normalized = data.map(row => ({
            ...row,
            symptoms: row.symptoms ?? [],
            notes: row.notes ?? [],
            lookalikes: row.lookalikes ?? [],
          }));
          setTopics(normalized);
        }
      } catch (e) {
        if (!cancelled) {
          setError(String(e?.message || e));
          setTopics(FALLBACK_TOPICS);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

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

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginBottom: 8 }}>Education Hub</h3>
      <p style={{ fontSize: 14, color: "#374151" }}>
        Recognize symptoms early. For education only — not a substitute for medical advice.
      </p>

      <div style={{ marginTop: 10 }}>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          Search topics &amp; symptoms
        </label>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="e.g., vertigo, visual aura, one-sided weakness"
          style={{ width: "100%", border: "1px solid #dcdcdc", borderRadius: 6, padding: "8px 10px" }}
        />
      </div>

      <RedFlagBanner />

      <div style={{ marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 8, background: "#f9fafb", padding: 12 }}>
        <h4 style={{ margin: 0, fontWeight: 600 }}>Overview</h4>
        <p style={{ fontSize: 14, color: "#374151", marginTop: 6 }}>
          Migraine presents in different patterns (with/without aura, vestibular, retinal, etc.). Some types (like
          silent migraine) can have minimal or no head pain. If symptoms are new, severe, or mimic stroke
          (weakness, trouble speaking, vision loss in one eye), seek urgent medical evaluation.
        </p>
      </div>

      <div style={{ marginTop: 10 }}>
        {loading && <p style={{ fontSize: 14, color: "#6b7280" }}>Loading education topics…</p>}
        {error && <p style={{ fontSize: 14, color: "#b91c1c" }}>Couldn’t load from Supabase: {error}</p>}
        {!loading && filtered.map(item => (
          <AccordionItem
            key={item.id}
            item={item}
            isOpen={openId === item.id}
            onToggle={() => setOpenId(openId === item.id ? null : item.id)}
          />
        ))}
        {!loading && filtered.length === 0 && (
          <p style={{ fontSize: 14, color: "#6b7280" }}>No matches. Try a different search term.</p>
        )}
      </div>

      <ReferencesList items={REFERENCES} />

      <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
        This content is informational and not medical advice. Consult a licensed healthcare professional for diagnosis and treatment.
      </div>

      <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ background: "#042d4d", color: "#fff", padding: "8px 12px", borderRadius: 8 }}>
          Close
        </button>
      </div>
    </Modal>
  );
}