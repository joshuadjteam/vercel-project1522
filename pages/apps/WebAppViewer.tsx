import React from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const WebAppViewer: React.FC<WebAppViewerProps> = ({ url, title }) => {
    if (!url) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
                <p>No URL was provided for this web app.</p>
            </div>
        );
    }
    return (
        <div className="w-full h-full flex flex-col bg-gray-800 text-white">
            <div className="flex-shrink-0 p-2 bg-black/30 text-xs text-gray-300 flex items-center justify-center space-x-2 text-center">
                <InfoIcon />
                <span>
                    If the app doesn't load, try 
                    <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1 font-semibold text-blue-400 hover:underline">
                        opening it in a new tab
                    </a>. Some sites block being embedded.
                </span>
            </div>
            <div className="flex-grow min-h-0">
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
            </div>
        </div>
    );
};

export default WebAppViewer;