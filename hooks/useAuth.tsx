
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { database } from '../services/database';
import { supabase } from '../supabaseClient';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<{ error: string | null }>;
    loginAsGuest: () => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const updateUserState = (profile: User | null) => {
        setUser(profile);
        setIsLoggedIn(!!profile);
    };

    const login = async (email: string, pass: string): Promise<{ error: string | null }> => {
        setIsLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password: pass,
            });

            if (error) {
                return { error: error.message };
            }
            // onAuthStateChange will handle setting the user and isLoggedIn state
            return { error: null };
        } finally {
            // This might happen before onAuthStateChange completes, but that's okay.
            // The UI will show loading during login and then react to the state change.
            setIsLoading(false);
        }
    };
    
    const loginAsGuest = async (): Promise<User | null> => {
        setIsLoading(true);
        const guestUser = await database.getGuestUser();
        updateUserState(guestUser);
        setIsLoading(false);
        return guestUser;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        updateUserState(null);
    };

    useEffect(() => {
        // onAuthStateChange is the single source of truth.
        // It fires once on page load with the initial session state.
        const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
                const { profile } = await database.getUserProfile(session.user.id);
                updateUserState(profile);
            } else {
                updateUserState(null);
            }
            // The initial loading is finished after the first check.
            setIsLoading(false);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);


    return (
        <AuthContext.Provider value={{ user, isLoggedIn, isLoading, login, loginAsGuest, logout }}>
            {children}
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
