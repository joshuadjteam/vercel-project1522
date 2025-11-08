
import React from 'react';
import { useCall } from '../hooks/useCall';

const CallWidget: React.FC = () => {
    const { 
        isCalling, callee, callStatus, endCall,
        isMuted, toggleMute, 
        showKeypad, toggleKeypad,
        keypadInput, handleKeypadInput
    } = useCall();

    if (!isCalling || !callee) {
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

    return (
        <div className="fixed bottom-10 right-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl p-4 text-light-text dark:text-white w-72 z-50">
            <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center font-bold text-lg text-white shrink-0">
                    {callee.username.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                    <p className="font-semibold truncate">{callee.username}</p>
                    <p className="text-sm text-green-500 dark:text-green-400 truncate">{callStatus}</p>
                </div>
            </div>

            {showKeypad && <Keypad />}

            <div className="grid grid-cols-3 gap-3 mt-4 place-items-center">
                <button 
                    onClick={toggleKeypad} 
                    title="Keypad"
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors text-white font-semibold text-sm ${showKeypad ? 'bg-blue-600' : 'bg-gray-500 dark:bg-gray-600'} hover:bg-blue-700`}
                >
                    Keypad
                </button>
                 <button 
                    onClick={() => endCall()} 
                    title="End Call"
                    className="h-12 w-12 rounded-full flex items-center justify-center transition-colors bg-red-600 hover:bg-red-700 text-white text-sm font-semibold"
                >
                    End
                </button>
                <button 
                    onClick={toggleMute} 
                    title={isMuted ? "Unmute" : "Mute"}
                    className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors text-white font-semibold text-sm ${isMuted ? 'bg-yellow-500' : 'bg-gray-500 dark:bg-gray-600'} hover:bg-yellow-600`}
                >
                    {isMuted ? 'Unmute' : 'Mute'}
                </button>
            </div>
        </div>
    );
};

export default CallWidget;
