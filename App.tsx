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
import LockScreen from './components/LockScreen';
import NotificationToast, { NotificationProps, DatabaseIcon } from './components/NotificationToast';

import HomePage from './pages/HomePage';
import ConsolePage from './pages/ConsolePage';
import FaisConsole from './pages/FaisConsole';
import LegaLauncher from './pages/LegaLauncher';
import ConConsole from './pages/ConConsole';
import WinLauncher from './pages/WinLauncher';
import MacLaunch from './pages/MacLaunch';
import COSLaunch from './pages/COSLaunch';
import SignInPage from './pages/SignInPage';
import ProfilePage from './pages/ProfilePage';
import AdminPortal from './pages/AdminPortal';
import SupportPage from './pages/SupportPage';
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
import LynixBrowserApp from './pages/apps/LynixBrowserApp';

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
import MobiLynixBrowserApp from './pages/mobile-apps/MobiLynixBrowserApp';
import MobiHelpApp from './pages/mobile-apps/MobiHelpApp';
import MobiCameraApp from './pages/mobile-apps/MobiCameraApp';
import MobiSettingsApp from './pages/mobile-apps/MobiSettingsApp';

import CallWidget from './components/CallWidget';
import CallNotificationWidget from './components/CallNotificationWidget';

import { Page, UserRole, AppLaunchable, WeblyApp } from './types';
import { database } from './services/database';

const WeblyStoreIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125A2.625 2.625 0 0012 4.875z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 10.125v10.125" /><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 10.125c.621 0 1.125.504 1.125 1.125v8.25" /><path strokeLinecap="round" strokeLinejoin="round" d="M5.625 10.125c-.621 0-1.125.504-1.125 1.125v8.25" /></svg>;
const ProfileIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const HelpAppIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CameraIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg>;
const SettingsAppIcon = (props: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0 3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

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
    'app-browser': { component: LynixBrowserApp, defaultSize: { width: 1000, height: 700 } },
};

export const FULL_PAGE_MAP: Record<string, React.FC<any>> = {
    'home': HomePage,
    'contact': SupportPage, 
    'support': SupportPage,
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
    'app-browser': LynixBrowserApp,
};

export const MOBILE_PAGES_MAP: Record<string, React.FC<any>> = {
    'home': MobiLauncher,
    'profile': MobiProfilePage,
    'admin': AdminPortal,
    'contact': MobiHelpApp, 
    'support': MobiHelpApp,
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
    'app-webview': MobiWebAppViewer, 
    'app-browser': MobiLynixBrowserApp, 
    'app-help': MobiHelpApp,
    'app-camera': MobiCameraApp,
    'app-settings': MobiSettingsApp,
};

