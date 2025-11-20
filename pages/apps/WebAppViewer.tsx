
import React, { useState, useMemo } from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
    iconSvg?: string;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ExternalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

// List of domains that are known to block iframe embedding.
// We will show a "Portal" UI for these instead of a broken iframe.
const BLOCKED_DOMAINS = [
    'x.com', 
    'twitter.com', 
    'facebook.com', 
    'instagram.com', 
    'reddit.com', 
    'discord.com', 
    'discord.gg', 
    'linkedin.com', 
    'google.com',
    'youtube.com',
    'whatsapp.com'
];

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title, iconSvg }) => {
    const [showWarning, setShowWarning] = useState(true);

    // Normalize URL to ensure it has a protocol
    const safeUrl = useMemo(() => {
        if (!url) return '';
        // Check if it's an internal app URI or already has a protocol
        if (url.startsWith('internal://') || url.startsWith('http://') || url.startsWith('https://')) return url;
        // Default to https for web apps
        return `https://${url}`;
    }, [url]);

    const handleLaunch = () => {
        window.open(safeUrl, title, 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
    };

    if (!safeUrl) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <p>No URL was provided for this web app.</p>
            </div>
        );
    }

    // Check if this domain is blocked
    const isBlocked = BLOCKED_DOMAINS.some(domain => safeUrl.includes(domain));

    if (isBlocked) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-slate-800 dark:to-slate-900 p-8 text-center">
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-md w-full flex flex-col items-center border border-white/20 dark:border-white/10">
                    <div className="mb-6 p-4 bg-gray-100 dark:bg-white/10 rounded-2xl shadow-inner">
                        {iconSvg ? (
                            <div className="w-20 h-20 text-gray-800 dark:text-white" dangerouslySetInnerHTML={{ __html: iconSvg }} />
                        ) : (
                            <LinkIcon />
                        )}
                    </div>
                    
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8">
                        {title} requires a secure connection that cannot be embedded directly. Launch the portal to access it.
                    </p>
                    
                    <button 
                        onClick={handleLaunch}
                        className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 shadow-lg hover:shadow-blue-500/30 transform hover:-translate-y-1"
                    >
                        <ExternalIcon />
                        <span>Launch {title}</span>
                    </button>
                    
                    <p className="mt-6 text-xs text-gray-400">
                        This will open a secure application window.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-800 text-white relative">
            {/* Persistent warning bar for other sites that might block intermittently */}
            {showWarning && (
                <div className="bg-blue-600 text-white text-xs px-4 py-2 flex justify-between items-center flex-shrink-0 z-20">
                    <span className="flex-grow mr-2">If the site below fails to load, use the button to open it safely:</span>
                    <div className="flex items-center space-x-3">
                        <button onClick={handleLaunch} className="underline font-bold hover:text-blue-100 flex items-center space-x-1 whitespace-nowrap">
                            <ExternalIcon />
                            <span>Open Window</span>
                        </button>
                        <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-white/20 rounded">
                            <XIcon />
                        </button>
                    </div>
                </div>
            )}
            
            <div className="flex-grow min-h-0 flex relative">
                {/* Background hint */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-sm p-4 text-center">
                    <p className="mb-2">Connecting to {title}...</p>
                    <p className="text-xs opacity-70 max-w-xs">If you see a "refused to connect" message, use the "Open Window" button above.</p>
                </div>
                
                <iframe
                    src={safeUrl}
                    className="w-full flex-grow border-0 relative z-10 bg-white"
                    title={title}
                    allow="camera; microphone; geolocation; payment; fullscreen; clipboard-read; clipboard-write"
                    referrerPolicy="no-referrer"
                />
            </div>
        </div>
    );
};

export default WebAppViewer;
