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

export const database = {
    // --- Auth & User Functions (using Supabase) ---
    login: async (identifier: string, pass: string): Promise<User | null> => {
        let emailToLogin = identifier;
        if (!identifier.includes('@')) {
            const { data: userByUsername, error } = await supabase
                .from('users')
                .select('email')
                .eq('username', identifier)
                .single();
            
            if (error || !userByUsername) {
                console.error(`Login Error: Could not find user with username '${identifier}'.`, error);
                return null;
            }
            emailToLogin = userByUsername.email;
        }

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: emailToLogin,
            password: pass,
        });

        if (authError || !authData.user) {
            console.error('Login Error: Invalid credentials or authentication issue.', authError);
            return null;
        }

        return await database.getUserProfile(authData.user.id);
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
    
    getUserProfile: async (auth_id: string): Promise<User | null> => {
        const { data, error } = await supabase.from('users').select('*').eq('auth_id', auth_id).single();
        if (error) {
            console.error('Error fetching user profile:', error);
            return null;
        }
        return mapDbUserToUser(data);
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data.map(mapDbUserToUser).filter((user): user is User => user !== null);
    },
    
    addUser: async (userData: Partial<User> & { password?: string }): Promise<{ user: User | null; error: string | null }> => {
        const { data, error } = await supabase.functions.invoke('manage-users', {
            body: {
                action: 'createUser',
                email: userData.email,
                password: userData.password,
                username: userData.username,
                role: userData.role,
                sip_voice: userData.sipVoice,
                features: userData.features,
            }
        });

        if (error) {
            console.error('Error invoking manage-users function (addUser):', error);
            return { user: null, error: error.message };
        }
        if (data.error) {
            console.error('Error from manage-users function (addUser):', data.error);
            return { user: null, error: data.error };
        }
        return { user: mapDbUserToUser(data.user), error: null };
    },

    updateUser: async (userData: Partial<User>): Promise<User | null> => {
        const { data, error } = await supabase
            .from('users')
            .update({
                username: userData.username,
                role: userData.role,
                sip_voice: userData.sipVoice,
                features: userData.features,
            })
            .eq('id', userData.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return null;
        }
        return mapDbUserToUser(data);
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
            console.error('Error invoking manage-users function (deleteUser):', error);
            return { error: error.message };
        }
        if (data.error) {
            console.error('Error from manage-users function (deleteUser):', data.error);
            return { error: data.error };
        }
        return { error: null };
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
        if (error) {
            console.error('Error getting user by username:', error);
            return null;
        }
        return mapDbUserToUser(data);
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await supabase
            .from('mails')
            .select('*')
            .or(`recipient.eq.${username},sender.eq.${username}`)
            .order('timestamp', { ascending: false });
        
        if (error) {
            console.error("Error fetching mails:", error);
            return { inbox: [], sent: [] };
        }
        const inbox = data.filter(m => m.recipient === username);
        const sent = data.filter(m => m.sender === username);
        return { inbox, sent };
    },

    sendMail: async (mailData: Omit<Mail, 'id' | 'timestamp' | 'read'>): Promise<Mail | null> => {
        const { data, error } = await supabase.from('mails').insert(mailData).select().single();
        if (error) {
            console.error('Error sending mail:', error);
            return null;
        }
        return data;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { error } = await supabase.from('mails').update({ read: true }).eq('id', mailId);
        if (error) console.error('Error marking mail as read:', error);
        return !error;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { error } = await supabase.from('mails').delete().eq('id', mailId);
        if (error) console.error('Error deleting mail:', error);
        return !error;
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (username: string): Promise<Contact[]> => {
        const { data, error } = await supabase.from('contacts').select('*').eq('owner', username);
        if (error) {
            console.error('Error fetching contacts:', error);
            return [];
        }
        return data;
    },

    addContact: async (contactData: Omit<Contact, 'id'>): Promise<Contact | null> => {
        const { data, error } = await supabase.from('contacts').insert(contactData).select().single();
        if (error) {
            console.error('Error adding contact:', error);
            return null;
        }
        return data;
    },

    updateContact: async (contactData: Contact): Promise<Contact | null> => {
        const { data, error } = await supabase.from('contacts').update(contactData).eq('id', contactData.id).select().single();
        if (error) {
            console.error('Error updating contact:', error);
            return null;
        }
        return data;
    },

    deleteContact: async (contactId: number): Promise<boolean> => {
        const { error } = await supabase.from('contacts').delete().eq('id', contactId);
        if (error) console.error('Error deleting contact:', error);
        return !error;
    },

    // --- Notepad Service Functions ---
    getNotesForUser: async (username: string): Promise<Note[]> => {
        const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('owner', username)
            .gte('created_at', threeDaysAgo)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            return [];
        }
        return data.map(n => ({ ...n, createdAt: new Date(n.created_at), content: n.content || '' }));
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note | null> => {
        const { data, error } = await supabase
            .from('notes')
            .insert({ owner: noteData.owner, title: noteData.title, content: noteData.content })
            .select()
            .single();
        
        if (error) {
            console.error('Error adding note:', error);
            return null;
        }
        return { ...data, createdAt: new Date(data.created_at), content: data.content || '' };
    },

    updateNote: async (noteData: Note): Promise<Note | null> => {
        const { data, error } = await supabase
            .from('notes')
            .update({ title: noteData.title, content: noteData.content })
            .eq('id', noteData.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating note:', error);
            return null;
        }
        return { ...data, createdAt: new Date(data.created_at), content: data.content || '' };
    },

    deleteNote: async (noteId: number): Promise<boolean> => {
        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        if (error) console.error('Error deleting note:', error);
        return !error;
    },
};