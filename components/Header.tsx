import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page, UserRole } from '../types';

// Icon components
const WebIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>;
const AppsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ContactIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const LightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SignInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ContactsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 14.354a4 4 0 110-5.292" /></svg>;
const NotepadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6M5 5h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" /></svg>;
const PaintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4Zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343a2 2 0 01-1.414-.586l-2.828-2.828a2 2 0 00-1.414-.586H7M9 11h2" /></svg>;


interface HeaderProps {
    navigate: (page: Page) => void;
    isDark: boolean;
    setIsDark: (isDark: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ navigate, isDark, setIsDark }) => {
    const { isLoggedIn, user, logout } = useAuth();
    const [appsMenuOpen, setAppsMenuOpen] = useState(false);
    const [webMenuOpen, setWebMenuOpen] = useState(false);

    const appsMenuRef = useRef<HTMLDivElement>(null);
    const webMenuRef = useRef<HTMLDivElement>(null);

    const handleSignOut = () => {
        logout();
        navigate('home');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (appsMenuRef.current && !appsMenuRef.current.contains(event.target as Node)) {
                setAppsMenuOpen(false);
            }
            if (webMenuRef.current && !webMenuRef.current.contains(event.target as Node)) {
                setWebMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const NavButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode, isActive?: boolean }> = ({ onClick, text, icon, isActive }) => (
        <button
            onClick={onClick}
            title={text}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'}`}
        >
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </button>
    );
    
    const AppDropdownButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode }> = ({ onClick, text, icon }) => (
        <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-3">
            {icon}
            <span>{text}</span>
        </button>
    );

    return (
        <header className="w-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm text-light-text dark:text-dark-text shadow-lg z-50">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('home')}>
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    <span className="text-xl font-bold">Lynix</span>
                </div>
                <div className="flex items-center space-x-2">
                    {/* Web Menu */}
                    <div className="relative" ref={webMenuRef}>
                        <NavButton onClick={() => setWebMenuOpen(!webMenuOpen)} text="Web" icon={<WebIcon />} />
                        {webMenuOpen && (
                             <div className="absolute top-full right-0 mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
                                <a href="https://darshanjoshuakesavaruban.fwscheckout.com/" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">
                                    Buy a Product
                                </a>
                                <a href="https://sites.google.com/gcp.lynixity.x10.bz/myportal/home" target="_blank" rel="noopener noreferrer" className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">
                                    MyPortal
                                </a>
                             </div>
                        )}
                    </div>

                    {/* Apps Menu */}
                     {isLoggedIn && (
                         <div className="relative" ref={appsMenuRef}>
                            <NavButton onClick={() => setAppsMenuOpen(!appsMenuOpen)} text="Apps" icon={<AppsIcon />} />
                            {appsMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
                                    <AppDropdownButton onClick={() => { navigate('app-phone'); setAppsMenuOpen(false); }} icon={<PhoneIcon />} text="Phone" />
                                    <AppDropdownButton onClick={() => { navigate('app-chat'); setAppsMenuOpen(false); }} icon={<ChatIcon />} text="Chat" />
                                    <AppDropdownButton onClick={() => { navigate('app-localmail'); setAppsMenuOpen(false); }} icon={<MailIcon />} text="LocalMail" />
                                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                                    <AppDropdownButton onClick={() => { navigate('app-contacts'); setAppsMenuOpen(false); }} icon={<ContactsIcon />} text="Contacts" />
                                    <AppDropdownButton onClick={() => { navigate('app-notepad'); setAppsMenuOpen(false); }} icon={<NotepadIcon />} text="Notepad" />
                                    <AppDropdownButton onClick={() => { navigate('app-calculator'); setAppsMenuOpen(false); }} icon={<CalculatorIcon />} text="Calculator" />
                                    <AppDropdownButton onClick={() => { navigate('app-paint'); setAppsMenuOpen(false); }} icon={<PaintIcon />} text="Paint" />
                                </div>
                            )}
                        </div>
                     )}
                    <NavButton onClick={() => navigate('contact')} text="Contact" icon={<ContactIcon />} />
                    <NavButton onClick={() => navigate('home')} text="Home" icon={<HomeIcon />} />
                   
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                    <NavButton onClick={() => setIsDark(!isDark)} text={isDark ? "Light" : "Dark"} icon={isDark ? <LightIcon /> : <DarkIcon />} />

                    {isLoggedIn && user?.role === UserRole.Admin && (
                        <NavButton onClick={() => navigate('admin')} text="Admin" icon={<AdminIcon />} />
                    )}
                     {isLoggedIn && (
                        <NavButton onClick={() => navigate('profile')} text="Profile" icon={<ProfileIcon />} />
                    )}
                    
                    {isLoggedIn ? (
                        <button onClick={handleSignOut} title="Sign Out" className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2">
                           <SignOutIcon />
                           <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    ) : (
                        <button onClick={() => navigate('signin')} title="Sign On" className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2">
                            <SignInIcon />
                            <span className="hidden sm:inline">Sign On</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;