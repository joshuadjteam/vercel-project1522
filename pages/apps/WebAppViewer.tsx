
import React, { useState } from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title }) => {
    const [showWarning, setShowWarning] = useState(true);

    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <p>No URL was provided for this web app.</p>
            </div>
        );
    }
    return (
        <div className="w-full h-full flex flex-col bg-gray-800 text-white">
             {/* Persistent warning bar for blocked sites */}
             {showWarning && (
                <div className="bg-blue-600 text-white text-xs px-4 py-2 flex justify-between items-center flex-shrink-0 z-20">
                    <span>Some sites (like ChatGPT) may block embedding. If blank, please use "Open in New Tab".</span>
                    <button onClick={() => setShowWarning(false)} className="ml-2 p-1 hover:bg-white/20 rounded">
                        <XIcon />
                    </button>
                </div>
            )}
            
            <div className="flex-grow min-h-0 flex relative">
                 {/* Background hint */}
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    Loading content...
                </div>
                
                <iframe
                    src={url}
                    className="w-full flex-grow border-0 relative z-10 bg-white"
                    title={title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
            </div>
        </div>
    );
};

export default WebAppViewer;
