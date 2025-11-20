
import React, { useState, useRef, useEffect, useMemo } from 'react';
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
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

interface BrowserTab {
    id: number;
    title: string;
    url: string;
    icon: string;
    history: string[];
    historyIndex: number;
}

// List of domains that are redirected to the special iframe
const REDIRECT_ENGINES = [
    'google.com', 
    'www.google.com', 
    'bing.com', 
    'www.bing.com', 
    'yahoo.com', 
    'search.yahoo.com',
    'duckduckgo.com', 
    'baidu.com',
    'ask.com',
    'aol.com',
    'yandex.com'
];

// List of domains that are known to block iframe/object embedding.
const BLOCKED_DOMAINS = [
    'x.com', 
    'twitter.com', 
    'facebook.com', 
    'instagram.com', 
    'reddit.com', 
    'discord.com', 
    'linkedin.com', 
    'whatsapp.com', 
    'netflix.com'
];

const LynixBrowserApp: React.FC = () => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([
        { id: 1, title: 'New Tab', url: '', icon: '', history: [''], historyIndex: 0 }
    ]);
    const [activeTabId, setActiveTabId] = useState(1);
    const [addressBarInput, setAddressBarInput] = useState('');
    const [showInfoModal, setShowInfoModal] = useState(false);

    // --- Spoofed Info ---
    const spoofedUserAgent = "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/115.0";
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v12.0";
    const spoofedMachineName = `LynixWeb-Machine-${user?.id || 'Guest'}`;
    const spoofedClientID = "Firefox/115.0";

    const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId)!, [tabs, activeTabId]);

    useEffect(() => {
        setAddressBarInput(activeTab.url);
    }, [activeTabId, activeTab.url]);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = (input: string) => {
        let finalUrl = input.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        
        // 1. Check for Redirect Engines (Google, Bing, etc.)
        const shouldRedirect = REDIRECT_ENGINES.some(engine => lowerUrl.includes(engine));

        if (shouldRedirect) {
            finalUrl = 'https://lynixity.x10.bz/iframe.html';
        } else {
            // 2. Normal Navigation Logic
            if (!finalUrl.startsWith('http') && !finalUrl.startsWith('internal://')) {
                // If it looks like a domain
                if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                    finalUrl = `https://${finalUrl}`;
                } else {
                    // 3. Default Search: Bing
                    finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(finalUrl)}`;
                }
            }
        }

        const newHistory = activeTab.history.slice(0, activeTab.historyIndex + 1);
        newHistory.push(finalUrl);

        updateTab(activeTabId, {
            url: finalUrl,
            title: finalUrl, 
            history: newHistory,
            historyIndex: newHistory.length - 1
        });
    };

    const handleBack = () => {
        if (activeTab.historyIndex > 0) {
            const newIndex = activeTab.historyIndex - 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, { historyIndex: newIndex, url: newUrl });
        }
    };

    const handleForward = () => {
        if (activeTab.historyIndex < activeTab.history.length - 1) {
            const newIndex = activeTab.historyIndex + 1;
            const newUrl = activeTab.history[newIndex];
            updateTab(activeTabId, { historyIndex: newIndex, url: newUrl });
        }
    };

    const handleRefresh = () => {
        const currentUrl = activeTab.url;
        updateTab(activeTabId, { url: '' });
        setTimeout(() => updateTab(activeTabId, { url: currentUrl }), 50);
    };

    const addTab = () => {
        const newId = Math.max(0, ...tabs.map(t => t.id)) + 1;
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', icon: '', history: [''], historyIndex: 0 };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const closeTab = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            updateTab(id, { url: '', title: 'New Tab', history: [''], historyIndex: 0 });
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (id === activeTabId) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const openPopup = (url: string) => {
        window.open(url, '_blank', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1200,height=800');
    };

    const isBlocked = BLOCKED_DOMAINS.some(d => activeTab.url.includes(d));

    return (
        <div className="w-full h-full flex flex-col bg-[#dfe3e7] dark:bg-[#202124] text-black dark:text-white rounded-lg overflow-hidden font-sans select-none">
            
            {/* Top Bar (Tabs) */}
            <div className="flex h-10 px-2 pt-2 space-x-1 overflow-x-auto no-scrollbar items-end bg-[#dfe3e7] dark:bg-[#000000]">
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
                        {/* Separator */}
                        {activeTabId !== tab.id && <div className="absolute right-0 h-4 w-[1px] bg-gray-400 dark:bg-gray-600 top-2 group-hover:hidden"></div>}
                        
                        <div className="flex items-center space-x-2 w-full">
                            {isBlocked && tab.url ? <LockIcon /> : (tab.icon ? <img src={tab.icon} className="w-4 h-4" alt=""/> : <div className="w-3 h-3 rounded-full bg-gray-400"></div>)}
                            <span className="truncate flex-grow font-medium">{tab.title || 'New Tab'}</span>
                            <button onClick={(e) => closeTab(e, tab.id)} className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <div className="flex items-center h-14 px-2 bg-white dark:bg-[#35363a] shadow-sm z-20 space-x-2 border-b border-gray-200 dark:border-black/20">
                <div className="flex space-x-1">
                    <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft /></button>
                    <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight /></button>
                    <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><RefreshCw /></button>
                </div>
                
                <button onClick={() => handleNavigate('')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors hidden sm:block"><Home /></button>

                {/* Address Bar */}
                <div className="flex-grow flex items-center bg-[#f1f3f4] dark:bg-[#202124] rounded-full px-4 h-9 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-black transition-all shadow-inner relative">
                    <div className="text-gray-500 mr-2"><InfoIcon /></div>
                    <input
                        type="text"
                        value={addressBarInput}
                        onChange={(e) => setAddressBarInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                        onFocus={(e) => e.target.select()}
                        className="flex-grow bg-transparent border-none outline-none text-sm text-black dark:text-white"
                        placeholder="Search or type URL"
                    />
                    <div className="flex space-x-1">
                        <button className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-500"><StarIcon /></button>
                    </div>
                </div>

                {/* Profile & Menu */}
                <div className="flex space-x-1 items-center pl-2">
                    <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hidden sm:block"><UserIcon /></button>
                    <button onClick={() => setShowInfoModal(true)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"><MoreVertical /></button>
                </div>
            </div>

            {/* Bookmarks Bar */}
            <div className="h-8 bg-white dark:bg-[#35363a] flex items-center px-4 text-xs text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-black/10 space-x-2">
                 <button onClick={() => handleNavigate('https://wikipedia.org')} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-gray-500"></div><span>Wikipedia</span></button>
                 <button onClick={() => handleNavigate('https://lynixity.x10.bz/iframe.html')} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Lynix Frame</span></button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full">
                {activeTab.url ? (
                    isBlocked ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#202124] text-center p-10">
                            <div className="bg-white dark:bg-[#292a2d] p-10 rounded-2xl shadow-xl max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center">
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                                    <ShieldIcon />
                                </div>
                                <h1 className="text-2xl font-medium mb-2 text-gray-800 dark:text-gray-100">Secure Connection Required</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                    The website <strong>{new URL(activeTab.url).hostname}</strong> uses strict security policies (Cross-Origin/X-Frame) that prevent it from being displayed embedded.
                                </p>
                                <button 
                                    onClick={() => openPopup(activeTab.url)}
                                    className="px-6 py-3 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-full font-medium shadow-sm transition-all flex items-center space-x-2"
                                >
                                    <span>Open Secure Session</span>
                                    <ExternalLinkIcon />
                                </button>
                                <p className="mt-4 text-xs text-gray-400">This will launch a secure browsing window.</p>
                            </div>
                        </div>
                    ) : (
                        <object
                            data={activeTab.url}
                            type="text/html"
                            className="w-full h-full border-0"
                        >
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <p>Content failed to load. Please try opening in a secure session.</p>
                            </div>
                        </object>
                    )
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-[#202124] text-center">
                        <h1 className="text-6xl font-bold text-[#5f6368] dark:text-[#e8eaed] mb-8">Bing</h1>
                        <div className="w-full max-w-lg px-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search Bing or type a URL" 
                                    className="w-full pl-12 pr-5 py-3 rounded-full border border-gray-200 dark:border-gray-500 bg-white dark:bg-[#202124] focus:shadow-md focus:outline-none focus:border-transparent dark:text-white transition-shadow"
                                    onKeyDown={(e) => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Spoofed Status Bar */}
            <div className="h-7 bg-[#f1f3f4] dark:bg-[#292a2d] border-t border-gray-300 dark:border-black/50 flex items-center justify-between px-3 text-[10px] text-gray-500 font-mono select-text">
                <div className="flex space-x-4">
                     <span className="flex items-center"><span className="font-bold mr-1">DEVICE:</span> {spoofedDevice}</span>
                     <span className="flex items-center"><span className="font-bold mr-1">OS:</span> {spoofedOS}</span>
                </div>
                <div className="flex space-x-4">
                     <span className="flex items-center"><span className="font-bold mr-1">CLIENT:</span> {spoofedClientID}</span>
                     <span className="flex items-center"><span className="font-bold mr-1">ID:</span> {spoofedMachineName}</span>
                </div>
            </div>

            {/* System Info Modal */}
            {showInfoModal && (
                <div className="absolute top-24 right-4 w-80 bg-white dark:bg-[#292a2d] rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 p-4 animate-fade-in">
                    <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-600 pb-2">
                        <h3 className="font-bold text-lg">About Browser</h3>
                        <button onClick={() => setShowInfoModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded"><XIcon /></button>
                    </div>
                    <div className="space-y-3 text-sm">
                         <div className="bg-gray-50 dark:bg-black/20 p-2 rounded">
                             <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Machine ID</label>
                             <p className="font-mono text-xs truncate">{spoofedMachineName}</p>
                         </div>
                         <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase">Operating System</label>
                             <p className="text-gray-700 dark:text-gray-300">{spoofedOS}</p>
                         </div>
                         <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase">Hardware</label>
                             <p className="text-gray-700 dark:text-gray-300">{spoofedDevice}</p>
                         </div>
                         <div>
                             <label className="block text-xs font-semibold text-gray-500 uppercase">User Agent</label>
                             <p className="text-xs text-gray-500 dark:text-gray-400 italic break-words">{spoofedUserAgent}</p>
                         </div>
                    </div>
                    <div className="mt-4 pt-2 border-t border-gray-200 dark:border-gray-600 text-center">
                        <p className="text-xs text-gray-400">Lynix Browser v1.0.4 (Official Build) (64-bit)</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LynixBrowserApp;
