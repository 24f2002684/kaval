import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Shield, AlertTriangle, UserCheck, Radio, Home, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, role, demoSwitch, logout, selectedCity, setSelectedCity } = useAuth();
  const navigate = useNavigate();

  const handleRoleSwitch = (targetRole: UserRole) => {
    demoSwitch(targetRole);
    if (targetRole === 'citizen') {
      navigate('/citizen');
    }
  };

  return (
    <header className="bg-navy-900 text-white border-b border-navy-700 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center text-white shadow-md group-hover:bg-teal-bright transition">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xl tracking-wider text-white">KAVAL</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-teal/20 text-teal-bright px-1.5 py-0.5 rounded border border-teal/40">
                    CipherCop 2026
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 hidden md:block">
                  "Don't warn the city. Warn every doorstep."
                </p>
              </div>
            </Link>
          </div>

          {/* Pilot City Selector */}
          <div className="hidden lg:flex items-center gap-2 bg-navy-800 px-3 py-1.5 rounded-lg border border-navy-700">
            <span className="text-xs text-slate-400 font-medium">Pilot Zone:</span>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option value="Chennai" className="bg-navy-900 text-white">Chennai (Adyar & Velachery Basin)</option>
              <option value="Mumbai" className="bg-navy-900 text-white">Mumbai (Mithi River Basin)</option>
              <option value="Patna" className="bg-navy-900 text-white">Patna (Ganga River Floodplain)</option>
              <option value="Cuttack" className="bg-navy-900 text-white">Cuttack (Mahanadi River Basin)</option>
            </select>
          </div>

          {/* Judge Demo Role Switcher Bar */}
          <div className="flex items-center gap-1.5 bg-navy-800 p-1 rounded-xl border border-navy-700">
            <span className="text-[10px] font-bold text-slate-400 px-2 hidden sm:inline-block">
              JUDGE SWITCHER:
            </span>
            <button
              onClick={() => handleRoleSwitch('admin')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 ${
                role === 'admin'
                  ? 'bg-amber-warning text-navy-900 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
              title="Administrator Role"
            >
              Admin
            </button>
            <button
              onClick={() => handleRoleSwitch('officer')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 ${
                role === 'officer'
                  ? 'bg-teal-bright text-navy-900 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
              title="Disaster Management Officer"
            >
              Officer
            </button>
            <button
              onClick={() => handleRoleSwitch('responder')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 ${
                role === 'responder'
                  ? 'bg-emerald-500 text-navy-900 font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
              title="SDRF Field Responder"
            >
              Responder
            </button>
            <button
              onClick={() => handleRoleSwitch('citizen')}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1 ${
                role === 'citizen'
                  ? 'bg-red-danger text-white font-bold shadow'
                  : 'text-slate-300 hover:text-white hover:bg-navy-700'
              }`}
              title="Citizen Household Portal"
            >
              <Home className="w-3.5 h-3.5" />
              Citizen
            </button>
          </div>

          {/* User profile & quick actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-semibold text-white leading-tight">
                {user?.full_name?.split('(')[0] || 'User'}
              </span>
              <span className="text-[10px] text-teal-bright font-bold uppercase tracking-wider">
                {role}
              </span>
            </div>

            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white hover:bg-navy-800 rounded-lg transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
