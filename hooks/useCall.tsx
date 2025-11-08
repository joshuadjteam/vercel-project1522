
import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../supabaseClient';
import { User, IncomingCall, UserRole } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';


interface CallContextType {
    isCalling: boolean;
    callee: User | null;
    callStatus: string;
    incomingCall: IncomingCall | null;
    isMuted: boolean;
    showKeypad: boolean;
    keypadInput: string;
    startCall: (callee: User) => void;
    endCall: (notifyPeer?: boolean) => void;
    answerCall: () => void;
    declineCall: () => void;
    toggleMute: () => void;
    toggleKeypad: () => void;
    handleKeypadInput: (key: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user: currentUser } = useAuth();

    const [isCalling, setIsCalling] = useState(false);
    const [callee, setCallee] = useState<User | null>(null);
    const [callStatus, setCallStatus] = useState('');
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [keypadInput, setKeypadInput] = useState('');

    const callChannelRef = useRef<RealtimeChannel | null>(null);
    const isCallingRef = useRef(isCalling);
    const calleeRef = useRef(callee);
    const incomingCallRef = useRef(incomingCall);
    const currentUserRef = useRef(currentUser);

    useEffect(() => { isCallingRef.current = isCalling; }, [isCalling]);
    useEffect(() => { calleeRef.current = callee; }, [callee]);
    useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
    useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);


    const resetAllCallStates = useCallback(() => {
        setIsCalling(false);
        setCallee(null);
        setCallStatus('');
        setIncomingCall(null);
        setIsMuted(false);
        setShowKeypad(false);
        setKeypadInput('');
    }, []);
    
    useEffect(() => {
        if (!currentUser?.auth_id) {
            if (callChannelRef.current) {
                supabase.removeChannel(callChannelRef.current);
                callChannelRef.current = null;
            }
            return;
        }

        const channelId = `calls--${currentUser.auth_id}`;
        if (callChannelRef.current?.topic === channelId) return;

        if (callChannelRef.current) {
            supabase.removeChannel(callChannelRef.current);
        }

        const newChannel = supabase.channel(channelId);

        newChannel
            .on('broadcast', { event: 'incoming-call' }, ({ payload }) => {
                if (payload.callerId !== currentUserRef.current?.auth_id && !isCallingRef.current && !incomingCallRef.current) {
                    setIncomingCall({ callerName: payload.callerName, callerId: payload.callerId });
                }
            })
            .on('broadcast', { event: 'call-answered' }, ({ payload }) => {
                if (calleeRef.current?.auth_id === payload.calleeId) {
                    setCallStatus(`Connected`);
                }
            })
            .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
                 if (calleeRef.current?.auth_id === payload.calleeId) {
                    setCallStatus(`Declined`);
                    setTimeout(() => resetAllCallStates(), 2000);
                }
            })
            .on('broadcast', { event: 'call-ended' }, ({ payload }) => {
                 if (isCallingRef.current || incomingCallRef.current) {
                    setCallStatus('Call ended');
                    setTimeout(() => resetAllCallStates(), 1000);
                 }
                 // If an incoming call is cancelled by the caller
                 if (incomingCallRef.current?.callerId === payload.enderId) {
                    resetAllCallStates();
                 }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log(`Subscribed to personal call channel: ${channelId}`);
            });
        
        callChannelRef.current = newChannel;

        return () => {
            if (callChannelRef.current) {
                supabase.removeChannel(callChannelRef.current);
                callChannelRef.current = null;
            }
        };
    }, [currentUser, resetAllCallStates]);

    const startCall = (userToCall: User) => {
        if (!currentUser || !userToCall.auth_id) return;
        
        const peerChannel = supabase.channel(`calls--${userToCall.auth_id}`);
        peerChannel.subscribe(() => {
            peerChannel.send({
                type: 'broadcast',
                event: 'incoming-call',
                payload: { callerName: currentUser.username, callerId: currentUser.auth_id }
            }).then(() => supabase.removeChannel(peerChannel));
        });

        setIsCalling(true);
        setCallee(userToCall);
        setCallStatus(`Calling...`);
        setIncomingCall(null);
    };

    const endCall = (notifyPeer = true) => {
        const peerAuthId = callee?.auth_id || incomingCall?.callerId;
        if (notifyPeer && peerAuthId && currentUser?.auth_id) {
             const peerChannel = supabase.channel(`calls--${peerAuthId}`);
             peerChannel.subscribe(() => {
                peerChannel.send({
                    type: 'broadcast',
                    event: 'call-ended',
                    payload: { enderId: currentUser.auth_id }
                }).then(() => supabase.removeChannel(peerChannel));
             });
        }
        resetAllCallStates();
    };

    const answerCall = () => {
        if (!incomingCall || !currentUser?.auth_id) return;

        const callerAsCallee: User = { 
            id: 0, // placeholder
            username: incomingCall.callerName,
            auth_id: incomingCall.callerId,
            email: '', 
            role: UserRole.Standard, 
            sipVoice: null,
            features: {chat:false, ai:false, mail:false},
        };

        setIsCalling(true);
        setCallee(callerAsCallee);
        setCallStatus(`Connected`);
        setIncomingCall(null);

        const peerChannel = supabase.channel(`calls--${incomingCall.callerId}`);
        peerChannel.subscribe(() => {
            peerChannel.send({
                type: 'broadcast',
                event: 'call-answered',
                payload: { calleeId: currentUser.auth_id }
            }).then(() => supabase.removeChannel(peerChannel));
        });
    };
    
    const declineCall = () => {
        if (!incomingCall || !currentUser?.auth_id) return;

        const peerChannel = supabase.channel(`calls--${incomingCall.callerId}`);
        peerChannel.subscribe(() => {
            peerChannel.send({
                type: 'broadcast',
                event: 'call-declined',
                payload: { calleeId: currentUser.auth_id }
            }).then(() => supabase.removeChannel(peerChannel));
        });
        
        setIncomingCall(null);
        resetAllCallStates();
    };

    const toggleMute = () => setIsMuted(prev => !prev);
    const toggleKeypad = () => setShowKeypad(prev => !prev);
    const handleKeypadInput = (key: string) => setKeypadInput(prev => prev + key);

    return (
        <CallContext.Provider value={{ 
            isCalling, callee, callStatus, incomingCall, isMuted, showKeypad, keypadInput,
            startCall, endCall, answerCall, declineCall, 
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
