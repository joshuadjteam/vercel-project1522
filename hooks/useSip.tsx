import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { UserAgent, Inviter, Invitation, Registerer, SessionState } from 'sip.js';
import { useAuth } from './useAuth';
import { database } from '../services/database';

type CallState = 'Idle' | 'Outgoing' | 'Incoming' | 'Active';
type ConnectionState = 'Disconnected' | 'Connecting...' | 'Connected' | 'Registering...' | 'Registration Failed';

interface SipContextType {
    connectionState: ConnectionState;
    callState: CallState;
    remoteIdentity: string | null;
    isMuted: boolean;
    error: string | null;
    remoteStream: MediaStream | null;
    callDuration: number;
    makeCall: (target: string) => void;
    answerCall: () => void;
    hangupCall: () => void;
    toggleMute: () => void;
}

const SipContext = createContext<SipContextType | undefined>(undefined);

const SIP_DOMAIN = 'lynixity.x10.bz';
const SIP_PROXY = 'wss://sip.iptel.org:8081';

export const SipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isLoggedIn } = useAuth();
    const [connectionState, setConnectionState] = useState<ConnectionState>('Disconnected');
    const [callState, setCallState] = useState<CallState>('Idle');
    const [remoteIdentity, setRemoteIdentity] = useState<string | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [callDuration, setCallDuration] = useState(0);

    const userAgent = useRef<UserAgent | null>(null);
    const activeSession = useRef<Inviter | Invitation | null>(null);
    const registerer = useRef<Registerer | null>(null);
    const callDurationIntervalRef = useRef<number | null>(null);

    const cleanupSession = useCallback(() => {
        if (activeSession.current) {
            activeSession.current = null;
        }
        setCallState('Idle');
        setRemoteIdentity(null);
        setRemoteStream(null);
        setIsMuted(false);
        if (callDurationIntervalRef.current) {
            clearInterval(callDurationIntervalRef.current);
            callDurationIntervalRef.current = null;
        }
        setCallDuration(0);
    }, []);

    const disconnect = useCallback(async () => {
        if (userAgent.current) {
            if (registerer.current?.state === 'Registered') {
                await registerer.current.unregister();
            }
            if (userAgent.current.isConnected()) {
                await userAgent.current.stop();
            }
            userAgent.current = null;
            registerer.current = null;
        }
        setConnectionState('Disconnected');
        cleanupSession();
    }, [cleanupSession]);

    useEffect(() => {
        if (!isLoggedIn || !user) {
            if (connectionState !== 'Disconnected') {
                disconnect();
            }
            return;
        }

        const connect = async () => {
            const credentials = await database.getSipCredentials();
            if (!credentials || !credentials.username || !credentials.password) {
                console.log("No SIP credentials found for user.");
                setError("No SIP credentials configured.");
                setConnectionState('Disconnected');
                return;
            }

            setError(null);
            setConnectionState('Connecting...');
            
            try {
                const ua = new UserAgent({
                    uri: UserAgent.makeURI(`sip:${credentials.username}@${SIP_DOMAIN}`),
                    authorizationPassword: credentials.password,
                    authorizationUsername: credentials.username,
                    transportOptions: { server: SIP_PROXY },
                });
                userAgent.current = ua;

                ua.delegate = {
                    onConnect: () => {
                        setConnectionState('Connected');
                        setConnectionState('Registering...');
                        registerer.current?.register().catch((e) => {
                            console.error("Registration failed:", e);
                            setError("Registration failed.");
                            setConnectionState('Registration Failed');
                        });
                    },
                    onDisconnect: (err) => {
                        setConnectionState('Disconnected');
                        if (err) setError(`Disconnected: ${(err as Error).message || "WebSocket closed"}`);
                        cleanupSession();
                    },
                    onInvite: (invitation) => {
                        activeSession.current = invitation;
                        setCallState('Incoming');
                        setRemoteIdentity(invitation.remoteIdentity.uri.user || invitation.remoteIdentity.uri.toString());
                    },
                };
                
                registerer.current = new Registerer(ua);
                registerer.current.stateChange.addListener(state => {
                     if (state === 'Registered') setConnectionState('Connected');
                });
                
                await ua.start();

            } catch (e: any) {
                console.error("SIP Connection error:", e);
                setError(`Connection Failed: ${e.message}`);
                setConnectionState('Disconnected');
            }
        };

        connect();

        return () => {
            disconnect();
        };
    }, [isLoggedIn, user, disconnect]);

    const setupRemoteMedia = useCallback((session: Inviter | Invitation) => {
        const stream = new MediaStream();
        session.sessionDescriptionHandler?.peerConnection?.getReceivers().forEach(receiver => {
            if (receiver.track) stream.addTrack(receiver.track);
        });
        setRemoteStream(stream);
    }, []);

    const makeCall = useCallback(async (target: string) => {
        if (!userAgent.current || connectionState !== 'Connected') {
            setError('Not connected to SIP server.');
            return;
        }
        
        const formattedTarget = target.includes('@') ? `sip:${target}` : `sip:${target}@${SIP_DOMAIN}`;
        const targetUri = UserAgent.makeURI(formattedTarget);
        if (!targetUri) { setError('Invalid SIP URI'); return; }

        setCallState('Outgoing');
        setRemoteIdentity(target);

        const inviter = new Inviter(userAgent.current, targetUri, {
             sessionDescriptionHandlerOptions: { 
                constraints: { audio: true, video: true },
                sdpSemantics: 'unified-plan'
             }
        });
        activeSession.current = inviter;
        
        inviter.stateChange.addListener(state => {
            switch (state) {
                case SessionState.Establishing: setCallState('Outgoing'); break;
                case SessionState.Established:
                    setCallState('Active');
                    setupRemoteMedia(inviter);
                    callDurationIntervalRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
                    break;
                case SessionState.Terminated: cleanupSession(); break;
            }
        });

        inviter.invite().catch(e => { 
            console.error("Call failed", e); 
            setError("Call failed or was rejected."); 
            cleanupSession(); 
        });
    }, [connectionState, cleanupSession, setupRemoteMedia]);
    
    const answerCall = useCallback(() => {
        if (callState !== 'Incoming' || !activeSession.current || !(activeSession.current instanceof Invitation)) return;
        
        const invitation = activeSession.current;
        invitation.stateChange.addListener(state => {
            switch(state) {
                case SessionState.Established:
                    setCallState('Active');
                    setupRemoteMedia(invitation);
                    callDurationIntervalRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
                    break;
                case SessionState.Terminated: cleanupSession(); break;
            }
        });
        
        invitation.accept({ 
            sessionDescriptionHandlerOptions: { 
                constraints: { audio: true, video: true },
                sdpSemantics: 'unified-plan'
            } 
        })
        .catch(e => { console.error("Answer failed", e); setError("Failed to answer call"); cleanupSession(); });

    }, [callState, cleanupSession, setupRemoteMedia]);

    const hangupCall = useCallback(() => {
        if (!activeSession.current) return;
        if (activeSession.current.state === SessionState.Terminated) { cleanupSession(); return; }

        if (activeSession.current instanceof Inviter) {
            if (activeSession.current.state === SessionState.Initial || activeSession.current.state === SessionState.Establishing) {
                activeSession.current.cancel();
            } else {
                activeSession.current.bye();
            }
        } else if (activeSession.current instanceof Invitation) {
            if (activeSession.current.state === SessionState.Initial || activeSession.current.state === SessionState.Establishing) {
                 activeSession.current.reject();
            } else {
                 activeSession.current.bye();
            }
        }
        cleanupSession();
    }, [cleanupSession]);

    const toggleMute = useCallback(() => {
        if (callState !== 'Active' || !activeSession.current) return;
        const pc = activeSession.current.sessionDescriptionHandler?.peerConnection;
        if(!pc) return;

        const senders = pc.getSenders().filter(s => s.track?.kind === 'audio');
        if (senders.length > 0) {
            const newMutedState = !isMuted;
            senders.forEach(s => { if(s.track) s.track.enabled = !newMutedState; });
            setIsMuted(newMutedState);
        }
    }, [callState, isMuted]);

    const value = { connectionState, callState, remoteIdentity, isMuted, error, remoteStream, callDuration, makeCall, answerCall, hangupCall, toggleMute };
    return <SipContext.Provider value={value}>{children}</SipContext.Provider>;
};

export const useSip = (): SipContextType => {
    const context = useContext(SipContext);
    if (context === undefined) {
        throw new Error('useSip must be used within a SipProvider');
    }
    return context;
};