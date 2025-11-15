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

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) {
                    // Parsing error, stick with original message
                }
            }
            console.error('Error from get-user-profile function:', errorMessage, { error, data });
            return { profile: null, error: errorMessage };
        }
        if (data?.error) {
            console.error('Error from get-user-profile function:', data.error, { error, data });
            return { profile: null, error: data.error };
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
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (getUsers):', errorMessage, { error, data });
            return [];
        }
        if (data?.error) {
            console.error('Error from manage-users function (getUsers):', data.error, { error, data });
            return [];
        }
        return (data.users || []).map(mapDbUserToUser);
    },

    getUserDirectory: async (): Promise<User[]> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getDirectory' }
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (getDirectory):', errorMessage, { error, data });
            return [];
        }
        if (data?.error) {
            console.error('Error from manage-users function (getDirectory):', data.error, { error, data });
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
        
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (addUser):', errorMessage, { error, data });
            return { user: null, error: errorMessage };
        }
        if (data?.error) {
            console.error('Error from manage-users function (addUser):', data.error, { error, data });
            return { user: null, error: data.error };
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
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (updateUser):', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error from manage-users function (updateUser):', data.error, { error, data });
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

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (updatePassword):', errorMessage, { error, data });
            return { error: errorMessage };
        }
        if (data?.error) {
            console.error('Error from manage-users function (updatePassword):', data.error, { error, data });
            return { error: data.error };
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
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from manage-users function (deleteUser):', errorMessage, { error, data });
            return { error: errorMessage };
        }
        if (data?.error) {
            console.error('Error from manage-users function (deleteUser):', data.error, { error, data });
            return { error: data.error };
        }
        return { error: null };
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getUserByUsername', username: username }
        });
        if (error) {
            console.log(`User ${username} not found.`);
            return null;
        }
        if (data?.error) {
            console.error('Error from manage-users function (getUserByUsername):', data.error, { error, data });
            return null;
        }
        return mapDbUserToUser(data.user);
    },

    getUserByEmail: async (email: string): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getUserByEmail', email }
        });

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error invoking manage-users (getUserByEmail):', errorMessage);
            throw new Error("Database connection error during user validation.");
        }

        if (data?.error) {
            console.error('Error from manage-users function (getUserByEmail):', data.error);
            throw new Error("Database query error during user validation.");
        }

        if (!data.user) {
            return null;
        }

        return mapDbUserToUser(data.user);
    },
    
    getAdminStats: async (): Promise<{ messages: number, mails: number, contacts: number }> => {
        const fallbackStats = { messages: 0, mails: 0, contacts: 0 };
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'stats' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error fetching admin stats:', errorMessage, { error, data });
            return fallbackStats;
        }
        if (data?.error) {
            console.error('Error fetching admin stats:', data.error, { error, data });
            return fallbackStats;
        }
        return data.stats || fallbackStats;
    },
    
    // --- Google Drive Service ---
    getDriveOAuthConfig: async (): Promise<{ clientId: string; redirectUri: string } | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'get-oauth-config' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error fetching Google Drive OAuth config:', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error fetching Google Drive OAuth config:', data.error, { error, data });
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

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error from loginAndLinkDrive function:', errorMessage, { error, data });
            return { success: false, error: errorMessage };
        }
        if (data?.error) {
            console.error('Error from loginAndLinkDrive function:', data.error, { error, data });
            return { success: false, error: data.error };
        }
        return { success: true };
    },

    getDriveFiles: async (query?: string): Promise<{ files?: DriveFile[], error?: string, reauth?: boolean }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'list-files', payload: { query } })
        });
        let errorMessage = data?.error;
        if (error) {
            errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
        }
        if(errorMessage) {
            console.error('Error from drive/list-files function:', errorMessage, { error, data });
            const reauth = errorMessage.includes('re-link');
            return { error: errorMessage, reauth };
        }

        return { files: data.files || [] };
    },

    createDriveFile: async (name: string): Promise<{ file?: DriveFile, error?: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'create-file', payload: { name } })
        });
        if (error || data?.error) {
            const errorMessage = (error?.message || data?.error) as string;
            console.error('Error creating drive file:', errorMessage);
            return { error: errorMessage };
        }
        return { file: data.file };
    },

    getDriveFileDetails: async (fileId: string): Promise<{ file?: DriveFile & { content: string }, error?: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'get-file-details', payload: { fileId } })
        });
        if (error || data?.error) {
            const errorMessage = (error?.message || data?.error) as string;
            console.error('Error getting drive file details:', errorMessage);
            return { error: errorMessage };
        }
        return { file: data.file };
    },

    updateDriveFile: async (fileId: string, updates: { name?: string, content?: string }): Promise<{ success: boolean, error?: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'update-file', payload: { fileId, ...updates } })
        });
        if (error || data?.error) {
            const errorMessage = (error?.message || data?.error) as string;
            console.error('Error updating drive file:', errorMessage);
            return { success: false, error: errorMessage };
        }
        return { success: data.success };
    },
    
    deleteDriveFile: async (fileId: string): Promise<{ success: boolean, error?: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'delete-file', payload: { fileId } })
        });
        if (error || data?.error) {
            const errorMessage = (error?.message || data?.error) as string;
            console.error('Error deleting drive file:', errorMessage);
            return { success: false, error: errorMessage };
        }
        return { success: true };
    },

    isDriveLinked: async (): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'check-status' })
        });
        if (error) {
            // An error (like token not found) implies not linked.
            return false;
        }
        return data.isLinked;
    },

    unlinkDrive: async (): Promise<{ success: boolean }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'drive', action: 'unlink' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error unlinking Drive:', errorMessage, { error, data });
            return { success: false };
        }
        if (data?.error) {
            console.error('Error unlinking Drive:', data.error, { error, data });
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

        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error invoking voice-service:', errorMessage, { error, data });
            throw new Error(errorMessage);
        }
        if (data?.error) {
            console.error('Error invoking voice-service:', data.error, { error, data });
            throw new Error(data.error);
        }
        return data;
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'get' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error("Error fetching mails:", errorMessage, { error, data });
            return { inbox: [], sent: [] };
        }
        if (data?.error) {
            console.error("Error fetching mails:", data.error, { error, data });
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
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error sending mail:', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error sending mail:', data.error, { error, data });
            return null;
        }
        return data.mail;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'markAsRead', payload: { id: mailId } })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error marking mail as read:', errorMessage, { error, data });
            return false;
        }
        if (data?.error) {
            console.error('Error marking mail as read:', data.error, { error, data });
            return false;
        }
        return true;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'delete', payload: { id: mailId } })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error deleting mail:', errorMessage, { error, data });
            return false;
        }
        if (data?.error) {
            console.error('Error deleting mail:', data.error, { error, data });
            return false;
        }
        return true;
    },

    getMailAccounts: async (): Promise<MailAccount[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mail_accounts', action: 'get' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error("Error fetching mail accounts:", errorMessage, { error, data });
            return [];
        }
        if (data?.error) {
            console.error("Error fetching mail accounts:", data.error, { error, data });
            return [];
        }
        return data.accounts || [];
    },

    addMailAccount: async (accountData: Omit<MailAccount, 'id' | 'user_id'>): Promise<MailAccount | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mail_accounts', action: 'add', payload: accountData })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error adding mail account:', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error adding mail account:', data.error, { error, data });
            return null;
        }
        return data.account;
    },

    syncMailAccount: async (accountId: number): Promise<{ success: boolean, message: string }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'mails', action: 'sync', payload: { accountId } })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error syncing mail account:', errorMessage, { error, data });
            return { success: false, message: errorMessage };
        }
        if (data?.error) {
            console.error('Error syncing mail account:', data.error, { error, data });
            return { success: false, message: data.error };
        }
        return { success: true, message: data.message || 'Sync complete.' };
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (username: string): Promise<Contact[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'get' })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error fetching contacts:', errorMessage, { error, data });
            return [];
        }
        if (data?.error) {
            console.error('Error fetching contacts:', data.error, { error, data });
            return [];
        }
        return data.contacts || [];
    },

    addContact: async (contactData: Omit<Contact, 'id' | 'owner'>): Promise<Contact | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'add', payload: contactData })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error adding contact:', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error adding contact:', data.error, { error, data });
            return null;
        }
        return data.contact;
    },

    updateContact: async (contactData: Contact): Promise<Contact | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'update', payload: contactData })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error updating contact:', errorMessage, { error, data });
            return null;
        }
        if (data?.error) {
            console.error('Error updating contact:', data.error, { error, data });
            return null;
        }
        return data.contact;
    },
    
    deleteContact: async (contactId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: JSON.stringify({ resource: 'contacts', action: 'delete', payload: { id: contactId } })
        });
        if (error) {
            let errorMessage = error.message;
            if (error.context && typeof error.context.json === 'function') {
                try {
                    const body = await error.context.json();
                    errorMessage = body.error || errorMessage;
                } catch (e) { /* Parsing error, ignore */ }
            }
            console.error('Error deleting contact:', errorMessage, { error, data });
            return false;
        }
        if (data?.error) {
            console.error('Error deleting contact:', data.error, { error, data });
            return false;
        }
        return data.success;
    },
};
