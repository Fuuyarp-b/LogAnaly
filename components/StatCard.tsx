import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass = "text-blue-400" }) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-md flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-slate-900 ${colorClass}`}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
      </div>
    </div>
  );
};
