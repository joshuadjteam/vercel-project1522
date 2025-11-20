
import React, { useState, useEffect, useMemo } from 'react';
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

interface BrowserTab {
    id: number;
    title: string;
    url: string;
    history: string[];
    historyIndex: number;
    isLoading: boolean;
}

const SPECIAL_REDIRECT_ENGINES = [
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

const SPECIAL_REDIRECT_URL = 'https://lynixity.x10.bz/iframe.html';

const LynixBrowserApp: React.FC = () => {
    const { user } = useAuth();
    const [tabs, setTabs] = useState<BrowserTab[]>([
        { id: 1, title: 'New Tab', url: '', history: [''], historyIndex: 0, isLoading: false }
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
        setAddressBarInput(activeTab.url);
    }, [activeTabId, activeTab.url]);

    const updateTab = (id: number, updates: Partial<BrowserTab>) => {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleNavigate = (input: string) => {
        let finalUrl = input.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        const shouldRedirect = SPECIAL_REDIRECT_ENGINES.some(engine => lowerUrl.includes(engine));

        if (shouldRedirect) {
            finalUrl = SPECIAL_REDIRECT_URL;
        } else {
            if (!finalUrl.startsWith('http') && !finalUrl.startsWith('internal://')) {
                if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
                    finalUrl = `https://${finalUrl}`;
                } else {
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
            historyIndex: newHistory.length - 1,
            isLoading: true
        });
        
        setTimeout(() => updateTab(activeTabId, { isLoading: false }), 1000);
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
        updateTab(activeTabId, { isLoading: true });
        setTimeout(() => updateTab(activeTabId, { isLoading: false }), 800);
        const current = activeTab.url;
        updateTab(activeTabId, { url: '' });
        setTimeout(() => updateTab(activeTabId, { url: current }), 10);
    };

    const addTab = () => {
        const newId = Math.max(0, ...tabs.map(t => t.id)) + 1;
        const newTab: BrowserTab = { id: newId, title: 'New Tab', url: '', history: [''], historyIndex: 0, isLoading: false };
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
                        {activeTabId !== tab.id && <div className="absolute right-0 h-4 w-[1px] bg-gray-400 dark:bg-gray-600 top-2 group-hover:hidden"></div>}
                        
                        <div className="flex items-center space-x-2 w-full">
                            {tab.isLoading ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                            ) : (
                                tab.url ? <GlobeIcon /> : <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            )}
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
            <div className="flex items-center h-12 px-2 bg-white dark:bg-[#35363a] shadow-sm z-20 space-x-2 border-b border-gray-200 dark:border-black/20">
                <div className="flex space-x-1">
                    <button onClick={handleBack} disabled={activeTab.historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft /></button>
                    <button onClick={handleForward} disabled={activeTab.historyIndex >= activeTab.history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight /></button>
                    <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><RefreshCw /></button>
                </div>
                
                <button onClick={() => handleNavigate('')} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors hidden sm:block"><Home /></button>

                {/* Address Bar */}
                <div className="flex-grow flex items-center bg-[#f1f3f4] dark:bg-[#202124] rounded-full px-3 h-8 border-2 border-transparent focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-black transition-all shadow-inner relative">
                    <div className="text-gray-500 mr-2">
                         {activeTab.url && activeTab.url.startsWith('https') ? <LockIcon /> : <InfoIcon />}
                    </div>
                    <input
                        type="text"
                        value={addressBarInput}
                        onChange={(e) => setAddressBarInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleNavigate((e.target as HTMLInputElement).value)}
                        onFocus={(e) => e.target.select()}
                        className="flex-grow bg-transparent border-none outline-none text-sm text-black dark:text-white"
                        placeholder="Search Google or type a URL"
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
                 <button onClick={() => handleNavigate('https://lynixity.x10.bz/iframe.html')} className="hover:bg-gray-200 dark:hover:bg-white/10 px-2 py-1 rounded flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Lynix Frame</span></button>
            </div>

            {/* Main Content Area */}
            <div className="flex-grow relative bg-white dark:bg-[#202124] w-full h-full overflow-hidden">
                {activeTab.url ? (
                    <embed 
                        src={activeTab.url} 
                        type="text/html" 
                        className="w-full h-full border-0"
                    />
                ) : (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                         <h1 className="text-6xl font-bold text-[#5f6368] dark:text-[#e8eaed] mb-8 select-none">Bing</h1>
                        <div className="w-full max-w-lg px-4">
                            <div className="relative group shadow-lg rounded-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input 
                                    type="text" 
                                    placeholder="Search Bing or type a URL" 
                                    className="w-full pl-12 pr-5 py-3 rounded-full border border-gray-200 dark:border-gray-500 bg-white dark:bg-[#202124] focus:outline-none dark:text-white transition-shadow"
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
