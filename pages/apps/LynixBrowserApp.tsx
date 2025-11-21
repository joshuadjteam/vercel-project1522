
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';

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
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const WarningIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

interface BrowserTab {
    id: number;
    title: string;
    url: string;
    displayUrl: string; // The URL actually shown in the address bar
    history: string[];
    historyIndex: number;
    isLoading: boolean;
    isBlocked: boolean;
}

// Search engines that should be redirected to the iframe.html page.
const SEARCH_ENGINES = [
    'bing.com', 'www.bing.com',
    'yahoo.com', 'search.yahoo.com',
    'duckduckgo.com',
    'baidu.com',
    'ask.com',
    'aol.com',
    'yandex.com'
];

// Blocked domains that are known to use X-Frame-Options or similar headers
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

const LynixBrowserApp: React.FC = () => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([
        { id: 1, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false }
    ]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [addressBarInput, setAddressBarInput] = useState('');

    // --- Spoofed Info ---
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v12.0";
    const spoofedMachineName = `LynixWeb-Machine-${user?.id || 'Guest'}`;
    const spoofedClientID = "Firefox/115.0"; 

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);

    useEffect(() => {
        setAddressBarInput(activeTab.displayUrl || activeTab.url);
    }, [activeTabId, activeTab.displayUrl, activeTab.url]);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = (input: string) => {
        let finalUrl = input.trim();
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
            // Check for search query
            const isSearch = !lowerUrl.startsWith('http') && !lowerUrl.startsWith('internal://') && (!lowerUrl.includes('.') || lowerUrl.includes(' '));
            
            // Check for search engines
            const isSearchEngine = SEARCH_ENGINES.some(site => lowerUrl.includes(site));
            
            // Check for blocked domains
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

        updateTab(activeTabId, {
            url: actualUrl,
            displayUrl: displayUrl,
            title: displayUrl,
            history: newHistory,
            historyIndex: newHistory.length - 1,
            isLoading: !isBlocked, // Don't show loading spinner for blocked screen
            isBlocked: isBlocked
        });
        
        if (!isBlocked) {
            setTimeout(() => updateTab(activeTabId, { isLoading: false }), 1500);
        }
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const prevUrl = activeTab.history[newIndex];
            handleNavigate(prevUrl);
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const nextUrl = activeTab.history[newIndex];
             handleNavigate(nextUrl);
        }
    };

    const handleRefresh = () => {
        if (activeTab.isBlocked) return;
        updateTab(activeTabId, { isLoading: true });
        const current = activeTab.url;
        updateTab(activeTabId, { url: 'about:blank' });
        setTimeout(() => {
            updateTab(activeTabId, { url: current, isLoading: false });
        }, 100);
    };

    const addTab = () => {
        const newId = Date.now();
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', displayUrl: '', history: [''], historyIndex: 0, isLoading: false, isBlocked: false };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const closeTab = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            updateTab(id, { url: '', displayUrl: '', title: 'New Tab', history: [''], historyIndex: 0, isBlocked: false });
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (id === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const openBlockedInNewWindow = () => {
        const url = activeTab.displayUrl.startsWith('http') ? activeTab.displayUrl : `https://${activeTab.displayUrl}`;
        window.open(url, '_blank', 'width=1200,height=800');
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#dfe3e7] dark:bg-[#202124] text-black dark:text-white rounded-lg overflow-hidden font-sans select-none">
            
            {/* Top Bar (Tabs) */}
            <div className="flex h-10 px-2 pt-2 space-x-1 overflow-x-auto no-scrollbar items-end bg-[#dee1e6] dark:bg-[#000000]">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`group relative flex items-center min-w-[140px] max-w-[220px] h-8 px-3 text-xs rounded-t-xl cursor-pointer transition-all
                            ${activeTabId === tab.id 
                                ? 'bg-white dark:bg-[#35363a] text-black dark:text-white shadow-sm z-10' 
                                : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-white/40 dark:hover:bg-white/10'
                            }`}
                    >
                        {activeTabId !== tab.id && <div className="absolute right-0 h-4 w-[1px] bg-gray-400 dark:bg-gray-600 top-2 group-hover:hidden"></div>}
                        
                        <div className="flex items-center space-x-2 w-full overflow-hidden">
                            {tab.isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500 flex-shrink-0"></div>
                            ) : (
                                tab.url ? <GlobeIcon /> : <div className="w-3 h-3 rounded-full bg-gray-400 flex-shrink-0"></div>
                            )}
                            <span className="truncate flex-grow font-medium">{tab.title || 'New Tab'}</span>
                            <button onClick={(e) => closeTab(e, tab.id)} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <XIcon />
                            </button>
                        </div>
                    </div>
                ))}
                <button onClick={addTab} className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-white/10 transition-colors ml-1">
                    <Plus />
                </button>
            </div>

            {/* Navigation Toolbar */}
            <div className="flex items-center h-12 px-2 bg-white dark:bg-[#35363a] shadow-sm z-20 space-x-2 border-b border-gray-200 dark:border-black/20">
                <div className="flex space-x-1">
                    <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft /></button>
                    <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight /></button>
                    <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><RefreshCw /></button>
                </div>
                
                <button onClick={() => handleNavigate('')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors hidden sm:block"><Home /></button>

                {/* Address Bar */}
                <div className="flex-grow flex items-center bg-[#f1f3f4] dark:bg-[#202124] rounded-full px-3 h-8 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-black transition-all shadow-inner relative group">
                    <div className="text-gray-500 mr-2">
                         {activeTab.url && activeTab.url.startsWith('https') ? <LockIcon /> : <InfoIcon />}
                    </div>
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
                        <button className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-500"><StarIcon /></button>
                    </div>
                </div>

                <div className="flex space-x-1 items-center pl-2">
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hidden sm:block"><UserIcon /></button>
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"><MoreVertical /></button>
                </div>
            </div>
            
            {/* Bookmarks Bar */}
            <div className="h-8 bg-white dark:bg-[#35363a] flex items-center px-4 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-black/10 space-x-2">
                 <button onClick={() => handleNavigate('https://wikipedia.org')} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>Wikipedia</span></button>
                 <button onClick={() => handleNavigate('https://yewtu.be')} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>YouTube</span></button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full overflow-hidden">
                {activeTab.isBlocked ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border border-red-200 dark:border-red-800 shadow-xl max-w-md">
                            <WarningIcon />
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Website cannot be reachable using the Browser</h2>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                This website has security settings (X-Secure-Option) that prevent it from being displayed inside this browser frame.
                            </p>
                            <button 
                                onClick={openBlockedInNewWindow}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center mx-auto transition-colors"
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
                        title="browser-content"
                        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
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
