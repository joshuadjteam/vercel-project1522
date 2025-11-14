
import React, { useState } from 'react';
import { Page } from '../types';
import HelpModal from './HelpModal';

// Icons
const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8l-4 4m0 0l4 4m-4-4h8" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const HelpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>;


interface MobileNavBarProps {
    navigate: (page: Page) => void;
}

const MobileNavBar: React.FC<MobileNavBarProps> = ({ navigate }) => {
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);
    
    const handleBack = () => window.history.back();
    const handleHome = () => navigate('home');
    const handleHelp = () => setHelpModalOpen(true);

    return (
        <>
            <footer className="w-full bg-blue-600 text-white flex-shrink-0 z-10">
                <div className="flex justify-around items-center h-16">
                    <button onClick={handleBack} className="p-4 rounded-full hover:bg-white/20" aria-label="Go back">
                        <BackIcon />
                    </button>
                    <button onClick={handleHome} className="p-4 rounded-full hover:bg-white/20" aria-label="Go home">
                        <HomeIcon />
                    </button>
                    <button onClick={handleHelp} className="p-4 rounded-full hover:bg-white/20" aria-label="Open support">
                        <HelpIcon />
                    </button>
                </div>
            </footer>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </>
    );
};

export default MobileNavBar;
