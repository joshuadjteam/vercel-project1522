
import React, { useRef, useEffect, useState } from 'react';
import { Page } from '../../types';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const SwitchCameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;

interface MobiCameraAppProps {
    navigate: (page: Page) => void;
}

const MobiCameraApp: React.FC<MobiCameraAppProps> = ({ navigate }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err: any) {
                console.error("Camera access denied:", err);
                setError("Camera access denied or not available.");
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className="w-full h-full bg-black relative flex flex-col">
            {/* Viewfinder */}
            <div className="flex-grow relative overflow-hidden bg-black">
                {error ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                        <p>{error}</p>
                    </div>
                ) : (
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}
            </div>

            {/* UI Overlay */}
            <div className="absolute top-4 left-4 z-20">
                <button onClick={() => navigate('home')} className="p-2">
                    <BackIcon />
                </button>
            </div>

            {/* Controls */}
            <div className="h-32 bg-black/40 backdrop-blur-sm absolute bottom-0 left-0 right-0 flex items-center justify-around z-20">
                <button className="p-4 rounded-full bg-black/20">
                    {/* Gallery placeholder */}
                    <div className="w-10 h-10 bg-gray-600 rounded-full border-2 border-white"></div>
                </button>
                
                <button className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full transition-transform active:scale-90"></div>
                </button>

                <button className="p-4 rounded-full">
                    <SwitchCameraIcon />
                </button>
            </div>
        </div>
    );
};

export default MobiCameraApp;
