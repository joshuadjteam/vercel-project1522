import React, { useState } from 'react';
import { Page } from '../../types';
import { database } from '../../services/database';

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;


interface MobiWebAppViewerProps {
    url: string;
    title: string;
    navigate: (page: Page) => void;
}

const MobiWebAppViewer: React.FC<MobiWebAppViewerProps> = ({ url, title, navigate }) => {
    const [status, setStatus] = useState('');

    if (!url) {
        return (
            <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
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
    
    const handleSaveSession = async () => {
        setStatus('Saving...');
        try {
            await database.saveWebAppState(title, url);
            setStatus('Saved!');
        } catch (e: any) {
            setStatus('Error!');
            console.error("Failed to save session:", e);
        } finally {
            setTimeout(() => setStatus(''), 2000);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800">
            <header className="flex-shrink-0 bg-white dark:bg-gray-900 p-2 flex items-center justify-between shadow-md z-10">
                <button onClick={() => navigate('home')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                    <BackIcon />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold truncate max-w-[180px] text-light-text dark:text-dark-text">{title}</h1>
                    {status && <span className="text-xs text-gray-500">{status}</span>}
                </div>
                <button 
                    onClick={handleSaveSession} 
                    className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                    aria-label="Save Session"
                >
                    <SaveIcon />
                </button>
            </header>
            <main className="flex-grow">
                <iframe
                    src={url}
                    className="w-full h-full border-0"
                    title={title}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                />
            </main>
        </div>
    );
};

export default MobiWebAppViewer;
