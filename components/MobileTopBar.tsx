

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Page } from '../types';

const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


interface MobileTopBarProps {
    navigate: (page: Page) => void;
}

const MobileTopBar: React.FC<MobileTopBarProps> = ({ navigate }) => {
    const { user } = useAuth();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const timeString = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return (
        <header className="w-full bg-gray-800 text-white p-1 flex justify-between items-center flex-shrink-0 z-10 shadow-md">
            <span className="px-2 text-xs truncate">u: {user?.username}</span>
            <span className="px-2 text-sm font-semibold">{timeString}</span>
            <button 
                onClick={() => navigate('profile')} 
                className="p-2 rounded-full hover:bg-white/20"
                aria-label="Open Profile"
            >
                <ProfileIcon />
            </button>
        </header>
    );
};

export default MobileTopBar;
