
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { GoogleGenAI } from 'npm:@google/genai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-proxy-cookie',
};

const PROXY_BYPASS_API_KEY = 'AIzaSyDlYwTByP5X9LzybRoVk8rhQSTIHxitkBM';

// Raw Stealth JS logic without <script> tags, for injection into JS files
const RAW_STEALTH_JS = `
(function() {
    try {
        // 1. Mask WebDriver
        Object.defineProperty(navigator, 'webdriver', { get: () => false });

        // 2. Mask Plugins
        if (!navigator.plugins || navigator.plugins.length === 0) {
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
        }

        // 3. Mock window.chrome
        if (!window.chrome) {
            window.chrome = { runtime: {} };
        }

        // 4. Fix broken permissions API
        if (window.navigator.permissions) {
            const originalQuery = window.navigator.permissions.query;
            window.navigator.permissions.query = (parameters) => (
                parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
            );
        }

        // 5. Mock Top/Parent to bypass framebusters
        try {
            if (window.top !== window.self) {
                Object.defineProperties(window, {
                    'top': { get: function() { return window.self; }, configurable: true },
                    'parent': { get: function() { return window.self; }, configurable: true }
                });
            }
        } catch(e) {}
    } catch(err) {}
})();
`;

// Wrapped in script tags for HTML injection
const STEALTH_SCRIPTS_HTML = `<script>${RAW_STEALTH_JS}</script>`;

