import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import { database } from '../services/database';

const GuestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SignInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;

interface MobileSignInPageProps {
    navigate: (page: Page) => void;
}

const MobileSignInPage: React.FC<MobileSignInPageProps> = ({ navigate }) => {
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

        try {
            const userExists = await database.getUserByEmail(email);
            if (!userExists) {
                setError("Error 53A : The credentials 'email' is invalid, please check the email and try again");
                setIsLoading(false);
                return;
            }

            const { error: loginError } = await login(email, password);
            if (loginError) {
                setError("Error 53B : The credentials 'password' is invalid, please check the password and try again");
            }
        } catch (e: any) {
            setError("Error 50Z : The database cannot be connected at this time, please try again later");
        } finally {
            setIsLoading(false);
        }
    };

    const handleTryOut = async () => {
        setError('');
        await loginAsGuest();
    };
    
    const isSubmitting = isLoading || isAuthLoading;

    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-dark-bg p-6 text-white">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
                        <circle cx="12" cy="12" r="11" fill="#4A5568"/>
                        <path d="M15.9042 7.15271C14.4682 6.42517 12.8251 6 11.0625 6C7.16117 6 4 9.13401 4 13C4 16.866 7.16117 20 11.0625 20C12.8251 20 14.4682 19.5748 15.9042 18.8473" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M8.09583 16.8473C9.53181 17.5748 11.1749 18 12.9375 18C16.8388 18 20 14.866 20 11C20 7.13401 16.8388 4 12.9375 4C11.1749 4 9.53181 4.42517 8.09583 5.15271" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <h1 className="text-3xl font-bold">Welcome to Lynix</h1>
                </div>
                
                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={e => setEmail(e.target.value.trim())}
                        className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isSubmitting}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-slate-700 border-2 border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    <div className="flex-grow border-t border-slate-600"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400">OR</span>
                    <div className="flex-grow border-t border-slate-600"></div>
                </div>

                <div className="w-full">
                    <button
                        type="button"
                        onClick={handleTryOut}
                        disabled={isSubmitting}
                        className="w-full bg-gray-600 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                        <GuestIcon />
                        <span>Try as Guest?</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
export default MobileSignInPage;
