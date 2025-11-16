// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, linting, and type checking.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: any;

const connectedClients = new Map<string, WebSocket>();

serve(async (req) => {
  // Upgrade the request to a WebSocket connection.
  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Extract token from the URL for authentication.
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Missing authentication token', { status: 401 });
  }

  try {
    // Authenticate the user with the provided token.
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
        return new Response('Invalid token', { status: 401 });
    }
    
    // Get the user's application profile (specifically their username).
    const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('username')
        .eq('auth_id', user.id)
        .single();
    
    if (profileError || !userProfile) {
        return new Response('User profile not found', { status: 404 });
    }
    
    const username = userProfile.username;
    
    // Handle reconnection: if a user is already connected, close the old socket.
    if (connectedClients.has(username)) {
        console.log(`Closing existing connection for ${username}`);
        connectedClients.get(username)?.close(1000, "New connection established");
    }
    
    // Store the new connection.
    connectedClients.set(username, socket);
    console.log(`Client connected: ${username}`);
    
    // Handle incoming messages from this client.
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { target, type, payload } = message;

        // Find the recipient's WebSocket connection.
        const recipientSocket = connectedClients.get(target);
        
        if (recipientSocket && recipientSocket.readyState === WebSocket.OPEN) {
          // Relay the message to the target client.
          recipientSocket.send(JSON.stringify({
            from: username,
            type: type,
            payload: payload
          }));
        } else {
          console.log(`Recipient ${target} not found or not connected.`);
          // If the message was an initial call offer, notify the sender that the user is unavailable.
          if (type === 'incoming-call') {
              socket.send(JSON.stringify({
                  from: 'server',
                  type: 'user-unavailable',
                  payload: { username: target }
              }));
          }
        }
      } catch (e) {
        console.error("Failed to parse or relay message:", e);
      }
    };

    // Handle client disconnection.
    socket.onclose = () => {
      // Only remove the client if this specific socket instance is the one stored.
      if (connectedClients.get(username) === socket) {
        connectedClients.delete(username);
        console.log(`Client disconnected: ${username}`);
      }
    };

    socket.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

  } catch(e) {
      console.error("Authentication error during WebSocket upgrade:", e);
      return new Response('Authentication error', { status: 500 });
  }

  // Return the response to complete the WebSocket upgrade.
  return response;
});