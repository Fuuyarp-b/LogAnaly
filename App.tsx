import React, { useState, useEffect } from 'react';
import { Activity, Terminal, Upload, Play, RefreshCw, FileText, LayoutDashboard, History, Database, AlertCircle } from 'lucide-react';
import { analyzeLogs } from './services/geminiService';
import { saveAnalysisToHistory, fetchHistory, isSupabaseConfigured } from './services/supabaseService';
import { AnalysisResult, HistoryEntry } from './types';
import { Dashboard } from './components/Dashboard';
import { ReportView } from './components/ReportView';

const DEMO_LOG = `Mar 1 10:00:01 Switch-Core-01 %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
Mar 1 10:00:03 Switch-Core-01 %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to up
Mar 1 10:05:12 Firewall-Edge %SEC-4-IP-SPOOF: Source IP 192.168.1.200 MAC aaaa.bbbb.cccc on interface eth1 is spoofing
Mar 1 10:10:00 Router-Main %CPU-3-HIGH: CPU utilization is 95% for 5 minutes
Mar 1 10:15:22 AP-Floor2 %DOT11-4-MAX_CLIENTS: Max clients reached on SSID "Guest-Wifi"
Mar 1 10:20:05 Switch-Access-05 %STP-2-DISPUTE: Dispute detected on interface Gi0/24, port inconsistent
Mar 1 10:20:05 Switch-Access-05 %SPANTREE-2-BLOCK_PVID_PEER: Blocking Gi0/24 on VLAN0010. Inconsistent peer vlan.`;

function App() {
  const [logInput, setLogInput] = useState<string>(DEMO_LOG);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [error, setError] = useState<string | null>(null);
  
  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Load history on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      loadHistory();
    }
  }, []);

  const loadHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!logInput.trim()) {
      setError("กรุณาใส่ข้อมูล Log ก่อนเริ่มการวิเคราะห์");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. Analyze with Gemini
      const data = await analyzeLogs(logInput);
      setResult(data);
      setActiveTab('dashboard');

      // 2. Save to Supabase (if configured)
      if (isSupabaseConfigured()) {
        try {
          await saveAnalysisToHistory(logInput, data);
          await loadHistory(); // Refresh list
        } catch (saveError) {
          console.error("Error saving to DB:", saveError);
          // Don't block the UI, just log error
        }
      }

    } catch (err: any) {
      console.error(err);
      setError("เกิดข้อผิดพลาดในการวิเคราะห์: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    setLogInput(entry.raw_log);
    setResult({
      dashboardData: entry.dashboard_data,
      reportMarkdown: entry.report_markdown
    });
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-12">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
              <Terminal className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">NetLog Insight AI</h1>
              <p className="text-xs text-slate-400">Intelligent Network Forensics</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
             {isSupabaseConfigured() ? (
               <div className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Database size={12} /> Database Connected
               </div>
             ) : (
               <div className="text-xs px-3 py-1 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600 flex items-center gap-1">
                  <AlertCircle size={12} /> Local Mode
               </div>
             )}
             <div className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Ready
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Log Input & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Log Input Card */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Upload size={16} /> Input Logs
                </label>
                <button 
                  onClick={() => setLogInput('')}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Clear
                </button>
              </div>
              <textarea
                className="w-full h-[250px] bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm font-mono text-emerald-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                placeholder="Paste your network logs here..."
                value={logInput}
                onChange={(e) => setLogInput(e.target.value)}
              ></textarea>
              
              <div className="mt-4">
                 {error && (
                   <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                     {error}
                   </div>
                 )}
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white shadow-lg transition-all flex items-center justify-center gap-2
                    ${isLoading 
                      ? 'bg-slate-700 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 active:scale-[0.98]'
                    }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} /> Analyzing...
                    </>
                  ) : (
                    <>
                      <Play size={20} /> Analyze Logs
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-slate-500 mt-2">
                  Powered by Gemini 2.5 Flash
                </p>
              </div>
            </div>

            {/* History Card */}
            {isSupabaseConfigured() && (
              <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[400px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
                  <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <History size={16} /> Recent Analysis
                  </h3>
                  <button onClick={loadHistory} className="text-slate-500 hover:text-blue-400">
                    <RefreshCw size={14} className={isHistoryLoading ? "animate-spin" : ""} />
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                  {history.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-4">No history found</p>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="w-full text-left p-3 rounded hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700 group"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-slate-300 truncate w-4/5 group-hover:text-blue-400">
                            {item.summary_title || "Untitled Log"}
                          </span>
                          <span className={`w-2 h-2 rounded-full mt-1 ${
                             item.dashboard_data.severityCounts.critical > 0 ? 'bg-red-500' :
                             item.dashboard_data.severityCounts.error > 0 ? 'bg-orange-500' :
                             'bg-emerald-500'
                          }`}></span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                           <span>{new Date(item.created_at).toLocaleString('th-TH')}</span>
                           <span>{item.dashboard_data.totalLogs} lines</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="space-y-6">
                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      activeTab === 'dashboard' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <LayoutDashboard size={16} /> Dashboard
                  </button>
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      activeTab === 'report' 
                        ? 'border-blue-500 text-blue-400' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText size={16} /> Detailed Report
                  </button>
                </div>

                {/* Tab Content */}
                <div className="animate-fade-in">
                  {activeTab === 'dashboard' ? (
                    <Dashboard data={result} />
                  ) : (
                    <ReportView markdown={result.reportMarkdown} />
                  )}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <div className="bg-slate-800 p-4 rounded-full mb-4">
                  <Activity className="text-slate-600" size={40} />
                </div>
                <h3 className="text-xl font-medium text-slate-300 mb-2">Ready to Analyze</h3>
                <p className="text-slate-500 text-center max-w-md px-4 mb-6">
                  Paste your network device logs (Cisco IOS, Firewall, Linux Syslog) on the left and click "Analyze Logs" to get AI-powered insights.
                </p>
                {!isSupabaseConfigured() && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-xs text-yellow-200 max-w-sm text-center">
                    Tip: Connect Supabase in env vars to enable cloud history storage.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;