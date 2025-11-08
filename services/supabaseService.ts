import { supabase } from '../supabaseClient';
import { User, UserRole, Mail, Contact, Note } from '../types';

export const supabaseService = {
    // --- Auth & User Functions ---
    login: async (id: string, pass: string): Promise<User | null> => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: id, // Assuming email is used as the primary login identifier
            password: pass,
        });

        if (authError || !authData.user) {
            // Try with username as well
            const { data: userProfile } = await supabase.from('users').select('*').eq('username', id).single();
            if(!userProfile) return null;

            const { data: secondAuthAttempt, error: secondAuthError } = await supabase.auth.signInWithPassword({
                email: userProfile.email,
                password: pass
            });
            if(secondAuthError || !secondAuthAttempt.user) return null;

            return userProfile as User;
        }

        const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', authData.user.id)
            .single();

        return userProfile as User | null;
    },

    getGuestUser: (): Promise<User> => {
        // Guest user remains a client-side mock
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
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', auth_id)
            .single();
        if (error) return null;
        return data as User;
    },

    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('users').select('*');
        if (error) return [];
        return data as User[];
    },
    
    // Note: In a real app, adding a user would involve Supabase Auth `signUp` or `inviteUserByEmail`
    // This simplified version for the admin panel just creates a profile.
    addUser: async (userData: Partial<User>): Promise<User | null> => {
        const { data, error } = await supabase.from('users').insert([userData]).select();
        if (error || !data) return null;
        return data[0] as User;
    },

    updateUser: async (userData: Partial<User>): Promise<User | null> => {
        const { data, error } = await supabase.from('users').update(userData).eq('id', userData.id).select();
        if (error || !data) return null;
        return data[0] as User;
    },
    
    deleteUser: async (userId: number): Promise<boolean> => {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        return !error;
    },

    getUserByUsername: async (username: string): Promise<User | null> => {
        const { data, error } = await supabase.from('users').select('*').eq('username', username).single();
        if (error) return null;
        return data as User;
    },

    // --- Mail Service Functions ---
    getMailsForUser: async (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        const { data, error } = await supabase.from('mails').select('*').or(`recipient.eq.${username},sender.eq.${username}`);
        if (error) return { inbox: [], sent: [] };
        
        const inbox = data.filter(m => m.recipient === username).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const sent = data.filter(m => m.sender === username).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        return { inbox, sent };
    },

    sendMail: async (mailData: Omit<Mail, 'id' | 'timestamp' | 'read'>): Promise<Mail | null> => {
        const { data, error } = await supabase.from('mails').insert([mailData]).select();
        if (error || !data) return null;
        return data[0] as Mail;
    },
    
    markMailAsRead: async (mailId: number): Promise<boolean> => {
        const { error } = await supabase.from('mails').update({ read: true }).eq('id', mailId);
        return !error;
    },

    deleteMail: async (mailId: number): Promise<boolean> => {
        const { error } = await supabase.from('mails').delete().eq('id', mailId);
        return !error;
    },

    // --- Contacts Service Functions ---
    getContactsForUser: async (username: string): Promise<Contact[]> => {
        const { data, error } = await supabase.from('contacts').select('*').eq('owner', username);
        if (error) return [];
        return data;
    },

    addContact: async (contactData: Omit<Contact, 'id'>): Promise<Contact | null> => {
        const { data, error } = await supabase.from('contacts').insert([contactData]).select();
        if (error || !data) return null;
        return data[0];
    },

    updateContact: async (contactData: Contact): Promise<Contact | null> => {
        const { data, error } = await supabase.from('contacts').update(contactData).eq('id', contactData.id).select();
        if (error || !data) return null;
        return data[0];
    },

    deleteContact: async (contactId: number): Promise<boolean> => {
        const { error } = await supabase.from('contacts').delete().eq('id', contactId);
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

        if (error) return [];
        // Map created_at to createdAt for type consistency
        return data.map(n => ({...n, createdAt: new Date(n.created_at)}));
    },

    addNote: async (noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note | null> => {
        const payload = { owner: noteData.owner, title: noteData.title, content: noteData.content };
        const { data, error } = await supabase.from('notes').insert([payload]).select();
        if (error || !data) return null;
        return {...data[0], createdAt: new Date(data[0].created_at)};
    },

    updateNote: async (noteData: Note): Promise<Note | null> => {
        const { data, error } = await supabase
            .from('notes')
            .update({ title: noteData.title, content: noteData.content })
            .eq('id', noteData.id)
            .select();
        if (error || !data) return null;
        return {...data[0], createdAt: new Date(data[0].created_at)};
    },

    deleteNote: async (noteId: number): Promise<boolean> => {
        const { error } = await supabase.from('notes').delete().eq('id', noteId);
        return !error;
    },
};