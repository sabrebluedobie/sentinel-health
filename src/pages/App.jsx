import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignIn from '@/pages/SignIn.jsx';
import Dashboard from '@/pages/Dashboard.jsx';

function RequireAuth({ children }){
  const hasSession = !!window.__SB_SESSION__;
  if (!hasSession) return <Navigate to="/sign-in" replace />;
  return children;
}

export default function App(){
  const loc = useLocation();
  useEffect(()=>{ document.title = 'Sentinel Health'; console.log('[route]', loc.pathname); },[loc]);
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn/>} />
      <Route path="/" element={<RequireAuth><Dashboard/></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
