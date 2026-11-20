import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  variant?: 'default' | 'danger' | 'warning' | 'teal';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeColor = 'bg-teal/20 text-teal-deep',
  variant = 'default'
}) => {
  const borderVariants = {
    default: 'border-slate-200',
    danger: 'border-l-4 border-l-red-danger border-slate-200',
    warning: 'border-l-4 border-l-amber-warning border-slate-200',
    teal: 'border-l-4 border-l-teal-bright border-slate-200'
  };

  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border ${borderVariants[variant]} flex flex-col justify-between transition hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-navy-800">
          <Icon className="w-5 h-5 text-teal" />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-navy-900 tracking-tight">{value}</span>
          {badge && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
              {badge}
            </span>
          )}
        </div>
        {subtext && <p className="text-xs text-slate-500 mt-1 font-medium">{subtext}</p>}
      </div>
    </div>
  );
};