export const APPS_LIST: AppLaunchable[] = [
  { id: 'app-webly-store', label: 'Store', icon: <WeblyStoreIcon />, page: 'app-webly-store' },
  { id: 'profile', label: 'Profile', icon: <ProfileIcon />, page: 'profile', isHidden: true },
  { id: 'app-help', label: 'Help?', icon: <HelpAppIcon />, page: 'app-help' },
  { id: 'app-camera', label: 'Camera', icon: <CameraIcon />, page: 'app-camera' },
  { id: 'app-settings', label: 'Settings', icon: <SettingsAppIcon />, page: 'app-settings' }
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

const BootScreen: React.FC = () => {
    const [stage, setStage] = useState(0);
    const [showText, setShowText] = useState(false);

    useEffect(() => {
        let currentTimeout: any;
        const runSequence = (index: number) => {
            if (index > 5) { setShowText(true); return; }
            setStage(index);
            const delay = index === 5 ? 5000 : 2000;
            currentTimeout = setTimeout(() => runSequence(index + 1), delay);
        };
        runSequence(0);
        return () => clearTimeout(currentTimeout);
    }, []);

    const renderStage = () => {
        switch (stage) {
            case 0: return <span className="text-9xl font-bold text-purple-600 animate-pulse">L</span>;
            case 1: return <span className="text-9xl font-bold text-green-500 animate-pulse">Y</span>;
            case 2: return <span className="text-9xl font-bold text-orange-500 animate-pulse">N</span>;
            case 3: return <span className="text-9xl font-bold text-teal-400 animate-pulse">I</span>;
            case 4: return <span className="text-9xl font-bold text-purple-500 animate-pulse">X</span>;
            case 5: 
            default:
                return (
                    <div className="flex flex-col items-center animate-fade-in">
                        <div className="w-32 h-32 bg-orange-500 rounded-xl flex items-center justify-center mb-8 relative overflow-hidden">
                            <div className="absolute inset-0 flex items-center justify-center"><div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-t-[60px] border-t-black/80 transform rotate-45"></div></div>
                            <div className="absolute inset-0 flex items-center justify-center"><div className="w-0 h-0 border-l-[40px] border-l-transparent border-r-[40px] border-r-transparent border-b-[60px] border-b-black/80 transform -rotate-45"></div></div>
                        </div>
                        <h1 className="text-2xl font-medium tracking-widest text-white mt-4">Powered by Lynix</h1>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[9999] text-white">
            <div className="flex-grow flex items-center justify-center">{renderStage()}</div>
            {showText && <div className="absolute bottom-16 text-white/80 text-sm animate-pulse">Lynix is starting...</div>}
        </div>
    );
};

const App: React.FC = () => {
    const { user, isLoggedIn, isLoading, updateUserProfile } = useAuth();
    const { view: consoleView, isInitialChoice } = useConsoleView();
    const [page, setPage] = useState<Page>('home');
    const [pageParams, setPageParams] = useState<any>({});
    const { isDark, wallpaper } = useTheme();
    const isMobileDevice = useIsMobileDevice();
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const nextZIndex = useRef(10);
    const [allWeblyApps, setAllWeblyApps] = useState<WeblyApp[]>([]);
    const [showBootScreen, setShowBootScreen] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const inactivityTimerRef = useRef<any>(null);
    const [recentApps, setRecentApps] = useState<AppLaunchable[]>([]);
    const [showRecents, setShowRecents] = useState(false);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    useEffect(() => {
        if (!isLoggedIn || !user?.auth_id) return;
        const handlePeriodicRefresh = async () => {
            setNotification({ title: 'Database', message: 'Refreshing apps... Services are going to be inactive for 5 seconds', icon: <DatabaseIcon /> });
            await new Promise(resolve => setTimeout(resolve, 5000));
            const { profile } = await database.getUserProfile(user.auth_id!);
            if (profile) updateUserProfile(profile);
            setNotification(null);
        };
        const intervalId = setInterval(handlePeriodicRefresh, 180000);
        return () => clearInterval(intervalId);
    }, [isLoggedIn, user?.auth_id, updateUserProfile]);

    useEffect(() => {
        if (!isMobileDevice || !isLoggedIn) return;
        const resetTimer = () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = setTimeout(() => setIsLocked(true), 30000);
        };
        resetTimer();
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('touchstart', resetTimer);
        return () => {
            if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('touchstart', resetTimer);
        };
    }, [isMobileDevice, isLoggedIn]);

    useEffect(() => {
        database.getWeblyApps().then(setAllWeblyApps);
    }, []);

    useEffect(() => {
        if (isMobileDevice) {
            setShowBootScreen(true);
            if ('Notification' in window) Notification.requestPermission();
            const timer = setTimeout(() => setShowBootScreen(false), 15500);
            return () => clearTimeout(timer);
        } else {
            setShowBootScreen(false);
        }
    }, [isMobileDevice]);

    const dynamicAppsList = useMemo(() => {
        const coreApps = APPS_LIST;
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

        if (user) {
            if (user.role === UserRole.Overdue) return availableApps.filter(app => ['profile', 'contact', 'support', 'app-console-switch', 'app-help'].includes(app.id));
            if (user.role === UserRole.NoChat) availableApps = availableApps.filter(app => app.id !== 'app-chat');
            if (user.role === UserRole.NoStore) availableApps = availableApps.filter(app => { if (app.id === 'app-webly-store') return false; if (app.id === 'profile' || app.id === 'app-help' || app.id === 'app-camera' || app.id === 'app-settings') return true; if (app.isWebApp) return false; return true; });
            if (user.role === UserRole.NoMail) availableApps = availableApps.filter(app => app.id !== 'app-localmail');
            if (user.role === UserRole.NoTelephony) availableApps = availableApps.filter(app => app.id !== 'app-phone');
        }
        return availableApps;
    }, [user, allWeblyApps, isMobileDevice]);
    
    useEffect(() => {
        const path = window.location.pathname;
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        if ((path === '/auth/callback' || path.startsWith('/auth/callback/')) && code && state) { setPage('auth-callback'); } else {
            const pageFromPath = path.substring(1) as Page;
            if (Object.keys(FULL_PAGE_MAP).includes(pageFromPath) || Object.keys(APPS_MAP).includes(pageFromPath)) {
                if (pageFromPath !== 'signin' && pageFromPath !== 'contact' && pageFromPath !== 'support') setPage(pageFromPath);
            } else { setPage('home'); }
        }
    }, []);

    const navigate = useCallback((newPage: Page, params: any = {}) => {
        const appData = params?.appData as AppLaunchable | undefined;
        if (isMobileDevice && appData) {
            setRecentApps(prev => { const filtered = prev.filter(app => app.id !== appData.id); return [appData, ...filtered].slice(0, 10); });
        }
        if (appData?.isWebApp && appData.url && appData.load_in_console === false) { window.open(appData.url, '_blank'); return; }
        const isWindowedConsole = isLoggedIn && !isMobileDevice && ['syno', 'fais', 'win', 'mac', 'cos'].includes(consoleView);
        const isApp = !!APPS_MAP[newPage as keyof typeof APPS_MAP];
        const isWindowablePage = ['contact', 'support', 'profile', 'admin'].includes(newPage);
        const isFullScreenOverride = newPage === 'app-console-switch';
        const shouldBeWindowed = isWindowedConsole && !isFullScreenOverride && (isApp || isWindowablePage || (appData?.isWebApp && appData?.load_in_console));

        if (shouldBeWindowed) {
            const existingWindow = windows.find(w => w.appId === newPage && w.props?.title === params?.title);
            if (existingWindow) {
                if (existingWindow.state === 'minimized') setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, state: 'open', zIndex: nextZIndex.current++ } : w));
                else setWindows(wins => wins.map(w => w.id === existingWindow.id ? { ...w, zIndex: nextZIndex.current++ } : w));
                setActiveWindowId(existingWindow.id); return;
            }
            const appConfig = APPS_MAP[newPage as keyof typeof APPS_MAP];
            const newWindow: WindowInstance = { id: `${newPage}-${Date.now()}`, appId: newPage, title: params?.title || APPS_LIST.find(app => app.page === newPage)?.label || newPage.charAt(0).toUpperCase() + newPage.slice(1), position: params?.position || { x: Math.random() * 200 + 50, y: Math.random() * 100 + 50 }, size: params?.size || appConfig?.defaultSize || { width: 700, height: 500 }, zIndex: nextZIndex.current++, state: 'open', props: params };
            setWindows([...windows, newWindow]); setActiveWindowId(newWindow.id);
        } else { setPage(newPage); setPageParams(params); }
    }, [isLoggedIn, isMobileDevice, consoleView, windows]);

    useEffect(() => { if (isLoggedIn && (page === 'home' || page === 'signin')) { if (!isMobileDevice && isInitialChoice) { navigate('app-console-switch'); } else { setPage('home'); } } }, [isLoggedIn, page, isMobileDevice, isInitialChoice, navigate]);

    const closeWindow = (id: string) => setWindows(windows.filter(win => win.id !== id));
    const focusWindow = (id: string) => { if (id === activeWindowId) return; setWindows(windows.map(win => win.id === id ? { ...win, zIndex: nextZIndex.current++ } : win)); setActiveWindowId(id); };
    const minimizeWindow = (id: string) => { setWindows(windows.map(win => win.id === id ? { ...win, state: 'minimized' } : win)); if (activeWindowId === id) { const nextActive = windows.filter(w => w.id !== id && w.state === 'open').sort((a, b) => b.zIndex - a.zIndex)[0]; setActiveWindowId(nextActive ? nextActive.id : null); } };
    const updateWindowPosition = (id: string, newPosition: { x: number, y: number }) => { setWindows(windows.map(win => win.id === id ? { ...win, position: newPosition } : win)); };
    const updateWindowSize = (id: string, newSize: { width: number, height: number }) => { setWindows(windows.map(win => win.id === id ? { ...win, size: newSize } : win)); };

    const renderLayout = () => {
        if (isLoading) {
            return isMobileDevice && showBootScreen ? <BootScreen /> : ( <div className="flex-grow flex items-center justify-center bg-black text-white"> <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div> </div> );
        }

        if (isLoggedIn) {
            if (isMobileDevice) {
                const MobileComponent = MOBILE_PAGES_MAP[page] || MobiLauncher;
                return (
                    <div className="absolute inset-0 flex flex-col overflow-hidden">
                        {showBootScreen && <BootScreen />}
                        <LockScreen isLocked={isLocked} onUnlock={() => setIsLocked(false)} />
                        <NotificationToast notification={notification} />
                        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none"><div className="pointer-events-auto"><MobileTopBar navigate={navigate} onSleep={() => setIsLocked(true)} /></div></div>
                        <main className="flex-grow relative w-full h-full overflow-hidden"><MobileComponent navigate={navigate} appsList={dynamicAppsList} {...pageParams} /></main>
                        {showRecents && (<div className="absolute inset-0 bg-black/90 backdrop-blur-md z-[60] flex flex-col p-6 animate-fade-in"><div className="flex justify-between items-center mb-6"><h2 className="text-white text-2xl font-bold">Recent Apps</h2><button onClick={() => setShowRecents(false)} className="text-white bg-white/10 px-4 py-2 rounded-full text-sm">Close</button></div>{recentApps.length === 0 ? ( <div className="flex-grow flex items-center justify-center text-gray-500">No recent apps</div> ) : ( <div className="flex-grow overflow-y-auto space-y-4 pb-20"> {recentApps.map(app => ( <div key={app.id} onClick={(e) => { e.stopPropagation(); navigate(app.page, { ...app.params, appData: app }); setShowRecents(false); }} className="bg-[#303030] p-4 rounded-2xl flex items-center space-x-4 shadow-lg active:scale-95 transition-transform"> <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center"> {React.cloneElement(app.icon as React.ReactElement<any>, { className: "w-8 h-8" })} </div> <span className="text-white font-bold text-lg">{app.label}</span> </div> ))} </div> )}<button onClick={() => { setRecentApps([]); setShowRecents(false); }} className="w-full py-3 bg-red-600/80 text-white rounded-xl font-semibold mt-4">Clear All</button></div>)}
                        <div className="relative z-50"><MobileNavBar navigate={navigate} onRecents={() => setShowRecents(true)} /></div>
                    </div>
                );
            }

            let ConsoleComponent;
            switch (consoleView) { case 'fais': ConsoleComponent = FaisConsole; break; case 'lega': ConsoleComponent = LegaLauncher; break; case 'con': ConsoleComponent = ConConsole; break; case 'win': ConsoleComponent = WinLauncher; break; case 'mac': ConsoleComponent = MacLaunch; break; case 'cos': ConsoleComponent = COSLaunch; break; default: ConsoleComponent = ConsolePage; }
            const windowedConsoles = ['syno', 'fais', 'win', 'mac', 'cos']; const isWindowedEnvironment = windowedConsoles.includes(consoleView); const isFullScreenOverride = page === 'app-console-switch'; const PageToRender = FULL_PAGE_MAP[page]; const isShowingAppPage = page !== 'home' && PageToRender && (!isWindowedEnvironment || isFullScreenOverride);
            if (isShowingAppPage) { return ( <div className="flex-grow flex flex-col overflow-hidden"> <FullScreenAppHeader navigate={navigate} pageParams={pageParams} /> <main className="flex-grow flex flex-col min-h-0"> <PageToRender navigate={navigate} {...pageParams} /> </main> </div> ); }
            return ( <div className="relative flex-grow overflow-hidden"> <ConsoleComponent navigate={navigate} appsList={dynamicAppsList} /> {isWindowedEnvironment && ( <div className="absolute inset-0 top-0 left-0 right-0 bottom-0 pointer-events-none overflow-hidden"> {windows.map(win => { const WindowContent = APPS_MAP[win.appId]?.component || FULL_PAGE_MAP[win.appId]; if (!WindowContent) return null; return ( <WindowComponent key={win.id} win={win} onClose={closeWindow} onFocus={focusWindow} onMinimize={minimizeWindow} onPositionChange={updateWindowPosition} onSizeChange={updateWindowSize} isActive={activeWindowId === win.id}> <WindowContent {...win.props} navigate={navigate} closeWindow={() => closeWindow(win.id)} /> </WindowComponent> ); })} </div> )} </div> );
        }

        if (page === 'auth-callback') { const PageToRender = FULL_PAGE_MAP[page]; return <div className="flex-grow flex items-center justify-center p-4"><PageToRender navigate={navigate} /></div>; }
        if (isMobileDevice) { return ( <div className="flex-grow flex flex-col bg-black text-white"> {showBootScreen && <BootScreen />} <main className="flex-grow overflow-y-auto"> <SignInPage navigate={navigate} hideGuest={true} /> </main> </div> ) }
        const PageToRender = page === 'signin' ? SignInPage : FULL_PAGE_MAP[page] || HomePage;
        return ( <> <Header navigate={navigate} /> <main className="flex-grow flex items-center justify-center p-4"> <PageToRender navigate={navigate} /> </main> <Footer /> </> );
    };
    
    const wallpaperClass = (isLoggedIn || !isMobileDevice) ? (wallpapers[wallpaper] || wallpapers.forest).class : 'bg-light-bg dark:bg-dark-bg';

    return (
        <div className={`flex flex-col min-h-screen ${isDark ? 'dark' : ''} ${wallpaperClass} font-sans transition-all duration-500`}>
            {renderLayout()}
            <CallWidget />
            <CallNotificationWidget />
        </div>
    );
};

const Root = () => ( <ThemeProvider> <AuthProvider> <ConsoleViewProvider> <CallProvider> <App /> </CallProvider> </ConsoleViewProvider> </AuthProvider> </ThemeProvider> );
export default Root;