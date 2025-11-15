
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';
import { database } from '../../services/database';

const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;

interface MobiEditorAppProps {
    navigate: (page: Page, params?: any) => void;
    initialFileId?: string | null;
    title?: string;
}

const MobiEditorApp: React.FC<MobiEditorAppProps> = ({ navigate, initialFileId, title }) => {
    const { user } = useAuth();
    const [fileId, setFileId] = useState(initialFileId || null);
    const [fileName, setFileName] = useState(title || '');
    const [content, setContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadFile = async () => {
            if (initialFileId && user) {
                setStatus('Loading...'); setIsLoading(true);
                setFileId(initialFileId);
                const { file, error } = await database.getDriveFileDetails(initialFileId);
                if (file) {
                    setContent(file.content); setFileName(file.name); setIsDirty(false); setStatus('');
                } else {
                    setStatus(`Error: ${error || 'Could not load file.'}`);
                }
                setIsLoading(false);
            } else if (user) {
                setStatus('No file selected.'); setIsLoading(false);
            }
        };
        loadFile();
    }, [initialFileId, user]);

    const handleSave = async () => {
        if (!user || !fileId) return;
        setStatus('Saving...');
        const { success, error } = await database.updateDriveFile(fileId, { content });
        if (success) {
            setIsDirty(false); setStatus('Saved!');
            setTimeout(() => setStatus(''), 2000);
        } else {
            setStatus(`Error: ${error || 'Failed to save.'}`);
        }
    };

    const handleClose = () => {
        if (isDirty && !window.confirm('You have unsaved changes. Close anyway?')) return;
        navigate('app-files');
    };
    
    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-light-text dark:text-dark-text">
            <header className="flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-2 flex items-center justify-between shadow">
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><BackIcon /></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-lg font-bold truncate max-w-[150px]">{fileName}</h1>
                    {isDirty && <span className="text-xs text-yellow-500">Unsaved</span>}
                    {status && <span className="text-xs text-gray-500">{status}</span>}
                </div>
                <button onClick={handleSave} disabled={!fileId || isLoading} className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:text-gray-400"><SaveIcon /></button>
            </header>
            
            <main className="flex-grow">
                <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
                    className="w-full h-full p-3 resize-none bg-white dark:bg-gray-800 font-mono text-base focus:outline-none"
                    spellCheck="false"
                    placeholder={isLoading ? "Loading..." : "Start typing..."}
                    disabled={!fileId || isLoading}
                />
            </main>
        </div>
    );
};

export default MobiEditorApp;
