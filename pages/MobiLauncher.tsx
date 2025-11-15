





import React, { useState, useMemo } from 'react';
import { Page, AppLaunchable } from '../types';

interface MobiLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const APPS_PER_PAGE = 12; // 3x4 grid

const MobiLauncher: React.FC<MobiLauncherProps> = ({ navigate, appsList }) => {
    const [currentPage, setCurrentPage] = useState(0);

    const ALL_APPS = useMemo(() => appsList.filter(app => !app.isHidden), [appsList]);
    const pageCount = Math.ceil(ALL_APPS.length / APPS_PER_PAGE);

    const paginatedApps = useMemo(() => {
        const start = currentPage * APPS_PER_PAGE;
        const end = start + APPS_PER_PAGE;
        return ALL_APPS.slice(start, end);
    }, [ALL_APPS, currentPage]);

    const handleAppClick = (app: AppLaunchable) => {
        navigate(app.page, app.params);
    };

    return (
        <div className="w-full h-full flex flex-col">
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
                                {/* FIX: Cast app.icon to React.ReactElement<any> to allow cloning with a className prop. */}
                                {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-10 h-10" })}
                            </div>
                            <span className="text-xs font-medium text-white/90 truncate w-full">{app.label}</span>
                        </button>
                    ))}
                </div>
            </main>
            
            {pageCount > 1 && (
                <div className="flex-shrink-0 flex justify-center items-center py-2 space-x-2">
                    {Array.from({ length: pageCount }).map((_, i) => (
                        <button 
                            key={i} 
                            onClick={() => setCurrentPage(i)} 
                            className={`w-2.5 h-2.5 rounded-full transition-colors ${currentPage === i ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                            aria-label={`Go to page ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default MobiLauncher;