
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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
    const [callChannel, setCallChannel] = useState<RealtimeChannel | null>(null);

    const [isCalling, setIsCalling] = useState(false);
    const [callee, setCallee] = useState<User | null>(null);
    const [callStatus, setCallStatus] = useState('');
    const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);
    const [keypadInput, setKeypadInput] = useState('');

    const resetCallStates = () => {
        setIsMuted(false);
        setShowKeypad(false);
        setKeypadInput('');
    };
    
    useEffect(() => {
        if (!currentUser?.auth_id) {
            if (callChannel) {
                supabase.removeChannel(callChannel);
                setCallChannel(null);
            }
            return;
        }

        const channelId = `calls--${currentUser.auth_id}`;
        // Avoid re-subscribing if already on the correct channel
        if (callChannel?.topic === channelId) return;

        // Clean up previous channel if it exists
        if (callChannel) supabase.removeChannel(callChannel);

        const newChannel = supabase.channel(channelId);

        newChannel
            .on('broadcast', { event: 'incoming-call' }, ({ payload }) => {
                if (payload.callerId !== currentUser.auth_id && !isCalling && !incomingCall) {
                    setIncomingCall({ callerName: payload.callerName, callerId: payload.callerId });
                }
            })
            .on('broadcast', { event: 'call-answered' }, ({ payload }) => {
                if (callee?.auth_id === payload.calleeId) {
                    setCallStatus(`Connected to ${callee.username}`);
                }
            })
            .on('broadcast', { event: 'call-declined' }, ({ payload }) => {
                 if (callee?.auth_id === payload.calleeId) {
                    setCallStatus(`${callee.username} declined the call.`);
                    setTimeout(() => endCall(false), 2000);
                }
            })
            .on('broadcast', { event: 'call-ended' }, () => {
                 if (isCalling) {
                    setCallStatus('Call ended.');
                    setTimeout(() => endCall(false), 1000);
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') console.log(`Subscribed to personal call channel: ${channelId}`);
            });
        
        setCallChannel(newChannel);

        return () => {
            supabase.removeChannel(newChannel);
            setCallChannel(null);
        };
    }, [currentUser, isCalling, callee, incomingCall]);

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
        setCallStatus(`Calling ${userToCall.username}...`);
        resetCallStates();
    };

    const endCall = (notifyPeer = true) => {
        if (notifyPeer && callee?.auth_id && currentUser?.auth_id) {
             const peerChannel = supabase.channel(`calls--${callee.auth_id}`);
             peerChannel.subscribe(() => {
                peerChannel.send({
                    type: 'broadcast',
                    event: 'call-ended',
                    payload: { enderId: currentUser.auth_id }
                }).then(() => supabase.removeChannel(peerChannel));
             });
        }
        setIsCalling(false);
        setCallee(null);
        setCallStatus('');
        setIncomingCall(null);
        resetCallStates();
    };

    const answerCall = () => {
        if (!incomingCall || !currentUser?.auth_id) return;

        // The caller becomes the callee for this user. We create a partial User object
        // since we don't have the full profile, but have what's needed for call management.
        const callerAsCallee: User = { 
            id: 0, // placeholder
            username: incomingCall.callerName,
            auth_id: incomingCall.callerId,
            email: '', 
            role: UserRole.Standard, 
            sipVoice: null,
            features: {chat:false, ai:false, mail:false}
        };

        setIsCalling(true);
        setCallee(callerAsCallee);
        setCallStatus(`Connected to ${incomingCall.callerName}`);

        const peerChannel = supabase.channel(`calls--${incomingCall.callerId}`);
        peerChannel.subscribe(() => {
            peerChannel.send({
                type: 'broadcast',
                event: 'call-answered',
                payload: { calleeId: currentUser.auth_id }
            }).then(() => supabase.removeChannel(peerChannel));
        });
        
        setIncomingCall(null);
        resetCallStates();
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
