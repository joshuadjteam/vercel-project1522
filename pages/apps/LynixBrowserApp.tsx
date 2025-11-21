
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { database } from '../../services/database';
import BrowserLoader from '../../components/BrowserLoader';

// --- Icons ---
const ArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const ArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const RefreshCw = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const Home = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const Plus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const MoreVertical = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const StarIcon = (props: { filled?: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${props.filled ? 'fill-yellow-400 text-yellow-400' : 'fill-none text-gray-500'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CookieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

interface BrowserTab {
    id: number;
    title: string;
    url: string;
    displayUrl: string; // The URL actually shown in the address bar
    history: string[];
    historyIndex: number;
    isLoading: boolean;
    isBlocked: boolean;
    blobUrl?: string; // The object URL for the pulled content
}

// Search engines
const SEARCH_ENGINES = [
    'bing.com', 'www.bing.com',
    'yahoo.com', 'search.yahoo.com',
    'duckduckgo.com',
    'baidu.com',
    'ask.com',
    'aol.com',
    'yandex.com'
];

const SPECIAL_REDIRECT_URL = 'https://lynixity.x10.bz/iframe.html';

const LynixBrowserApp: React.FC = () => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([
        { id: 1, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false }
    ]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [addressBarInput, setAddressBarInput] = useState('');
    
    // State for Menus
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    
    // User Settings
    const [securityBypassEnabled, setSecurityBypassEnabled] = useState(true);
    const [cloudHistory, setCloudHistory] = useState<string[]>([]);
    const [bookmarks, setBookmarks] = useState<{title: string, url: string}[]>([]);
    
    // View States
    const [view, setView] = useState<'browser' | 'history' | 'bookmarks' | 'cookies'>('browser');

    // --- Spoofed Info ---
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v15.0";
    const spoofedMachineName = `LynixWeb-Machine-${user?.id || 'Guest'}`;
    const spoofedClientID = "Firefox/115.0"; 

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);
    const settingsRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setAddressBarInput(activeTab.displayUrl || activeTab.url);
    }, [activeTabId, activeTab.displayUrl, activeTab.url]);

    // Load Data
    useEffect(() => {
        if (user) {
            database.getBrowserData(user.id).then(data => {
                if (data.history) setCloudHistory(data.history);
                if (data.bookmarks) setBookmarks(data.bookmarks);
            });
        }
    }, [user]);

    // Listen for navigation messages from the proxied iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'LYNIX_NAVIGATE' && event.data.url) {
                console.log('Browser: Received navigation request to:', event.data.url);
                handleNavigate(event.data.url);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [activeTabId]);

    // Click outside for menus
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setSettingsMenuOpen(false);
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) setAccountMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const addToHistory = (url: string) => {
        if (!url || url === SPECIAL_REDIRECT_URL || url.startsWith('internal')) return;
        const newHistory = [url, ...cloudHistory].slice(0, 50);
        setCloudHistory(newHistory);
        if (user) database.saveBrowserData(user.id, { history: newHistory });
    };

    const toggleBookmark = () => {
        if (!activeTab.displayUrl) return;
        const isBookmarked = bookmarks.some(b => b.url === activeTab.displayUrl);
        let newBookmarks;
        if (isBookmarked) {
            newBookmarks = bookmarks.filter(b => b.url !== activeTab.displayUrl);
        } else {
            newBookmarks = [...bookmarks, { title: activeTab.title || activeTab.displayUrl, url: activeTab.displayUrl }];
        }
        setBookmarks(newBookmarks);
        if (user) database.saveBrowserData(user.id, { bookmarks: newBookmarks });
    };

    const handleNavigate = (input: string) => {
        let finalUrl = input.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        
        let actualUrl = finalUrl;
        let displayUrl = finalUrl;
        let specialHandled = false;

        // --- Standardize URL ---
        if (!lowerUrl.startsWith('http') && !lowerUrl.startsWith('internal://')) {
             const isSearch = !lowerUrl.includes('.') || lowerUrl.includes(' ');
             if (isSearch) {
                 actualUrl = SPECIAL_REDIRECT_URL;
                 displayUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
             } else {
                 actualUrl = `https://${finalUrl}`;
                 displayUrl = actualUrl;
             }
        } else {
            displayUrl = actualUrl;
        }

        addToHistory(displayUrl);
        
        // Update history
        setTabs(currentTabs => {
            const tab = currentTabs.find(t => t.id === activeTabId);
            if (!tab) return currentTabs;

            const newHistory = tab.history.slice(0, tab.historyIndex + 1);
            newHistory.push(displayUrl);

            if (tab.blobUrl) {
                URL.revokeObjectURL(tab.blobUrl);
            }

            // Force proxy usage if Security Bypass is enabled, unless internal
            const requiresProxy = securityBypassEnabled && !actualUrl.startsWith('internal://') && actualUrl !== SPECIAL_REDIRECT_URL;

            return currentTabs.map(t => t.id === activeTabId ? {
                ...t,
                url: actualUrl,
                displayUrl: displayUrl,
                title: displayUrl,
                history: newHistory,
                historyIndex: newHistory.length - 1,
                isLoading: true, 
                isBlocked: false, 
                blobUrl: requiresProxy ? undefined : undefined 
            } : t);
        });
    };

    const handleLoaderComplete = (blobUrl?: string) => {
        updateTab(activeTabId, { isLoading: false, blobUrl: blobUrl });
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const prevUrl = activeTab.history[newIndex];
            updateTab(activeTabId, {
                url: prevUrl,
                displayUrl: prevUrl,
                historyIndex: newIndex,
                isLoading: true,
                blobUrl: undefined
            });
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const nextUrl = activeTab.history[newIndex];
            updateTab(activeTabId, {
                url: nextUrl,
                displayUrl: nextUrl,
                historyIndex: newIndex,
                isLoading: true,
                blobUrl: undefined
            });
        }
    };

    const handleRefresh = () => {
        updateTab(activeTabId, { isLoading: true, blobUrl: undefined });
    };

    const addTab = () => {
        const newId = Date.now();
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        setView('browser');
    };

    const closeTab = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const tabToClose = tabs.find(t => t.id === id);
        if (tabToClose?.blobUrl) URL.revokeObjectURL(tabToClose.blobUrl);

        if (tabs.length === 1) {
            updateTab(id, { url: '', displayUrl: '', title: 'New Tab', history: [''], historyIndex: 0, isBlocked: false, blobUrl: undefined });
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (id === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const clearCookies = () => {
        if (window.confirm("Are you sure you want to clear all site data and cookies for the browser session?")) {
            // Revoke all blobs to simulate session clear
            tabs.forEach(t => { if (t.blobUrl) URL.revokeObjectURL(t.blobUrl); });
            // Reset tabs
            setTabs([{ id: Date.now(), title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false }]);
            alert("Browser session data cleared.");
            setView('browser');
        }
    };

    const clearHistory = () => {
        if (window.confirm("Delete all cloud history?")) {
            setCloudHistory([]);
            if (user) database.saveBrowserData(user.id, { history: [] });
        }
    };

    // --- View Components ---

    const HistoryView = () => (
        <div className="flex-grow bg-white dark:bg-[#202124] p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">History</h2>
                    <button onClick={clearHistory} className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Clear Browsing Data</button>
                </div>
                {cloudHistory.length === 0 ? <p className="text-gray-500">No history yet.</p> : (
                    <ul className="space-y-2">
                        {cloudHistory.map((h, i) => (
                            <li key={i} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <GlobeIcon />
                                    <a href="#" onClick={() => { handleNavigate(h); setView('browser'); }} className="truncate hover:underline">{h}</a>
                                </div>
                                <span className="text-xs text-gray-400">Cloud Synced</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    const BookmarksView = () => (
        <div className="flex-grow bg-white dark:bg-[#202124] p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-6">Bookmarks</h2>
                {bookmarks.length === 0 ? <p className="text-gray-500">No bookmarks yet. Star a page to add one.</p> : (
                    <ul className="space-y-2">
                        {bookmarks.map((b, i) => (
                            <li key={i} className="flex items-center justify-between p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <StarIcon filled />
                                    <a href="#" onClick={() => { handleNavigate(b.url); setView('browser'); }} className="truncate font-medium hover:underline">{b.title}</a>
                                </div>
                                <button onClick={() => {
                                    const newB = bookmarks.filter(bk => bk.url !== b.url);
                                    setBookmarks(newB);
                                    if (user) database.saveBrowserData(user.id, { bookmarks: newB });
                                }} className="text-gray-400 hover:text-red-500"><TrashIcon /></button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );

    const CookiesView = () => (
        <div className="flex-grow bg-white dark:bg-[#202124] p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">Cookie Manager</h2>
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg mb-8">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        Note: Due to security sandboxing, we cannot list individual cookies from external sites. 
                        You can clear the entire browser session data below.
                    </p>
                </div>
                <button onClick={clearCookies} className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold flex items-center justify-center mx-auto space-x-2">
                    <TrashIcon />
                    <span>Clear All Session Data & Cookies</span>
                </button>
            </div>
        </div>
    );

    const shouldUseLoader = activeTab.isLoading && 
                            !!activeTab.url && 
                            securityBypassEnabled &&
                            !activeTab.url.startsWith('internal://') &&
                            activeTab.url !== SPECIAL_REDIRECT_URL;

    return (
        <div className="w-full h-full flex flex-col bg-[#dfe3e7] dark:bg-[#202124] text-black dark:text-white rounded-lg overflow-hidden font-sans select-none relative">
            
            {/* Top Bar (Tabs) */}
            <div className="flex h-10 px-2 pt-2 space-x-1 overflow-x-auto no-scrollbar items-end bg-[#dee1e6] dark:bg-[#000000]">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => { setActiveTabId(tab.id); setView('browser'); }}
                        className={`group relative flex items-center min-w-[140px] max-w-[220px] h-8 px-3 text-xs rounded-t-xl cursor-pointer transition-all
                            ${activeTabId === tab.id && view === 'browser'
                                ? 'bg-white dark:bg-[#35363a] text-black dark:text-white shadow-sm z-10' 
                                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/10'
                            }`}
                    >
                        {activeTabId !== tab.id && <div className="absolute right-0 h-4 w-[1px] bg-gray-400 dark:bg-gray-600 top-2 group-hover:hidden"></div>}
                        <div className="flex items-center space-x-2 w-full overflow-hidden">
                            {tab.isLoading ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 flex-shrink-0"></div> : (tab.url ? <GlobeIcon /> : <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>)}
                            <span className="truncate flex-grow font-medium">{tab.title || 'New Tab'}</span>
                            <button onClick={(e) => closeTab(e, tab.id)} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><XIcon /></button>
                        </div>
                    </div>
                ))}
                <button onClick={addTab} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors ml-1"><Plus /></button>
            </div>

            {/* Navigation Toolbar */}
            <div className="flex items-center h-12 px-2 bg-white dark:bg-[#35363a] shadow-sm z-20 space-x-2 border-b border-gray-200 dark:border-black/20">
                <div className="flex space-x-1">
                    <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft /></button>
                    <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight /></button>
                    <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><RefreshCw /></button>
                </div>
                <button onClick={() => { handleNavigate(''); setView('browser'); }} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors hidden sm:block"><Home /></button>

                {/* Address Bar */}
                <div className="flex-grow flex items-center bg-[#f1f3f4] dark:bg-[#202124] rounded-full px-3 h-8 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-black transition-all shadow-inner relative group">
                    <div className="text-gray-500 mr-2">{activeTab.url && activeTab.url.startsWith('https') ? <LockIcon /> : <InfoIcon />}</div>
                    <input
                        type="text"
                        value={addressBarInput}
                        onChange={(e) => setAddressBarInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                        onFocus={(e) => e.target.select()}
                        className="flex-grow bg-transparent border-none outline-none text-sm text-black dark:text-white w-full"
                        placeholder="Search or type URL"
                    />
                    <div className="flex space-x-1">
                        <button onClick={toggleBookmark} className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700">
                            <StarIcon filled={bookmarks.some(b => b.url === activeTab.displayUrl)} />
                        </button>
                    </div>
                </div>

                <div className="flex space-x-1 items-center pl-2">
                    {/* Account Menu */}
                    <div className="relative" ref={accountRef}>
                        <button onClick={() => setAccountMenuOpen(!accountMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"><UserIcon /></button>
                        {accountMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#35363a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-600">
                                    <p className="font-bold">{user?.username}</p>
                                    <p className="text-xs text-gray-500">LynixWeb v1.502</p>
                                </div>
                                <button onClick={() => { setView('history'); setAccountMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center space-x-2"><GlobeIcon /><span>Cloud History</span></button>
                                <button onClick={() => { setView('bookmarks'); setAccountMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center space-x-2"><StarIcon /><span>Bookmarks</span></button>
                            </div>
                        )}
                    </div>

                    {/* Settings Menu */}
                    <div className="relative" ref={settingsRef}>
                        <button onClick={() => setSettingsMenuOpen(!settingsMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"><MoreVertical /></button>
                        {settingsMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-[#35363a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50">
                                <div className="px-4 py-2 flex items-center justify-between">
                                    <span className="text-sm font-medium">Security Bypass</span>
                                    <button onClick={() => setSecurityBypassEnabled(!securityBypassEnabled)} className={`w-10 h-5 rounded-full relative transition-colors ${securityBypassEnabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${securityBypassEnabled ? 'left-6' : 'left-1'}`}></div>
                                    </button>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                                <button onClick={() => { setView('cookies'); setSettingsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center space-x-2"><CookieIcon /><span>Cookie Manager</span></button>
                                <button onClick={() => { setView('history'); setSettingsMenuOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center space-x-2"><HistoryIcon /><span>History</span></button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Bookmarks Bar */}
            <div className="h-8 bg-white dark:bg-[#35363a] flex items-center px-4 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-black/10 space-x-3 overflow-x-auto no-scrollbar">
                 {bookmarks.slice(0, 5).map((b, i) => (
                     <button key={i} onClick={() => handleNavigate(b.url)} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1 truncate max-w-[150px]">
                         <div className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                         <span className="truncate">{b.title}</span>
                     </button>
                 ))}
                 <button onClick={() => setView('bookmarks')} className="text-blue-500 hover:underline whitespace-nowrap">All Bookmarks</button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full overflow-hidden">
                {view !== 'browser' ? (
                    view === 'history' ? <HistoryView /> :
                    view === 'bookmarks' ? <BookmarksView /> :
                    <CookiesView />
                ) : (
                    <>
                        {shouldUseLoader && (
                            <BrowserLoader url={activeTab.displayUrl} onComplete={handleLoaderComplete} />
                        )}
                        {activeTab.url ? (
                            <iframe 
                                src={activeTab.blobUrl || activeTab.url} 
                                className="w-full h-full border-0"
                                referrerPolicy="no-referrer"
                                title="browser-content"
                                sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation allow-downloads"
                                onLoad={() => updateTab(activeTabId, { isLoading: false })}
                            />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center pb-20">
                                 <h1 className="text-6xl font-bold text-[#5f6368] dark:text-[#e8eaed] mb-8 select-none">Bing</h1>
                                <div className="w-full max-w-lg px-4">
                                    <div className="relative group shadow-lg rounded-full">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        </div>
                                        <input 
                                            type="text" 
                                            placeholder="Search Bing or type a URL" 
                                            className="w-full pl-12 pr-5 py-3 rounded-full border border-gray-200 dark:border-gray-500 bg-white dark:bg-[#202124] focus:outline-none dark:text-white transition-shadow shadow-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Spoofed Status Bar */}
            <div className="h-6 bg-[#f1f3f4] dark:bg-[#292a2d] border-t border-gray-300 dark:border-black/50 flex items-center justify-between px-3 text-[10px] text-gray-500 font-mono select-none cursor-default">
                <div className="flex space-x-4">
                     <span className="flex items-center"><span className="font-bold mr-1">DEVICE:</span> {spoofedDevice}</span>
                     <span className="flex items-center hidden sm:inline-flex"><span className="font-bold mr-1">OS:</span> {spoofedOS}</span>
                </div>
                <div className="flex space-x-4">
                     <span className="flex items-center hidden sm:inline-flex"><span className="font-bold mr-1">CLIENT:</span> {spoofedClientID}</span>
                     <span className="flex items-center"><span className="font-bold mr-1">ID:</span> {spoofedMachineName}</span>
                </div>
            </div>
        </div>
    );
};

export default LynixBrowserApp;
