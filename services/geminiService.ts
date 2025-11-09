

import { GoogleGenAI } from "@google/genai";

const API_KEY_ERROR_MESSAGE = "Gemini API key not configured. Please set the API_KEY environment variable.";

export const geminiService = {
    getHelpResponse: async (prompt: string): Promise<string> => {
        if (!process.env.API_KEY) {
            console.error(API_KEY_ERROR_MESSAGE);
            return "The AI help service is currently unavailable due to a configuration issue.";
        }
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
    },

    getAIPersonaResponse: async (prompt: string, persona: string): Promise<string> => {
        if (!process.env.API_KEY) {
            console.error(API_KEY_ERROR_MESSAGE);
            return "I'm sorry, the AI service is not configured correctly.";
        }
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: `You are ${persona}. Be friendly, helpful, and keep your responses conversational and relatively brief.`,
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API for persona response:", error);
            return "I'm sorry, I'm having trouble connecting right now.";
        }
    },
};