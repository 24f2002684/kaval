import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, CloudRain, Users, Send,
  Smartphone, History, Database, Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Command Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'SEER Flood Engine', path: '/seer', icon: CloudRain },
  { name: 'VULN Households', path: '/vuln', icon: Users },
  { name: 'DISPATCH Operations', path: '/dispatch', icon: Send },
  { name: 'Citizen Portal', path: '/citizen', icon: Smartphone },
  { name: '2015 Historical Replay', path: '/replay', icon: History },
  { name: 'Model Transparency', path: '/transparency', icon: Database },
  { name: 'Settings & Config', path: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-800 flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="p-4 space-y-1.5">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-2">
          INTELLIGENCE ENGINES
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal text-white shadow-sm'
                    : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-4 border-t border-navy-800 text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span>Engines State:</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SEER • VULN • DISP
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono">
          v1.2.0-prod | CipherCop 2026
        </div>
      </div>
    </aside>
  );
};
