import { DashboardMetrics, Product } from "../types";

const LS_KEY = 'unimart_openrouter_key';
const LS_MODEL = 'unimart_ai_model';
const DEFAULT_MODEL = 'google/gemini-2.0-flash-exp:free';
const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

// Read at call-time so Settings changes take effect immediately without a reload
export const getApiKey = (): string =>
    localStorage.getItem(LS_KEY) ||
    (import.meta as any).env?.VITE_OPENROUTER_API_KEY ||
    '';

export const setApiKey = (key: string) => {
    if (key.trim()) localStorage.setItem(LS_KEY, key.trim());
    else localStorage.removeItem(LS_KEY);
};

export const getModel = (): string =>
    localStorage.getItem(LS_MODEL) ||
    (import.meta as any).env?.VITE_AI_MODEL ||
    DEFAULT_MODEL;

export const setModel = (model: string) => {
    if (model.trim()) localStorage.setItem(LS_MODEL, model.trim());
    else localStorage.removeItem(LS_MODEL);
};

const baseHeaders = () => ({
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Unimarket Admin Dashboard',
});

// Strip markdown code fences that some models wrap JSON in
const extractJSON = (text: string): string => {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return fenced ? fenced[1].trim() : text.trim();
};

export const testApiKey = async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key.trim()}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.origin,
                'X-Title': 'Unimarket Admin Dashboard',
            },
            body: JSON.stringify({
                model: getModel(),
                messages: [{ role: 'user', content: 'Reply with the single word OK.' }],
                max_tokens: 5,
            }),
        });

        if (res.status === 401) return { success: false, error: 'Invalid API key — authentication rejected.' };
        if (res.status === 429) return { success: false, error: 'Rate limit reached — key is valid but throttled.' };
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return { success: false, error: body?.error?.message || `HTTP ${res.status}` };
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || 'Network error — check your connection.' };
    }
};

export const getDashboardInsights = async (
    metrics: DashboardMetrics,
    recentIncidents: string,
): Promise<string> => {
    const key = getApiKey();
    if (!key) {
        return '__NO_KEY__';
    }

    const prompt = `You are an intelligent admin assistant for Unimarket, a student-to-student marketplace.
Analyze the following dashboard metrics and provide a concise executive summary.
Highlight anomalies, positive trends, or areas needing attention.

Metrics:
- Total Users: ${metrics.users}
- Active Listings: ${metrics.activeListings}
- Total Revenue: KSH ${metrics.totalRevenue}
- Weekly Revenue Trend: ${JSON.stringify(metrics.revenueByDay)}
- Category Shares: ${JSON.stringify(metrics.categoryShares)}

Recent Context: ${recentIncidents}

Tone: professional and actionable.
Format: exactly 3 key insights as bullet points, then 1 recommendation. Use Markdown.`;

    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || 'No insights generated.';
};

export const analyzeListingForSafety = async (
    product: Product,
): Promise<{ safe: boolean; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'; reasoning: string; suggestedAction: string }> => {
    const key = getApiKey();
    if (!key) {
        return { safe: true, riskLevel: 'LOW', reasoning: 'AI service not configured.', suggestedAction: 'Configure OpenRouter API key in Settings.' };
    }

    const prompt = `Analyze this product listing for a university student marketplace.
Title: ${product.title}
Category: ${product.category}
Price: KSH ${product.price}
Description: ${product.description || '(none)'}

Assess: Is it appropriate for a university marketplace? Flag anything suspicious (counterfeit goods, dangerous items, inflated pricing, etc.).

Return ONLY a valid JSON object with these exact keys:
- "safe": boolean
- "riskLevel": one of "LOW", "MEDIUM", "HIGH"
- "reasoning": short explanation (1-2 sentences)
- "suggestedAction": one clear admin action ("Approve", "Review Manually", "Remove Immediately", etc.)`;

    const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: baseHeaders(),
        body: JSON.stringify({
            model: getModel(),
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });

    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || `API error ${res.status}`);
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(extractJSON(raw));

    return {
        safe: parsed.safe ?? true,
        riskLevel: parsed.riskLevel ?? 'LOW',
        reasoning: parsed.reasoning ?? 'Analysis unavailable.',
        suggestedAction: parsed.suggestedAction ?? 'Review Manually',
    };
};
