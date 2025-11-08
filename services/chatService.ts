
import { supabase } from '../supabaseClient';
import { ChatMessage, User } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

const activeChannels = new Map<string, RealtimeChannel>();

// Helper to map DB user to app User
const mapDbUserToUser = (dbUser: any): User => {
    if (!dbUser) return {} as User; // Or handle as an error
    return {
        id: dbUser.id,
        auth_id: dbUser.auth_id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        sipVoice: dbUser.sip_voice,
        features: dbUser.features,
    };
};

export const chatService = {
    /**
     * Creates a consistent, order-independent chat ID from two user IDs.
     */
    getChatId(userId1: number, userId2: number): string {
        return ['chat', ...[userId1, userId2].sort()].join('--');
    },

    /**
     * Retrieves the message history for a chat using Supabase, including sender and receiver user data.
     */
    async getChatHistory(userId1: number, userId2: number): Promise<ChatMessage[]> {
        const chatId = this.getChatId(userId1, userId2);
        
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:senderId(*),
                receiver:receiverId(*)
            `)
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }

        return data.map((msg: any) => ({
            id: msg.id,
            senderId: msg.senderId,
            receiverId: msg.receiverId,
            text: msg.text,
            timestamp: new Date(msg.timestamp),
            sender: mapDbUserToUser(msg.sender),
            receiver: mapDbUserToUser(msg.receiver),
        }));
    },
    
    /**
     * Sends a new message using Supabase.
     */
    async sendMessage(messageData: { senderId: number; receiverId: number; text: string }): Promise<void> {
        const chatId = this.getChatId(messageData.senderId, messageData.receiverId);
        
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                senderId: messageData.senderId,
                receiverId: messageData.receiverId,
                text: messageData.text,
            });
        
        if (error) {
            console.error('Error sending message:', error);
        }
    },
    
    /**
     * Subscribes to real-time messages for a chat from the 'chat_messages' table.
     */
    subscribe(chatId: string, callback: (message: any) => void): void {
        if (activeChannels.has(chatId)) {
            return;
        }

        const channel = supabase.channel(chatId);

        channel
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `chat_id=eq.${chatId}` },
                (payload) => {
                    callback(payload.new);
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
     * Unsubscribes from a chat to prevent memory leaks.
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