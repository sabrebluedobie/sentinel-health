import React from "react";

export default function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl bg-white shadow-sm ring-1 ring-black/5 p-5">
      <div className="mb-3">
        <div className="text-sm font-medium text-zinc-900">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>}
      </div>
      <div className="min-h-[14rem]">
        {children}
      </div>
    </div>
  );
}