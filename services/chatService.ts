import { ChatMessage } from '../types';

// This is a MOCK service to simulate a real-time chat backend.

let nextMessageId = 1;
const mockMessages: ChatMessage[] = [];

// Listeners for real-time updates, mapping chatId to a callback function
const listeners = new Map<string, (message: ChatMessage) => void>();

export const chatService = {
    /**
     * Creates a consistent, order-independent chat ID for two users.
     */
    getChatId(user1: string, user2: string): string {
        return [user1, user2].sort().join('--');
    },

    /**
     * Retrieves the message history for a given chat.
     */
    getChatHistory(user1: string, user2: string): Promise<ChatMessage[]> {
        return new Promise(resolve => {
            const chatId = this.getChatId(user1, user2);
            const history = mockMessages.filter(msg => {
                const msgChatId = this.getChatId(msg.sender, msg.receiver);
                return msgChatId === chatId;
            });
            setTimeout(() => resolve(history), 200); // Simulate network delay
        });
    },
    
    /**
     * Sends a new message and notifies any active listeners.
     */
    sendMessage(messageData: Omit<ChatMessage, 'id' | 'timestamp'>): void {
        const newMessage: ChatMessage = {
            ...messageData,
            id: nextMessageId++,
            timestamp: new Date(),
        };
        mockMessages.push(newMessage);

        // Notify listener if one is active for this chat
        const chatId = this.getChatId(messageData.sender, messageData.receiver);
        const listener = listeners.get(chatId);
        if (listener) {
            listener(newMessage);
        }
    },
    
    /**
     * Subscribes a component to receive real-time messages for a chat.
     */
    subscribe(chatId: string, callback: (message: ChatMessage) => void): void {
        listeners.set(chatId, callback);
    },
    
    /**
     * Unsubscribes from a chat to prevent memory leaks.
     */
    unsubscribe(chatId: string): void {
        listeners.delete(chatId);
    }
};
