
import React, { useState, useEffect } from 'react';
import { Page } from '../../types';

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const OpenExternalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;

interface MobiWebAppViewerProps {
    url: string;
    title: string;
    navigate: (page: Page) => void;
}

const BLOCKED_DOMAINS = [
    'google.com',
    'youtube.com',
    'chatgpt.com',
    'openai.com',
    'github.com',
    'vercel.com',
    'twitter.com',
    'x.com',
    'facebook.com',
    'instagram.com',
    'reddit.com',
    'linkedin.com',
    'apple.com',
    'icloud.com',
    'microsoft.com',
    'amazon.com',
    'netflix.com',
    'spotify.com',
    'discord.com',
    'whatsapp.com',
    'telegram.org'
];

const MobiWebAppViewer: React.FC<MobiWebAppViewerProps> = ({ url, title, navigate }) => {
    const [showWarning, setShowWarning] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (url) {
            try {
                const hostname = new URL(url).hostname;
                const blocked = BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
                setIsBlocked(blocked);
            } catch (e) {
                // Invalid URL, assume not blocked or handle error elsewhere
                setIsBlocked(false);
            }
        }
    }, [url]);

    const handleOpenExternal = () => {
        window.open(url, title, 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=400,height=800');
    };

    if (!url) {
        return (
            <div className="w-full flex-grow flex flex-col bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <header className="flex-shrink-0 bg-white dark:bg-gray-900 p-3 flex items-center shadow">
                    <button onClick={() => navigate('home')} className="p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><BackIcon /></button>
                    <h1 className="text-lg font-bold">Error</h1>
                </header>
                <main className="flex-grow flex items-center justify-center">
                     <p>No URL was provided for this web app.</p>
                </main>
            </div>
        );
    }
    
    return (
        <div className="w-full flex-grow flex flex-col bg-gray-100 dark:bg-gray-800">
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 p-2 flex items-center justify-between shadow-md z-20">
                <div className="flex items-center">
                    <button onClick={() => navigate('home')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <BackIcon />
                    </button>
                    <h1 className="ml-2 text-lg font-bold truncate max-w-[180px] text-light-text dark:text-dark-text">{title}</h1>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={handleOpenExternal}
                        className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        aria-label="Open in popup"
                    >
                        <OpenExternalIcon />
                    </button>
                </div>
            </header>
            
            <main className="flex-grow flex min-h-0 relative bg-white dark:bg-gray-900">
                {isBlocked ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
                        <LinkIcon />
                        <h2 className="text-xl font-bold mb-2 text-light-text dark:text-dark-text">External App</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {title} requires a secure connection that cannot be embedded directly.
                        </p>
                        <button 
                            onClick={handleOpenExternal}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-lg transition-transform active:scale-95 flex items-center space-x-2"
                        >
                            <span>Launch {title}</span>
                            <OpenExternalIcon />
                        </button>
                    </div>
                ) : (
                    <>
                         {/* Persistent warning bar for sites that might block unexpectedly */}
                        {showWarning && (
                            <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white text-xs px-3 py-2 flex justify-between items-center z-20">
                                <span className="flex-grow mr-2">If the website doesn't load, click the icon top-right.</span>
                                <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-white/20 rounded flex-shrink-0">
                                    <XIcon />
                                </button>
                            </div>
                        )}
                        
                        {/* Background hint */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm z-0">
                            Loading {title}...
                        </div>

                        <iframe
                            src={url}
                            className="w-full flex-grow border-0 relative z-10 bg-white"
                            title={title}
                            scrolling="yes"
                            allowFullScreen
                            allow="camera; microphone; geolocation; payment; fullscreen"
                            referrerPolicy="no-referrer"
                            style={{ height: '100%', width: '100%' }}
                        />
                    </>
                )}
            </main>
        </div>
    );
};

export default MobiWebAppViewer;
