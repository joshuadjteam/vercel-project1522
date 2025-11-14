
import React, { useState, useRef, useEffect } from 'react';
import { Page } from '../types';

// Icons
const ContactIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ConsoleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>;


interface FullScreenAppHeaderProps {
    navigate: (page: Page, params?: any) => void;
}

const FullScreenAppHeader: React.FC<FullScreenAppHeaderProps> = ({ navigate }) => {
    const [pagesMenuOpen, setPagesMenuOpen] = useState(false);
    const pagesMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pagesMenuRef.current && !pagesMenuRef.current.contains(event.target as Node)) {
                setPagesMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const NavButton: React.FC<{ onClick: () => void, text: string, icon: React.ReactNode }> = ({ onClick, text, icon }) => (
        <button
            onClick={onClick}
            title={text}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 text-gray-300 hover:bg-white/20 hover:text-white`}
        >
            {icon}
            <span>{text}</span>
        </button>
    );

    return (
        <header className="w-full bg-[#0F2830] text-white shadow-md z-10 flex-shrink-0">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('console')}>
                    <svg width="32" height="32" viewBox="0 0 135 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459H54.707L78.7744 0.853516H39.7627Z" fill="#1155cc"/>
                        <path d="M39.7627 0.853516L0.678711 104.172H30.7177L54.7852 40.5664H54.707L78.7744 0.853516H39.7627Z" fill="#6fa8dc"/>
                        <path d="M79.9482 64.459H54.707L54.7852 40.5664H80.0264L55.9629 104.172H86.002L134.051 0.853516H104.012L79.9482 64.459Z" fill="#0b5394"/>
                    </svg>
                    <span className="text-2xl font-bold text-white">Lynix</span>
                </div>

                <div className="flex items-center space-x-2">
                    <NavButton onClick={() => navigate('profile')} text="Settings" icon={<SettingsIcon />} />
                    <NavButton onClick={() => navigate('console')} text="Console" icon={<ConsoleIcon />} />
                    
                    <div className="relative" ref={pagesMenuRef}>
                        <button onClick={() => setPagesMenuOpen(p => !p)} className="px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center space-x-2 text-gray-300 hover:bg-white/20 hover:text-white">
                            <span>Pages</span>
                            <ChevronDownIcon />
                        </button>
                        {pagesMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl py-2 z-20 animate-fade-in-up">
                                 <button onClick={() => { navigate('contact'); setPagesMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 flex items-center space-x-3">
                                    <ContactIcon />
                                    <span>Contact</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default FullScreenAppHeader;
