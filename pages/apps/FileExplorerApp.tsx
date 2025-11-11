
import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';

// Icons
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface FileExplorerAppProps {
    navigate: (page: Page, params?: any) => void;
}

interface VirtualFile {
    name: string;
    content: string;
    created: number;
    modified: number;
}

const MAX_STORAGE_BYTES = 1.5 * 1024 * 1024; // 1.5 MB

const FileExplorerApp: React.FC<FileExplorerAppProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [files, setFiles] = useState<Record<string, VirtualFile>>({});
    const [newFileName, setNewFileName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const storageKey = useMemo(() => `lynix_drive_${user?.username}`, [user]);

    useEffect(() => {
        if (!user) return;
        const storedFiles = localStorage.getItem(storageKey);
        if (storedFiles) {
            try {
                setFiles(JSON.parse(storedFiles));
            } catch (e) {
                console.error("Failed to parse user files", e);
                setFiles({});
            }
        }
    }, [user, storageKey]);

    const usedBytes = useMemo(() => {
        return new Blob([JSON.stringify(files)]).size;
    }, [files]);

    const usedPercentage = Math.min(100, (usedBytes / MAX_STORAGE_BYTES) * 100);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleCreateFile = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const fileName = newFileName.trim();
        if (!fileName) {
            setError('Filename cannot be empty.');
            return;
        }
        if (files[fileName]) {
            setError('File already exists.');
            return;
        }

        // Simple check before creation (rough estimate)
        if (usedBytes + 500 > MAX_STORAGE_BYTES) { // Assume min 500 bytes overhead for new file entry
             setError('Not enough storage space.');
             return;
        }

        const newFile: VirtualFile = {
            name: fileName,
            content: '',
            created: Date.now(),
            modified: Date.now(),
        };
        
        const updatedFiles = { ...files, [fileName]: newFile };
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
            setFiles(updatedFiles);
            setNewFileName('');
            setIsCreating(false);
            // Open newly created file
            navigate('app-editor', { file: fileName });
        } catch (e) {
            setError('Storage quota exceeded.');
        }
    };

    const handleDeleteFile = (fileName: string) => {
        if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
            const updatedFiles = { ...files };
            delete updatedFiles[fileName];
            setFiles(updatedFiles);
            localStorage.setItem(storageKey, JSON.stringify(updatedFiles));
        }
    };

    const handleOpenFile = (fileName: string) => {
        navigate('app-editor', { file: fileName });
    };

    const fileList = Object.values(files).sort((a, b) => b.modified - a.modified);

    return (
        <div className="w-full max-w-5xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center">
                    <span className="mr-2">📁</span> My Files
                </h1>
                <div className="flex items-center space-x-4">
                    <div className="text-right">
                        <p className="text-sm font-medium">{formatBytes(usedBytes)} / {formatBytes(MAX_STORAGE_BYTES)}</p>
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                            <div 
                                className={`h-full ${usedPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                                style={{ width: `${usedPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreating(true)} 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                    >
                        <PlusIcon />
                        <span>New File</span>
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="mb-6 bg-black/5 dark:bg-black/20 p-4 rounded-lg animate-fade-in">
                    <form onSubmit={handleCreateFile} className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            value={newFileName} 
                            onChange={(e) => setNewFileName(e.target.value)} 
                            placeholder="Enter filename (e.g., notes.txt, script.js)" 
                            className="flex-grow bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Create</button>
                        <button type="button" onClick={() => { setIsCreating(false); setError(''); }} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">Cancel</button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}

            <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
                {fileList.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {fileList.map(file => (
                            <div key={file.name} className="group relative bg-white/50 dark:bg-black/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center text-center transition-colors cursor-pointer border border-transparent hover:border-blue-300 dark:hover:border-blue-700">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }} 
                                    className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                                    title="Delete File"
                                >
                                    <TrashIcon />
                                </button>
                                <div onClick={() => handleOpenFile(file.name)} className="w-full flex flex-col items-center">
                                    <FileIcon />
                                    <h3 className="mt-2 font-medium truncate w-full" title={file.name}>{file.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(file.modified).toLocaleDateString()}</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatBytes(new Blob([file.content]).size)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mb-4 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                        <p className="text-xl">Your drive is empty.</p>
                        <p>Create a new file to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileExplorerApp;
