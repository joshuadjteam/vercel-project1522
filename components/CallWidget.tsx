import React, { useEffect, useRef, useState } from 'react';
import { useCall } from '../hooks/useCall';

const MuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const UnmuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15.586a3 3 0 014.242 0L12 17.757l2.172-2.171a3 3 0 014.242 0M9 12a3 3 0 116 0v6a3 3 0 01-6 0v-6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.586 15.586a3 3 0 010 4.243L12 23.07l-3.586-3.24a3 3 0 010-4.243m5.172-2.171a3 3 0 010-4.243L12 2.93 8.414 6.171a3 3 0 010 4.243" /></svg>; // A bit creative for unmute
const VideoOnIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
const VideoOffIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c1.61 0 3.093.59 4.232 1.572l-1.096 1.096A4.934 4.934 0 0012 7c-2.761 0-5 2.239-5 5 0 .342.042.675.118.996l-1.578 1.578A9.953 9.953 0 002.458 12zM12 19c4.477 0 8.268-2.943 9.542-7-.744-2.31-2.25-4.143-4.116-5.328l-1.88 1.88A4.953 4.953 0 0017 12c0 2.761-2.239 5-5 5a4.934 4.934 0 01-1.69-.328l-1.88 1.88C9.907 18.41 10.89 19 12 19z" /></svg>;
const EndCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" transform="rotate(-135 12 12)" /></svg>;


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
        const video = remoteVideoRef.current;
        if (video && remoteStream) {
            video.srcObject = remoteStream;
            
            // This logic is critical for cross-browser audio playback.
            // 1. The <video> element is `muted` and `autoPlay` by default.
            // 2. We explicitly call `play()`. The browser allows this because it's muted.
            // 3. Once the play promise resolves, we know the video is playing, so we can safely unmute.
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Success! Video is playing (silently). Now we can unmute.
                    video.muted = false;
                }).catch(error => {
                    console.error("Remote video auto-play failed. User may need to interact.", error);
                    // You might want to show an "unmute" button to the user here as a fallback.
                });
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
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        newX = Math.min(newX, parentRect.width - pipRef.current.offsetWidth);
        newY = Math.min(newY, parentRect.height - pipRef.current.offsetHeight);

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
                    <video ref={remoteVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`} />
                    {!remoteStream && (
                         <div className="absolute flex flex-col items-center pointer-events-none">
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
                           {isMuted ? <UnmuteIcon /> : <MuteIcon />}
                        </button>
                        <button 
                            onClick={toggleVideo} 
                            title={isVideoEnabled ? "Video Off" : "Video On"}
                             className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 text-2xl ${!isVideoEnabled ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                        >
                            {isVideoEnabled ? <VideoOnIcon /> : <VideoOffIcon />}
                        </button>
                        <button 
                            onClick={endCall} 
                            title="End Call"
                            className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white text-2xl font-semibold hover:scale-110"
                        >
                            <EndCallIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallWidget;