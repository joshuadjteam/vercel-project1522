
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Page, UserRole } from '../types';

// Icon components
const WebIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>;
const ContactIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const LightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const DarkIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008h-.008v-.008z" /></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SignOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const SignInIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m4 6H4" /></svg>;

const useIsMobile = (breakpoint = 768) => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < breakpoint);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [breakpoint]);

    return isMobile;
};

interface HeaderProps {
    navigate: (page: Page, params?: any) => void;
}

const Header: React.FC<HeaderProps> = ({ navigate }) => {
    const { isLoggedIn, user, logout } = useAuth();
    const { isDark, setIsDark } = useTheme();
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const isMobile = useIsMobile();

    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const mobileToggleRef = useRef<HTMLButtonElement>(null);

    const handleSignOut = () => {
        logout();
        setMobileMenuOpen(false);
        setSettingsMenuOpen(false);
        navigate('home');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setSettingsMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node) && !mobileToggleRef.current?.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const NavButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode, isActive?: boolean }> = ({ onClick, text, icon, isActive }) => (
        <button
            onClick={onClick}
            title={text}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-white/20 hover:text-white'}`}
        >
            {icon}
            <span className="hidden sm:inline">{text}</span>
        </button>
    );
    
    const DropdownButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode }> = ({ onClick, text, icon }) => (
        <button onClick={onClick} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-3">
            {icon}
            <span>{text}</span>
        </button>
    );

    const renderDesktopNav = () => (
        <div className="flex items-center space-x-2">
            <NavButton onClick={() => navigate('contact')} text="Contact" icon={<ContactIcon />} />
            <NavButton onClick={() => navigate('home')} text={isLoggedIn ? "Console" : "Home"} icon={<HomeIcon />} />
           
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

            {isLoggedIn ? (
                <div className="relative" ref={settingsMenuRef}>
                    <NavButton onClick={() => setSettingsMenuOpen(!settingsMenuOpen)} text="Settings" icon={<SettingsIcon />} />
                    {settingsMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2 z-20">
                             <DropdownButton onClick={() => { navigate('profile'); setSettingsMenuOpen(false); }} icon={<ProfileIcon />} text={`Profile (${user?.username})`} />
                             {user?.role === UserRole.Admin && (
                                <DropdownButton onClick={() => { navigate('admin'); setSettingsMenuOpen(false); }} icon={<AdminIcon />} text="Admin Portal" />
                            )}
                            <DropdownButton onClick={() => setIsDark(!isDark)} icon={isDark ? <LightIcon /> : <DarkIcon />} text={`Theme: ${isDark ? "Dark" : "Light"}`} />
                            <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                             <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 flex items-center space-x-3">
                                <SignOutIcon />
                                <span>Sign Out</span>
                             </button>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={() => navigate('signin')} title="Sign On" className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2">
                    <SignInIcon />
                    <span className="hidden sm:inline">Sign On</span>
                </button>
            )}
        </div>
    );

    const renderMobileNav = () => (
        <div className="relative">
            <button ref={mobileToggleRef} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/20">
                <MenuIcon />
            </button>
            {mobileMenuOpen && (
                <div ref={mobileMenuRef} className="absolute top-full right-0 mt-2 w-64 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2 z-50 max-h-[90vh] overflow-y-auto">
                    <DropdownButton onClick={() => { navigate('home'); setMobileMenuOpen(false); }} icon={<HomeIcon />} text={isLoggedIn ? "Console" : "Home"} />
                    <DropdownButton onClick={() => { navigate('contact'); setMobileMenuOpen(false); }} icon={<ContactIcon />} text="Contact" />
                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                    
                    {isLoggedIn && (
                        <>
                            <h3 className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-500">Account</h3>
                            <DropdownButton onClick={() => { navigate('profile'); setMobileMenuOpen(false); }} icon={<ProfileIcon />} text="Profile" />
                            {user?.role === UserRole.Admin && <DropdownButton onClick={() => { navigate('admin'); setMobileMenuOpen(false); }} icon={<AdminIcon />} text="Admin" />}
                            <DropdownButton onClick={() => { setIsDark(!isDark); setMobileMenuOpen(false); }} icon={isDark ? <LightIcon /> : <DarkIcon />} text={`Theme: ${isDark ? "Dark" : "Light"}`} />
                            <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                        </>
                    )}

                    <div className="p-2">
                    {isLoggedIn ? (
                        <button onClick={handleSignOut} className="w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center space-x-2">
                           <SignOutIcon />
                           <span>Sign Out</span>
                        </button>
                    ) : (
                        <button onClick={() => { navigate('signin'); setMobileMenuOpen(false); }} className="w-full px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center justify-center space-x-2">
                            <SignInIcon />
                            <span>Sign On</span>
                        </button>
                    )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <header className="w-full bg-[#0F2830] text-white shadow-lg z-50">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('home')}>
                    <svg width="32" height="32" viewBox="0 0 135 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459H54.707L78.7744 0.853516H39.7627Z" fill="#1155cc"/>
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H54.707L78.7744 0.853516H39.7627Z" fill="#6fa8dc"/>
                        <path d="M79.9482 64.459H54.707L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459Z" fill="#0b5394"/>
                    </svg>
                    <span className="text-2xl font-bold text-white">Lynix</span>
                </div>
                {isMobile ? renderMobileNav() : renderDesktopNav()}
            </div>
        </header>
    );
};

export default Header;