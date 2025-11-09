import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Mail } from '../../types';

type MailView = 'inbox' | 'sent' | 'compose';
type Account = {
    name: string;
    email: string;
    folders: string[];
};

const MailSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; onAccountAdd: (acc: Account) => void; }> = ({ isOpen, onClose, onAccountAdd }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showManual, setShowManual] = useState(false);

    // State for manual settings
    const [imapHost, setImapHost] = useState('');
    const [imapPort, setImapPort] = useState('993');
    const [imapEncryption, setImapEncryption] = useState('SSL/TLS');
    const [smtpHost, setSmtpHost] = useState('');
    const [smtpPort, setSmtpPort] = useState('465');
    const [smtpEncryption, setSmtpEncryption] = useState('SSL/TLS');
    
    const handleAdd = () => {
        if (email) {
            console.log('Adding account with settings:', {
                email,
                manualSetup: showManual,
                imapHost,
                imapPort,
                imapEncryption,
                smtpHost,
                smtpPort,
                smtpEncryption,
            });
            onAccountAdd({ name: email, email: email, folders: ['Inbox', 'Spam', 'Sent'] });
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg text-light-text dark:text-white">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold">Mail Settings</h2>
                    <button onClick={onClose} className="px-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 font-bold">X</button>
                </div>
                <div className="p-6 space-y-4">
                    <h3 className="font-semibold">Add External Account (IMAP/SMTP)</h3>
                    <input type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" />
                    
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-400">IMAP/SMTP settings will be auto-detected.</p>
                        <button onClick={() => setShowManual(!showManual)} className="text-sm text-blue-500 hover:underline">
                            {showManual ? 'Hide Manual Settings' : 'Manual Setup'}
                        </button>
                    </div>

                    {showManual && (
                        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                            {/* IMAP Settings */}
                            <fieldset className="border border-gray-300 dark:border-slate-600 rounded-md p-3">
                                <legend className="px-2 font-semibold text-sm">IMAP (Incoming Mail)</legend>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input type="text" placeholder="IMAP Host" value={imapHost} onChange={e => setImapHost(e.target.value)} className="md:col-span-2 bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                    <input type="number" placeholder="Port" value={imapPort} onChange={e => setImapPort(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                </div>
                                 <div className="mt-3">
                                    <label className="text-sm font-medium mr-2">Encryption:</label>
                                    <select value={imapEncryption} onChange={e => setImapEncryption(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-1.5 text-sm">
                                        <option>SSL/TLS</option>
                                        <option>STARTTLS</option>
                                        <option>None</option>
                                    </select>
                                </div>
                            </fieldset>

                             {/* SMTP Settings */}
                            <fieldset className="border border-gray-300 dark:border-slate-600 rounded-md p-3">
                                <legend className="px-2 font-semibold text-sm">SMTP (Outgoing Mail)</legend>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input type="text" placeholder="SMTP Host" value={smtpHost} onChange={e => setSmtpHost(e.target.value)} className="md:col-span-2 bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                    <input type="number" placeholder="Port" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                </div>
                                <div className="mt-3">
                                    <label className="text-sm font-medium mr-2">Encryption:</label>
                                    <select value={smtpEncryption} onChange={e => setSmtpEncryption(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-1.5 text-sm">
                                        <option>SSL/TLS</option>
                                        <option>STARTTLS</option>
                                        <option>None</option>
                                    </select>
                                </div>
                            </fieldset>
                        </div>
                    )}
                </div>
                <div className="flex justify-end p-4 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg space-x-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancel</button>
                    <button onClick={handleAdd} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Add Account</button>
                </div>
            </div>
        </div>
    );
};


const LocalMailApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [view, setView] = useState<MailView>('inbox');
    const [inbox, setInbox] = useState<Mail[]>([]);
    const [sent, setSent] = useState<Mail[]>([]);
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);

    const fetchMails = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const { inbox, sent } = await database.getMailsForUser(currentUser.username);
        setInbox(inbox);
        setSent(sent);
        setIsLoading(false);
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            const localAccount: Account = {
                name: currentUser.username,
                email: 'LocalMail', // Use a stable unique ID for the local account
                folders: ['Inbox', 'Spam', 'Sent'],
            };
            setAccounts([localAccount]);
            setExpandedAccounts([localAccount.email]); // Expand the local account by default
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMails();
    }, [fetchMails]);

    const handleSelectMail = async (mail: Mail) => {
        setSelectedMail(mail);
        if (!mail.read && mail.recipient === currentUser?.username) {
            await database.markMailAsRead(mail.id);
            // Optimistically update UI
            setInbox(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
        }
    };
    
    const handleDeleteMail = async (mailId: number) => {
        if (window.confirm("Are you sure you want to delete this email?")) {
            await database.deleteMail(mailId);
            setSelectedMail(null);
            fetchMails(); // Refresh mail lists
        }
    };

    const handleMailSent = () => {
        setView('sent');
        setSelectedMail(null);
        fetchMails();
    }
    
    const handleAccountAdd = (newAccount: Account) => {
        if (accounts.some(acc => acc.email === newAccount.email)) return; // Prevent duplicates
        setAccounts(prev => [...prev, newAccount]);
        setExpandedAccounts(prev => [...prev, newAccount.email]); // Expand the new account
    };

    const currentMailList = view === 'inbox' ? inbox : sent;

    return (
        <div className="w-full max-w-7xl h-[80vh] bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-teal-600/50 rounded-2xl shadow-2xl text-light-text dark:text-white flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/4 border-r border-gray-200 dark:border-teal-700/50 bg-black/5 dark:bg-black/10 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-teal-700/50 flex justify-between items-center">
                    <h2 className="text-xl font-bold">LocalMail</h2>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-teal-700">
                        ⚙️
                    </button>
                </div>
                <div className="p-2">
                    <button onClick={() => { setView('compose'); setSelectedMail(null); }} className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-transform hover:scale-105">
                        <span>Compose</span>
                    </button>
                </div>
                <nav className="flex-grow p-2 overflow-y-auto">
                    {accounts.map(account => {
                        const isExpanded = expandedAccounts.includes(account.email);
                        return (
                            <div key={account.email} className="mb-2">
                                <button
                                    onClick={() => setExpandedAccounts(prev => prev.includes(account.email) ? prev.filter(e => e !== account.email) : [...prev, account.email])}
                                    className="w-full flex justify-between items-center px-3 py-1 text-sm font-semibold text-gray-500 dark:text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-teal-700/30"
                                >
                                    <span>{account.name}</span>
                                    <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>{'>'}</span>
                                </button>
                                {isExpanded && (
                                    <div className="pl-4 mt-1 space-y-1">
                                        {account.folders.map(folder => {
                                            const isInbox = folder.toLowerCase() === 'inbox';
                                            const isSent = folder.toLowerCase() === 'sent';
                                            const isActive = (isInbox && view === 'inbox') || (isSent && view === 'sent');
                                            const isClickable = isInbox || isSent || folder.toLowerCase() === 'spam';

                                            return (
                                                <button
                                                    key={folder}
                                                    onClick={() => {
                                                        if (isInbox) setView('inbox');
                                                        if (isSent) setView('sent');
                                                        // Note: 'spam' view not implemented yet, so it won't change the view.
                                                        setSelectedMail(null);
                                                    }}
                                                    disabled={!isClickable}
                                                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors font-semibold ${
                                                        isActive ? 'bg-teal-100 dark:bg-teal-600/50 text-light-text dark:text-dark-text' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-teal-700/40'
                                                    } ${!isClickable ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : ''}`}
                                                >
                                                    <span>{folder}</span>
                                                    {isInbox && inbox.filter(m => !m.read).length > 0 && (
                                                      <span className="ml-auto text-xs bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-white rounded-full px-2 py-0.5">{inbox.filter(m => !m.read).length}</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    })}
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
                            <div className="animate-fade-in">
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
            <MailSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onAccountAdd={handleAccountAdd} />
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
        // FIX: Removed the `sender` property to match the expected type for `database.sendMail`.
        // The sender is inferred from the user's session on the backend.
        await database.sendMail({
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
        <div className="w-full md:w-4/5 p-6 flex flex-col animate-fade-in">
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