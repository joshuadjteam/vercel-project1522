

import { supabase } from '../supabaseClient';
import { User, UserRole, Mail, Contact, Note, CallRecord, MailAccount } from '../types';

// Helper to map DB user to app User
const mapDbUserToUser = (dbUser: any): User => {
    if (!dbUser) return null as unknown as User;
    return {
        id: dbUser.id,
        auth_id: dbUser.auth_id,
        username: dbUser.username,
        email: dbUser.email,
        role: dbUser.role,
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
            sipVoice: 'N/A',
            features: { chat: false, ai: true, mail: false }
        });
    },
    
    getUserProfile: async (auth_id: string): Promise<{ profile: User | null, error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('get-user-profile');

        if (error) {
            console.error('Error invoking get-user-profile function:', error);
            return { profile: null, error: error.message };
        }
        if (!data || data.error) {
            const errorMessage = data?.error || 'No data returned from get-user-profile function.';
            console.error('Error from get-user-profile function:', errorMessage);
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
            console.error('Error from manage-users function (getUsers):', error || data?.error);
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
                sipVoice: userData.sipVoice,
                features: userData.features,
            }
        });
        
        if (error || !data || data.error) {
            const errorMessage = error?.message || data?.error || 'Failed to add user.';
            console.error('Error from manage-users function (addUser):', errorMessage);
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
            console.error('Error from manage-users function (updateUser):', error || data?.error);
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
            const errorMessage = error?.message || data?.error || 'Failed to update password.';
            console.error('Error from manage-users function (updatePassword):', errorMessage);
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
            const errorMessage = error?.message || data?.error;
            console.error('Error from manage-users function (deleteUser):', errorMessage);
            return { error: errorMessage };
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
        if (!data || data.error) {
            console.error('Error from manage-users function (getUserByUsername):', data?.error);
            return null;
        }
        return mapDbUserToUser(data.user);
    },
    
    getAdminStats: async (): Promise<{ messages: number, mails: number, contacts: number }> => {
        const fallbackStats = { messages: 0, mails: 0, contacts: 0 };
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'stats' }
        });
        if (error || !data || data.error) {
            console.error('Error fetching admin stats:', error || data?.error);
            return fallbackStats;
        }
        return data.stats || fallbackStats;
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mails', action: 'get' }
        });
        if (error || !data || data.error) {
            console.error("Error fetching mails:", error || data?.error);
            return { inbox: [], sent: [] };
        }
        const mails = data.mails || [];
        const inbox = mails.filter((m: Mail) => m.recipient === username);
        const sent = mails.filter((m: Mail) => m.sender === username);
        return { inbox, sent };
    },

    sendMail: async (mailData: { recipient: string; subject: string; body: string; sender: string; }): Promise<Mail | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mails', action: 'send', payload: mailData }
        });
        if (error || !data || data.error) {
            console.error('Error sending mail:', error || data?.error);
            return null;
        }
        return data.mail;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mails', action: 'markAsRead', payload: { id: mailId } }
        });
        if (error || (data && data.error)) {
            console.error('Error marking mail as read:', error || data.error);
            return false;
        }
        return true;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mails', action: 'delete', payload: { id: mailId } }
        });
        if (error || (data && data.error)) {
            console.error('Error deleting mail:', error || data.error);
            return false;
        }
        return true;
    },

    getMailAccounts: async (): Promise<MailAccount[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mail_accounts', action: 'get' }
        });
        if (error || !data || data.error) {
            console.error("Error fetching mail accounts:", error || data?.error);
            return [];
        }
        return data.accounts || [];
    },

    addMailAccount: async (accountData: Omit<MailAccount, 'id' | 'user_id'>): Promise<MailAccount | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'mail_accounts', action: 'add', payload: accountData }
        });
        if (error || !data || data.error) {
            console.error('Error adding mail account:', error || data?.error);
            return null;
        }
        return data.account;
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (username: string): Promise<Contact[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'contacts', action: 'get' }
        });
        if (error || !data || data.error) {
            console.error('Error fetching contacts:', error || data?.error);
            return [];
        }
        return data.contacts || [];
    },

    addContact: async (contactData: Omit<Contact, 'id' | 'owner'>): Promise<Contact | null> => {
         const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'contacts', action: 'add', payload: contactData }
        });
        if (error || !data || data.error) {
            console.error('Error adding contact:', error || data?.error);
            return null;
        }
        return data.contact;
    },

    updateContact: async (contactData: Omit<Contact, 'owner'>): Promise<Contact | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'contacts', action: 'update', payload: contactData }
        });
        if (error || !data || data.error) {
            console.error('Error updating contact:', error || data?.error);
            return null;
        }
        return data.contact;
    },

    deleteContact: async (contactId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'contacts', action: 'delete', payload: { id: contactId } }
        });
        if (error || (data && data.error)) {
            console.error('Error deleting contact:', error || data.error);
            return false;
        }
        return true;
    },

    // --- Notepad Service Functions ---
    getNotesForUser: async (username: string): Promise<Note[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'notes', action: 'get' }
        });

        if (error || !data || data.error) {
            console.error('Error fetching notes:', error || data?.error);
            return [];
        }
        return (data.notes || []).map((n: any) => ({ ...n, createdAt: new Date(n.created_at), content: n.content || '' }));
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'owner'>): Promise<Note | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'notes', action: 'add', payload: noteData }
        });
        
        if (error || !data || data.error) {
            console.error('Error adding note:', error || data?.error);
            return null;
        }
        const note = data.note;
        return { ...note, createdAt: new Date(note.created_at), content: note.content || '' };
    },

    updateNote: async (noteData: Note): Promise<Note | null> => {
       const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'notes', action: 'update', payload: noteData }
        });

        if (error || !data || data.error) {
            console.error('Error updating note:', error || data?.error);
            return null;
        }
        const note = data.note;
        return { ...note, createdAt: new Date(note.created_at), content: note.content || '' };
    },

    deleteNote: async (noteId: number): Promise<boolean> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'notes', action: 'delete', payload: { id: noteId } }
        });
        if (error || (data && data.error)) {
            console.error('Error deleting note:', error || data.error);
            return false;
        }
        return true;
    },

    // --- Call History Service Functions ---
    getCallHistoryForUser: async (): Promise<CallRecord[]> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'call-history', action: 'get' }
        });
        if (error || !data || data.error) {
            console.error('Error fetching call history:', error || data?.error);
            return [];
        }
        return data.history || [];
    },

    addCallHistoryRecord: async (recordData: Omit<CallRecord, 'id' | 'owner' | 'timestamp'>): Promise<CallRecord | null> => {
        const { data, error } = await supabase.functions.invoke('app-service', {
            body: { resource: 'call-history', action: 'add', payload: recordData }
        });
        if (error || !data || data.error) {
            console.error('Error adding call record:', error || data?.error);
            return null;
        }
        return data.record;
    },
};