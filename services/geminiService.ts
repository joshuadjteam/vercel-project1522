

import { GoogleGenAI, Modality } from "@google/genai";

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
    },

    getAIPersonaResponse: async (prompt: string, persona: string): Promise<string> => {
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

    getAITextToSpeech: async (text: string): Promise<string | null> => {
        try {
            if (!text || text.trim() === '') {
                console.error("TTS input text is empty.");
                return null;
            }
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash-preview-tts",
                contents: [{ parts: [{ text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: {
                          prebuiltVoiceConfig: { voiceName: 'Kore' },
                        },
                    },
                },
            });

            // More robustly find the audio data by iterating through response parts
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData?.data) {
                    return part.inlineData.data;
                }
            }
            
            console.error("TTS response did not contain audio data.", JSON.stringify(response, null, 2));
            return null;

        } catch (error) {
            console.error("Error calling Gemini TTS API:", error);
            return null;
        }
    }
};