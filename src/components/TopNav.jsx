// src/components/TopNav.jsx
import { NavLink, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function TopNav({ showTabs = true }) {
  const navigate = useNavigate();
  
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/glucose", label: "Glucose" },
    { to: "/sleep", label: "Sleep" },
    { to: "/migraine", label: "Migraine" },
    { to: "/pain", label: "Pain" },
    { to: "/settings", label: "Settings" },
    { to: "/education", label: "Education" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/migraine-icon.png" alt="Sentrya Migraine Tracker" className="h-8 w-auto" />
          <div className="truncate text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Sentrya</span>
            <span className="ml-2">Migraine Tracker</span>
          </div>
        </div>

        {showTabs && (
          <nav className="ml-auto flex items-center gap-4 w-full overflow-x-auto">
            <ul className="flex shrink-0 items-center gap-2">
              {tabs.map((t) => (
                <li key={t.to} className="shrink-0">
                  <NavLink
                    to={t.to}
                    end={t.to === "/"}
                    className={({ isActive }) =>
                      `inline-block rounded-xl border px-3 py-1.5 text-sm transition ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    {t.label}
                  </NavLink>
                </li>
              ))}
            </ul>
            
            <button
              onClick={handleSignOut}
              className="shrink-0 ml-auto rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}