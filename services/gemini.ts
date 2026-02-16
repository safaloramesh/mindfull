
import { GoogleGenAI, Type } from "@google/genai";

export const aiAssistant = {
  async optimizeReminder(title: string, description: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a better title, description, and appropriate priority (LOW, MEDIUM, HIGH, URGENT) for this reminder: Title: "${title}", Description: "${description}". Keep it professional yet friendly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedDescription: { type: Type.STRING },
            suggestedPriority: { type: Type.STRING },
            category: { type: Type.STRING, description: "Work, Personal, Health, Finance, or Others" }
          },
          required: ["suggestedTitle", "suggestedDescription", "suggestedPriority", "category"]
        }
      }
    });

    try {
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("AI Parse Error", e);
      return null;
    }
  }
};
