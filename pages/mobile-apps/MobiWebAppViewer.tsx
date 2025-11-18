import React from 'react';
import { Page } from '../../types';

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const OpenExternalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


interface MobiWebAppViewerProps {
    url: string;
    title: string;
    navigate: (page: Page) => void;
}

const MobiWebAppViewer: React.FC<MobiWebAppViewerProps> = ({ url, title, navigate }) => {
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
                <button onClick={() => navigate('home')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <BackIcon />
                </button>
                <h1 className="text-lg font-bold truncate max-w-[180px] text-light-text dark:text-dark-text">{title}</h1>
                <a 
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    aria-label="Open in new tab"
                >
                    <OpenExternalIcon />
                </a>
            </header>
            <main className="flex-grow flex min-h-0 relative bg-gray-800">
                <div className="absolute inset-0 p-4 flex flex-col items-center justify-center text-center text-white pointer-events-none">
                    <InfoIcon />
                    <h2 className="text-xl font-semibold mt-2">Loading {title}...</h2>
                    <p className="mt-2 text-sm max-w-xs text-gray-300">
                        If content doesn't appear, the site (e.g., ChatGPT) may block embedding.
                    </p>
                    <a 
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 px-4 py-2 bg-blue-600 rounded-lg font-semibold pointer-events-auto"
                    >
                        Open in New Tab
                    </a>
                </div>
                <iframe
                    src={url}
                    className="w-full flex-grow border-0 relative z-10 bg-transparent"
                    title={title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
            </main>
        </div>
    );
};

export default MobiWebAppViewer;