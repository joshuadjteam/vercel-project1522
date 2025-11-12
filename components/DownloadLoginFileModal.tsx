import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;


interface DownloadLoginFileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DownloadLoginFileModal: React.FC<DownloadLoginFileModalProps> = ({ isOpen, onClose }) => {
    const { user, login } = useAuth();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setPassword('');
            setError('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !user) {
            setError('Password is required.');
            return;
        }
        setIsLoading(true);
        setError('');

        const { error: loginError } = await login(user.email, password);

        if (loginError) {
            setError('Incorrect password. Please try again.');
            setIsLoading(false);
            return;
        }

        // Generate a clean, human-readable, and consistent format.
        const fileContent = [
            `[{Username : ${user.username}}=user]`,
            `[{Password : ${password}}=pass]`,
            `[{Acctype : ${user.role.toUpperCase()}}=typeone]`,
            `[{Email : ${user.email}}=typeemailreq]`
        ].join('\n');

        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${user.username}.djlogin`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsLoading(false);
        onClose();
    };
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-light-card dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md text-light-text dark:text-white">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold">Generate Login File</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700">
                        <CloseIcon />
                    </button>
                </div>
                <form onSubmit={handleGenerate}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">For your security, please re-enter your password to confirm your identity and generate the `.djlogin` file.</p>
                        <input 
                            type="password"
                            placeholder="Your Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-gray-100 dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            autoFocus
                        />
                         {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    </div>
                    <div className="flex justify-end p-4 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors disabled:bg-green-800 flex items-center space-x-2">
                            <DownloadIcon />
                            <span>{isLoading ? 'Verifying...' : 'Generate & Download'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DownloadLoginFileModal;