


import React, { useState } from 'react';
import { Page, AppLaunchable } from '../types';
import { useAuth } from '../hooks/useAuth';
import HelpModal from '../components/HelpModal';

const wallpapers: Record<string, { name: string, class: string }> = {
    canyon: { name: 'Canyon', class: 'bg-gradient-to-br from-[#23304e] via-[#e97451] to-[#f4a261]' },
    sky: { name: 'Sky', class: 'bg-gradient-to-br from-sky-400 to-blue-600' },
    sunset: { name: 'Sunset', class: 'bg-gradient-to-br from-yellow-400 via-red-500 to-pink-600' },
    forest: { name: 'Forest', class: 'bg-gradient-to-br from-green-500 to-teal-700' },
    night: { name: 'Night', class: 'bg-gradient-to-br from-gray-800 to-slate-900' },
};

const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

interface LegaLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const LegaLauncher: React.FC<LegaLauncherProps> = ({ navigate, appsList }) => {
    const { user, logout } = useAuth();
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    
    // For LegaLauncher, a simple, fixed wallpaper seems appropriate.
    const wallpaperClass = wallpapers['canyon'].class;

    const handleAppClick = (app: AppLaunchable) => {
        navigate(app.page, { navigate, ...app.params });
    };

    return (
        <div className={`w-screen h-screen overflow-hidden ${wallpaperClass} text-white`}>
            {/* Simple Top Bar */}
            <header className="fixed top-0 left-0 right-0 h-12 flex items-center justify-between px-4 bg-black/20 backdrop-blur-sm">
                <div className="text-lg font-bold">LegaLauncher</div>
                <div className="flex items-center space-x-4">
                    <span>Welcome, {user?.username}</span>
                    <button onClick={() => navigate('profile')} className="px-3 py-1 text-sm rounded-md hover:bg-white/20">Profile</button>
                    <button onClick={() => { logout(); navigate('home'); }} className="px-3 py-1 text-sm rounded-md hover:bg-white/20 bg-red-500/50">Sign Out</button>
                </div>
            </header>

            {/* Desktop Area for Icons */}
            <div className="pt-16 p-4">
                <div className="grid grid-cols-10 gap-4">
                    {appsList.filter(app => !app.isHidden).map(app => (
                         <button key={app.id} onClick={() => handleAppClick(app)} className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-white/10 transition-colors space-y-2 text-center w-24 h-24">
                            {/* FIX: Cast app.icon to React.ReactElement<any> to allow cloning with a className prop. */}
                            {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-12 h-12" })}
                            <span className="text-sm font-medium" style={{textShadow: '1px 1px 2px rgba(0,0,0,0.8)'}}>{app.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="fixed bottom-5 right-5 z-50">
                <button 
                    onClick={() => setHelpModalOpen(true)} 
                    className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-lg"
                    aria-label="Help and Support"
                >
                    <HelpIcon />
                </button>
            </div>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </div>
    );
};

export default LegaLauncher;