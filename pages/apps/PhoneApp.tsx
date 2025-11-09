
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { database } from '../../services/database';
import { CallRecord } from '../../types';

const DialerTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { startP2PCall, isCalling } = useCall();
    const [calleeInput, setCalleeInput] = useState('');
    const [errorStatus, setErrorStatus] = useState('');

    const handleCall = async () => {
        if (!calleeInput.trim()) {
            setErrorStatus('Please enter a username to call.');
            return;
        }

        if (calleeInput.trim().toLowerCase() === currentUser?.username.toLowerCase()) {
            setErrorStatus("You cannot call yourself.");
            return;
        }

        setErrorStatus('Checking user...');
        const userToCall = await database.getUserByUsername(calleeInput.trim());

        if (userToCall) {
            setErrorStatus('');
            startP2PCall(userToCall.username);
        } else {
            setErrorStatus(`User "${calleeInput.trim()}" not found.`);
        }
    };
    
    return isCalling ? (
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
            <h2 className="text-xl font-semibold">Call in Progress</h2>
            <p>Use the call widget to manage your active call.</p>
        </div>
    ) : (
        <div className="space-y-4">
            <input
                type="text"
                placeholder="Enter username to call"
                value={calleeInput}
                onChange={(e) => setCalleeInput(e.target.value)}
                className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleCall} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 transition-colors">
                Call
            </button>

            {errorStatus && <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">{errorStatus}</p>}
        </div>
    );
}

const CallHistoryTab: React.FC = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState<CallRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            const records = await database.getCallHistoryForUser();
            setHistory(records);
            setIsLoading(false);
        };
        fetchHistory();
    }, []);

    const CallIcon: React.FC<{ record: CallRecord }> = ({ record }) => {
        const isMissed = record.status === 'declined' || record.status === 'missed';
        if (record.direction === 'outgoing') {
            return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>;
        }
        if (record.direction === 'incoming') {
            return <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isMissed ? 'text-red-500' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>;
        }
        return null;
    }

    if (isLoading) {
        return <div className="text-center p-4">Loading history...</div>
    }

    if (history.length === 0) {
        return <div className="text-center text-gray-500 dark:text-gray-400 p-4">No recent calls.</div>
    }
    
    return (
        <div className="h-96 overflow-y-auto space-y-2 pr-2">
            {history.map(record => {
                const otherUser = record.direction === 'outgoing' ? record.callee_username : record.caller_username;
                const isMissed = record.status === 'declined' || record.status === 'missed';

                return (
                    <div key={record.id} className="flex items-center justify-between p-2 rounded-lg bg-black/5 dark:bg-black/20">
                        <div className="flex items-center space-x-3">
                            <CallIcon record={record} />
                            <div>
                                <p className={`font-semibold ${isMissed ? 'text-red-500' : ''}`}>{otherUser}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(record.timestamp).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                            {record.duration > 0 ? `${Math.floor(record.duration / 60)}m ${record.duration % 60}s` : record.status}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const PhoneApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState('dialer');

    const TabButton: React.FC<{name: string, label: string}> = ({ name, label }) => (
         <button
            onClick={() => setActiveTab(name)}
            className={`w-1/2 py-2 text-sm font-semibold transition-colors ${
                activeTab === name
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full h-full flex items-center justify-center">
            <div className="w-full max-w-sm bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-gray-300 dark:border-purple-600/50 rounded-2xl shadow-2xl p-6 text-light-text dark:text-white">
                 <div className="flex border-b border-gray-300 dark:border-purple-800/50 mb-4">
                    <TabButton name="dialer" label="Dialer" />
                    <TabButton name="recents" label="Recents" />
                </div>
                {activeTab === 'dialer' ? <DialerTab /> : <CallHistoryTab />}
            </div>
        </div>
    );
};

export default PhoneApp;