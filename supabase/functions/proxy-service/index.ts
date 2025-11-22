
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-proxy-cookie',
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

    let targetOrigin = '';
    try {
        targetOrigin = new URL(url).origin;
    } catch (e) {
        targetOrigin = 'https://www.google.com';
    }

    // Mimic Chrome 124 on Windows
    const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
    
    const fetchHeaders: Record<string, string> = {
        'User-Agent': chromeUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': targetOrigin + '/',
    };

    // Handle Client Cookies
    if (headers && headers['x-proxy-cookie']) {
        fetchHeaders['Cookie'] = headers['x-proxy-cookie'];
    }

    // Merge allowed headers
    if (headers) {
        const allowedHeaders = ['content-type', 'authorization', 'accept', 'range', 'x-requested-with', 'x-csrf-token', 'x-guest-token', 'x-twitter-active-user', 'x-twitter-client-language'];
        for (const key in headers) {
            if (allowedHeaders.includes(key.toLowerCase())) {
                fetchHeaders[key] = headers[key];
            }
        }
    }

    // Manual Redirect Handling
    let currentUrl = url;
    let response: Response;
    let redirectCount = 0;
    const maxRedirects = 10;
    const accumulatedCookies: string[] = [];
    
    const targetMethod = (method || 'GET').toUpperCase();

    // Initial request loop
    while (true) {
        try {
            const fetchOptions: any = {
                method: targetMethod,
                headers: fetchHeaders,
                redirect: 'manual'
            };

            // STRICT body check: only attach if method allows body AND body exists
            if (requestBody && targetMethod !== 'GET' && targetMethod !== 'HEAD') {
                fetchOptions.body = requestBody;
            }

            response = await fetch(currentUrl, fetchOptions);
        } catch (e) {
            throw { status: 502, message: `Upstream connection failed: ${e.message}` };
        }

        // Capture cookies
        let cookies: string[] = [];
        if (typeof (response.headers as any).getSetCookie === 'function') {
             cookies = (response.headers as any).getSetCookie();
        } else {
             const c = response.headers.get('set-cookie');
             if (c) cookies = c.split(/,(?=\s*[a-zA-Z0-9_-]+=)/); 
        }
        
        if (cookies.length > 0) {
            accumulatedCookies.push(...cookies);
            const newCookies = cookies.map(c => c.split(';')[0]).join('; ');
            const existing = fetchHeaders['Cookie'] || '';
            fetchHeaders['Cookie'] = existing ? `${existing}; ${newCookies}` : newCookies;
        }

        if ([301, 302, 303, 307, 308].includes(response.status)) {
            if (redirectCount >= maxRedirects) break;
            const location = response.headers.get('location');
            if (!location) break;
            
            try {
                currentUrl = new URL(location, currentUrl).href;
            } catch (e) {
                currentUrl = location;
            }
            redirectCount++;
        } else {
            break;
        }
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    const responseHeaders: Record<string, string> = {};
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'date', 'last-modified', 'etag'].forEach(k => {
        const v = response.headers.get(k);
        if (v) responseHeaders[k] = v;
    });

    const isHTML = contentType.includes('text/html');

    if (isHTML) {
        let html = await response.text();
        const urlObj = new URL(currentUrl);
        const origin = urlObj.origin;
        const pathname = urlObj.pathname + urlObj.search;

        // Inject Base Tag
        if (!html.includes('<base')) {
            const baseTag = `<base href="${origin}/" target="_self">`;
            html = html.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
        }

        // Strip Security Headers from Meta
        html = html.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '<!-- CSP Stripped by Lynix -->');
        html = html.replace(/integrity="[^"]*"/gi, '');

        // Advanced Stealth Script v6
        const stealthScript = `
        <script>
            (function() {
                console.log('[Lynix] RTU v6 (Anti-Loop) Active');

                // 1. Service Worker Mock (Robust)
                if (navigator.serviceWorker) {
                    const dummyRegistration = {
                        active: { state: 'activated', scriptURL: '', postMessage: () => {} },
                        waiting: null,
                        installing: null,
                        scope: '/',
                        unregister: () => Promise.resolve(true),
                        update: () => Promise.resolve(),
                        onupdatefound: null,
                        pushManager: {
                            getSubscription: () => Promise.resolve(null),
                            subscribe: () => Promise.resolve({ endpoint: '' }),
                            permissionState: () => Promise.resolve('granted')
                        }
                    };
                    
                    Object.defineProperty(navigator, 'serviceWorker', {
                        get: function() {
                            return {
                                register: (script, options) => {
                                    console.log('[Lynix] Mock SW Register:', script);
                                    return Promise.resolve(dummyRegistration);
                                },
                                getRegistration: () => Promise.resolve(dummyRegistration),
                                getRegistrations: () => Promise.resolve([dummyRegistration]),
                                ready: Promise.resolve(dummyRegistration),
                                addEventListener: () => {},
                                removeEventListener: () => {},
                                controller: dummyRegistration.active,
                                startMessages: () => {}
                            };
                        }
                    });
                }

                // 2. History API Spoofing
                const targetPath = "${pathname}";
                try {
                    window.history.replaceState(null, '', targetPath);
                } catch(e) {}

                // 3. Cookie Jar
                const CookieJar = {
                    store: new Map(),
                    parse: function(cookieStr) {
                        if(!cookieStr) return;
                        const list = Array.isArray(cookieStr) ? cookieStr : [cookieStr];
                        list.forEach(str => {
                            const parts = str.split(';');
                            const [pair] = parts;
                            if(pair) {
                                const idx = pair.indexOf('=');
                                if(idx > -1) {
                                    const key = pair.substring(0, idx).trim();
                                    const val = pair.substring(idx+1).trim();
                                    this.store.set(key, val);
                                }
                            }
                        });
                    },
                    toString: function() {
                        const arr = [];
                        for(const [k,v] of this.store) arr.push(k+'='+v);
                        return arr.join('; ');
                    }
                };

                const seed = ${JSON.stringify(accumulatedCookies)};
                CookieJar.parse(seed);

                try {
                    Object.defineProperty(document, 'cookie', {
                        get: function() { return CookieJar.toString(); },
                        set: function(val) { CookieJar.parse(val); return val; },
                        configurable: true
                    });
                } catch(e) {}

                // 4. Navigator Spoofing
                const navMocks = {
                    userAgent: "${chromeUserAgent}",
                    appVersion: "${chromeUserAgent.replace('Mozilla/', '')}",
                    platform: "Win32",
                    vendor: "Google Inc.",
                    language: "en-US",
                    hardwareConcurrency: 8,
                    deviceMemory: 8,
                    webdriver: false,
                    permissions: { query: () => Promise.resolve({ state: 'granted' }) }
                };
                for (const k in navMocks) {
                    try { Object.defineProperty(navigator, k, { get: () => navMocks[k] }); } catch(e) {}
                }

                // 5. Fetch Interception
                const originalFetch = window.fetch;
                const uuid = () => Math.random().toString(36).substring(2);

                function resolveUrl(u) {
                    try { return new URL(u, document.baseURI).href; } catch(e) { return u; }
                }

                window.fetch = async function(input, init) {
                    let url, method, headers = {}, body;

                    if (input instanceof Request) {
                        url = input.url;
                        method = input.method;
                        input.headers.forEach((v, k) => headers[k] = v);
                        if (init) {
                            if (init.method) method = init.method;
                            if (init.headers) {
                                if (init.headers instanceof Headers) init.headers.forEach((v, k) => headers[k] = v);
                                else Object.assign(headers, init.headers);
                            }
                            if (init.body) body = init.body;
                        }
                    } else {
                        url = input;
                        method = init?.method || 'GET';
                        if (init?.headers) {
                            if (init.headers instanceof Headers) init.headers.forEach((v, k) => headers[k] = v);
                            else Object.assign(headers, init.headers);
                        }
                        body = init?.body;
                    }

                    url = resolveUrl(url);

                    if (url.startsWith('data:') || url.startsWith('blob:')) {
                        return originalFetch(input, init);
                    }

                    headers['X-Proxy-Cookie'] = CookieJar.toString();
                    headers['X-Requested-With'] = 'XMLHttpRequest';

                    const reqId = uuid();
                    window.parent.postMessage({
                        type: 'PROXY_REQUEST',
                        id: reqId,
                        payload: { url, method, headers, body }
                    }, '*');

                    return new Promise((resolve, reject) => {
                        const handler = (e) => {
                            if (e.data?.type === 'PROXY_RESPONSE' && e.data.id === reqId) {
                                window.removeEventListener('message', handler);
                                const { content, contentType, setCookies, error, status } = e.data.response;
                                if(setCookies) CookieJar.parse(setCookies);

                                if (error) reject(new TypeError(error));
                                else {
                                    let respBody = content;
                                    if(typeof content === 'string' && content.startsWith('data:')) {
                                        try {
                                            const bin = atob(content.split(',')[1]);
                                            const arr = new Uint8Array(bin.length);
                                            for(let i=0; i<bin.length; i++) arr[i] = bin.charCodeAt(i);
                                            respBody = arr;
                                        } catch(e) { console.warn('Decode failed', e); }
                                    }
                                    const res = new Response(new Blob([respBody], {type: contentType}), {
                                        status: status || 200,
                                        statusText: 'OK',
                                        headers: { 'Content-Type': contentType }
                                    });
                                    Object.defineProperty(res, 'url', { value: url });
                                    resolve(res);
                                }
                            }
                        };
                        window.addEventListener('message', handler);
                    });
                };

                // 6. XHR Interception
                const originalXHR = window.XMLHttpRequest;
                window.XMLHttpRequest = function() {
                    const xhr = new originalXHR();
                    const id = uuid();
                    let rHeaders = {};
                    let rUrl = '';
                    let rMethod = 'GET';

                    xhr.open = function(m, u) { rMethod = m; rUrl = resolveUrl(u); };
                    xhr.setRequestHeader = function(h, v) { rHeaders[h] = v; };
                    xhr.send = function(body) {
                        if(rUrl.startsWith('data:') || rUrl.startsWith('blob:')) return;
                        
                        rHeaders['X-Proxy-Cookie'] = CookieJar.toString();
                        rHeaders['X-Requested-With'] = 'XMLHttpRequest';

                        window.parent.postMessage({
                            type: 'PROXY_REQUEST',
                            id: id,
                            payload: { url: rUrl, method: rMethod, headers: rHeaders, body }
                        }, '*');

                        const handler = (e) => {
                            if (e.data?.type === 'PROXY_RESPONSE' && e.data.id === id) {
                                window.removeEventListener('message', handler);
                                const { content, contentType, setCookies, error, status } = e.data.response;
                                if(setCookies) CookieJar.parse(setCookies);

                                if(!error) {
                                    Object.defineProperty(xhr, 'readyState', { value: 4 });
                                    Object.defineProperty(xhr, 'status', { value: status || 200 });
                                    Object.defineProperty(xhr, 'responseText', { value: typeof content === 'string' && !content.startsWith('data:') ? content : '' });
                                    Object.defineProperty(xhr, 'responseURL', { value: rUrl });
                                    xhr.dispatchEvent(new Event('readystatechange'));
                                    xhr.dispatchEvent(new Event('load'));
                                    if(xhr.onload) xhr.onload();
                                } else {
                                    xhr.dispatchEvent(new Event('error'));
                                    if(xhr.onerror) xhr.onerror();
                                }
                            }
                        };
                        window.addEventListener('message', handler);
                    };
                    return xhr;
                };

                // 7. Link Click Interception
                document.addEventListener('click', (e) => {
                    const link = e.target.closest('a');
                    if (link && link.href) {
                        e.preventDefault();
                        window.parent.postMessage({
                            type: 'LYNIX_NAVIGATE',
                            url: link.href
                        }, '*');
                    }
                }, true);

                // 8. Reload Loop Prevention
                const lastReload = sessionStorage.getItem('lynix_last_reload');
                if (lastReload && (Date.now() - parseInt(lastReload)) < 2000) {
                    console.warn('[Lynix] Loop detected. Preventing reload.');
                    window.stop();
                    throw new Error('Loop detected');
                }
                window.location.reload = function() {
                    sessionStorage.setItem('lynix_last_reload', Date.now().toString());
                    window.parent.postMessage({ type: 'LYNIX_NAVIGATE', url: window.location.href }, '*');
                };

            })();
        </script>`;

        if (html.match(/<head[^>]*>/i)) {
            html = html.replace(/<head[^>]*>/i, (match) => `${match}${stealthScript}`);
        } else {
            html = `${stealthScript}${html}`;
        }

        // Security headers removal in response
        const strippedHeaders = ['x-frame-options', 'content-security-policy', 'x-content-type-options', 'cross-origin-opener-policy', 'cross-origin-embedder-policy', 'cross-origin-resource-policy'];

        return new Response(JSON.stringify({ 
            content: html, 
            contentType, 
            headers: responseHeaders,
            setCookies: accumulatedCookies,
            status: response.status,
            strippedHeaders
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } else {
        // Binary content
        const buffer = await response.arrayBuffer();
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        const CHUNK_SIZE = 0x8000;
        for (let i = 0; i < len; i += CHUNK_SIZE) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)) as any);
        }
        const base64 = btoa(binary);
        const content = `data:${contentType};base64,${base64}`;

        return new Response(JSON.stringify({ 
            content, 
            contentType, 
            headers: responseHeaders,
            setCookies: accumulatedCookies,
            status: response.status
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    }

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: (error.status || 500),
    });
  }
});
