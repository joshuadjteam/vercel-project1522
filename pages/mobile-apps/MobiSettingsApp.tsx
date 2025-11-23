
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, wallpapers } from '../../hooks/useTheme';
import { useLanguage } from '../../hooks/useLanguage';
import { Page } from '../../types';
import { database } from '../../services/database';

const BackIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m7 7H3" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const PaintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12.5a2 2 0 002-2v-6.5a2 2 0 00-2-2H7" /></svg>;
const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UpdateIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


interface MobiSettingsAppProps {
    navigate: (page: Page) => void;
}

const MobiSettingsApp: React.FC<MobiSettingsAppProps> = ({ navigate }) => {
    const { user, logout } = useAuth();
    const { wallpaper, setWallpaper } = useTheme();
    const { language, setLanguage, t } = useLanguage();
    
    const [view, setView] = useState<'main' | 'wallpaper' | 'security' | 'about' | 'update' | 'language'>('main');
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [status, setStatus] = useState('');
    
    const [updateInfo, setUpdateInfo] = useState<any>(null);
    const [checkingUpdate, setCheckingUpdate] = useState(false);
    const [updateStatus, setUpdateStatus] = useState<'idle' | 'downloading' | 'installing' | 'rebooting'>('idle');
    const [progress, setProgress] = useState(0);
    const [currentVersion, setCurrentVersion] = useState('12.0.2');

    useEffect(() => {
        if (user) {
            const storedPin = localStorage.getItem(`lynix_pin_${user.id}`);
            if (storedPin) setStatus('PIN is set');
        }
        const storedVer = localStorage.getItem('lynix_version');
        if (storedVer) setCurrentVersion(storedVer);
    }, [user]);

    const handleSetPin = () => {
        if (pin.length !== 4) { setStatus('PIN must be 4 digits'); return; }
        if (pin !== confirmPin) { setStatus('PINs do not match'); return; }
        if (user) { localStorage.setItem(`lynix_pin_${user.id}`, pin); setStatus('PIN saved successfully!'); setPin(''); setConfirmPin(''); }
    };

    const handleReset = () => {
        if (window.confirm("Are you sure you want to reset all local data? This will sign you out.")) {
            localStorage.clear(); logout(); navigate('signin');
        }
    };

    const checkForUpdate = async () => {
        setCheckingUpdate(true);
        const info = await database.checkSoftwareUpdate();
        setUpdateInfo(info);
        setCheckingUpdate(false);
    };

    const handleUpdate = () => {
        if (!updateInfo) return;
        setUpdateStatus('downloading');
        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 10;
            if (p >= 100) {
                clearInterval(interval);
                setProgress(100);
                setUpdateStatus('installing');
                setTimeout(() => {
                    setUpdateStatus('rebooting');
                    localStorage.setItem('lynix_version', updateInfo.latestVersion);
                    setTimeout(() => window.location.reload(), 2000);
                }, 3000);
            } else {
                setProgress(Math.min(p, 99));
            }
        }, 300);
    };

    if (view === 'update') {
        return (
            <div className="w-full h-full flex flex-col bg-[#121212] text-white font-sans">
                <header className="p-4 flex items-center space-x-4 border-b border-white/10">
                    <button onClick={() => setView('main')} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
                    <h1 className="text-xl font-medium">{t('systemUpdate')}</h1>
                </header>
                <div className="p-6 flex-grow flex flex-col items-center justify-center text-center">
                    {updateStatus === 'idle' && (
                        <>
                            <div className="w-24 h-24 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mb-6">
                                <UpdateIcon />
                            </div>
                            <h2 className="text-2xl font-light mb-2">LynixOS {currentVersion}</h2>
                            <p className="text-gray-400 mb-8">Your system is up to date</p>
                            
                            {!updateInfo ? (
                                <button onClick={checkForUpdate} disabled={checkingUpdate} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium transition-colors">
                                    {checkingUpdate ? 'Checking...' : 'Check for update'}
                                </button>
                            ) : (
                                <div className="w-full max-w-sm bg-[#1e1e1e] rounded-2xl p-6 text-left shadow-lg border border-white/10">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">Update Available</h3>
                                            <p className="text-blue-400 font-medium">{updateInfo.latestVersion} {updateInfo.latestCodeName}</p>
                                        </div>
                                        <span className="text-xs bg-white/10 px-2 py-1 rounded">{updateInfo.size}</span>
                                    </div>
                                    <p className="text-sm text-gray-300 mb-4 leading-relaxed">{updateInfo.summary}</p>
                                    <button onClick={handleUpdate} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold flex items-center justify-center space-x-2">
                                        <DownloadIcon />
                                        <span>Download and Install</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {updateStatus !== 'idle' && (
                        <div className="w-full max-w-xs text-center">
                            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden mb-4">
                                <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${progress}%`}}></div>
                            </div>
                            <h3 className="text-xl font-medium mb-1 capitalize">{updateStatus}...</h3>
                            <p className="text-gray-400 text-sm">{updateStatus === 'rebooting' ? 'Restarting system' : 'Please do not turn off your device'}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'about') {
        return (
            <div className="w-full h-full flex flex-col bg-[#121212] text-white font-sans">
                <header className="p-4 flex items-center space-x-4 border-b border-white/10">
                    <button onClick={() => setView('main')} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
                    <h1 className="text-xl font-medium">{t('aboutPhone')}</h1>
                </header>
                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="space-y-1">
                        <h2 className="text-sm text-gray-400">Device name</h2>
                        <p className="text-lg font-medium">Generic Lynix Mobile Simulation</p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm text-gray-400">Phone number</h2>
                        <p className="text-lg font-medium">{user?.phone_number || 'Unknown'}</p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm text-gray-400">Account</h2>
                        <p className="text-lg font-medium">{user?.username}</p>
                    </div>
                    <div className="w-full h-px bg-white/10 my-4"></div>
                    <div className="space-y-1">
                        <h2 className="text-sm text-gray-400">Lynix Version</h2>
                        <p className="text-lg font-medium">{currentVersion}</p>
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-sm text-gray-400">Android Version (Simulation)</h2>
                        <p className="text-lg font-medium">15</p>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'language') {
        return (
            <div className="w-full h-full flex flex-col bg-[#121212] text-white font-sans">
                <header className="p-4 flex items-center space-x-4 border-b border-white/10">
                    <button onClick={() => setView('main')} className="p-2 rounded-full hover:bg-white/10"><BackIcon /></button>
                    <h1 className="text-xl font-medium">{t('language')}</h1>
                </header>
                <div className="p-4 space-y-2">
                    <button onClick={() => setLanguage('en')} className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${language === 'en' ? 'bg-[#a8c7fa] text-[#041e49]' : 'bg-[#1e1e1e] text-white'}`}>
                        <span>English</span>
                        {language === 'en' && <span>✓</span>}
                    </button>
                    <button onClick={() => setLanguage('fr')} className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${language === 'fr' ? 'bg-[#a8c7fa] text-[#041e49]' : 'bg-[#1e1e1e] text-white'}`}>
                        <span>Français</span>
                        {language === 'fr' && <span>✓</span>}
                    </button>
                    <button onClick={() => setLanguage('es')} className={`w-full p-4 rounded-2xl text-left flex justify-between items-center ${language === 'es' ? 'bg-[#a8c7fa] text-[#041e49]' : 'bg-[#1e1e1e] text-white'}`}>
                        <span>Español</span>
                        {language === 'es' && <span>✓</span>}
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'wallpaper') { return (<div className="w-full h-full bg-[#121212] text-white"><header className="p-4 flex space-x-4 border-b border-white/10"><button onClick={()=>setView('main')}><BackIcon/></button><h1>{t('wallpaper')}</h1></header><div className="p-4 grid grid-cols-2 gap-4">{Object.entries(wallpapers).map(([k,v])=><button key={k} onClick={()=>setWallpaper(k)} className={`aspect-[9/16] border-2 rounded-2xl ${wallpaper===k?'border-blue-500':'border-transparent'}`}><div className={`w-full h-full ${v.class}`}></div></button>)}</div></div>); }
    if (view === 'security') { return (<div className="w-full h-full bg-[#121212] text-white"><header className="p-4 flex space-x-4 border-b border-white/10"><button onClick={()=>setView('main')}><BackIcon/></button><h1>{t('security')}</h1></header><div className="p-6 space-y-4"><input type="password" placeholder="PIN" value={pin} onChange={e=>setPin(e.target.value)} className="w-full bg-[#1e1e1e] p-4 rounded-lg text-center text-2xl" maxLength={4}/><input type="password" placeholder="Confirm" value={confirmPin} onChange={e=>setConfirmPin(e.target.value)} className="w-full bg-[#1e1e1e] p-4 rounded-lg text-center text-2xl" maxLength={4}/><button onClick={handleSetPin} className="w-full bg-blue-600 p-3 rounded-lg font-bold">Set PIN</button>{status&&<p className="text-center text-green-400">{status}</p>}</div></div>); }

    return (
        <div className="w-full h-full flex flex-col bg-[#121212] text-white font-sans">
            <header className="p-6 pb-2">
                <h1 className="text-3xl font-normal">{t('settings')}</h1>
            </header>
            
            <div className="p-4 space-y-4 flex-grow overflow-y-auto">
                <div className="bg-[#1e1e1e] rounded-3xl p-4 flex items-center space-x-4 mb-6">
                    <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-xl font-bold">{user?.username.charAt(0).toUpperCase()}</div>
                    <div className="flex-grow">
                        <h2 className="font-medium text-lg">{user?.username}</h2>
                        <p className="text-sm text-gray-400">Lynix Account</p>
                    </div>
                </div>

                <button onClick={() => setView('wallpaper')} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-orange-500/20 text-orange-400 rounded-full"><PaintIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('wallpaper')}</div></div>
                </button>

                <button onClick={() => setView('security')} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-green-500/20 text-green-400 rounded-full"><LockIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('security')}</div></div>
                </button>

                <button onClick={() => setView('language')} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-purple-500/20 text-purple-400 rounded-full"><GlobeIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('language')}</div><div className="text-xs text-gray-400">{language.toUpperCase()}</div></div>
                </button>

                <button onClick={() => setView('update')} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-full"><UpdateIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('systemUpdate')}</div><div className="text-xs text-gray-400">{currentVersion}</div></div>
                </button>

                <button onClick={handleReset} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-red-500/20 text-red-400 rounded-full"><TrashIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('reset')}</div></div>
                </button>

                <button onClick={() => setView('about')} className="w-full bg-[#1e1e1e] p-4 rounded-2xl flex items-center space-x-4 hover:bg-[#2c2c2c]">
                    <div className="p-2 bg-gray-500/20 text-gray-400 rounded-full"><InfoIcon /></div>
                    <div className="text-left flex-grow"><div className="font-medium">{t('aboutPhone')}</div></div>
                </button>
                
                <div className="pt-8">
                    <button onClick={() => logout()} className="w-full border border-gray-700 text-gray-300 py-3 rounded-full font-medium hover:bg-white/5">
                        {t('signOut')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobiSettingsApp;
