
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
    const [showLongWait, setShowLongWait] = useState(false);

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
                <button onclick="location.reload()" class="btn">Try Again</button>
            </body>
            </html>
        `;
        const blob = new Blob([html], { type: 'text/html' });
        return URL.createObjectURL(blob);
    };

    useEffect(() => {
        let isMounted = true;
        let timeoutId: any;
        let longWaitTimeoutId: any;

        const fetchData = async () => {
            try {
                setStatusText('Connecting to Proxy...');
                setPercent(10);
                
                // Timeout race (10 minutes now, to account for slow server response)
                const timeoutPromise = new Promise<any>((_, reject) => {
                    timeoutId = setTimeout(() => {
                        reject(new Error("Connection timed out (10m). The destination server is not responding."));
                    }, 600000); // 10 minutes
                });

                // Long wait message timer (1 minute)
                longWaitTimeoutId = setTimeout(() => {
                    if (isMounted) setShowLongWait(true);
                }, 60000); // 1 minute

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
                clearTimeout(longWaitTimeoutId);
                
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
                setStatusText('Processing Content...');
                await new Promise(resolve => setTimeout(resolve, 200));

                setPercent(90);
                setStatusText('Rendering...');
                
                // Create Blob
                let blob: Blob;
                
                // Check if content is a Base64 Data URI (Binary)
                if (typeof content === 'string' && content.startsWith('data:')) {
                    try {
                        const base64 = content.split(',')[1];
                        const binaryString = atob(base64);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        blob = new Blob([bytes], { type: contentType });
                    } catch (e) {
                        console.error("Failed to decode binary content in loader:", e);
                        // Fallback to treating as text if decoding fails, though it will likely be broken
                        blob = new Blob([content], { type: contentType });
                    }
                } else {
                    // Treat as standard text/html
                    blob = new Blob([content], { type: contentType.includes('html') ? 'text/html' : contentType || 'text/plain' });
                }

                const blobUrl = URL.createObjectURL(blob);
                
                setPercent(100);
                setStatusText('Loaded');

                setTimeout(() => {
                    if (isMounted) onComplete(blobUrl);
                }, 400);

            } catch (e: any) {
                clearTimeout(timeoutId);
                clearTimeout(longWaitTimeoutId);
                if (isMounted) {
                    console.error("BrowserLoader Error:", e);
                    setStatusText('Generating Error Report...');
                    const errorUrl = createErrorBlob(e.message || "Unknown error occurred");
                    setTimeout(() => { if(isMounted) onComplete(errorUrl); }, 500);
                }
            }
        };

        fetchData();

        return () => { 
            isMounted = false; 
            if (timeoutId) clearTimeout(timeoutId);
            if (longWaitTimeoutId) clearTimeout(longWaitTimeoutId);
        };
    }, [url, onComplete]);

    return (
        <div className="absolute inset-0 bg-[#1a1a1a] text-white flex flex-col items-center justify-center z-50 font-mono select-none">
            {showLongWait && (
                <div className="absolute top-10 w-[90%] max-w-md bg-yellow-900/90 border border-yellow-600 p-4 rounded-lg text-center animate-fade-in shadow-2xl backdrop-blur-md z-50">
                    <p className="text-sm text-yellow-100 mb-3 font-sans leading-relaxed">
                        Our Servers are taking longer time than usual... Please sit back as we try to connect!
                    </p>
                    <p className="text-xs text-yellow-200/80 font-sans flex flex-wrap items-center justify-center gap-1">
                        If you need to urgently go to this website, click the 
                        <button 
                            onClick={() => window.open(url, '_blank')}
                            className="px-2 py-0.5 bg-yellow-500 text-black font-bold rounded hover:bg-yellow-400 transition-colors text-xs mx-1"
                        >
                            Open Now
                        </button>
                        now.
                    </p>
                </div>
            )}
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
