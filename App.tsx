





import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme } from './hooks/useTheme';
import { CallProvider } from './hooks/useCall';
import { ConsoleViewProvider, useConsoleView } from './hooks/useConsoleView';
import useIsMobileDevice from './hooks/useIsMobileDevice';
import Header from './components/Header';
import Footer from './components/Footer';
import CallWidget from './components/CallWidget';
import IncomingCallWidget from './components/IncomingCallWidget';
import WindowComponent from './components/Window';
import FullScreenAppHeader from './components/FullScreenAppHeader';
import MobileTopBar from './components/MobileTopBar';
import MobileNavBar from './components/MobileNavBar';
import HomePage from './pages/HomePage';
import ConsolePage from './pages/ConsolePage';
import FaisConsole from './pages/FaisConsole';
import LegaLauncher from './pages/LegaLauncher';
import MobiLauncher from './pages/MobiLauncher';
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
import { Page, UserRole, AppLaunchable } from './types';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

// --- Icon Components (Centralized) ---
const PhoneIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const ChatIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ContactsIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 006-6v-1a6 6 0 00-9-5.197M12 14.354a4 4 0 110-5.292" /></svg>;
const MailIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const NotepadIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>;
const CodeEditorIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const FileExplorerIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>;
const CalendarIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const PaintIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343a2 2 0 01-1.414-.586l-1.414-1.414A2 2 0 0011.343 9H9a2 2 0 00-2 2v4a2 2 0 002 2z" /></svg>;
const CalculatorIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h3m-3-10h.01M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01M9 16h.01M12 16h.01M15 16h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UnitConverterIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>;
const AIIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const SwitcherIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
const ProfileIconSvg = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

const appsList: AppLaunchable[] = ([
  { id: 'app-phone', label: 'Phone', icon: <PhoneIcon />, page: 'app-phone' },
  { id: 'app-chat', label: 'Chat', icon: <ChatIcon />, page: 'app-chat' },
  { id: 'app-localmail', label: 'Mail', icon: <MailIcon />, page: 'app-localmail' },
  { id: 'app-files', label: 'Files', icon: <FileExplorerIcon />, page: 'app-files' },
  { id: 'app-editor', label: 'Editor', icon: <CodeEditorIcon />, page: 'app-editor', isHidden: true },
  { id: 'app-contacts', label: 'Contacts', icon: <ContactsIcon />, page: 'app-contacts' },
  { id: 'page-profile', label: 'My Profile', icon: <ProfileIconSvg />, page: 'profile' },
  { id: 'app-chat-ai', label: 'LynxAI', icon: <AIIcon />, page: 'app-chat', params: { initialTargetId: -1, title: 'LynxAI' } },
  { id: 'app-notepad', label: 'Notepad', icon: <NotepadIcon />, page: 'app-notepad' },
  { id: 'app-calendar', label: 'Calendar', icon: <CalendarIcon />, page: 'app-calendar' },
  { id: 'app-paint', label: 'Paint', icon: <PaintIcon />, page: 'app-paint' },
  { id: 'app-calculator', label: 'Calculator', icon: <CalculatorIcon />, page: 'app-calculator' },
  { id: 'app-converter', label: 'Converter', icon: <UnitConverterIcon />, page: 'app-converter' },
  { id: 'app-console-switch', label: 'Console Switch', icon: <SwitcherIcon />, page: 'app-console-switch' },
] as AppLaunchable[]).filter((app, index, self) => index === self.findIndex((a) => a.id === app.id));


