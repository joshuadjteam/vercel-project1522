
import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { database } from '../services/database';
import { CallRecord } from '../types';

// FIX: Add TypeScript definitions for the non-standard Web Speech API to resolve errors.
// This provides the `SpeechRecognition` type and adds `SpeechRecognition` and
// `webkitSpeechRecognition` to the global `Window` object.
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
}
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    onend: (() => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    start: () => void;
    stop: () => void;
}
declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}


// --- Audio Encoding/Decoding Helpers ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

interface CallContextType {
    isCalling: boolean;
    callee: string;
    callStatus: string;
    isMuted: boolean;
    showKeypad: boolean;
    keypadInput: string;
    incomingCall: { from: string } | null;
    remoteStream: MediaStream | null;
    startP2PCall: (callee: string) => void;
    startAICall: (persona: string) => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleKeypad: () => void;
    handleKeypadInput: (key: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isCalling, setIsCalling] = useState(false);
    const [callType, setCallType] = useState<'p2p' | 'ai' | 'none'>('none');
    const [callee, setCallee] = useState('');
    const [callStatus, setCallStatus] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [keypadInput, setKeypadInput] = useState('');
    const [incomingCall, setIncomingCall] = useState<{ from: string; offer: RTCSessionDescriptionInit; } | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    // Call Logging refs
    const callStartTimeRef = useRef<number | null>(null);
    const callDirectionRef = useRef<'incoming' | 'outgoing' | null>(null);

    // P2P refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callChannelRef = useRef<RealtimeChannel | null>(null);

    // AI call refs
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const isPlayingAudioRef = useRef(false);
    const isCallingRef = useRef(isCalling);
    const isMutedRef = useRef(isMuted);
    const aiAudioRefs = useRef<{
        outputAudioContext: AudioContext | null,
        playbackSources: Set<AudioBufferSourceNode>,
    }>({ outputAudioContext: null, playbackSources: new Set() });

    useEffect(() => {
        isCallingRef.current = isCalling;
    }, [isCalling]);
    
    useEffect(() => {
        isMutedRef.current = isMuted;
    }, [isMuted]);

    const resetState = useCallback(() => {
        setIsCalling(false);
        setCallType('none');
        setCallee('');
        setCallStatus('');
        setIsMuted(false);
        setShowKeypad(false);
        setKeypadInput('');
        setIncomingCall(null);
        setRemoteStream(null);
        callStartTimeRef.current = null;
        callDirectionRef.current = null;
    }, []);

