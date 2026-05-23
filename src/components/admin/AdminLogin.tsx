import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLogin({ setToken }: { setToken: (token: string) => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'impura221') {
      setToken('admin-secure-token-x1');
    } else {
      setError('Password salah.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-sm p-8 rounded-2xl border border-[#ff1b2d]/20 bg-[#0a0a0a] shadow-[0_0_50px_rgba(255,27,45,0.05)] text-center relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#ff1b2d] rounded-full blur-[100px] opacity-10"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#ff1b2d] rounded-full blur-[100px] opacity-10"></div>
        
        <div className="relative z-10 w-16 h-16 bg-[#111] rounded-2xl mx-auto mb-6 flex items-center justify-center border border-neutral-800 shadow-[0_0_15px_rgba(255,27,45,0.1)]">
          <Lock className="w-8 h-8 text-[#ff1b2d]" />
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Admin Portal</h2>
        <p className="text-xs text-slate-400 mb-8 font-mono">Restricted Access Layer</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter Admin Passcode"
            className="w-full bg-[#111111] border border-neutral-800 text-center text-white rounded-xl py-3 px-4 outline-none focus:border-[#ff1b2d]/50 font-mono text-sm tracking-widest transition-all"
            autoFocus
          />
          {error && <p className="text-[#ff3b3b] text-xs font-medium animate-pulse">{error}</p>}
          <button 
            type="submit" 
            className="w-full py-3 rounded-xl bg-[#ff1b2d] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#ff3b3b] shadow-[0_0_20px_rgba(255,27,45,0.3)] transition-all"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}
