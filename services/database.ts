import { supabase } from '../supabaseClient';
import { User, UserRole, Mail, Contact, Note } from '../types';

// Helper to map DB user to app User
const mapDbUserToUser = (dbUser: any): User | null => {
    if (!dbUser) return null;
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

const invokeAppService = async (resource: string, action: string, payload?: any) => {
    return await supabase.functions.invoke('app-service', {
        body: { resource, action, payload }
    });
};

export const database = {
    // --- Auth & User Functions (using Supabase) ---
    login: async (email: string, pass: string): Promise<{ user: User | null, error: string | null }> => {
        // Special case for local admin login. This user does not exist in the database.
        if (email.toLowerCase() === 'daradmin') {
            if (pass === 'admin') {
                console.warn("Logging in as local administrator. API-dependent features will be disabled.");
                const adminUser: User = {
                    id: -1,
                    username: 'daradmin',
                    email: 'admin@local.host',
                    role: UserRole.Admin,
                    sipVoice: null,
                    features: { chat: true, ai: true, mail: true },
                    auth_id: undefined,
                };
                return { user: adminUser, error: null };
            } else {
                return { user: null, error: "Incorrect password for user 'daradmin'." };
            }
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: pass,
        });

        if (authError || !authData.user) {
            console.error('Login Error:', authError);
            return { user: null, error: authError?.message || 'Invalid login credentials.' };
        }

        const userProfile = await database.getUserProfile();
        if (!userProfile) {
            return { user: null, error: 'User profile not found after successful authentication.' };
        }

        return { user: userProfile, error: null };
    },

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
    
    getUserProfile: async (): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('get-user-profile');
    
        if (error || data.error) {
            console.error('Error getting user profile:', error || data.error);
            return null;
        }
    
        return mapDbUserToUser(data.user);
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.functions.invoke('manage-users', { body: { action: 'getUsers' } });
        if (error || data.error) {
            console.error('Error fetching users:', error || data.error);
            return [];
        }
        return data.users.map(mapDbUserToUser).filter((user): user is User => user !== null);
    },
    
    addUser: async (userData: Partial<User> & { password?: string }): Promise<{ user: User | null; error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'createUser', ...userData }
        });

        if (error || data.error) {
            const err = error?.message || data.error;
            console.error('Error adding user:', err);
            return { user: null, error: err };
        }
        return { user: mapDbUserToUser(data.user), error: null };
    },

    updateUser: async (userData: Partial<User> & { password?: string }): Promise<{ user: User | null; error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'updateUser', ...userData }
        });

        if (error || data.error) {
            const err = error?.message || data.error;
            console.error('Error updating user:', err);
            return { user: null, error: err };
        }
        return { user: mapDbUserToUser(data.user), error: null };
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
        if (error || data.error) {
             const err = error?.message || data.error;
            console.error('Error deleting user:', err);
            return { error: err };
        }
        return { error: null };
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: { action: 'getUserByUsername', username }
        });

        if (error || data.error) {
            // This can fail if user not found, which is not a critical error.
            return null;
        }
        return mapDbUserToUser(data.user);
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await invokeAppService('mails', 'get');
        if (error || data.error) {
            console.error("Error fetching mails:", error || data.error);
            return { inbox: [], sent: [] };
        }
        // The edge function gets the current user's username, so we need it here to sort
        const sessionUser = await database.getUserProfile();
        if (!sessionUser) return {inbox: [], sent: []};

        const inbox = data.mails.filter((m: Mail) => m.recipient === sessionUser.username);
        const sent = data.mails.filter((m: Mail) => m.sender === sessionUser.username);
        return { inbox, sent };
    },

    sendMail: async (mailData: Omit<Mail, 'id' | 'timestamp' | 'read' | 'sender'>): Promise<Mail | null> => {
        const { data, error } = await invokeAppService('mails', 'send', mailData);
        if (error || data.error) {
            console.error('Error sending mail:', error || data.error);
            return null;
        }
        return data.mail;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { error, data } = await invokeAppService('mails', 'markAsRead', { id: mailId });
        if (error || data.error) console.error('Error marking mail as read:', error || data.error);
        return !error && !data.error;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { error, data } = await invokeAppService('mails', 'delete', { id: mailId });
        if (error || data.error) console.error('Error deleting mail:', error || data.error);
        return !error && !data.error;
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (): Promise<Contact[]> => {
        const { data, error } = await invokeAppService('contacts', 'get');
        if (error || data.error) {
            console.error('Error fetching contacts:', error || data.error);
            return [];
        }
        return data.contacts;
    },

    addContact: async (contactData: Omit<Contact, 'id' | 'owner'>): Promise<Contact | null> => {
        const { data, error } = await invokeAppService('contacts', 'add', contactData);
        if (error || data.error) {
            console.error('Error adding contact:', error || data.error);
            return null;
        }
        return data.contact;
    },

    updateContact: async (contactData: Contact): Promise<Contact | null> => {
        const { data, error } = await invokeAppService('contacts', 'update', contactData);
        if (error || data.error) {
            console.error('Error updating contact:', error || data.error);
            return null;
        }
        return data.contact;
    },

    deleteContact: async (contactId: number): Promise<boolean> => {
        const { error, data } = await invokeAppService('contacts', 'delete', { id: contactId });
        if (error || data.error) console.error('Error deleting contact:', error || data.error);
        return !error && !data.error;
    },

    // --- Notepad Service Functions ---
    getNotesForUser: async (): Promise<Note[]> => {
        const { data, error } = await invokeAppService('notes', 'get');
        if (error || data.error) {
            console.error('Error fetching notes:', error || data.error);
            return [];
        }
        return data.notes.map((n: any) => ({ ...n, createdAt: new Date(n.created_at), content: n.content || '' }));
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt' | 'owner'>): Promise<Note | null> => {
        const { data, error } = await invokeAppService('notes', 'add', noteData);
        if (error || data.error) {
            console.error('Error adding note:', error || data.error);
            return null;
        }
        return { ...data.note, createdAt: new Date(data.note.created_at), content: data.note.content || '' };
    },

    updateNote: async (noteData: Note): Promise<Note | null> => {
        const { data, error } = await invokeAppService('notes', 'update', noteData);
        if (error || data.error) {
            console.error('Error updating note:', error || data.error);
            return null;
        }
        return { ...data.note, createdAt: new Date(data.note.created_at), content: data.note.content || '' };
    },

    deleteNote: async (noteId: number): Promise<boolean> => {
        const { error, data } = await invokeAppService('notes', 'delete', { id: noteId });
        if (error || data.error) console.error('Error deleting note:', error || data.error);
        return !error && !data.error;
    },
};