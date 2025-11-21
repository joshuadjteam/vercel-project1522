
import React, { useState, useEffect, useRef } from 'react';
import { database } from '../services/database';

interface BrowserLoaderProps {
    url: string;
    isMobile?: boolean;
    onComplete: (blobUrl?: string) => void;
}

const BrowserLoader: React.FC<BrowserLoaderProps> = ({ url, isMobile, onComplete }) => {
    const [percent, setPercent] = useState(0);
    const [statusText, setStatusText] = useState('Initializing...');

    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                setStatusText('Connecting...');
                setPercent(10);
                
                // Small delay
                await new Promise(resolve => setTimeout(resolve, 200));
                if (!isMounted) return;
                
                setStatusText('Analyzing Security Headers...');
                setPercent(30);
                
                // Real Fetch via Edge Function Proxy
                const { content, contentType, strippedHeaders, error } = await database.fetchProxyContent(url);
                
                if (!isMounted) return;

                if (error) {
                    setStatusText(`Error: ${error}`);
                    setTimeout(() => onComplete(), 1000);
                    return;
                }

                setPercent(50);
                setStatusText('Stripping X-Frame-Options...');
                
                if (strippedHeaders && strippedHeaders.length > 0) {
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                setPercent(75);
                setStatusText('Injecting Base URL...');
                await new Promise(resolve => setTimeout(resolve, 200));

                setPercent(90);
                setStatusText('Rendering...');
                
                // Create Blob
                const blob = new Blob([content], { type: contentType.includes('html') ? 'text/html' : contentType || 'text/plain' });
                const blobUrl = URL.createObjectURL(blob);
                
                setPercent(100);
                setStatusText('Loaded');

                setTimeout(() => {
                    if (isMounted) onComplete(blobUrl);
                }, 400);

            } catch (e: any) {
                if (isMounted) setStatusText(`Critical Error`);
                setTimeout(() => { if(isMounted) onComplete(); }, 1000);
            }
        };

        fetchData();

        return () => { isMounted = false; };
    }, [url, onComplete]);

    // Mobile & Desktop share the same visual style for this specific "Operating System" feel
    return (
        <div className="absolute inset-0 bg-[#1a1a1a] text-white flex flex-col items-center justify-center z-50 font-mono select-none">
            <div className="mb-6 relative w-16 h-16">
                 <svg className="animate-spin h-full w-full text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
            <h1 className="text-3xl font-bold mb-4 tracking-wider">LynixWeb</h1>
            <div className="text-lg text-green-400 mb-2">
                {percent < 100 ? `Loading (${percent}%)` : 'Loaded'}
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-widest">{statusText}</p>
        </div>
    );
};

export default BrowserLoader;
