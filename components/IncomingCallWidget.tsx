
import React from 'react';
import { useCall } from '../hooks/useCall';

const IncomingCallWidget: React.FC = () => {
    const { incomingCall, acceptCall, declineCall } = useCall();

    if (!incomingCall) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]">
            <div className="bg-light-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-sm p-8 text-center text-light-text dark:text-white">
                <h2 className="text-2xl font-bold mb-2">Incoming Call</h2>
                <p className="text-lg mb-6">
                    <span className="font-semibold">{incomingCall.from}</span> is calling...
                </p>
                <div className="flex justify-around">
                    <button 
                        onClick={declineCall} 
                        className="h-16 w-16 rounded-full flex items-center justify-center transition-colors bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                        Decline
                    </button>
                    <button 
                        onClick={acceptCall}
                        className="h-16 w-16 rounded-full flex items-center justify-center transition-colors bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallWidget;
