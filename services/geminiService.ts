import { supabase } from '../supabaseClient';

export const geminiService = {
    getHelpResponse: async (prompt: string): Promise<string> => {
        try {
            const { data, error } = await supabase.functions.invoke('gemini-service', {
                body: { type: 'help', prompt }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            return data.text;
        } catch (error: any) {
            console.error("Error calling Gemini service for Help:", error);
            const errorMessage = error.context?.json ? (await error.context.json()).error : error.message;
            return `Sorry, I couldn't connect to the help service at the moment. Please try again later.`;
        }
    },

    getChatAIResponse: async (prompt: string): Promise<string> => {
        try {
            const { data, error } = await supabase.functions.invoke('gemini-service', {
                body: { type: 'chat', prompt }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data.text;
        } catch (error: any) {
            console.error("Error calling Gemini service for Chat:", error);
            return `I'm sorry, I'm having trouble connecting right now.`;
        }
    },
};