export const APPS_MAP: Record<string, { component: React.FC<any>, defaultSize?: { width: number, height: number } }> = {
    'app-phone': { component: PhoneApp, defaultSize: { width: 420, height: 600 } },
    'app-chat': { component: ChatApp, defaultSize: { width: 1024, height: 768 } },
    'app-localmail': { component: LocalMailApp, defaultSize: { width: 1280, height: 800 } },
    'app-contacts': { component: ContactsApp, defaultSize: { width: 800, height: 600 } },
    'app-notepad': { component: NotepadApp, defaultSize: { width: 900, height: 650 } },
    'app-calculator': { component: CalculatorApp, defaultSize: { width: 380, height: 550 } },
    'app-paint': { component: PaintApp, defaultSize: { width: 900, height: 700 } },
    'app-files': { component: FileExplorerApp, defaultSize: { width: 1024, height: 768 } },
    'app-editor': { component: EditorApp, defaultSize: { width: 1024, height: 768 } },
    'app-converter': { component: UnitConverterApp, defaultSize: { width: 500, height: 600 } },
    'app-calendar': { component: CalendarApp, defaultSize: { width: 900, height: 700 } },
    'app-console-switch': { component: ConsoleSwitchApp, defaultSize: { width: 900, height: 500 } },
};

export type WindowState = 'normal' | 'minimized' | 'maximized';

export interface WindowInstance {
    id: string;
    appId: Page;
    title: string;
    icon?: React.ReactNode;
    props?: any;
    position: { x: number, y: number };
    size: { width: number, height: number };
    zIndex: number;
    state: WindowState;
}

interface DesktopContextType {
    windows: WindowInstance[];
    activeWindowId: string | null;
    openApp: (appId: Page, info: { title: string, icon?: React.ReactNode, props?: any }) => void;
    closeApp: (id: string) => void;
    focusApp: (id: string) => void;
    minimizeApp: (id: string) => void;
    updateAppPosition: (id: string, position: { x: number, y: number }) => void;
    updateAppSize: (id: string, size: { width: number, height: number }) => void;
}

const DesktopContext = createContext<DesktopContextType | undefined>(undefined);

export const useDesktop = () => {
    const context = useContext(DesktopContext);
    if (!context) throw new Error('useDesktop must be used within a DesktopProvider');
    return context;
};

const DesktopProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const zIndexCounterRef = useRef(10);

    const openApp = (appId: Page, info: { title: string, icon?: React.ReactNode, props?: any }) => {
        const existingWindow = windows.find(w => w.appId === appId && JSON.stringify(w.props) === JSON.stringify(info.props));
        if (existingWindow) {
            focusApp(existingWindow.id);
            return;
        }

        const newId = `${appId}-${Date.now()}`;
        const newZIndex = zIndexCounterRef.current + 1;
        zIndexCounterRef.current = newZIndex;

        const defaultSize = APPS_MAP[appId]?.defaultSize || { width: 800, height: 600 };
        const newWindow: WindowInstance = {
            id: newId,
            appId,
            title: info.title,
            icon: info.icon,
            props: info.props || {},
            position: { x: 50 + (windows.length % 10) * 30, y: 50 + (windows.length % 10) * 30 },
            size: defaultSize,
            zIndex: newZIndex,
            state: 'normal',
        };

        setWindows(prev => [...prev, newWindow]);
        setActiveWindowId(newId);
    };

    const closeApp = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };

    const focusApp = (id: string) => {
        if (activeWindowId === id) return;
        
        const newZIndex = zIndexCounterRef.current + 1;
        zIndexCounterRef.current = newZIndex;
        
        setWindows(prev => prev.map(w => w.id === id ? { ...w, zIndex: newZIndex, state: 'normal' } : w));
        setActiveWindowId(id);
    };

    const minimizeApp = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, state: 'minimized' } : w));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };
    
    const updateAppPosition = (id: string, position: { x: number, y: number }) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, position } : w));
    };

    const updateAppSize = (id: string, size: { width: number, height: number }) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, size } : w));
    };

    const value = { windows, activeWindowId, openApp, closeApp, focusApp, minimizeApp, updateAppPosition, updateAppSize };

    return <DesktopContext.Provider value={value}>{children}</DesktopContext.Provider>;
}

// --- Routing Helpers ---
const pageToPath = (page: Page, view: string, isLoggedIn: boolean): string => {
    if (page === 'home') {
        return isLoggedIn ? `/launcher/${view}` : '/';
    }
    if (page === 'contact') {
        return '/pages/contact-us';
    }
    if (page.startsWith('app-')) {
        return `/apps/${page.replace('app-', '')}`;
    }
    if (page === 'auth-callback') {
        return '/auth/callback';
    }
    return `/${page}`;
};

