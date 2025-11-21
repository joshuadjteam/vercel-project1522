
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';
import BrowserLoader from '../../components/BrowserLoader';
import { database } from '../../services/database';

// --- Icons ---
const ArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>;
const ArrowRight = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const RefreshCw = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const Home = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const MoreVertical = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
const SearchIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const Plus = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const CookieIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ShieldCheckIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

interface MobiLynixBrowserAppProps {
    navigate: (page: Page, params?: any) => void;
    initialUrl?: string;
}

interface BrowserTab {
    id: number;
    title: string;
    url: string;
    displayUrl: string;
    history: string[];
    historyIndex: number;
    isBlocked: boolean;
    isLoading: boolean;
    blobUrl?: string;
}

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

const MobiLynixBrowserApp: React.FC<MobiLynixBrowserAppProps> = ({ navigate, initialUrl }) => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([{ id: 1, title: 'New Tab', url: initialUrl || '', displayUrl: initialUrl || '', history: [initialUrl || ''], historyIndex: 0, isBlocked: false, isLoading: !!initialUrl }]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [inputUrl, setInputUrl] = useState(initialUrl || '');
    const [showTabs, setShowTabs] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [securityBypassEnabled, setSecurityBypassEnabled] = useState(true);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);
    const settingsRef = useRef<HTMLDivElement>(null);

    // --- Spoofed Info ---
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v15.0 (Mobile)";
    const spoofedClientID = "Firefox/115.0";

    useEffect(() => {
        setInputUrl(activeTab.displayUrl || activeTab.url);
    }, [activeTabId, activeTab.url, activeTab.displayUrl]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'LYNIX_NAVIGATE' && event.data.url) {
                console.log('MobileBrowser: Received navigation request to:', event.data.url);
                handleNavigate({ preventDefault: () => {} } as any, event.data.url);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [activeTabId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setSettingsMenuOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = (e?: React.FormEvent, overrideUrl?: string) => {
        if (e) e.preventDefault();
        let finalUrl = overrideUrl ? overrideUrl.trim() : inputUrl.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        
        let actualUrl = finalUrl;
        let displayUrl = finalUrl;
        let specialHandled = false;

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

        setTabs(currentTabs => {
            const tab = currentTabs.find(t => t.id === activeTabId);
            if(!tab) return currentTabs;

            const newHistory = tab.history.slice(0, tab.historyIndex + 1);
            newHistory.push(displayUrl);
            
            if (tab.blobUrl) URL.revokeObjectURL(tab.blobUrl);

            const requiresProxy = securityBypassEnabled && !actualUrl.startsWith('internal://') && actualUrl !== SPECIAL_REDIRECT_URL;

            return currentTabs.map(t => t.id === activeTabId ? { 
                ...t,
                url: actualUrl, 
                displayUrl: displayUrl, 
                title: displayUrl, 
                history: newHistory, 
                historyIndex: newHistory.length - 1, 
                isBlocked: false,
                isLoading: true,
                blobUrl: requiresProxy ? undefined : undefined
            } : t);
        });
        
        setInputUrl(displayUrl);
    };

    const handleLoaderComplete = (blobUrl?: string) => {
        updateTab(activeTabId, { isLoading: false, blobUrl });
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, {
                url: newUrl,
                displayUrl: newUrl,
                historyIndex: newIndex,
                isLoading: true,
                blobUrl: undefined
            });
            setInputUrl(newUrl);
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, {
                url: newUrl,
                displayUrl: newUrl,
                historyIndex: newIndex,
                isLoading: true,
                blobUrl: undefined
            });
            setInputUrl(newUrl);
        }
    };
    
    const handleRefresh = () => {
        updateTab(activeTabId, { isLoading: true, blobUrl: undefined });
    };

    const handleHome = () => {
        const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
        newHistory.push('');
        updateTab(activeTabId, { url: '', displayUrl: '', title: 'New Tab', history: newHistory, historyIndex: newHistory.length - 1, isBlocked: false, isLoading: false, blobUrl: undefined });
        setInputUrl('');
    };

    const addNewTab = () => {
        const newId = Date.now();
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isBlocked: false, isLoading: false };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        setInputUrl('');
        setShowTabs(false);
    };

    const closeTab = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        const tabToClose = tabs.find(t => t.id === id);
        if (tabToClose?.blobUrl) URL.revokeObjectURL(tabToClose.blobUrl);

        if (tabs.length === 1) {
            updateTab(id, { url: '', displayUrl: '', title: 'New Tab', history: [''], historyIndex: 0, isBlocked: false, isLoading: false, blobUrl: undefined });
            setInputUrl('');
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (id === activeTabId) {
            const nextTab = newTabs[newTabs.length - 1];
            setActiveTabId(nextTab.id);
            setInputUrl(nextTab.displayUrl);
        }
    };

    const switchToTab = (id: number) => {
        setActiveTabId(id);
        const tab = tabs.find(t => t.id === id);
        if (tab) setInputUrl(tab.displayUrl);
        setShowTabs(false);
    }
    
    const clearCookies = () => {
        if (window.confirm("Clear all browser data?")) {
            tabs.forEach(t => { if (t.blobUrl) URL.revokeObjectURL(t.blobUrl); });
            setTabs([{ id: Date.now(), title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false }]);
            setInputUrl('');
            setSettingsMenuOpen(false);
        }
    };

    const iframeSrc = activeTab.blobUrl || activeTab.url;
    const shouldUseLoader = activeTab.isLoading && !!activeTab.url && securityBypassEnabled && !activeTab.url.startsWith('internal://') && activeTab.url !== SPECIAL_REDIRECT_URL;

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#1a1a1a] text-black dark:text-white relative overflow-hidden">
             {showTabs && (
                <div className="absolute inset-0 bg-black/90 z-50 flex flex-col p-4">
                    <div className="flex justify-between items-center mb-4">
                         <h2 className="text-white text-lg font-bold">Tabs</h2>
                         <button onClick={() => setShowTabs(false)} className="text-white p-2">Done</button>
                    </div>
                    <div className="flex-grow grid grid-cols-2 gap-4 overflow-y-auto">
                        {tabs.map(tab => (
                            <div key={tab.id} onClick={() => switchToTab(tab.id)} className={`relative p-4 rounded-lg border ${activeTabId === tab.id ? 'border-blue-500 bg-blue-900/20' : 'border-gray-600 bg-gray-800'} flex flex-col justify-between h-32`}>
                                <div className="text-white text-sm font-bold truncate">{tab.title}</div>
                                <div className="text-gray-400 text-xs truncate">{tab.displayUrl || 'Empty'}</div>
                                <button onClick={(e) => closeTab(e, tab.id)} className="absolute top-2 right-2 bg-gray-700 rounded-full p-1 text-white"><XIcon/></button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addNewTab} className="mt-4 w-full py-3 bg-blue-600 rounded-lg text-white font-bold flex items-center justify-center space-x-2">
                        <Plus /> <span>New Tab</span>
                    </button>
                </div>
            )}

            {/* Address Bar Area */}
            <div className="flex-shrink-0 bg-gray-100 dark:bg-[#2c2c2c] p-2 border-b border-gray-300 dark:border-black flex items-center space-x-2 shadow-sm z-20">
                <button onClick={handleHome} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                    <Home />
                </button>
                
                <form onSubmit={handleNavigate} className="flex-grow relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        {activeTab.url && activeTab.url.startsWith('https') ? <LockIcon /> : <SearchIcon className="w-4 h-4 text-gray-400" />}
                    </div>
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="w-full py-2 pl-10 pr-8 rounded-lg border-none outline-none bg-white dark:bg-[#404040] text-sm text-black dark:text-white shadow-inner"
                        placeholder="Search or type URL"
                        onFocus={(e) => e.target.select()}
                    />
                    {inputUrl && (
                        <button type="button" onClick={() => { setInputUrl(''); }} className="absolute inset-y-0 right-2 flex items-center text-gray-500">
                            <XIcon />
                        </button>
                    )}
                </form>

                <button onClick={() => setShowTabs(true)} className="w-8 h-8 rounded-lg border-2 border-gray-600 dark:border-gray-400 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10">
                    {tabs.length}
                </button>
                
                <div className="relative" ref={settingsRef}>
                    <button onClick={() => setSettingsMenuOpen(!settingsMenuOpen)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                        <MoreVertical />
                    </button>
                    {settingsMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-[#35363a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 py-2 z-50">
                            <div className="px-4 py-2 flex items-center justify-between">
                                <span className="text-sm font-medium">Security Bypass</span>
                                <button onClick={() => setSecurityBypassEnabled(!securityBypassEnabled)} className={`w-10 h-5 rounded-full relative transition-colors ${securityBypassEnabled ? 'bg-green-500' : 'bg-gray-400'}`}>
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${securityBypassEnabled ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <button onClick={clearCookies} className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center space-x-2"><CookieIcon /><span>Clear Cookies</span></button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full overflow-hidden">
                {shouldUseLoader ? (
                    <BrowserLoader url={activeTab.displayUrl} isMobile={true} onComplete={handleLoaderComplete} />
                ) : activeTab.url ? (
                    <iframe 
                        src={iframeSrc} 
                        className="w-full h-full border-0"
                        referrerPolicy="no-referrer"
                        title="mobile-browser-content"
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation allow-downloads"
                        onLoad={() => updateTab(activeTabId, { isLoading: false })}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <h1 className="text-4xl font-bold text-gray-500 dark:text-gray-400 mb-6 select-none">Bing</h1>
                        <div className="w-full">
                             <div className="relative group shadow-md rounded-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <SearchIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search..." 
                                    className="w-full pl-12 pr-5 py-3 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#2c2c2c] focus:outline-none dark:text-white"
                                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate({ preventDefault: () => { setInputUrl((e.target as HTMLInputElement).value); handleNavigate(); } } as any)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Toolbar */}
            <div className="flex justify-around items-center h-12 bg-gray-100 dark:bg-[#2c2c2c] border-t border-gray-300 dark:border-black/50 z-20">
                <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-3 text-gray-600 dark:text-gray-300 disabled:opacity-30"><ArrowLeft /></button>
                <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-3 text-gray-600 dark:text-gray-300 disabled:opacity-30"><ArrowRight /></button>
                <button onClick={handleRefresh} className="p-3 text-gray-600 dark:text-gray-300"><RefreshCw /></button>
                <button onClick={handleHome} className="p-3 text-gray-600 dark:text-gray-300"><Home /></button>
            </div>
            
            {/* Spoofed Status Bar */}
            <div className="h-5 bg-[#f1f3f4] dark:bg-[#292a2d] flex items-center justify-center text-[9px] text-gray-500 font-mono select-none border-t border-gray-300 dark:border-black/50">
                <span className="mr-2">{spoofedOS}</span>
            </div>
        </div>
    );
};

export default MobiLynixBrowserApp;
