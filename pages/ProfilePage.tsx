import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import { geminiService } from '../services/geminiService';

const InfoTabContent = () => {
    const { user } = useAuth();
    return (
        <div>
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
        <div>
            <h3 className="text-2xl font-semibold mb-6">Billing Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-black/5 dark:bg-black/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Current Plan</h4>
                    <p className="text-xl">{user?.role} Plan</p>
                    <p className="text-gray-500 dark:text-gray-400">{user?.role === 'Admin' ? '$99.99/month' : user?.role === 'Standard' ? '$19.99/month' : 'Free Trial'}</p>
                    <button className="mt-4 text-sm text-blue-500 hover:underline">Change Plan</button>
                </div>
                <div className="bg-black/5 dark:bg-black/20 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Payment Method</h4>
                    <p>Visa ending in **** 1234</p>
                    <p className="text-gray-500 dark:text-gray-400">Expires 12/2028</p>
                    <button className="mt-4 text-sm text-blue-500 hover:underline">Update Payment</button>
                </div>
            </div>
            <div className="mt-8">
                <h4 className="text-xl font-semibold mb-4">Billing History</h4>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-gray-300 dark:border-slate-600">
                            <tr>
                                <th className="p-2">Date</th>
                                <th className="p-2">Description</th>
                                <th className="p-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-200 dark:border-slate-700">
                                <td className="p-2">11/01/2025</td>
                                <td className="p-2">Monthly Subscription</td>
                                <td className="p-2 text-right">$19.99</td>
                            </tr>
                            <tr className="border-b border-gray-200 dark:border-slate-700">
                                <td className="p-2">10/01/2025</td>
                                <td className="p-2">Monthly Subscription</td>
                                <td className="p-2 text-right">$19.99</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
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
        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await geminiService.getHelpResponse(input);
            const aiMessage = { sender: 'ai', text: response };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = { sender: 'ai', text: "Sorry, I couldn't connect to the AI service." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user?.features.ai) {
        return (
            <div>
                <h3 className="text-2xl font-semibold mb-6">LynxAI Portal</h3>
                <p className="text-gray-500 dark:text-gray-400">The LynxAI feature is not enabled for your account. Please contact an administrator to upgrade your plan.</p>
            </div>
        );
    }
    
    return (
        <div className="h-[45vh] flex flex-col">
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
                <button onClick={handleSend} disabled={isLoading} className="ml-3 px-4 py-2 bg-purple-600 rounded-full hover:bg-purple-700 disabled:bg-slate-500 text-white font-semibold">
                    Send
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

    const TabButton: React.FC<{ tabName: string, label: string }> = ({ tabName, label }) => (
         <button
            onClick={() => setActiveTab(tabName)}
            className={`w-full p-3 rounded-lg text-left transition-colors font-semibold ${
                activeTab === tabName ? 'bg-purple-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
            }`}
        >
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
                    <span>Sign Out</span>
                </button>
            </div>
            
            <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/4">
                    <div className="space-y-2">
                        <TabButton tabName="info" label="Info" />
                        <TabButton tabName="billing" label="Billing" />
                        <TabButton tabName="lynxai" label="LynxAI Portal" />
                    </div>
                </div>
                <div className="w-full md:w-3/4 bg-black/5 dark:bg-black/20 rounded-lg p-6 min-h-[250px]">
                    {activeTab === 'info' && <InfoTabContent />}
                    {activeTab === 'billing' && <BillingTabContent />}
                    {activeTab === 'lynxai' && <LynxAITabContent />}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;