
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';

// Icons
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

interface EditorAppProps {
    navigate: (page: Page, params?: any) => void;
    initialFile?: string | null;
}

interface VirtualFile {
    name: string;
    content: string;
    created: number;
    modified: number;
}

const MAX_STORAGE_BYTES = 1.5 * 1024 * 1024;

const EditorApp: React.FC<EditorAppProps> = ({ navigate, initialFile }) => {
    const { user } = useAuth();
    const [fileName, setFileName] = useState(initialFile || 'Untitled.txt');
    const [content, setContent] = useState('');
    const [isDirty, setIsDirty] = useState(false);
    const [status, setStatus] = useState('');

    const storageKey = useMemo(() => `lynix_drive_${user?.username}`, [user]);

    useEffect(() => {
        if (initialFile && user) {
            const storedFiles = localStorage.getItem(storageKey);
            if (storedFiles) {
                try {
                    const files = JSON.parse(storedFiles);
                    if (files[initialFile]) {
                        setContent(files[initialFile].content);
                        setFileName(initialFile);
                        setIsDirty(false);
                    } else {
                        // File not found, treat as new
                        setStatus(`File "${initialFile}" not found. Created new.`);
                    }
                } catch (e) {
                    console.error("Failed to load file", e);
                }
            }
        }
    }, [initialFile, user, storageKey]);

    const handleSave = () => {
        if (!user) return;
        setStatus('Saving...');
        try {
            const storedFilesStr = localStorage.getItem(storageKey) || '{}';
            const files = JSON.parse(storedFilesStr);
            
            const newFile: VirtualFile = {
                name: fileName,
                content: content,
                created: files[fileName]?.created || Date.now(),
                modified: Date.now(),
            };

            const updatedFiles = { ...files, [fileName]: newFile };
            
            // Check quota
            const usedBytes = new Blob([JSON.stringify(updatedFiles)]).size;
            if (usedBytes > MAX_STORAGE_BYTES) {
                setStatus('Error: Not enough storage space to save.');
                return;
            }

            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
            setIsDirty(false);
            setStatus('Saved successfully.');
            setTimeout(() => setStatus(''), 3000);

        } catch (e) {
            console.error("Save failed", e);
            setStatus('Error: Failed to save file.');
        }
    };

    const handleClose = () => {
        if (isDirty) {
            if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                navigate('app-files');
            }
        } else {
            navigate('app-files');
        }
    };

    // Basic "syntax highlighting" just by file extension for the UI label
    const getFileType = (name: string) => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch(ext) {
            case 'js': return 'JavaScript';
            case 'ts': return 'TypeScript';
            case 'html': return 'HTML';
            case 'css': return 'CSS';
            case 'json': return 'JSON';
            case 'md': return 'Markdown';
            default: return 'Plain Text';
        }
    };

    return (
        <div className="w-full max-w-6xl h-[85vh] bg-light-card/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-300 dark:border-slate-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-3 bg-gray-100 dark:bg-slate-800 border-b border-gray-300 dark:border-slate-700">
                <div className="flex items-center space-x-4">
                    <input 
                        type="text" 
                        value={fileName} 
                        onChange={(e) => { setFileName(e.target.value); setIsDirty(true); }}
                        className="bg-transparent font-mono font-semibold text-lg focus:outline-none focus:border-b-2 border-blue-500 text-gray-800 dark:text-gray-200"
                        placeholder="Filename"
                    />
                    {isDirty && <span className="text-yellow-500 text-xs uppercase font-bold tracking-wider">Unsaved</span>}
                    <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-slate-700 rounded-full text-gray-600 dark:text-gray-400">
                        {getFileType(fileName)}
                    </span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">{status}</span>
                    <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center space-x-2 transition-colors">
                        <SaveIcon />
                        <span>Save</span>
                    </button>
                    <button onClick={handleClose} className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center space-x-2 transition-colors">
                        <CloseIcon />
                        <span>Close</span>
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-grow relative">
                <textarea
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setIsDirty(true); }}
                    className="w-full h-full p-4 resize-none bg-[#f8f9fa] dark:bg-[#1e1e1e] text-gray-800 dark:text-[#d4d4d4] font-mono text-sm leading-relaxed focus:outline-none"
                    spellCheck="false"
                    placeholder="Start typing..."
                />
            </div>
             {/* Status Bar */}
            <div className="px-4 py-1 bg-blue-600 text-white text-xs flex justify-between font-mono">
                <div>Ln {content.substr(0, content.length).split('\n').length}, Col {content.length - content.lastIndexOf('\n') - 1}</div>
                <div>UTF-8</div>
            </div>
        </div>
    );
};

export default EditorApp;
