import React, { useEffect, useState } from 'react';
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/layout';
import Dashboard from '@/pages/Dashboard.jsx';
import SignIn from '@/pages/SignIn.jsx';
import { supabase } from '@/lib/supabase';

export default function App(){
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(()=>{
    (async ()=>{
      const { data:{ session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setReady(true);
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session)=>{
      setUser(session?.user || null);
    });
    return () => subscription?.unsubscribe?.();
  },[]);

  if(!ready) return <div style={{padding:16}}>Loading…</div>;

  return (
    <Layout>
      <Routes>
        <Route path="/sign-in" element={user ? <Navigate to="/" replace /> : <SignIn />} />
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/sign-in" replace />} />
        <Route path="*" element={<Navigate to={user ? "/" : "/sign-in"} replace />} />
      </Routes>
    </Layout>
  );
}