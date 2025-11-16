import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCall } from '../../hooks/useCall';
import { database } from '../../services/database';
import { User } from '../../types';
import VoiceAssistantWidget from '../../components/VoiceAssistantWidget';

// Icons
const CallIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const KeypadIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const HistoryIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ContactsIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;

type PhoneView = 'keypad' | 'history' | 'contacts';

const KeypadView: React.FC<{ onLaunchAssistant: () => void; dialerInput: string; setDialerInput: (input: string) => void; }> = ({ onLaunchAssistant, dialerInput, setDialerInput }) => {
    const { user: currentUser } = useAuth();
    const { startP2PCall } = useCall();
    const [withVideo, setWithVideo] = useState(true);
    const [errorStatus, setErrorStatus] = useState('');

    const handleCall = async () => {
        if (!dialerInput.trim()) { setErrorStatus('Please enter a username to call.'); return; }
        if (dialerInput.trim().toLowerCase() === currentUser?.username.toLowerCase()) { setErrorStatus("You cannot call yourself."); return; }
        setErrorStatus('Checking user...');
        const userToCall = await database.getUserByUsername(dialerInput.trim());
        if (userToCall) {
            setErrorStatus('');
            startP2PCall(userToCall.username, withVideo);
        } else {
            setErrorStatus(`User "${dialerInput.trim()}" not found.`);
        }
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-4xl font-bold text-center text-purple-600 dark:text-purple-400">Keypad</h1>
            <input type="text" placeholder="Username to call" value={dialerInput} onChange={(e) => setDialerInput(e.target.value)} className="w-full bg-gray-100 dark:bg-slate-700/50 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-4 text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="flex items-center justify-center space-x-4 py-2">
                <span className="text-lg text-gray-600 dark:text-gray-300">Audio</span>
                <button type="button" onClick={() => setWithVideo(!withVideo)} className={`${withVideo ? 'bg-green-600' : 'bg-gray-400 dark:bg-gray-500'} relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-light-card dark:focus:ring-offset-dark-card`} aria-pressed={withVideo}>
                    <span className={`${withVideo ? 'translate-x-6' : 'translate-x-0'} pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}/>
                </button>
                <span className="text-lg text-gray-600 dark:text-gray-300">Video</span>
            </div>
            <button onClick={handleCall} className="w-full bg-green-600 text-white font-bold py-5 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-3 text-2xl"><CallIcon /><span>Call</span></button>
            <div className="relative flex items-center justify-center my-2"><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div><span className="flex-shrink mx-4 text-sm text-gray-500 dark:text-purple-300">OR</span><div className="flex-grow border-t border-gray-300 dark:border-purple-700/50"></div></div>
            <button onClick={onLaunchAssistant} className="w-full bg-cyan-600 text-white font-bold py-5 px-4 rounded-lg hover:bg-cyan-700 transition-colors flex items-center justify-center space-x-3 text-2xl"><MicrophoneIcon /><span>AI Voice Assistant</span></button>
            {errorStatus && <p className="text-base text-yellow-600 dark:text-yellow-400 mt-2 text-center">{errorStatus}</p>}
        </div>
    );
}

const ContactsView: React.FC<{ onSelectContact: (username: string) => void }> = ({ onSelectContact }) => {
    const [contacts, setContacts] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchContacts = async () => {
            setIsLoading(true);
            const userList = await database.getUserDirectory();
            setContacts(userList.filter(u => u.id !== currentUser?.id));
            setIsLoading(false);
        };
        fetchContacts();
    }, [currentUser]);

    if (isLoading) return <div className="text-center p-4">Loading contacts...</div>;

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-4xl font-bold text-center text-purple-600 dark:text-purple-400 mb-6">Contacts</h1>
            <ul className="space-y-3 overflow-y-auto">
                {contacts.map(contact => (
                    <li key={contact.id} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3"><div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold text-white">{contact.username.charAt(0).toUpperCase()}</div><span className="font-semibold">{contact.username}</span></div>
                        <button onClick={() => onSelectContact(contact.username)} className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white"><CallIcon /></button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const HistoryView: React.FC = () => (
    <div className="h-full flex flex-col items-center justify-center text-gray-500">
        <h1 className="text-4xl font-bold text-center text-purple-600 dark:text-purple-400 mb-6">History</h1>
        <p>Call history will be shown here.</p>
    </div>
);

const TabButton: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center space-y-1 w-24 py-2 transition-colors ${isActive ? 'text-purple-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {icon}
        <span className="text-xs font-semibold">{label}</span>
    </button>
);

const MobiPhoneApp: React.FC = () => {
    const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState(false);
    const [activeView, setActiveView] = useState<PhoneView>('keypad');
    const [dialerInput, setDialerInput] = useState('');
    const { isCalling } = useCall();

    const handleSelectContact = (username: string) => {
        setDialerInput(username);
        setActiveView('keypad');
    };

    const renderView = () => {
        switch (activeView) {
            case 'history': return <HistoryView />;
            case 'contacts': return <ContactsView onSelectContact={handleSelectContact} />;
            case 'keypad': default: return <KeypadView onLaunchAssistant={() => setIsVoiceAssistantOpen(true)} dialerInput={dialerInput} setDialerInput={setDialerInput} />;
        }
    };
    
    return (
        <>
            <div className="w-full h-full flex flex-col bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
                <main className="flex-grow overflow-y-auto p-6">
                    {isCalling ? (
                         <div className="text-center text-gray-500 dark:text-gray-400 p-4 h-full flex flex-col items-center justify-center">
                            <h2 className="text-2xl font-semibold">Call in Progress</h2>
                            <p>Your call is being handled in the call screen.</p>
                        </div>
                    ) : renderView()}
                </main>
                {!isCalling && (
                    <footer className="flex-shrink-0 bg-gray-200 dark:bg-slate-800 flex justify-around border-t border-gray-300 dark:border-slate-700">
                        <TabButton icon={<HistoryIcon className="w-7 h-7" />} label="History" isActive={activeView === 'history'} onClick={() => setActiveView('history')} />
                        <TabButton icon={<KeypadIcon className="w-7 h-7" />} label="Keypad" isActive={activeView === 'keypad'} onClick={() => setActiveView('keypad')} />
                        <TabButton icon={<ContactsIcon className="w-7 h-7" />} label="Contacts" isActive={activeView === 'contacts'} onClick={() => setActiveView('contacts')} />
                    </footer>
                )}
            </div>
            <VoiceAssistantWidget isOpen={isVoiceAssistantOpen} onClose={() => setIsVoiceAssistantOpen(false)} />
        </>
    );
};

export default MobiPhoneApp;
