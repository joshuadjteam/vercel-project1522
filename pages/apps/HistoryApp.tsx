import React, { useState, useEffect, useCallback } from 'react';
import { database } from '../../services/database';
import { DriveFile, Page } from '../../types';

interface SavedSession {
    id: string;
    name: string;
    url: string;
    title: string;
    size?: { width: number; height: number };
    position?: { x: number; y: number };
}

interface HistoryAppProps {
    navigate: (page: Page, params?: any) => void;
}

const HistoryApp: React.FC<HistoryAppProps> = ({ navigate }) => {
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchSessions = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const files = await database.getSavedWebAppStates();
            const sessionPromises = files.map(async (file): Promise<SavedSession | null> => {
                const { file: details, error } = await database.getDriveFileDetails(file.id);
                if (error || !details) return null;
                try {
                    const content = JSON.parse(details.content);
                    return {
                        id: file.id,
                        name: file.name,
                        url: content.url,
                        title: content.title,
                        size: content.size,
                        position: content.position,
                    };
                } catch (e) {
                    return null;
                }
            });
            // FIX: The type predicate `s is SavedSession` was causing an error because TypeScript couldn't guarantee that the inferred type from the map was assignable to `SavedSession`. Explicitly typing the map's return value fixes this.
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
        navigate('app-webview', {
            url: session.url,
            title: session.title,
            size: session.size,
            position: session.position,
            isWebApp: true,
        });
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div></div>;
        }
        if (error) {
            return <div className="text-center text-red-400 mt-10"><p>{error}</p></div>;
        }
        if (sessions.length === 0) {
            return <div className="text-center text-gray-400 mt-10"><p>No saved sessions found in your Google Drive's /lynix/ folder.</p></div>;
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sessions.map(session => (
                    <button 
                        key={session.id}
                        onClick={() => handleSessionClick(session)}
                        className="bg-white/5 dark:bg-black/20 p-5 rounded-xl text-left hover:bg-blue-900/40 transition-colors shadow-lg border border-white/10 dark:border-black/30"
                    >
                        <h3 className="text-lg font-bold text-white truncate">{session.title}</h3>
                        <p className="text-xs text-blue-300 truncate mt-1">{session.url}</p>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="w-full h-full p-8 bg-dark-bg text-light-text dark:text-white flex flex-col">
            <header className="flex-shrink-0 mb-8 text-center">
                <h1 className="text-5xl font-bold">History</h1>
                <p className="text-gray-400 mt-2">Relaunch your saved web app sessions.</p>
            </header>
            <main className="flex-grow overflow-y-auto pr-4 -mr-4 custom-scrollbar">
                {renderContent()}
            </main>
        </div>
    );
};

export default HistoryApp;