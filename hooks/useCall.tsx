import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';

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
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
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
    const ws = useRef<WebSocket | null>(null);
    const offerForIncomingCall = useRef<RTCSessionDescriptionInit | null>(null);
    const callTimeoutRef = useRef<number | null>(null);
    const callDurationIntervalRef = useRef<number | null>(null);

    // Refs to hold current state for use inside WebSocket closures
    const isCallingRef = useRef(isCalling);
    useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
    const calleeRef = useRef(callee);
    useEffect(() => { calleeRef.current = callee; }, [callee]);
    
    const endCall = useCallback((targetOverride?: string) => {
        const target = targetOverride || calleeRef.current;
        if (target && user && ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ target, type: 'call-ended', payload: { from: user.username } }));
        }

        if (pc.current) {
            pc.current.close();
            pc.current = null;
        }
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        
        if (callTimeoutRef.current) {
            window.clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }
        if (callDurationIntervalRef.current) {
            window.clearInterval(callDurationIntervalRef.current);
            callDurationIntervalRef.current = null;
        }
        
        setRemoteStream(null);
        setIsVideoCall(false);
        setIsCalling(false);
        setCallee('');
        setCallStatus('');
        setCallDuration(0);
        setIncomingCall(null);
        offerForIncomingCall.current = null;
    }, [localStream, user]);

    // WebSocket connection management, now with a stable dependency array
    useEffect(() => {
        if (isLoggedIn && user && !ws.current) {
            const connect = async () => {
                const { data } = await supabase.auth.getSession();
                if (!data.session) return;
                
                const WEBSOCKET_URL = `wss://jnnpxifvsrlzfpaisdhy.supabase.co/functions/v1/webrtc-signaling-server?token=${data.session.access_token}`;
                
                const socket = new WebSocket(WEBSOCKET_URL);
                ws.current = socket;

                socket.onopen = () => console.log("WebSocket connected");
                socket.onclose = (event) => { 
                    console.log("WebSocket disconnected", `Code: ${event.code}`, `Reason: ${event.reason}`); 
                    ws.current = null; 
                };
                socket.onerror = (event) => {
                    console.error("A WebSocket error occurred:", event);
                };

                socket.onmessage = async (event) => {
                    const message = JSON.parse(event.data);
                    
                    switch (message.type) {
                        case 'incoming-call':
                            setIncomingCall({ from: message.from, isVideoCall: message.payload.isVideoCall });
                            offerForIncomingCall.current = message.payload.offer;
                            break;
                        case 'call-accepted':
                            if (pc.current && calleeRef.current === message.from) {
                                try {
                                    await pc.current.setRemoteDescription(new RTCSessionDescription(message.payload.answer));
                                    setCallStatus('Connecting...');
                                    if (callTimeoutRef.current) window.clearTimeout(callTimeoutRef.current);
                                } catch(e) {
                                    console.error("Error setting remote description:", e);
                                    setCallStatus("Error: Connection failed");
                                    setTimeout(() => endCall(message.from), 2000);
                                }
                            }
                            break;
                        case 'call-declined':
                            if (isCallingRef.current && calleeRef.current === message.from) {
                                setCallStatus('Call Declined');
                                setTimeout(() => endCall(message.from), 2000);
                            }
                            break;
                        case 'user-unavailable':
                             if (isCallingRef.current && calleeRef.current === message.payload.username) {
                                setCallStatus('User unavailable');
                                setTimeout(() => endCall(message.payload.username), 2000);
                            }
                            break;
                        case 'call-ended':
                             if (isCallingRef.current && calleeRef.current === message.from) {
                                endCall(message.from);
                            }
                            break;
                        case 'ice-candidate':
                            if (pc.current && message.payload.candidate) {
                                try {
                                    await pc.current.addIceCandidate(new RTCIceCandidate(message.payload.candidate));
                                } catch (e) { console.error("Error adding ICE candidate:", e); }
                            }
                            break;
                    }
                };
            };
            connect();
        } else if (!isLoggedIn && ws.current) {
            ws.current.close();
            ws.current = null;
        }
        return () => { if (ws.current) { ws.current.close(); ws.current = null; } };
    }, [isLoggedIn, user, endCall]);

    const sendMessage = useCallback((target: string, type: string, payload: any) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ target, type, payload }));
        } else {
            console.error("WebSocket is not connected.");
            setCallStatus("Error: Not connected to server");
            setTimeout(() => endCall(target), 2000);
        }
    }, [endCall]);

    const createPeerConnection = useCallback(async (targetUsername: string, stream: MediaStream) => {
        const config = { iceServers: DEFAULT_ICE_SERVERS };
        const peerConnection = new RTCPeerConnection(config);
        pc.current = peerConnection;

        stream.getTracks().forEach(track => pc.current?.addTrack(track, stream));

        pc.current.onicecandidate = event => {
            if (event.candidate) {
                sendMessage(targetUsername, 'ice-candidate', { candidate: event.candidate });
            }
        };
        
        pc.current.ontrack = event => {
            setRemoteStream(event.streams[0]);
        };

        pc.current.onconnectionstatechange = () => {
            if (pc.current?.connectionState === 'connected') {
                setCallStatus('Connected');
                if (callDurationIntervalRef.current) window.clearInterval(callDurationIntervalRef.current);
                callDurationIntervalRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
            } else if (['disconnected', 'failed', 'closed'].includes(pc.current?.connectionState || '')) {
                endCall(targetUsername);
            }
        };
        return peerConnection;
    }, [sendMessage, endCall]);

    const startP2PCall = useCallback(async (calleeUsername: string, withVideo: boolean) => {
        setIsCalling(true);
        setCallStatus('Calling...');
        setIsVideoCall(withVideo);
        try {
            if (!user) throw new Error("User not logged in.");
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: withVideo });
            setLocalStream(stream);
            setCallee(calleeUsername);

            const peerConnection = await createPeerConnection(calleeUsername, stream);
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);

            sendMessage(calleeUsername, 'incoming-call', { from: user.username, isVideoCall: withVideo, offer });
            
            setCallStatus('Ringing...');
            callTimeoutRef.current = window.setTimeout(() => {
                if(isCallingRef.current && callStatus.startsWith('Ringing')) {
                    setCallStatus('User unavailable');
                    setTimeout(() => endCall(calleeUsername), 2000);
                }
            }, 30000);
        } catch (error: any) {
            console.error('Error starting P2P call:', error);
            setCallStatus(`Error: ${error.message}`);
            setTimeout(() => endCall(calleeUsername), 3000);
        }
    }, [user, createPeerConnection, callStatus, sendMessage, endCall]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall || !user || !offerForIncomingCall.current) return;
        const caller = incomingCall.from;
        try {
            setIsCalling(true);
            setCallStatus('Connecting...');
            setCallee(caller);
            setIsVideoCall(incomingCall.isVideoCall);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: incomingCall.isVideoCall });
            setLocalStream(stream);

            const peerConnection = await createPeerConnection(caller, stream);
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offerForIncomingCall.current));
            
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);

            sendMessage(caller, 'call-accepted', { answer });
            setIncomingCall(null);
            offerForIncomingCall.current = null;
        } catch (error: any) {
            console.error("Error accepting call:", error);
            endCall(caller);
        }
    }, [incomingCall, user, createPeerConnection, sendMessage, endCall]);

    const declineCall = useCallback(() => {
        if (!incomingCall || !user) return;
        sendMessage(incomingCall.from, 'call-declined', { from: user.username });
        setIncomingCall(null);
        offerForIncomingCall.current = null;
    }, [incomingCall, user, sendMessage]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => { track.enabled = !track.enabled; });
            setIsMuted(prev => !prev);
        }
    };

    const value = { isCalling, callee, callStatus, isMuted, incomingCall, localStream, remoteStream, isVideoCall, callDuration, startP2PCall, acceptCall, declineCall, endCall, toggleMute };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = (): CallContextType => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};