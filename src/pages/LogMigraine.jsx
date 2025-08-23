// src/pages/LogMigraine.jsx
import React, { useMemo, useState, useEffect } from 'react';

/**
 * LogMigraine (Web React, Vite-ready)
 * - No external packages
 * - Inline styles for true drop-in
 * - Accessible labels/roles
 */

const theme = {
  colors: {
    background: '#FFFFFF',
    surface: '#F7F8FA',
    border: '#E6E8EE',
    textPrimary: '#101828',
    textSecondary: '#475467',
    primary: '#3B82F6',
    primaryPressed: '#2563EB',
    focus: '#93C5FD',
    tagBg: '#FFFFFF',
    tagBgActive: '#EFF6FF',
    shadow: 'rgba(16, 24, 40, 0.08)',
  },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  space: { xs: 6, sm: 10, md: 16, lg: 20, xl: 24, xxl: 32 },
  text: { h2: 22, label: 14, body: 16, small: 13, button: 16 },
};

const DEFAULT_SYMPTOMS = [
  { id: 'nausea', label: 'Nausea' },
  { id: 'aura', label: 'Aura' },
  { id: 'photophobia', label: 'Light Sensitivity' },
  { id: 'phonophobia', label: 'Sound Sensitivity' },
  { id: 'vomiting', label: 'Vomiting' },
  { id: 'neck', label: 'Neck Pain' },
];

export default function LogMigraine({
  initialPain = 0,
  initialSymptoms = [],
  initialNotes = '',
  symptomOptions = DEFAULT_SYMPTOMS,
  onSave,
}) {
  const [pain, setPain] = useState(initialPain);
  const [selected, setSelected] = useState(initialSymptoms);
  const [notes, setNotes] = useState(initialNotes);

  useMemo(() => new Map(symptomOptions.map((s) => [s.id, s.label])), [symptomOptions]);

  const toggleSymptom = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleSave = (e) => {
    e.preventDefault();
    onSave && onSave({ pain: Number(pain), symptoms: selected, notes });
  };

  // keyboard focus outline helper
  useEffect(() => {
    const id = 'log-migraine-focus-style';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = `
        .lm-focusable:focus {
          outline: 3px solid ${theme.colors.focus};
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const onTagKeyDown = (e, id) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSymptom(id);
    }
  };

  return (
    <div style={styles.page(theme)}>
      <form style={styles.card(theme)} onSubmit={handleSave} aria-labelledby="log-migraine-title">
        <h2 id="log-migraine-title" style={styles.heading(theme)}>Log Migraine</h2>

        {/* Pain Level */}
        <label htmlFor="pain-range" style={styles.label(theme)}>Pain Level</label>
        <div style={styles.sliderRow(theme)}>
          <div aria-live="polite" aria-atomic="true" style={styles.scaleText(theme)}>{pain}</div>
          <div style={styles.scaleHint(theme)}>0 (none) – 10 (worst)</div>
        </div>
        <input
          id="pain-range"
          className="lm-focusable"
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(e) => setPain(e.target.value)}
          aria-label="Pain level slider"
          style={styles.range(theme)}
        />

        {/* Symptoms */}
        <div style={styles.label(theme)}>Symptoms</div>
        <div style={styles.tagsWrap(theme)} role="group" aria-label="Symptoms">
          {symptomOptions.map((item) => {
            const isActive = selected.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                className="lm-focusable"
                aria-pressed={isActive}
                onClick={() => toggleSymptom(item.id)}
                onKeyDown={(e) => onTagKeyDown(e, item.id)}
                style={{
                  ...styles.tag(theme),
                  ...(isActive ? styles.tagActive(theme) : null),
                }}
              >
                <span
                  style={{
                    ...styles.tagText(theme),
                    ...(isActive ? styles.tagTextActive(theme) : null),
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Notes */}
        <label htmlFor="notes" style={styles.label(theme)}>Notes</label>
        <textarea
          id="notes"
          className="lm-focusable"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add details (duration, triggers, medication, etc.)"
          style={styles.textarea(theme)}
        />

        {/* Actions */}
        <div style={styles.actions(theme)}>
          <button
            type="submit"
            className="lm-focusable"
            style={styles.primaryButton(theme)}
            onMouseDown={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primaryPressed)}
            onMouseUp={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = theme.colors.primary)}
          >
            <span style={styles.primaryButtonText(theme)}>Save Entry</span>
          </button>
        </div>
      </form>
    </div>
  );
}

const styles = {
  page: (t) => ({
    background: t.colors.background,
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    padding: t.space.lg,
  }),
  card: (t) => ({
    width: '100%',
    maxWidth: 720,
    background: t.colors.surface,
    border: `1px solid ${t.colors.border}`,
    borderRadius: t.radius.lg,
    padding: t.space.lg,
    boxShadow: `0 6px 16px ${t.colors.shadow}`,
  }),
  heading: (t) => ({
    fontSize: t.text.h2,
    fontWeight: 700,
    color: t.colors.textPrimary,
    marginBottom: t.space.md,
  }),
  label: (t) => ({
    fontSize: t.text.label,
    fontWeight: 600,
    color: t.colors.textSecondary,
    marginTop: t.space.lg,
    marginBottom: t.space.xs,
    display: 'block',
  }),
  sliderRow: (t) => ({
    display: 'flex',
    alignItems: 'center',
    gap: t.space.sm,
  }),
  scaleText: (t) => ({
    fontSize: t.text.body,
    fontWeight: 700,
    color: t.colors.textPrimary,
    minWidth: 28,
    textAlign: 'right',
  }),
  scaleHint: (t) => ({
    fontSize: t.text.small,
    color: t.colors.textSecondary,
  }),
  range: (t) => ({
    width: '100%',
    marginTop: t.space.xs,
    accentColor: t.colors.primary,
    cursor: 'pointer',
  }),
  tagsWrap: (t) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: t.space.sm,
    padding: `${t.space.xs}px 0`,
  }),
  tag: (t) => ({
    border: `1px solid ${t.colors.border}`,
    background: t.colors.tagBg,
    padding: `${t.space.xs + 2}px ${t.space.md}px`,
    borderRadius: t.radius.pill,
    minWidth: 100,
    textAlign: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  }),
  tagActive: (t) => ({
    borderColor: t.colors.primary,
    background: t.colors.tagBgActive,
  }),
  tagText: (t) => ({
    fontSize: t.text.body,
    color: t.colors.textPrimary,
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  tagTextActive: (t) => ({
    color: t.colors.primaryPressed,
    fontWeight: 700,
  }),
  textarea: (t) => ({
    width: '100%',
    minHeight: 120,
    border: `1px solid ${t.colors.border}`,
    borderRadius: t.radius.md,
    padding: t.space.md,
    fontSize: t.text.body,
    color: t.colors.textPrimary,
    background: '#FFF',
    resize: 'vertical',
  }),
  actions: (t) => ({
    marginTop: t.space.xl,
    display: 'flex',
    justifyContent: 'flex-end',
    gap: t.space.sm,
  }),
  primaryButton: (t) => ({
    background: t.colors.primary,
    border: 'none',
    padding: `${t.space.sm + 2}px ${t.space.xl}px`,
    borderRadius: t.radius.md,
    cursor: 'pointer',
  }),
  primaryButtonText: (t) => ({
    color: '#FFF',
    fontSize: t.text.button,
    fontWeight: 700,
  }),
};