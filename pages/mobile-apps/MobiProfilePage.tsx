
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';
import { geminiService } from '../../services/geminiService';
import { database } from '../../services/database';
import AppContainer from '../../components/AppContainer';

const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const KeyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;


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
            <h3 className="text-xl font-semibold mb-4">Change Password</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <button type="submit" disabled={isLoading} className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-800 flex items-center justify-center space-x-2">
                    <KeyIcon />
                    <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                </button>
            </form>
        </div>
    );
};

interface MobiProfilePageProps {
    navigate: (page: Page) => void;
}

const MobiProfilePage: React.FC<MobiProfilePageProps> = ({ navigate }) => {
    const { user, logout } = useAuth();
    
    const handleSignOut = () => {
        logout();
        navigate('home');
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 shadow-md p-4 flex items-center justify-between">
                <button onClick={() => navigate('home')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <BackIcon />
                </button>
                <h1 className="text-xl font-bold">My Profile</h1>
                <div className="w-10"></div>
            </header>

            <main className="flex-grow overflow-y-auto p-4 space-y-6">
                <section className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">Account Information</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Username:</span>
                            <span>{user?.username}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span>
                            <span className="truncate">{user?.email}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Role:</span>
                            <span>{user?.role}</span>
                        </div>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">Billing Information</h2>
                    <div className="space-y-3 text-gray-600 dark:text-gray-300 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Current Plan:</span>
                            <span className="font-bold text-base text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/50">{user?.plan_name || user?.role}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                            Your plan is managed by your organization's administrator.
                        </p>
                    </div>
                </section>

                <section className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow">
                    <h2 className="text-lg font-semibold mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">Security</h2>
                    <SecurityTabContent />
                </section>
                
                 <div className="pt-4">
                     <button onClick={handleSignOut} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2">
                        <SignOutIcon />
                        <span>Sign Out</span>
                    </button>
                 </div>
            </main>
        </div>
    );
};

export default MobiProfilePage;
