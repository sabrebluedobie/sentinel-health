// src/providers/AuthProvider.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({ user: null, loading: true });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initial session + auth state listener
  useEffect(() => {
    let ignore = false;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!ignore) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      ignore = true;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// convenient hook
export const useAuth = () => useContext(AuthContext);

// also provide a default export (harmless if unused)
export default AuthProvider;
