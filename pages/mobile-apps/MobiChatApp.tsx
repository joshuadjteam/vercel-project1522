

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { chatService } from '../../services/chatService';
import { geminiService } from '../../services/geminiService';
import { User, ChatMessage, UserRole } from '../../types';

const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;

const LynixLogo = () => (
    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
        <circle cx="16" cy="16" r="14" fill="#C9E1DE"/>
        <path d="M9 13L19 13L16 23L6 23Z" fill="#EB5B4D"/>
        <path d="M12 8L22 8L19 18L9 18Z" fill="#F37921"/>
    </svg>
);

const LYNX_AI_USER: User = { id: -1, username: 'Lynx AI', email: 'ai@lynix.local', role: UserRole.Standard, plan_name: 'System', sip_username: null, sip_password: null, features: { chat: true, ai: true, mail: false }};

interface MobiChatAppProps {
    initialTargetId?: number | null;
}

const MobiChatApp: React.FC<MobiChatAppProps> = ({ initialTargetId }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [aiHistory, setAiHistory] = useState<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser && aiHistory.length === 0) {
            setAiHistory([{ id: Date.now(), senderId: LYNX_AI_USER.id, receiverId: currentUser.id, text: "Hello! I'm Lynx AI. How can I help you today?", timestamp: new Date(), sender: LYNX_AI_USER, receiver: currentUser }]);
        }
    }, [currentUser, aiHistory.length]);

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUser) return;
            const allUsers = await database.getUserDirectory();
            const realUsers = allUsers.filter(u => u.id !== currentUser.id);
            setUsers([LYNX_AI_USER, ...realUsers]);
        };
        fetchUsers();
    }, [currentUser]);

    const handleSelectUser = (user: User) => {
        if (selectedUser?.id !== user.id) setSelectedUser(user);
    };

    useEffect(() => {
        if (initialTargetId !== undefined && initialTargetId !== null && users.length > 0) {
            const target = users.find(u => u.id === initialTargetId);
            if (target) handleSelectUser(target);
        }
    }, [initialTargetId, users]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(scrollToBottom, [messages, isAiThinking]);

    useEffect(() => {
        if (!currentUser || !selectedUser) return;
        if (selectedUser.id === LYNX_AI_USER.id) {
            if (aiHistory.length > 0) setMessages(aiHistory);
            return;
        }
        const chatId = chatService.getChatId(currentUser.id, selectedUser.id);
        let isMounted = true;
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            const history = await chatService.getChatHistory(currentUser.id, selectedUser.id);
            if (isMounted) {
                setMessages(history);
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();
        const handleNewMessage = (payload: any) => {
            if (!isMounted) return;
            const incomingMsg: ChatMessage = { id: payload.id, senderId: payload.sender_id, receiverId: payload.receiver_id, text: payload.text, timestamp: new Date(payload.timestamp), sender: payload.sender_id === currentUser.id ? currentUser : selectedUser, receiver: payload.sender_id === currentUser.id ? selectedUser : currentUser };
            setMessages(prev => [...prev, incomingMsg]);
        };
        chatService.subscribe(chatId, handleNewMessage);
        return () => { isMounted = false; chatService.unsubscribe(chatId); };
    }, [currentUser, selectedUser, aiHistory]);
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !selectedUser) return;
        const textToSend = newMessage.trim();
        setNewMessage('');
        if (selectedUser.id === LYNX_AI_USER.id) {
            const userMsg: ChatMessage = { id: Date.now(), senderId: currentUser.id, receiverId: LYNX_AI_USER.id, text: textToSend, timestamp: new Date(), sender: currentUser, receiver: LYNX_AI_USER };
            const updatedHistory = [...aiHistory, userMsg];
            setAiHistory(updatedHistory);
            setMessages(updatedHistory);
            setIsAiThinking(true);
            try {
                const responseText = await geminiService.getChatAIResponse(textToSend);
                const aiMsg: ChatMessage = { id: Date.now() + 1, senderId: LYNX_AI_USER.id, receiverId: currentUser.id, text: responseText, timestamp: new Date(), sender: LYNX_AI_USER, receiver: currentUser };
                setAiHistory(prev => [...prev, aiMsg]);
                setMessages(prev => [...prev, aiMsg]);
            } catch (error) {
                 const errorMsg: ChatMessage = { id: Date.now() + 1, senderId: LYNX_AI_USER.id, receiverId: currentUser.id, text: "I'm having trouble connecting right now. Please try again later.", timestamp: new Date(), sender: LYNX_AI_USER, receiver: currentUser };
                setAiHistory(prev => [...prev, errorMsg]);
                setMessages(prev => [...prev, errorMsg]);
            } finally {
                setIsAiThinking(false);
            }
        } else {
            const messageData = { senderId: currentUser.id, receiverId: selectedUser.id, text: textToSend };
            const optimisticMsg: ChatMessage = { id: Date.now(), ...messageData, timestamp: new Date(), sender: currentUser, receiver: selectedUser };
            setMessages(prev => [...prev, optimisticMsg]);
            await chatService.sendMessage(messageData);
        }
    };

    if (selectedUser) {
        return (
            <div className="w-full h-full flex flex-col text-white bg-gradient-to-br from-teal-700 to-green-800">
                <header className="p-3 bg-white/5 flex-shrink-0 border-b border-white/10 flex items-center">
                    <button onClick={() => setSelectedUser(null)} className="p-2 mr-2 rounded-full hover:bg-white/20"> <BackIcon /> </button>
                    {selectedUser.id === LYNX_AI_USER.id ? (
                        <div className="flex items-center text-cyan-300"> <LynixLogo /> <h2 className="text-xl font-bold">{selectedUser.username}</h2> </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">{selectedUser.username.charAt(0).toUpperCase()}</div>
                            <h2 className="text-xl font-bold">{selectedUser.username}</h2>
                        </div>
                    )}
                </header>
                <div className="flex-grow p-4 overflow-y-auto space-y-4 custom-scrollbar">
                    {isLoadingHistory ? ( <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div> ) : messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] px-5 py-3 rounded-2xl shadow-sm ${msg.senderId === currentUser?.id ? 'bg-blue-600/90 text-white rounded-br-none' : 'bg-slate-700/80 text-white rounded-bl-none'}`}>
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    {isAiThinking && ( <div className="flex justify-start animate-fade-in"><div className="px-5 py-4 rounded-2xl bg-slate-700/80 rounded-bl-none flex space-x-2 items-center"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div></div></div> )}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-2 bg-white/5 flex-shrink-0 border-t border-white/10">
                    <div className="flex items-center relative">
                        <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder={`Message...`} className="flex-grow bg-black/20 border border-white/10 text-white placeholder-white/50 rounded-full py-3 pl-5 pr-12 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-black/30 transition-all" disabled={isAiThinking} />
                        <button type="submit" disabled={!newMessage.trim() || isAiThinking} className="absolute right-1.5 top-1.5 w-10 h-10 flex items-center justify-center bg-blue-500 hover:bg-blue-600 disabled:bg-white/10 disabled:text-white/30 rounded-full text-white transition-colors"> <SendIcon /> </button>
                    </div>
                </form>
            </div>
        );
    }
    
    return (
        <div className="w-full h-full flex flex-col text-white bg-gradient-to-br from-teal-700 to-green-800">
            <header className="p-4 border-b border-white/10 flex-shrink-0">
                <h2 className="text-xl font-bold tracking-wide">Chats</h2>
            </header>
            <div className="flex-grow overflow-y-auto custom-scrollbar">
                <nav className="p-2">
                    <ul className="space-y-1">
                        {users.map(user => (
                            <li key={user.id}>
                                <button onClick={() => handleSelectUser(user)} className="w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center hover:bg-white/10">   
                                    {user.id === LYNX_AI_USER.id ? (
                                        <span className="flex items-center text-cyan-300"> <LynixLogo /> {user.username} </span>
                                    ) : (
                                        <span className="flex items-center">
                                            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center mr-3 text-sm font-bold">{user.username.charAt(0).toUpperCase()}</div>
                                            {user.username}
                                        </span>
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default MobiChatApp;