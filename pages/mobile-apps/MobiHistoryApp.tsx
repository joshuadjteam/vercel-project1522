import React, { useState, useEffect, useCallback } from 'react';
import { database } from '../../services/database';
import { DriveFile, Page } from '../../types';

interface SavedSession {
    id: string;
    name: string;
    url: string;
    title: string;
}

interface MobiHistoryAppProps {
    navigate: (page: Page, params?: any) => void;
}

const MobiHistoryApp: React.FC<MobiHistoryAppProps> = ({ navigate }) => {
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSessions = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const files = await database.getSavedWebAppStates();
            const sessionPromises = files.map(async (file) => {
                const { file: details, error } = await database.getDriveFileDetails(file.id);
                if (error || !details) return null;
                try {
                    const content = JSON.parse(details.content);
                    return { id: file.id, name: file.name, url: content.url, title: content.title };
                } catch (e) {
                    return null;
                }
            });
            const loadedSessions = (await Promise.all(sessionPromises)).filter((s): s is SavedSession => s !== null);
            setSessions(loadedSessions);
        } catch (e: any) {
            setError(e.message || 'Failed to load history.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleSessionClick = (session: SavedSession) => {
        navigate('mobi-app-webview', { url: session.url, title: session.title });
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400"></div></div>;
        }
        if (error) {
            return <div className="text-center text-red-400 mt-10"><p>{error}</p></div>;
        }
        if (sessions.length === 0) {
            return <div className="text-center text-gray-400 mt-10 p-4"><p>No saved sessions found. Save a web app session on mobile or desktop to see it here.</p></div>;
        }

        return (
            <div className="space-y-3">
                {sessions.map(session => (
                    <button 
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        className="w-full bg-white/5 dark:bg-black/20 p-4 rounded-xl text-left hover:bg-blue-900/40 transition-colors shadow-lg border border-white/10 dark:border-black/30"
                    >
                        <h3 className="font-bold text-white truncate">{session.title}</h3>
                        <p className="text-xs text-blue-300 truncate mt-1">{session.url}</p>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full p-4 bg-dark-bg text-light-text dark:text-white flex flex-col">
            <header className="flex-shrink-0 mb-4 text-center">
                <h1 className="text-3xl font-bold">History</h1>
                <p className="text-gray-400 mt-1 text-sm">Your saved web app sessions.</p>
            </header>
            <main className="flex-grow overflow-y-auto pr-2 -mr-2 custom-scrollbar">
                {renderContent()}
            </main>
        </div>
    );
};

export default MobiHistoryApp;
