
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';
import { database } from '../../services/database';

// Icons
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GoogleIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,5 12,5C14.6,5 16.1,6.2 17.1,7.2L19,5.2C17.2,3.4 14.8,2 12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,11.63 21.95,11.36 21.89,11.1H21.35Z" fill="#fff"/>
    </svg>
);


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
    const [driveLinkStatus, setDriveLinkStatus] = useState<'checking' | 'unlinked' | 'linking' | 'linked'>('checking');

    const storageKey = useMemo(() => `lynix_drive_${user?.username}`, [user]);

    const checkDriveStatus = useCallback(async () => {
        setDriveLinkStatus('checking');
        const isLinked = await database.isDriveLinked();
        setDriveLinkStatus(isLinked ? 'linked' : 'unlinked');
    }, []);
    
    useEffect(() => {
        if (user) {
            checkDriveStatus();
            const storedFiles = localStorage.getItem(storageKey);
            if (storedFiles) {
                try {
                    setFiles(JSON.parse(storedFiles));
                } catch (e) {
                    console.error("Failed to parse user files", e);
                    setFiles({});
                }
            }
        }
    }, [user, storageKey, checkDriveStatus]);

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
    
    const handleLinkDrive = async () => {
        setDriveLinkStatus('linking');
        
        const config = await database.getDriveOAuthConfig();
        if (!config) {
            alert('Could not retrieve Google Drive configuration from the server. Please try again later.');
            setDriveLinkStatus('unlinked');
            return;
        }

        const { clientId, redirectUri } = config;
        const scope = 'https://www.googleapis.com/auth/drive';
        const state = 'app-files';
        
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

        window.location.href = oauthUrl;
    };

    const handleUnlinkDrive = async () => {
        if (window.confirm('Are you sure you want to unlink your Google Drive account? This will not delete your files.')) {
            const { success } = await database.unlinkDrive();
            if (success) {
                setDriveLinkStatus('unlinked');
            } else {
                alert('Failed to unlink your account. Please try again.');
            }
        }
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

        if (usedBytes + 500 > MAX_STORAGE_BYTES) { 
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

    const fileList = (Object.values(files) as VirtualFile[]).sort((a, b) => b.modified - a.modified);

    if (driveLinkStatus !== 'linked') {
        const isLoading = driveLinkStatus === 'checking' || driveLinkStatus === 'linking';
        return (
            <div className="w-full max-w-5xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white flex flex-col items-center justify-center text-center">
                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-lg">{driveLinkStatus === 'checking' ? 'Checking connection status...' : 'Connecting to Google...'}</p>
                    </div>
                ) : (
                    <>
                        <CloudIcon />
                        <h1 className="text-3xl font-bold mt-4">Connect to the Cloud</h1>
                        <p className="mt-2 max-w-md text-gray-600 dark:text-gray-300">
                            Link your Google Drive account to access your files from anywhere and get more storage. Your local files will be synced.
                        </p>
                        <div className="mt-8">
                            <button 
                                onClick={handleLinkDrive} 
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center space-x-3"
                            >
                                <GoogleIcon />
                                <span>Link with your Google Account</span>
                            </button>
                        </div>
                    </>
                )}
                 <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-300 dark:border-teal-700 pt-4 w-full max-w-md">
                    <p className="font-semibold">Current Usage (Local Storage)</p>
                     <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                        <div 
                            className={`h-full ${usedPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} 
                            style={{ width: `${usedPercentage}%` }}
                        ></div>
                    </div>
                    <p className="mt-1">{formatBytes(usedBytes)} / {formatBytes(MAX_STORAGE_BYTES)}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div className="flex items-center space-x-3">
                    <h1 className="text-3xl font-bold">My Files</h1>
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full">
                        <CheckCircleIcon />
                        <span>Google Drive</span>
                        <button onClick={handleUnlinkDrive} className="text-xs text-gray-500 hover:underline">(unlink)</button>
                    </div>
                </div>
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
