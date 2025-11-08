
import React from 'react';
import { useCall } from '../hooks/useCall';

const IncomingCallWidget: React.FC = () => {
    const { incomingCall, answerCall, declineCall } = useCall();

    if (!incomingCall) {
        return null;
    }

    return (
        <div className="fixed bottom-10 right-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-light-text dark:text-white w-72 z-50 animate-pulse">
            <div className="flex items-center space-x-3 mb-4">
                 <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white">
                    {incomingCall.callerName.charAt(0).toUpperCase()}
                </div>
                <div>
                    <p className="font-semibold">{incomingCall.callerName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Incoming call...</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                 <button onClick={declineCall} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <span>Decline</span>
                </button>
                <button onClick={answerCall} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors">
                    <span>Answer</span>
                </button>
            </div>
        </div>
    );
};

export default IncomingCallWidget;
