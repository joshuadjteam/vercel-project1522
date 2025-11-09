
import { GoogleGenAI } from "@google/genai";

export const geminiService = {
    getHelpResponse: async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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