serve(async (req) => {
  // Global Error Handler to prevent "Failed to send request" (Function Crash)
  try {
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }

      const body = await req.json().catch(() => null);
      if (!body) {
         return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      const { url, method, headers, body: requestBody } = body;

      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      let targetOrigin = '';
      try { targetOrigin = new URL(url).origin; } catch (e) { targetOrigin = 'https://www.google.com'; }

      // Define profiles LOCALLY to ensure no state pollution between requests
      const requestProfiles = [
          {
              ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
              secChUa: '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
              platform: '"Windows"',
              mobile: '?0'
          },
          {
              ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
              platform: '"macOS"',
              mobile: '?0'
          },
          {
              ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
              platform: '"iOS"',
              mobile: '?1'
          },
          {
              ua: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
              secChUa: '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
              platform: '"Android"',
              mobile: '?1'
          }
      ];

      // Special handling for X/Twitter
      if (url.includes('twitter.com') || url.includes('x.com')) {
          requestProfiles.unshift({
              ua: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.6312.122 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
              platform: '"Linux"',
              mobile: '?1'
          });
      }

      let response: Response | null = null;
      let responseBodyBuffer: ArrayBuffer | null = null;
      let responseBodyText = '';
      let usedContentType = '';
      let status = 0;
      let accumulatedCookies: string[] = [];
      let lastResponse: Response | null = null;

      // Loop through profiles
      for (const profile of requestProfiles) {
          const fetchHeaders: Record<string, string> = {
              'User-Agent': profile.ua,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Cache-Control': 'no-cache',
              'Upgrade-Insecure-Requests': '1',
              'Referer': targetOrigin + '/',
              'Origin': targetOrigin
          };

          if (profile.secChUa) {
              fetchHeaders['Sec-Ch-Ua'] = profile.secChUa;
              fetchHeaders['Sec-Ch-Ua-Mobile'] = profile.mobile;
              fetchHeaders['Sec-Ch-Ua-Platform'] = profile.platform;
              fetchHeaders['Sec-Fetch-Dest'] = 'document';
              fetchHeaders['Sec-Fetch-Mode'] = 'navigate';
              fetchHeaders['Sec-Fetch-Site'] = 'none';
              fetchHeaders['Sec-Fetch-User'] = '?1';
          }

          if (headers && headers['x-proxy-cookie']) {
              fetchHeaders['Cookie'] = headers['x-proxy-cookie'];
          }

          try {
              const fetchOptions: any = {
                  method: (method || 'GET').toUpperCase(),
                  headers: fetchHeaders,
                  redirect: 'follow'
              };

              if (requestBody && fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD') {
                  fetchOptions.body = requestBody;
              }

              // SAFETY TIMEOUT: 10 seconds. 
              // This prevents the Edge Function from being killed by the platform (usually 10-60s limit)
              // allowing us to catch the timeout and try another profile or fallback.
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000); 
              fetchOptions.signal = controller.signal;

              const res = await fetch(url, fetchOptions);
              clearTimeout(timeoutId);

              lastResponse = res;
              status = res.status;
              
              const setCookie = res.headers.get('set-cookie');
              if (setCookie) accumulatedCookies.push(setCookie);

              if (status === 403 || status === 429 || status === 406) {
                  continue; 
              }

              const contentType = res.headers.get('content-type') || '';
              usedContentType = contentType;

              const isText = contentType.includes('text/') || 
                             contentType.includes('json') || 
                             contentType.includes('xml') || 
                             contentType.includes('javascript') || 
                             contentType.includes('ecmascript') ||
                             contentType.includes('css');

              if (!isText) {
                  response = res;
                  responseBodyBuffer = await res.arrayBuffer();
                  break;
              }

              const text = await res.text();
              const lowerText = text.toLowerCase();

              if (lowerText.includes('captcha') || 
                  lowerText.includes('access denied') || 
                  lowerText.includes('security check') || 
                  lowerText.includes('blocked using a security service')) {
                  responseBodyText = text;
                  continue;
              }

              response = res;
              responseBodyText = text;
              break;

          } catch (e) {
              console.error("Fetch attempt failed:", e);
          }
      }

      // --- Fallback: Google Cache ---
      if ((!response && lastResponse) || (response && (status === 403 || status === 429))) {
          if (url.includes('reddit.com') || url.includes('twitter.com') || url.includes('quora.com') || status === 403) {
               try {
                   const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}`;
                   const cacheController = new AbortController();
                   const cacheTimeout = setTimeout(() => cacheController.abort(), 5000); // 5s timeout for cache
                   
                   const cacheRes = await fetch(cacheUrl, {
                       headers: { 
                           'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
                       },
                       signal: cacheController.signal
                   });
                   clearTimeout(cacheTimeout);
                   
                   if (cacheRes.ok) {
                       const cacheText = await cacheRes.text();
                       if (!cacheText.includes('404. That’s an error')) {
                           response = cacheRes;
                           usedContentType = 'text/html';
                           responseBodyText = cacheText;
                           status = 200;
                       }
                   }
               } catch(e) {}
          }

          if (!response || (response === lastResponse && !responseBodyText && !responseBodyBuffer)) {
              response = lastResponse;
              if (response) {
                  usedContentType = response.headers.get('content-type') || '';
                  status = response.status;
                  if (!responseBodyText && !responseBodyBuffer) {
                       try {
                          const isText = usedContentType.includes('text/') || usedContentType.includes('json') || usedContentType.includes('xml') || usedContentType.includes('javascript');
                          if (!isText) {
                              responseBodyBuffer = await response.arrayBuffer();
                          } else {
                              responseBodyText = await response.text();
                          }
                       } catch(readErr) { }
                  }
              }
          }
      }

      if (!response) {
          return new Response(JSON.stringify({ error: "Unable to connect to website. Access denied by target server or connection timed out." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      // --- Binary Response Handling ---
      if (responseBodyBuffer) {
          const bytes = new Uint8Array(responseBodyBuffer);
          let binary = '';
          const len = bytes.byteLength;
          const CHUNK_SIZE = 0x8000; 
          for (let i = 0; i < len; i += CHUNK_SIZE) {
              binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + CHUNK_SIZE, len)) as any);
          }
          const base64 = btoa(binary);
          const content = `data:${usedContentType};base64,${base64}`;
          return new Response(JSON.stringify({ content, contentType: usedContentType, isMedia: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }

      // --- Text Content Processing ---
      let content = responseBodyText;

      // 1. Regex Cleanup
      content = content.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy["']?[^>]*>/gi, '');
      content = content.replace(/<meta[^>]*http-equiv=["']?Content-Security-Policy-Report-Only["']?[^>]*>/gi, '');
      content = content.replace(/<meta[^>]*http-equiv=["']?X-Frame-Options["']?[^>]*>/gi, '');
      content = content.replace(/<meta[^>]*http-equiv=["']?X-Security-Options["']?[^>]*>/gi, '');
      content = content.replace(/<meta[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
      
      content = content.replace(/integrity="[^"]*"/gi, '');
      content = content.replace(/nonce="[^"]*"/gi, '');

      const isHtml = usedContentType.includes('html');
      const isJs = usedContentType.includes('javascript') || usedContentType.includes('ecmascript');

      // 2. Inject Base Tag (HTML only)
      if (isHtml && !content.includes('<base')) {
          const baseTag = `<base href="${targetOrigin}/" target="_self">`;
          content = content.replace(/<head[^>]*>/i, (match) => `${match}${baseTag}`);
      }

      // 3. Gemini Analysis (Race Condition Protected)
      // Only process if text is of reasonable size to avoid timeouts on massive files
      if (content.length > 50 && content.length < 100000 && (isHtml || isJs)) {
          try {
              const processWithGemini = async () => {
                  const ai = new GoogleGenAI({ apiKey: PROXY_BYPASS_API_KEY });
                  const chunkLimit = 15000; // Reduced chunk size for speed
                  const snippet = content.substring(0, chunkLimit); 
                  const prompt = `
                  You are a specialized proxy service expert. Your task is to "sanitize" web code (${isHtml ? 'HTML' : 'JavaScript'}).
                  
                  YOUR GOAL:
                  Rewrite the provided code snippet to neutralize client-side security checks like "X-Security-Options", "Frame Busters", "Integrity Checks" while keeping the core application logic intact.
                  
                  SPECIFIC ACTIONS:
                  1. Neutralize 'window.top !== window.self' or 'top.location' redirects.
                  2. Neutralize 'navigator.webdriver' checks.
                  3. If the file appears to be purely a security blocker script, replace its content with a benign no-op.
                  
                  OUTPUT FORMAT:
                  Return ONLY the sanitized code. Do not use Markdown. If the code is safe as-is, return "NO_CHANGE".
                  
                  CODE:
                  ${snippet}
                  `;
                  
                  const result = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                  return result.text;
              };

              // Strict Timeout for Gemini: 3.5 seconds. 
              // If AI is slow, we skip it rather than hanging the browser.
              const timeout = new Promise((resolve) => setTimeout(() => resolve("TIMEOUT"), 3500));
              const text = await Promise.race([processWithGemini(), timeout]);

              if (text && text !== "TIMEOUT" && !text.includes("NO_CHANGE") && text.length > 10 && !text.includes("I cannot")) {
                  let cleanText = (text as string).replace(/```(html|javascript|js|css)?/g, '').replace(/```/g, '');
                  if (content.length <= 15000) {
                      content = cleanText;
                  } else {
                      content = cleanText + content.substring(15000);
                  }
              }
          } catch (e) {
              // Silently fail AI sanitization on error to keep loading
              console.error("Gemini sanitization skipped:", e);
          }
      }

      // 4. Inject Stealth Scripts
      if (isHtml) {
          if (content.match(/<body[^>]*>/i)) {
              content = content.replace(/<body[^>]*>/i, (match) => `${match}${STEALTH_SCRIPTS_HTML}`);
          } else {
              content = `${STEALTH_SCRIPTS_HTML}${content}`;
          }
      } else if (isJs) {
          content = RAW_STEALTH_JS + '\n' + content;
      }

      // 5. Regex Fallbacks
      content = content.replace(/if\s*\(top\s*!==\s*self\)/gi, 'if(false)');
      content = content.replace(/top\.location\.href/gi, 'self.location.href');
      content = content.replace(/window\.top/gi, 'window.self');

      return new Response(JSON.stringify({ 
          content, 
          contentType: usedContentType, 
          status, 
          setCookies: accumulatedCookies 
      }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
      });

  } catch (error) {
    // This CATCH block prevents "Failed to send request to Edge Function" errors on the client
    // by ensuring we always return a valid HTTP 200 response with error details.
    console.error("Unhandled Proxy Service Error:", error);
    return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown internal error in proxy service.' 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
    });
  }
});
