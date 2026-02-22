import { DashboardMetrics, Product } from "../types";

const apiKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
const model = (import.meta as any).env?.VITE_AI_MODEL || 'google/gemini-2.0-flash-exp:free';

export const getDashboardInsights = async (
    metrics: DashboardMetrics,
    recentIncidents: string
): Promise<string> => {
    if (!apiKey) return "OpenRouter API Key not configured. Please set VITE_OPENROUTER_API_KEY in .env";

    const prompt = `
    You are an intelligent admin assistant for Unimarket, a student-to-student marketplace.
    Analyze the following dashboard metrics and provide a concise, bulleted executive summary.
    Highlight any anomalies, positive trends, or areas needing attention.

    Metrics:
    - Total Users: ${metrics.users}
    - Active Listings: ${metrics.activeListings}
    - Total Revenue: KSH ${metrics.totalRevenue}
    - Weekly Revenue Trend: ${JSON.stringify(metrics.revenueByDay)}
    - Category Shares: ${JSON.stringify(metrics.categoryShares)}

    Recent Context: ${recentIncidents}

    Keep the tone professional yet actionable. Limit to 3 key insights and 1 recommendation.
    Strictly use Markdown for formatting.
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Unimarket Admin Dashboard",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "No insights generated.";
    } catch (error) {
        console.error("OpenRouter API Error:", error);
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

      Return ONLY a JSON object with "safe" (boolean) and "reason" (string).
      Example: {"safe": true, "reason": "Appropriate listing"}
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Unimarket Admin Dashboard",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    { "role": "user", "content": prompt }
                ],
                "response_format": { "type": "json_object" }
            })
        });

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error("OpenRouter Safety Analysis Error:", e);
        return { safe: true, reason: "AI Analysis Failed" };
    }
}
