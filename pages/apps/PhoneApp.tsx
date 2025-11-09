
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { database } from '../../services/database';
import VoiceAssistantWidget from '../../components/VoiceAssistantWidget';

const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;

const Dialer: React.FC<{ onLaunchAssistant: () => void }> = ({ onLaunchAssistant }) => {
    const { user: currentUser } = useAuth();
    const { startP2PCall, isCalling } = useCall();
    const [calleeInput, setCalleeInput] = useState('');
    const [withVideo, setWithVideo] = useState(true);
    const [errorStatus, setErrorStatus] = useState('');

    const handleCall = async () => {
        if (!calleeInput.trim()) {
            setErrorStatus('Please enter a username to call.');
            return;
        }

        if (calleeInput.trim().toLowerCase() === currentUser?.username.toLowerCase()) {
            setErrorStatus("You cannot call yourself.");
            return;
        }

        setErrorStatus('Checking user...');
        const userToCall = await database.getUserByUsername(calleeInput.trim());

        if (userToCall) {
            setErrorStatus('');
            startP2PCall(userToCall.username, withVideo);
        } else {
            setErrorStatus(`User "${calleeInput.trim()}" not found.`);
        }
    };
    
    return isCalling ? (
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <h2 className="text-xl font-semibold">Call in Progress</h2>
            <p>Your call is being handled in the call screen.</p>
        </div>
    ) : (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Enter username to call"
                value={calleeInput}
                onChange={(e) => setCalleeInput(e.target.value)}
                className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             <div className="flex items-center justify-center space-x-2 py-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Audio</span>
                <button
                    type="button"
                    onClick={() => setWithVideo(!withVideo)}
                    className={`${withVideo ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-500'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-light-card dark:focus:ring-offset-teal-800`}
                    aria-pressed={withVideo}
                >
                    <span className="sr-only">Use Video</span>
                    <span className={`${withVideo ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">Video</span>
            </div>
            <button onClick={handleCall} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                <CallIcon />
                <span>Call</span>
            </button>
            <div className="relative flex items-center justify-center my-2">
                <div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-500 dark:text-purple-300">OR</span>
                <div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div>
            </div>
            <button onClick={onLaunchAssistant} className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-md hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-2">
                <MicrophoneIcon />
                <span>AI Voice Assistant</span>
            </button>

            {errorStatus && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 text-center">{errorStatus}</p>}
        </div>
    );
}

const PhoneApp: React.FC = () => {
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    
    return (
        <>
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-full max-w-sm bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white">
                     <h1 className="text-2xl font-bold mb-4 text-center text-purple-600 dark:text-purple-400">Phone Dialer</h1>
                    <Dialer onLaunchAssistant={() => setIsVoiceAssistantOpen(true)} />
                </div>
            </div>
            <VoiceAssistantWidget isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
        </>
    );
};

export default PhoneApp;