// src/pages/App.jsx (UPDATE your existing App)
import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = useUser();
  const supabase = useSupabaseClient();
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Log Glucose', href: '/log-glucose', icon: '🩸' },
    { name: 'Log Migraine', href: '/log-migraine', icon: '🤕' },
    { name: 'Log Sleep', href: '/log-sleep', icon: '💤' },
    { name: 'Nightscout Settings', href: '/nightscout-settings', icon: '⚙️' },
  ];

  // Don't show navigation on sign-in page
  if (location.pathname === '/sign-in') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button */}
      {user && (
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white px-4 py-2 shadow-sm">
            <h1 className="text-lg font-semibold">Health Tracker</h1>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Sidebar */}
        {user && (
          <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white shadow-lg min-h-screen`}>
            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900">Health Tracker</h1>
            </div>
            
            <nav className="mt-8">
              <div className="px-4 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)} // Close mobile menu
                    className={`flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      location.pathname === item.href
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
              
              {/* User section */}
              <div className="mt-8 px-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600">
                  <span>👤</span>
                  {user?.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg w-full text-left"
                >
                  <span>🚪</span>
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}