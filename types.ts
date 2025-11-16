import type { ReactNode } from 'react';

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
    // FIX: Add missing 'plan_name' property. This was causing type errors where User objects were created. Made optional to avoid breaking other parts of the code that may not provide this property.
    plan_name?: string;
    features: {
        chat: boolean;
        ai: boolean;
        mail: boolean;
    };
    // FIX: Add missing sip_username and sip_password properties to match usage in chat service and components.
    sip_username?: string | null;
    sip_password?: string | null;
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
    account_id?: number;
    sender: string;
    recipient: string;
    subject: string;
    body: string;
    timestamp: Date;
    read: boolean;
}

export interface MailAccount {
    id: number;
    user_id: string; // Foreign key to auth.users.id
    display_name: string;
    email_address: string;
    smtp_server: string;
    smtp_port: number;
    smtp_user: string;
    smtp_pass: string;
    smtp_encryption: string;
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

// Add DriveFile interface for Google Drive files
export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    modifiedTime: string;
    webViewLink: string;
    iconLink: string;
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
    | 'app-calculator'
    | 'app-paint'
    | 'app-files'
    | 'app-editor'
    | 'app-converter'
    | 'app-calendar'
    | 'app-console-switch'
    | 'auth-callback';

// --- Centralized Console Types ---

export type AppLaunchable = {
  id: string;
  label: string;
  icon: ReactNode;
  page: Page;
  params?: any;
  isHidden?: boolean;
};

export type NavAction = {
  page: Page;
  action: 'navigate' | 'logout';
  params?: any;
};