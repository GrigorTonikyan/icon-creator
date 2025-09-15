import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

// Mock the ThemeContext
vi.mock("../../contexts/ThemeContext", () => ({
    useTheme: () => ({
        theme: "light",
        toggleTheme: vi.fn(),
        setTheme: vi.fn(),
    }),
}));

import { NavBar } from "./navBar";

describe("NavBar", () => {
    test("should render without crashing", () => {
        const mockOnSectionChange = vi.fn();

        render(<NavBar currentSection="icon-creator" onSectionChange={mockOnSectionChange} />);

        expect(screen.getByRole("heading", { level: 1, name: "Icon Creator" })).toBeInTheDocument();
    });
});
