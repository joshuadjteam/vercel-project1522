
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Note } from '../../types';

const NotepadApp: React.FC = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTitle, setCurrentTitle] = useState('');
    const [currentContent, setCurrentContent] = useState('');
    const [saveStatus, setSaveStatus] = useState('');

    const fetchNotes = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const userNotes = await database.getNotesForUser(user.username);
        setNotes(userNotes);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        fetchNotes();
    }, [fetchNotes]);

    useEffect(() => {
        if (selectedNote) {
            setCurrentTitle(selectedNote.title);
            setCurrentContent(selectedNote.content);
        } else {
            setCurrentTitle('');
            setCurrentContent('');
        }
    }, [selectedNote]);

    const handleSelectNote = (note: Note) => {
        setSelectedNote(note);
    };

    const handleNewNote = async () => {
        if (!user) return;
        // FIX: Removed the `owner` property to match the expected type for `database.addNote`.
        // The owner is inferred from the user's session on the backend.
        const newNote = await database.addNote({
            title: 'New Note',
            content: '',
        });
        await fetchNotes();
        setSelectedNote(newNote);
    };

    const handleDeleteNote = async () => {
        if (!selectedNote) return;
        if (window.confirm('Are you sure you want to delete this note?')) {
            await database.deleteNote(selectedNote.id);
            setSelectedNote(null);
            fetchNotes();
        }
    };
    
    const handleSaveNote = async () => {
        if (!selectedNote || !user) return;
        setSaveStatus('Saving...');
        const updatedNote = {
            ...selectedNote,
            title: currentTitle,
            content: currentContent,
        };
        await database.updateNote(updatedNote);
        setSaveStatus('Note saved!');
        fetchNotes(); // to re-sort list if title changed
        setTimeout(() => setSaveStatus(''), 2000);
    };


    return (
        <div className="w-full max-w-6xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl text-light-text dark:text-white flex overflow-hidden">
            {/* Notes List Sidebar */}
            <div className="w-1/3 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-teal-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold">My Notes</h2>
                    <button onClick={handleNewNote} className="px-3 py-1 text-sm rounded-md bg-blue-600 hover:bg-blue-700 text-white">
                        New
                    </button>
                </div>
                 <div className="p-2 text-center text-xs text-gray-500 dark:text-gray-400 bg-yellow-100 dark:bg-yellow-900/50">
                    Notes are deleted after 72 hours of inactivity.
                </div>
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? <p className="p-4">Loading...</p> : notes.map(note => (
                        <button key={note.id} onClick={() => handleSelectNote(note)} className={`w-full text-left p-3 border-b border-gray-200 dark:border-teal-800/80 ${selectedNote?.id === note.id ? 'bg-teal-100 dark:bg-teal-600/50' : 'hover:bg-gray-100 dark:hover:bg-teal-700/40'}`}>
                            <h3 className="font-semibold truncate">{note.title}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(note.createdAt).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Editor View */}
            <div className="w-2/3 flex flex-col">
                {selectedNote ? (
                    <>
                        <div className="p-3 border-b border-gray-200 dark:border-teal-700/50 flex justify-end items-center space-x-2 bg-black/5 dark:bg-black/10">
                            {saveStatus && <span className="text-sm text-green-600 dark:text-green-400">{saveStatus}</span>}
                             <button onClick={handleSaveNote} className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm">
                                Save
                             </button>
                            <button onClick={handleDeleteNote} className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm">
                                Delete
                            </button>
                        </div>
                        <div className="flex-grow flex flex-col p-4">
                            <input
                                type="text"
                                value={currentTitle}
                                onChange={(e) => setCurrentTitle(e.target.value)}
                                placeholder="Note Title"
                                className="text-2xl font-bold bg-transparent focus:outline-none mb-4 pb-2 border-b-2 border-gray-200 dark:border-teal-700/50"
                            />
                            <textarea
                                value={currentContent}
                                onChange={(e) => setCurrentContent(e.target.value)}
                                placeholder="Start writing..."
                                className="flex-grow bg-transparent focus:outline-none resize-none text-lg leading-relaxed"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center text-gray-500 dark:text-gray-400">
                        <div>
                            <h2 className="text-2xl font-semibold">Select a note or create a new one</h2>
                            <p>Your notes will appear here.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotepadApp;