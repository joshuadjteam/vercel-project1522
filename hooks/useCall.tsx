import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { database } from '../services/database';

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
    isVideoEnabled: boolean;
    incomingCall: { from: string; isVideoCall: boolean; } | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    callDuration: number;
    startP2PCall: (callee: string, withVideo: boolean) => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleVideo: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isCalling, setIsCalling] = useState(false);
    const [callee, setCallee] = useState('');
    const [callStatus, setCallStatus] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [incomingCall, setIncomingCall] = useState<{ from: string; offer: RTCSessionDescriptionInit; isVideoCall: boolean; } | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callDuration, setCallDuration] = useState(0);

    // Call Logging refs
    const callTimerRef = useRef<number | null>(null);

    // P2P refs
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const callChannelRef = useRef<RealtimeChannel | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const isCallingRef = useRef(isCalling);
    const audioContextRef = useRef<AudioContext | null>(null);

    useEffect(() => {
        isCallingRef.current = isCalling;
    }, [isCalling]);
    
    const resetState = useCallback(() => {
        setIsCalling(false);
        setCallee('');
        setCallStatus('');
        setIsMuted(false);
        setIncomingCall(null);
        setLocalStream(null);
        setRemoteStream(null);
        setIsVideoEnabled(true);
        setCallDuration(0);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        callTimerRef.current = null;
        pendingCandidatesRef.current = [];
    }, []);

    const cleanupP2P = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
        peerConnectionRef.current?.close();
        peerConnectionRef.current = null;
        setLocalStream(null);
        setRemoteStream(null);
    }, []);
    
    const endCall = useCallback(() => {
        if (user) {
            const remoteUser = callee === user.username ? incomingCall?.from : callee;
            if (remoteUser) {
                supabase.channel(`call-channel-${remoteUser}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'end-call' }});
            }
        }
        cleanupP2P();
        resetState();
    }, [callee, user, cleanupP2P, resetState, callStatus, incomingCall?.from]);


    const handleSignalingData = useCallback(async (payload: any) => {
        if (!user) return;
        switch (payload.type) {
            case 'offer':
                if(isCallingRef.current) return;
                setIncomingCall({ from: payload.from, offer: payload.offer, isVideoCall: payload.isVideoCall });
                break;
            case 'answer':
                if (peerConnectionRef.current && peerConnectionRef.current.signalingState === 'have-local-offer') {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                    pendingCandidatesRef.current.forEach(candidate => {
                        peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {
                            console.error("Error adding queued ICE candidate", e);
                        });
                    });
                    pendingCandidatesRef.current = [];
                } else {
                    console.warn(`[P2P] Received answer in unexpected state: ${peerConnectionRef.current?.signalingState}. Ignoring.`);
                }
                break;
            case 'ice-candidate':
                try {
                    if (peerConnectionRef.current && payload.candidate && peerConnectionRef.current.signalingState !== 'closed') {
                        if (peerConnectionRef.current.remoteDescription) {
                            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                        } else {
                            pendingCandidatesRef.current.push(payload.candidate);
                        }
                    }
                } catch (e) {
                    console.error("Error adding received ICE candidate", e);
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

    const unlockAudio = useCallback(async () => {
        if (audioContextRef.current && audioContextRef.current.state === 'running') {
            return;
        }
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContext) return;
            
            const context = audioContextRef.current || new AudioContext();
            audioContextRef.current = context;

            if (context.state === 'suspended') {
                await context.resume();
            }
        } catch (e) {
            console.error("Failed to initialize or resume AudioContext:", e);
        }
    }, []);
    
    const startP2PCall = async (calleeUsername: string, withVideo: boolean) => {
        await unlockAudio();
        if (isCalling || !user) return;
        setIsCalling(true);
        setCallee(calleeUsername);
        setCallStatus(`Ringing ${calleeUsername}...`);
        setIsVideoEnabled(withVideo);
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            setLocalStream(stream);
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
                setRemoteStream(event.streams[0]);
                setCallStatus('Connected');
                callTimerRef.current = window.setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            await supabase.channel(`call-channel-${calleeUsername}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'offer', from: user.username, offer, isVideoCall: withVideo }});

        } catch (error) {
            console.error("Error starting P2P call:", error);
            setCallStatus('Call failed');
            endCall();
        }
    };
    
    const acceptCall = async () => {
        await unlockAudio();
        if (!incomingCall || !user) return;
        
        setIsCalling(true);
        setCallee(incomingCall.from);
        setCallStatus('Connecting...');
        setIsVideoEnabled(!!incomingCall.isVideoCall);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: !!incomingCall.isVideoCall });
            setLocalStream(stream);
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
                setRemoteStream(event.streams[0]);
                setCallStatus('Connected');
                callTimerRef.current = window.setInterval(() => {
                    setCallDuration(prev => prev + 1);
                }, 1000);
            };

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

            pendingCandidatesRef.current.forEach(candidate => {
                pc.addIceCandidate(new RTCIceCandidate(candidate));
            });
            pendingCandidatesRef.current = [];

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
        setIsMuted(newMutedState);
    
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = !newMutedState;
            });
        }
    };

    const toggleVideo = () => {
        const newVideoState = !isVideoEnabled;
        setIsVideoEnabled(newVideoState);
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = newVideoState;
            });
        }
    };

    return (
        <CallContext.Provider value={{ 
            isCalling, callee, callStatus, isMuted, isVideoEnabled, 
            incomingCall: incomingCall ? { from: incomingCall.from, isVideoCall: incomingCall.isVideoCall } : null, 
            localStream, remoteStream, callDuration,
            startP2PCall, acceptCall, declineCall, endCall, 
            toggleMute, toggleVideo 
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