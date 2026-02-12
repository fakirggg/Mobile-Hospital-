
import { GoogleGenAI, Type } from "@google/genai";

// Always use process.env.API_KEY directly for initialization as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductDescription = async (name: string, condition: string, category: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional, and catchy 1-2 sentence description for a second-hand ${category} named "${name}" in "${condition}" condition for a shop catalog. Mention that it's a great deal. Use simple English.`,
    });
    // Use .text property directly (not a method)
    return response.text || "Quality product available at a great price.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Great value for money. Limited stock available.";
  }
};
