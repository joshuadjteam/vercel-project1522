
import React, { useState, useMemo } from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
    iconSvg?: string;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const ExternalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const LinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

// List of domains that are known to block iframe embedding.
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
    'whatsapp.com',
    'netflix.com'
];

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title, iconSvg }) => {
    // Normalize URL to ensure it has a protocol
    const safeUrl = useMemo(() => {
        if (!url) return '';
        if (url.startsWith('internal://') || url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    }, [url]);

    const handleLaunch = () => {
        // Open as a semi-new tab (popup)
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
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#18191a] p-8 text-center">
                <div className="bg-white dark:bg-[#242526] p-8 rounded-2xl shadow-lg max-w-md w-full flex flex-col items-center border border-gray-200 dark:border-gray-700">
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-[#3a3b3c] rounded-2xl">
                        {iconSvg ? (
                            <div className="w-16 h-16 text-gray-800 dark:text-white" dangerouslySetInnerHTML={{ __html: iconSvg }} />
                        ) : (
                            <LinkIcon />
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        This application requires a secure session window to function correctly.
                    </p>
                    
                    <button 
                        onClick={handleLaunch}
                        className="w-full py-3 px-6 bg-[#1877f2] hover:bg-[#166fe5] text-white text-lg font-semibold rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md transform active:scale-95"
                    >
                        <ExternalIcon />
                        <span>Connect to {title}</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 relative">
            {/* Fallback header in case site refuses to load later */}
            <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs px-4 py-2 flex justify-between items-center flex-shrink-0">
                <span className="flex-grow mr-2 text-gray-500 dark:text-gray-400 truncate">{safeUrl}</span>
                <button onClick={handleLaunch} className="text-blue-600 dark:text-blue-400 hover:underline font-medium flex items-center space-x-1">
                    <ExternalIcon />
                    <span>Open in Window</span>
                </button>
            </div>
            
            <div className="flex-grow min-h-0 flex relative">
                <iframe
                    src={safeUrl}
                    className="w-full flex-grow border-0 relative z-10 bg-white"
                    title={title}
                    allow="camera; microphone; geolocation; payment; fullscreen; clipboard-read; clipboard-write"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
                />
            </div>
        </div>
    );
};

export default WebAppViewer;
