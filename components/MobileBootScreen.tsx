
import React, { useEffect, useState } from 'react';

interface MobileBootScreenProps {
    onComplete?: () => void;
}

const MobileBootScreen: React.FC<MobileBootScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Sequence timings (ms)
        const timings = [
            1000, // L
            1500, // Y
            2000, // N
            2500, // I
            3000, // X
            4000, // Loader appears
            15000 // Finish
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
            </div>
        </div>
    );
};

export default MobileBootScreen;
