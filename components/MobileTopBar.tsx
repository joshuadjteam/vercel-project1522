
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';

const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const MoonIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UserSwitchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;

interface MobileTopBarProps {
    navigate: (page: Page) => void;
    onSleep: () => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ navigate, onSleep }) => {
    const { user, logout } = useAuth();
    const [time, setTime] = useState(new Date());
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node) && isOpen) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const handleSignOut = () => {
        setIsOpen(false);
        logout();
        navigate('signin');
    };

    const handleSleep = () => {
        setIsOpen(false);
        onSleep();
    };

    const QuickTile: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, active?: boolean }> = ({ icon, label, onClick, active }) => (
        <button onClick={onClick} className={`flex flex-col items-center justify-center p-4 rounded-2xl w-full aspect-square transition-all ${active ? 'bg-[#a8c7fa] text-[#041e49]' : 'bg-[#303030] text-white'}`}>
            <div className="mb-2">{icon}</div>
            <span className="text-xs font-medium text-center leading-tight">{label}</span>
        </button>
    );

    return (
        <>
            <header 
                onClick={() => setIsOpen(true)}
                className="w-full bg-gradient-to-b from-black/80 to-transparent text-white p-2 flex justify-between items-center flex-shrink-0 z-50 cursor-pointer fixed top-0 left-0 right-0 h-8 px-4"
            >
                <span className="text-xs font-medium drop-shadow-md">{timeString}</span>
                <div className="flex items-center space-x-2 drop-shadow-md">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0a1.5 1.5 0 0 1 0 2.121l-9.536 9.536a1.5 1.5 0 0 1-2.121 0L1.393 11.514a1.5 1.5 0 0 1 0-2.121z"/></svg>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16.667 4H15V2H9v2H7.333C6.597 4 6 4.597 6 5.333V20.667C6 21.403 6.597 22 7.333 22h9.334c.736 0 1.333-.597 1.333-1.333V5.333C18 4.597 17.403 4 16.667 4z"/></svg>
                </div>
            </header>

            {isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col animate-fade-in">
                    <div ref={panelRef} className="bg-[#1e1e1e] text-white p-6 rounded-b-3xl shadow-2xl border-b border-white/10">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-2xl font-normal">{timeString}</h2>
                                <p className="text-sm text-gray-400">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            </div>
                            <button onClick={() => { setIsOpen(false); navigate('app-settings'); }} className="p-2 rounded-full bg-[#303030]">
                                <SettingsIcon />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-6">
                            <QuickTile icon={<PowerIcon />} label="Sign Out" onClick={handleSignOut} />
                            <QuickTile icon={<MoonIcon />} label="Sleep" onClick={handleSleep} active />
                            <QuickTile icon={<UserSwitchIcon />} label="Switch Account" onClick={handleSignOut} />
                            <QuickTile icon={<HelpIcon />} label="Help" onClick={() => { setIsOpen(false); navigate('app-help'); }} />
                        </div>

                        <div className="bg-[#303030] rounded-2xl p-4 mb-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-lg font-bold">{user?.username.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div className="font-medium">{user?.username}</div>
                                    <div className="text-xs text-gray-400">Lynix ID: {user?.id}</div>
                                </div>
                            </div>
                            <button onClick={() => { setIsOpen(false); navigate('profile'); }} className="text-xs bg-black/20 px-3 py-1 rounded-full">Manage Session</button>
                        </div>
                        
                        <div className="w-full h-1 bg-gray-700 rounded-full mb-2 overflow-hidden">
                            <div className="w-3/4 h-full bg-[#a8c7fa]"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Brightness</span>
                            <span>75%</span>
                        </div>
                        
                        <button onClick={() => setIsOpen(false)} className="w-full mt-6 py-2 text-center text-gray-400 text-sm">
                            Close Panel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobileTopBar;