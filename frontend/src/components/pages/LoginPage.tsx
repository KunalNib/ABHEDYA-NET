import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEEDED_USERS } from '../../services/authService';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@defence.local');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (userEmail: string, role: string) => {
    setEmail(userEmail);
    setPassword(`${role.toLowerCase()}123`);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] bg-node-grid text-slate-100 flex items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-2xl shadow-xl shadow-orange-950/50 mb-2">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white uppercase">
            ABHEDYA-NET
          </h1>
          <p className="text-xs text-orange-400 font-bold uppercase tracking-wider">
            Secure Command Center Authentication
          </p>
        </div>

        {/* Quick Demo User Preset Selector */}
        <div className="p-3 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-orange-400" />
            <span>Quick Demo Role Login Presets</span>
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            {SEEDED_USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectDemoUser(u.email, u.role)}
                className={`px-2.5 py-1.5 rounded-xl border text-left transition-all ${
                  email === u.email
                    ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="truncate font-bold text-white">{u.role}</div>
                <div className="text-[9px] text-slate-500 truncate">{u.email}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 uppercase font-bold">Email or Operator ID</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@defence.local"
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500/60 font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-400 uppercase font-bold">Security Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[10px] text-orange-400 hover:underline"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500/60 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-orange-500 focus:ring-0"
              />
              <span>Remember Session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-orange-950/50 flex items-center justify-center space-x-2"
          >
            {loading ? <span>AUTHENTICATING...</span> : <span>SIGN IN TO COMMAND CENTER</span>}
          </button>
        </form>

        {/* Environment Badge Footer */}
        <div className="pt-4 border-t border-slate-800/80 text-center">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
            Environment: <strong className="text-orange-400 font-bold">LOCAL DEFENCE LAB</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
