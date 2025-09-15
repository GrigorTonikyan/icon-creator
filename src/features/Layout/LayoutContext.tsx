// src/features/Layout/LayoutContext.ts
import { createContext, useContext, type ReactNode } from "react";

interface LayoutContextValue {
    // The function that child regions will call to register their content
    registerRegion: (name: string, content: ReactNode) => void;
}

// Create the context with a default "no-op" function to prevent errors
// if a LayoutRegion is ever used outside of a Layout provider.
export const LayoutContext = createContext<LayoutContextValue>({
    registerRegion: () => {},
});

// A custom hook for easy access to the context
export const useLayout = () => {
    return useContext(LayoutContext);
};
