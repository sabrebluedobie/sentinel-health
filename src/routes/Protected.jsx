import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function Protected({ children }) {
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/login');
      else setReady(true);
    };
    check();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate('/login');
    });

    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) {
    return <div className="h-[50vh] grid place-items-center">Loading…</div>;
  }
  return children;
}
