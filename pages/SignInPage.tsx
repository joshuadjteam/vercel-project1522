

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import AppContainer from '../components/AppContainer';
import { database } from '../services/database';

const GuestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SignInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;

interface SignInPageProps {
    navigate: (page: Page) => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginAsGuest, isLoggedIn, isLoading: isAuthLoading } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isLoggedIn) {
            navigate('home');
        }
    }, [isLoggedIn, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!email || !password) {
            setError('Email and password are required.');
            setIsLoading(false);
            return;
        }

        const { error: loginError } = await login(email, password);
        
        if (loginError) {
            // Use the error message directly from Supabase, which is more reliable.
            // It will be "Invalid login credentials" for both wrong email and password.
            setError(loginError);
        }
        
        setIsLoading(false);
    };

    const handleTryOut = async () => {
        setError('');
        await loginAsGuest();
    };
    
    const isSubmitting = isLoading || isAuthLoading;

    return (
        <AppContainer className="w-full max-w-md p-8 text-light-text dark:text-white flex flex-col items-center">
            <div className="w-full animate-fade-in">
                <h1 className="text-3xl font-bold mb-6 text-center">Sign In</h1>
                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value.trim())}
                        className="w-full bg-gray-100 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                        required
                    />

                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Signing In...</span>
                            </>
                        ) : (
                            <>
                                <SignInIcon />
                                <span>Sign In</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="relative flex items-center py-5 w-full">
                    <div className="flex-grow border-t border-gray-400 dark:border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-gray-400">OR</span>
                    <div className="flex-grow border-t border-gray-400 dark:border-slate-600"></div>
                </div>

                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleTryOut}
                        disabled={isSubmitting}
                        className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <GuestIcon />
                        <span>Try as Guest?</span>
                    </button>
                </div>
            </div>
        </AppContainer>
    );
};

export default SignInPage;
