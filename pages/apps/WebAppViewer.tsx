
import React, { useState, useEffect } from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const OpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;


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

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title }) => {
    const [showWarning, setShowWarning] = useState(true);
    const [isBlocked, setIsBlocked] = useState(false);

    useEffect(() => {
        if (url) {
            try {
                const hostname = new URL(url).hostname;
                const blocked = BLOCKED_DOMAINS.some(domain => hostname.includes(domain));
                setIsBlocked(blocked);
            } catch (e) {
                setIsBlocked(false);
            }
        }
    }, [url]);

    const handleLaunch = () => {
        window.open(url, title, 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
    };

    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <p>No URL was provided for this web app.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-800 text-white relative">
             {isBlocked ? (
                 <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                    <OpenIcon />
                    <h2 className="text-2xl font-bold mb-2">{title}</h2>
                    <p className="text-gray-300 mb-8 max-w-md">
                        This application requires a secure window and cannot be embedded directly in the console.
                    </p>
                    <button 
                        onClick={handleLaunch}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-colors"
                    >
                        Launch {title}
                    </button>
                 </div>
             ) : (
                <>
                    {/* Persistent warning bar */}
                    {showWarning && (
                        <div className="bg-blue-600 text-white text-xs px-4 py-2 flex justify-between items-center flex-shrink-0 z-20">
                            <span>If the website shows "refused to connect", please open it in a new window.</span>
                            <div className="flex items-center space-x-3">
                                <button onClick={handleLaunch} className="underline font-bold hover:text-blue-100">
                                    Open Window
                                </button>
                                <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-white/20 rounded">
                                    <XIcon />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex-grow min-h-0 flex relative">
                        {/* Background hint */}
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                            Connecting to {title}...
                        </div>
                        
                        <iframe
                            src={url}
                            className="w-full flex-grow border-0 relative z-10 bg-white"
                            title={title}
                            allow="camera; microphone; geolocation; payment; fullscreen"
                            // Removed sandbox to be as permissive as possible
                            referrerPolicy="no-referrer"
                        />
                    </div>
                </>
             )}
        </div>
    );
};

export default WebAppViewer;
