
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LockScreenProps {
    isLocked: boolean;
    onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ isLocked, onUnlock }) => {
    const { user } = useAuth();
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [hasPin, setHasPin] = useState(false);
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        if (user) {
            const storedPin = localStorage.getItem(`lynix_pin_${user.id}`);
            setHasPin(!!storedPin);
        }
    }, [user, isLocked]);

    useEffect(() => {
        if (!isLocked) {
            setPin('');
            setError('');
        }
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, [isLocked]);

    const handleNumberClick = (num: string) => {
        if (pin.length < 4) {
            const newPin = pin + num;
            setPin(newPin);
            if (newPin.length === 4) {
                verifyPin(newPin);
            }
        }
    };

    const verifyPin = (inputPin: string) => {
        if (!user) return;
        const storedPin = localStorage.getItem(`lynix_pin_${user.id}`);
        
        if (storedPin === inputPin) {
            onUnlock();
        } else {
            setError('Incorrect PIN');
            setTimeout(() => {
                setPin('');
                setError('');
            }, 1000);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 bg-black z-[10000] flex flex-col items-center justify-between pb-10 text-white font-sans animate-fade-in">
            <div className="mt-20 flex flex-col items-center">
                <div className="text-7xl font-light tracking-tight mb-2">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </div>
                <div className="text-lg font-medium text-gray-400">
                    {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {!hasPin ? (
                <div className="flex flex-col items-center mb-20 animate-bounce">
                    <p className="mb-4 text-gray-400">Swipe up to unlock</p>
                    <button 
                        onClick={onUnlock}
                        className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                    </button>
                </div>
            ) : (
                <div className="w-full px-8">
                    <div className="flex justify-center space-x-4 mb-8">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`w-4 h-4 rounded-full border-2 border-white transition-colors ${i < pin.length ? 'bg-white' : 'bg-transparent'}`}></div>
                        ))}
                    </div>
                    {error && <p className="text-center text-red-400 mb-4">{error}</p>}
                    
                    <div className="grid grid-cols-3 gap-y-6 gap-x-8 justify-items-center max-w-xs mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button 
                                key={num} 
                                onClick={() => handleNumberClick(num.toString())}
                                className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-medium transition-colors"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="w-16"></div>
                        <button 
                            onClick={() => handleNumberClick('0')}
                            className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl font-medium transition-colors"
                        >
                            0
                        </button>
                        <button 
                            onClick={handleBackspace}
                            className="w-16 h-16 rounded-full flex items-center justify-center text-xl hover:bg-white/10 transition-colors"
                        >
                            ⌫
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LockScreen;
