
import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// --- Audio Encoding/Decoding Helpers for AI Call ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
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

    // P2P refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callChannelRef = useRef<RealtimeChannel | null>(null);

    // AI call refs
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const aiAudioRefs = useRef<{
        inputAudioContext: AudioContext | null,
        outputAudioContext: AudioContext | null,
        micSource: MediaStreamAudioSourceNode | null,
        gainNode: GainNode | null,
        scriptProcessor: ScriptProcessorNode | null,
        playbackSources: Set<AudioBufferSourceNode>,
        nextStartTime: number
    }>({ inputAudioContext: null, outputAudioContext: null, micSource: null, gainNode: null, scriptProcessor: null, playbackSources: new Set(), nextStartTime: 0 });

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
    }, []);

    const cleanupP2P = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
    }, []);

    const cleanupAI = useCallback(() => {
        aiAudioRefs.current.playbackSources.forEach(source => source.stop());
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        Object.assign(aiAudioRefs.current, { inputAudioContext: null, outputAudioContext: null, micSource: null, gainNode: null, scriptProcessor: null, playbackSources: new Set(), nextStartTime: 0 });
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
        resetState();
    }, [callType, callee, incomingCall, user, cleanupP2P, cleanupAI, resetState]);


    const handleSignalingData = useCallback(async (payload: any) => {
        if (!user) return;
        switch (payload.type) {
            case 'offer':
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
                endCall();
                break;
        }
    }, [user, callee, endCall]);
    
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

    const startAICall = async (persona: string) => {
        if (isCalling) return;
        setIsCalling(true);
        setCallType('ai');
        setCallee(persona);
        setCallStatus(`Connecting to ${persona}...`);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            localStreamRef.current = stream;
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            aiAudioRefs.current.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            aiAudioRefs.current.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            aiAudioRefs.current.nextStartTime = 0;
            
            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!aiAudioRefs.current.inputAudioContext || !localStreamRef.current) return;
                        setCallStatus(`Connected to ${persona}`);
                        const ctx = aiAudioRefs.current.inputAudioContext;
                        aiAudioRefs.current.micSource = ctx.createMediaStreamSource(localStreamRef.current);
                        aiAudioRefs.current.gainNode = ctx.createGain();
                        aiAudioRefs.current.scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
                        aiAudioRefs.current.scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            sessionPromiseRef.current?.then((s) => s.sendRealtimeInput({ media: createBlob(inputData) }));
                        };
                        aiAudioRefs.current.micSource.connect(aiAudioRefs.current.gainNode);
                        aiAudioRefs.current.gainNode.connect(aiAudioRefs.current.scriptProcessor);
                        aiAudioRefs.current.scriptProcessor.connect(ctx.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        const ctx = aiAudioRefs.current.outputAudioContext;
                        if (base64Audio && ctx) {
                            aiAudioRefs.current.nextStartTime = Math.max(aiAudioRefs.current.nextStartTime, ctx.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                            const source = ctx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(ctx.destination);
                            source.addEventListener('ended', () => aiAudioRefs.current.playbackSources.delete(source));
                            source.start(aiAudioRefs.current.nextStartTime);
                            aiAudioRefs.current.nextStartTime += audioBuffer.duration;
                            aiAudioRefs.current.playbackSources.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => endCall(),
                    onclose: () => endCall(),
                },
                config: { responseModalities: [Modality.AUDIO], systemInstruction: `You are ${persona}. Be friendly and concise.` },
            });
        } catch (error) {
            console.error('Failed to start AI call:', error);
            setCallStatus('Failed to start call');
            endCall();
        }
    };
    
    const startP2PCall = async (calleeUsername: string) => {
        if (isCalling || !user) return;
        setIsCalling(true);
        setCallType('p2p');
        setCallee(calleeUsername);
        setCallStatus(`Ringing ${calleeUsername}...`);
        
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
        setIncomingCall(null);
    };

    const toggleMute = () => {
        const newMutedState = !isMuted;
        if (callType === 'p2p' && localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
        } else if (callType === 'ai' && aiAudioRefs.current.gainNode) {
            aiAudioRefs.current.gainNode.gain.setValueAtTime(newMutedState ? 0 : 1, aiAudioRefs.current.inputAudioContext?.currentTime || 0);
        }
        setIsMuted(newMutedState);
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
