
import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
// FIX: Import database service to check if user exists before call.
import { database } from '../services/database';

interface CallContextType {
    isCalling: boolean;
    callee: string;
    callStatus: string;
    isMuted: boolean;
    incomingCall: { from: string; isVideoCall: boolean; } | null;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    isVideoCall: boolean;
    callDuration: number;
    startP2PCall: (callee: string, withVideo: boolean) => void;
    acceptCall: () => void;
    declineCall: () => void;
    endCall: (targetOverride?: string) => void;
    toggleMute: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun.l.google.com:5349" },
    { urls: "stun:stun1.l.google.com:3478" },
    { urls: "stun:stun1.l.google.com:5349" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:5349" },
    { urls: "stun:stun3.l.google.com:3478" },
    { urls: "stun:stun3.l.google.com:5349" },
    { urls: "stun:stun4.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:5349" },
    { urls: 'stun:stun.services.mozilla.com' },
];

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isLoggedIn } = useAuth();
    const [isCalling, setIsCalling] = useState(false);
    const [callee, setCallee] = useState('');
    const [callStatus, setCallStatus] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [incomingCall, setIncomingCall] = useState<{ from: string; isVideoCall: boolean; } | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [callDuration, setCallDuration] = useState(0);

    const pc = useRef<RTCPeerConnection | null>(null);
    const channel = useRef<any | null>(null);
    const offerForIncomingCall = useRef<RTCSessionDescriptionInit | null>(null);
    const callTimeoutRef = useRef<number | null>(null);
    const callDurationIntervalRef = useRef<number | null>(null);
    
    // Using refs for state and callbacks to ensure stability inside async functions and useEffect cleanup
    const stateRef = useRef({ user, isCalling, callee, callStatus, incomingCall, localStream });
    stateRef.current = { user, isCalling, callee, callStatus, incomingCall, localStream };

    const stableSendMessage = useCallback(async (target: string, type: string, payload: any) => {
        if (!stateRef.current.user) {
            console.error("Cannot send message, user is not defined.");
            return;
        }
        const { error } = await supabase.from('webrtc_signaling').insert({
            sender_username: stateRef.current.user.username,
            recipient_username: target,
            type,
            payload,
        });
        if (error) {
            console.error("Failed to send signaling message:", error);
            setCallStatus("Error: Signaling failed");
        }
    }, []);

    const stableEndCall = useCallback((targetOverride?: string) => {
        const target = targetOverride || stateRef.current.callee || stateRef.current.incomingCall?.from;
        if (target && stateRef.current.user) {
            stableSendMessage(target, 'call-ended', { from: stateRef.current.user.username });
        }
        if (pc.current) { pc.current.close(); pc.current = null; }
        if (stateRef.current.localStream) {
            stateRef.current.localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        if (callTimeoutRef.current) { window.clearTimeout(callTimeoutRef.current); callTimeoutRef.current = null; }
        if (callDurationIntervalRef.current) { window.clearInterval(callDurationIntervalRef.current); callDurationIntervalRef.current = null; }
        setRemoteStream(null); setIsVideoCall(false); setIsCalling(false); setCallee(''); setCallStatus(''); setCallDuration(0); setIncomingCall(null);
        offerForIncomingCall.current = null;
    }, [stableSendMessage]);
    
    const createPeerConnection = useCallback(async (targetUsername: string, stream: MediaStream): Promise<RTCPeerConnection> => {
        pc.current = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });
        stream.getTracks().forEach(track => pc.current?.addTrack(track, stream));
        pc.current.onicecandidate = e => { if (e.candidate) stableSendMessage(targetUsername, 'ice-candidate', { candidate: e.candidate }); };
        pc.current.ontrack = e => setRemoteStream(e.streams[0]);
        pc.current.onconnectionstatechange = () => {
            if (pc.current?.connectionState === 'connected') {
                setCallStatus('Connected');
                if (callDurationIntervalRef.current) window.clearInterval(callDurationIntervalRef.current);
                callDurationIntervalRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
            } else if (['disconnected', 'failed', 'closed'].includes(pc.current?.connectionState || '')) {
                stableEndCall(targetUsername);
            }
        };
        return pc.current;
    }, [stableSendMessage, stableEndCall]);

    useEffect(() => {
        if (isLoggedIn && user?.username) {
            const realtimeChannel = supabase.channel(`webrtc-signaling-${user.username}`);
            channel.current = realtimeChannel;

            realtimeChannel.on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'webrtc_signaling',
                filter: `recipient_username=eq.${user.username}`,
            }, async (payload) => {
                const msg = {
                    from: payload.new.sender_username,
                    type: payload.new.type,
                    payload: payload.new.payload
                };
                
                switch (msg.type) {
                    case 'incoming-call': setIncomingCall({ from: msg.from, isVideoCall: msg.payload.isVideoCall }); offerForIncomingCall.current = msg.payload.offer; break;
                    case 'call-accepted': if (pc.current && stateRef.current.callee === msg.from) { try { await pc.current.setRemoteDescription(new RTCSessionDescription(msg.payload.answer)); setCallStatus('Connecting...'); if (callTimeoutRef.current) window.clearTimeout(callTimeoutRef.current); } catch(e) { console.error("Error setting remote desc:", e); setCallStatus("Error: Connection failed"); setTimeout(() => stableEndCall(msg.from), 2000); } } break;
                    case 'call-declined': if (stateRef.current.isCalling && stateRef.current.callee === msg.from) { setCallStatus('Call Declined'); setTimeout(() => stableEndCall(msg.from), 2000); } break;
                    case 'call-ended': if (stateRef.current.isCalling) { stableEndCall(msg.from); } break;
                    case 'ice-candidate': if (pc.current && msg.payload.candidate) { try { await pc.current.addIceCandidate(new RTCIceCandidate(msg.payload.candidate)); } catch (e) { console.error("Error adding ICE candidate:", e); } } break;
                }
            }).subscribe();

            return () => {
                if (channel.current) {
                    supabase.removeChannel(channel.current);
                    channel.current = null;
                }
            };
        }
    }, [isLoggedIn, user?.username, stableEndCall]);

    const startP2PCall = useCallback(async (calleeUsername: string, withVideo: boolean) => {
        try {
            if (!stateRef.current.user) throw new Error("User not logged in.");
            setIsCalling(true); setCallStatus('Calling...'); setIsVideoCall(withVideo); setCallee(calleeUsername);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            setLocalStream(stream);
            const peerConnection = await createPeerConnection(calleeUsername, stream);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            // Check if target user exists before sending call
            const targetUser = await database.getUserByUsername(calleeUsername);
            if (!targetUser) {
                setCallStatus('User unavailable');
                setTimeout(() => stableEndCall(calleeUsername), 2000);
                return;
            }

            stableSendMessage(calleeUsername, 'incoming-call', { from: stateRef.current.user.username, isVideoCall: withVideo, offer });
            setCallStatus('Ringing...');
            callTimeoutRef.current = window.setTimeout(() => { if(stateRef.current.isCalling && stateRef.current.callStatus.startsWith('Ringing')) { setCallStatus('User unavailable'); setTimeout(() => stableEndCall(calleeUsername), 2000); } }, 30000);
        } catch (error: any) { console.error('Error starting P2P call:', error); setCallStatus(`Error: ${error.message}`); setTimeout(() => stableEndCall(calleeUsername), 3000); }
    }, [createPeerConnection, stableSendMessage, stableEndCall]);

    const acceptCall = useCallback(async () => {
        if (!stateRef.current.incomingCall || !stateRef.current.user || !offerForIncomingCall.current) return;
        const caller = stateRef.current.incomingCall.from;
        try {
            setIsCalling(true); setCallStatus('Connecting...'); setCallee(caller); setIsVideoCall(stateRef.current.incomingCall.isVideoCall);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: stateRef.current.incomingCall.isVideoCall });
            setLocalStream(stream);
            const peerConnection = await createPeerConnection(caller, stream);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offerForIncomingCall.current));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            stableSendMessage(caller, 'call-accepted', { answer });
            setIncomingCall(null); offerForIncomingCall.current = null;
        } catch (error: any) { console.error("Error accepting call:", error); stableEndCall(caller); }
    }, [createPeerConnection, stableSendMessage, stableEndCall]);

    const declineCall = useCallback(() => {
        if (!stateRef.current.incomingCall || !stateRef.current.user) return;
        stableSendMessage(stateRef.current.incomingCall.from, 'call-declined', { from: stateRef.current.user.username });
        setIncomingCall(null); offerForIncomingCall.current = null;
    }, [stableSendMessage]);

    const toggleMute = useCallback(() => {
        if (stateRef.current.localStream) {
            const wasMuted = !stateRef.current.localStream.getAudioTracks()[0].enabled;
            stateRef.current.localStream.getAudioTracks().forEach(track => { track.enabled = wasMuted; });
            setIsMuted(!wasMuted);
        }
    }, []);

    const value = { isCalling, callee, callStatus, isMuted, incomingCall, localStream, remoteStream, isVideoCall, callDuration, startP2PCall, acceptCall, declineCall, endCall: stableEndCall, toggleMute };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};
