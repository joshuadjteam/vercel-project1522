import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef, useMemo } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider, useTheme, wallpapers } from './hooks/useTheme';
import { ConsoleViewProvider, useConsoleView } from './hooks/useConsoleView';
import { CallProvider } from './hooks/useCall';
import useIsMobileDevice from './hooks/useIsMobileDevice';
import Header from './components/Header';
import Footer from './components/Footer';
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
import WeblyStoreApp from './pages/apps/WeblyStoreApp';
import WebAppViewer from './pages/apps/WebAppViewer';
import HistoryApp from './pages/apps/HistoryApp';

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
import MobiLauncher from './pages/MobiLauncher';
import MobiConsoleSwitchApp from './pages/mobile-apps/MobiConsoleSwitchApp';
import MobiWeblyStoreApp from './pages/mobile-apps/MobiWeblyStoreApp';
import MobiWebAppViewer from './pages/mobile-apps/MobiWebAppViewer';
import MobiHistoryApp from './pages/mobile-apps/MobiHistoryApp';


// Call-related imports
import CallWidget from './components/CallWidget';
import CallNotificationWidget from './components/CallNotificationWidget';


import { Page, UserRole, AppLaunchable, WeblyApp } from './types';
import { database } from './services/database';

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
const WeblyStoreIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.125v10.125" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 10.125c.621 0 1.125.504 1.125 1.125v8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.625 10.125c-.621 0-1.125.504-1.125 1.125v8.25" /></svg>;
const HistoryIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


export const APPS_MAP: Record<string, { component: React.FC<any>, defaultSize?: { width: number, height: number } }> = {
    'app-phone': { component: PhoneApp, defaultSize: { width: 450, height: 700 } },
    'app-chat': { component: ChatApp },
    'app-localmail': { component: LocalMailApp },
    'app-contacts': { component: ContactsApp, defaultSize: { width: 800, height: 600 } },
    'app-notepad': { component: NotepadApp },
    'app-calculator': { component: CalculatorApp, defaultSize: { width: 400, height: 600 } },
    'app-paint': { component: PaintApp },
    'app-files': { component: FileExplorerApp },
    'app-editor': { component: EditorApp },
    'app-converter': { component: UnitConverterApp },
    'app-calendar': { component: CalendarApp },
    'app-console-switch': { component: ConsoleSwitchApp, defaultSize: { width: 900, height: 500 } },
    'app-webly-store': { component: WeblyStoreApp },
    'app-webview': { component: WebAppViewer, defaultSize: { width: 1024, height: 768 } },
    'app-history': { component: HistoryApp },
};

// All items that can be a "page", including full-screen apps and standalone pages
export const FULL_PAGE_MAP: Record<string, React.FC<any>> = {
    'home': HomePage,
    'contact': ContactPage,
    'signin': SignInPage,
    'profile': ProfilePage,
    'admin': AdminPortal,
    'auth-callback': AuthCallbackPage,
    'app-chat': ChatApp,
    'app-localmail': LocalMailApp,
    'app-notepad': NotepadApp,
    'app-paint': PaintApp,
    'app-files': FileExplorerApp,
    'app-editor': EditorApp,
    'app-converter': UnitConverterApp,
    'app-calendar': CalendarApp,
    'app-phone': PhoneApp,
    'app-contacts': ContactsApp,
    'app-calculator': CalculatorApp,
    'app-console-switch': ConsoleSwitchApp,
    'app-webly-store': WeblyStoreApp,
    'app-webview': WebAppViewer,
    'app-history': HistoryApp,
};

// All items that can be a "page" on mobile
export const MOBILE_PAGES_MAP: Record<string, React.FC<any>> = {
    'home': MobiLauncher,
    'profile': MobiProfilePage,
    'admin': AdminPortal,
    'contact': ContactPage,
    'app-phone': MobiPhoneApp,
    'app-chat': MobiChatApp,
    'app-localmail': MobiLocalMailApp,
    'app-contacts': MobiContactsApp,
    'app-notepad': MobiNotepadApp,
    'app-calculator': MobiCalculatorApp,
    'app-paint': MobiPaintApp,
    'app-files': MobiFileExplorerApp,
    'app-editor': MobiEditorApp,
    'app-converter': MobiUnitConverterApp,
    'app-calendar': MobiCalendarApp,
    'app-console-switch': MobiConsoleSwitchApp,
    'app-webly-store': MobiWeblyStoreApp,
    'app-history': MobiHistoryApp,
    'mobi-app-webview': MobiWebAppViewer,
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
  { id: 'app-webly-store', label: 'Webly Store', icon: <WeblyStoreIcon />, page: 'app-webly-store' },
  { id: 'app-history', label: 'History', icon: <HistoryIcon />, page: 'app-history' },
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
    const { user, isLoggedIn, isLoading } = useAuth();
    const { view: consoleView, isInitialChoice } = useConsoleView();
    const [page, setPage] = useState<Page>('home');
    const [pageParams, setPageParams] = useState<any>({});
    const { isDark, wallpaper } = useTheme();
    const isMobileDevice = useIsMobileDevice();
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const nextZIndex = useRef(10);
    const [allWeblyApps, setAllWeblyApps] = useState<WeblyApp[]>([]);

    useEffect(() => {
        database.getWeblyApps().then(setAllWeblyApps);
    }, []);

    const dynamicAppsList = useMemo(() => {
        const nativeApps = APPS_LIST;
        if (!user?.installed_webly_apps || allWeblyApps.length === 0) {
            return nativeApps;
        }

        const GenericWebIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21V3M12 3a9.004 9.004 0 00-8.716 6.747M12 3c4.805 0 8.716 3.91 8.716 8.747M3.284 8.747C5.536 4.29 8.276 3 12 3v18c-3.724 0-6.464-1.29-8.716-5.747" /></svg>;

        const installedWebApps: AppLaunchable[] = user.installed_webly_apps
            .map((appId): AppLaunchable | null => {
                const appData = allWeblyApps.find(app => app.id === appId);
                if (!appData) return null;
                return {
                    id: `webly-${appData.id}`,
                    label: appData.name,
                    icon: appData.icon_svg ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: appData.icon_svg }} /> : <GenericWebIcon />,
                    page: isMobileDevice ? 'mobi-app-webview' : 'app-webview',
                    isWebApp: true,
                    url: appData.url,
                    load_in_console: appData.load_in_console,
                    params: { url: appData.url, title: appData.name, isWebApp: true } 
                };
            })
            .filter((app): app is AppLaunchable => app !== null);
        
        return [...nativeApps, ...installedWebApps];
    }, [user?.installed_webly_apps, allWeblyApps, isMobileDevice]);
    
    useEffect(() => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if ((path === '/auth/callback' || path.startsWith('/auth/callback/')) && code && state) {
            setPage('auth-callback');
        } else {
            const pageFromPath = path.substring(1) as Page;
            if (Object.keys(FULL_PAGE_MAP).includes(pageFromPath) || Object.keys(APPS_MAP).includes(pageFromPath)) {
                if (pageFromPath !== 'signin' && pageFromPath !== 'contact') {
                    setPage(pageFromPath);
                }
            } else {
                setPage('home');
            }
        }
    }, []);

    const navigate = useCallback((newPage: Page, params: any = {}) => {
        const isWindowedConsole = isLoggedIn && !isMobileDevice && ['syno', 'fais'].includes(consoleView);
        const isApp = !!APPS_MAP[newPage as keyof typeof APPS_MAP];
        const appData = params?.appData as AppLaunchable | undefined;
        
        const isWindowablePage = ['contact', 'profile', 'admin'].includes(newPage);
        const isFullScreenOverride = newPage === 'app-console-switch';
        
        const shouldBeWindowed = isWindowedConsole && !isFullScreenOverride && (
            isApp || isWindowablePage || (appData?.isWebApp && appData?.load_in_console)
        );

        if (shouldBeWindowed) {
            const existingWindow = windows.find(w => w.appId === newPage && w.props?.title === params?.title);
            if (existingWindow) {
                if (existingWindow.state === 'minimized') {
                     setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, state: 'open', zIndex: nextZIndex.current++ } : w));
                } else {
                    setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, zIndex: nextZIndex.current++ } : w));
                }
                setActiveWindowId(existingWindow.id);
                return;
            }

            const appConfig = APPS_MAP[newPage as keyof typeof APPS_MAP];
            const newWindow: WindowInstance = {
                id: `${newPage}-${Date.now()}`,
                appId: newPage,
                title: params?.title || APPS_LIST.find(app => app.page === newPage)?.label || newPage.charAt(0).toUpperCase() + newPage.slice(1),
                position: params?.position || { x: Math.random() * 200 + 50, y: Math.random() * 100 + 50 },
                size: params?.size || appConfig?.defaultSize || { width: 700, height: 500 },
                zIndex: nextZIndex.current++,
                state: 'open',
                props: params,
            };
            setWindows([...windows, newWindow]);
            setActiveWindowId(newWindow.id);
        } else {
            // Otherwise, navigate full screen. This applies to mobile and non-windowed consoles.
            setPage(newPage);
            setPageParams(params);
        }
    }, [isLoggedIn, isMobileDevice, consoleView, windows]);

    useEffect(() => {
        if (isLoggedIn && (page === 'home' || page === 'signin')) {
           if (!isMobileDevice && isInitialChoice) {
               navigate('app-console-switch');
           } else {
              setPage('home'); 
           }
        }
    }, [isLoggedIn, page, isMobileDevice, isInitialChoice, navigate]);

    const closeWindow = (id: string) => setWindows(windows.filter(win => win.id !== id));
    
    const focusWindow = (id: string) => {
        if (id === activeWindowId) return;
        setWindows(windows.map(win => win.id === id ? { ...win, zIndex: nextZIndex.current++ } : win));
        setActiveWindowId(id);
    };

    const minimizeWindow = (id: string) => {
        setWindows(windows.map(win => win.id === id ? { ...win, state: 'minimized' } : win));
        if (activeWindowId === id) {
            const nextActive = windows.filter(w => w.id !== id && w.state === 'open').sort((a, b) => b.zIndex - a.zIndex)[0];
            setActiveWindowId(nextActive ? nextActive.id : null);
        }
    };
    
    const updateWindowPosition = (id: string, newPosition: { x: number, y: number }) => {
        setWindows(windows.map(win => win.id === id ? { ...win, position: newPosition } : win));
    };

    const updateWindowSize = (id: string, newSize: { width: number, height: number }) => {
        setWindows(windows.map(win => win.id === id ? { ...win, size: newSize } : win));
    };

    const renderLayout = () => {
        if (isLoading) {
            return (
                <div className="flex-grow flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            );
        }

        if (isLoggedIn) {
            if (isMobileDevice) {
                const MobileComponent = MOBILE_PAGES_MAP[page] || MobiLauncher;
                return (
                    <>
                        <MobileTopBar navigate={navigate} />
                        <main className="flex-grow overflow-hidden">
                            <MobileComponent navigate={navigate} appsList={dynamicAppsList} {...pageParams} />
                        </main>
                        <MobileNavBar navigate={navigate} />
                    </>
                );
            }

            // --- Desktop Logged In ---
            let ConsoleComponent;
            switch (consoleView) {
                case 'fais': ConsoleComponent = FaisConsole; break;
                case 'lega': ConsoleComponent = LegaLauncher; break;
                case 'con': ConsoleComponent = ConConsole; break;
                default: ConsoleComponent = ConsolePage; // 'syno'
            }

            const windowedConsoles = ['syno', 'fais'];
            const isWindowedEnvironment = windowedConsoles.includes(consoleView);

            const isFullScreenOverride = page === 'app-console-switch';

            const PageToRender = FULL_PAGE_MAP[page];
            const isShowingAppPage = page !== 'home' && PageToRender && (!isWindowedEnvironment || isFullScreenOverride);
            

            if (isShowingAppPage) {
                return (
                    <div className="flex-grow flex flex-col overflow-hidden">
                        <FullScreenAppHeader navigate={navigate} pageParams={pageParams} />
                        <main className="flex-grow overflow-y-auto">
                            <PageToRender navigate={navigate} {...pageParams} />
                        </main>
                    </div>
                );
            }

            // Render the base console environment (either windowed or fullscreen launcher)
            return (
                <div className="relative flex-grow overflow-hidden">
                    <ConsoleComponent navigate={navigate} appsList={dynamicAppsList} />
                    {isWindowedEnvironment && (
                        <div className="absolute inset-0 top-12 pointer-events-none">
                            {windows.map(win => {
                                const WindowContent = APPS_MAP[win.appId]?.component || FULL_PAGE_MAP[win.appId];
                                if (!WindowContent) return null;
                                return (
                                    <WindowComponent key={win.id} win={win} onClose={closeWindow} onFocus={focusWindow} onMinimize={minimizeWindow} onPositionChange={updateWindowPosition} onSizeChange={updateWindowSize} isActive={activeWindowId === win.id}>
                                       <WindowContent {...win.props} navigate={navigate} closeWindow={() => closeWindow(win.id)} />
                                    </WindowComponent>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        // --- Not Logged In ---
        if (page === 'auth-callback') {
            const PageToRender = FULL_PAGE_MAP[page];
            return <div className="flex-grow flex items-center justify-center p-4"><PageToRender navigate={navigate} /></div>;
        }
        
        if (isMobileDevice) {
             return (
                <div className="flex-grow flex flex-col">
                    <main className="flex-grow overflow-y-auto">
                       <SignInPage navigate={navigate} />
                    </main>
                </div>
             )
        }
        
        const PageToRender = page === 'signin' ? SignInPage : FULL_PAGE_MAP[page] || HomePage;


        return (
            <>
                <Header navigate={navigate} />
                <main className="flex-grow flex items-center justify-center p-4">
                    <PageToRender navigate={navigate} />
                </main>
                <Footer />
            </>
        );
    };
    
    const wallpaperClass = (isLoggedIn || !isMobileDevice)
        ? (wallpapers[wallpaper] || wallpapers.forest).class
        : 'bg-light-bg dark:bg-dark-bg';

    return (
        <div className={`flex flex-col min-h-screen ${isDark ? 'dark' : ''} ${wallpaperClass} font-sans transition-all duration-500`}>
            {renderLayout()}
            <CallWidget />
            <CallNotificationWidget />
        </div>
    );
};

const Root = () => (
    <ThemeProvider>
        <AuthProvider>
            <ConsoleViewProvider>
                <CallProvider>
                    <App />
                </CallProvider>
            </ConsoleViewProvider>
        </AuthProvider>
    </ThemeProvider>
);

export default Root;
