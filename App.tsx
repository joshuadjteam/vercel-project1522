
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CallProvider } from './hooks/useCall';
import Header from './components/Header';
import Footer from './components/Footer';
import CallWidget from './components/CallWidget';
import IncomingCallWidget from './components/IncomingCallWidget';
import HomePage from './pages/HomePage';
import ContactPage from './pages/ContactPage';
import SignInPage from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import AdminPortal from './pages/AdminPortal';
import PhoneApp from './pages/apps/PhoneApp';
import ChatApp from './pages/apps/ChatApp';
import LocalMailApp from './pages/apps/LocalMailApp';
import ContactsApp from './pages/apps/ContactsApp';
import NotepadApp from './pages/apps/NotepadApp';
import CalculatorApp from './pages/apps/CalculatorApp';
import PaintApp from './pages/apps/PaintApp';
import { Page, UserRole } from './types';
import { database } from './services/database';

const BroadcastBanner: React.FC<{ message: string; onDismiss: () => void }> = ({ message, onDismiss }) => (
    <div className="bg-yellow-400 dark:bg-yellow-600 text-black dark:text-white p-2 text-center text-sm flex justify-center items-center relative animate-fade-in z-[60]">
        <span>{message}</span>
        <button onClick={onDismiss} className="absolute right-4 p-1 rounded-full hover:bg-black/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
    </div>
);

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isDark, setIsDark] = useState(true);
    const { user, isLoggedIn } = useAuth();
    const [broadcast, setBroadcast] = useState<{ message: string; is_active: boolean } | null>(null);
    const [showBroadcast, setShowBroadcast] = useState(false);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    useEffect(() => {
        const fetchBroadcast = async () => {
            const msg = await database.getBroadcastMessage();
            if (msg && msg.is_active) {
                const dismissed = sessionStorage.getItem('broadcastDismissed');
                if (dismissed !== 'true') {
                    setBroadcast(msg);
                    setShowBroadcast(true);
                }
            }
        };
        fetchBroadcast();
    }, []);

    const handleDismissBroadcast = () => {
        setShowBroadcast(false);
        sessionStorage.setItem('broadcastDismissed', 'true');
    };

    const navigate = useCallback((page: Page) => {
        setCurrentPage(page);
    }, []);

    const renderPage = () => {
        if (!isLoggedIn) {
            switch (currentPage) {
                case 'home':
                    return <HomePage />;
                case 'contact':
                    return <ContactPage />;
                case 'signin':
                    return <SignInPage navigate={navigate} />;
                default:
                    return <SignInPage navigate={navigate} />;
            }
        }

        // Logged in
        switch (currentPage) {
            case 'home':
                return <HomePage />;
            case 'contact':
                return <ContactPage />;
            case 'profile':
                return <ProfilePage navigate={navigate}/>;
            case 'admin':
                return user?.role === UserRole.Admin ? <AdminPortal /> : <ProfilePage navigate={navigate}/>;
            case 'app-phone':
                return <PhoneApp />;
            case 'app-chat':
                return <ChatApp />;
            case 'app-localmail':
                return <LocalMailApp />;
            case 'app-contacts':
                return <ContactsApp />;
            case 'app-notepad':
                return <NotepadApp />;
            case 'app-calculator':
                return <CalculatorApp />;
            case 'app-paint':
                return <PaintApp />;
            default:
                return <ProfilePage navigate={navigate}/>;
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500 font-sans transition-colors duration-300">
            {showBroadcast && broadcast && <BroadcastBanner message={broadcast.message} onDismiss={handleDismissBroadcast} />}
            <Header navigate={navigate} isDark={isDark} setIsDark={setIsDark} />
            <main className="flex-grow flex items-center justify-center p-4 overflow-hidden">
                <div key={currentPage} className="w-full h-full flex items-center justify-center animate-fade-in">
                    {renderPage()}
                </div>
            </main>
            <Footer />
            <CallWidget />
            <IncomingCallWidget />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <CallProvider>
                <AppContent />
            </CallProvider>
        </AuthProvider>
    );
};

export default App;
