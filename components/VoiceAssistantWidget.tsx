import React, { useState, useEffect, useRef } from 'react';
import { database } from '../services/database';

interface VoiceAssistantWidgetProps {
    isOpen: boolean;
    onClose: () => void;
}

type Status = 'idle' | 'listening' | 'processing' | 'speaking' | 'error';
type ErrorType = 'browser' | 'permission' | 'no-speech' | 'network' | 'unknown';

const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({ isOpen, onClose }) => {
    const [status, setStatus] = useState<Status>('idle');
    const [userTranscript, setUserTranscript] = useState('');
    const [aiTranscript, setAiTranscript] = useState('');
    const [error, setError] = useState<{ type: ErrorType, message: string } | null>(null);
    const recognitionRef = useRef<any>(null); // Using `any` for SpeechRecognition for cross-browser compatibility

    const resetState = () => {
        setStatus('idle');
        setUserTranscript('');
        setAiTranscript('');
        setError(null);
    }

    const handleError = (type: ErrorType, message: string) => {
        setError({ type, message });
        setStatus('error');
    };

    const getStatusText = () => {
        switch (status) {
            case 'idle':
                return 'Click the orb to speak';
            case 'listening':
                return 'Listening...';
            case 'processing':
                return 'Thinking...';
            case 'speaking':
                return ''; // Show transcript instead
            case 'error':
                return error?.message || 'An error occurred';
            default:
                return '';
        }
    };
    
    const processSpeech = async (transcript: string) => {
        setStatus('processing');
        setUserTranscript(transcript);
        setAiTranscript('');
        setError(null);
        try {
            const response = await database.getVoiceResponse(transcript);
            setAiTranscript(response.transcription);
            setStatus('speaking');
            
            const audio = new Audio(response.audioDataUrl);
            audio.play();
            
            audio.onended = () => {
                resetState();
            };
        } catch (e: any) {
            console.error("Error processing voice command:", e);
            handleError('network', e.message || "Could not connect to the voice service.");
        }
    };

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            handleError('browser', "Sorry, your browser doesn't support voice recognition.");
            return;
        }

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        
        resetState();

        const recognition = new SpeechRecognition();
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setStatus('listening');
        };
        
        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }
            setUserTranscript(interimTranscript);

            if (finalTranscript) {
                processSpeech(finalTranscript.trim());
                recognition.stop();
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                handleError('permission', 'Microphone permission denied. Please allow it in your browser settings.');
            } else if (event.error === 'no-speech') {
                handleError('no-speech', 'No speech was detected. Please try again.');
            } else {
                handleError('unknown', 'An unknown speech recognition error occurred.');
            }
        };

        recognition.onend = () => {
            if (status === 'listening') { // Ends without a final result
                setStatus('idle');
            }
        };

        recognition.start();
        recognitionRef.current = recognition;
    };
    
    useEffect(() => {
        if (!isOpen) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            resetState();
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-center z-[100] animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-2xl text-center text-white p-4" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={status === 'idle' || status === 'error' ? startListening : undefined}
                    className="w-48 h-48 rounded-full border-4 border-cyan-400/50 flex items-center justify-center transition-all duration-300 relative group"
                    style={{
                        boxShadow: `0 0 30px rgba(0, 255, 255, ${status === 'listening' || status === 'speaking' ? 0.7 : 0.3})`,
                        transform: `scale(${status === 'listening' ? 1.1 : 1})`,
                    }}
                >
                    <div className={`w-full h-full rounded-full bg-cyan-500/30 transition-all duration-500 absolute ${status === 'listening' || status === 'speaking' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-5xl transition-transform duration-300 group-hover:scale-110">🎤</span>
                </button>
                <p className={`mt-8 text-2xl font-semibold h-8 transition-opacity duration-300 ${status === 'error' ? 'text-red-400' : ''}`}>{getStatusText()}</p>
                
                <div className="mt-4 min-h-[100px] text-lg text-gray-300 flex flex-col justify-center items-center p-4">
                    {userTranscript && !aiTranscript && (
                        <p className="opacity-70 animate-fade-in">{userTranscript}</p>
                    )}
                    {aiTranscript && (
                         <p className="mt-2 font-semibold text-cyan-300 animate-fade-in">{aiTranscript}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistantWidget;