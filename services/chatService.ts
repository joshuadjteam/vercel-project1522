import { supabase } from '../supabaseClient';
import { ChatMessage, User } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

const activeChannels = new Map<string, RealtimeChannel>();

// Helper to map DB user to app User, assuming snake_case from DB
// Corrected to handle null inputs gracefully, aligning with the database service.
const mapDbUserToUser = (dbUser: any): User | null => {
    if (!dbUser) return null;
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
     * Uses snake_case for foreign key columns.
     * This is updated to be more resilient to data inconsistencies or RLS policies.
     */
    async getChatHistory(userId1: number, userId2: number): Promise<ChatMessage[]> {
        const chatId = this.getChatId(userId1, userId2);
        
        const { data, error } = await supabase
            .from('chat_messages')
            .select(`
                *,
                sender:sender_id(*),
                receiver:receiver_id(*)
            `)
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: true });

        if (error) {
            console.error('Error fetching chat history:', error);
            return [];
        }

        // Map snake_case from DB to camelCase for the app
        // Filter out any messages where the sender or receiver user could not be fetched.
        const messages = data.map((msg: any) => {
            const sender = mapDbUserToUser(msg.sender);
            const receiver = mapDbUserToUser(msg.receiver);

            if (!sender || !receiver) {
                console.warn(`Skipping chat message with ID ${msg.id} due to missing sender or receiver profile.`);
                return null;
            }

            return {
                id: msg.id,
                senderId: msg.sender_id,
                receiverId: msg.receiver_id,
                text: msg.text,
                timestamp: new Date(msg.timestamp),
                sender,
                receiver,
            };
        }).filter((msg): msg is ChatMessage => msg !== null);

        return messages;
    },
    
    /**
     * Sends a new message using Supabase.
     * Uses snake_case for column names in the insert payload.
     */
    async sendMessage(messageData: { senderId: number; receiverId: number; text: string }): Promise<void> {
        const chatId = this.getChatId(messageData.senderId, messageData.receiverId);
        
        const { error } = await supabase
            .from('chat_messages')
            .insert({
                chat_id: chatId,
                sender_id: messageData.senderId,
                receiver_id: messageData.receiverId,
                text: messageData.text,
            });
        
        if (error) {
            console.error('Error sending message:', error);
        }
    },
    
    /**
     * Subscribes to real-time messages for a chat from the 'chat_messages' table.
     * The payload received from Supabase will have snake_case keys.
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