// src/components/TopNav.jsx
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TopNav({ showTabs = true, moduleProfile, moduleProfileLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHealthDropdownOpen, setIsHealthDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const enabled = moduleProfile?.enabled_modules || {};

  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/reports", label: "Reports" },
    { to: "/insights", label: "Insights" },
    { to: "/settings", label: "Settings" },
  ];

  const healthOptionsAll = [
    { to: "/glucose",  label: "Glucose",  moduleKey: "glucose" },
    { to: "/sleep",    label: "Sleep",    moduleKey: "sleep" },
    { to: "/migraine", label: "Migraine", moduleKey: "migraine" },
    { to: "/pain",     label: "Pain",     moduleKey: "pain" },
    { to: "/medication", label: "Medication", moduleKey: "medication" },
    { to: "/insights", label: "Insights", moduleKey: "insights" },
  ];

  const healthOptions = healthOptionsAll.filter((o) => !!enabled[o.moduleKey]);

  const healthTrackingPages = healthOptions.map((o) => o.to);
  const isHealthPageActive = healthTrackingPages.includes(location.pathname);

  const showHealthDropdown = !moduleProfileLoading && healthOptions.length > 0;


  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsHealthDropdownOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-3 py-2">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-2">
          <img src="/migraine-icon.png" alt="Sentrya Migraine Tracker" className="h-8 w-auto" />
          <div className="hidden sm:block truncate text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Sentrya</span>
            <span className="ml-2">Migraine Tracker</span>
          </div>
        </div>

        {showTabs && (
          <>
            {/* Desktop Navigation */}
            <nav className="hidden lg:flex ml-auto items-center gap-2">
              {tabs.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.to === "/"}
                  className={({ isActive }) =>
                    `inline-block shrink-0 rounded-xl border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  {t.label}
                </NavLink>
              ))}
              
              {/* Desktop Track Health Dropdown */}
              {showHealthDropdown && (
                <div className="relative shrink-0">
                  <button
                    onClick={() => setIsHealthDropdownOpen(!isHealthDropdownOpen)}
                    onBlur={() => setTimeout(() => setIsHealthDropdownOpen(false), 150)}
                    className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm transition ${
                      isHealthPageActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Track Health
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {isHealthDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-xl z-[100]">
                      <ul className="py-1">
                        {healthOptions.map((option) => (
                          <li key={option.to}>
                            <NavLink
                              to={option.to}
                              className={({ isActive }) =>
                                `block px-4 py-2 text-sm transition ${
                                  isActive
                                    ? "bg-slate-100 text-slate-900 font-medium"
                                    : "text-slate-700 hover:bg-slate-50"
                                }`
                              }
                              onClick={() => setIsHealthDropdownOpen(false)}
                            >
                              Log {option.label}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleSignOut}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition"
              >
                Sign Out
              </button>
            </nav>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden ml-auto p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                // X icon
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Hamburger icon
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mobile Menu */}
      {showTabs && isMobileMenuOpen && (
        <nav className="lg:hidden border-t bg-white">
          <div className="mx-auto max-w-6xl px-3 py-3 space-y-1">
            {/* Main tabs */}
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === "/"}
                className={({ isActive }) =>
                  `block w-full text-left rounded-lg px-4 py-3 text-base transition ${
                    isActive
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
            
            {/* Track Health Section - Mobile Accordion Style */}
            {showHealthDropdown && (
            <div className="border-t pt-2 mt-2">
              <button
                onClick={() => setIsHealthDropdownOpen(!isHealthDropdownOpen)}
                className={`flex items-center justify-between w-full text-left rounded-lg px-4 py-3 text-base transition ${
                  isHealthPageActive
                    ? "bg-slate-900 text-white font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>Track Health</span>
                <svg 
                  className={`h-5 w-5 transition-transform ${isHealthDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isHealthDropdownOpen && (
                <div className="ml-4 mt-1 space-y-1">
                  {healthOptions.map((option) => (
                    <NavLink
                      key={option.to}
                      to={option.to}
                      className={({ isActive }) =>
                        `block w-full text-left rounded-lg px-4 py-2.5 text-sm transition ${
                          isActive
                            ? "bg-slate-100 text-slate-900 font-medium"
                            : "text-slate-600 hover:bg-slate-50"
                        }`
                      }
                    >
                      Log {option.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
            )}
            
            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="w-full text-left rounded-lg px-4 py-3 text-base text-red-600 hover:bg-red-50 transition border-t mt-2 pt-3"
            >
              Sign Out
            </button>
          </div>
        </nav>
      )}
    </header>
  );
}