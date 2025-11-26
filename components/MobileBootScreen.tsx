
import React, { useEffect, useState } from 'react';

interface MobileBootScreenProps {
    onComplete?: () => void;
}

const MobileBootScreen: React.FC<MobileBootScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Play Boot Sound
        const playSound = () => {
            try {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                if (!AudioContext) return;
                
                const ctx = new AudioContext();
                const t = ctx.currentTime;
                
                // Primary Tone (Rising)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(220, t); // A3
                osc1.frequency.exponentialRampToValueAtTime(880, t + 0.6); // A5
                gain1.gain.setValueAtTime(0, t);
                gain1.gain.linearRampToValueAtTime(0.3, t + 0.1);
                gain1.gain.exponentialRampToValueAtTime(0.01, t + 2.5);
                osc1.connect(gain1);
                gain1.connect(ctx.destination);
                osc1.start(t);
                osc1.stop(t + 2.5);

                // Harmony Tone (Slower Rise)
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'triangle';
                osc2.frequency.setValueAtTime(329.63, t); // E4
                osc2.frequency.exponentialRampToValueAtTime(659.25, t + 0.8); // E5
                gain2.gain.setValueAtTime(0, t);
                gain2.gain.linearRampToValueAtTime(0.15, t + 0.1);
                gain2.gain.exponentialRampToValueAtTime(0.01, t + 3);
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.start(t);
                osc2.stop(t + 3);

                // Bass Thrum
                const osc3 = ctx.createOscillator();
                const gain3 = ctx.createGain();
                osc3.type = 'sine';
                osc3.frequency.setValueAtTime(110, t); // A2
                gain3.gain.setValueAtTime(0, t);
                gain3.gain.linearRampToValueAtTime(0.4, t + 0.1);
                gain3.gain.linearRampToValueAtTime(0, t + 1.5);
                osc3.connect(gain3);
                gain3.connect(ctx.destination);
                osc3.start(t);
                osc3.stop(t + 2);

            } catch (e) {
                console.error("Boot sound failed", e);
            }
        };

        playSound();

        // Sequence timings (ms)
        const timings = [
            1000, // L
            1500, // Y
            2000, // N
            2500, // I
            3000, // X
            4000, // Loader appears
            9000  // Finish (Shortened slightly for better UX, adjust if needed)
        ];

        const timeouts: any[] = [];

        timings.forEach((time, index) => {
            const id = setTimeout(() => {
                setStep(index + 1);
                if (index === timings.length - 1 && onComplete) {
                    onComplete();
                }
            }, time);
            timeouts.push(id);
        });

        return () => {
            timeouts.forEach(clearTimeout);
        };
    }, [onComplete]);

    return (
        <div className="absolute inset-0 bg-black z-[99999] flex flex-col items-center justify-center overflow-hidden">
            <div className="relative flex items-center justify-center mb-20">
                {/* Letters */}
                <div className="flex space-x-1 text-6xl font-bold tracking-widest">
                    <span className={`transition-opacity duration-700 ${step >= 1 ? 'opacity-100 text-[#ff6b00]' : 'opacity-0'}`}>L</span>
                    <span className={`transition-opacity duration-700 ${step >= 2 ? 'opacity-100 text-[#00c853]' : 'opacity-0'}`}>Y</span>
                    <span className={`transition-opacity duration-700 ${step >= 3 ? 'opacity-100 text-white' : 'opacity-0'}`}>N</span>
                    <span className={`transition-opacity duration-700 ${step >= 4 ? 'opacity-100 text-[#6200ea]' : 'opacity-0'}`}>I</span>
                    <span className={`transition-opacity duration-700 ${step >= 5 ? 'opacity-100 text-[#00e5ff]' : 'opacity-0'}`}>X</span>
                </div>
            </div>

            {/* Loading Arc */}
            <div className={`transition-opacity duration-1000 ${step >= 6 ? 'opacity-100' : 'opacity-0'}`}>
                <div className="relative w-16 h-16 animate-spin">
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#ff6b00] border-r-[#00c853] border-b-[#6200ea] border-l-[#00e5ff] border-solid h-full w-full"></div>
                </div>
                <p className="text-white text-xs font-mono mt-8 text-center opacity-70 animate-pulse">Starting Lynix...</p>
            </div>
        </div>
    );
};

export default MobileBootScreen;
