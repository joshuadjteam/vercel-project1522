
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { DriveFile } from '../../types';
import { database } from '../../services/database';

const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;

const MobiNotepadApp: React.FC = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState<DriveFile[]>([]);
    const [selectedNote, setSelectedNote] = useState<DriveFile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentContent, setCurrentContent] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    const fetchNotes = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const { files, error } = await database.getDriveFiles("mimeType='text/plain' and trashed=false");
        if (files) {
            setNotes(files.sort((a,b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()));
        } else {
            setSaveStatus("Error: Could not load notes.");
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    const handleSelectNote = useCallback(async (note: DriveFile) => {
        setSelectedNote(note);
        setCurrentTitle(note.name);
        setCurrentContent('Loading...');
        const { file, error } = await database.getDriveFileDetails(note.id);
        setCurrentContent(file ? file.content : `Failed to load content: ${error}`);
    }, []);

    const handleNewNote = async () => {
        if (!user) return;
        const title = window.prompt("Enter a title for your new note:", "New Note.txt");
        if (title) {
            setSaveStatus("Creating...");
            const { file, error } = await database.createDriveFile(title);
            if (file) {
                await fetchNotes();
                handleSelectNote(file);
            } else {
                setSaveStatus(`Error: ${error}`);
            }
        }
    };

    const handleDeleteNote = async () => {
        if (!selectedNote) return;
        if (window.confirm(`Delete "${selectedNote.name}"?`)) {
            await database.deleteDriveFile(selectedNote.id);
            setSelectedNote(null);
            fetchNotes();
        }
    };
    
    const handleSaveNote = async () => {
        if (!selectedNote || !user) return;
        setSaveStatus('Saving...');
        const { success, error } = await database.updateDriveFile(selectedNote.id, { name: currentTitle, content: currentContent });
        setSaveStatus(success ? 'Saved!' : `Error: ${error}`);
        if(success) await fetchNotes();
        setTimeout(() => setSaveStatus(''), 2000);
    };

    if (selectedNote) {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-light-text dark:text-dark-text">
                <header className="flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-2 flex items-center justify-between shadow">
                    <button onClick={() => setSelectedNote(null)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><BackIcon /></button>
                    <div className="flex items-center space-x-2">
                        {saveStatus && <span className="text-sm text-gray-500">{saveStatus}</span>}
                        <button onClick={handleSaveNote} className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"><SaveIcon /></button>
                        <button onClick={handleDeleteNote} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon /></button>
                    </div>
                </header>
                <div className="flex-grow flex flex-col p-3">
                    <input type="text" value={currentTitle} onChange={(e) => setCurrentTitle(e.target.value)} placeholder="Title" className="text-xl font-bold bg-transparent focus:outline-none mb-2 pb-2 border-b border-gray-300 dark:border-gray-600" />
                    <textarea value={currentContent} onChange={(e) => setCurrentContent(e.target.value)} placeholder="Start writing..." className="flex-grow bg-transparent focus:outline-none resize-none text-base leading-relaxed" />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-800 text-light-text dark:text-dark-text">
            <header className="p-4 flex-shrink-0 bg-white dark:bg-gray-900 shadow-md flex justify-between items-center">
                <h1 className="text-2xl font-bold">Notes (Drive)</h1>
                <button onClick={handleNewNote} className="p-2 rounded-full bg-blue-600 text-white"><PlusIcon /></button>
            </header>
            <main className="flex-grow overflow-y-auto">
                {isLoading ? <p className="p-4 text-center">Loading...</p> : notes.map(note => (
                    <button key={note.id} onClick={() => handleSelectNote(note)} className="w-full text-left p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <h3 className="font-semibold truncate">{note.name}</h3>
                        <p className="text-xs text-gray-500">{new Date(note.modifiedTime).toLocaleDateString()}</p>
                    </button>
                ))}
            </main>
        </div>
    );
};

export default MobiNotepadApp;
