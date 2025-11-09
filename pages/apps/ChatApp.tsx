
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { chatService } from '../../services/chatService';
import { geminiService } from '../../services/geminiService';
import { User, ChatMessage } from '../../types';

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;

type AIMessage = {
    sender: 'user' | 'ai';
    text: string;
};

const ChatApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isAIChatActive, setIsAIChatActive] = useState(false);
    
    // State for P2P messages
    const [p2pMessages, setP2pMessages] = useState<ChatMessage[]>([]);
    
    // State for AI messages
    const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
    const [isAIResponding, setIsAIResponding] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentChatId = useRef<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await database.getUsers();
            setUsers(allUsers.filter(u => u.id !== currentUser?.id));
        };
        fetchUsers();
    }, [currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [p2pMessages, aiMessages]);

    const handleUserSelect = async (user: User) => {
        if (!currentUser) return;
        
        if (currentChatId.current) {
            chatService.unsubscribe(currentChatId.current);
        }
        
        setIsAIChatActive(false);
        setSelectedUser(user);
        const chatId = chatService.getChatId(currentUser.id, user.id);
        currentChatId.current = chatId;

        const history = await chatService.getChatHistory(currentUser.id, user.id);
        setP2pMessages(history);

        chatService.subscribe(chatId, (newMessagePayload) => {
            const sender = users.find(u => u.id === newMessagePayload.sender_id) || (currentUser.id === newMessagePayload.sender_id ? currentUser : null);
            const receiver = users.find(u => u.id === newMessagePayload.receiver_id) || (currentUser.id === newMessagePayload.receiver_id ? currentUser : null);

            if (sender && receiver) {
                const fullMessage: ChatMessage = {
                    id: newMessagePayload.id,
                    text: newMessagePayload.text,
                    timestamp: new Date(newMessagePayload.timestamp),
                    senderId: newMessagePayload.sender_id,
                    receiverId: newMessagePayload.receiver_id,
                    sender,
                    receiver
                };
                setP2pMessages(prevMessages => [...prevMessages, fullMessage]);
            }
        });
    };
    
    const handleAISelect = () => {
        if (currentChatId.current) {
            chatService.unsubscribe(currentChatId.current);
            currentChatId.current = null;
        }
        setSelectedUser(null);
        setIsAIChatActive(true);
        if (aiMessages.length === 0) {
            setAiMessages([{ sender: 'ai', text: "Hello! I'm Lynix, your friendly AI companion. How can I help you today?" }]);
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;

        if (isAIChatActive) {
            const userMessage: AIMessage = { sender: 'user', text: newMessage };
            setAiMessages(prev => [...prev, userMessage]);
            setNewMessage('');
            setIsAIResponding(true);

            try {
                const response = await geminiService.getAIPersonaResponse(newMessage, 'a friendly, supportive, and engaging conversational partner');
                const aiResponse: AIMessage = { sender: 'ai', text: response };
                setAiMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                 const errorResponse: AIMessage = { sender: 'ai', text: "Sorry, I'm having trouble connecting right now." };
                setAiMessages(prev => [...prev, errorResponse]);
            } finally {
                setIsAIResponding(false);
            }
        } else if (currentUser && selectedUser) {
            const optimisticMessage: ChatMessage = {
                id: Date.now(),
                text: newMessage,
                timestamp: new Date(),
                senderId: currentUser.id,
                receiverId: selectedUser.id,
                sender: currentUser,
                receiver: selectedUser,
            };
            setP2pMessages(prev => [...prev, optimisticMessage]);

            chatService.sendMessage({
                senderId: currentUser.id,
                receiverId: selectedUser.id,
                text: newMessage,
            });
            setNewMessage('');
        }
    };

    const ChatWindowHeader = () => {
        if (isAIChatActive) {
            return <h2 className="text-xl font-bold">Chat with Lynix AI</h2>;
        }
        if (selectedUser) {
            return <h2 className="text-xl font-bold">Chat with {selectedUser.username}</h2>;
        }
        return null;
    }

    return (
        <div className="w-full max-w-6xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl text-light-text dark:text-white flex overflow-hidden">
            {/* User List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-teal-700/50">
                    <h2 className="text-xl font-bold">Contacts</h2>
                </div>
                <ul>
                     <li key="ai-contact">
                        <button
                            onClick={handleAISelect}
                            className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-teal-700/40 transition-colors ${isAIChatActive ? 'bg-teal-100 dark:bg-teal-600/50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">Lynix AI</p>
                                <span className="text-xs font-bold bg-indigo-500 text-white rounded-full px-2 py-0.5">AI</span>
                            </div>
                        </button>
                    </li>
                    {users.map(user => (
                        <li key={user.id}>
                            <button
                                onClick={() => handleUserSelect(user)}
                                className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-teal-700/40 transition-colors ${selectedUser?.id === user.id ? 'bg-teal-100 dark:bg-teal-600/50' : ''}`}
                            >
                                <p className="font-semibold">{user.username}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user.role}</p>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Chat Window */}
            <div className="w-2/3 flex flex-col">
                {selectedUser || isAIChatActive ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10">
                            <ChatWindowHeader />
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {/* Render P2P or AI messages */}
                            {isAIChatActive ? (
                                aiMessages.map((msg, index) => (
                                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-600 rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                p2pMessages.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.senderId === currentUser?.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-600 rounded-bl-none'}`}>
                                            <p className="text-sm">{msg.text}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isAIResponding && (
                                <div className="flex justify-start">
                                    <div className={`max-w-xs px-4 py-2 rounded-2xl bg-gray-200 dark:bg-slate-600 rounded-bl-none`}>
                                        <div className="flex items-center space-x-2">
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10">
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-grow bg-gray-200 dark:bg-slate-700 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={isAIResponding}
                                />
                                <button type="submit" className="ml-3 w-10 h-10 flex items-center justify-center bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-slate-500 text-white font-semibold" disabled={isAIResponding}>
                                    <SendIcon />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            <h2 className="text-2xl font-semibold">Select a user to start chatting</h2>
                            <p>Your conversations will appear here.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatApp;