
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabaseService } from '../../services/supabaseService';
import { Mail } from '../../types';

type MailView = 'inbox' | 'sent' | 'compose';

const LocalMailApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [view, setView] = useState<MailView>('inbox');
    const [inbox, setInbox] = useState<Mail[]>([]);
    const [sent, setSent] = useState<Mail[]>([]);
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMails = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const { inbox, sent } = await supabaseService.getMailsForUser(currentUser.username);
        setInbox(inbox);
        setSent(sent);
        setIsLoading(false);
    }, [currentUser]);

    useEffect(() => {
        fetchMails();
    }, [fetchMails]);

    const handleSelectMail = async (mail: Mail) => {
        setSelectedMail(mail);
        if (!mail.read && mail.recipient === currentUser?.username) {
            await supabaseService.markMailAsRead(mail.id);
            // Optimistically update UI
            setInbox(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
        }
    };
    
    const handleDeleteMail = async (mailId: number) => {
        if (window.confirm("Are you sure you want to delete this email?")) {
            await supabaseService.deleteMail(mailId);
            setSelectedMail(null);
            fetchMails(); // Refresh mail lists
        }
    };

    const handleMailSent = () => {
        setView('sent');
        setSelectedMail(null);
        fetchMails();
    }

    const currentMailList = view === 'inbox' ? inbox : sent;

    return (
        <div className="w-full max-w-7xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl text-light-text dark:text-white flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/5 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-teal-700/50">
                    <h2 className="text-xl font-bold">LocalMail</h2>
                </div>
                <div className="p-2 space-y-1">
                    <button onClick={() => { setView('compose'); setSelectedMail(null); }} className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <span>Compose</span>
                    </button>
                </div>
                <nav className="flex-grow p-2">
                    <button onClick={() => { setView('inbox'); setSelectedMail(null); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors font-semibold ${view === 'inbox' ? 'bg-teal-100 dark:bg-teal-600/50' : 'hover:bg-gray-100 dark:hover:bg-teal-700/40'}`}>
                        <span>Inbox</span>
                        <span className="ml-auto text-xs bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-white rounded-full px-2 py-0.5">{inbox.filter(m => !m.read).length}</span>
                    </button>
                    <button onClick={() => { setView('sent'); setSelectedMail(null); }} className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-colors font-semibold ${view === 'sent' ? 'bg-teal-100 dark:bg-teal-600/50' : 'hover:bg-gray-100 dark:hover:bg-teal-700/40'}`}>
                        <span>Sent</span>
                    </button>
                </nav>
            </div>

            {view === 'compose' ? (
                <ComposeMail onMailSent={handleMailSent} />
            ) : (
                <>
                    {/* Mail List */}
                    <div className="w-2/5 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 overflow-y-auto">
                        {isLoading ? <p className="p-4 text-gray-500 dark:text-gray-400">Loading...</p> : (
                            currentMailList.length > 0 ? (
                                <ul>
                                    {currentMailList.map(mail => (
                                        <li key={mail.id} onClick={() => handleSelectMail(mail)}
                                            className={`p-4 border-b border-gray-200 dark:border-teal-800/80 cursor-pointer hover:bg-gray-100 dark:hover:bg-teal-700/40 transition-colors ${selectedMail?.id === mail.id ? 'bg-teal-100 dark:bg-teal-600/50' : ''} ${!mail.read && view === 'inbox' ? 'font-bold' : ''}`}>
                                            <div className="flex justify-between text-sm">
                                                <p className="text-gray-800 dark:text-gray-200">{view === 'inbox' ? mail.sender : `To: ${mail.recipient}`}</p>
                                                <p className="text-gray-500 dark:text-gray-400">{new Date(mail.timestamp).toLocaleDateString()}</p>
                                            </div>
                                            <p className="truncate">{mail.subject}</p>
                                            <p className={`text-sm text-gray-500 dark:text-gray-400 truncate ${!mail.read && view === 'inbox' ? 'dark:text-gray-300' : ''}`}>{mail.body}</p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="p-4 text-gray-500 dark:text-gray-400">This folder is empty.</p>
                            )
                        )}
                    </div>

                    {/* Mail Content */}
                    <div className="w-3/5 overflow-y-auto p-6">
                        {selectedMail ? (
                            <div>
                                <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-teal-700/50">
                                    <div>
                                        <h2 className="text-2xl font-bold">{selectedMail.subject}</h2>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            <strong>{view === 'inbox' ? 'From:' : 'To:'}</strong> {view === 'inbox' ? selectedMail.sender : selectedMail.recipient}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(selectedMail.timestamp).toLocaleString()}</p>
                                    </div>
                                    <button onClick={() => handleDeleteMail(selectedMail.id)} className="px-3 py-1 rounded-md text-sm bg-red-600 hover:bg-red-700 text-white transition-colors">
                                        Delete
                                    </button>
                                </div>
                                <div className="mt-6 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                                    {selectedMail.body}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-center text-gray-500 dark:text-gray-400">
                                <div>
                                    <h2 className="text-2xl font-semibold">Select a message to read</h2>
                                    <p>Your mail content will be displayed here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

interface ComposeMailProps {
    onMailSent: () => void;
}

const ComposeMail: React.FC<ComposeMailProps> = ({ onMailSent }) => {
    const { user: currentUser } = useAuth();
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !subject || !body || !currentUser) {
            setStatus('All fields are required.');
            return;
        }
        setStatus('Sending...');
        await supabaseService.sendMail({
            sender: currentUser.username,
            recipient,
            subject,
            body,
        });
        setStatus('Mail sent successfully!');
        setTimeout(() => {
            onMailSent();
        }, 1000);
    };

    return (
        <div className="w-4/5 p-6 flex flex-col">
            <h2 className="text-2xl font-bold pb-4 border-b border-gray-200 dark:border-teal-700/50">New Message</h2>
            <form onSubmit={handleSend} className="flex-grow flex flex-col space-y-4 pt-4">
                <input
                    type="text"
                    placeholder="To (username)"
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                    placeholder="Message body..."
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    className="w-full flex-grow bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <div className="flex items-center justify-between">
                     <p className="text-sm text-yellow-600 dark:text-yellow-400">{status}</p>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}


export default LocalMailApp;
