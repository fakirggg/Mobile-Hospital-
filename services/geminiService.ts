
import { GoogleGenAI } from "@google/genai";

export const generateProductDescription = async (name: string, condition: string, category: string): Promise<string> => {
  try {
    // Initialize inside function to ensure API key is available and correctly scoped
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, professional, and catchy 1-2 sentence description for a second-hand ${category} named "${name}" in "${condition}" condition for a shop catalog. Mention that it's a great deal. Use simple English.`,
    });
    
    // Accessing .text property as per rules
    return response.text || "Quality product available at a great price.";
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return "Premium quality product available at the best market price. Limited stock!";
  }
};
