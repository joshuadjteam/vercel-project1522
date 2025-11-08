import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
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
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const userProfile = await supabaseService.getUserProfile(session.user.id);
                if (userProfile) {
                    setUser(userProfile);
                    setIsLoggedIn(true);
                }
            }
            setIsLoading(false);
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                supabaseService.getUserProfile(session.user.id).then((profile) => {
                    if (profile) {
                        setUser(profile);
                        setIsLoggedIn(true);
                    }
                });
            } else {
                // This will be triggered on sign out
                setUser(null);
                setIsLoggedIn(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const login = async (id: string, pass: string): Promise<User | null> => {
        // Check for local administrator account
        if (id.toLowerCase() === 'administrator' && pass === 'DJTeam2013') {
            const adminUser: User = {
                id: -1, // Special ID for local admin
                username: 'administrator',
                email: 'admin@local',
                role: UserRole.Admin,
                sipVoice: 'N/A',
                features: {
                    chat: true,
                    ai: true,
                    mail: true,
                },
            };
            setUser(adminUser);
            setIsLoggedIn(true);
            return adminUser;
        }

        // Proceed with regular database login
        const userProfile = await supabaseService.login(id, pass);
        if (userProfile) {
            setUser(userProfile);
            setIsLoggedIn(true);
        }
        return userProfile;
    };
    
    const loginAsGuest = async (): Promise<User | null> => {
        const guestUser = await supabaseService.getGuestUser();
        setUser(guestUser);
        setIsLoggedIn(true);
        return guestUser;
    };

    const logout = async () => {
        if (user?.id === -1) { // Local admin logout
            setUser(null);
            setIsLoggedIn(false);
        } else { // Regular user logout
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error logging out:', error);
            }
            // State is also cleared by the onAuthStateChange listener
            setUser(null);
            setIsLoggedIn(false);
        }
    };

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
