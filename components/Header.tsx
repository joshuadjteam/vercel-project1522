
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page, UserRole } from '../types';
import { GlobeAltIcon, Squares2X2Icon, PhoneIcon, ChatBubbleLeftRightIcon, EnvelopeIcon, UserGroupIcon, PencilIcon, CalculatorIcon, SunIcon, MoonIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, UserCircleIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';


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


    const NavButton: React.FC<{ onClick: () => void, text: string, isActive?: boolean }> = ({ onClick, text, isActive }) => (
        <button
            onClick={onClick}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 hover:text-gray-900 dark:hover:text-white'}`}
        >
            {text}
        </button>
    );

    const IconNavButton: React.FC<{ onClick: () => void, children: React.ReactNode, tooltip: string }> = ({ onClick, children, tooltip }) => (
        <div className="relative group flex items-center">
            <button
                onClick={onClick}
                className="p-2 text-gray-700 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/20 rounded-full transition-colors duration-200"
            >
                {children}
            </button>
            <div className="absolute top-full mt-2 hidden group-hover:block bg-light-text dark:bg-dark-card text-light-card dark:text-dark-text text-xs rounded py-1 px-2">
                {tooltip}
            </div>
        </div>
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
                        <NavButton onClick={() => setWebMenuOpen(!webMenuOpen)} text="Web"/>
                        {webMenuOpen && (
                             <div className="absolute top-full mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
                                <a href="https://darshanjoshuakesavaruban.fwscheckout.com/" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <BuildingStorefrontIcon className="w-5 h-5 mr-3"/> Buy a Product
                                </a>
                                <a href="https://sites.google.com/gcp.lynixity.x10.bz/myportal/home" target="_blank" rel="noopener noreferrer" className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700">
                                    <GlobeAltIcon className="w-5 h-5 mr-3"/> MyPortal
                                </a>
                             </div>
                        )}
                    </div>

                    {/* Apps Menu */}
                     {isLoggedIn && (
                         <div className="relative" ref={appsMenuRef}>
                            <NavButton onClick={() => setAppsMenuOpen(!appsMenuOpen)} text="Apps" />
                            {appsMenuOpen && (
                                <div className="absolute top-full mt-2 w-48 bg-light-card dark:bg-slate-800 text-light-text dark:text-dark-text rounded-lg shadow-xl py-2">
                                    <button onClick={() => { navigate('app-phone'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <PhoneIcon className="w-5 h-5 mr-3"/> Phone </button>
                                    <button onClick={() => { navigate('app-chat'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <ChatBubbleLeftRightIcon className="w-5 h-5 mr-3"/> Chat </button>
                                    <button onClick={() => { navigate('app-localmail'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <EnvelopeIcon className="w-5 h-5 mr-3"/> LocalMail </button>
                                    <div className="border-t border-gray-200 dark:border-slate-700 my-1"></div>
                                    <button onClick={() => { navigate('app-contacts'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <UserGroupIcon className="w-5 h-5 mr-3"/> Contacts </button>
                                    <button onClick={() => { navigate('app-notepad'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <PencilIcon className="w-5 h-5 mr-3"/> Notepad </button>
                                    <button onClick={() => { navigate('app-calculator'); setAppsMenuOpen(false); }} className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-slate-700"> <CalculatorIcon className="w-5 h-5 mr-3"/> Calculator </button>
                                </div>
                            )}
                        </div>
                     )}
                    <NavButton onClick={() => navigate('contact')} text="Contact" />
                    <NavButton onClick={() => navigate('home')} text="Home" />
                   
                    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                    <IconNavButton onClick={() => setIsDark(!isDark)} tooltip={isDark ? "Light Mode" : "Dark Mode"}>
                        {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                    </IconNavButton>

                    {isLoggedIn && user?.role === UserRole.Admin && (
                        <IconNavButton onClick={() => navigate('admin')} tooltip="Admin Portal">
                            <Cog6ToothIcon className="w-5 h-5" />
                        </IconNavButton>
                    )}
                     {isLoggedIn && (
                        <IconNavButton onClick={() => navigate('profile')} tooltip="Profile">
                            <UserCircleIcon className="w-5 h-5" />
                        </IconNavButton>
                    )}
                    
                    {isLoggedIn ? (
                        <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-red-600 text-white hover:bg-red-700">
                           Sign Out
                        </button>
                    ) : (
                        <button onClick={() => navigate('signin')} className="px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 bg-blue-600 text-white hover:bg-blue-700">
                            Sign On
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;