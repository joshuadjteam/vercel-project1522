import React, { createContext, useState, useContext, ReactNode } from 'react';

interface IncomingCall {
    caller: string;
}

interface CallContextType {
    isCalling: boolean;
    callee: string;
    callStatus: string;
    incomingCall: IncomingCall | null;
    isMuted: boolean;
    showKeypad: boolean;
    keypadInput: string;
    startCall: (callee: string) => void;
    endCall: () => void;
    receiveCall: (caller: string) => void;
    answerCall: () => void;
    declineCall: () => void;
    toggleMute: () => void;
    toggleKeypad: () => void;
    handleKeypadInput: (key: string) => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isCalling, setIsCalling] = useState(false);
    const [callee, setCallee] = useState('');
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

    const startCall = (calleeUsername: string) => {
        setIsCalling(true);
        setCallee(calleeUsername);
        setCallStatus(`Calling ${calleeUsername}...`);
        resetCallStates();
        // Simulate call connection
        setTimeout(() => setCallStatus(`Connected to ${calleeUsername}`), 2000);
    };

    const endCall = () => {
        setIsCalling(false);
        setCallee('');
        setCallStatus('');
        resetCallStates();
    };

    const receiveCall = (caller: string) => {
        // Can't receive a call if already in one
        if (!isCalling && !incomingCall) {
            setIncomingCall({ caller });
        }
    };

    const answerCall = () => {
        if (!incomingCall) return;
        setIsCalling(true);
        setCallee(incomingCall.caller);
        setCallStatus(`Connected to ${incomingCall.caller}`);
        setIncomingCall(null);
        resetCallStates();
    };
    
    const declineCall = () => {
        setIncomingCall(null);
    };

    const toggleMute = () => setIsMuted(prev => !prev);
    const toggleKeypad = () => setShowKeypad(prev => !prev);
    const handleKeypadInput = (key: string) => setKeypadInput(prev => prev + key);

    return (
        <CallContext.Provider value={{ 
            isCalling, callee, callStatus, incomingCall, isMuted, showKeypad, keypadInput,
            startCall, endCall, receiveCall, answerCall, declineCall, 
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