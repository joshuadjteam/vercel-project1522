
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabaseService } from '../../services/supabaseService';
import { chatService } from '../../services/chatService';
import { User, ChatMessage } from '../../types';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const ChatApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentChatId = useRef<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            const allUsers = await supabaseService.getUsers();
            setUsers(allUsers.filter(u => u.username !== currentUser?.username));
        };
        fetchUsers();
    }, [currentUser]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleUserSelect = async (user: User) => {
        if (!currentUser) return;
        
        // Unsubscribe from previous chat
        if (currentChatId.current) {
            chatService.unsubscribe(currentChatId.current);
        }
        
        setSelectedUser(user);
        const chatId = chatService.getChatId(currentUser.username, user.username);
        currentChatId.current = chatId;

        const history = await chatService.getChatHistory(currentUser.username, user.username);
        setMessages(history);

        chatService.subscribe(chatId, (newMessage) => {
            setMessages(prevMessages => [...prevMessages, newMessage]);
        });
    };
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser || !selectedUser) return;

        chatService.sendMessage({
            sender: currentUser.username,
            receiver: selectedUser.username,
            text: newMessage,
        });

        setNewMessage('');
    };

    return (
        <div className="w-full max-w-6xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl text-light-text dark:text-white flex overflow-hidden">
            {/* User List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-teal-700/50">
                    <h2 className="text-xl font-bold">Contacts</h2>
                </div>
                <ul>
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
                {selectedUser ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10">
                            <h2 className="text-xl font-bold">Chat with {selectedUser.username}</h2>
                        </div>
                        <div className="flex-grow p-4 overflow-y-auto space-y-4">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender === currentUser?.username ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${msg.sender === currentUser?.username ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-600 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-300 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
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
                                />
                                <button type="submit" className="ml-3 p-2 bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-slate-500 text-white">
                                    <PaperAirplaneIcon className="h-6 w-6"/>
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