const pathToPage = (path: string): { page: Page, params: any } => {
    const parts = path.split('/').filter(p => p);

    if (parts.length === 0) return { page: 'home', params: {} };

    const [p1, p2] = parts;

    if (p1 === 'launcher') {
        return { page: 'home', params: {} };
    }
    if (p1 === 'pages' && p2 === 'contact-us') {
        return { page: 'contact', params: {} };
    }
    if (p1 === 'apps') {
        const appName = `app-${p2}`;
        if (Object.keys(APPS_MAP).includes(appName)) {
            return { page: appName as Page, params: {} };
        }
    }
    
    const simplePages: Page[] = ['signin', 'profile', 'admin', 'contact'];
    if (simplePages.includes(p1 as Page)) {
        return { page: p1 as Page, params: {} };
    }
    
    if(p1 === 'auth' && p2 === 'callback') {
        return { page: 'auth-callback', params: {} };
    }

    return { page: 'home', params: {} };
};

const getInitialState = (): { page: Page; params: any } => {
    return pathToPage(window.location.pathname);
};

const AppContent: React.FC = () => {
    const [pageState, setPageState] = useState(getInitialState);
    const { page: currentPage, params: pageParams } = pageState;
    const { user, isLoggedIn, isLoading } = useAuth();
    const { isDark } = useTheme();
    const { view, isInitialChoice } = useConsoleView();
    const { windows, activeWindowId, openApp, closeApp, focusApp, minimizeApp, updateAppPosition, updateAppSize } = useDesktop();
    const initialAppOpened = useRef(false);
    const isMobileDevice = useIsMobileDevice();

    const effectiveAppsList = useMemo(() => appsList.map(app => {
        if (app.id === 'app-console-switch') {
            return { ...app, isHidden: app.isHidden || isMobileDevice };
        }
        return app;
    }), [isMobileDevice]);

    const isWindowedConsole = (view === 'syno' || view === 'fais') && !isMobileDevice;

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const navigate = useCallback((page: Page, params?: any) => {
        const targetPage = page;

        if (targetPage.startsWith('app-') && isWindowedConsole) {
            const appDefinition = effectiveAppsList.find(app => app.page === targetPage);
            const appInfo = {
                title: appDefinition?.label || targetPage.replace('app-', ''),
                icon: appDefinition?.icon,
                props: { navigate, ...params },
            };
            openApp(targetPage, appInfo);
        } else {
            const newPath = pageToPath(targetPage, view, isLoggedIn);
            if (newPath !== window.location.pathname) {
                 if (currentPage === 'auth-callback') {
                    window.history.replaceState({ page: targetPage, params }, '', newPath);
                } else {
                    window.history.pushState({ page: targetPage, params }, '', newPath);
                }
            }
            setPageState({ page: targetPage, params: params || {} });
        }
    }, [view, isLoggedIn, isWindowedConsole, openApp, effectiveAppsList, currentPage]);

    useEffect(() => {
        const handlePopState = () => {
            setPageState(getInitialState());
        };
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);


    useEffect(() => {
        if (isInitialChoice && isLoggedIn && !initialAppOpened.current && !isMobileDevice) {
            navigate('app-console-switch');
            initialAppOpened.current = true;
        }
    }, [isInitialChoice, isLoggedIn, navigate, isMobileDevice]);


    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500 font-sans items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white"></div>
            </div>
        );
    }
    
    const renderConsole = () => {
        if (isMobileDevice) {
            return <MobiLauncher navigate={navigate} appsList={effectiveAppsList} />;
        }
        switch (view) {
            case 'syno':
                return <ConsolePage navigate={navigate} appsList={effectiveAppsList} />;
            case 'fais':
                return <FaisConsole navigate={navigate} appsList={effectiveAppsList} />;
            case 'lega':
                return <LegaLauncher navigate={navigate} appsList={effectiveAppsList} />;
            case 'con':
                return <ConConsole navigate={navigate} appsList={effectiveAppsList} />;
            default:
                return <ConsolePage navigate={navigate} appsList={effectiveAppsList} />;
        }
    };

    const renderPage = () => {
        if (!isLoggedIn) {
            switch (currentPage) {
                case 'home': return <HomePage />;
                case 'contact': return <ContactPage />;
                case 'signin': return <SignInPage navigate={navigate} />;
                case 'auth-callback': return <AuthCallbackPage navigate={navigate} />;
                default: return <SignInPage navigate={navigate} />;
            }
        }

        const AppToRender = APPS_MAP[currentPage]?.component;
        if (AppToRender && !isWindowedConsole) {
            return (
                <div className="w-full h-full flex flex-col">
                    <FullScreenAppHeader navigate={navigate} />
                    <div className="flex-grow overflow-auto relative">
                        {React.createElement(AppToRender, { ...pageParams, navigate })}
                    </div>
                </div>
            );
        }

        switch (currentPage) {
            case 'home':
                 return renderConsole();
            case 'contact': return <ContactPage />;
            case 'profile': return <ProfilePage navigate={navigate}/>;
            case 'admin': return user?.role === UserRole.Admin ? <AdminPortal /> : <ProfilePage navigate={navigate}/>;
            case 'auth-callback': return <AuthCallbackPage navigate={navigate} />;
            default:
                // If it's an app page but we are in windowed mode, we should render the console background
                if (currentPage.startsWith('app-') && isWindowedConsole) {
                    return renderConsole();
                }
                // Fallback for any other case
                return <HomePage />;
        }
    };
    
    // --- UI State Logic ---
    const showMobileLayout = isLoggedIn && isMobileDevice;
    const isConsolePage = isLoggedIn && currentPage === 'home';
    const isFullScreenApp = isLoggedIn && currentPage.startsWith('app-') && !isWindowedConsole;
    const showMainHeaderFooter = 
        (!isLoggedIn && currentPage !== 'auth-callback') ||
        (isLoggedIn && !isConsolePage && !isFullScreenApp && !showMobileLayout && currentPage !== 'auth-callback');
    const showStandardBackground = !isConsolePage && !isFullScreenApp && !showMobileLayout;
    const shouldCenterContent = showStandardBackground;

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${showStandardBackground ? 'bg-gradient-to-br from-sky-100 to-green-100 dark:from-cyan-600 dark:to-green-500' : ''} ${showMobileLayout ? 'bg-gray-700' : ''}`}>
            {showMainHeaderFooter && <Header navigate={navigate} />}
            {showMobileLayout && <MobileTopBar />}

            <main className={`flex-grow flex overflow-hidden relative ${shouldCenterContent ? 'items-center justify-center' : ''}`}>
                <div key={currentPage} className={`animate-fade-in ${shouldCenterContent ? '' : 'w-full h-full'}`}>
                    {renderPage()}
                </div>
                 {isLoggedIn && isWindowedConsole && (
                    <div className="absolute inset-0 pointer-events-none">
                        {windows.map(win => (
                             <WindowComponent
                                key={win.id}
                                win={{...win, props: {...win.props, closeWindow: () => closeApp(win.id)}}}
                                onClose={closeApp}
                                onFocus={focusApp}
                                onMinimize={minimizeApp}
                                onPositionChange={updateAppPosition}
                                onSizeChange={updateAppSize}
                                isActive={win.id === activeWindowId}
                            />
                        ))}
                    </div>
                )}
            </main>

            {showMainHeaderFooter && <Footer />}
            {showMobileLayout && <MobileNavBar navigate={navigate} />}
            <CallWidget />
            <IncomingCallWidget />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <CallProvider>
                    <DesktopProvider>
                        <ConsoleViewProvider>
                            <AppContent />
                        </ConsoleViewProvider>
                    </DesktopProvider>
                    <SpeedInsights />
                    <Analytics />
                </CallProvider>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;