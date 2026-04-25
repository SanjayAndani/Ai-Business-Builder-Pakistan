import { GoogleGenAI, Type } from "@google/genai";
import { BusinessPlanResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateBusinessPlan(params: {
  idea: string;
  city: string;
  budget: string;
  audience: string;
  style: string;
  format: string;
}): Promise<BusinessPlanResponse> {
  const { idea, city, budget, audience, style, format } = params;

  const prompt = `
    You are an expert startup consultant and senior developer focused on the Pakistani market.
    Generate a comprehensive business starter pack based on the following input:
    - Business Idea: ${idea}
    - City: ${city}
    - Budget: ${budget}
    - Target Audience: ${audience}
    - Style: ${style}
    - Website Format: ${format}

    RULES:
    1. Tailor all advice for Pakistan (PKR pricing, local trends, cities).
    2. Use a mix of English and Roman Urdu where appropriate for marketing.
    3. Ensure the business plan is realistic and executable.
    4. For the code section:
       - If format is "HTML", you MUST generate separate files: "index.html", "style.css", and "script.js". "index.html" must link to the other two.
       - If format is "Next.js", you MUST generate: "app/page.jsx" and "app/globals.css". Use the App Router pattern.
    5. Return ONLY a valid JSON object.

    OUTPUT STRUCTURE AND TYPES:
    - brand: names (array of strings), taglines (array of strings), positioning (string)
    - plan: audience (string), productIdea (string), pricing (string), launch (string), risks (array of strings), growth (array of strings)
    - marketing: captions (array of strings), adCopy (string), hashtags (array of strings), slogans (array of strings)
    - website: hero (string), subheading (string), about (string), services (array of strings), cta (string), contact (string), faq (array of {q, a})
    - financials: startupCosts (array of {item, amount}), monthlyExpenses (array of {item, amount}), revenueTargets (string)
    - analysis: swot (object: strengths, weaknesses, opportunities, threats), competitors (array of {name, description})
    - operations: legal (array of strings), team (array of strings), timeline (array of {week: string, tasks: array of strings})
    - code: files (array of {name, content, language})
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("No response string received from Gemini");
  }
  
  const data = JSON.parse(extractJson(responseText)) as BusinessPlanResponse;

  // Call backend to format files
  try {
    const formatResponse = await fetch('/api/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files: data.code.files }),
    });
    if (formatResponse.ok) {
      const formatData = await formatResponse.json();
      data.code.files = formatData.files;
    }
  } catch (e) {
    console.warn("Formatting failed (continuing with raw output):", e);
  }

  return data;
}

function extractJson(str: string): string {
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) return str;
  return str.substring(firstBrace, lastBrace + 1);
}

export async function generateLogo(brandName: string, positioning: string, businessIdea?: string): Promise<string> {
  const prompt = `Professional minimalist logo icon for a Pakistani startup called "${brandName}". 
  Business Concept: ${businessIdea || 'Startup'}.
  Positioning: ${positioning}. 
  Style: High-quality vector-style icon, centered, clean lines, minimalist, symbols relevant to the business idea and concept, white background. 
  Avoid text inside the logo icon.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: "1:1"
      }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("Failed to generate logo");
}
