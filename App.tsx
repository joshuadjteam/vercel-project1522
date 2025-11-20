







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


// Call-related imports
import CallWidget from './components/CallWidget';
import CallNotificationWidget from './components/CallNotificationWidget';


import { Page, UserRole, AppLaunchable, WeblyApp } from './types';
import { database } from './services/database';

// --- Icon Components (Centralized) ---
const WeblyStoreIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.125v10.125" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 10.125c.621 0 1.125.504 1.125 1.125v8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.625 10.125c-.621 0-1.125.504-1.125 1.125v8.25" /></svg>;
const ProfileIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


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
    'mobi-app-webview': MobiWebAppViewer,
    'app-webview': MobiWebAppViewer, // Ensure app-webview maps to mobile viewer
};


export const APPS_LIST: AppLaunchable[] = [
  { id: 'app-webly-store', label: 'Webly Store', icon: <WeblyStoreIcon />, page: 'app-webly-store' },
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
        const coreApps = APPS_LIST;
        // Default empty if not loaded
        let availableApps: AppLaunchable[] = coreApps;

        if (user?.installed_webly_apps && allWeblyApps.length > 0) {
             const installedApps: AppLaunchable[] = user.installed_webly_apps
                .map((appId): AppLaunchable | null => {
                    const appData = allWeblyApps.find(app => app.id === appId);
                    if (!appData) return null;

                    const isNative = !!APPS_MAP[appData.id];
                    
                    return {
                        id: appData.id,
                        label: appData.name,
                        icon: <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: appData.icon_svg }} />,
                        page: isNative ? (appData.id as Page) : (isMobileDevice ? 'mobi-app-webview' : 'app-webview'),
                        isWebApp: !isNative,
                        url: appData.url,
                        load_in_console: appData.load_in_console,
                        params: isNative ? {} : { url: appData.url, title: appData.name, isWebApp: true, iconSvg: appData.icon_svg } 
                    };
                })
                .filter((app): app is AppLaunchable => app !== null);
            
            availableApps = [...coreApps, ...installedApps];
        }

        // --- Apply Role Restrictions ---
        if (user) {
            if (user.role === UserRole.Overdue) {
                // Overdue users can only access Profile (to pay/manage account) and Contact
                return availableApps.filter(app => ['profile', 'contact', 'app-console-switch'].includes(app.id));
            }
            
            if (user.role === UserRole.NoChat) {
                availableApps = availableApps.filter(app => app.id !== 'app-chat');
            }

            if (user.role === UserRole.NoStore) {
                // No Store: Remove store app AND any installed web-apps (keep only internal system apps)
                availableApps = availableApps.filter(app => {
                    // Hide store app
                    if (app.id === 'app-webly-store') return false;
                    // Keep profile
                    if (app.id === 'profile') return true;
                    // If it is a web app (installed from store), hide it to prevent workaround
                    if (app.isWebApp) return false;
                    // Keep internal system apps
                    return true;
                });
            }

            if (user.role === UserRole.NoMail) {
                availableApps = availableApps.filter(app => app.id !== 'app-localmail');
            }

            if (user.role === UserRole.NoTelephony) {
                availableApps = availableApps.filter(app => app.id !== 'app-phone');
            }
        }

        return availableApps;
    }, [user, allWeblyApps, isMobileDevice]);
    
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
        // Check if this app is configured to open in a new tab (external)
        const appData = params?.appData as AppLaunchable | undefined;
        
        if (appData?.isWebApp && appData.url && appData.load_in_console === false) {
            window.open(appData.url, '_blank');
            return;
        }

        const isWindowedConsole = isLoggedIn && !isMobileDevice && ['syno', 'fais'].includes(consoleView);
        const isApp = !!APPS_MAP[newPage as keyof typeof APPS_MAP];
        
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
                        <main className="flex-grow overflow-hidden flex flex-col min-h-0">
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
                        <main className="flex-grow flex flex-col min-h-0">
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