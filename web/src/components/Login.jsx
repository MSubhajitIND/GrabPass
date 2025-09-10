// src/components/Login.jsx
import React, { useEffect, useRef, useState } from "react";
import API from "../api";

export default function Login({ onLogin, onCancel }) {
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [remember,setRemember] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const [animState,setAnimState] = useState("enter");
  const emailRef = useRef(null);

  useEffect(()=> {
    const t = setTimeout(()=>{ emailRef.current?.focus(); setAnimState("idle"); }, 60);
    function onKey(e) { if (e.key==='Escape') handleCancel(); if (e.key==='Enter') handleSubmit(e); }
    window.addEventListener('keydown', onKey);
    return ()=>{ clearTimeout(t); window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line
  }, []);

  const handleCancel = ()=>{ setAnimState('exit'); setTimeout(()=>onCancel?.(), 220); };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please enter both email and password."); return; }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, role } = res.data;
      try {
        if (remember) { localStorage.setItem("gp_token", token); localStorage.setItem("gp_role", role); }
        else { sessionStorage.setItem("gp_token", token); sessionStorage.setItem("gp_role", role); }
      } catch(err){}
      setAnimState('exit');
      setTimeout(()=> onLogin?.({ email, role }), 200);
    } catch(err) {
      const msg = err?.response?.data?.error || err?.message || 'Login failed';
      setError(msg);
    } finally { setLoading(false); }
  };

  const backdropClass = animState === 'enter' ? 'opacity-0' : animState==='exit' ? 'opacity-0 transition-opacity duration-200' : 'opacity-100 transition-opacity duration-200';
  const dialogAnim = animState === 'enter' ? 'opacity-0 scale-95 translate-y-2' : animState==='exit' ? 'opacity-0 scale-95 translate-y-2' : 'opacity-100 scale-100 translate-y-0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`absolute inset-0 bg-black/40 backdrop-blur-sm ${backdropClass}`} onClick={handleCancel} />
      <form onSubmit={handleSubmit} className={`relative z-10 w-full max-w-md mx-4 transform transition-all duration-200 ${dialogAnim}`}>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border dark:border-gray-800">
          <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white font-bold">G</div>
            <div>
              <div className="font-semibold text-lg">Admin Sign in</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Manage events & registrations</div>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4">
            {error && <div className="rounded-md bg-red-50 border border-red-100 text-red-700 px-3 py-2 text-sm">{error}</div>}

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input ref={emailRef} className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@college.edu" autoComplete="username" />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <button type="button" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400" onClick={()=>setShowPassword(s=>!s)}>{showPassword ? 'Hide':'Show'}</button>
              </div>
              <input type={showPassword? 'text':'password'} className="input" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} className="rounded border-gray-300 dark:border-gray-600 text-brand-500" /> Remember me
              </label>
              <button type="button" onClick={()=>alert("Forgot password not implemented in demo")} className="text-sm text-gray-500 hover:underline">Forgot?</button>
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-3 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold disabled:opacity-60">
                {loading ? (<><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /></svg> Signing in...</>) : "Sign in to Dashboard"}
              </button>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/60 flex items-center justify-between text-xs text-gray-500">
            <div>Need account? Ask super-admin.</div>
            <div className="flex gap-2">
              <button type="button" onClick={handleCancel} className="px-3 py-1 rounded-md border text-sm">Close</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}