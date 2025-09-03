// src/pages/SignIn.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import BrandBar from "@/components/BrandBar";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <>
      <BrandBar />
      <main className="min-h-[calc(100vh-60px)] bg-slate-100">
        <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
          <div className="card w-full max-w-md">
            <div className="mb-1 flex items-center gap-2">
              <img src="/logo.png" alt="Sentinel Health" className="h-6 w-auto" />
              <span className="text-sm text-slate-500">Sentinel Health</span>
            </div>
            <h1 className="mb-1 text-2xl font-semibold">Sign into Sentinel Health</h1>
            <p className="mb-6 text-slate-500">Welcome back</p>

            <button className="btn w-full rounded-xl bg-slate-900 py-2 text-white hover:opacity-90">
              Continue with Google
            </button>

            <div className="my-4 text-center text-sm text-slate-400">or</div>

            <form className="space-y-4">
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input mt-1" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" className="input mt-1" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary w-full py-2">Sign in</button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm">
              <div className="space-x-2">
                <Link to="/signup" className="text-blue-600 hover:underline">Create account</Link>
                <Link to="/forgot" className="text-blue-600 hover:underline">Forgot password?</Link>
              </div>
              <Link to="/" className="text-slate-500 hover:underline">Go home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
