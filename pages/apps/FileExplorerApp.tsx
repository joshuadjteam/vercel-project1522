
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
// Import DriveFile from types.ts
import { Page, DriveFile } from '../../types';
import { database } from '../../services/database';

// Icons
const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const GoogleIcon = () => (
    <svg className="h-6 w-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64,15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,5 12,5C14.6,5 16.1,6.2 17.1,7.2L19,5.2C17.2,3.4 14.8,2 12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,11.63 21.95,11.36 21.89,11.1H21.35Z" fill="#fff"/>
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
    const [driveLinkStatus, setDriveLinkStatus] = useState<'checking' | 'unlinked' | 'linked'>('checking');
    const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
    const [isFilesLoading, setIsFilesLoading] = useState(false);
    const [driveError, setDriveError] = useState('');
    const [activeTab, setActiveTab] = useState<'local' | 'drive'>('local');

    const storageKey = useMemo(() => `lynix_drive_${user?.username}`, [user]);

    const fetchDriveFiles = useCallback(async () => {
        setIsFilesLoading(true);
        setDriveError('');
        const result = await database.getDriveFiles();
        if (result.files) {
            setDriveFiles(result.files);
        } else {
            setDriveError(result.error || 'Failed to load files.');
            if (result.reauth) {
                setDriveLinkStatus('unlinked');
            }
        }
        setIsFilesLoading(false);
    }, []);

    const checkDriveStatus = useCallback(async () => {
        setDriveLinkStatus('checking');
        const isLinked = await database.isDriveLinked();
        setDriveLinkStatus(isLinked ? 'linked' : 'unlinked');
        if (isLinked) {
            setActiveTab('drive');
        }
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
    
    useEffect(() => {
        if (driveLinkStatus === 'linked' && activeTab === 'drive') {
            fetchDriveFiles();
        }
    }, [driveLinkStatus, activeTab, fetchDriveFiles]);

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
        setDriveLinkStatus('unlinked'); // Stay on unlinked, but show some indication?
        
        const config = await database.getDriveOAuthConfig();
        if (!config) {
            alert('Could not retrieve Google Drive configuration from the server. Please try again later.');
            return;
        }

        const { clientId, redirectUri } = config;
        const scope = 'https://www.googleapis.com/auth/drive';
        const state = 'app-files'; // Can be used to redirect back to the app
        
        const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`;

        window.location.href = oauthUrl;
    };

    const handleUnlinkDrive = async () => {
        if (window.confirm('Are you sure you want to unlink your Google Drive account?')) {
            const { success } = await database.unlinkDrive();
            if (success) {
                setDriveLinkStatus('unlinked');
                setActiveTab('local');
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

    const renderLocalFiles = () => (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                     <button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center space-x-2">
                        <PlusIcon />
                        <span>New Local File</span>
                    </button>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium">{formatBytes(usedBytes)} / {formatBytes(MAX_STORAGE_BYTES)}</p>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                        <div className={`h-full ${usedPercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usedPercentage}%` }} />
                    </div>
                </div>
            </div>
            {isCreating && (
                <div className="mb-6 bg-black/5 dark:bg-black/20 p-4 rounded-lg animate-fade-in">
                    <form onSubmit={handleCreateFile} className="flex items-center space-x-2">
                        <input type="text" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} placeholder="Enter filename" className="flex-grow bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" autoFocus />
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Create</button>
                        <button type="button" onClick={() => { setIsCreating(false); setError(''); }} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md">Cancel</button>
                    </form>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}
            {fileList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {fileList.map(file => (
                        <div key={file.name} className="group relative bg-white/50 dark:bg-black/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center text-center transition-colors cursor-pointer" onClick={() => handleOpenFile(file.name)}>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }} className="absolute top-2 right-2 p-1 rounded-full bg-gray-200 dark:bg-gray-700 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white" title="Delete File"><TrashIcon /></button>
                            <FileIcon />
                            <h3 className="mt-2 font-medium truncate w-full" title={file.name}>{file.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{new Date(file.modified).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 mt-10"><p>No local files found.</p></div>
            )}
        </>
    );

    const renderDriveFiles = () => {
        if (driveLinkStatus === 'checking') {
            return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>;
        }
        if (driveLinkStatus === 'unlinked') {
            return (
                 <div className="flex flex-col items-center justify-center text-center h-full">
                    <CloudIcon />
                    <h1 className="text-3xl font-bold mt-4">Connect to Google Drive</h1>
                    <p className="mt-2 max-w-md text-gray-600 dark:text-gray-300">Link your account to view and manage your cloud files directly here.</p>
                    <button onClick={handleLinkDrive} className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-3"><GoogleIcon /><span>Link with Google</span></button>
                </div>
            );
        }
        if (isFilesLoading) {
            return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div><p className="ml-4">Fetching files...</p></div>;
        }
        if (driveError) {
             return <div className="h-full flex items-center justify-center text-red-500"><p>{driveError}</p></div>;
        }
        return driveFiles.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {driveFiles.map(file => (
                    <a key={file.id} href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="bg-white/50 dark:bg-black/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl p-4 flex flex-col items-center text-center transition-colors">
                        <img src={file.iconLink} alt="" className="h-12 w-12" />
                        <h3 className="mt-2 font-medium truncate w-full" title={file.name}>{file.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Modified: {new Date(file.modifiedTime).toLocaleDateString()}</p>
                    </a>
                ))}
            </div>
        ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-10"><p>No files found in your Google Drive.</p></div>
        );
    };

    return (
        <div className="w-full max-w-7xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white flex flex-col">
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                 <h1 className="text-3xl font-bold">File Explorer</h1>
                 {driveLinkStatus === 'linked' && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-1 rounded-full">
                        <CheckCircleIcon />
                        <span>Google Drive Connected</span>
                        <button onClick={handleUnlinkDrive} className="text-xs text-gray-500 hover:underline">(unlink)</button>
                    </div>
                 )}
            </div>
            <div className="flex border-b border-gray-300 dark:border-teal-700/50">
                <button onClick={() => setActiveTab('local')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'local' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5'}`}>Local Storage</button>
                <button onClick={() => setActiveTab('drive')} className={`px-4 py-2 font-semibold transition-colors ${activeTab === 'drive' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:bg-black/5'}`}>Google Drive</button>
            </div>
             <div className="flex-grow overflow-y-auto custom-scrollbar pt-6">
                {activeTab === 'local' ? renderLocalFiles() : renderDriveFiles()}
            </div>
        </div>
    );
};

export default FileExplorerApp;