
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';
import { database } from '../services/database';

const ArrowRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;

interface MobileSignInPageProps {
    navigate: (page: Page) => void;
}

const MobileSignInPage: React.FC<MobileSignInPageProps> = ({ navigate }) => {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isLoggedIn } = useAuth();

    useEffect(() => {
        if (isLoggedIn) {
            navigate('home');
        }
    }, [isLoggedIn, navigate]);

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address.');
            return;
        }
        setStep('password');
    };
    
    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

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
            // On successful login, the useAuth hook will handle navigation
        } catch (e: any) {
            setError("Error 50Z : The database cannot be connected at this time, please try again later");
        } finally {
            setIsLoading(false);
        }
    };

    const username = useMemo(() => {
        if (!email) return '';
        return email.split('@')[0];
    }, [email]);

    return (
        <div className="w-full max-w-sm p-6 text-light-text dark:text-white flex flex-col items-center">
             <div className="flex items-center space-x-3 mb-8">
                <svg width="40" height="40" viewBox="0 0 135 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459H54.707L78.7744 0.853516H39.7627Z" fill="#1155cc"/>
                    <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H54.707L78.7744 0.853516H39.7627Z" fill="#6fa8dc"/>
                    <path d="M79.9482 64.459H54.707L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459Z" fill="#0b5394"/>
                </svg>
                <span className="text-4xl font-bold">Lynix</span>
            </div>

            {step === 'email' && (
                <form onSubmit={handleEmailSubmit} className="w-full space-y-6 animate-fade-in">
                    <h1 className="text-3xl font-bold text-center">Sign in</h1>
                    <div>
                        <input 
                            type="email" 
                            placeholder="Email address" 
                            value={email} 
                            onChange={e => setEmail(e.target.value.trim())} 
                            className="w-full bg-gray-100 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isLoading}
                            required
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
                    >
                        <span>Next</span>
                        <ArrowRightIcon />
                    </button>
                </form>
            )}

            {step === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="w-full space-y-6 animate-fade-in">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Welcome</h1>
                        <p className="text-lg text-gray-600 dark:text-gray-300 truncate">{username}</p>
                        <button type="button" onClick={() => { setStep('email'); setError(''); }} className="text-sm text-blue-500 hover:underline mt-1">Change email</button>
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="w-full bg-gray-100 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={isLoading}
                            required
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm text-center bg-red-500/10 p-3 rounded-md">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
                    >
                         {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Signing In...</span>
                            </>
                         ) : (
                            <span>Sign In</span>
                         )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default MobileSignInPage;
