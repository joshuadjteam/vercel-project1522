

import React, { useState, useEffect, useRef } from 'react';
import { Page, UserRole, AppLaunchable } from '../types';
import { useTheme, wallpapers } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import HelpModal from '../components/HelpModal';

// --- Icon Components ---
const WebIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>;
const AppsIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ContactIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const HomeIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const SettingsIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066 2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ProfileIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const AdminIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>;
const LightIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DarkIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const SignOutIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SearchIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const YoutubeIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

// A simple clock for the LegaLauncher style
const LegaClock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const timeString = time.toLocaleTimeString('en-US');
    const dateString = time.toLocaleDateString('en-US');

    return (
        <p className="font-mono text-lg tracking-wider">
            {timeString} / {dateString}
        </p>
    );
};

interface LegaLauncherProps {
    navigate: (page: Page, params?: any) => void;
    appsList: AppLaunchable[];
}

const LegaLauncher: React.FC<LegaLauncherProps> = ({ navigate, appsList }) => {
    const { user, logout } = useAuth();
    const { isDark, setIsDark, wallpaper } = useTheme();

    const [webMenuOpen, setWebMenuOpen] = useState(false);
    const [appsMenuOpen, setAppsMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const webMenuRef = useRef<HTMLDivElement>(null);
    const appsMenuRef = useRef<HTMLDivElement>(null);
    const settingsMenuRef = useRef<HTMLDivElement>(null);

    const useClickOutside = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
        useEffect(() => {
            const handleClick = (e: MouseEvent) => {
                if (ref.current && !ref.current.contains(e.target as Node)) {
                    callback();
                }
            };
            document.addEventListener('mousedown', handleClick);
            return () => document.removeEventListener('mousedown', handleClick);
        }, [ref, callback]);
    };

    useClickOutside(webMenuRef, () => setWebMenuOpen(false));
    useClickOutside(appsMenuRef, () => setAppsMenuOpen(false));
    useClickOutside(settingsMenuRef, () => setSettingsMenuOpen(false));
    
    const handleAppClick = (app: AppLaunchable) => {
        if (app.isWebApp && app.url) {
            navigate('app-webview', { url: app.url, title: app.label, isWebApp: true });
        } else {
            navigate(app.page, app.params);
        }
        setAppsMenuOpen(false);
    };

    const handleSignOut = () => {
        logout();
        setSettingsMenuOpen(false);
        navigate('home');
    };

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

    const NavButton: React.FC<{ onClick?: () => void, text: string, icon: React.ReactNode }> = ({ onClick, text, icon }) => (
        <button onClick={onClick} className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 text-gray-300 hover:bg-white/20 hover:text-white">
            {icon}
            <span>{text}</span>
        </button>
    );

    const DropdownButton: React.FC<{ onClick: () => void, text: string, icon?: React.ReactNode }> = ({ onClick, text, icon }) => (
        <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-slate-700 flex items-center space-x-3">
            {icon && React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5"})}
            <span>{text}</span>
        </button>
    );

    return (
        <div className={`w-screen h-screen overflow-hidden flex flex-col font-sans text-white ${(wallpapers[wallpaper] || wallpapers.canyon).class}`}>
            {/* Header */}
            <header className="w-full bg-slate-900/50 backdrop-blur-sm text-white shadow-lg z-50 flex-shrink-0">
                <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('home')}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="11" fill="#4A5568"/>
                            <path d="M15.9042 7.15271C14.4682 6.42517 12.8251 6 11.0625 6C7.16117 6 4 9.13401 4 13C4 16.866 7.16117 20 11.0625 20C12.8251 20 14.4682 19.5748 15.9042 18.8473" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M8.09583 16.8473C9.53181 17.5748 11.1749 18 12.9375 18C16.8388 18 20 14.866 20 11C20 7.13401 16.8388 4 12.9375 4C11.1749 4 9.53181 4.42517 8.09583 5.15271" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        <span className="text-2xl font-bold text-white">Lynix</span>
                    </div>
                    <nav className="flex items-center space-x-1">
                        <div className="relative" ref={webMenuRef}>
                            <NavButton onClick={() => setWebMenuOpen(p => !p)} text="Web" icon={<WebIcon />} />
                            {webMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-xl py-2 z-20 animate-fade-in-up">
                                    <DropdownButton onClick={() => window.open('https://darshanjoshuakesavaruban.fwscheckout.com/', '_blank')} text="Buy a Product" />
                                    <DropdownButton onClick={() => window.open('https://sites.google.com/gcp.lynixity.x10.bz/myportal/home', '_blank')} text="MyPortal" />
                                </div>
                            )}
                        </div>
                        <div className="relative" ref={appsMenuRef}>
                            <NavButton onClick={() => setAppsMenuOpen(p => !p)} text="Apps" icon={<AppsIcon />} />
                            {appsMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-64 max-h-96 overflow-y-auto bg-slate-800/90 backdrop-blur-md rounded-lg shadow-xl py-2 z-20 animate-fade-in-up">
                                    {appsList.filter(a => !a.isHidden).map(app => (
                                        <DropdownButton key={app.id} onClick={() => handleAppClick(app)} text={app.label} icon={app.icon} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <NavButton onClick={() => navigate('contact')} text="Contact" icon={<ContactIcon />} />
                        <NavButton onClick={() => navigate('home')} text="Home" icon={<HomeIcon />} />
                        <div className="relative" ref={settingsMenuRef}>
                            <NavButton onClick={() => setSettingsMenuOpen(p => !p)} text="Settings" icon={<SettingsIcon />} />
                            {settingsMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800/90 backdrop-blur-md rounded-lg shadow-xl py-2 z-20 animate-fade-in-up">
                                    <DropdownButton onClick={() => { navigate('profile'); setSettingsMenuOpen(false); }} icon={<ProfileIcon />} text={`Profile (${user?.username})`} />
                                    {user?.role === UserRole.Admin && <DropdownButton onClick={() => { navigate('admin'); setSettingsMenuOpen(false); }} icon={<AdminIcon />} text="Admin Portal" />}
                                    <DropdownButton onClick={() => setIsDark(!isDark)} icon={isDark ? <LightIcon /> : <DarkIcon />} text={`Theme: ${isDark ? "Dark" : "Light"}`} />
                                    <div className="border-t border-slate-700 my-1"></div>
                                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/50 flex items-center space-x-3">
                                        <SignOutIcon />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex flex-col items-center justify-center p-4">
                 <div className="relative w-full max-w-xl mb-8">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold">G</span>
                    <input 
                        type="text" 
                        placeholder="Search with Google..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="w-full bg-slate-800/80 border border-slate-600 text-white rounded-full py-3 pl-10 pr-32 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                    <button 
                        onClick={handleSearch}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
                    >
                        <SearchIcon />
                        <span>Search</span>
                    </button>
                </div>
                <div className="w-full max-w-4xl p-8 text-center bg-black/30 backdrop-blur-md rounded-2xl border border-white/20">
                    <h1 className="text-4xl font-bold mb-4">Welcome to Lynix by DJTeam!</h1>
                    <p className="text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        Welcome to Lynix, where innovation in technology and coding comes to life. Since our inception in January 2024, we've been dedicated to pushing the boundaries of web development. We launched our first suite of products in July 2024 and began sharing our journey on our YouTube channel '@DarCodR'. Today, our primary mission remains rooted in creating powerful coding solutions, while expanding our services to include reliable email support, crystal-clear SIP Voice communication, and more. Explore what we have to offer.
                    </p>
                    <div className="mt-8">
                        <LegaClock />
                    </div>
                </div>
            </main>
            
            {/* Footer */}
            <footer className="w-full bg-slate-900/50 backdrop-blur-sm text-gray-400 text-sm py-3 flex-shrink-0">
                <div className="container mx-auto px-4 flex justify-center items-center space-x-4">
                    <p>&copy; 2025 Lynix Technology and Coding. All Rights Reserved.</p>
                    <div className="w-px h-4 bg-gray-600"></div>
                     <a href="https://www.youtube.com/@DarCodR" target="_blank" rel="noopener noreferrer" className="hover:text-red-500 font-semibold transition-colors flex items-center space-x-1">
                        <YoutubeIcon />
                        <span>YouTube</span>
                    </a>
                </div>
            </footer>
            
            {/* Help Button */}
            <div className="fixed bottom-5 right-5 z-50">
                <button onClick={() => setHelpModalOpen(true)} className="w-14 h-14 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors shadow-lg" aria-label="Help and Support">
                    <HelpIcon />
                </button>
            </div>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </div>
    );
};

export default LegaLauncher;