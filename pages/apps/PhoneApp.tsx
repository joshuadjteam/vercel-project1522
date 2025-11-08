
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { database } from '../../services/database';

const PhoneApp: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { startCall, isCalling, incomingCall } = useCall();
    const [calleeInput, setCalleeInput] = useState('');
    const [errorStatus, setErrorStatus] = useState('');

    const handleCall = async () => {
        if (!calleeInput.trim()) {
            setErrorStatus('Please enter a user to call.');
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
            startCall(userToCall);
        } else {
            setErrorStatus(`Error 570 : The Username ${calleeInput.trim()} cannot be dialed as it's invalid or not existing`);
        }
    };


    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-sm bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white text-center">
                <h1 className="text-3xl font-bold mb-6">LynixTalk Dialer</h1>
                 {isCalling || incomingCall ? (
                     <div className="text-center text-gray-500 dark:text-gray-400 p-4">
                        <h2 className="text-xl font-semibold">Call in Progress</h2>
                        <p>Use the call widget to manage your active call.</p>
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
                        <button onClick={handleCall} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors">
                            Call
                        </button>
                        {errorStatus && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">{errorStatus}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneApp;