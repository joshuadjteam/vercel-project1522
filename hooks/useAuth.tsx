
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';
import { supabaseService } from '../services/supabaseService';

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    login: (id: string, pass: string) => Promise<User | null>;
    loginAsGuest: () => Promise<User | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = async (id: string, pass: string) => {
        const loggedInUser = await supabaseService.login(id, pass);
        setUser(loggedInUser);
        return loggedInUser;
    };
    
    const loginAsGuest = async () => {
        const guestUser = await supabaseService.getGuestUser();
        setUser(guestUser);
        return guestUser;
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout, loginAsGuest }}>
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
