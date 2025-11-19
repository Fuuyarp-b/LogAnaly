import { createClient } from '@supabase/supabase-js';
import { AnalysisResult, HistoryEntry } from '../types';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
// We only initialize if keys are present to prevent crashing
export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY) 
  : null;

export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

export const saveAnalysisToHistory = async (
  rawLog: string,
  result: AnalysisResult
): Promise<HistoryEntry | null> => {
  if (!supabase) {
    console.warn("Supabase not configured. Skipping save.");
    return null;
  }

  // Extract a simple title from anomalies or top events for the list view
  const title = result.dashboardData.detectedAnomalies.length > 0 
    ? `Anomaly: ${result.dashboardData.detectedAnomalies[0]}`
    : `Log Analysis (${result.dashboardData.totalLogs} lines)`;

  const { data, error } = await supabase
    .from('analysis_history')
    .insert([
      { 
        raw_log: rawLog, 
        dashboard_data: result.dashboardData,
        report_markdown: result.reportMarkdown,
        summary_title: title
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving analysis:', error);
    throw error;
  }

  return data as HistoryEntry;
};

export const fetchHistory = async (): Promise<HistoryEntry[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching history:', error);
    throw error;
  }

  return data as HistoryEntry[];
};