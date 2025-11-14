
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const MobileTopBar: React.FC = () => {
    const { user } = useAuth();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const getDayWithSuffix = (day: number) => {
        if (day > 3 && day < 21) return `${day}th`;
        switch (day % 10) {
            case 1: return `${day}st`;
            case 2: return `${day}nd`;
            case 3: return `${day}rd`;
            default: return `${day}th`;
        }
    };
    
    const time12h = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
    const time24h = `(${time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })})`;
    const month = time.toLocaleString('default', { month: 'long' });
    const day = getDayWithSuffix(time.getDate());
    const isoDate = `(${time.toISOString().split('T')[0]})`;

    return (
        <header className="w-full bg-gray-800 text-gray-300 text-xs p-1 flex justify-between items-center flex-shrink-0 z-10">
            <span className="px-2">signed in as "{user?.username}"</span>
            <span className="px-2">{time12h} {time24h} {month} {day} {isoDate}</span>
        </header>
    );
};

export default MobileTopBar;
