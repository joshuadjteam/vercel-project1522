
import React, { useState, useMemo } from 'react';
import { Page, AppLaunchable } from '../types';

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

interface MobiLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const MobiLauncher: React.FC<MobiLauncherProps> = ({ navigate, appsList }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(0);

    const handleSearch = () => {
        if (searchQuery.trim() !== '') {
            const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
            window.open(url, '_blank');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    // Define pinned apps (Dock)
    const PINNED_APP_IDS = ['app-phone', 'app-chat', 'app-localmail', 'app-contacts'];
    
    const pinnedApps = useMemo(() => 
        PINNED_APP_IDS.map(id => appsList.find(app => app.id === id)).filter(Boolean) as AppLaunchable[],
        [appsList]
    );
    
    // Define grid apps (exclude pinned and hidden)
    const gridApps = useMemo(() =>
        appsList.filter(app => !app.isHidden && !PINNED_APP_IDS.includes(app.id)),
        [appsList]
    );

    const handleAppClick = (app: AppLaunchable) => {
        if (app.isWebApp) {
            navigate('mobi-app-webview', { url: app.url, title: app.label });
        } else {
            navigate(app.page, { ...app.params, appData: app });
        }
    };

    // Pagination logic
    const APPS_PER_PAGE = 20; // 4 columns * 5 rows
    const totalPages = Math.max(1, Math.ceil(gridApps.length / APPS_PER_PAGE));
    const paginatedApps = gridApps.slice(currentPage * APPS_PER_PAGE, (currentPage + 1) * APPS_PER_PAGE);

    return (
        <div className="w-full h-full flex flex-col bg-gradient-to-b from-gray-800 to-gray-900">
            {/* Main content area for app pages */}
            <main className="flex-grow p-4 flex flex-col">
                <div className="flex-grow grid grid-cols-4 grid-rows-5 gap-4 content-start">
                    {paginatedApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center justify-start text-center space-y-1 focus:outline-none"
                            aria-label={app.label}
                        >
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-sm border border-white/10 hover:bg-white/20 transition-colors">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-8 h-8 text-white" })}
                            </div>
                            <span className="text-[10px] font-medium text-white/90 truncate w-full px-1">{app.label}</span>
                        </button>
                    ))}
                </div>
                
                {/* Pagination dots */}
                <div className="h-6 flex justify-center items-center space-x-2 mt-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${currentPage === index ? 'bg-white w-3' : 'bg-white/30'}`}
                            aria-label={`Go to page ${index + 1}`}
                        />
                    ))}
                </div>
            </main>
            
            {/* Bottom Dock */}
            <footer className="flex-shrink-0 p-4 pb-2 bg-white/10 backdrop-blur-xl border-t border-white/5">
                {/* Search Bar */}
                <div className="relative mb-5">
                    <input
                        type="text"
                        placeholder="Search Google..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full bg-black/20 border border-white/10 text-white placeholder-white/40 rounded-full py-2.5 pl-10 pr-10 focus:outline-none focus:bg-black/40 transition-colors text-sm"
                    />
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50 font-bold">G</span>
                    <button 
                        onClick={handleSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                    >
                        <SearchIcon />
                    </button>
                </div>

                {/* Pinned Apps Row */}
                <div className="grid grid-cols-4 gap-4 mb-1">
                    {pinnedApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center justify-center focus:outline-none group"
                            aria-label={app.label}
                        >
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/10 group-hover:bg-white/30 transition-colors">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-8 h-8 text-white" })}
                            </div>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default MobiLauncher;
