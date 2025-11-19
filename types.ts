export enum Severity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

export interface PortStatus {
  port: string;
  status: 'UP' | 'DOWN' | 'FLAPPING' | 'UNKNOWN';
  details?: string;
}

export interface DashboardData {
  totalLogs: number;
  severityCounts: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
  topEvents: ChartData[];
  detectedAnomalies: string[];
  portStatuses: PortStatus[];
}

export interface AnalysisResult {
  dashboardData: DashboardData;
  reportMarkdown: string;
}

export interface HistoryEntry {
  id: string;
  created_at: string;
  raw_log: string;
  dashboard_data: DashboardData;
  report_markdown: string;
  summary_title?: string;
}