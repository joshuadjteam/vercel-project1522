import { GoogleGenAI } from "@google/genai";

// User-provided API Key to ensure the AI feature is functional as requested.
// In a production environment, this should be managed via secure environment variables.
const GEMINI_API_KEY = "AIzaSyCvPM3A1IdxuczsncLX9RgmbuxytnC5yE0";

export const geminiService = {
    getHelpResponse: async (prompt: string): Promise<string> => {
        if (!GEMINI_API_KEY) {
            console.error("Gemini API key is not configured.");
            return "The AI help service is not configured. Please contact the administrator.";
        }
        
        try {
            const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: "You are a helpful and friendly customer support agent for a company called Lynix. Your goal is to assist users with their questions about the Lynix portal, its features (like Phone, Chat, Mail), billing, and account management. Keep your responses concise and to the point.",
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            // In a real app, you might want more sophisticated error handling
            return "Sorry, I couldn't connect to the help service at the moment. Please try again later.";
        }
    }
};