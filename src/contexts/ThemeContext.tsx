import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Theme, ThemeContextType } from "../types/header";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Check localStorage first, fallback to system preference
        const saved = localStorage.getItem("icon-creator-theme") as Theme;
        if (saved && (saved === "light" || saved === "dark")) {
            return saved;
        }

        // Check system preference
        if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
            return "dark";
        }

        return "light";
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem("icon-creator-theme", newTheme);
        applyThemeToDOM(newTheme);
    };

    const toggleTheme = () => {
        setTheme(theme === "light" ? "dark" : "light");
    };

    const applyThemeToDOM = (themeToApply: Theme) => {
        if (themeToApply === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    };

    useEffect(() => {
        applyThemeToDOM(theme);
    }, [theme]);

    // Listen for system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            // Only auto-switch if no theme is saved in localStorage
            if (!localStorage.getItem("icon-creator-theme")) {
                setTheme(e.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const value: ThemeContextType = {
        theme,
        setTheme,
        toggleTheme,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
