import React from 'react';

interface WebAppViewerProps {
    url: string;
    title: string;
}

const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

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
            <div className="flex-grow min-h-0 flex relative">
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center text-white pointer-events-none">
                    <InfoIcon />
                    <h2 className="text-xl font-semibold mt-2">Attempting to load {title}</h2>
                    <p className="mt-2 text-sm max-w-md text-gray-300">
                        If the content remains blank, the site likely blocks being embedded for security reasons (like ChatGPT, Google, etc.).
                    </p>
                    <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold pointer-events-auto text-sm transition-colors"
                    >
                        Open in a New Tab
                    </a>
                </div>
                <iframe
                    src={url}
                    className="w-full flex-grow border-0 relative z-10 bg-transparent"
                    title={title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
            </div>
        </div>
    );
};

export default WebAppViewer;