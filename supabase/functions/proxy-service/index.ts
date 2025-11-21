
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
    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`Proxying request to: ${url}`);

    // Fetch the target website
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5'
        },
        redirect: 'follow'
    });

    const contentType = response.headers.get('content-type') || '';
    
    // Identify and Strip Security Headers
    // We return the names of stripped headers for UI feedback
    const securityHeaders = ['x-frame-options', 'content-security-policy', 'x-content-type-options', 'strict-transport-security'];
    const strippedHeaders: string[] = [];
    securityHeaders.forEach(header => {
        if (response.headers.has(header)) {
            strippedHeaders.push(header);
        }
    });

    if (contentType.includes('text/html')) {
        let html = await response.text();
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

        // 2. Inject Navigation Interceptor
        // This script catches all link clicks and sends them to the parent app to be re-proxied
        const bypassSignature = `
        <!-- 
            Lynix Proxy v1.502
            Mode: Active Bypass
            Stripped: ${strippedHeaders.join(', ') || 'None'}
        -->
        <script>
            // Intercept clicks
            document.addEventListener('click', function(e) {
                const anchor = e.target.closest('a');
                if (anchor && anchor.href) {
                    // Don't intercept hash links or javascript: calls
                    if(anchor.getAttribute('href').startsWith('#') || anchor.href.startsWith('javascript:')) return;
                    
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Lynix Proxy: Intercepting navigation to', anchor.href);
                    window.parent.postMessage({ type: 'LYNIX_NAVIGATE', url: anchor.href }, '*');
                }
            }, true);
            
            // Intercept form submissions (basic)
            document.addEventListener('submit', function(e) {
               // Simple forms only for now
               const form = e.target;
               if(form.method.toLowerCase() === 'get') {
                   e.preventDefault();
                   const url = new URL(form.action);
                   new FormData(form).forEach((value, key) => url.searchParams.append(key, value));
                   window.parent.postMessage({ type: 'LYNIX_NAVIGATE', url: url.toString() }, '*');
               }
            });
        </script>
        `;
        
        if (html.includes('<body')) {
            html = html.replace(/<body[^>]*>/i, (match) => `${match}${bypassSignature}`);
        } else {
            html += bypassSignature;
        }

        return new Response(JSON.stringify({ 
            content: html, 
            contentType, 
            strippedHeaders 
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } else {
        // Handle non-HTML content (Images, CSS, etc.) passed directly or wrapped
        let content;
        
        if (contentType.includes('image') || contentType.includes('audio') || contentType.includes('video')) {
             const buffer = await response.arrayBuffer();
             const base64 = btoa(
                new Uint8Array(buffer)
                  .reduce((data, byte) => data + String.fromCharCode(byte), '')
              );
             content = `data:${contentType};base64,${base64}`; 
             
             const wrappedHtml = `<html><body style="margin:0;display:flex;justify-content:center;align-items:center;background:#222;"><img src="${content}" style="max-width:100%;max-height:100vh;" /></body></html>`;
             return new Response(JSON.stringify({ content: wrappedHtml, contentType: 'text/html', strippedHeaders }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
        } else {
             content = await response.text();
        }

        return new Response(JSON.stringify({ 
            content, 
            contentType, 
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
