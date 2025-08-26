import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function SignIn(){
  const nav = useNavigate();
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setError('');
    setLoading(true);
    try{
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      window.__SB_SESSION__ = data?.session || null;
      nav('/', { replace:true });
    }catch(e){
      setError(e.message || 'Sign in failed');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="center-wrap">
      <div className="card">
        <img className="logo" src="/icon-192.png" alt="Sentinel Health"/>
        <h1 className="h1">Sign in to Sentinel Health</h1>

        <form onSubmit={onSubmit} className="form-grid">
          <label className="label label--left">Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />

          <label className="label label--left">Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

          <div></div>
          <div className="row">
            <button className="btn primary" disabled={loading} type="submit">{loading?'Signing in…':'Sign In'}</button>
            <button className="btn" type="button" onClick={()=>nav('/')} disabled={loading}>Cancel</button>
          </div>
        </form>

        {error && <div style={{marginTop:12,color:'#b91c1c'}}>{error}</div>}
      </div>
    </div>
  );
}
