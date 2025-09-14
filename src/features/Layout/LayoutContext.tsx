import { createContext, useContext, type ReactNode } from "react";

type RegionContent = Record<string, ReactNode>;

interface LayoutContextType {
    regions: RegionContent;
    setRegionContent: (region: string, content: ReactNode) => void;
}
export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useLayout = () => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error("useLayout must be used within a LayoutProvider");
    }
    return context;
};
