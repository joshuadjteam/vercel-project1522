
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';


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

    const InfoTabContent = () => (
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
    );

    const PlaceholderTabContent = ({title}: {title:string}) => (
        <div>
            <h3 className="text-2xl font-semibold mb-6">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400">This feature is currently under development. Please check back later.</p>
        </div>
    );

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
                    <ArrowLeftIcon className="h-5 w-5"/>
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
                    {activeTab === 'billing' && <PlaceholderTabContent title="Billing Information"/>}
                    {activeTab === 'lynxai' && <PlaceholderTabContent title="LynxAI Portal"/>}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
