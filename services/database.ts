import { supabase } from '../supabaseClient';
// Add DriveFile to imports
import { User, UserRole, Mail, Contact, Note, MailAccount, DriveFile } from '../types';

// Helper to map DB user to app User
const mapDbUserToUser = (dbUser: any): User => {
    if (!dbUser) return null as unknown as User;
    return {
        id: dbUser.id,
        auth_id: dbUser.auth_id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
        plan_name: dbUser.plan_name,
        sipVoice: dbUser.sip_voice,
        features: dbUser.features,
    };
};

export const database = {
    // --- Auth & User Functions (using Supabase Edge Functions) ---
    getGuestUser: (): Promise<User> => {
        return Promise.resolve({
            id: 0,
            username: 'Guest User',
            email: 'guest@lynixity.x10.bz',
            role: UserRole.Trial,
            plan_name: 'Trial',
            sipVoice: 'N/A',
            features: { chat: false, ai: true, mail: false }
        });
    },
    
    getUserProfile: async (auth_id: string): Promise<{ profile: User | null, error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('get-user-profile');

        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to get user profile.';
            console.error('Error from get-user-profile function:', errorMessage, { error, data });
            return { profile: null, error: errorMessage };
        }
        if (!data.user) {
            return { profile: null, error: 'User profile not found.' };
        }
        return { profile: mapDbUserToUser(data.user), error: null };
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getUsers' }
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to get users.';
            console.error('Error from manage-users function (getUsers):', errorMessage, { error, data });
            return [];
        }
        return (data.users || []).map(mapDbUserToUser);
    },

    getUserDirectory: async (): Promise<User[]> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getDirectory' }
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to get directory.';
            console.error('Error from manage-users function (getDirectory):', errorMessage, { error, data });
            return [];
        }
        return (data.users || []).map(mapDbUserToUser);
    },
    
    addUser: async (userData: Partial<User> & { password?: string }): Promise<{ user: User | null; error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'createUser',
                email: userData.email,
                password: userData.password,
                username: userData.username,
                role: userData.role,
                plan_name: userData.plan_name,
                sipVoice: userData.sipVoice,
                features: userData.features,
            }
        });
        
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to add user.';
            console.error('Error from manage-users function (addUser):', errorMessage, { error, data });
            return { user: null, error: errorMessage };
        }
        return { user: mapDbUserToUser(data.user), error: null };
    },

    updateUser: async (userData: Partial<User>): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { 
                action: 'updateUser',
                ...userData,
                sipVoice: userData.sipVoice 
            }
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to update user.';
            console.error('Error from manage-users function (updateUser):', errorMessage, { error, data });
            return null;
        }
        return mapDbUserToUser(data.user);
    },
    
    updateUserPassword: async (currentPassword: string, newPassword: string): Promise<{ error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'updatePassword',
                currentPassword,
                newPassword,
            },
        });

        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to update password.';
            console.error('Error from manage-users function (updatePassword):', errorMessage, { error, data });
            return { error: errorMessage };
        }
        return { error: null };
    },
    
    deleteUser: async (userToDelete: User): Promise<{ error: string | null }> => {
        if (!userToDelete.auth_id) {
            const err = 'Cannot delete user without an authentication ID.';
            console.error(err);
            return { error: err };
        }
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'deleteUser', auth_id: userToDelete.auth_id }
        });
        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to delete user.';
            console.error('Error from manage-users function (deleteUser):', errorMessage, { error, data });
            return { error: errorMessage };
        }
        return { error: null };
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getUserByUsername', username: username }
        });
        if (error) {
            // This is a special case where a 404 is expected and not a system error
            console.log(`User ${username} not found.`);
            return null;
        }
        if (!data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || `Failed to get user ${username}.`;
            console.error('Error from manage-users function (getUserByUsername):', errorMessage, { error, data });
            return null;
        }
        return mapDbUserToUser(data.user);
    },
    
    getAdminStats: async (): Promise<{ messages: number, mails: number, contacts: number }> => {
        const fallbackStats = { messages: 0, mails: 0, contacts: 0 };
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'stats' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to get admin stats.';
            console.error('Error fetching admin stats:', errorMessage, { error, data });
            return fallbackStats;
        }
        return data.stats || fallbackStats;
    },
    
    // --- Google Drive Service ---
    getDriveOAuthConfig: async (): Promise<{ clientId: string; redirectUri: string } | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'get-oauth-config' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to fetch Google Drive OAuth config.';
            console.error('Error fetching Google Drive OAuth config:', errorMessage, { error, data });
            return null;
        }
        return data;
    },
    
    loginAndLinkDrive: async (email: string, password: string, code: string): Promise<{ success: boolean; error?: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ 
                resource: 'auth', 
                action: 'loginAndLinkDrive', 
                payload: { email, password, code } 
            })
        });

        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to link account.';
            console.error('Error from loginAndLinkDrive function:', errorMessage, { error, data });
            return { success: false, error: errorMessage };
        }

        return { success: true };
    },

    exchangeGoogleDriveCode: async (code: string): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'exchange-code', payload: { code } })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to exchange code.';
            console.error('Error exchanging Google Drive code:', errorMessage, { error, data });
            return { success: false };
        }
        return { success: data.success };
    },

    getDriveFiles: async (): Promise<{ files?: DriveFile[], error?: string, reauth?: boolean }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'list-files' })
        });

        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to list files.';
            console.error('Error from drive/list-files function:', errorMessage, { error, data });
            const reauth = errorMessage.includes('re-link');
            return { error: errorMessage, reauth };
        }

        return { files: data.files || [] };
    },

    isDriveLinked: async (): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'check-status' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to check link status.';
            console.error('Error checking Drive link status:', errorMessage, { error, data });
            return false;
        }
        return data.isLinked;
    },

    unlinkDrive: async (): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'unlink' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to unlink drive.';
            console.error('Error unlinking Drive:', errorMessage, { error, data });
            return { success: false };
        }
        return { success: data.success };
    },

    // --- Voice Service ---
    getVoiceResponse: async (text: string): Promise<{ audioDataUrl: string, transcription: string }> => {
        // Call the dedicated voice-service instead of the monolithic app-service
        const { data, error } = await supabase.functions.invoke('voice-service', {
            body: { text }
        });

        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Unknown error invoking voice service.';
            console.error('Error invoking voice-service:', errorMessage, { error, data });
            throw new Error(errorMessage);
        }
        return data;
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'get' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to fetch mails.';
            console.error("Error fetching mails:", errorMessage, { error, data });
            return { inbox: [], sent: [] };
        }
        const mails = data.mails || [];
        const inbox = mails.filter((m: Mail) => m.recipient === username);
        const sent = mails.filter((m: Mail) => m.sender.includes(username)); // Approximate for sent items
        return { inbox, sent };
    },

    sendMail: async (mailData: { recipient: string; subject: string; body: string; sender: string; }): Promise<Mail | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'send', payload: mailData })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to send mail.';
            console.error('Error sending mail:', errorMessage, { error, data });
            return null;
        }
        return data.mail;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'markAsRead', payload: { id: mailId } })
        });
        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to mark mail as read.';
            console.error('Error marking mail as read:', errorMessage, { error, data });
            return false;
        }
        return true;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'delete', payload: { id: mailId } })
        });
        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to delete mail.';
            console.error('Error deleting mail:', errorMessage, { error, data });
            return false;
        }
        return true;
    },

    getMailAccounts: async (): Promise<MailAccount[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mail_accounts', action: 'get' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to fetch mail accounts.';
            console.error("Error fetching mail accounts:", errorMessage, { error, data });
            return [];
        }
        return data.accounts || [];
    },

    addMailAccount: async (accountData: Omit<MailAccount, 'id' | 'user_id'>): Promise<MailAccount | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mail_accounts', action: 'add', payload: accountData })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to add mail account.';
            console.error('Error adding mail account:', errorMessage, { error, data });
            return null;
        }
        return data.account;
    },

    syncMailAccount: async (accountId: number): Promise<{ success: boolean, message: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'sync', payload: { accountId } })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Sync failed.';
            console.error('Error syncing mail account:', errorMessage, { error, data });
            return { success: false, message: errorMessage };
        }
        return { success: true, message: data.message || 'Sync complete.' };
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (username: string): Promise<Contact[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'get' })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to fetch contacts.';
            console.error('Error fetching contacts:', errorMessage, { error, data });
            return [];
        }
        return data.contacts || [];
    },

    addContact: async (contactData: Omit<Contact, 'id' | 'owner'>): Promise<Contact | null> => {
         const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'add', payload: contactData })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to add contact.';
            console.error('Error adding contact:', errorMessage, { error, data });
            return null;
        }
        return data.contact;
    },

    updateContact: async (contactData: Omit<Contact, 'owner'>): Promise<Contact | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'update', payload: contactData })
        });
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to update contact.';
            console.error('Error updating contact:', errorMessage, { error, data });
            return null;
        }
        return data.contact;
    },

    deleteContact: async (contactId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'delete', payload: { id: contactId } })
        });
        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to delete contact.';
            console.error('Error deleting contact:', errorMessage, { error, data });
            return false;
        }
        return true;
    },

    // --- Notepad Service Functions ---
    getNotesForUser: async (username: string): Promise<Note[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'notes', action: 'get' })
        });

        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to fetch notes.';
            console.error('Error fetching notes:', errorMessage, { error, data });
            return [];
        }
        return (data.notes || []).map((n: any) => ({ ...n, createdAt: new Date(n.created_at), content: n.content || '' }));
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'owner'>): Promise<Note | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'notes', action: 'add', payload: noteData })
        });
        
        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to add note.';
            console.error('Error adding note:', errorMessage, { error, data });
            return null;
        }
        const note = data.note;
        return { ...note, createdAt: new Date(note.created_at), content: note.content || '' };
    },

    updateNote: async (noteData: Note): Promise<Note | null> => {
       const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'notes', action: 'update', payload: noteData })
        });

        if (error || !data || data.error) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to update note.';
            console.error('Error updating note:', errorMessage, { error, data });
            return null;
        }
        const note = data.note;
        return { ...note, createdAt: new Date(note.created_at), content: note.content || '' };
    },

    deleteNote: async (noteId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'notes', action: 'delete', payload: { id: noteId } })
        });
        if (error || (data && data.error)) {
            const detailedError = (error as any)?.context?.json?.error;
            const errorMessage = detailedError || data?.error || error?.message || 'Failed to delete note.';
            console.error('Error deleting note:', errorMessage, { error, data });
            return false;
        }
        return true;
    },
};