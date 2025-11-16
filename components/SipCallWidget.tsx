import React, { useEffect, useRef } from 'react';
import { useSip } from '../hooks/useSip';

const MuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const UnmuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15.586a3 3 0 014.242 0L12 17.757l2.172-2.171a3 3 0 014.242 0M9 12a3 3 0 116 0v6a3 3 0 01-6 0v-6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.586 15.586a3 3 0 010 4.243L12 23.07l-3.586-3.24a3 3 0 010-4.243m5.172-2.171a3 3 0 010-4.243L12 2.93 8.414 6.171a3 3 0 010 4.243" /></svg>;
const EndCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" transform="rotate(-135 12 12)" /></svg>;
const AcceptIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" /></svg>;

const SipCallWidget: React.FC = () => {
    const { 
        callState, 
        remoteIdentity, 
        remoteStream, 
        isMuted, 
        toggleMute, 
        answerCall, 
        hangupCall,
        callDuration 
    } = useSip();

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    
    if (callState === 'Idle') return null;

    const formatDuration = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getStatusText = () => {
        if (callState === 'Active') return formatDuration(callDuration);
        return callState;
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-[100] animate-fade-in">
            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl text-white w-full max-w-md md:max-w-lg lg:max-w-xl h-[90vh] max-h-[650px] flex flex-col p-4">
                <div className="relative flex-grow bg-black rounded-lg w-full h-full overflow-hidden flex items-center justify-center">
                    <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    {!remoteStream && (
                         <div className="absolute flex flex-col items-center pointer-events-none">
                            <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center font-bold text-4xl text-white mb-4">
                                {remoteIdentity?.charAt(0).toUpperCase() || '?'}
                            </div>
                        </div>
                    )}
                </div>
                 <div className="shrink-0 pt-4">
                    <div className="text-center mb-4">
                        <p className="text-2xl font-semibold truncate">{remoteIdentity}</p>
                        <p className="text-sm text-yellow-400">{getStatusText()}</p>
                    </div>
                     <div className="flex justify-center items-center space-x-4">
                        {callState === 'Incoming' ? (
                             <>
                                <button onClick={hangupCall} title="Decline" className="h-16 w-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white"><EndCallIcon /></button>
                                <button onClick={answerCall} title="Accept" className="h-16 w-16 rounded-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white"><AcceptIcon /></button>
                             </>
                        ) : (
                            <>
                                <button onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"} className={`h-14 w-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-yellow-500' : 'bg-white/20'}`}>
                                   {isMuted ? <UnmuteIcon /> : <MuteIcon />}
                                </button>
                                <button onClick={hangupCall} title="End Call" className="h-16 w-16 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white">
                                    <EndCallIcon />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SipCallWidget;