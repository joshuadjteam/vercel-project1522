
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
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('home');
    const [isDark, setIsDark] = useState(true);
    const { user, isLoggedIn } = useAuth();

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

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
                <SpeedInsights />
                <Analytics />
            </CallProvider>
        </AuthProvider>
    );
};

export default App;