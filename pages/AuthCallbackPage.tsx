import React, { useEffect, useState } from 'react';
import { database } from '../services/database';
import { Page } from '../types';

interface AuthCallbackPageProps {
    navigate: (page: Page, params?: any) => void;
}

const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ navigate }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Linking your Google Drive account...');

    useEffect(() => {
        const processDriveLink = async (code: string) => {
            const { success } = await database.exchangeGoogleDriveCode(code);
            if (success) {
                setStatus('success');
                setMessage('Google Drive linked successfully! Redirecting...');
                setTimeout(() => navigate('app-files'), 2000);
            } else {
                setStatus('error');
                setMessage('Failed to link Google Drive. Please try again from the File Explorer.');
            }
        };

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        // Clean the URL to remove auth params after they are read.
        window.history.replaceState({}, document.title, '/');

        if (code && state?.startsWith('app-files')) {
            processDriveLink(code);
        } else {
            setStatus('error');
            setMessage('Invalid authentication request. No authorization code found.');
        }
    }, [navigate]);

    const renderContent = () => {
        let icon;
        let textColorClass = 'text-gray-600 dark:text-gray-300';

        switch (status) {
            case 'success':
                icon = <svg className="h-24 w-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                textColorClass = 'text-green-500';
                break;
            case 'error':
                icon = <svg className="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
                textColorClass = 'text-red-400';
                break;
            default: // loading
                icon = <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>;
                break;
        }

        return (
            <div className="flex flex-col items-center text-center">
                {icon}
                <h1 className={`text-3xl font-bold ${textColorClass}`}>{message}</h1>
                {status === 'error' && (
                    <button 
                        onClick={() => navigate('app-files')}
                        className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Back to File Explorer
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="w-full max-w-2xl bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-12 text-light-text dark:text-white">
            {renderContent()}
        </div>
    );
};

export default AuthCallbackPage;