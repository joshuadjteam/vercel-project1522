import React, { createContext, useState, useContext, ReactNode, useRef, useCallback, useEffect } from 'react';
import { UserAgent, Inviter, Invitation, Registerer, SessionState } from 'sip.js';

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
    connect: (user: string, pass: string) => void;
    disconnect: () => void;
    makeCall: (target: string) => void;
    answerCall: () => void;
    hangupCall: () => void;
    toggleMute: () => void;
}

const SipContext = createContext<SipContextType | undefined>(undefined);

export const SipProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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

    const setupRemoteMedia = (session: Inviter | Invitation) => {
        const stream = new MediaStream();
        session.sessionDescriptionHandler?.peerConnection?.getReceivers().forEach(receiver => {
            if (receiver.track) stream.addTrack(receiver.track);
        });
        setRemoteStream(stream);
    };

    const cleanupSession = () => {
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
    };

    const connect = useCallback(async (user: string, pass: string) => {
        if (userAgent.current) await disconnect();

        setError(null);
        setConnectionState('Connecting...');
        
        try {
            const ua = new UserAgent({
                uri: UserAgent.makeURI(`sip:${user}@lynixity.x10.bz`),
                authorizationPassword: pass,
                authorizationUsername: user,
                transportOptions: {
                    server: 'wss://sip.iptel.org:8081'
                },
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
                    if (err) {
                        const errorMessage = (err as Error).message || "WebSocket closed";
                        setError(`Disconnected: ${errorMessage}`);
                    }
                    cleanupSession();
                },
                onInvite: (invitation) => {
                    activeSession.current = invitation;
                    setCallState('Incoming');
                    setRemoteIdentity(invitation.remoteIdentity.uri.toString());
                },
            };
            
            registerer.current = new Registerer(ua);
            registerer.current.stateChange.addListener(state => {
                 if (state === 'Registered') setConnectionState('Connected');
                 else if (state === 'Unregistered') setConnectionState('Disconnected');
                 else if (state === 'Terminated') setConnectionState('Registration Failed');
            });
            
            await ua.start();

        } catch (e: any) {
            console.error("SIP Connection error:", e);
            setError(`Connection Failed: ${e.message}`);
            setConnectionState('Disconnected');
        }
    }, []);

    const disconnect = useCallback(async () => {
        if (userAgent.current) {
            if(registerer.current) await registerer.current.unregister();
            await userAgent.current.stop();
            userAgent.current = null;
            registerer.current = null;
        }
        setConnectionState('Disconnected');
        cleanupSession();
    }, []);

    const makeCall = useCallback(async (target: string) => {
        if (!userAgent.current || connectionState !== 'Connected') {
            setError('Not connected to SIP server.');
            return;
        }
        const targetUri = UserAgent.makeURI(target);
        if (!targetUri) { setError('Invalid SIP URI'); return; }

        const inviter = new Inviter(userAgent.current, targetUri, {
             sessionDescriptionHandlerOptions: { constraints: { audio: true, video: true } }
        });
        activeSession.current = inviter;
        
        inviter.stateChange.addListener(state => {
            switch (state) {
                case SessionState.Initial: break;
                case SessionState.Establishing: setCallState('Outgoing'); break;
                case SessionState.Established:
                    setCallState('Active');
                    setupRemoteMedia(inviter);
                    callDurationIntervalRef.current = window.setInterval(() => setCallDuration(d => d + 1), 1000);
                    break;
                case SessionState.Terminating:
                case SessionState.Terminated: cleanupSession(); break;
            }
        });

        setRemoteIdentity(target);
        inviter.invite().catch(e => { console.error("Call failed", e); setError("Call failed"); cleanupSession(); });
    }, [connectionState]);
    
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
        
        invitation.accept({ sessionDescriptionHandlerOptions: { constraints: { audio: true, video: true } } })
            .catch(e => { console.error("Answer failed", e); setError("Failed to answer call"); cleanupSession(); });

    }, [callState]);

    const hangupCall = useCallback(() => {
        if (!activeSession.current) return;
        if (activeSession.current instanceof Inviter) {
            activeSession.current.bye();
        } else if (activeSession.current instanceof Invitation) {
            if (activeSession.current.state === SessionState.Initial || activeSession.current.state === SessionState.Establishing) {
                 activeSession.current.reject();
            } else {
                 activeSession.current.bye();
            }
        }
        cleanupSession();
    }, []);

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

    const value = { connectionState, callState, remoteIdentity, isMuted, error, remoteStream, callDuration, connect, disconnect, makeCall, answerCall, hangupCall, toggleMute };
    return <SipContext.Provider value={value}>{children}</SipContext.Provider>;
};

export const useSip = (): SipContextType => {
    const context = useContext(SipContext);
    if (context === undefined) {
        throw new Error('useSip must be used within a SipProvider');
    }
    return context;
};
