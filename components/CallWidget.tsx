import React from 'react';
import { useCall } from '../hooks/useCall';

const MuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const UnmuteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15.586a3 3 0 014.242 0L12 17.757l2.172-2.171a3 3 0 014.242 0M9 12a3 3 0 116 0v6a3 3 0 01-6 0v-6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.586 15.586a3 3 0 010 4.243L12 23.07l-3.586-3.24a3 3 0 010-4.243m5.172-2.171a3 3 0 010-4.243L12 2.93 8.414 6.171a3 3 0 010 4.243" /></svg>;
const EndCallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.01,16.46c-2.3,0-4.52-0.62-6.52-1.75l-2.12,2.12c-0.39,0.39-1.02,0.39-1.41,0l-1.42-1.42c-0.39-0.39-0.39-1.02,0-1.41l2.12-2.12C1.62,10.04,1,7.82,1,5.52c0-0.41,0.34-0.75,0.75-0.75h4c0.35,0,0.66,0.24,0.74,0.58l0.85,3.83c0.07,0.32-0.01,0.66-0.23,0.9L5.5,11.53c0.95,1.86,2.5,3.4,4.37,4.37l1.45-1.45c0.23-0.23,0.58-0.3,0.9-0.23l3.83,0.85c0.34,0.08,0.58,0.39,0.58,0.74v4c0,0.41-0.34,0.75-0.75,0.75C17.3,21,14.67,20.08,12.01,16.46z" transform="rotate(-135 12 12)" /></svg>;


const CallWidget: React.FC = () => {
    const { 
        isCalling, callee, callStatus, endCall,
        isMuted, toggleMute, 
        callDuration,
    } = useCall();
    
    if (!isCalling || callStatus.startsWith('Ringing')) {
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
        } else {
            content = <span className="text-yellow-400">{callStatus}</span>;
        }
        return <p className="text-lg truncate">{content}</p>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-lg flex items-center justify-center z-[100] animate-fade-in">
            <div className="bg-gray-800/80 border border-gray-700 rounded-2xl shadow-2xl text-white w-full max-w-sm h-auto flex flex-col p-8 items-center justify-center">
                
                <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center font-bold text-6xl text-white mb-6 ring-4 ring-blue-500/30">
                    {callee.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-4xl font-semibold">{callee}</h2>
                <div className="h-8 mt-1">
                    <StatusIndicator />
                </div>

                <div className="flex justify-center items-center space-x-6 mt-8">
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
        </div>
    );
};

export default CallWidget;