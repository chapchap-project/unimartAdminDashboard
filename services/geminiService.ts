import { GoogleGenAI } from "@google/genai";
import { DashboardMetrics, Product, User } from "../types";

const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getDashboardInsights = async (
  metrics: DashboardMetrics,
  recentIncidents: string
): Promise<string> => {
  if (!apiKey) return "API Key not configured. Please set process.env.API_KEY.";

  const prompt = `
    You are an intelligent admin assistant for Unimarket, a student-to-student marketplace.
    Analyze the following dashboard metrics and provide a concise, bulleted executive summary.
    Highlight any anomalies, positive trends, or areas needing attention (like disputes).

    Metrics:
    - Total Users: ${metrics.users}
    - Active Listings: ${metrics.activeListings}
    - Total Revenue: KSH ${metrics.totalRevenue}
    - Weekly Revenue Trend: ${JSON.stringify(metrics.revenueByDay)}
    - Category Shares: ${JSON.stringify(metrics.categoryShares)}

    Recent Context: ${recentIncidents}

    Keep the tone professional yet actionable. Limit to 3 key insights and 1 recommendation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate insights at this time. Please check API configuration.";
  }
};

export const analyzeListingForSafety = async (product: Product): Promise<{ safe: boolean; reason: string }> => {
  if (!apiKey) return { safe: true, reason: "AI service unavailable" };

  const prompt = `
      Analyze this product listing for a university marketplace. Is it appropriate and safe?
      Title: ${product.title}
      Category: ${product.category}
      Price: ${product.price}

      Return a JSON object with "safe" (boolean) and "reason" (string).
      Strictly output JSON.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { safe: true, reason: "AI Analysis Failed" };
  }
}