    const cleanupP2P = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
    }, []);

    const cleanupAI = useCallback(() => {
        if (speechRecognitionRef.current) {
            speechRecognitionRef.current.onresult = null;
            speechRecognitionRef.current.onend = null;
            speechRecognitionRef.current.onerror = null;
            speechRecognitionRef.current.stop();
            speechRecognitionRef.current = null;
        }
        aiAudioRefs.current.playbackSources.forEach(source => source.stop());
        aiAudioRefs.current.outputAudioContext?.close();
        isPlayingAudioRef.current = false;
        Object.assign(aiAudioRefs.current, { outputAudioContext: null, playbackSources: new Set() });
    }, []);
    
    const endCall = useCallback(() => {
        if (callType === 'p2p' && user) {
            const remoteUser = callee === user.username ? incomingCall?.from : callee;
            if (remoteUser) {
                supabase.channel(`call-channel-${remoteUser}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'end-call' }});
            }
            cleanupP2P();
        } else if (callType === 'ai') {
            cleanupAI();
        }

        // Log the call
        if (callStartTimeRef.current && user && callDirectionRef.current) {
            const duration = Math.round((Date.now() - callStartTimeRef.current) / 1000);
            
            let status: CallRecord['status'] = 'ended';
            let remoteUser = callee;

            if (callType === 'p2p') {
                remoteUser = callDirectionRef.current === 'outgoing' ? callee : (incomingCall?.from || '');
                if (callStatus === 'Connected') {
                    status = 'answered';
                } else if (callStatus === 'Call Declined') {
                    status = 'declined';
                }
            } else if (callType === 'ai') {
                status = 'ai_call';
            }
    
            if (remoteUser) {
                const record: Omit<CallRecord, 'id' | 'owner' | 'timestamp'> = {
                    caller_username: callDirectionRef.current === 'outgoing' ? user.username : remoteUser,
                    callee_username: callDirectionRef.current === 'outgoing' ? remoteUser : user.username,
                    direction: callDirectionRef.current,
                    status,
                    duration
                };
                database.addCallHistoryRecord(record);
            }
        }

        resetState();
    }, [callType, callee, incomingCall, user, cleanupP2P, cleanupAI, resetState, callStatus]);


    const handleSignalingData = useCallback(async (payload: any) => {
        if (!user) return;
        switch (payload.type) {
            case 'offer':
                // Do not show incoming call if already in a call
                if(isCallingRef.current) return;
                setIncomingCall({ from: payload.from, offer: payload.offer });
                break;
            case 'answer':
                if (peerConnectionRef.current) {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                }
                break;
            case 'ice-candidate':
                if (peerConnectionRef.current && payload.candidate) {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
                break;
            case 'decline':
                if (callee === payload.from) {
                    setCallStatus('Call Declined');
                    setTimeout(() => endCall(), 2000);
                }
                break;
            case 'end-call':
                // if the other user ends the call, we also log it as a missed call if it was ringing.
                if (callStatus.startsWith('Ringing') && callDirectionRef.current === 'outgoing') {
                     // This case is when the caller hangs up, the callee should see a missed call.
                     // The caller's endCall will be logged as 'ended'. The callee isn't in a call yet so won't log.
                     // This is tricky to handle perfectly without a dedicated signaling server.
                     // The current approach logs from the active client. Missed calls for offline users are not logged.
                }
                endCall();
                break;
        }
    }, [user, callee, endCall, callStatus]);
    
    useEffect(() => {
        if (!user || user.role === 'Trial') return;

        const channel = supabase.channel(`call-channel-${user.username}`);
        channel.on('broadcast', { event: 'call-event' }, ({ payload }) => {
            handleSignalingData(payload);
        }).subscribe();
        callChannelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, handleSignalingData]);

    const playAudio = useCallback((audioBuffer: AudioBuffer) => {
        const ctx = aiAudioRefs.current.outputAudioContext;
        if (!ctx) return;

        // Prevent playing if muted
        if (isMutedRef.current) {
            setCallStatus("Muted");
            return;
        }
        
        isPlayingAudioRef.current = true;
        setCallStatus("Speaking...");
    
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        aiAudioRefs.current.playbackSources.add(source);
    
        source.onended = () => {
            aiAudioRefs.current.playbackSources.delete(source);
            isPlayingAudioRef.current = false;
            if (isCallingRef.current && !isMutedRef.current) {
                speechRecognitionRef.current?.start();
                setCallStatus("Listening...");
            } else if (isCallingRef.current && isMutedRef.current) {
                setCallStatus("Muted");
            }
        };
        
        source.start();
    }, []);

    const handleUserTranscript = useCallback(async (transcript: string, persona: string) => {
        if (!transcript) {
            if (isCallingRef.current && !isMutedRef.current) {
                 speechRecognitionRef.current?.start();
                 setCallStatus("Listening...");
            }
            return;
        }
        
        const restartListening = (errorMsg: string, shouldRetry = true) => {
             if (isCallingRef.current) {
                setCallStatus(errorMsg);
                if (shouldRetry) {
                    setTimeout(() => {
                        if (isCallingRef.current && !isMutedRef.current) {
                            speechRecognitionRef.current?.start();
                            setCallStatus("Listening...");
                        } else if (isCallingRef.current && isMutedRef.current) {
                            setCallStatus("Muted");
                        }
                    }, 2000);
                }
            }
        };

        const aiTextResponse = await geminiService.getAIPersonaResponse(transcript, persona);
        
        if (!aiTextResponse || !isCallingRef.current) {
            restartListening("AI Error. Retrying...");
            return;
        }
    
        const ttsResult = await geminiService.getAITextToSpeech(aiTextResponse);
    
        if (ttsResult.audio && aiAudioRefs.current.outputAudioContext && isCallingRef.current) {
            try {
                const audioBuffer = await decodeAudioData(decode(ttsResult.audio), aiAudioRefs.current.outputAudioContext, 24000, 1);
                playAudio(audioBuffer);
            } catch (e) {
                console.error("Error decoding or playing TTS audio:", e);
                restartListening("Audio Error. Retrying...");
            }
        } else {
            console.error("Failed to get TTS audio. Reason:", ttsResult.error);
            if (ttsResult.error === 'api_key_missing') {
                restartListening("AI Service Unavailable", false);
            } else {
                restartListening("AI Voice Error. Retrying...");
            }
        }
    }, [playAudio]);
    
    const startAICall = async (persona: string) => {
        if (isCalling) return;
    
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            setIsCalling(true);
            setCallType('ai');
            setCallee(persona);
            setCallStatus('Browser not supported.');
            return;
        }
    
        setIsCalling(true);
        setCallType('ai');
        setCallee(persona);
        setCallStatus("Muted");
        setIsMuted(true);
        callStartTimeRef.current = Date.now();
        callDirectionRef.current = 'outgoing';
    
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = false;
        recognition.interimResults = false;
        speechRecognitionRef.current = recognition;
    
        aiAudioRefs.current.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            setCallStatus("Thinking...");
            recognition.stop();
            handleUserTranscript(transcript, persona);
        };
        
        recognition.onend = () => {
            // This is intentionally left blank. The logic to restart recognition is handled
            // after audio playback finishes or in the onerror handler, preventing a race
            // condition where recognition would restart before the AI could process the transcript.
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' || event.error === 'audio-capture') {
                if (isCallingRef.current && !isMutedRef.current && !isPlayingAudioRef.current) {
                     setCallStatus("Listening...");
                     recognition.start();
                }
            } else {
                setCallStatus("Mic Error");
            }
        };
    };
    
    const startP2PCall = async (calleeUsername: string) => {
        if (isCalling || !user) return;
        setIsCalling(true);
        setCallType('p2p');
        setCallee(calleeUsername);
        setCallStatus(`Ringing ${calleeUsername}...`);
        callStartTimeRef.current = Date.now();
        callDirectionRef.current = 'outgoing';
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            
            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    supabase.channel(`call-channel-${calleeUsername}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'ice-candidate', from: user.username, candidate: event.candidate }});
                }
            };
            
            pc.ontrack = (event) => {
                const stream = new MediaStream();
                stream.addTrack(event.track);
                setRemoteStream(stream);
                setCallStatus('Connected');
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await supabase.channel(`call-channel-${calleeUsername}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'offer', from: user.username, offer }});

        } catch (error) {
            console.error("Error starting P2P call:", error);
            setCallStatus('Call failed');
            endCall();
        }
    };
    
    const acceptCall = async () => {
        if (!incomingCall || !user) return;
        
        setIsCalling(true);
        setCallType('p2p');
        setCallee(incomingCall.from);
        setCallStatus('Connecting...');
        callStartTimeRef.current = Date.now();
        callDirectionRef.current = 'incoming';

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            
            const pc = new RTCPeerConnection(iceServers);
            peerConnectionRef.current = pc;
            
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    supabase.channel(`call-channel-${incomingCall.from}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'ice-candidate', from: user.username, candidate: event.candidate }});
                }
            };

            pc.ontrack = (event) => {
                const newStream = new MediaStream();
                newStream.addTrack(event.track);
                setRemoteStream(newStream);
                setCallStatus('Connected');
            };

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            await supabase.channel(`call-channel-${incomingCall.from}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'answer', from: user.username, answer }});
            setIncomingCall(null);

        } catch(error) {
            console.error("Error accepting call:", error);
            endCall();
        }
    };
    
    const declineCall = () => {
        if (!incomingCall || !user) return;
        supabase.channel(`call-channel-${incomingCall.from}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'decline', from: user.username }});
        
        const record: Omit<CallRecord, 'id' | 'owner' | 'timestamp'> = {
            caller_username: incomingCall.from,
            callee_username: user.username,
            direction: 'incoming',
            status: 'declined',
            duration: 0
        };
        database.addCallHistoryRecord(record);
        
        setIncomingCall(null);
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        setIsMuted(newMutedState);
    
        if (callType === 'ai' && speechRecognitionRef.current) {
            if (newMutedState) {
                speechRecognitionRef.current.stop();
                setCallStatus("Muted");
            } else {
                if (!isPlayingAudioRef.current) {
                    speechRecognitionRef.current.start();
                    setCallStatus("Listening...");
                }
            }
        } else if (callType === 'p2p' && localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
        }
    };

    const toggleKeypad = () => setShowKeypad(prev => !prev);
    const handleKeypadInput = (key: string) => setKeypadInput(prev => prev + key);

    return (
        <CallContext.Provider value={{ 
            isCalling, callee, callStatus, isMuted, showKeypad, keypadInput, incomingCall: incomingCall ? { from: incomingCall.from } : null, remoteStream,
            startP2PCall, startAICall, acceptCall, declineCall, endCall, 
            toggleMute, toggleKeypad, handleKeypadInput 
        }}>
            {children}
        </CallContext.Provider>
    );
};

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};