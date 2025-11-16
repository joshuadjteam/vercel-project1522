import React from 'react';
import { useConsoleView } from '../../hooks/useConsoleView';
import { Page } from '../../types';

const SynoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>;
const FaisIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>;
const LegaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" /></svg>;
const ConIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;


interface ConsoleSwitchAppProps {
    closeWindow?: () => void;
    navigate?: (page: Page) => void;
}

const ConsoleSwitchApp: React.FC<ConsoleSwitchAppProps> = ({ closeWindow, navigate }) => {
    const { view, setConsoleView } = useConsoleView();

    const consoles = [
        { id: 'syno', name: 'SynoConsole', description: 'A modern console that looks and feels like a desktop OS.', icon: <SynoIcon /> },
        { id: 'fais', name: 'FaisConsole', description: 'An all-in-one console with a prominent bottom application shelf.', icon: <FaisIcon /> },
        { id: 'lega', name: 'LegaLauncher', description: 'A classic launcher with a simple top bar and a familiar home screen background.', icon: <LegaIcon /> },
        { id: 'con', name: 'ConConsole', description: 'A modern, widget-based dashboard for quick access to apps and actions.', icon: <ConIcon /> },
    ];

    const handleSelect = (newView: 'syno' | 'fais' | 'lega' | 'con') => {
        setConsoleView(newView);
        if (closeWindow) {
            closeWindow();
        }
        if (navigate) {
            navigate('home');
        }
    };

    return (
        <div className="w-full h-full p-8 sm:p-12 bg-dark-bg text-light-text dark:text-white flex flex-col justify-center">
             <div className="w-full max-w-7xl mx-auto">
                <h1 className="text-5xl font-bold mb-4 text-center">Console Switcher</h1>
                <p className="text-gray-600 dark:text-gray-300 mb-10 text-center text-lg">Choose your preferred console experience.</p>
                <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {consoles.map(c => (
                        <div key={c.id} className={`p-6 rounded-lg border-2 flex flex-col h-full transition-all ${view === c.id ? 'border-blue-500 bg-blue-500/10' : 'border-gray-300 dark:border-slate-700 bg-black/5 dark:bg-black/20'}`}>
                            <div className="flex items-center space-x-4 mb-4">
                                {c.icon}
                                <h2 className="text-2xl font-semibold">{c.name}</h2>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 flex-grow">{c.description}</p>
                            <button
                                onClick={() => handleSelect(c.id as any)}
                                disabled={view === c.id}
                                className="w-full mt-auto py-2 px-4 rounded-md font-semibold transition-colors disabled:bg-blue-600 disabled:text-white disabled:cursor-not-allowed bg-gray-200 dark:bg-slate-700 hover:bg-blue-500 hover:text-white"
                            >
                                {view === c.id ? 'Currently Active' : 'Activate'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ConsoleSwitchApp;