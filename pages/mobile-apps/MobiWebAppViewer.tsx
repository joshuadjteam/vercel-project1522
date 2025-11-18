
import React, { useState } from 'react';
import { Page } from '../../types';
import { database } from '../../services/database';

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const OpenExternalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;

interface MobiWebAppViewerProps {
    url: string;
    title: string;
    navigate: (page: Page) => void;
}

const MobiWebAppViewer: React.FC<MobiWebAppViewerProps> = ({ url, title, navigate }) => {
    const [showWarning, setShowWarning] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!url || !title) return;
        setIsSaving(true);
        try {
            await database.saveWebAppState(title, url);
            alert("Session saved to History!");
        } catch (e: any) {
            console.error(e);
            alert("Failed to save session.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenExternal = () => {
        // Open as a popup to simulate a "device" view or a new app window
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
                    <h1 className="ml-2 text-lg font-bold truncate max-w-[140px] text-light-text dark:text-dark-text">{title}</h1>
                </div>
                <div className="flex items-center space-x-1">
                     <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="p-2 rounded-full text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 disabled:opacity-50"
                        aria-label="Save to History"
                    >
                        <SaveIcon />
                    </button>
                    <button
                        onClick={handleOpenExternal}
                        className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                        aria-label="Open in popup"
                    >
                        <OpenExternalIcon />
                    </button>
                </div>
            </header>
            
            {/* Persistent warning bar for blocked sites */}
            {showWarning && (
                <div className="bg-blue-600 text-white text-xs px-4 py-2 flex justify-between items-center z-20 flex-shrink-0">
                    <span className="flex-grow mr-2">If refused to connect, click the arrow icon top-right.</span>
                    <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-white/20 rounded flex-shrink-0">
                        <XIcon />
                    </button>
                </div>
            )}

            <main className="flex-grow flex min-h-0 relative bg-white">
                {/* Background hint in case iframe is transparent or slow */}
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                    Loading {title}...
                </div>
                <iframe
                    src={url}
                    className="w-full flex-grow border-0 relative z-10 bg-white"
                    title={title}
                    scrolling="yes"
                    allowFullScreen
                    referrerPolicy="no-referrer"
                    style={{ height: '100%', width: '100%' }}
                />
            </main>
        </div>
    );
};

export default MobiWebAppViewer;
