
import React, { useState, useMemo } from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title }) => {
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

    return (
        <div className="w-full h-full flex flex-col bg-gray-800 text-white relative">
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
                    src={safeUrl}
                    className="w-full flex-grow border-0 relative z-10 bg-white"
                    title={title}
                    // Allow full permissions to simulate a native tab behavior as much as possible
                    allow="camera; microphone; geolocation; payment; fullscreen; clipboard-read; clipboard-write"
                    referrerPolicy="no-referrer"
                    // No sandbox attribute ensures it runs as a normal frame (subject to CORS/X-Frame-Options)
                />
            </div>
        </div>
    );
};

export default WebAppViewer;
