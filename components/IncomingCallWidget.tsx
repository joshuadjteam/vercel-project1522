

import React, { useEffect, useRef } from 'react';
import { useCall } from '../hooks/useCall';

const IncomingCallWidget: React.FC = () => {
    const { incomingCall, acceptCall, declineCall } = useCall();
    const ringtoneRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        if (incomingCall && ringtoneRef.current) {
            ringtoneRef.current.loop = true;
            ringtoneRef.current.play().catch(e => console.error("Ringtone playback failed", e));
        } else if (!incomingCall && ringtoneRef.current) {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
        
        return () => {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
        };
    }, [incomingCall]);

    if (!incomingCall) {
        return null;
    }

    const callType = incomingCall.isVideoCall ? 'Video Call' : 'Audio Call';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
             <audio ref={ringtoneRef} src="https://assets.mixkit.co/sfx/preview/mixkit-marimba-waiting-ringtone-1360.mp3" preload="auto" />
            <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-xl w-full max-w-sm p-8 text-center text-white animate-pulse-slow">
                <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center font-bold text-4xl text-white mx-auto mb-4">
                    {incomingCall.from.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-3xl font-bold mb-1">{incomingCall.from}</h2>
                <p className="text-lg text-gray-300 mb-8">
                    Incoming {callType}...
                </p>
                <div className="flex justify-around items-center">
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={declineCall} 
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white font-semibold text-2xl hover:scale-110"
                            aria-label="Decline call"
                        >
                            📞
                        </button>
                        <span className="mt-2 text-sm">Decline</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button 
                            onClick={acceptCall}
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-green-600 hover:bg-green-700 text-white font-semibold text-2xl hover:scale-110"
                            aria-label="Accept call"
                        >
                            📞
                        </button>
                        <span className="mt-2 text-sm">Accept</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallWidget;
