
import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Page } from '../../types';

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
const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

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

const BLOCKED_DOMAINS = [
    'x.com', 'twitter.com',
    'facebook.com',
    'instagram.com',
    'reddit.com',
    'linkedin.com',
    'github.com',
    'netflix.com',
    'discord.com',
    'whatsapp.com'
];

const SPECIAL_REDIRECT_URL = 'https://lynixity.x10.bz/iframe.html';

const MobiLynixBrowserApp: React.FC<MobiLynixBrowserAppProps> = ({ navigate, initialUrl }) => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([{ id: 1, title: 'New Tab', url: initialUrl || '', displayUrl: initialUrl || '', history: [initialUrl || ''], historyIndex: 0, isBlocked: false }]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [inputUrl, setInputUrl] = useState(initialUrl || '');
    const [showTabs, setShowTabs] = useState(false);

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);

    // --- Spoofed Info ---
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v12.0";
    const spoofedMachineName = `LynixWeb-Machine-${user?.id || 'Guest'}`;
    const spoofedClientID = "Firefox/115.0";

    useEffect(() => {
        setInputUrl(activeTab.displayUrl || activeTab.url);
    }, [activeTabId, activeTab.url, activeTab.displayUrl]);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        let finalUrl = inputUrl.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        
        let actualUrl = finalUrl;
        let displayUrl = finalUrl;
        let isBlocked = false;
        let specialHandled = false;

        // --- Fixes for Google and YouTube ---
        if (lowerUrl.includes('google.') && !lowerUrl.includes('googleapis')) {
             actualUrl = 'https://www.google.com/webhp?igu=1';
             displayUrl = actualUrl;
             specialHandled = true;
        } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
             try {
                 let targetUrl = actualUrl;
                 if (!targetUrl.match(/^https?:\/\//)) targetUrl = 'https://' + targetUrl;
                 const urlObj = new URL(targetUrl);
                 
                 if (urlObj.hostname.includes('youtu.be')) {
                     // Handle short links: youtu.be/VIDEO_ID -> /watch?v=VIDEO_ID
                     const videoId = urlObj.pathname.slice(1);
                     actualUrl = `https://yewtu.be/watch?v=${videoId}`;
                     if (urlObj.search) actualUrl += '&' + urlObj.search.slice(1);
                 } else {
                     // Handle standard links: youtube.com/path -> /youtube/path
                     actualUrl = `https://yewtu.be${urlObj.pathname}${urlObj.search}`;
                 }
                 displayUrl = actualUrl;
                 specialHandled = true;
             } catch (e) {
                 actualUrl = 'https://yewtu.be/';
                 displayUrl = actualUrl;
                 specialHandled = true;
             }
        }

        if (!specialHandled) {
            const isSearch = !lowerUrl.startsWith('http') && !lowerUrl.startsWith('internal://') && (!lowerUrl.includes('.') || lowerUrl.includes(' '));
            const isSearchEngine = SEARCH_ENGINES.some(site => lowerUrl.includes(site));
            
            isBlocked = BLOCKED_DOMAINS.some(site => lowerUrl.includes(site));

            if (isSearch) {
                 actualUrl = SPECIAL_REDIRECT_URL;
                 displayUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
            } else if (isSearchEngine) {
                 actualUrl = SPECIAL_REDIRECT_URL;
                 if (!finalUrl.startsWith('http')) displayUrl = `https://${finalUrl}`;
            } else {
                if (!finalUrl.startsWith('http') && !finalUrl.startsWith('internal://')) {
                    actualUrl = `https://${finalUrl}`;
                    displayUrl = actualUrl;
                }
            }
        }

        const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
        newHistory.push(displayUrl);
        updateTab(activeTabId, { url: actualUrl, displayUrl: displayUrl, title: displayUrl, history: newHistory, historyIndex: newHistory.length - 1, isBlocked: isBlocked });
        setInputUrl(displayUrl);
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const newUrl = activeTab.history[newIndex];
            handleNavigate({ preventDefault: () => { setInputUrl(newUrl) } } as any);
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const newUrl = activeTab.history[newIndex];
            handleNavigate({ preventDefault: () => { setInputUrl(newUrl) } } as any);
        }
    };
    
    const handleRefresh = () => {
        if(activeTab.isBlocked) return;
        if(activeTab.url) {
            const current = activeTab.url;
            updateTab(activeTabId, { url: 'about:blank' });
            setTimeout(() => updateTab(activeTabId, { url: current }), 50);
        }
    };

    const handleHome = () => {
        const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
        newHistory.push('');
        updateTab(activeTabId, { url: '', displayUrl: '', title: 'New Tab', history: newHistory, historyIndex: newHistory.length - 1, isBlocked: false });
        setInputUrl('');
    };

    const addNewTab = () => {
        const newId = Date.now();
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isBlocked: false };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
        setInputUrl('');
        setShowTabs(false);
    };

    const closeTab = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            updateTab(id, { url: '', displayUrl: '', title: 'New Tab', history: [''], historyIndex: 0, isBlocked: false });
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
    
    const openBlockedInNewWindow = () => {
        const url = activeTab.displayUrl.startsWith('http') ? activeTab.displayUrl : `https://${activeTab.displayUrl}`;
        window.open(url, '_blank', 'width=1200,height=800');
    };

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#1a1a1a] text-black dark:text-white relative">
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
                
                <div className="relative">
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                        <MoreVertical />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full overflow-hidden">
                {activeTab.isBlocked ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-100 dark:bg-slate-900">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-full max-w-xs">
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-full inline-block">
                                <WarningIcon />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Website cannot be reachable using the Browser</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                                {activeTab.displayUrl} has security settings that prevent it from loading here.
                            </p>
                            <button 
                                onClick={openBlockedInNewWindow}
                                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center space-x-2"
                            >
                                <span>Open in your browser</span>
                                <ExternalLinkIcon />
                            </button>
                        </div>
                    </div>
                ) : activeTab.url ? (
                    <iframe 
                        src={activeTab.url} 
                        className="w-full h-full border-0"
                        referrerPolicy="same-origin"
                        title="mobile-browser-content"
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
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
                <span className="mr-2">{spoofedOS}</span> | <span className="ml-2">{spoofedClientID}</span>
            </div>
        </div>
    );
};

export default MobiLynixBrowserApp;
