import React, { useEffect, useState, useRef } from 'react';
import { database } from '../services/database';
import { Page } from '../types';
import { useAuth } from '../hooks/useAuth';

// Icon for file upload
const FileUploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;

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
    const [step, setStep] = useState<'consent' | 'upload' | 'processing' | 'logging_in' | 'success' | 'error'>('processing');
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
            setStep('consent');
        } else {
            setStep('error');
            setMessage('Invalid authentication request. No authorization code found.');
        }
    }, []);

    // 2. Handle file upload
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !authCodeRef.current) return;

        setStep('processing');
        setMessage('Processing your login file...');

        try {
            const content = await file.text();
            const credentials = parseDjlogin(content);

            if (!credentials.email || !credentials.password) {
                setStep('error');
                setMessage('Invalid .djlogin file. Please upload a valid file and try again.');
                return;
            }

            // 3. Call the backend service to link and verify
            setMessage('Securely linking your account...');
            const { success, error: linkError } = await database.loginAndLinkDrive(
                credentials.email,
                credentials.password,
                authCodeRef.current
            );

            if (!success) {
                setStep('error');
                setMessage(linkError || 'Failed to link Google Drive. The credentials in the file might be incorrect.');
                return;
            }

            // 4. If linking was successful, log the user in on the client
            setStep('logging_in');
            setMessage('Account linked! Logging you in...');
            const { error: loginError } = await login(credentials.email, credentials.password);

            if (loginError) {
                setStep('error');
                setMessage('Account was linked, but client-side login failed. Please try logging in manually.');
                return;
            }
            
            // FIX: Changed setStatus to setStep to match the declared state setter.
            setStep('success');
            setMessage('All set! Redirecting you to your files...');
            setTimeout(() => navigate('app-files'), 1500);

        } catch (err) {
            setStep('error');
            setMessage('An unexpected error occurred while processing the file.');
            console.error(err);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    
    if (step === 'consent') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-white text-center animate-fade-in">
                <h1 className="text-6xl font-serif mb-12" style={{ fontFamily: 'Georgia, serif' }}>Google Integration</h1>
                <div className="max-w-3xl bg-green-500/30 backdrop-blur-sm rounded-3xl p-8 mb-16 border border-white/20">
                    <p className="text-lg leading-relaxed">
                        You are currently linking your Google © account to your LynixWeb/Lynix ID. By doing so you agree to our Terms of Service. Please note as you linking your Google Account is NOT a risk. As LynixWeb is still in progress, there is a chance we have to switch to another DB (Database) and/or web service. You may have to relink your Google account to your LynxWeb ID to continue using our service
                    </p>
                </div>
                <div className="flex justify-between w-full max-w-3xl">
                    <button
                        onClick={() => navigate('app-files')}
                        className="px-8 py-3 bg-gray-500/50 hover:bg-gray-500/70 backdrop-blur-sm rounded-2xl text-lg font-semibold transition-colors border border-white/20"
                    >
                        Not agree
                    </button>
                    <button
                        onClick={() => setStep('upload')}
                        className="px-8 py-3 bg-gray-300/80 hover:bg-gray-200/90 text-black backdrop-blur-sm rounded-2xl text-lg font-semibold transition-colors border border-white/20"
                    >
                        Accept and Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-lg bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-12 text-light-text dark:text-white flex flex-col items-center justify-center text-center">
            {step === 'upload' && (
                <>
                    <h1 className="text-3xl font-bold mb-4">Complete Link</h1>
                    <p className="mb-8 text-gray-600 dark:text-gray-300">To finalize linking your Google Drive, please upload your .djlogin file to securely verify your Lynix account.</p>
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

            {/* FIX: Changed status to step to match the declared state variable. */}
            {(step === 'processing' || step === 'logging_in') && (
                <>
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-6"></div>
                    <h1 className="text-2xl font-semibold">{message}</h1>
                </>
            )}

            {step === 'success' && (
                <>
                    <svg className="h-24 w-24 text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h1 className="text-3xl font-bold mb-4">Success!</h1>
                    <p className="mb-8 text-gray-600 dark:text-gray-300">Your account has been linked and you are now logged in.</p>
                    <button onClick={() => navigate('app-files')} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                        Go to My Files
                    </button>
                </>
            )}
            
            {/* FIX: Changed status to step to match the declared state variable. */}
            {step === 'error' && (
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