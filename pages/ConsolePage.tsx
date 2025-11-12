
import React from 'react';
import { Page } from '../types';
import Clock from '../components/Clock';

// Icons
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ContactsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 14.354a4 4 0 110-5.292" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const NotepadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const CodeEditorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;

const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

// Small Icons for App Drawer
const SmallPhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const SmallChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const SmallContactsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 14.354a4 4 0 110-5.292" /></svg>;
const SmallMailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const SmallNotepadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const SmallCodeEditorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const FileExplorerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PaintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343a2 2 0 01-1.414-.586l-1.414-1.414A2 2 0 0011.343 9H9a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>;
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UnitConverterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;


interface ConsolePageProps {
    navigate: (page: Page, params?: any) => void;
}

const AppIcon: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-2 text-black transition-transform hover:scale-105">
        <div className="w-28 h-28 bg-gray-300 rounded-2xl flex items-center justify-center shadow-md">
            {icon}
        </div>
        <span className="font-semibold">{label}</span>
    </button>
);

const SmallAppIcon: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; }> = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center space-y-1 text-black transition-transform hover:scale-105">
        <div className="w-20 h-20 bg-gray-300/80 rounded-2xl flex items-center justify-center shadow-md">
            {icon}
        </div>
        <span className="font-semibold text-sm">{label}</span>
    </button>
);


const ActionButton: React.FC<{ label: string; onClick?: () => void; href?: string }> = ({ label, onClick, href }) => {
    const commonProps = {
        className: "w-full h-20 bg-gray-300 rounded-full flex items-center justify-center text-black text-xl font-medium shadow-md transition-transform hover:scale-105",
    };
    if (href) {
        return <a href={href} target="_blank" rel="noopener noreferrer" {...commonProps}>{label}</a>;
    }
    return <button onClick={onClick} {...commonProps}>{label}</button>;
};

const ConsolePage: React.FC<ConsolePageProps> = ({ navigate }) => {
    return (
        <div className="w-full h-full bg-sky-400 flex flex-col font-sans p-6 text-black">
            {/* Top Bar */}
            <header className="flex justify-between items-center pb-4 border-b-2 border-black">
                <div className="bg-gray-300 rounded-2xl p-3 shadow-md">
                    <Clock />
                </div>
                <button 
                    onClick={() => navigate('profile')} 
                    className="w-28 h-28 bg-gray-300 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                    title="View Profile"
                >
                    <ProfileIcon />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-grow flex pt-8 gap-8">
                {/* Left Column */}
                <div className="w-1/2 flex flex-col gap-8">
                    <div className="grid grid-cols-3 gap-6">
                        <AppIcon icon={<PhoneIcon />} label="Phone" onClick={() => navigate('app-phone')} />
                        <AppIcon icon={<ChatIcon />} label="Chat" onClick={() => navigate('app-chat')} />
                        <AppIcon icon={<ContactsIcon />} label="Contacts" onClick={() => navigate('app-contacts')} />
                        <AppIcon icon={<MailIcon />} label="LocalMail" onClick={() => navigate('app-localmail')} />
                        <AppIcon icon={<NotepadIcon />} label="Notepad" onClick={() => navigate('app-notepad')} />
                        <AppIcon icon={<CodeEditorIcon />} label="Code Editor" onClick={() => navigate('app-editor')} />
                    </div>
                    <div className="flex-grow bg-gray-300 rounded-2xl flex flex-col items-center justify-center text-black p-4 shadow-inner">
                        <h3 className="text-lg font-bold mb-4">All Apps</h3>
                        <div className="grid grid-cols-4 gap-x-4 gap-y-6">
                           <SmallAppIcon icon={<SmallPhoneIcon />} label="Phone" onClick={() => navigate('app-phone')} />
                           <SmallAppIcon icon={<SmallChatIcon />} label="Chat" onClick={() => navigate('app-chat')} />
                           <SmallAppIcon icon={<SmallContactsIcon />} label="Contacts" onClick={() => navigate('app-contacts')} />
                           <SmallAppIcon icon={<SmallMailIcon />} label="Mail" onClick={() => navigate('app-localmail')} />
                           <SmallAppIcon icon={<SmallNotepadIcon />} label="Notepad" onClick={() => navigate('app-notepad')} />
                           <SmallAppIcon icon={<SmallCodeEditorIcon />} label="Editor" onClick={() => navigate('app-editor')} />
                           <SmallAppIcon icon={<FileExplorerIcon />} label="Files" onClick={() => navigate('app-files')} />
                           <SmallAppIcon icon={<CalendarIcon />} label="Calendar" onClick={() => navigate('app-calendar')} />
                           <SmallAppIcon icon={<PaintIcon />} label="Paint" onClick={() => navigate('app-paint')} />
                           <SmallAppIcon icon={<CalculatorIcon />} label="Calculator" onClick={() => navigate('app-calculator')} />
                           <SmallAppIcon icon={<UnitConverterIcon />} label="Converter" onClick={() => navigate('app-converter')} />
                        </div>
                    </div>
                </div>
                
                {/* Right Column */}
                <div className="w-1/2 flex flex-col space-y-8">
                    <ActionButton label="Search with Google" onClick={() => window.open('https://google.com', '_blank')} />
                    <ActionButton label="Chat with AI" onClick={() => navigate('app-chat', { targetUserId: -1 })} />
                    <ActionButton label="Buy another product!" href="https://darshanjoshuakesavaruban.fwscheckout.com/" />
                    <ActionButton label="MyPortal" href="https://sites.google.com/gcp.lynixity.x10.bz/myportal/home" />
                </div>
            </main>
        </div>
    );
};

export default ConsolePage;
