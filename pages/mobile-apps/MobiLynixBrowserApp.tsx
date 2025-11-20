import React, { useState, useRef, useEffect, useMemo } from 'react';
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
const TabsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const ExternalLinkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;

interface MobiLynixBrowserAppProps {
    navigate: (page: Page, params?: any) => void;
    initialUrl?: string;
}

// List of domains that are redirected to the special iframe
const REDIRECT_ENGINES = [
    'google.com', 'www.google.com', 'bing.com', 'www.bing.com', 
    'yahoo.com', 'search.yahoo.com', 'duckduckgo.com', 
    'baidu.com', 'ask.com', 'aol.com', 'yandex.com'
];

// List of domains that are known to block iframe embedding.
const BLOCKED_DOMAINS = [
    'x.com', 'twitter.com', 'facebook.com', 'instagram.com', 
    'reddit.com', 'discord.com', 'linkedin.com', 'whatsapp.com', 
    'netflix.com'
];

const MobiLynixBrowserApp: React.FC<MobiLynixBrowserAppProps> = ({ navigate, initialUrl }) => {
    const { user } = useAuth();
    const [url, setUrl] = useState(initialUrl || '');
    const [inputUrl, setInputUrl] = useState(initialUrl || '');
    const [history, setHistory] = useState<string[]>(initialUrl ? [initialUrl] : ['']);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [showInfo, setShowInfo] = useState(false);

    // --- Spoofed Info ---
    const spoofedDevice = "Unknown Linux Device";
    const spoofedOS = "DozianOS for Lynix v12.0";
    const spoofedMachineName = `LynixWeb-Machine-${user?.id || 'Guest'}`;
    const spoofedClientID = "Firefox/115.0";

    const handleNavigate = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        let finalUrl = inputUrl.trim();
        if (!finalUrl) return;

        const lowerUrl = finalUrl.toLowerCase();
        
        // 1. Check for Redirect Engines
        if (REDIRECT_ENGINES.some(engine => lowerUrl.includes(engine))) {
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

        setUrl(finalUrl);
        setInputUrl(finalUrl);
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(finalUrl);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const handleBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            const newUrl = history[newIndex];
            setHistoryIndex(newIndex);
            setUrl(newUrl);
            setInputUrl(newUrl);
        }
    };

    const handleForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            const newUrl = history[newIndex];
            setHistoryIndex(newIndex);
            setUrl(newUrl);
            setInputUrl(newUrl);
        }
    };
    
    const handleRefresh = () => {
        const current = url;
        setUrl('');
        setTimeout(() => setUrl(current), 50);
    };

    const handleHome = () => {
        setUrl('');
        setInputUrl('');
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push('');
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const isBlocked = BLOCKED_DOMAINS.some(d => url.includes(d));

    return (
        <div className="w-full h-full flex flex-col bg-white dark:bg-[#1a1a1a] text-black dark:text-white">
            {/* Address Bar Area */}
            <div className="flex-shrink-0 bg-gray-100 dark:bg-[#2c2c2c] p-2 border-b border-gray-300 dark:border-black flex items-center space-x-2 shadow-sm z-20">
                <button onClick={handleHome} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                    <Home />
                </button>
                
                <form onSubmit={handleNavigate} className="flex-grow relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        {url.startsWith('https') ? <LockIcon /> : <SearchIcon className="w-4 h-4 text-gray-400" />}
                    </div>
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-white dark:bg-[#1e1e1e] rounded-full py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm dark:text-white"
                        placeholder="Search or type URL"
                    />
                    {inputUrl && (
                        <button 
                            type="button"
                            onClick={() => setInputUrl('')}
                            className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    )}
                </form>

                <button onClick={() => setShowInfo(!showInfo)} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 ${showInfo ? 'text-blue-500' : 'text-gray-600 dark:text-gray-300'}`}>
                    <MoreVertical />
                </button>
            </div>

            {/* Info Panel (Spoof Data) */}
            {showInfo && (
                <div className="bg-blue-50 dark:bg-[#242424] border-b border-blue-100 dark:border-gray-700 p-3 text-xs font-mono space-y-1 animate-fade-in shadow-inner">
                    <div className="flex justify-between"><span className="font-bold text-gray-500">ID:</span> <span>{spoofedMachineName}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-gray-500">OS:</span> <span>{spoofedOS}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-gray-500">HW:</span> <span>{spoofedDevice}</span></div>
                    <div className="flex justify-between"><span className="font-bold text-gray-500">CL:</span> <span>{spoofedClientID}</span></div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-grow relative overflow-hidden w-full h-full bg-white dark:bg-[#1a1a1a]">
                {url ? (
                     isBlocked ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-[#121212]">
                            <ShieldIcon />
                            <h2 className="text-xl font-bold mt-4 mb-2">Secure Content</h2>
                            <p className="text-sm text-gray-500 mb-6">This site requires a secure popup window to display correctly.</p>
                            <button 
                                onClick={() => window.open(url, '_blank')}
                                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 shadow-md active:scale-95 transition-transform"
                            >
                                <span>Open in New Window</span>
                                <ExternalLinkIcon />
                            </button>
                        </div>
                    ) : (
                        <iframe
                            src={url}
                            className="w-full h-full border-0"
                            title="Browser Content"
                            sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-presentation"
                            allow="camera; microphone; geolocation; fullscreen"
                        />
                    )
                ) : (
                    // Home / New Tab Screen
                    <div className="flex flex-col items-center justify-center h-full p-8 bg-white dark:bg-[#1a1a1a]">
                        <h1 className="text-5xl font-bold text-gray-400 dark:text-gray-600 mb-8 select-none">Bing</h1>
                        <div className="w-full max-w-md">
                             <div className="relative shadow-md rounded-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <SearchIcon />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search Bing"
                                    className="w-full py-3 pl-12 pr-4 rounded-full bg-white dark:bg-[#2c2c2c] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value;
                                            handleNavigate({ preventDefault: () => {} } as any); // Trigger nav manually
                                            setInputUrl(val); // Update inputs
                                            const finalUrl = `https://www.bing.com/search?q=${encodeURIComponent(val)}`;
                                            setUrl(finalUrl);
                                            setHistory([...history, finalUrl]);
                                            setHistoryIndex(historyIndex + 1);
                                        }
                                    }}
                                />
                             </div>
                        </div>
                        <div className="mt-8 flex space-x-4">
                            <button onClick={() => { setUrl('https://lynixity.x10.bz/iframe.html'); setInputUrl('https://lynixity.x10.bz/iframe.html'); }} className="flex flex-col items-center space-y-1">
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500">
                                    <span className="font-bold text-lg">L</span>
                                </div>
                                <span className="text-xs text-gray-500">Lynix</span>
                            </button>
                             <button onClick={() => { setUrl('https://wikipedia.org'); setInputUrl('https://wikipedia.org'); }} className="flex flex-col items-center space-y-1">
                                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-500">
                                    <span className="font-bold text-lg font-serif">W</span>
                                </div>
                                <span className="text-xs text-gray-500">Wiki</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Toolbar */}
            <div className="flex-shrink-0 bg-gray-100 dark:bg-[#2c2c2c] h-12 border-t border-gray-300 dark:border-black flex justify-around items-center px-4 shadow-[0_-1px_3px_rgba(0,0,0,0.1)] z-20">
                <button onClick={handleBack} disabled={historyIndex <= 0} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-opacity">
                    <ArrowLeft />
                </button>
                <button onClick={handleForward} disabled={historyIndex >= history.length - 1} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 disabled:opacity-30 transition-opacity">
                    <ArrowRight />
                </button>
                <button onClick={() => setShowInfo(prev => !prev)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300">
                    <InfoIcon />
                </button>
                <button onClick={handleRefresh} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10">
                    <RefreshCw />
                </button>
                <div className="p-2 rounded-md border border-gray-400 dark:border-gray-500 flex items-center justify-center w-6 h-6 text-xs font-bold text-gray-600 dark:text-gray-300">
                    1
                </div>
            </div>
        </div>
    );
};

export default MobiLynixBrowserApp;