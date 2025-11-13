import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import { geminiService } from '../services/geminiService';
import { database } from '../services/database';

const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;


const InfoTabContent = () => {
    const { user } = useAuth();
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6">Account Information</h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-300">
                <div className="grid grid-cols-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Username:</span>
                    <span className="col-span-2">{user?.username}</span>
                </div>
                <div className="grid grid-cols-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span>
                    <span className="col-span-2">{user?.email}</span>
                </div>
                <div className="grid grid-cols-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">SIP Voice:</span>
                    <span className="col-span-2">{user?.sipVoice || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Role:</span>
                    <span className="col-span-2">{user?.role}</span>
                </div>
            </div>
        </div>
    )
};

const BillingTabContent = () => {
    const { user } = useAuth();
    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6">Billing Information</h3>
            <div className="space-y-4 text-gray-600 dark:text-gray-300 bg-black/5 dark:bg-black/20 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Current Plan:</span>
                    <span className="font-bold text-lg text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50">{user?.plan_name || user?.role}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-300 dark:border-slate-600">
                    Your plan is managed by your organization's administrator. Please contact them to make any changes.
                </p>
            </div>
        </div>
    );
};

const SecurityTabContent: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsSuccess(false);

        if (newPassword !== confirmPassword) {
            setMessage("New passwords don't match.");
            return;
        }
        if (newPassword.length < 6) {
            setMessage("New password must be at least 6 characters.");
            return;
        }

        setIsLoading(true);
        const { error } = await database.updateUserPassword(currentPassword, newPassword);
        setIsLoading(false);

        if (error) {
            setMessage(error);
        } else {
            setIsSuccess(true);
            setMessage("Password updated successfully!");
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-semibold mb-6">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
                <input
                    type="password"
                    placeholder="Current Password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                />
                <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                />
                <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                />
                {message && (
                    <p className={`text-sm ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>{message}</p>
                )}
                <button type="submit" disabled={isLoading} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-800 flex items-center justify-center space-x-2">
                    <KeyIcon />
                    <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
            </form>
        </div>
    );
};


type Message = {
    sender: 'user' | 'ai';
    text: string;
};

const LynxAITabContent = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([{ sender: 'ai', text: 'Hello! I am LynxAI. How can I assist you today?' }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (input.trim() === '' || isLoading) return;
        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await geminiService.getChatAIResponse(input);
            const aiMessage: Message = { sender: 'ai', text: response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage: Message = { sender: 'ai', text: "Sorry, I couldn't connect to the AI service." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="h-[45vh] flex flex-col animate-fade-in">
            <h3 className="text-2xl font-semibold mb-4">LynxAI Portal</h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md px-4 py-2 rounded-2xl ${msg.sender === 'user' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-slate-700 rounded-bl-none'}`}>
                            <p className="text-sm">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl bg-gray-200 dark:bg-slate-700 rounded-bl-none`}>
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-75"></div>
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex items-center border-t border-gray-300 dark:border-slate-600 pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask LynxAI anything..."
                    className="flex-grow bg-gray-100 dark:bg-slate-700/50 rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading} className="ml-3 w-10 h-10 flex items-center justify-center bg-purple-600 rounded-full hover:bg-purple-700 disabled:bg-slate-500 text-white font-semibold">
                    <SendIcon />
                </button>
            </div>
        </div>
    );
};

interface ProfilePageProps {
    navigate: (page: Page) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ navigate }) => {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('info');
    
    const handleSignOut = () => {
        logout();
        navigate('home');
    };

    const InfoIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    const BillingIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
    );

    const SecurityIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );

    const AIIcon = (
         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
    );


    const TabButton: React.FC<{ tabName: string, label: string, icon: React.ReactNode }> = ({ tabName, label, icon }) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`w-full p-3 rounded-lg text-left transition-colors font-semibold flex items-center space-x-3 ${
                activeTab === tabName ? 'bg-purple-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="w-full max-w-5xl bg-light-card/80 dark:bg-teal-800/60 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-4xl font-bold">Welcome, {user?.username}!</h1>
                    <p className="text-gray-600 dark:text-gray-300">This is your personal Lynix portal.</p>
                </div>
                <button onClick={handleSignOut} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2">
                    <SignOutIcon />
                    <span>Sign Out</span>
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/4">
                    <div className="space-y-2">
                        <TabButton tabName="info" label="Info" icon={InfoIcon} />
                        <TabButton tabName="billing" label="Billing" icon={BillingIcon} />
                        <TabButton tabName="security" label="Security" icon={SecurityIcon} />
                        <TabButton tabName="lynxai" label="LynxAI Portal" icon={AIIcon} />
                    </div>
                </div>
                <div className="w-full md:w-3/4 bg-black/5 dark:bg-black/20 rounded-lg p-6 min-h-[250px]">
                    {activeTab === 'info' && <InfoTabContent />}
                    {activeTab === 'billing' && <BillingTabContent />}
                    {activeTab === 'security' && <SecurityTabContent />}
                    {activeTab === 'lynxai' && <LynxAITabContent />}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
