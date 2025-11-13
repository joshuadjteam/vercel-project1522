import { GoogleGenAI } from "@google/genai";

export const geminiService = {
    getHelpResponse: async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: 'AIzaSyDvjSSIE0APdtxhX0VHUsr7iDTmyG_zfuM' });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    systemInstruction: "You are a helpful and friendly customer support agent for a company called Lynix. Your goal is to assist users with their questions about the Lynix portal, its features (like Phone, Chat, Mail), billing, and account management. Keep your responses concise and to the point.",
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API for Help:", error);
            // In a real app, you might want more sophisticated error handling
            return "Sorry, I couldn't connect to the help service at the moment. Please try again later.";
        }
    },

    getChatAIResponse: async (prompt: string): Promise<string> => {
        try {
            const ai = new GoogleGenAI({ apiKey: 'AIzaSyB8rqjikxDbrcHR3KKChEnFfBwY3B6OKzw' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    systemInstruction: "You are LynxAI, a helpful and friendly AI assistant for a company called Lynix. Your goal is to assist users with their questions about the Lynix portal, its features (like Phone, Chat, Mail), billing, and account management. Keep your responses concise and conversational.",
                }
            });
            return response.text;
        } catch (error) {
            console.error("Error calling Gemini API for Chat:", error);
            return "I'm sorry, I'm having trouble connecting right now.";
        }
    },
};
