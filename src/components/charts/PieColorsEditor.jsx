import React, { useEffect, useState } from "react";

const DEFAULT_SYMPTOMS = [
  "nausea",
  "vomiting",
  "photophobia",
  "phonophobia",
  "aura",
  "neck pain",
  "fatigue",
  "dizziness",
  "blurred vision",
];

export default function PieColorsEditor({ storageKey = "app.pieSymptomColors" }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const obj = raw ? JSON.parse(raw) : {};
      const keys = Object.keys(obj);
      const initial = (keys.length ? keys : DEFAULT_SYMPTOMS).map((k) => ({ name: k, color: obj[k] || "" }));
      setRows(initial);
    } catch {
      setRows(DEFAULT_SYMPTOMS.map((k) => ({ name: k, color: "" })));
    }
  }, [storageKey]);

  function save() {
    const obj = {};
    rows.forEach((r) => {
      if (r.name) obj[r.name.toLowerCase().trim()] = r.color || undefined;
    });
    localStorage.setItem(storageKey, JSON.stringify(obj));
    window.dispatchEvent(new Event("settings-updated"));
    alert("Saved!");
  }

  function addRow() {
    setRows((r) => [...r, { name: "", color: "" }]);
  }

  return (
    <div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 8 }}>Symptom</th>
            <th style={{ textAlign: "left", padding: 8 }}>Color</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ padding: 8, borderTop: "1px solid #eee" }}>
                <input
                  value={r.name}
                  onChange={(e) => setRows((rows) => rows.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  placeholder="e.g. nausea"
                />
              </td>
              <td style={{ padding: 8, borderTop: "1px solid #eee" }}>
                <input
                  type="color"
                  value={r.color || "#cccccc"}
                  onChange={(e) => setRows((rows) => rows.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button className="btn" onClick={addRow}>
          Add symptom
        </button>
        <button className="btn btn-primary" onClick={save}>
          Save colors
        </button>
      </div>
    </div>
  );
}
