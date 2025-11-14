
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Page, AppLaunchable } from '../types';
import { useAuth } from '../hooks/useAuth';
import HomePage from './HomePage';
import HelpModal from '../components/HelpModal';

const GridIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


interface LegaLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const LegaLauncher: React.FC<LegaLauncherProps> = ({ navigate, appsList }) => {
    const { logout } = useAuth();
    const [appsMenuOpen, setAppsMenuOpen] = useState(false);
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const appsMenuRef = useRef<HTMLDivElement>(null);
    
    const ALL_APPS = useMemo(() => appsList.filter(app => !app.isHidden), [appsList]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (appsMenuRef.current && !appsMenuRef.current.contains(event.target as Node)) {
                setAppsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAppClick = (app: AppLaunchable) => {
        navigate(app.page, { navigate, ...app.params });
        setAppsMenuOpen(false);
    };
    
    const handleSignOut = () => {
        logout();
        navigate('home');
    }

    return (
        <div className="w-screen h-screen overflow-hidden bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500">
            {/* Background Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                 <HomePage />
            </div>

            {/* Top Bar */}
            <div className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-4 bg-white/30 dark:bg-gray-900/50 backdrop-blur-sm text-light-text dark:text-white shadow-md">
                 <div className="flex items-center space-x-3">
                    <svg width="32" height="32" viewBox="0 0 135 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459H54.707L78.7744 0.853516H39.7627Z" fill="#1155cc"/>
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H54.707L78.7744 0.853516H39.7627Z" fill="#6fa8dc"/>
                        <path d="M79.9482 64.459H54.707L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459Z" fill="#0b5394"/>
                    </svg>
                    <span className="text-2xl font-bold">Lynix</span>
                </div>
                
                <div className="flex items-center space-x-4">
                     <div className="relative" ref={appsMenuRef}>
                        <button onClick={() => setAppsMenuOpen(p => !p)} className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                            <GridIcon className="w-5 h-5"/>
                            <span className="font-semibold">Apps</span>
                        </button>
                        {appsMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto bg-light-card dark:bg-slate-800 rounded-xl shadow-lg p-4 animate-fade-in-up">
                                 <div className="grid grid-cols-3 gap-4">
                                    {ALL_APPS.map(app => (
                                        <button key={app.id} onClick={() => handleAppClick(app)} className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors space-y-2 text-center">
                                            {React.cloneElement(app.icon as React.ReactElement, { className: "w-10 h-10" })}
                                            <span className="text-xs font-medium">{app.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => navigate('profile')} className="px-3 py-2 text-sm font-medium rounded-md hover:bg-black/10 dark:hover:bg-white/20 transition-colors">Profile</button>
                    <button onClick={handleSignOut} className="px-3 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white transition-colors">Sign Out</button>
                </div>
            </div>
             <div className="fixed bottom-5 right-5 z-50">
                <button 
                    onClick={() => setHelpModalOpen(true)} 
                    className="w-14 h-14 bg-indigo-600 dark:bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-lg group"
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
