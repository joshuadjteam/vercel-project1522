
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';

interface SignInPageProps {
    navigate: (page: Page) => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginAsGuest, isLoggedIn, isLoading } = useAuth();

    useEffect(() => {
        // Navigate to profile page if user is logged in
        if (isLoggedIn) {
            navigate('profile');
        }
    }, [isLoggedIn, navigate]);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { error: loginError } = await login(email, password);
        if (loginError) {
            setError(loginError);
        }
        // If login is successful, `isLoggedIn` will become true,
        // and the `useEffect` will handle navigation.
    };
    
    const handleTryOut = async () => {
        setError('');
        await loginAsGuest();
        // The useEffect will handle navigation once `isLoggedIn` is updated.
    };


    return (
        <div className="w-full max-w-md bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white">
            <h1 className="text-3xl font-bold mb-2 text-center">Access Your Lynix Account</h1>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">Sign in with your email and password to continue.</p>
            
            <form onSubmit={handleSignIn} className="space-y-4">
                <div className="flex items-center space-x-4">
                    <label className="w-1/4 font-semibold">Email:</label>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-3/4 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                 <div className="flex items-center space-x-4">
                    <label className="w-1/4 font-semibold">Password:</label>
                    <input
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-3/4 bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <div className="pt-4 space-y-3">
                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed">
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                     <button type="button" onClick={handleTryOut} disabled={isLoading} className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed">
                        Try Out
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SignInPage;
