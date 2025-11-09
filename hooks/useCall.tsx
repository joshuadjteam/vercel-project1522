
import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { database } from '../services/database';
import { CallRecord } from '../types';

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
    const isCallingRef = useRef(isCalling);

    useEffect(() => {
        isCallingRef.current = isCalling;
    }, [isCalling]);
    
    const resetState = useCallback(() => {
        setIsCalling(false);
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
    
    const endCall = useCallback(() => {
        if (user) {
            const remoteUser = callee === user.username ? incomingCall?.from : callee;
            if (remoteUser) {
                supabase.channel(`call-channel-${remoteUser}`).send({ type: 'broadcast', event: 'call-event', payload: { type: 'end-call' }});
            }
            cleanupP2P();
        }

        // Log the call
        if (callStartTimeRef.current && user && callDirectionRef.current) {
            const duration = Math.round((Date.now() - callStartTimeRef.current) / 1000);
            
            let status: CallRecord['status'] = 'ended';
            const remoteUser = callDirectionRef.current === 'outgoing' ? callee : (incomingCall?.from || '');

            if (callStatus === 'Connected') {
                status = 'answered';
            } else if (callStatus === 'Call Declined') {
                status = 'declined';
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
    }, [callee, incomingCall, user, cleanupP2P, resetState, callStatus]);


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
    
    const startP2PCall = async (calleeUsername: string) => {
        if (isCalling || !user) return;
        setIsCalling(true);
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
    
        if (localStreamRef.current) {
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
            startP2PCall, acceptCall, declineCall, endCall, 
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