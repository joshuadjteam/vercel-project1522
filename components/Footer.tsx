
import React, { useState } from 'react';
import HelpModal from './HelpModal';

const Footer: React.FC = () => {
    const [isHelpModalOpen, setHelpModalOpen] = useState(false);

    return (
        <>
            <footer className="w-full bg-white/30 dark:bg-gray-900/50 backdrop-blur-sm text-gray-600 dark:text-gray-400 text-sm shadow-inner py-3">
                <div className="container mx-auto px-4 flex justify-center items-center">
                    <p>&copy; 2025 Lynix Technology and Coding. All Rights Reserved.</p>
                </div>
            </footer>
            <div className="fixed bottom-5 right-5 flex flex-col items-center space-y-3 z-50">
                 <a href="https://www.youtube.com/@DarCodR" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-slate-700 dark:bg-gray-800 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg group font-bold">
                    YT
                    <span className="absolute right-full mr-3 hidden group-hover:block bg-light-text dark:bg-dark-card text-light-card dark:text-dark-text text-xs rounded py-1 px-2 whitespace-nowrap">YouTube</span>
                </a>
                <button onClick={() => setHelpModalOpen(true)} className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-lg group text-3xl font-bold">
                    ?
                    <span className="absolute right-full mr-3 hidden group-hover:block bg-light-text dark:bg-dark-card text-light-card dark:text-dark-text text-xs rounded py-1 px-2 whitespace-nowrap">Help & Support</span>
                </button>
            </div>
            <HelpModal isOpen={isHelpModalOpen} onClose={() => setHelpModalOpen(false)} />
        </>
    );
};

export default Footer;
