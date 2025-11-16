




import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { CallProvider } from './hooks/useCall';
import { SipProvider } from './hooks/useSip';
import { ConsoleViewProvider, useConsoleView } from './hooks/useConsoleView';
import useIsMobileDevice from './hooks/useIsMobileDevice';
import Header from './components/Header';
import Footer from './components/Footer';
import CallWidget from './components/CallWidget';
import SipCallWidget from './components/SipCallWidget';
import CallNotificationWidget from './components/CallNotificationWidget';
import WindowComponent from './components/Window';
import FullScreenAppHeader from './components/FullScreenAppHeader';
import MobileTopBar from './components/MobileTopBar';
import MobileNavBar from './components/MobileNavBar';
import HomePage from './pages/HomePage';
import ConsolePage from './pages/ConsolePage';
import FaisConsole from './pages/FaisConsole';
import LegaLauncher from './pages/LegaLauncher';
import ConConsole from './pages/ConConsole';
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
import ConsoleSwitchApp from './pages/apps/ConsoleSwitchApp';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Mobile App Imports
import MobiProfilePage from './pages/mobile-apps/MobiProfilePage';
import MobiPhoneApp from './pages/mobile-apps/MobiPhoneApp';
import MobiChatApp from './pages/mobile-apps/MobiChatApp';
import MobiLocalMailApp from './pages/mobile-apps/MobiLocalMailApp';
import MobiContactsApp from './pages/mobile-apps/MobiContactsApp';
import MobiNotepadApp from './pages/mobile-apps/MobiNotepadApp';
import MobiCalculatorApp from './pages/mobile-apps/MobiCalculatorApp';
import MobiPaintApp from './pages/mobile-apps/MobiPaintApp';
import MobiFileExplorerApp from './pages/mobile-apps/MobiFileExplorerApp';
import MobiEditorApp from './pages/mobile-apps/MobiEditorApp';
import MobiUnitConverterApp from './pages/mobile-apps/MobiUnitConverterApp';
import MobiCalendarApp from './pages/mobile-apps/MobiCalendarApp';
import MobileSignInPage from './pages/MobileSignInPage';
import MobiLauncher from './pages/MobiLauncher';
import MobiConsoleSwitchApp from './pages/mobile-apps/MobiConsoleSwitchApp';


import { Page, UserRole, AppLaunchable } from './types';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

// --- Icon Components (Centralized) ---
const PhoneIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const MailIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ContactsIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const NotepadIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21H3v-3.5L15.232 5.232z" /></svg>;
const CalculatorIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m-6 4h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h10a2 2 0 012 2v14a2 2 0 01-2 2z" /></svg>;
const PaintIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12.5a2 2 0 002-2v-6.5a2 2 0 00-2-2H7" /></svg>;
const FilesIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>;
const EditorIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const ConverterIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const CalendarIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ConsoleSwitchIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const ProfileIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


export const APPS_MAP: Record<string, { component: React.FC<any>, isFullScreen?: boolean, defaultSize?: { width: number, height: number } }> = {
    'app-phone': { component: PhoneApp, defaultSize: { width: 450, height: 700 } },
    'app-chat': { component: ChatApp, isFullScreen: true },
    'app-localmail': { component: LocalMailApp, isFullScreen: true },
    'app-contacts': { component: ContactsApp, defaultSize: { width: 800, height: 600 } },
    'app-notepad': { component: NotepadApp, isFullScreen: true },
    'app-calculator': { component: CalculatorApp, defaultSize: { width: 400, height: 600 } },
    'app-paint': { component: PaintApp, isFullScreen: true },
    'app-files': { component: FileExplorerApp, isFullScreen: true },
    'app-editor': { component: EditorApp, isFullScreen: true },
    'app-converter': { component: UnitConverterApp, isFullScreen: true },
    'app-calendar': { component: CalendarApp, isFullScreen: true },
    'app-console-switch': { component: ConsoleSwitchApp, defaultSize: { width: 900, height: 500 } },
    'profile': { component: MobiProfilePage }, // For mobile
};

export const APPS_LIST: AppLaunchable[] = [
  { id: 'app-phone', label: 'Phone', icon: <PhoneIcon />, page: 'app-phone' },
  { id: 'app-chat', label: 'Chat', icon: <ChatIcon />, page: 'app-chat' },
  { id: 'app-localmail', label: 'LocalMail', icon: <MailIcon />, page: 'app-localmail' },
  { id: 'app-contacts', label: 'Contacts', icon: <ContactsIcon />, page: 'app-contacts' },
  { id: 'app-notepad', label: 'Notepad', icon: <NotepadIcon />, page: 'app-notepad' },
  { id: 'app-calculator', label: 'Calculator', icon: <CalculatorIcon />, page: 'app-calculator' },
  { id: 'app-paint', label: 'Paint', icon: <PaintIcon />, page: 'app-paint' },
  { id: 'app-files', label: 'Files', icon: <FilesIcon />, page: 'app-files' },
  { id: 'app-editor', label: 'Editor', icon: <EditorIcon />, page: 'app-editor' },
  { id: 'app-converter', label: 'Converter', icon: <ConverterIcon />, page: 'app-converter' },
  { id: 'app-calendar', label: 'Calendar', icon: <CalendarIcon />, page: 'app-calendar' },
  { id: 'app-console-switch', label: 'Consoles', icon: <ConsoleSwitchIcon />, page: 'app-console-switch' },
  { id: 'profile', label: 'Profile', icon: <ProfileIcon />, page: 'profile', isHidden: true },
];

