
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page, UserRole } from '../types';
import { HomeIcon, InformationCircleIcon, SunIcon, MoonIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightEndOnRectangleIcon, ArrowLeftStartOnRectangleIcon, Squares2X2Icon, GlobeAltIcon } from '@heroicons/react/24/solid';


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


    const NavButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode, isActive?: boolean, isIconStyle?: boolean }> = ({ onClick, text, icon, isActive, isIconStyle }) => (
        <button
            onClick={onClick}
            title={text}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'} ${isIconStyle ? 'aspect-square p-2 !space-x-0' : ''}`}
        >
            {icon}
            {!isIconStyle && <span>{text}</span>}
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
                        <NavButton onClick={() => setWebMenuOpen(!webMenuOpen)} text="Web" icon={<GlobeAltIcon className="h-5 w-5"/>} />
                        {webMenuOpen && (
                             <div className="absolute top-full mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
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
                            <NavButton onClick={() => setAppsMenuOpen(!appsMenuOpen)} text="Apps" icon={<Squares2X2Icon className="h-5 w-5"/>}/>
                            {appsMenuOpen && (
                                <div className="absolute top-full mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
                                    <button onClick={() => { navigate('app-phone'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Phone</button>
                                    <button onClick={() => { navigate('app-chat'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Chat</button>
                                    <button onClick={() => { navigate('app-localmail'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">LocalMail</button>
                                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                                    <button onClick={() => { navigate('app-contacts'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Contacts</button>
                                    <button onClick={() => { navigate('app-notepad'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Notepad</button>
                                    <button onClick={() => { navigate('app-calculator'); setAppsMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">Calculator</button>
                                </div>
                            )}
                        </div>
                     )}
                    <NavButton onClick={() => navigate('contact')} text="Contact" icon={<InformationCircleIcon className="h-5 w-5"/>} />
                    <NavButton onClick={() => navigate('home')} text="Home" icon={<HomeIcon className="h-5 w-5"/>} />
                   
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                    <NavButton onClick={() => setIsDark(!isDark)} text={isDark ? "Light" : "Dark"} icon={isDark ? <SunIcon className="h-5 w-5"/> : <MoonIcon className="h-5 w-5"/>} isIconStyle />

                    {isLoggedIn && user?.role === UserRole.Admin && (
                        <NavButton onClick={() => navigate('admin')} text="Admin" icon={<Cog6ToothIcon className="h-5 w-5"/>} isIconStyle />
                    )}
                     {isLoggedIn && (
                        <NavButton onClick={() => navigate('profile')} text="Profile" icon={<UserCircleIcon className="h-5 w-5"/>} isIconStyle />
                    )}
                    
                    {isLoggedIn ? (
                        <button onClick={handleSignOut} title="Sign Out" className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600 text-white hover:bg-red-700 flex items-center space-x-2">
                           <ArrowLeftStartOnRectangleIcon className="h-5 w-5"/>
                           <span>Sign Out</span>
                        </button>
                    ) : (
                        <button onClick={() => navigate('signin')} title="Sign On" className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700 flex items-center space-x-2">
                            <ArrowRightEndOnRectangleIcon className="h-5 w-5"/>
                            <span>Sign On</span>
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;