import { supabase } from '../supabaseClient';
import { ChatMessage } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

// Manages active channels to prevent duplicates and allow unsubscribing
const activeChannels = new Map<string, RealtimeChannel>();

export const chatService = {
    /**
     * Creates a consistent, order-independent chat ID for two users.
     */
    getChatId(user1: string, user2: string): string {
        return ['chat', ...[user1, user2].sort()].join('--');
    },

    /**
     * Retrieves the message history for a given chat from the database.
     */
    async getChatHistory(user1: string, user2: string): Promise<ChatMessage[]> {
        const chatId = this.getChatId(user1, user2);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }
        return data as ChatMessage[];
    },
    
    /**
     * Sends a new message by inserting it into the database.
     */
    async sendMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
        const chatId = this.getChatId(messageData.sender, messageData.receiver);
        const { error } = await supabase.from('messages').insert([{
            chat_id: chatId,
            sender: messageData.sender,
            receiver: messageData.receiver,
            text: messageData.text,
        }]);

        if (error) {
            console.error('Error sending message:', error);
        }
    },
    
    /**
     * Subscribes a component to receive real-time messages for a chat.
     */
    subscribe(chatId: string, callback: (message: ChatMessage) => void): void {
        // If already subscribed, do nothing
        if (activeChannels.has(chatId)) {
            return;
        }

        const channel = supabase.channel(chatId);

        channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
                (payload) => {
                    callback(payload.new as ChatMessage);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Successfully subscribed to channel ${chatId}`);
                }
            });

        activeChannels.set(chatId, channel);
    },
    
    /**
     * Unsubscribes from a chat to prevent memory leaks and unnecessary connections.
     */
    unsubscribe(chatId: string): void {
        const channel = activeChannels.get(chatId);
        if (channel) {
            supabase.removeChannel(channel);
            activeChannels.delete(chatId);
            console.log(`Unsubscribed from channel ${chatId}`);
        }
    }
};