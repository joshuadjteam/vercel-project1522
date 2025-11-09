

import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../hooks/useCall';

const CallWidget: React.FC = () => {
    const { 
        isCalling, callee, callStatus, endCall,
        isMuted, toggleMute, 
        isVideoEnabled, toggleVideo,
        localStream, remoteStream,
        callDuration,
    } = useCall();
    
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const remoteAudioRef = useRef<HTMLAudioElement>(null);
    const pipRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [pipPosition, setPipPosition] = useState({ x: 10, y: 10 }); // Initial position from bottom right
    const dragStartPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);
    
    useEffect(() => {
        if (remoteStream) {
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = remoteStream;
            }
            if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = remoteStream;
            }
        }
    }, [remoteStream]);
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - pipPosition.x,
            y: e.clientY - pipPosition.y,
        };
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !pipRef.current) return;
        
        const parentRect = pipRef.current.parentElement?.getBoundingClientRect();
        if (!parentRect) return;

        let newX = e.clientX - dragStartPos.current.x;
        let newY = e.clientY - dragStartPos.current.y;
        
        // Constrain movement within the parent element
        newX = Math.max(0, Math.min(newX, parentRect.width - pipRef.current.offsetWidth));
        newY = Math.max(0, Math.min(newY, parentRect.height - pipRef.current.offsetHeight));

        setPipPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);


    if (!isCalling) {
        return null;
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
        const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return seconds >= 3600 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };
    
    const StatusIndicator: React.FC = () => {
        let content;
        if (callStatus === 'Connected') {
            content = <span className="text-green-400">{formatDuration(callDuration)}</span>;
        } else if (callStatus.startsWith('Ringing')) {
            content = <span className="text-yellow-400 animate-pulse">{callStatus}</span>;
        } else {
            content = <span className="text-yellow-400">{callStatus}</span>;
        }
        return <p className="text-sm truncate">{content}</p>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-[100] animate-fade-in">
            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl text-white w-full max-w-md md:max-w-lg lg:max-w-2xl h-[90vh] max-h-[700px] flex flex-col p-4">
                {/* Remote Video */}
                <div className="relative flex-grow bg-black rounded-lg w-full h-full overflow-hidden flex items-center justify-center">
                    {remoteStream ? (
                        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center font-bold text-4xl text-white mb-4">
                                {callee.charAt(0).toUpperCase()}
                            </div>
                            <h2 className="text-2xl font-semibold">{callee}</h2>
                        </div>
                    )}
                    
                    {/* Picture-in-Picture (Local Video) */}
                     {localStream && isVideoEnabled && (
                        <div 
                            ref={pipRef}
                            onMouseDown={handleMouseDown}
                            className={`absolute w-1/4 max-w-[150px] aspect-[3/4] rounded-md overflow-hidden border-2 border-white/50 shadow-lg transition-transform duration-300 animate-slide-in-up ${isDragging ? 'cursor-grabbing scale-105' : 'cursor-grab'}`} 
                            style={{ bottom: `${pipPosition.y}px`, right: `${pipPosition.x}px` }}
                        >
                            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Call Info & Controls */}
                <div className="shrink-0 pt-4">
                    <div className="text-center mb-4">
                        <p className="text-2xl font-semibold truncate">{callee}</p>
                        <StatusIndicator />
                    </div>
                
                    <div className="flex justify-center items-center space-x-4">
                        <button 
                            onClick={toggleMute} 
                            title={isMuted ? "Unmute" : "Mute"}
                            className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 text-2xl ${isMuted ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                           🎤
                        </button>
                        <button 
                            onClick={toggleVideo} 
                            title={isVideoEnabled ? "Video Off" : "Video On"}
                             className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 text-2xl ${!isVideoEnabled ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            📹
                        </button>
                        <button 
                            onClick={endCall} 
                            title="End Call"
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white text-2xl font-semibold hover:scale-110"
                        >
                            📞
                        </button>
                    </div>
                </div>
            </div>
             {/* Hidden audio element for audio-only calls or when video element isn't rendered */}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
        </div>
    );
};

export default CallWidget;
