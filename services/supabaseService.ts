import { User, UserRole, Mail, Contact, Note } from '../types';

// Mock data to simulate a database
let mockUsers: User[] = [
    { 
        id: 1, 
        username: 'locadmin', 
        email: 'admin@lynixity.x10.bz', 
        role: UserRole.Admin, 
        sipVoice: '1001', 
        features: { chat: true, ai: true, mail: true } 
    },
    { 
        id: 2, 
        username: 'dj', 
        email: 'dj@example.com', 
        role: UserRole.Standard, 
        sipVoice: '1002', 
        features: { chat: true, ai: true, mail: true } 
    },
    { 
        id: 3, 
        username: 'Jane Doe', 
        email: 'jane@example.com', 
        role: UserRole.Standard, 
        sipVoice: null, 
        features: { chat: true, ai: true, mail: false } 
    },
    { 
        id: 4, 
        username: 'John Smith', 
        email: 'john@example.com', 
        role: UserRole.Standard, 
        sipVoice: '1004', 
        features: { chat: false, ai: false, mail: false } 
    },
];

let nextId = 5;
let nextMailId = 3;
let nextContactId = 3;
let nextNoteId = 3;

let mockMails: Mail[] = [
    {
        id: 1,
        sender: 'locadmin',
        recipient: 'dj',
        subject: 'Welcome to Lynix!',
        body: 'Hi DJ, \n\nWelcome to the Lynix platform. We are excited to have you on board. Please let me know if you have any questions.\n\nBest,\nlocadmin',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
    },
    {
        id: 2,
        sender: 'Jane Doe',
        recipient: 'dj',
        subject: 'Project Update',
        body: 'Hey, do you have the latest files for the project? I need them for the presentation tomorrow. Thanks!',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
    }
];

let mockContacts: Contact[] = [
    { id: 1, owner: 'dj', name: 'Admin', email: 'admin@lynixity.x10.bz', phone: '123-456-7890'},
    { id: 2, owner: 'dj', name: 'Jane Doe', email: 'jane@example.com', phone: '987-654-3210'},
];

let mockNotes: Note[] = [
    { id: 1, owner: 'dj', title: 'Shopping List', content: '- Milk\n- Bread\n- Eggs', createdAt: new Date() },
    { id: 2, owner: 'dj', title: 'Meeting Notes', content: 'Discuss Q3 budget and project timelines.', createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }, // 4 days old, will be filtered out
];


