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

    const PINNED_APP_IDS = ['app-phone', 'app-chat', 'app-localmail', 'app-contacts'];
    
    const pinnedApps = useMemo(() => 
        PINNED_APP_IDS.map(id => appsList.find(app => app.id === id)).filter(Boolean) as AppLaunchable[],
        [appsList]
    );
    
    const otherApps = useMemo(() =>
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

    const APPS_PER_PAGE = 20; // 5 rows of 4 apps
    const totalPages = Math.ceil(otherApps.length / APPS_PER_PAGE);
    const paginatedApps = otherApps.slice(currentPage * APPS_PER_PAGE, (currentPage + 1) * APPS_PER_PAGE);

    return (
        <div className="w-full h-full flex flex-col">
            {/* Main content area for app pages */}
            <main className="flex-grow p-4 overflow-y-auto">
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                    {paginatedApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center justify-start p-1 text-center space-y-2 focus:outline-none focus:bg-white/10 rounded-lg"
                            aria-label={app.label}
                        >
                            <div className="w-16 h-16 bg-black/20 rounded-2xl flex items-center justify-center">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-10 h-10 text-white" })}
                            </div>
                            <span className="text-xs font-medium text-white/90 truncate w-full">{app.label}</span>
                        </button>
                    ))}
                </div>
            </main>

            {/* Pagination dots */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-2 py-2">
                    {Array.from({ length: totalPages }).map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentPage(index)}
                            className={`w-2 h-2 rounded-full transition-colors ${currentPage === index ? 'bg-white' : 'bg-white/40'}`}
                            aria-label={`Go to page ${index + 1}`}
                        />
                    ))}
                </div>
            )}
            
            {/* Bottom Dock */}
            <footer className="flex-shrink-0 p-4 pt-2 bg-black/20 backdrop-blur-sm border-t border-white/10">
                {/* Search Bar */}
                <div className="relative mb-4">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full bg-white/10 dark:bg-black/20 border-none text-light-text dark:text-white rounded-full py-2.5 pl-5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button 
                        onClick={handleSearch}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70"
                    >
                        <SearchIcon />
                    </button>
                </div>

                {/* Pinned Apps */}
                <div className="grid grid-cols-4 gap-4">
                    {pinnedApps.map(app => (
                        <button 
                            key={app.id} 
                            onClick={() => handleAppClick(app)}
                            className="flex flex-col items-center justify-start text-center space-y-2 focus:outline-none focus:bg-white/10 rounded-lg"
                            aria-label={app.label}
                        >
                            <div className="w-16 h-16 bg-black/30 rounded-2xl flex items-center justify-center shadow-md">
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-10 h-10 text-white" })}
                            </div>
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
};

export default MobiLauncher;