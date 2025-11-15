
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Mail, MailAccount } from '../../types';

// Icons
const ComposeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const SendIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;

type MailView = 'inbox' | 'sent' | 'spam';
type UIState = 'list' | 'detail' | 'compose';

const MobiLocalMailApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [view, setView] = useState<MailView>('inbox');
    const [uiState, setUiState] = useState<UIState>('list');
    const [inbox, setInbox] = useState<Mail[]>([]);
    const [sent, setSent] = useState<Mail[]>([]);
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [sendStatus, setSendStatus] = useState('');

    const fetchMails = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const { inbox, sent } = await database.getMailsForUser(currentUser.username);
        setInbox(inbox);
        setSent(sent);
        setIsLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchMails();
    }, [fetchMails]);

    const handleSelectMail = async (mail: Mail) => {
        setSelectedMail(mail);
        setUiState('detail');
        if (!mail.read && mail.recipient === currentUser?.username) {
            await database.markMailAsRead(mail.id);
            setInbox(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
        }
    };

    const handleDeleteMail = async (mailId: number) => {
        if (window.confirm("Delete this email?")) {
            await database.deleteMail(mailId);
            setUiState('list');
            setSelectedMail(null);
            fetchMails();
        }
    };
    
    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !currentUser) { setSendStatus('Recipient is required.'); return; }
        setSendStatus('Sending...');
        const fromEmail = `${currentUser.username}@lynix.local`;
        const mail = await database.sendMail({ sender: fromEmail, recipient, subject, body });
        if (mail) {
            setSendStatus('Mail sent!');
            setTimeout(() => {
                setRecipient(''); setSubject(''); setBody('');
                setUiState('list'); setView('sent');
                fetchMails();
            }, 1000);
        } else {
            setSendStatus('Failed to send mail.');
        }
    };

    if (uiState === 'compose') {
        return (
            <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-light-text dark:text-dark-text">
                <header className="flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-3 flex items-center justify-between shadow">
                    <button onClick={() => setUiState('list')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><BackIcon /></button>
                    <h1 className="text-xl font-bold">New Message</h1>
                    <button onClick={handleSend} className="p-2 rounded-full text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/50"><SendIcon /></button>
                </header>
                <form onSubmit={handleSend} className="flex-grow flex flex-col p-3 overflow-y-auto">
                    <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="To" className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none" />
                    <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full p-2 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none" />
                    <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your message..." className="flex-grow w-full p-2 bg-transparent mt-2 focus:outline-none resize-none" />
                    {sendStatus && <p className="text-sm text-center p-2">{sendStatus}</p>}
                </form>
            </div>
        );
    }
    
    if (uiState === 'detail' && selectedMail) {
        return (
             <div className="w-full h-full flex flex-col bg-white dark:bg-gray-800 text-light-text dark:text-dark-text">
                <header className="flex-shrink-0 bg-gray-100 dark:bg-gray-900 p-3 flex items-center justify-between shadow">
                    <button onClick={() => setUiState('list')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><BackIcon /></button>
                    <h1 className="text-xl font-bold truncate flex-grow text-center">{selectedMail.subject}</h1>
                    <button onClick={() => handleDeleteMail(selectedMail.id)} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"><TrashIcon /></button>
                </header>
                <div className="flex-grow p-4 overflow-y-auto">
                    <div className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
                        <p><strong>From:</strong> {selectedMail.sender}</p>
                        <p><strong>To:</strong> {selectedMail.recipient}</p>
                        <p><strong>Date:</strong> {new Date(selectedMail.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="whitespace-pre-wrap">{selectedMail.body}</div>
                </div>
            </div>
        );
    }

    const currentMailList = view === 'inbox' ? inbox : sent;

    return (
        <div className="w-full h-full flex flex-col bg-gray-100 dark:bg-gray-900 text-light-text dark:text-dark-text">
            <header className="p-4 flex-shrink-0">
                <h1 className="text-3xl font-bold">LocalMail</h1>
                <div className="flex mt-4 border-b border-gray-300 dark:border-gray-700">
                    <button onClick={() => setView('inbox')} className={`px-4 py-2 text-lg font-semibold ${view === 'inbox' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Inbox</button>
                    <button onClick={() => setView('sent')} className={`px-4 py-2 text-lg font-semibold ${view === 'sent' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}>Sent</button>
                </div>
            </header>
            <main className="flex-grow overflow-y-auto relative">
                {isLoading ? <p className="p-4 text-center">Loading...</p> : currentMailList.length > 0 ? (
                    <ul>
                        {currentMailList.map(mail => (
                            <li key={mail.id} className="border-b border-gray-200 dark:border-gray-700">
                                <button onClick={() => handleSelectMail(mail)} className={`w-full text-left p-4 ${!mail.read && view === 'inbox' ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                    <div className="flex justify-between items-start">
                                        <p className={`font-semibold truncate ${!mail.read && view === 'inbox' ? 'text-blue-600 dark:text-blue-400' : ''}`}>{view === 'inbox' ? mail.sender : mail.recipient}</p>
                                        <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{new Date(mail.timestamp).toLocaleDateString()}</p>
                                    </div>
                                    <p className="truncate font-medium">{mail.subject || '(no subject)'}</p>
                                    <p className="text-sm text-gray-500 truncate">{mail.body}</p>
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : <p className="p-4 text-center">Folder is empty.</p>}
                <button onClick={() => setUiState('compose')} className="absolute bottom-6 right-6 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700"><ComposeIcon /></button>
            </main>
        </div>
    );
};

export default MobiLocalMailApp;
