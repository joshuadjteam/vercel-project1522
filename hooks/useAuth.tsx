import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
// FIX: Import `UserRole` to fix a TypeScript reference error.
import { User, UserRole } from '../types';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (id: string, pass: string) => Promise<User | null>;
    loginAsGuest: () => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for an active session when the app loads
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const profile = await supabaseService.getUserProfile(session.user.id);
                setUser(profile);
            }
            setIsLoading(false);
        };
        checkSession();

        // Listen for auth state changes (login, logout)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const profile = await supabaseService.getUserProfile(session.user.id);
                setUser(profile);
            } else {
                setUser(null);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const login = async (id: string, pass: string) => {
        const loggedInUser = await supabaseService.login(id, pass);
        // The onAuthStateChange listener will handle setting the user state
        return loggedInUser;
    };
    
    const loginAsGuest = async () => {
        const guestUser = await supabaseService.getGuestUser();
        setUser(guestUser); // Manually set guest user, as they are not in Supabase Auth
        return guestUser;
    };

    const logout = async () => {
        if (user?.role === UserRole.Guest) {
            setUser(null); // Just clear state for guest
        } else {
            await supabase.auth.signOut();
            // The onAuthStateChange listener will handle setting user state to null
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout, loginAsGuest }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
