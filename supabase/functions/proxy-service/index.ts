
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { url, method, headers, body: requestBody } = body;

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Proxying request: ${method || 'GET'} ${url}`);

    // Clean headers to prevent CORS issues with upstream
    const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
    };

    // Copy allowed headers from input
    if (headers) {
        const allowedHeaders = ['content-type', 'authorization', 'accept', 'x-requested-with', 'range'];
        for (const key in headers) {
            if (allowedHeaders.includes(key.toLowerCase())) {
                fetchHeaders[key] = headers[key];
            }
        }
    }

    // Fetch the target website
    const response = await fetch(url, {
        method: method || 'GET',
        headers: fetchHeaders,
        body: requestBody,
        redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Identify and Strip Security Headers
    const securityHeaders = ['x-frame-options', 'content-security-policy', 'x-content-type-options', 'strict-transport-security'];
    const strippedHeaders: string[] = [];
    securityHeaders.forEach(header => {
        if (response.headers.has(header)) {
            strippedHeaders.push(header);
        }
    });

    // Collect headers to forward to the client
    const responseHeaders: Record<string, string> = {};
    const headersToForward = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'date', 'last-modified', 'etag', 'cache-control'];
    response.headers.forEach((value, key) => {
        if (headersToForward.includes(key.toLowerCase())) {
            responseHeaders[key] = value;
        }
    });

    // Determine if content is text or binary using an Allowlist approach
    // If it's not explicitly text, treat as binary to be safe (video chunks, images, etc.)
    const isText = 
        contentType.includes('text/') || 
        contentType.includes('json') || 
        contentType.includes('javascript') || 
        contentType.includes('ecmascript') ||
        contentType.includes('xml') ||
        contentType.includes('image/svg+xml');

    if (isText) {
        let html = await response.text();
        
        // Only inject into HTML pages
        if (contentType.includes('text/html')) {
            const urlObj = new URL(url);
            const origin = urlObj.origin;

            // 1. Inject <base> tag for relative links
            if (!html.includes('<base')) {
                const baseTag = `<base href="${origin}/" target="_self">`;
                if (html.includes('<head')) {
                     html = html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
                } else {
                    html = `${baseTag}${html}`;
                }
            }

            // 2. Inject Navigation & Fetch Interceptor
            const bypassSignature = `
            <!-- 
                Lynix Proxy v2.1 (Binary Support Enabled)
                Mode: Active Bypass & API Tunnel
                Stripped: ${strippedHeaders.join(', ') || 'None'}
            -->
            <script>
                (function() {
                    console.log('Lynix Proxy: Initializing Real-Time Update (RTU) System v2.1...');
                    
                    const originalFetch = window.fetch;
                    const originalXHR = window.XMLHttpRequest;

                    const uuid = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

                    // --- Helper: Decode Base64 to Uint8Array ---
                    function base64ToUint8Array(base64) {
                        const binaryString = atob(base64);
                        const len = binaryString.length;
                        const bytes = new Uint8Array(len);
                        for (let i = 0; i < len; i++) {
                            bytes[i] = binaryString.charCodeAt(i);
                        }
                        return bytes;
                    }

                    // --- 1. Intercept Fetch ---
                    window.fetch = async function(input, init) {
                        let url = input;
                        if (input instanceof Request) url = input.url;
                        url = url.toString();

                        // Passthrough for blob/data URLs
                        if (url.startsWith('data:') || url.startsWith('blob:')) return originalFetch(input, init);

                        // console.log('Lynix Proxy: Intercepting Fetch to', url);
                        
                        const requestId = uuid();
                        const method = init?.method || 'GET';
                        const headers = init?.headers ? Object.fromEntries(new Headers(init.headers)) : {};
                        const body = init?.body;

                        window.parent.postMessage({
                            type: 'PROXY_REQUEST',
                            id: requestId,
                            payload: { url, method, headers, body }
                        }, '*');

                        return new Promise((resolve, reject) => {
                            const handler = (event) => {
                                if (event.data && event.data.type === 'PROXY_RESPONSE' && event.data.id === requestId) {
                                    window.removeEventListener('message', handler);
                                    const { content, contentType, headers: respHeaders, error } = event.data.response;
                                    
                                    if (error) {
                                        reject(new TypeError('Network Error: ' + error));
                                    } else {
                                        let blob;
                                        // Detect Base64 Data URI (Binary)
                                        if (typeof content === 'string' && content.startsWith('data:')) {
                                            try {
                                                const base64 = content.split(',')[1];
                                                const bytes = base64ToUint8Array(base64);
                                                blob = new Blob([bytes], { type: contentType });
                                            } catch (e) {
                                                console.error("Failed to decode binary response", e);
                                                blob = new Blob([""], { type: contentType });
                                            }
                                        } else {
                                            blob = new Blob([content], { type: contentType });
                                        }

                                        // Construct Response with forwarded headers
                                        const initOptions = { 
                                            status: 200, 
                                            statusText: 'OK', 
                                            headers: respHeaders || { 'Content-Type': contentType } 
                                        };
                                        resolve(new Response(blob, initOptions));
                                    }
                                }
                            };
                            window.addEventListener('message', handler);
                        });
                    };

                    // --- 2. Intercept XHR ---
                    // Many sites (like YouTube) still use XHR for some things
                    window.XMLHttpRequest = function() {
                        const xhr = new originalXHR();
                        const originalOpen = xhr.open;
                        const originalSend = xhr.send;
                        
                        xhr.open = function(method, url, async, user, password) {
                            this._url = url;
                            this._method = method;
                            return originalOpen.apply(this, arguments);
                        };

                        xhr.send = function(body) {
                            if (this._url.startsWith('data:') || this._url.startsWith('blob:')) {
                                return originalSend.apply(this, arguments);
                            }

                            const requestId = uuid();
                            
                            // We can't easily block XHR sync, so we simulate the request via our proxy
                            // and populate the XHR object properties. This is complex, so for now
                            // we will fallback to fetch if possible, or just do the request.
                            // BUT, replacing Fetch covers 90% of modern apps.
                            // YouTube uses fetch for video chunks mostly.
                            
                            // For full XHR support we'd need to basically re-implement XHR on top of our fetch hook.
                            // Simplified XHR hook:
                            const self = this;
                            
                            // Note: This is a partial polyfill.
                            // It might be better to leave XHR alone if it causes issues, 
                            // but XHR will fail due to CORS/X-Frame without proxy.
                            // Let's defer to the native fetch interceptor for now, as most heavy apps utilize fetch.
                            return originalSend.apply(this, arguments);
                        };
                        return xhr;
                    };

                    // --- 3. Navigation Interceptor ---
                    document.addEventListener('click', function(e) {
                        const anchor = e.target.closest('a');
                        if (anchor && anchor.href) {
                            if(anchor.getAttribute('href').startsWith('#') || anchor.href.startsWith('javascript:')) return;
                            e.preventDefault();
                            e.stopPropagation();
                            window.parent.postMessage({ type: 'LYNIX_NAVIGATE', url: anchor.href }, '*');
                        }
                    }, true);
                    
                    // --- 4. Form Interceptor ---
                    document.addEventListener('submit', function(e) {
                       const form = e.target;
                       if(form.method.toLowerCase() === 'get') {
                           e.preventDefault();
                           const url = new URL(form.action);
                           new FormData(form).forEach((value, key) => url.searchParams.append(key, value));
                           window.parent.postMessage({ type: 'LYNIX_NAVIGATE', url: url.toString() }, '*');
                       }
                    });

                })();
            </script>
            `;
            
            if (html.includes('<body')) {
                html = html.replace(/<body[^>]*>/i, (match) => `${match}${bypassSignature}`);
            } else {
                html += bypassSignature;
            }
        }

        return new Response(JSON.stringify({ 
            content: html, 
            contentType, 
            headers: responseHeaders,
            strippedHeaders 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } else {
        // Handle Binary Content (Images, Video, Audio, PDF, etc.)
        // We convert the buffer to a Base64 Data URI string.
        // The client-side interceptor script detects the 'data:' prefix and decodes it back to a Blob.
        
        const buffer = await response.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        // Chunked processing for large files to avoid stack overflow
        for (let i = 0; i < len; i += 1024) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + 1024, len)) as any);
        }
        const base64 = btoa(binary);
        const content = `data:${contentType};base64,${base64}`; 

        return new Response(JSON.stringify({ 
            content, 
            contentType, 
            headers: responseHeaders,
            strippedHeaders 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

  } catch (error) {
    console.error('Proxy Service Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
