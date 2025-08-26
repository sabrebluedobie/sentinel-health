import React from "react";

export default function PieColorsEditor({ labels = [], colors = [], onChange }) {
  const handle = (idx, value) => {
    const next = [...(colors.length ? colors : labels.map(() => "#6d28d9"))];
    next[idx] = value;
    onChange && onChange(next);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {labels.map((lbl, i) => (
        <label key={lbl} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
          <span style={{ width: 140, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lbl}</span>
          <input
            type="color"
            value={(colors && colors[i]) || "#6d28d9"}
            onChange={(e) => handle(i, e.target.value)}
            aria-label={`Color for ${lbl}`}
          />
        </label>
      ))}
    </div>
  );
}