// Mock service to simulate Supabase calls
export const supabaseService = {
    login: (id: string, pass: string): Promise<User | null> => {
        console.log(`Attempting login for ID: ${id}`);
        // This is a mock login. In a real app, never handle passwords this way.
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const user = mockUsers.find(u => (u.username === id || u.email === id) && pass === 'password'); // Dummy password check
                if (user) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            }, 500);
        });
    },

    getGuestUser: (): Promise<User> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: 0,
                    username: 'Guest User',
                    email: 'guest@lynixity.x10.bz',
                    role: UserRole.Trial,
                    sipVoice: 'N/A',
                    features: { chat: false, ai: true, mail: false }
                });
            }, 200);
        });
    },
    
    getUsers: (): Promise<User[]> => {
        return new Promise(resolve => {
            setTimeout(() => resolve([...mockUsers]), 300);
        });
    },
    
    addUser: (userData: Partial<User>): Promise<User> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newUser: User = {
                    id: nextId++,
                    username: userData.username || `User ${nextId}`,
                    email: userData.email || '',
                    role: userData.role || UserRole.Standard,
                    sipVoice: userData.sipVoice || null,
                    features: userData.features || { chat: false, ai: false, mail: false },
                };
                mockUsers.push(newUser);
                resolve(newUser);
            }, 300);
        });
    },

    updateUser: (userData: Partial<User>): Promise<User | null> => {
         return new Promise(resolve => {
            setTimeout(() => {
                const userIndex = mockUsers.findIndex(u => u.id === userData.id);
                if (userIndex !== -1) {
                    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
                    resolve(mockUsers[userIndex]);
                } else {
                    resolve(null);
                }
            }, 300);
        });
    },
    
    deleteUser: (userId: number): Promise<boolean> => {
         return new Promise(resolve => {
            setTimeout(() => {
                const initialLength = mockUsers.length;
                mockUsers = mockUsers.filter(u => u.id !== userId);
                resolve(mockUsers.length < initialLength);
            }, 300);
        });
    },

    getUserByUsername: (username: string): Promise<User | null> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const user = mockUsers.find(u => u.username.toLowerCase() === username.toLowerCase());
                resolve(user || null);
            }, 200);
        });
    },

    // --- Mail Service Functions ---

    getMailsForUser: (username: string): Promise<{ inbox: Mail[], sent: Mail[] }> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const inbox = mockMails
                    .filter(m => m.recipient === username)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                const sent = mockMails
                    .filter(m => m.sender === username)
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
                resolve({ inbox, sent });
            }, 500);
        });
    },

    sendMail: (mailData: Omit<Mail, 'id' | 'timestamp' | 'read'>): Promise<Mail> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newMail: Mail = {
                    ...mailData,
                    id: nextMailId++,
                    timestamp: new Date(),
                    read: false,
                };
                mockMails.push(newMail);
                resolve(newMail);
            }, 300);
        });
    },
    
    markMailAsRead: (mailId: number): Promise<boolean> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const mail = mockMails.find(m => m.id === mailId);
                if(mail) {
                    mail.read = true;
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 100);
        });
    },

    deleteMail: (mailId: number): Promise<boolean> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const initialLength = mockMails.length;
                mockMails = mockMails.filter(m => m.id !== mailId);
                resolve(mockMails.length < initialLength);
            }, 300);
        });
    },

    // --- Contacts Service Functions ---

    getContactsForUser: (username: string): Promise<Contact[]> => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(mockContacts.filter(c => c.owner === username));
            }, 400);
        });
    },

    addContact: (contactData: Omit<Contact, 'id'>): Promise<Contact> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newContact: Contact = { ...contactData, id: nextContactId++ };
                mockContacts.push(newContact);
                resolve(newContact);
            }, 300);
        });
    },

    updateContact: (contactData: Contact): Promise<Contact | null> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const index = mockContacts.findIndex(c => c.id === contactData.id);
                if (index !== -1) {
                    mockContacts[index] = contactData;
                    resolve(contactData);
                } else {
                    resolve(null);
                }
            }, 300);
        });
    },

    deleteContact: (contactId: number): Promise<boolean> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const initialLength = mockContacts.length;
                mockContacts = mockContacts.filter(c => c.id !== contactId);
                resolve(mockContacts.length < initialLength);
            }, 300);
        });
    },

    // --- Notepad Service Functions ---
    getNotesForUser: (username: string): Promise<Note[]> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const threeDaysAgo = Date.now() - 72 * 60 * 60 * 1000;
                const userNotes = mockNotes
                    .filter(n => n.owner === username && n.createdAt.getTime() > threeDaysAgo)
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                resolve(userNotes);
            }, 400);
        });
    },

    addNote: (noteData: Omit<Note, 'id' | 'createdAt'>): Promise<Note> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const newNote: Note = { ...noteData, id: nextNoteId++, createdAt: new Date() };
                mockNotes.push(newNote);
                resolve(newNote);
            }, 300);
        });
    },

    updateNote: (noteData: Note): Promise<Note | null> => {
         return new Promise(resolve => {
            setTimeout(() => {
                const index = mockNotes.findIndex(n => n.id === noteData.id);
                if (index !== -1) {
                    // Don't update createdAt on edit
                    mockNotes[index].title = noteData.title;
                    mockNotes[index].content = noteData.content;
                    resolve(mockNotes[index]);
                } else {
                    resolve(null);
                }
            }, 300);
        });
    },

    deleteNote: (noteId: number): Promise<boolean> => {
        return new Promise(resolve => {
            setTimeout(() => {
                const initialLength = mockNotes.length;
                mockNotes = mockNotes.filter(n => n.id !== noteId);
                resolve(mockNotes.length < initialLength);
            }, 300);
        });
    },
};