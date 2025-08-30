// src/hooks/useHeadacheTypes.js
import { useCallback, useEffect, useState } from 'react';

export function useHeadacheTypes(initialSymptoms = '') {
  const [symptoms, setSymptoms] = useState(initialSymptoms);
  const [data, setData] = useState({ items: [] });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const run = useCallback(
    async (overrideSymptoms) => {
      setLoading(true);
      setErr('');
      try {
        const res = await fetch('/api/headache-types', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ symptoms: overrideSymptoms ?? symptoms }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to fetch headache types');
        setData(json || { items: [] });
      } catch (e) {
        setErr(e.message || 'Error');
      } finally {
        setLoading(false);
      }
    },
    [symptoms]
  );

  // optional: auto-run once if initialSymptoms provided
  useEffect(() => {
    if (initialSymptoms && !data.items.length) run(initialSymptoms);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { symptoms, setSymptoms, data, loading, err, run };
}
