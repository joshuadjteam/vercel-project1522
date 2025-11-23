
import React, { useState, useMemo, useEffect } from 'react';
import { Page, AppLaunchable } from '../types';
import { useTheme, wallpapers } from '../hooks/useTheme';

// Icons
const GoogleG = () => <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.6v3.1h3.92c2.28-2.1 3.6-5.2 3.6-8.94z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.92-2.91l-3.91-3.1c-1.08.72-2.45 1.16-4 1.16-3.13 0-5.78-2.11-6.73-4.96H1.5v3.1C3.47 21.11 7.6 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.19c-.25-.74-.39-1.53-.39-2.35 0-.82.14-1.61.38-2.35V6.39H1.5A11.99 11.99 0 0 0 0 11.84c0 1.98.47 3.89 1.35 5.59l4.175-3.24z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.2 1.19 15.49 0 12.255 0 7.6 0 3.47 2.89 1.5 6.39l4.02 3.12c.96-2.85 3.61-4.96 6.74-4.96z"/></svg>;
const LensIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9a5 5 0 0 1 5-5 1 1 0 0 1 1 1 1 1 0 0 0 2 0 1 1 0 0 1 1 1 5 5 0 0 1-5 5 1 1 0 0 1-1 1 1 1 0 0 0-2 0 1 1 0 0 1-1-1z"/></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>;

interface MobiLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const MobiLauncher: React.FC<MobiLauncherProps> = ({ navigate, appsList }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { wallpaper } = useTheme();
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDate(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const handleSearch = () => {
        if (searchQuery.trim() !== '') {
            const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            window.open(url, '_blank');
            setSearchQuery('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') handleSearch();
    };

    // Pinned to Dock
    const DOCK_APPS_IDS = ['app-phone', 'app-chat', 'app-browser', 'app-localmail'];
    
    const dockApps = useMemo(() => 
        DOCK_APPS_IDS.map(id => appsList.find(app => app.id === id)).filter(Boolean) as AppLaunchable[],
        [appsList]
    );
    
    // Grid Apps (exclude dock and hidden, but include help)
    const gridApps = useMemo(() =>
        appsList.filter(app => !app.isHidden && !DOCK_APPS_IDS.includes(app.id)),
        [appsList]
    );

    const handleAppClick = (app: AppLaunchable) => {
        if (app.isWebApp) {
            navigate('mobi-app-webview', { url: app.url, title: app.label, appData: app });
        } else {
            navigate(app.page, { ...app.params, appData: app });
        }
    };

    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return (
        <div className={`w-full h-full flex flex-col ${wallpapers[wallpaper].class} relative overflow-hidden font-sans`}>
            
            {/* Status Bar Placeholder (Android style) */}
            <div className="h-8 w-full flex justify-between items-center px-4 text-white text-xs font-medium z-20 pt-2">
                <span>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <div className="flex space-x-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                </div>
            </div>

            {/* At a Glance */}
            <div className="mt-8 px-6 z-10">
                <div className="text-white drop-shadow-md">
                    <h2 className="text-xl font-medium opacity-90">{dayName}, {dateStr}</h2>
                    <div className="flex items-center text-sm opacity-80 mt-1">
                        <span className="mr-2">72°F</span>
                        <span>Mostly Sunny</span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="flex-grow p-4 mt-4">
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {gridApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center space-y-1 active:scale-95 transition-transform"
                        >
                            <div className="w-14 h-14 bg-[#f1f5f9] rounded-full flex items-center justify-center shadow-sm overflow-hidden">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-8 h-8 text-slate-700" })}
                            </div>
                            <span className="text-[11px] text-white drop-shadow-sm truncate w-full text-center px-1 font-normal">{app.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Bottom Area */}
            <div className="flex-shrink-0 p-4 pb-2 z-20">
                {/* Google Search Pill */}
                <div className="bg-[#f1f5f9] rounded-full h-12 flex items-center px-4 shadow-lg mb-6 mx-1">
                    <GoogleG />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-grow bg-transparent border-none outline-none ml-3 text-gray-800 placeholder-gray-500"
                        placeholder="Search..."
                    />
                    <div className="flex space-x-3 pl-2 border-l border-gray-300">
                        <button className="p-1"><MicIcon /></button>
                        <button className="p-1"><LensIcon /></button>
                    </div>
                </div>

                {/* Dock */}
                <div className="flex justify-between px-2 mb-4">
                    {dockApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center active:scale-90 transition-transform"
                        >
                            <div className="w-14 h-14 bg-[#c2e7ff] rounded-full flex items-center justify-center shadow-lg">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-7 h-7 text-[#001d35]" })}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobiLauncher;
