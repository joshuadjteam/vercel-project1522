import React from 'react';
import { useCall } from '../hooks/useCall';

const DeclineIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" transform="rotate(-135 12 12)" /></svg>;
const AcceptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" /></svg>;

const CallNotificationWidget: React.FC = () => {
    const { 
        isCalling,
        callStatus,
        callee,
        incomingCall, 
        acceptCall, 
        declineCall,
        endCall
    } = useCall();

    if (incomingCall) {
        const callType = incomingCall.isVideoCall ? 'Video Call' : 'Audio Call';
        return (
            <div className="fixed top-5 right-5 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center text-white z-[100] animate-fade-in">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-3">
                    {incomingCall.from.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold mb-1">{incomingCall.from}</h2>
                <p className="text-md text-gray-300 mb-6">
                    Incoming {callType}...
                </p>
                <div className="flex justify-around items-center">
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={declineCall} 
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white font-semibold hover:scale-110"
                            aria-label="Decline call"
                        >
                            <DeclineIcon />
                        </button>
                        <span className="mt-2 text-sm">Decline</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={acceptCall}
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-green-600 hover:bg-green-700 text-white font-semibold hover:scale-110"
                            aria-label="Accept call"
                        >
                           <AcceptIcon />
                        </button>
                        <span className="mt-2 text-sm">Accept</span>
                    </div>
                </div>
            </div>
        );
    }

    if (isCalling && callStatus.startsWith('Ringing')) {
         return (
            <div className="fixed top-5 right-5 bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center text-white z-[100] animate-fade-in">
                 <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center font-bold text-3xl text-white mx-auto mb-3">
                    {callee.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-2xl font-bold mb-1">{callee}</h2>
                <p className="text-md text-yellow-400 animate-pulse mb-6">
                    {callStatus}
                </p>
                <div className="flex justify-center items-center">
                    <div className="flex flex-col items-center">
                        <button 
                            // FIX: The onClick handler should be a function that calls endCall, to match the expected event handler type.
                            onClick={() => endCall()} 
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white font-semibold hover:scale-110"
                            aria-label="End call"
                        >
                            <DeclineIcon />
                        </button>
                        <span className="mt-2 text-sm">End Call</span>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default CallNotificationWidget;
