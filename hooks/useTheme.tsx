
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Sensible defaults and ranges
const DEFAULT_BLUR = 8;
const MIN_BLUR = 0;
const MAX_BLUR = 24;
const DEFAULT_TRANSPARENCY = 0.5;
const MIN_TRANSPARENCY = 0.1;
const MAX_TRANSPARENCY = 1.0;

interface ThemeContextType {
    isDark: boolean;
    setIsDark: (isDark: boolean) => void;
    glassBlur: number;
    setGlassBlur: (blur: number) => void;
    glassTransparency: number;
    setGlassTransparency: (transparency: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isDark, setIsDarkState] = useState(true);
    const [glassBlur, setGlassBlurState] = useState(DEFAULT_BLUR);
    const [glassTransparency, setGlassTransparencyState] = useState(DEFAULT_TRANSPARENCY);

    useEffect(() => {
        // Load settings from localStorage on initial mount
        const savedIsDark = localStorage.getItem('theme-isDark');
        setIsDarkState(savedIsDark ? JSON.parse(savedIsDark) : true);

        const savedBlur = localStorage.getItem('theme-glassBlur');
        setGlassBlurState(savedBlur ? JSON.parse(savedBlur) : DEFAULT_BLUR);
        
        const savedTransparency = localStorage.getItem('theme-glassTransparency');
        setGlassTransparencyState(savedTransparency ? JSON.parse(savedTransparency) : DEFAULT_TRANSPARENCY);
    }, []);

    const setIsDark = (newVal: boolean) => {
        setIsDarkState(newVal);
        localStorage.setItem('theme-isDark', JSON.stringify(newVal));
    };
    
    const setGlassBlur = (newVal: number) => {
        const clampedVal = Math.max(MIN_BLUR, Math.min(MAX_BLUR, newVal));
        setGlassBlurState(clampedVal);
        localStorage.setItem('theme-glassBlur', JSON.stringify(clampedVal));
    };

    const setGlassTransparency = (newVal: number) => {
        const clampedVal = Math.max(MIN_TRANSPARENCY, Math.min(MAX_TRANSPARENCY, newVal));
        setGlassTransparencyState(clampedVal);
        localStorage.setItem('theme-glassTransparency', JSON.stringify(clampedVal));
    };

    const value = {
        isDark,
        setIsDark,
        glassBlur,
        setGlassBlur,
        glassTransparency,
        setGlassTransparency,
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
