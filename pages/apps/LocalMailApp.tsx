
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import { Mail, MailAccount } from '../../types';

type MailView = 'inbox' | 'sent' | 'spam' | 'compose';

// A local type to represent both local and external accounts for the UI
type UI_Account = {
    name: string; // display name
    email: string; // sending address
    folders: string[];
};


const wallpapers: Record<string, { name: string; style: React.CSSProperties }> = {
    none: { name: 'None', style: {} },
    dots: { name: 'Dots', style: { backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle fill="%23a1a1aa" cx="10" cy="10" r="1"/></svg>`)}` } },
    grid: { name: 'Grid', style: { backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M 10 0 L 10 20 M 0 10 L 20 10" stroke-width="0.5" stroke="%23a1a1aa"/></svg>`)}` } },
    plus: { name: 'Plus', style: { backgroundImage: `url('data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M 10 0 L 10 20 M 0 10 L 20 10" stroke-width="1" stroke="%23a1a1aa"/></svg>`)}`, backgroundSize: '15px 15px' } },
};

const themes: Record<string, { name: string; classes: string }> = {
    system: { name: 'System', classes: 'bg-light-card/80 dark:bg-teal-800/50 border-gray-300 dark:border-teal-600/50 text-light-text dark:text-white' },
    light: { name: 'Light', classes: 'bg-white/95 border-gray-200 text-gray-800' },
    dark: { name: 'Dark', classes: 'bg-gray-800/95 border-gray-700 text-gray-200' },
    green: { name: 'Green', classes: 'bg-green-100/95 dark:bg-green-900/95 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100' },
    blue: { name: 'Blue', classes: 'bg-blue-100/95 dark:bg-blue-900/95 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100' },
    purple: { name: 'Purple', classes: 'bg-purple-100/95 dark:bg-purple-900/95 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100' },
};

interface MailSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccountAdded: () => void;
    userDisplayName: string;
    setUserDisplayName: (name: string) => void;
    theme: string;
    setTheme: (theme: string) => void;
    wallpaper: string;
    setWallpaper: (wallpaper: string) => void;
}

const MailSettingsModal: React.FC<MailSettingsModalProps> = ({
    isOpen, onClose, onAccountAdded,
    userDisplayName, setUserDisplayName, theme, setTheme, wallpaper, setWallpaper
}) => {
    const [activeTab, setActiveTab] = useState('account');
    const [displayName, setDisplayName] = useState('');
    const [emailAddress, setEmailAddress] = useState('');
    const [smtpServer, setSmtpServer] = useState('');
    const [smtpUsername, setSmtpUsername] = useState('');
    const [smtpPassword, setSmtpPassword] = useState('');
    const [smtpPort, setSmtpPort] = useState('587');
    const [smtpTls, setSmtpTls] = useState(true);
    const [imapServer, setImapServer] = useState('');
    const [imapPort, setImapPort] = useState('993');
    const [imapEncryption, setImapEncryption] = useState('SSL/TLS');
    const [imapUsername, setImapUsername] = useState('');
    const [imapPassword, setImapPassword] = useState('');

    const handleAddAccount = async () => {
        const email = emailAddress || imapUsername;
        if (email) {
            const newAccountData: Omit<MailAccount, 'id' | 'user_id'> = {
                display_name: displayName || email,
                email_address: email,
                smtp_server: smtpServer,
                smtp_port: parseInt(smtpPort) || 587,
                smtp_user: smtpUsername,
                smtp_pass: smtpPassword,
                smtp_tls: smtpTls,
                imap_server: imapServer,
                imap_port: parseInt(imapPort) || 993,
                imap_user: imapUsername,
                imap_pass: imapPassword,
                imap_encryption: imapEncryption,
            };
            const added = await database.addMailAccount(newAccountData);
            if (added) {
                onAccountAdded();
            }
            onClose();
        }
    };

    const TabButton: React.FC<{ tabName: string; label: string; }> = ({ tabName, label }) => (
        <button onClick={() => setActiveTab(tabName)} className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 dark:hover:bg-slate-700'}`}>
            {label}
        </button>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl h-[90vh] max-h-[700px] flex flex-col text-light-text dark:text-white">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold">Mail Settings</h2>
                    <button onClick={onClose} className="px-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 font-bold">X</button>
                </div>
                <div className="flex flex-grow overflow-hidden">
                    <div className="w-1/4 p-4 border-r border-gray-200 dark:border-slate-700">
                        <nav className="space-y-1">
                            <TabButton tabName="account" label="Account" />
                            <TabButton tabName="display" label="Display Name" />
                            <TabButton tabName="wallpaper" label="Wallpaper" />
                            <TabButton tabName="theme" label="Theme" />
                        </nav>
                    </div>
                    <div className="w-3/4 p-6 flex flex-col overflow-y-auto">
                        {activeTab === 'account' && (
                             <div className="flex-grow flex flex-col overflow-hidden">
                                <h3 className="text-lg font-semibold mb-4">Add External Account</h3>
                                <div className="flex-grow space-y-4 overflow-y-auto pr-3">
                                    <input type="text" placeholder="Display Name" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" />
                                    <input type="email" placeholder="Email Address (for display)" value={emailAddress} onChange={e => setEmailAddress(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" />
                                    <fieldset className="border border-gray-300 dark:border-slate-600 rounded-md p-3 space-y-3">
                                        <legend className="px-2 font-semibold text-sm">SMTP (Outgoing Mail)</legend>
                                        <input type="text" placeholder="SMTP Server" value={smtpServer} onChange={e => setSmtpServer(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input type="text" placeholder="Username (Auth)" value={smtpUsername} onChange={e => setSmtpUsername(e.target.value)} className="md:col-span-2 bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                            <input type="number" placeholder="Port (SMTP)" value={smtpPort} onChange={e => setSmtpPort(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        </div>
                                        <input type="password" placeholder="Password (Auth)" value={smtpPassword} onChange={e => setSmtpPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        <div className="flex items-center space-x-2"><input type="checkbox" id="smtp-tls" checked={smtpTls} onChange={e => setSmtpTls(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" /><label htmlFor="smtp-tls" className="text-sm">Use TLS/SSL</label></div>
                                    </fieldset>
                                    <fieldset className="border border-gray-300 dark:border-slate-600 rounded-md p-3 space-y-3">
                                        <legend className="px-2 font-semibold text-sm">IMAP (Incoming Mail)</legend>
                                        <input type="text" placeholder="IMAP Server" value={imapServer} onChange={e => setImapServer(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <input type="text" placeholder="(Auth IMAP) Username" value={imapUsername} onChange={e => setImapUsername(e.target.value)} className="md:col-span-2 bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                            <input type="number" placeholder="IMAP Port" value={imapPort} onChange={e => setImapPort(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        </div>
                                        <input type="password" placeholder="(Auth IMAP) Password" value={imapPassword} onChange={e => setImapPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-2 text-sm" />
                                        <div>
                                            <label className="text-sm font-medium mr-2">Encryption:</label>
                                            <select value={imapEncryption} onChange={e => setImapEncryption(e.target.value)} className="bg-gray-100 dark:bg-slate-600 border-gray-300 dark:border-slate-500 rounded-md px-3 py-1.5 text-sm">
                                                <option>SSL/TLS</option><option>STARTTLS</option><option>None</option>
                                            </select>
                                        </div>
                                    </fieldset>
                                </div>
                                <div className="flex justify-end pt-4 mt-4 border-t border-gray-200 dark:border-slate-700 flex-shrink-0 space-x-2">
                                    <button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white">Cancel</button>
                                    <button onClick={handleAddAccount} className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Add Account</button>
                                </div>
                            </div>
                        )}
                        {activeTab === 'display' && (
                             <div>
                                <h3 className="text-lg font-semibold mb-2">Set Display Name</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">This name is shown for your LocalMail account.</p>
                                <input type="text" value={userDisplayName} onChange={e => setUserDisplayName(e.target.value)} className="w-full max-w-sm bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2" />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Changes are saved automatically.</p>
                            </div>
                        )}
                         {activeTab === 'wallpaper' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Choose a Wallpaper</h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(wallpapers).map(([key, { name, style }]) => (
                                        <button key={key} onClick={() => setWallpaper(key)} className={`p-2 border-2 rounded-lg flex flex-col items-center hover:border-blue-500 ${wallpaper === key ? 'border-blue-500' : 'border-transparent'}`}>
                                            <div className="w-full h-20 rounded-md bg-gray-200 dark:bg-slate-700" style={{...style, backgroundSize: 'cover' }}></div>
                                            <span className="text-sm mt-2">{name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                         )}
                         {activeTab === 'theme' && (
                             <div>
                                <h3 className="text-lg font-semibold mb-4">Choose a Theme</h3>
                                <div className="space-y-2">
                                    {Object.entries(themes).map(([key, { name, classes }]) => {
                                        const [lightBg, darkBg] = classes.split(' dark:');
                                        return (
                                            <button key={key} onClick={() => setTheme(key)} className={`w-full max-w-sm p-2 flex items-center space-x-4 rounded-lg border-2 hover:border-blue-500 ${theme === key ? 'border-blue-500' : 'border-transparent'}`}>
                                                <div className="w-8 h-8 rounded-full overflow-hidden flex">
                                                    <div className={`w-1/2 h-full ${lightBg.replace('/80', '').replace('/95', '')}`} />
                                                    <div className={`w-1/2 h-full ${darkBg.replace('/80', '').replace('/95', '')}`} />
                                                </div>
                                                <span className="font-medium">{name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const ComposeView: React.FC<{ onMailSent: () => void, availableSenders: UI_Account[] }> = ({ onMailSent, availableSenders }) => {
    const { user } = useAuth();
    const [from, setFrom] = useState(availableSenders[0]?.email || '');
    const [recipient, setRecipient] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        if (availableSenders.length > 0 && !from) {
            setFrom(availableSenders[0].email);
        }
    }, [availableSenders, from]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipient || !user) {
            setStatus('Recipient is required.');
            return;
        }
        setStatus('Sending...');
        const mail = await database.sendMail({ sender: from, recipient, subject, body });
        if (mail) {
            setStatus('Mail sent successfully!');
            setTimeout(() => {
                onMailSent();
            }, 1000);
        } else {
            setStatus('Failed to send mail.');
        }
    };

    return (
        <form onSubmit={handleSend} className="flex-grow flex flex-col p-6 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4">New Message</h2>
            <div className="space-y-3">
                <div className="flex items-center">
                    <label htmlFor="from-select" className="pr-2 text-sm opacity-80">From:</label>
                    <select 
                        id="from-select" 
                        value={from} 
                        onChange={e => setFrom(e.target.value)}
                        className="flex-grow p-2 bg-black/10 border-b-2 border-current border-opacity-20 focus:outline-none focus:border-opacity-50"
                    >
                        {availableSenders.map(acc => (
                            <option key={acc.email} value={acc.email}>
                                {acc.name} &lt;{acc.email}&gt;
                            </option>
                        ))}
                    </select>
                </div>
                <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="To (username)" className="w-full p-2 bg-black/10 border-b-2 border-current border-opacity-20 focus:outline-none focus:border-opacity-50" />
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="w-full p-2 bg-black/10 border-b-2 border-current border-opacity-20 focus:outline-none focus:border-opacity-50" />
            </div>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Your message..." className="flex-grow w-full p-2 bg-black/10 mt-4 focus:outline-none resize-none" />
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm">{status}</p>
                <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white">Send</button>
            </div>
        </form>
    );
};

const LocalMailApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [view, setView] = useState<MailView>('inbox');
    const [inbox, setInbox] = useState<Mail[]>([]);
    const [sent, setSent] = useState<Mail[]>([]);
    const [spam, setSpam] = useState<Mail[]>([]);
    const [selectedMail, setSelectedMail] = useState<Mail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    const [theme, setTheme] = useState('system');
    const [wallpaper, setWallpaper] = useState('none');
    const [userDisplayName, setUserDisplayName] = useState(currentUser?.username || 'user');

    const [accounts, setAccounts] = useState<UI_Account[]>([]);
    const [expandedAccounts, setExpandedAccounts] = useState<string[]>([]);

    const fetchMails = useCallback(async () => {
        if (!currentUser) return;
        setIsLoading(true);
        const { inbox, sent } = await database.getMailsForUser(currentUser.username);
        setInbox(inbox);
        setSent(sent);
        setSpam([]); // Placeholder for spam
        setIsLoading(false);
    }, [currentUser]);
    
    const fetchAccounts = useCallback(async () => {
        if (!currentUser) return;
        const externalAccounts = await database.getMailAccounts();
        const formattedExternal = externalAccounts.map(acc => ({
            name: acc.display_name,
            email: acc.email_address,
            folders: ['Inbox', 'Spam', 'Sent'],
        }));
        const localAccount: UI_Account = {
            name: userDisplayName,
            email: `${currentUser.username}@lynix.local`,
            folders: ['Inbox', 'Spam', 'Sent'],
        };
        setAccounts([localAccount, ...formattedExternal]);
        if (!expandedAccounts.includes(localAccount.email)) {
            setExpandedAccounts(prev => [localAccount.email, ...prev]);
        }
    }, [currentUser, userDisplayName]);


    useEffect(() => {
        fetchMails();
        fetchAccounts();
    }, [fetchMails, fetchAccounts]);

    const handleSelectMail = async (mail: Mail) => {
        setSelectedMail(mail);
        if (!mail.read && mail.recipient === currentUser?.username) {
            await database.markMailAsRead(mail.id);
            setInbox(prev => prev.map(m => m.id === mail.id ? { ...m, read: true } : m));
        }
    };
    
    const handleDeleteMail = async (mailId: number) => {
        if (window.confirm("Are you sure you want to delete this email?")) {
            await database.deleteMail(mailId);
            setSelectedMail(null);
            fetchMails();
        }
    };

    const handleMailSent = () => {
        setView('sent');
        setSelectedMail(null);
        fetchMails();
    }

    const currentMailList = view === 'inbox' ? inbox : view === 'sent' ? sent : spam;

    return (
        <div className={`w-full max-w-7xl h-[80vh] backdrop-blur-sm border rounded-2xl shadow-2xl flex overflow-hidden transition-colors duration-300 ${themes[theme].classes}`} style={wallpapers[wallpaper].style}>
            <div className="w-1/4 border-r border-current border-opacity-20 bg-black/5 flex flex-col">
                <div className="p-4 border-b border-current border-opacity-20 flex justify-between items-center">
                    <h2 className="text-xl font-bold">LocalMail</h2>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-full hover:bg-white/20">⚙️</button>
                </div>
                <div className="p-2">
                    <button onClick={() => { setView('compose'); setSelectedMail(null); }} className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        <span>Compose</span>
                    </button>
                </div>
                <nav className="flex-grow overflow-y-auto">
                    {accounts.map(account => (
                        <div key={account.email}>
                            <button onClick={() => setExpandedAccounts(prev => prev.includes(account.email) ? prev.filter(name => name !== account.email) : [...prev, account.email])} className="w-full text-left p-3 font-semibold flex justify-between items-center">
                                <span>{account.name} &gt;</span>
                                <span className={`transform transition-transform duration-200 ${expandedAccounts.includes(account.email) ? 'rotate-90' : ''}`}>›</span>
                            </button>
                            {expandedAccounts.includes(account.email) && (
                                <div className="pl-6">
                                    {account.folders.map(folder => (
                                        <button key={folder} onClick={() => {
                                            const folderView = folder.toLowerCase() as MailView;
                                            if (['inbox', 'sent', 'spam'].includes(folderView)) {
                                                setView(folderView);
                                                setSelectedMail(null);
                                            }
                                        }} className={`w-full text-left p-2 rounded-md transition-colors text-lg ${view === folder.toLowerCase() ? 'font-bold' : 'hover:bg-white/10'}`}>
                                            {folder}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="w-1/3 border-r border-current border-opacity-20 flex flex-col">
                <div className="p-4 border-b border-current border-opacity-20">
                    <h3 className="text-lg font-bold capitalize">{view === 'compose' ? 'New Message' : view}</h3>
                    <p className="text-sm opacity-60">{isLoading ? 'Loading...' : `${currentMailList.length} message(s)`}</p>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {isLoading ? (<p className="p-4 text-center">Fetching mail...</p>) : 
                    currentMailList.length > 0 ? (
                        <ul>
                            {currentMailList.map(mail => (
                                <li key={mail.id} className={`border-b border-current border-opacity-10 ${selectedMail?.id === mail.id ? 'bg-black/10' : ''}`}>
                                    <button onClick={() => handleSelectMail(mail)} className="w-full text-left p-3 hover:bg-black/5">
                                        <div className="flex justify-between items-start">
                                            <p className={`font-semibold truncate ${!mail.read && view === 'inbox' ? 'text-blue-400' : ''}`}>{view === 'inbox' ? mail.sender : mail.recipient}</p>
                                            <p className="text-xs opacity-60 flex-shrink-0 ml-2">{new Date(mail.timestamp).toLocaleDateString()}</p>
                                        </div>
                                        <p className={`truncate ${!mail.read && view === 'inbox' ? 'font-semibold' : 'font-normal opacity-80'}`}>{mail.subject || '(no subject)'}</p>
                                        <p className="text-sm opacity-60 truncate">{mail.body}</p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : ( <p className="p-4 text-center">This folder is empty.</p> )}
                </div>
            </div>

            <div className="w-5/12 flex flex-col">
                {view === 'compose' ? ( <ComposeView onMailSent={handleMailSent} availableSenders={accounts} /> ) : 
                selectedMail ? (
                    <div className="flex-grow flex flex-col p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">{selectedMail.subject}</h2>
                            <button onClick={() => handleDeleteMail(selectedMail.id)} className="px-3 py-1 text-sm rounded-md bg-red-600 hover:bg-red-700 text-white">Delete</button>
                        </div>
                        <div className="text-sm opacity-80 border-b border-current border-opacity-20 pb-4 mb-4">
                            <p><strong>From:</strong> {selectedMail.sender}</p>
                            <p><strong>To:</strong> {selectedMail.recipient}</p>
                            <p><strong>Date:</strong> {new Date(selectedMail.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="whitespace-pre-wrap flex-grow">{selectedMail.body}</div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center text-center opacity-60">
                        <div>
                            <h2 className="text-xl font-semibold">Select a message to read</h2>
                            <p>Your mail content will be displayed here.</p>
                        </div>
                    </div>
                )}
            </div>
            
            <MailSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} onAccountAdded={fetchAccounts} userDisplayName={userDisplayName} setUserDisplayName={setUserDisplayName} theme={theme} setTheme={setTheme} wallpaper={wallpaper} setWallpaper={setWallpaper}/>
        </div>
    );
};

export default LocalMailApp;