export interface WindowInstance {
    id: string;
    appId: Page;
    title: string;
    position: { x: number, y: number };
    size: { width: number, height: number };
    zIndex: number;
    state: 'open' | 'minimized';
    props?: any;
}

const App: React.FC = () => {
    const { isLoggedIn, isLoading } = useAuth();
    const { view: consoleView, isInitialChoice } = useConsoleView();
    const [page, setPage] = useState<Page>('home');
    const [pageParams, setPageParams] = useState<any>({});
    const { isDark } = useTheme();
    const isMobileDevice = useIsMobileDevice();
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const nextZIndex = useRef(10);
    
    // Handle initial routing from URL path for OAuth callbacks
    useEffect(() => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if ((path === '/auth/callback' || path.startsWith('/auth/callback/')) && code && state) {
            setPage('auth-callback');
        }
    }, []);

    const navigate = useCallback((newPage: Page, params: any = {}) => {
        // For windowed consoles, opening an app creates a window
        if (isLoggedIn && !isMobileDevice && (consoleView === 'syno' || consoleView === 'fais' || consoleView === 'lega' || consoleView === 'con') && newPage.startsWith('app-')) {
            const appConfig = APPS_MAP[newPage];
            if (!appConfig) return;

            // Check if window already exists
            const existingWindow = windows.find(w => w.appId === newPage);
            if (existingWindow) {
                // If it exists and is minimized, restore it and focus.
                if (existingWindow.state === 'minimized') {
                     setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, state: 'open', zIndex: nextZIndex.current++ } : w));
                } else {
                    // Otherwise, just focus it.
                    setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, zIndex: nextZIndex.current++ } : w));
                }
                setActiveWindowId(existingWindow.id);
                return;
            }

            const newWindow: WindowInstance = {
                id: `${newPage}-${Date.now()}`,
                appId: newPage,
                title: APPS_LIST.find(app => app.page === newPage)?.label || 'Application',
                position: { x: Math.random() * 200 + 50, y: Math.random() * 100 + 50 },
                size: appConfig.defaultSize || { width: 700, height: 500 },
                zIndex: nextZIndex.current++,
                state: 'open',
                props: params,
            };
            setWindows([...windows, newWindow]);
            setActiveWindowId(newWindow.id);
        } else {
            // For full-screen consoles or mobile, just change the page
            setPage(newPage);
            setPageParams(params);
        }
    }, [isLoggedIn, isMobileDevice, consoleView, windows]);

    useEffect(() => {
        if (isLoggedIn && page === 'home') {
           // If logged in, 'home' should redirect to the console launcher.
           if (isMobileDevice) {
               // Default to MobiLauncher on mobile
           } else if (isInitialChoice) {
               navigate('app-console-switch');
           }
        }
    }, [isLoggedIn, page, isMobileDevice, isInitialChoice, navigate]);

    // Window management functions
    const closeWindow = (id: string) => setWindows(windows.filter(win => win.id !== id));
    const focusWindow = (id: string) => {
        if (id === activeWindowId) return;
        setWindows(windows.map(win => win.id === id ? { ...win, zIndex: nextZIndex.current++ } : win));
        setActiveWindowId(id);
    };
    const minimizeWindow = (id: string) => setWindows(windows.map(win => win.id === id ? { ...win, state: 'minimized' } : win));
    const updateWindowPosition = (id: string, newPosition: { x: number, y: number }) => {
        setWindows(wins => wins.map(w => w.id === id ? { ...w, position: newPosition } : w));
    };
    const updateWindowSize = (id: string, newSize: { width: number, height: number }) => {
        setWindows(wins => wins.map(w => w.id === id ? { ...w, size: newSize } : w));
    };


    const renderPage = () => {
        if (isLoggedIn && isMobileDevice) {
            const MobiAppComponent = APPS_MAP[page]?.component;
            if (MobiAppComponent) {
                 switch (page) {
                    case 'home': return <MobiLauncher navigate={navigate} appsList={APPS_LIST} />;
                    case 'profile': return <MobiProfilePage navigate={navigate} />;
                    case 'app-phone': return <MobiPhoneApp />;
                    case 'app-chat': return <MobiChatApp {...pageParams} />;
                    case 'app-localmail': return <MobiLocalMailApp />;
                    case 'app-contacts': return <MobiContactsApp />;
                    case 'app-notepad': return <MobiNotepadApp />;
                    case 'app-calculator': return <MobiCalculatorApp />;
                    case 'app-paint': return <MobiPaintApp />;
                    case 'app-files': return <MobiFileExplorerApp navigate={navigate} />;
                    case 'app-editor': return <MobiEditorApp navigate={navigate} {...pageParams} />;
                    case 'app-converter': return <MobiUnitConverterApp />;
                    case 'app-calendar': return <MobiCalendarApp />;
                    case 'app-console-switch': return <MobiConsoleSwitchApp />;
                    default: return <MobiLauncher navigate={navigate} appsList={APPS_LIST} />;
                 }
            }
             return <MobiLauncher navigate={navigate} appsList={APPS_LIST} />;
        }

        switch (page) {
            case 'home': return isLoggedIn ? <ConsolePage navigate={navigate} appsList={APPS_LIST} /> : <HomePage />;
            case 'contact': return <ContactPage />;
            case 'signin': return <SignInPage navigate={navigate} />;
            case 'profile': return <ProfilePage navigate={navigate} />;
            case 'admin': return <AdminPortal />;
            case 'auth-callback': return <AuthCallbackPage navigate={navigate} />;
            default: return isLoggedIn ? <ConsolePage navigate={navigate} appsList={APPS_LIST} /> : <HomePage />;
        }
    };
    
    const renderConsole = () => {
        switch (consoleView) {
            case 'fais': return <FaisConsole navigate={navigate} appsList={APPS_LIST} />;
            case 'lega': return <LegaLauncher navigate={navigate} appsList={APPS_LIST} />;
            case 'con': return <ConConsole navigate={navigate} appsList={APPS_LIST} />;
            case 'syno':
            default:
                return <ConsolePage navigate={navigate} appsList={APPS_LIST} />;
        }
    };
    
    if (isLoading) {
        return <div className="w-screen h-screen bg-dark-bg flex items-center justify-center text-white">Loading...</div>;
    }

    const isFullScreenApp = (isLoggedIn && !isMobileDevice && (APPS_MAP[page]?.isFullScreen || isInitialChoice));

    return (
        <div className={`w-screen h-screen overflow-hidden flex flex-col ${isDark ? 'dark' : ''}`}>
             <Analytics />
             <SpeedInsights />
            {isLoggedIn ? (
                isMobileDevice ? (
                    <div className="w-screen h-screen flex flex-col bg-light-bg dark:bg-dark-bg">
                        <MobileTopBar />
                        <main className="flex-grow overflow-auto flex flex-col">
                            {renderPage()}
                        </main>
                        <MobileNavBar navigate={navigate} />
                    </div>
                ) : (
                    isFullScreenApp ? (
                        <div className="flex-grow flex flex-col overflow-hidden">
                            <FullScreenAppHeader navigate={navigate} />
                            <main className="flex-grow overflow-auto">
                               {APPS_MAP[page]?.isFullScreen && React.createElement(APPS_MAP[page].component, { navigate, ...pageParams })}
                               {isInitialChoice && <ConsoleSwitchApp closeWindow={() => navigate('home')} />}
                            </main>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col overflow-hidden relative">
                             {renderConsole()}
                            {/* Window manager area */}
                            <div className="absolute inset-0 pointer-events-none p-4">
                                {windows.map(win => (
                                    <WindowComponent
                                        key={win.id}
                                        win={win}
                                        onClose={closeWindow}
                                        onFocus={focusWindow}
                                        onMinimize={minimizeWindow}
                                        onPositionChange={updateWindowPosition}
                                        onSizeChange={updateWindowSize}
                                        isActive={win.id === activeWindowId}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                )
            ) : ( // Not logged in
                isMobileDevice ? (
                    <MobileSignInPage navigate={navigate} />
                ) : (
                    <div className="flex-grow flex flex-col bg-light-bg dark:bg-dark-bg">
                        <Header navigate={navigate} />
                        <main className="flex-grow flex items-center justify-center p-4" style={{backgroundImage: 'linear-gradient(to top, #1a202c, #2d3748)'}}>
                            {renderPage()}
                        </main>
                        <Footer />
                    </div>
                )
            )}
            <CallWidget />
            <SipCallWidget />
            <CallNotificationWidget />
        </div>
    );
};

const Root: React.FC = () => (
    <AuthProvider>
        <ThemeProvider>
            <ConsoleViewProvider>
                <SipProvider>
                    <CallProvider>
                        <App />
                    </CallProvider>
                </SipProvider>
            </ConsoleViewProvider>
        </ThemeProvider>
    </AuthProvider>
);

export default Root;