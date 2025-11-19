import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, ShieldAlert, Activity, Server, CheckCircle } from 'lucide-react';
import { StatCard } from './StatCard';

interface DashboardProps {
  data: AnalysisResult;
}

const COLORS = ['#3b82f6', '#eab308', '#f97316', '#ef4444']; // Blue, Yellow, Orange, Red

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const { dashboardData } = data;
  
  const severityData = [
    { name: 'Info', value: dashboardData.severityCounts.info, fill: '#3b82f6' },
    { name: 'Warning', value: dashboardData.severityCounts.warning, fill: '#eab308' },
    { name: 'Error', value: dashboardData.severityCounts.error, fill: '#f97316' },
    { name: 'Critical', value: dashboardData.severityCounts.critical, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Logs" 
          value={dashboardData.totalLogs} 
          icon={<Server size={24} />} 
          colorClass="text-slate-200"
        />
        <StatCard 
          title="Critical Issues" 
          value={dashboardData.severityCounts.critical} 
          icon={<ShieldAlert size={24} />} 
          colorClass="text-red-500"
        />
        <StatCard 
          title="Warnings" 
          value={dashboardData.severityCounts.warning} 
          icon={<AlertTriangle size={24} />} 
          colorClass="text-yellow-400"
        />
        <StatCard 
          title="Detected Anomalies" 
          value={dashboardData.detectedAnomalies.length} 
          icon={<Activity size={24} />} 
          colorClass="text-orange-400"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Severity Distribution */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-blue-400"/> Log Severity Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Events */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-emerald-400"/> Top Event Types
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dashboardData.topEvents}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#334155', opacity: 0.4}}
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Port Status & Anomalies Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Port Status */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4">Port Status Monitor</h3>
          {dashboardData.portStatuses.length > 0 ? (
             <div className="overflow-x-auto">
             <table className="w-full text-sm text-left text-slate-300">
               <thead className="text-xs text-slate-400 uppercase bg-slate-700/50">
                 <tr>
                   <th className="px-4 py-3">Port</th>
                   <th className="px-4 py-3">Status</th>
                   <th className="px-4 py-3">Details</th>
                 </tr>
               </thead>
               <tbody>
                 {dashboardData.portStatuses.map((port, idx) => (
                   <tr key={idx} className="border-b border-slate-700 hover:bg-slate-700/30">
                     <td className="px-4 py-3 font-medium text-white">{port.port}</td>
                     <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold
                          ${port.status === 'UP' ? 'bg-emerald-500/20 text-emerald-400' : 
                            port.status === 'DOWN' ? 'bg-red-500/20 text-red-400' : 
                            port.status === 'FLAPPING' ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-600 text-slate-200'
                          }`}>
                          {port.status}
                        </span>
                     </td>
                     <td className="px-4 py-3 text-slate-400 truncate max-w-[150px]">{port.details || '-'}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <CheckCircle size={32} className="mb-2 opacity-50"/>
              <p>No port status changes detected</p>
            </div>
          )}
        </div>

        {/* Anomalies List */}
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-md">
          <h3 className="text-lg font-semibold text-white mb-4 text-red-400">Detected Anomalies</h3>
          {dashboardData.detectedAnomalies.length > 0 ? (
            <ul className="space-y-3">
              {dashboardData.detectedAnomalies.map((anomaly, idx) => (
                <li key={idx} className="flex items-start gap-3 p-3 rounded bg-red-500/10 border border-red-500/20">
                  <ShieldAlert className="text-red-500 min-w-[20px]" size={20} />
                  <span className="text-slate-200 text-sm">{anomaly}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
              <CheckCircle size={32} className="mb-2 opacity-50"/>
              <p>No anomalies detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
