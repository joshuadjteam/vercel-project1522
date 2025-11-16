import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { database } from '../../services/database';
import VoiceAssistantWidget from '../../components/VoiceAssistantWidget';

// Original Icons
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

const P2PKeypadView: React.FC<{ onLaunchAssistant: () => void; dialerInput: string; setDialerInput: (input: string) => void; }> = ({ onLaunchAssistant, dialerInput, setDialerInput }) => {
    const { user: currentUser } = useAuth();
    const { startP2PCall } = useCall();
    const [withVideo, setWithVideo] = useState(true);
    const [errorStatus, setErrorStatus] = useState('');

    const handleCall = async () => {
        if (!dialerInput.trim()) {
            setErrorStatus('Please enter a username to call.');
            return;
        }
        if (dialerInput.trim().toLowerCase() === currentUser?.username.toLowerCase()) {
            setErrorStatus("You cannot call yourself.");
            return;
        }
        setErrorStatus('Checking user...');
        
        try {
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error("User check timed out")), 8000)
            );

            const userToCall = await Promise.race([
                database.getUserByUsername(dialerInput.trim()),
                timeoutPromise
            ]) as Awaited<ReturnType<typeof database.getUserByUsername>>;

            if (userToCall) {
                setErrorStatus('');
                startP2PCall(userToCall.username, withVideo);
            } else {
                setErrorStatus(`User "${dialerInput.trim()}" not found.`);
            }
        } catch(e: any) {
             setErrorStatus(e.message || "An error occurred while checking the user.");
        }
    };
    
    return (
        <div className="space-y-4">
            <input type="text" placeholder="Enter username to call" value={dialerInput} onChange={(e) => setDialerInput(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-3 text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="flex items-center justify-center space-x-4 py-1">
                <span className="text-md text-gray-600 dark:text-gray-300">Audio</span>
                <button type="button" onClick={() => setWithVideo(!withVideo)} className={`${withVideo ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-500'} relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-light-card dark:focus:ring-offset-dark-bg`} aria-pressed={withVideo}>
                    <span className={`${withVideo ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                </button>
                <span className="text-md text-gray-600 dark:text-gray-300">Video</span>
            </div>
            <button onClick={handleCall} className="w-full bg-green-600 text-white font-bold py-4 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-3 text-xl"><CallIcon /><span>Call</span></button>
            <div className="relative flex items-center justify-center my-1"><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div><span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-purple-300">OR</span><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div></div>
            <button onClick={onLaunchAssistant} className="w-full bg-cyan-600 text-white font-bold py-4 px-4 rounded-md hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-3 text-xl"><MicrophoneIcon /><span>AI Voice Assistant</span></button>
            {errorStatus && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">{errorStatus}</p>}
        </div>
    );
}

const SIPAccountView: React.FC = () => {
    const [sipUser, setSipUser] = useState('');
    const [sipPassword, setSipPassword] = useState('');
    const [sipStatus, setSipStatus] = useState('');

    const handleConnect = () => {
        // NOTE: Full SIP client implementation requires a library like JsSIP, which is not available in the current environment.
        // This functionality is for UI demonstration purposes.
        setSipStatus('Connecting...');
        setTimeout(() => {
            setSipStatus('Connection failed: SIP client not yet implemented.');
        }, 2000);
    };

    return (
        <div className="space-y-4">
            <input type="text" placeholder="SIP Username" value={sipUser} onChange={e => setSipUser(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <input type="password" placeholder="Password" value={sipPassword} onChange={e => setSipPassword(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <div className="text-xs text-center text-gray-400 dark:text-gray-500 space-y-1 pt-2">
                <p><span className="font-semibold">SIP Server:</span> @lynixity.x10.bz</p>
                <p><span className="font-semibold">Proxy:</span> sip.iptel.org</p>
            </div>
            <button onClick={handleConnect} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center space-x-3 text-lg">
                <span>Connect SIP Account</span>
            </button>
            {sipStatus && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">{sipStatus}</p>}
        </div>
    );
};


const PhoneApp: React.FC = () => {
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [dialerInput, setDialerInput] = useState('');
    const { isCalling } = useCall();
    const [accountMode, setAccountMode] = useState<'p2p' | 'sip'>('p2p');
    
    return (
        <>
            <div className="w-full h-full flex flex-col justify-center p-6 sm:p-8 bg-dark-bg text-light-text dark:text-white">
                <div className="w-full max-w-sm mx-auto">
                    <h1 className="text-4xl font-bold mb-4 text-center text-purple-600 dark:text-purple-400">Phone</h1>
                     <div className="flex justify-center mb-4 border-b border-purple-500/30">
                        <button onClick={() => setAccountMode('p2p')} className={`px-4 py-2 text-sm font-semibold transition-colors ${accountMode === 'p2p' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}>Lynix ID</button>
                        <button onClick={() => setAccountMode('sip')} className={`px-4 py-2 text-sm font-semibold transition-colors ${accountMode === 'sip' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}>SIP Account</button>
                    </div>
                    {isCalling ? (
                        <div className="text-center text-gray-500 dark:text-gray-400 p-4 h-[440px] flex flex-col items-center justify-center">
                            <h2 className="text-xl font-semibold">Call in Progress</h2><p>Your call is being handled in the call screen.</p>
                        </div>
                    ) : (
                        <div>
                           {accountMode === 'p2p' ? (
                                <P2PKeypadView onLaunchAssistant={() => setIsVoiceAssistantOpen(true)} dialerInput={dialerInput} setDialerInput={setDialerInput} />
                            ) : (
                                <SIPAccountView />
                            )}
                        </div>
                    )}
                </div>
            </div>
            <VoiceAssistantWidget isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
        </>
    );
};

export default PhoneApp;