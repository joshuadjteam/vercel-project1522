import React, { useEffect, useState, useRef } from 'react';
import { database } from '../services/database';
import { Page } from '../types';
import { useAuth } from '../hooks/useAuth';

// Icon for file upload
const FileUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

// Re-use the parser from SignInPage
const parseDjlogin = (content: string): { email?: string; password?: string } => {
    const credentials: { email?: string; password?:string } = {};
    const lines = content.split(/[\r\n]+/);
    const regex = /\[\{(\w+)\s*:\s*(.*?)\s*\}\]=(\w+)\]/i;

    for (const line of lines) {
        const match = line.match(regex);
        if (match) {
            const value = match[2].trim();
            const shortKey = match[3];
            if (shortKey.toLowerCase() === 'pass') credentials.password = value;
            if (shortKey.toLowerCase() === 'typeemailreq') credentials.email = value;
        }
    }
    return credentials;
};


interface AuthCallbackPageProps {
    navigate: (page: Page, params?: any) => void;
}

const AuthCallbackPage: React.FC<AuthCallbackPageProps> = ({ navigate }) => {
    const { login } = useAuth();
    const [status, setStatus] = useState<'prompting' | 'processing' | 'logging_in' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Verifying authentication request...');
    const authCodeRef = useRef<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. On mount, extract the code and clean the URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        // Clean the URL immediately
        window.history.replaceState({}, document.title, '/');

        if (code && state?.startsWith('app-files')) {
            authCodeRef.current = code;
            setStatus('prompting');
            setMessage('Please upload your .djlogin file to proceed.');
        } else {
            setStatus('error');
            setMessage('Invalid authentication request. No authorization code found.');
        }
    }, []);

    // 2. Handle file upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !authCodeRef.current) return;

        setStatus('processing');
        setMessage('Processing your login file...');

        try {
            const content = await file.text();
            const credentials = parseDjlogin(content);

            if (!credentials.email || !credentials.password) {
                setStatus('error');
                setMessage('Invalid .djlogin file. Please upload a valid file and try again.');
                return;
            }

            // 3. Call the new backend service to link and verify
            setMessage('Securely linking your account...');
            const { success, error: linkError } = await database.loginAndLinkDrive(
                credentials.email,
                credentials.password,
                authCodeRef.current
            );

            if (!success) {
                setStatus('error');
                setMessage(linkError || 'Failed to link Google Drive. The credentials in the file might be incorrect.');
                return;
            }

            // 4. If linking was successful, log the user in on the client
            setStatus('logging_in');
            setMessage('Account linked! Logging you in...');
            const { error: loginError } = await login(credentials.email, credentials.password);

            if (loginError) {
                setStatus('error');
                setMessage('Account was linked, but client-side login failed. Please try logging in manually.');
                return;
            }
            
            // Success! The useAuth hook will handle the redirect via its own useEffect.
            // But we can navigate directly after a short delay.
            setStatus('success');
            setMessage('All set! Redirecting you to your files...');
            setTimeout(() => navigate('app-files'), 1500);

        } catch (err) {
            setStatus('error');
            setMessage('An unexpected error occurred while processing the file.');
            console.error(err);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="w-full max-w-lg bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-12 text-light-text dark:text-white flex flex-col items-center justify-center text-center">
            {status === 'prompting' && (
                <>
                    <h1 className="text-3xl font-bold mb-4">Link Account</h1>
                    <p className="mb-8 text-gray-600 dark:text-gray-300">{message}</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".djlogin" 
                        className="hidden" 
                    />
                    <button onClick={triggerFileUpload} className="w-full max-w-xs bg-purple-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-3 text-lg">
                        <FileUploadIcon />
                        <span>Upload .djlogin File</span>
                    </button>
                </>
            )}

            {(status === 'processing' || status === 'logging_in' || status === 'success') && (
                <>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
                    <h1 className="text-2xl font-semibold">{message}</h1>
                </>
            )}
            
            {status === 'error' && (
                <>
                    <svg className="h-24 w-24 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <h1 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h1>
                    <p className="mb-6">{message}</p>
                    <button onClick={() => navigate('signin')} className="mt-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg">
                        Back to Sign In
                    </button>
                </>
            )}
        </div>
    );
};

export default AuthCallbackPage;
