import React, { useState } from 'react';
import { useCall } from '../../hooks/useCall';
import VoiceAssistantWidget from '../../components/VoiceAssistantWidget';

// Icons
const DialpadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const AssistantIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const VideoCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;

type PhoneView = 'dialer' | 'assistant';

const MobiPhoneApp: React.FC = () => {
    const [view, setView] = useState<PhoneView>('dialer');
    const [targetUser, setTargetUser] = useState('');
    const { startP2PCall } = useCall();
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);

    const handleCall = (withVideo: boolean) => {
        if (targetUser.trim()) {
            startP2PCall(targetUser.trim(), withVideo);
        }
    };

    const renderContent = () => {
        if (view === 'dialer') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-xl font-semibold mb-2">P2P Call</h2>
                    <p className="text-sm text-gray-400 mb-6">Enter a username to start a call.</p>
                    <input
                        type="text"
                        value={targetUser}
                        onChange={(e) => setTargetUser(e.target.value)}
                        placeholder="Enter username"
                        className="w-full max-w-xs bg-gray-100 dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 rounded-lg px-4 py-3 text-lg mb-4 text-center"
                    />
                    <div className="flex space-x-4">
                        <button onClick={() => handleCall(false)} className="flex-1 bg-green-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                            <DialpadIcon />
                            <span>Audio</span>
                        </button>
                        <button onClick={() => handleCall(true)} className="flex-1 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2">
                            <VideoCallIcon />
                            <span>Video</span>
                        </button>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <h2 className="text-xl font-semibold mb-2">AI Voice Assistant</h2>
                <p className="text-sm text-gray-400 mb-6">Tap to start a conversation.</p>
                <button 
                    onClick={() => setIsVoiceAssistantOpen(true)} 
                    className="w-full max-w-xs bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2"
                >
                    <AssistantIcon />
                    <span>Launch Assistant</span>
                </button>
            </div>
        );
    };

    return (
        <>
            <div className="w-full h-full flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
                <header className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-2xl font-bold text-center">Phone</h1>
                </header>
                <main className="flex-grow overflow-y-auto p-4">
                    {renderContent()}
                </main>
                <footer className="flex-shrink-0 bg-gray-200 dark:bg-gray-900 flex justify-around">
                    <button onClick={() => setView('dialer')} className={`flex-1 py-4 flex flex-col items-center justify-center space-y-1 ${view === 'dialer' ? 'text-blue-500' : 'text-gray-500'}`}>
                        <DialpadIcon />
                        <span className="text-xs font-semibold">Dialer</span>
                    </button>
                    <button onClick={() => setView('assistant')} className={`flex-1 py-4 flex flex-col items-center justify-center space-y-1 ${view === 'assistant' ? 'text-blue-500' : 'text-gray-500'}`}>
                        <AssistantIcon />
                        <span className="text-xs font-semibold">Assistant</span>
                    </button>
                </footer>
            </div>
            <VoiceAssistantWidget isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
        </>
    );
};

export default MobiPhoneApp;