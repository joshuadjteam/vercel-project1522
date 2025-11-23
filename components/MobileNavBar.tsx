
import React from 'react';
import { Page } from '../types';

interface MobileNavBarProps {
    navigate: (page: Page) => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ navigate }) => {
    const handleHome = () => navigate('home');

    return (
        <div className="w-full bg-transparent flex justify-center items-end pb-2 h-6 absolute bottom-0 left-0 right-0 pointer-events-none z-50">
            <div 
                onClick={handleHome} 
                className="w-32 h-1 bg-gray-400/50 dark:bg-white/30 rounded-full pointer-events-auto cursor-pointer active:bg-white/60 transition-colors"
            ></div>
        </div>
    );
};

export default MobileNavBar;
