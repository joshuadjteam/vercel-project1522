
import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { CallProvider } from './hooks/useCall';
import Header from './components/Header';
import Footer from './components/Footer';
import CallWidget from './components/CallWidget';
import IncomingCallWidget from './components/IncomingCallWidget';
import HomePage from './pages/HomePage';
import ConsolePage from './pages/ConsolePage';
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
import FileExplorerApp from './pages/apps/FileExplorerApp';
import EditorApp from './pages/apps/EditorApp';
import UnitConverterApp from './pages/apps/UnitConverterApp';
import CalendarApp from './pages/apps/CalendarApp';
import AuthCallbackPage from './pages/AuthCallbackPage';
import { Page, UserRole } from './types';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

const getInitialPage = (): Page => {
    if (window.location.pathname === '/auth/callback') {
        return 'auth-callback';
    }
    return 'home';
};

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>(getInitialPage());
    const [currentFile, setCurrentFile] = useState<string | null>(null);
    const [initialChatTargetId, setInitialChatTargetId] = useState<number | null>(null);
    const [isDark, setIsDark] = useState(true);
    const { user, isLoggedIn, isLoading } = useAuth();

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const navigate = useCallback((page: Page, params?: any) => {
        // When navigating away from the callback page, update the URL
        if (window.location.pathname === '/auth/callback' && page !== 'auth-callback') {
             window.history.replaceState({}, document.title, '/');
        }

        setCurrentPage(page);
        if (page === 'app-editor' && params?.file) {
            setCurrentFile(params.file);
        } else if (page !== 'app-editor') {
            setCurrentFile(null);
        }

        if (page === 'app-chat' && params?.targetUserId !== undefined) {
            setInitialChatTargetId(params.targetUserId);
        } else if (page !== 'app-chat') {
            setInitialChatTargetId(null);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500 font-sans items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
        );
    }

    const renderPage = () => {
        if (!isLoggedIn) {
            switch (currentPage) {
                case 'home':
                    return <HomePage />;
                case 'contact':
                    return <ContactPage />;
                case 'signin':
                    return <SignInPage navigate={navigate} />;
                case 'auth-callback':
                    return <AuthCallbackPage navigate={navigate} />;
                default:
                    return <SignInPage navigate={navigate} />;
            }
        }

        // Logged in
        const isGuest = user?.role === UserRole.Trial;

        const RestrictedAccess = () => (
            <div className="w-full max-w-lg bg-light-card/80 dark:bg-teal-800/50 backdrop-blur-sm border border-red-500/50 rounded-2xl shadow-2xl p-8 text-light-text dark:text-white text-center flex flex-col items-center">
                <img src="https://i.imgur.com/gY2VgC2.png" alt="Access Denied" className="w-32 h-32 mb-6" />
                <h2 className="text-2xl font-bold text-red-500 dark:text-red-400 mb-4">Access Denied</h2>
                <p className="text-lg">We cannot allow you to use this service! Please login using your credentials to use these features.</p>
            </div>
        );

        switch (currentPage) {
            case 'home':
            case 'console':
                return <ConsolePage navigate={navigate} />;
            case 'contact':
                return <ContactPage />;
            case 'profile':
                return <ProfilePage navigate={navigate}/>;
            case 'admin':
                return user?.role === UserRole.Admin ? <AdminPortal /> : <ProfilePage navigate={navigate}/>;
            case 'app-phone':
                return <PhoneApp />;
            case 'app-chat':
                return isGuest ? <RestrictedAccess /> : <ChatApp initialTargetId={initialChatTargetId} />;
            case 'app-localmail':
                return isGuest ? <RestrictedAccess /> : <LocalMailApp />;
            case 'app-contacts':
                return <ContactsApp />;
            case 'app-notepad':
                return isGuest ? <RestrictedAccess /> : <NotepadApp />;
            case 'app-calculator':
                return <CalculatorApp />;
            case 'app-paint':
                return <PaintApp />;
            case 'app-files':
                return isGuest ? <RestrictedAccess /> : <FileExplorerApp navigate={navigate} />;
            case 'app-editor':
                return isGuest ? <RestrictedAccess /> : <EditorApp navigate={navigate} initialFile={currentFile} />;
            case 'app-converter':
                return <UnitConverterApp />;
            case 'app-calendar':
                return <CalendarApp />;
            case 'auth-callback':
                return <AuthCallbackPage navigate={navigate} />;
            default:
                return <ConsolePage navigate={navigate}/>;
        }
    };
    
    const isConsolePage = isLoggedIn && (currentPage === 'home' || currentPage === 'console');

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isConsolePage ? '' : 'bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500'}`}>
            <Header navigate={navigate} isDark={isDark} setIsDark={setIsDark} />
            <main className={`flex-grow flex items-center justify-center overflow-hidden ${isConsolePage ? '' : 'p-4'}`}>
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
                <SpeedInsights />
                <Analytics />
            </CallProvider>
        </AuthProvider>
    );
};

export default App;
