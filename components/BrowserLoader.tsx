
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

    const createErrorBlob = (msg: string) => {
        const html = `
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #1a1a1a; display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; text-align: center; color: #e0e0e0; margin: 0; }
                    .icon { width: 64px; height: 64px; margin-bottom: 20px; color: #ef4444; }
                    h1 { font-size: 24px; margin-bottom: 10px; font-weight: 600; }
                    p { color: #a3a3a3; max-width: 400px; line-height: 1.5; }
                    .btn { margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; text-decoration: none; }
                    .btn:hover { background: #2563eb; }
                </style>
            </head>
            <body>
                <svg class="icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h1>Connection Failed</h1>
                <p>${msg}</p>
                <a href="#" onclick="location.reload()" class="btn">Try Again</a>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        return URL.createObjectURL(blob);
    };

    useEffect(() => {
        let isMounted = true;
        let timeoutId: any;

        const fetchData = async () => {
            try {
                setStatusText('Connecting...');
                setPercent(10);
                
                // Timeout race (15 seconds)
                const timeoutPromise = new Promise<any>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error("Connection timed out (15s limit). The proxy server is busy or the website is unreachable."));
                    }, 15000);
                });

                // Small delay for visual smoothness
                await new Promise(resolve => setTimeout(resolve, 200));
                if (!isMounted) return;
                
                setStatusText('Analyzing Security Headers...');
                setPercent(30);
                
                // Real Fetch via Edge Function Proxy, racing against timeout
                const result = await Promise.race([
                    database.fetchProxyContent(url),
                    timeoutPromise
                ]);

                clearTimeout(timeoutId);
                
                if (!isMounted) return;

                const { content, contentType, strippedHeaders, error } = result;

                if (error) {
                    throw new Error(error);
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
                clearTimeout(timeoutId);
                if (isMounted) {
                    setStatusText(`Error: ${e.message}`);
                    console.error("BrowserLoader Error:", e);
                    // Generate error page blob
                    const errorUrl = createErrorBlob(e.message || "Unknown error occurred");
                    setTimeout(() => { if(isMounted) onComplete(errorUrl); }, 1500);
                }
            }
        };

        fetchData();

        return () => { 
            isMounted = false; 
            if (timeoutId) clearTimeout(timeoutId);
        };
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
            <p className="text-xs text-gray-500 uppercase tracking-widest max-w-md text-center px-4 truncate">{statusText}</p>
        </div>
    );
};

export default BrowserLoader;
