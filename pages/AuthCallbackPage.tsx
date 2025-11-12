
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { database } from '../services/database';
import { Page } from '../types';

interface AuthCallbackPageProps {
    navigate: (page: Page, params?: any) => void;
}

const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ navigate }) => {
    const { isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const processCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            const state = params.get('state');

            if (!code || !state) {
                // This can happen if the effect re-runs after the URL is cleaned.
                // If we're already in a success/error state, do nothing.
                if (status === 'loading') {
                    setErrorMessage('Missing required parameters for authentication.');
                    setStatus('error');
                }
                return;
            }

            // Clean the URL now that we've extracted the parameters to prevent re-use
            window.history.replaceState({}, document.title, window.location.pathname);

            if (!isLoggedIn) {
                setErrorMessage('You must be signed in to link an account. Redirecting to sign in...');
                setStatus('error');
                setTimeout(() => navigate('signin'), 3000);
                return;
            }

            try {
                const { success } = await database.exchangeGoogleDriveCode(code);
                if (success) {
                    setStatus('success');
                } else {
                    setErrorMessage('Failed to link your Google Drive account. The server rejected the request.');
                    setStatus('error');
                }
            } catch (error: any) {
                console.error('An exception occurred while linking Google Drive:', error);
                setErrorMessage(error.message || 'An unexpected error occurred. Please try again.');
                setStatus('error');
            }
        };

        // Wait until the authentication state is resolved before processing the callback
        if (!isAuthLoading) {
            processCallback();
        }
    }, [isAuthLoading, isLoggedIn, navigate, status]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                        <h1 className="text-3xl font-bold">Linking your Google Drive...</h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-300">Please wait, this should only take a moment.</p>
                    </div>
                );
            case 'success':
                return (
                    <div className="flex flex-col items-center text-center">
                        <svg className="h-24 w-24 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h1 className="text-4xl font-bold">Success!</h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Your Google Drive account has been successfully linked.</p>
                        <button 
                            onClick={() => navigate('app-files')}
                            className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
                        >
                            Go to My Files
                        </button>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex flex-col items-center text-center">
                         <svg className="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h1 className="text-3xl font-bold">Linking Failed</h1>
                        <p className="mt-2 text-lg text-red-400 max-w-md">{errorMessage}</p>
                        <button 
                            onClick={() => navigate('app-files')}
                            className="mt-8 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                        >
                            Back to File Explorer
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-2xl bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-12 text-light-text dark:text-white">
            {renderContent()}
        </div>
    );
};

export default AuthCallbackPage;
