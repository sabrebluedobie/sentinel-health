// src/components/BrandBar.jsx
export default function BrandBar() {
  return (
    <header className="sticky top-0 z-10 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <img src="/logo.png" alt="Sentinel Health" className="h-7 w-auto" />
        <div className="text-sm text-slate-500">Sentinel Health</div>
      </div>
    </header>
  );
}
