import React, { useState, useCallback } from "react";

/**
 * Tries several paths so your logo shows up regardless of where it lives.
 * Priority:
 *   1) /logo.png           (from /public)
 *   2) /assets/logo.png    (served asset folder)
 *   3) /assets/logo.png    (your note said this exists)
 */
const CANDIDATES = ["/logo.png", "src/assets/logo.png", "/assets/logo.png", "/public/logo.png" ];

export default function Logo({ size = 48, style }) {
  const [idx, setIdx] = useState(0);
  const onError = useCallback(() => {
    setIdx((i) => (i + 1 < CANDIDATES.length ? i + 1 : i)); // stop at last
  }, []);
  const src = CANDIDATES[idx];

  return (
    <img
      src={src}
      alt="Sentinel Health"
      onError={onError}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        display: "block",
        ...style,
      }}
    />
  );
}
