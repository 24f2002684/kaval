import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, Lock, Mail, ArrowRight, Radio, AlertTriangle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('officer@kaval.gov.in');
  const [password, setPassword] = useState('officer123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, demoSwitch } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: UserRole) => {
    setLoading(true);
    try {
      await demoSwitch(role);
      if (role === 'citizen') {
        navigate('/citizen');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Background Decorative Rings */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-teal/10 blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-bright/10 blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 z-10">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal flex items-center justify-center text-white shadow-xl shadow-teal/30 mb-4 border border-teal-bright/30">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-wider">
            KAVAL
          </h1>
          <p className="text-sm font-semibold text-teal-bright mt-1">
            "Don't warn the city. Warn every doorstep."
          </p>
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-teal-bright animate-ping"></span>
            <span>CipherCop 2026 • AI for Disaster Resilience</span>
          </div>
        </div>

        {/* Quick Demo Login Bar for Judges */}
        <div className="bg-navy-800/90 backdrop-blur-md rounded-2xl p-5 border border-navy-700 shadow-xl">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center justify-between">
            <span>⚡ JUDGING RAPID LOGIN (1-CLICK)</span>
            <span className="text-[10px] text-teal-bright font-mono">NO KEY NEEDED</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDemoLogin('admin')}
              className="py-2.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 text-amber-warning font-bold text-xs border border-amber-warning/30 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              👑 Administrator
            </button>
            <button
              onClick={() => handleDemoLogin('officer')}
              className="py-2.5 px-3 rounded-xl bg-teal hover:bg-teal-deep text-white font-bold text-xs border border-teal-bright/30 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              🛡️ Disaster Officer
            </button>
            <button
              onClick={() => handleDemoLogin('responder')}
              className="py-2.5 px-3 rounded-xl bg-navy-700 hover:bg-navy-600 text-emerald-400 font-bold text-xs border border-emerald-400/30 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              🚑 First Responder
            </button>
            <button
              onClick={() => handleDemoLogin('citizen')}
              className="py-2.5 px-3 rounded-xl bg-red-danger hover:bg-red-700 text-white font-bold text-xs border border-red-400/30 transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              🏠 Citizen Mobile
            </button>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <div className="bg-navy-800/60 backdrop-blur-md rounded-2xl p-6 border border-navy-700 shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-danger/20 border border-red-danger/40 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="officer@kaval.gov.in"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-teal transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-navy-900 border border-navy-700 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-teal transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal hover:bg-teal-bright text-navy-900 font-extrabold rounded-xl transition shadow-lg flex items-center justify-center gap-2 text-sm mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Command Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-slate-400">
          State Emergency Operations Center (SEOC) • Government of Tamil Nadu Pilot
        </div>

      </div>
    </div>
  );
};
