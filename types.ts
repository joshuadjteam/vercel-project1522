
export enum UserRole {
    Admin = 'Admin',
    Standard = 'Standard',
    Trial = 'Trial',
    Guest = 'Guest',
}

export interface User {
    id: number;
    auth_id?: string; // Link to the auth.users table
    username: string;
    email: string;
    role: UserRole;
    sipVoice: string | null;
    features: {
        chat: boolean;
        ai: boolean;
        mail: boolean;
    };
}

export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    text: string;
    timestamp: Date;
    // Prisma will include these when we query
    sender: User; 
    receiver: User;
}

export interface Mail {
    id: number;
    sender: string;
    recipient: string;
    subject: string;
    body: string;
    timestamp: Date;
    read: boolean;
}

export interface MailAccount {
    id: number;
    user_id: string; // auth_id of the owner
    display_name: string;
    email_address: string;
    smtp_server: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass: string;
    smtp_tls: boolean;
    imap_server: string;
    imap_port: number;
    imap_user: string;
    imap_pass: string;
    imap_encryption: string;
}


export interface Contact {
    id: number;
    owner: string; // username of the user who owns the contact
    name: string;
    email?: string;
    phone?: string;
}

export interface Note {
    id: number;
    owner: string; // username of the user who owns the note
    title: string;
    content: string;
    createdAt: Date;
}

export interface CallRecord {
    id: number;
    owner: string; // username of the user who owns the record
    caller_username: string;
    callee_username: string;
    direction: 'incoming' | 'outgoing';
    status: 'answered' | 'declined' | 'missed' | 'ended' | 'ai_call';
    duration: number; // in seconds
    timestamp: string; // ISO string
}


export type Page = 
    | 'home' 
    | 'contact' 
    | 'signin' 
    | 'profile' 
    | 'admin'
    | 'app-phone'
    | 'app-chat'
    | 'app-localmail'
    | 'app-contacts'
    | 'app-notepad'
    | 'app-calculator';