// Types for navigation and theme management
export type Section = "icon-creator" | "visual-editor" | "api-tester";

export interface NavigationItem {
    id: Section;
    label: string;
    disabled?: boolean;
}

export type Theme = "light" | "dark" | "auto" | "custom";

export interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

export interface AppSettings {
    autoSave: boolean;
    showNotifications: boolean;
    debugMode: boolean;
}

export interface HeaderProps {
    className?: string;
    currentSection: Section;
    onSectionChange: (section: Section) => void;
}
