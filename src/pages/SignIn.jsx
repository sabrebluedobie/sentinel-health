import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import supabase from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const { error } = await supabase.auth.signInWithPassword({ email, password }); //  [oai_citation:4‡Supabase](https://supabase.com/docs/reference/javascript/auth-signinwithpassword?utm_source=chatgpt.com)
    setBusy(false);
    if (error) {
      setMsg(error.message || 'Sign-in failed');
      return;
    }
    const to = location.state?.from?.pathname ?? '/';
    navigate(to, { replace: true });
  }

  return (
    <div style={{ maxWidth: 420, margin: '6rem auto', padding: 24 }}>
      <h1>Sign in</h1>
      <form onSubmit={onSubmit}>
        <label>Email<br/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
        <br/><br/>
        <label>Password<br/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>
        <br/><br/>
        <button disabled={busy} type="submit">{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
      {msg && <p style={{ color: 'crimson' }}>{msg}</p>}
    </div>
  );
}