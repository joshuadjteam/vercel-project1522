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
    const [isMuted, setIsMuted] = useState(false);

    const recognitionRef = useRef<any>(null); // Using `any` for SpeechRecognition for cross-browser compatibility
    const audioRef = useRef<HTMLAudioElement | null>(null);

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
                return 'Click the mic to speak';
            case 'listening':
                return 'Listening...';
            case 'processing':
                return 'Thinking...';
            case 'speaking':
                return aiTranscript ? '' : 'Speaking...';
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
            
            audioRef.current = new Audio(response.audioDataUrl);
            audioRef.current.muted = isMuted;
            audioRef.current.play();
            
            audioRef.current.onended = () => {
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
            setUserTranscript(interimTranscript || finalTranscript);

            if (finalTranscript) {
                processSpeech(finalTranscript.trim());
                recognition.stop();
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                handleError('permission', 'Microphone permission denied.');
            } else if (event.error === 'no-speech') {
                handleError('no-speech', 'No speech was detected. Try again.');
            } else {
                handleError('unknown', 'A speech recognition error occurred.');
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
    
    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
        if (audioRef.current) {
            audioRef.current.muted = newMutedState;
        }
    };

    useEffect(() => {
        if (!isOpen) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
            resetState();
        }
    }, [isOpen]);

    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex flex-col items-center justify-between z-[100] animate-fade-in p-8">
            <div className="w-full text-center text-white mt-20">
                <p className={`text-2xl font-semibold h-8 transition-opacity duration-300 ${status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>{getStatusText()}</p>
                <div className="mt-4 min-h-[100px] text-lg flex flex-col justify-center items-center p-4">
                    {userTranscript && (
                        <p className="opacity-70 animate-fade-in">{userTranscript}</p>
                    )}
                    {aiTranscript && (
                         <p className="mt-2 text-2xl font-semibold text-cyan-300 animate-fade-in">{aiTranscript}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-center items-center space-x-8">
                <button 
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    className={`h-16 w-16 rounded-full flex items-center justify-center transition-all duration-300 text-3xl ${isMuted ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'}`}
                >
                   {isMuted ? '🔇' : '🔊'}
                </button>

                <button 
                    onClick={status === 'idle' || status === 'error' ? startListening : undefined}
                    title="Speak"
                    className={`h-20 w-20 rounded-full flex items-center justify-center transition-all duration-300 text-4xl text-white ${status === 'listening' ? 'bg-red-600 animate-pulse' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    🎤
                </button>
                
                <button 
                    onClick={onClose}
                    title="End"
                    className="h-16 w-16 rounded-full flex items-center justify-center transition-transform bg-red-600 hover:bg-red-700 text-white text-3xl hover:scale-110"
                >
                    📞
                </button>
            </div>
        </div>
    );
};

export default VoiceAssistantWidget;