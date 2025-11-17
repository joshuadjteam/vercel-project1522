import React, { useRef, useEffect, useState } from 'react';
import { useCall } from '../hooks/useCall';

const MuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const UnmuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15.586a3 3 0 014.242 0L12 17.757l2.172-2.171a3 3 0 014.242 0M9 12a3 3 0 116 0v6a3 3 0 01-6 0v-6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.586 15.586a3 3 0 010 4.243L12 23.07l-3.586-3.24a3 3 0 010-4.243m5.172-2.171a3 3 0 010-4.243L12 2.93 8.414 6.171a3 3 0 010 4.243" /></svg>;
const EndCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" transform="rotate(-135 12 12)" /></svg>;


const CallWidget: React.FC = () => {
    const { 
        isCalling, callee, callStatus, endCall,
        isMuted, toggleMute, 
        callDuration, localStream, remoteStream, isVideoCall
    } = useCall();
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const pipRef = useRef<HTMLDivElement>(null);
    const [pipPosition, setPipPosition] = useState({ x: 20, y: 20 });
    
    useEffect(() => {
        if (localVideoRef.current && localStream) localVideoRef.current.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
    }, [remoteStream]);

    const handlePipMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startPos = { x: e.clientX, y: e.clientY };
        const initialPos = pipPosition;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const dx = moveEvent.clientX - startPos.x;
            const dy = moveEvent.clientY - startPos.y;
            const parentRect = pipRef.current?.parentElement?.getBoundingClientRect();
            if(!pipRef.current || !parentRect) return;

            let newX = initialPos.x + dx;
            let newY = initialPos.y + dy;

            newX = Math.max(0, Math.min(newX, parentRect.width - pipRef.current.offsetWidth));
            newY = Math.max(0, Math.min(newY, parentRect.height - pipRef.current.offsetHeight));

            setPipPosition({ x: newX, y: newY });
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    if (!isCalling || callStatus !== 'Connected') {
        return null;
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return seconds >= 3600 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] animate-fade-in">
            {isVideoCall && remoteStream && (
                <video ref={remoteVideoRef} autoPlay playsInline className="absolute top-0 left-0 w-full h-full object-cover" />
            )}

            <div className="absolute inset-0 bg-black/50 flex flex-col p-8 items-center justify-between">
                {/* Top Info */}
                <div className="text-center text-white">
                    <h2 className="text-4xl font-semibold">{callee}</h2>
                    <p className="text-lg text-green-400">{formatDuration(callDuration)}</p>
                </div>
                
                {/* Audio-only Avatar */}
                {!isVideoCall && (
                    <div className="w-48 h-48 bg-blue-500 rounded-full flex items-center justify-center font-bold text-8xl text-white ring-4 ring-blue-500/30">
                        {callee.charAt(0).toUpperCase()}
                    </div>
                )}
                
                {/* Controls */}
                <div className="flex justify-center items-center space-x-6">
                    <button 
                        onClick={toggleMute} 
                        title={isMuted ? "Unmute" : "Mute"}
                        className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 text-2xl ${isMuted ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                       {isMuted ? <UnmuteIcon /> : <MuteIcon />}
                    </button>
                    
                    <button 
                        onClick={() => endCall()} 
                        title="End Call"
                        className="h-20 w-20 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white text-2xl font-semibold hover:scale-110"
                    >
                        <EndCallIcon />
                    </button>
                </div>
            </div>

            {isVideoCall && localStream && (
                <div 
                    ref={pipRef} 
                    style={{ transform: `translate(${pipPosition.x}px, ${pipPosition.y}px)` }} 
                    className="absolute top-0 left-0 w-48 h-36 cursor-move" 
                    onMouseDown={handlePipMouseDown}
                >
                     <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full rounded-lg object-cover shadow-lg border-2 border-white/50" />
                </div>
            )}
        </div>
    );
};

export default CallWidget;