import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';

const GuestIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const FileUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const SignInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;


const parseDjlogin = (content: string): { username?: string; password?: string; email?: string } => {
    const credentials: { username?: string; password?: string; email?: string } = {};
    
    // 1. Clean up the raw content: remove leading/trailing whitespace and optional surrounding quotes.
    let cleanContent = content.trim();
    if (cleanContent.startsWith('"') && cleanContent.endsWith('"')) {
        cleanContent = cleanContent.substring(1, cleanContent.length - 1).trim();
    }

    const lines = cleanContent.split(/[\r\n]+/);

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('[{') && trimmedLine.endsWith(']')) {
            const inner = trimmedLine.substring(2, trimmedLine.length - 1);
            const parts = inner.split('}]=');
            if (parts.length === 2) {
                const shortKey = parts[1];
                const keyValuePart = parts[0];
                const colonIndex = keyValuePart.indexOf(':');
                if (colonIndex > -1) {
                    const value = keyValuePart.substring(colonIndex + 1);

                    if (shortKey.toLowerCase() === 'user') credentials.username = value;
                    if (shortKey.toLowerCase() === 'pass') credentials.password = value;
                    if (shortKey.toLowerCase() === 'typeemailreq') credentials.email = value;
                }
            }
        }
    }
    return credentials;
};


interface SignInPageProps {
    navigate: (page: Page) => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ navigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loginAsGuest, isLoggedIn, isLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLoggedIn) {
            navigate('home');
        }
    }, [isLoggedIn, navigate]);
    
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const { error: loginError } = await login(email, password);
        if (loginError) {
            setError(loginError);
        }
    };
    
    const handleTryOut = async () => {
        setError('');
        await loginAsGuest();
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError('');

        try {
            const content = await file.text();
            const credentials = parseDjlogin(content);

            if (!credentials.email || !credentials.password) {
                setError('Invalid .djlogin file. Please upload a valid file and try again.');
                return;
            }

            const { error: loginError } = await login(credentials.email, credentials.password);
            if (loginError) {
                setError(loginError);
            }
        } catch (err) {
            setError('Failed to read or process the file.');
            console.error(err);
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };
    
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };


    if (error) {
        return (
            <div className="w-full max-w-lg bg-teal-900/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-white flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center mb-6">
                    <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-red-500 mb-4">An Error Occurred</h1>
                <p className="mb-8">Invalid .djlogin file. Please upload a valid file and try again.</p>
                <button 
                    onClick={() => setError('')} 
                    className="mt-4 bg-[#4c1d95] hover:bg-[#581c87] text-white font-bold py-3 px-8 rounded-lg transition-colors"
                >
                    Back to Sign In
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-center">Access Your Lynix Account</h1>
            
            <form onSubmit={handleLogin} className="w-full space-y-4">
                <input 
                    type="email" 
                    placeholder="Email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                />
                <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                    required
                />
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-lg"
                >
                    <SignInIcon />
                    <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                </button>
            </form>
            
            <div className="relative flex items-center py-5 w-full">
                <div className="flex-grow border-t border-gray-400 dark:border-slate-600"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-gray-400">OR</span>
                <div className="flex-grow border-t border-gray-400 dark:border-slate-600"></div>
            </div>

             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".djlogin" 
                className="hidden" 
                disabled={isLoading}
            />

            <div className="w-full space-y-3">
                 <button 
                    type="button" 
                    onClick={triggerFileUpload}
                    disabled={isLoading} 
                    className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <FileUploadIcon />
                    <span>Login with your .djlogin file?</span>
                </button>

                <button 
                    type="button" 
                    onClick={handleTryOut} 
                    disabled={isLoading} 
                    className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors disabled:bg-gray-800 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                    <GuestIcon />
                    <span>Try as Guest?</span>
                </button>
            </div>
        </div>
    );
};

export default SignInPage;