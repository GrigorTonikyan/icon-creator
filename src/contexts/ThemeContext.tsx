import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Theme, ThemeContextType } from "../types/navBar";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
    children: ReactNode;
}
export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setThemeState] = useState<Theme>(() => {
        // Check localStorage first, fallback to system preference
        const saved = localStorage.getItem("icon-creator-theme") as Theme;
        if (saved && (saved === "light" || saved === "dark" || saved === "auto" || saved === "custom")) {
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
        // Simple toggle between light and dark only
        setTheme(theme === "light" ? "dark" : "light");
    };

    const applyThemeToDOM = (themeToApply: Theme) => {
        const root = document.documentElement;

        switch (themeToApply) {
            case "light":
                root.setAttribute("data-theme", "light");
                break;
            case "dark":
                root.removeAttribute("data-theme");
                break;
            case "auto":
                // Apply based on system preference
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                if (prefersDark) {
                    root.removeAttribute("data-theme");
                } else {
                    root.setAttribute("data-theme", "light");
                }
                break;
            case "custom":
                // Custom theme handling will be done by ThemeSettings component
                root.setAttribute("data-theme", "custom");
                break;
            default:
                root.removeAttribute("data-theme");
        }
    };

    useEffect(() => {
        applyThemeToDOM(theme);
    }, [theme]);

    // Listen for system theme changes when in auto mode
    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = (e: MediaQueryListEvent) => {
            // Only auto-switch if theme is set to auto or no theme is saved
            const currentTheme = localStorage.getItem("icon-creator-theme");
            if (currentTheme === "auto" || !currentTheme) {
                applyThemeToDOM(theme === "auto" ? "auto" : e.matches ? "dark" : "light");
            }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, [theme]);

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
