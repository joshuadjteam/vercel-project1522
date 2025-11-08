import { supabase } from '../supabaseClient';
import { ChatMessage, User } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

const activeChannels = new Map<string, RealtimeChannel>();

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
    getChatId(userId1: number, userId2: number): string {
        return ['chat', ...[userId1, userId2].sort()].join('--');
    },

    async getChatHistory(currentUserId: number, otherUserId: number): Promise<ChatMessage[]> {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: {
                resource: 'chatHistory',
                action: 'get',
                payload: { currentUserId, otherUserId }
            }
        });

        if (error || data.error) {
            console.error('Error fetching chat history via function:', error || data.error);
            return [];
        }

        const messages = data.history.map((msg: any) => {
            const sender = mapDbUserToUser(msg.sender);
            const receiver = mapDbUserToUser(msg.receiver);

            if (!sender || !receiver) {
                console.warn(`Skipping message ${msg.id} due to missing user profile.`);
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
    
    unsubscribe(chatId: string): void {
        const channel = activeChannels.get(chatId);
        if (channel) {
            supabase.removeChannel(channel);
            activeChannels.delete(chatId);
            console.log(`Unsubscribed from channel ${chatId}`);
        }
    }
};