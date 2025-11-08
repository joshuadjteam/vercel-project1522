
import React from 'react';
import { useCall } from '../hooks/useCall';
import { ViewColumnsIcon, PhoneIcon, MicrophoneIcon } from '@heroicons/react/24/solid';

const CallWidget: React.FC = () => {
    const { 
        isCalling, callee, callStatus, endCall,
        isMuted, toggleMute, 
        showKeypad, toggleKeypad,
        keypadInput, handleKeypadInput
    } = useCall();

    if (!isCalling) {
        return null;
    }

    const Keypad = () => {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];
        return (
            <div className="mt-4">
                <div className="bg-black/10 dark:bg-white/10 rounded p-2 text-center text-lg h-10 mb-2 truncate">{keypadInput}</div>
                <div className="grid grid-cols-3 gap-2">
                    {keys.map(key => (
                        <button 
                            key={key} 
                            onClick={() => handleKeypadInput(key)}
                            className="bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 rounded-lg p-2 text-xl font-semibold transition-colors"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const ActionButton: React.FC<{ onClick: () => void, children: React.ReactNode, className?: string, title: string }> = ({ onClick, children, className, title }) => (
        <button
            onClick={onClick}
            title={title}
            className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${className}`}
        >
            {children}
        </button>
    );

    return (
        <div className="fixed bottom-10 right-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-light-text dark:text-white w-72 z-50">
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0">
                    {callee.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold truncate">{callee}</p>
                    <p className="text-sm text-green-500 dark:text-green-400 truncate">{callStatus}</p>
                </div>
            </div>

            {showKeypad && <Keypad />}

            <div className="grid grid-cols-3 gap-3 mt-4 place-items-center">
                <ActionButton 
                    onClick={toggleKeypad} 
                    title="Keypad"
                    className={`${showKeypad ? 'bg-blue-600 text-white' : 'bg-gray-500 dark:bg-gray-600 text-white'} hover:bg-blue-700`}
                >
                    <ViewColumnsIcon className="h-6 w-6"/>
                </ActionButton>
                 <ActionButton 
                    onClick={endCall} 
                    title="End Call"
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <PhoneIcon className="h-6 w-6"/>
                </ActionButton>
                <ActionButton 
                    onClick={toggleMute} 
                    title={isMuted ? "Unmute" : "Mute"}
                    className={`${isMuted ? 'bg-yellow-500' : 'bg-gray-500 dark:bg-gray-600'} hover:bg-yellow-600 text-white relative`}
                >
                    <MicrophoneIcon className="h-6 w-6"/>
                    {isMuted && <div className="absolute w-0.5 h-7 bg-white transform rotate-45"></div>}
                </ActionButton>
            </div>
        </div>
    );
};

export default CallWidget;
