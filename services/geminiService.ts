import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from "../types";

// Helper to securely get the API Key compatible with Vite and standard Node environments
const getApiKey = (): string => {
  // Priority 1: Vite Standard (import.meta.env.VITE_API_KEY)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
    // @ts-ignore
    return import.meta.env.VITE_API_KEY;
  }

  // Priority 2: Standard process.env (for non-Vite environments or custom defines)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }

  return '';
};

const API_KEY = getApiKey();

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const analyzeLogs = async (logContent: string): Promise<AnalysisResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables (VITE_API_KEY).");
  }

  const modelId = 'gemini-2.5-flash';

  const systemInstruction = `
    คุณคือผู้เชี่ยวชาญด้าน Network Engineering และ Security Analyst 
    หน้าที่ของคุณคือวิเคราะห์ Log ของอุปกรณ์เครือข่าย (Router, Switch, Firewall, ฯลฯ)
    
    วิเคราะห์ตามหัวข้อต่อไปนี้:
    1. เหตุการณ์สำคัญ, ใครทำอะไร (IP/User), ที่ไหน, เมื่อไหร่, อย่างไร
    2. สถานะพอร์ต (Up/Down/Flapping)
    3. ความผิดปกติ (Unauthorized, Floods, DHCP errors, STP changes, High CPU, etc.)
    4. ให้คำแนะนำในการแก้ไข
    
    Output จะต้องเป็น JSON Object เท่านั้น โดยมีโครงสร้างตาม Schema ที่กำหนด
    
    สำหรับ field 'reportMarkdown' ให้เขียนรายงานสรุปแบบ Markdown ภาษาไทยที่สวยงาม อ่านง่าย โดยใช้หัวข้อดังนี้:
    - 🔍 สรุปเหตุการณ์สำคัญ
    - 👤 ใครทำอะไร (IP / MAC / Username)
    - 🔌 สถานะพอร์ต Up/Down
    - ⚠️ ความผิดปกติที่ตรวจพบ
    - 🛠 คำแนะนำในการแก้ไข
    - 🧩 ความเสี่ยงหรือผลกระทบ
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: logContent,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dashboardData: {
              type: Type.OBJECT,
              properties: {
                totalLogs: { type: Type.INTEGER, description: "Estimated total number of log lines processed" },
                severityCounts: {
                  type: Type.OBJECT,
                  properties: {
                    info: { type: Type.INTEGER },
                    warning: { type: Type.INTEGER },
                    error: { type: Type.INTEGER },
                    critical: { type: Type.INTEGER },
                  },
                  required: ["info", "warning", "error", "critical"]
                },
                topEvents: {
                  type: Type.ARRAY,
                  description: "Top 5 most frequent event types for charts",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      value: { type: Type.INTEGER }
                    },
                    required: ["name", "value"]
                  }
                },
                detectedAnomalies: {
                  type: Type.ARRAY,
                  description: "List of critical anomalies found",
                  items: { type: Type.STRING }
                },
                portStatuses: {
                  type: Type.ARRAY,
                  description: "Status of relevant ports mentions in logs",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      port: { type: Type.STRING },
                      status: { type: Type.STRING, enum: ["UP", "DOWN", "FLAPPING", "UNKNOWN"] },
                      details: { type: Type.STRING }
                    },
                    required: ["port", "status"]
                  }
                }
              },
              required: ["totalLogs", "severityCounts", "topEvents", "detectedAnomalies", "portStatuses"]
            },
            reportMarkdown: {
              type: Type.STRING,
              description: "Full detailed analysis report in Markdown format (Thai language)"
            }
          },
          required: ["dashboardData", "reportMarkdown"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("No response from AI");
    }

    const result: AnalysisResult = JSON.parse(textResponse);
    return result;

  } catch (error) {
    console.error("Error analyzing logs:", error);
    throw error;
  }
};