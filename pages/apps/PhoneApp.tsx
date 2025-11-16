import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { useSip } from '../../hooks/useSip';
import VoiceAssistantWidget from '../../components/VoiceAssistantWidget';

// Icons
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

const P2PKeypadView: React.FC<{ onLaunchAssistant: () => void }> = ({ onLaunchAssistant }) => {
    const { user: currentUser } = useAuth();
    const { startP2PCall } = useCall();
    const [withVideo, setWithVideo] = useState(true);
    const [dialerInput, setDialerInput] = useState('');

    const handleCall = () => {
        startP2PCall(dialerInput.trim(), withVideo);
    };
    
    const isCallButtonDisabled = useMemo(() => 
        !dialerInput.trim() || dialerInput.trim().toLowerCase() === currentUser?.username.toLowerCase(),
        [dialerInput, currentUser]
    );

    const getButtonTitle = () => {
        if (!dialerInput.trim()) return "Please enter a username.";
        if (dialerInput.trim().toLowerCase() === currentUser?.username.toLowerCase()) return "You cannot call yourself.";
        return "Start a call";
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <input 
                type="text" 
                placeholder="Enter username to call" 
                value={dialerInput} 
                onChange={(e) => setDialerInput(e.target.value)} 
                className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center justify-center space-x-4 py-1">
                <span className="text-md text-gray-600 dark:text-gray-300">Audio</span>
                <button type="button" onClick={() => setWithVideo(!withVideo)} className={`${withVideo ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-500'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-light-card dark:focus:ring-offset-dark-bg`} aria-pressed={withVideo}>
                    <span className={`${withVideo ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                </button>
                <span className="text-md text-gray-600 dark:text-gray-300">Video</span>
            </div>
            <button 
                onClick={handleCall}
                disabled={isCallButtonDisabled}
                title={getButtonTitle()}
                className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-3 text-xl disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
                <CallIcon />
                <span>Call</span>
            </button>
            <div className="relative flex items-center justify-center my-1"><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div><span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-purple-300">OR</span><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div></div>
            <button onClick={onLaunchAssistant} className="w-full bg-cyan-600 text-white font-bold py-4 px-4 rounded-md hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-3 text-xl"><MicrophoneIcon /><span>AI Voice Assistant</span></button>
        </div>
    );
}

const SipKeypadView: React.FC = () => {
    const { makeCall, connectionState, error } = useSip();
    const [dialUri, setDialUri] = useState('');

    const isConnected = connectionState === 'Connected';
    
    const ConnectionStatus = () => {
        let colorClass = 'text-gray-500 dark:text-gray-400';
        if (isConnected) colorClass = 'text-green-500 dark:text-green-400';
        else if (connectionState === 'Registration Failed' || error) colorClass = 'text-red-500 dark:text-red-400';

        return <p className={`text-center text-sm font-semibold ${colorClass}`}>{error || connectionState}</p>;
    };

    return (
        <div className="space-y-4 animate-fade-in">
            <ConnectionStatus />
            <input 
                type="text" 
                placeholder="Enter username or URI" 
                value={dialUri} 
                onChange={e => setDialUri(e.target.value)} 
                className="w-full bg-gray-100 dark:bg-slate-700/50 rounded-md px-3 py-2 text-xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isConnected}
            />
            <button 
                onClick={() => makeCall(dialUri)} 
                disabled={!dialUri || !isConnected} 
                className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-500 flex items-center justify-center space-x-2"
            >
                <CallIcon /> <span>Call</span>
            </button>
        </div>
    );
};

const PhoneApp: React.FC = () => {
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const { isCalling: isP2PCalling } = useCall();
    const { callState: sipCallState } = useSip();
    const [mode, setMode] = useState<'p2p' | 'sip'>('p2p');

    const isCallInProgress = isP2PCalling || sipCallState !== 'Idle';
    
    return (
        <>
            <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 bg-dark-bg text-light-text dark:text-white">
                <div className="w-full max-w-sm mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-center text-purple-600 dark:text-purple-400">Phone</h1>
                     <div className="flex justify-center mb-6 bg-gray-200 dark:bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => setMode('p2p')} className={`w-1/2 py-2 rounded-md font-semibold ${mode === 'p2p' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>Lynix ID</button>
                        <button onClick={() => setMode('sip')} className={`w-1/2 py-2 rounded-md font-semibold ${mode === 'sip' ? 'bg-white dark:bg-slate-600 shadow' : ''}`}>SIP Account</button>
                    </div>
                    {isCallInProgress ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-4 h-[440px] flex flex-col items-center justify-center">
                            <h2 className="text-xl font-semibold">Call in Progress</h2><p>Your call is being handled in the call screen.</p>
                        </div>
                    ) : (
                        mode === 'p2p' ? <P2PKeypadView onLaunchAssistant={() => setIsVoiceAssistantOpen(true)} /> : <SipKeypadView />
                    )}
                </div>
            </div>
            <VoiceAssistantWidget isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
        </>
    );
};

export default PhoneApp;