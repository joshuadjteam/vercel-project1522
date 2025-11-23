
import React, { useState, useMemo, useEffect } from 'react';
import { Page, AppLaunchable } from '../types';
import { useTheme, wallpapers } from '../hooks/useTheme';

// Icons
const GoogleG = () => <svg viewBox="0 0 24 24" className="w-6 h-6"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.6v3.1h3.92c2.28-2.1 3.6-5.2 3.6-8.94z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.92-2.91l-3.91-3.1c-1.08.72-2.45 1.16-4 1.16-3.13 0-5.78-2.11-6.73-4.96H1.5v3.1C3.47 21.11 7.6 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.19c-.25-.74-.39-1.53-.39-2.35 0-.82.14-1.61.38-2.35V6.39H1.5A11.99 11.99 0 0 0 0 11.84c0 1.98.47 3.89 1.35 5.59l4.175-3.24z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.2 1.19 15.49 0 12.255 0 7.6 0 3.47 2.89 1.5 6.39l4.02 3.12c.96-2.85 3.61-4.96 6.74-4.96z"/></svg>;
const LensIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9a5 5 0 0 1 5-5 1 1 0 0 1 1 1 1 1 0 0 0 2 0 1 1 0 0 1 1 1 5 5 0 0 1-5 5 1 1 0 0 1-1 1 1 1 0 0 0-2 0 1 1 0 0 1-1-1z"/></svg>;
const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>;

// Specific Icons for Dock to match screenshot
const PhoneIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full p-3 text-[#004a77]" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>;
const MessageIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full p-3 text-[#004a77]" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>;
const PlayStoreIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full p-3" fill="none"><path d="M5 20.573V3.427c0-1.1.9-1.5 1.5-.9l14 9c.6.6.6 1.5 0 2.1l-14 9c-.6.6-1.5.2-1.5-.9z" fill="#00d9ff" fillOpacity="0.1"/><path d="M5.9 3.7L18.2 11.2 19.2 12 5.9 20.3V3.7z" fill="#fff"/><path d="M19.2 12L5.9 3.7v16.6L19.2 12z" fill="#fff"/><path d="M5 3.4L11.8 12 5 20.6V3.4z" fill="#00F076"/><path d="M11.8 12L19.2 7.5 15.5 16.7 11.8 12z" fill="#FF3D00"/><path d="M11.8 12L5 20.6 15.5 7.3 11.8 12z" fill="#2962FF"/><path d="M19.2 12L19.2 12 15.5 7.3 11.8 12 19.2 12z" fill="#FFD600"/></svg>;
const ChromeIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full p-2"><circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 5.5L9.5 10h5l-2.5-4.5z" fill="#EA4335"/><path d="M12 5.5L14.5 10 20.5 10A8.5 8.5 0 0 0 12 3.5v2z" fill="#EA4335"/><path d="M12 5.5v4.5H7.5L5 10A8.5 8.5 0 0 0 3.5 12h8.5z" fill="#FBBC05"/><path d="M12 18.5v-4.5h4.5l2.5-4.5A8.5 8.5 0 0 1 20.5 12h-8.5z" fill="#34A853"/><circle cx="12" cy="12" r="3.5" fill="#4285F4"/></svg>;
const CameraIcon = () => <svg viewBox="0 0 24 24" className="w-full h-full p-3 text-[#004a77]" fill="currentColor"><circle cx="12" cy="12" r="3.2"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>;

interface MobiLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const MobiLauncher: React.FC<MobiLauncherProps> = ({ navigate, appsList }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [date, setDate] = useState(new Date());
    const { wallpaper } = useTheme();

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

    const dockItems = [
        { id: 'app-phone', icon: <PhoneIcon />, bg: 'bg-[#C2E7FF]' },
        { id: 'app-chat', icon: <MessageIcon />, bg: 'bg-[#C2E7FF]' },
        { id: 'app-webly-store', icon: <PlayStoreIcon />, bg: 'bg-white' }, 
        { id: 'app-browser', icon: <ChromeIcon />, bg: 'bg-transparent' }, 
        { id: 'app-camera', icon: <CameraIcon />, bg: 'bg-[#C2E7FF]' }
    ];

    const handleAppClick = (appId: string) => {
        const app = appsList.find(a => a.id === appId);
        if (app) {
            if (app.isWebApp) {
                navigate('mobi-app-webview', { url: app.url, title: app.label, appData: app });
            } else {
                navigate(app.page, { appData: app });
            }
        }
    };

    const gridApps = useMemo(() =>
        appsList.filter(app => !app.isHidden && !['app-phone', 'app-chat', 'app-webly-store', 'app-browser', 'app-camera'].includes(app.id)),
        [appsList]
    );

    // Use the global theme wallpaper if set, otherwise default
    const bgClass = wallpaper ? "" : "bg-gradient-to-b from-[#4A6C8C] via-[#2C4763] to-[#1F364D]";

    return (
        <div 
            className={`w-full h-full flex flex-col relative overflow-hidden font-sans text-white ${bgClass}`}
            style={wallpaper ? {} : { background: 'linear-gradient(180deg, #4A6C8C 0%, #2C4763 40%, #1F364D 100%)' }}
        >
            {wallpaper && <div className={`absolute inset-0 ${wallpapers[wallpaper]?.class || 'bg-gray-800'} -z-10 opacity-100`} />}

            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto p-4 pb-36 no-scrollbar pt-20">
                {/* At a Glance */}
                <div className="px-2 mb-8">
                    <div className="text-5xl font-normal opacity-90">
                        {date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-sm opacity-80 mt-1 font-medium tracking-wide">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>

                {/* App Grid */}
                <div className="grid grid-cols-4 gap-y-8 gap-x-4 justify-items-center">
                    {gridApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => {
                                if (app.isWebApp) navigate('mobi-app-webview', { url: app.url, title: app.label, appData: app });
                                else navigate(app.page, { ...app.params, appData: app });
                            }}
                            className="flex flex-col items-center space-y-2 active:opacity-70 transition-opacity w-16 group"
                        >
                            <div className="w-14 h-14 bg-[#F1F5F9] rounded-full flex items-center justify-center shadow-md overflow-hidden group-active:scale-90 transition-transform">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-8 h-8 text-[#4A6C8C]" })}
                            </div>
                            <span className="text-xs text-white drop-shadow-md truncate w-full text-center font-normal tracking-wide">{app.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Fixed Bottom Area */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-2 z-30 bg-gradient-to-t from-black/20 to-transparent">
                {/* Dock Icons */}
                <div className="flex justify-between items-center px-2 mb-6">
                    {dockItems.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => handleAppClick(item.id)}
                            className="flex flex-col items-center active:scale-95 transition-transform"
                        >
                            <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center shadow-lg overflow-hidden`}>
                                {item.icon}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="bg-[#F1F5F9] rounded-full h-12 flex items-center px-4 shadow-lg mx-1 mb-2">
                    <GoogleG />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-grow bg-transparent border-none outline-none ml-3 text-gray-800 placeholder-gray-500 text-base"
                        placeholder="Search..."
                    />
                    <div className="flex space-x-4 pl-2">
                        <button className="p-1"><MicIcon /></button>
                        <button className="p-1"><LensIcon /></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobiLauncher;
