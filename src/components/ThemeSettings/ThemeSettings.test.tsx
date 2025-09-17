import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../contexts/ThemeContext";
import { ThemeSettings } from "./ThemeSettings";

// Helper function to render component with theme provider
function renderWithTheme(component: React.ReactElement) {
    return render(<ThemeProvider>{component}</ThemeProvider>);
}

describe("ThemeSettings", () => {
    describe("Basic Rendering", () => {
        it("should render theme settings component", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByText("Theme Customization")).toBeInTheDocument();
            expect(screen.getByText("Customize the appearance of the icon creator interface")).toBeInTheDocument();
        });

        it("should render theme mode selector", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByLabelText(/theme mode/i)).toBeInTheDocument();
            expect(
                screen.getByText("Choose between light, dark, auto (follows system), or custom theme")
            ).toBeInTheDocument();
        });

        it("should show preview button when not in custom theme", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByText("Preview Custom Theme")).toBeInTheDocument();
        });

        it("should show import/export section", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByText("Import/Export")).toBeInTheDocument();
            expect(screen.getByText("Export Theme")).toBeInTheDocument();
            expect(screen.getByText("Import Theme")).toBeInTheDocument();
        });
    });

    describe("Theme Options", () => {
        it("should have all theme options available", () => {
            renderWithTheme(<ThemeSettings />);

            const select = screen.getByLabelText(/theme mode/i);
            expect(select).toBeInTheDocument();

            // Check that all options are available in the DOM
            expect(screen.getByText("Light Theme")).toBeInTheDocument();
            expect(screen.getByText("Dark Theme")).toBeInTheDocument();
            expect(screen.getByText("Auto (System)")).toBeInTheDocument();
            expect(screen.getByText("Custom Theme")).toBeInTheDocument();
        });
    });

    describe("Accessibility", () => {
        it("should have proper ARIA labels", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByLabelText(/theme mode/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/file upload/i)).toBeInTheDocument();
        });

        it("should have descriptive help text", () => {
            renderWithTheme(<ThemeSettings />);

            expect(
                screen.getByText("Choose between light, dark, auto (follows system), or custom theme")
            ).toBeInTheDocument();
        });

        it("should have proper heading structure", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByRole("heading", { level: 3, name: /theme customization/i })).toBeInTheDocument();
            expect(screen.getByRole("heading", { level: 4, name: /import\/export/i })).toBeInTheDocument();
        });
    });

    describe("Component Structure", () => {
        it("should have proper CSS classes", () => {
            const { container } = renderWithTheme(<ThemeSettings />);

            expect(container.querySelector(".ThemeSettings")).toBeInTheDocument();
            expect(container.querySelector(".ThemeSettings__header")).toBeInTheDocument();
            expect(container.querySelector(".ThemeSettings__section")).toBeInTheDocument();
        });

        it("should have proper button elements", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByRole("button", { name: /preview custom theme/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /export theme/i })).toBeInTheDocument();
            expect(screen.getByRole("button", { name: /import theme/i })).toBeInTheDocument();
        });
    });

    describe("Form Elements", () => {
        it("should have proper form controls", () => {
            renderWithTheme(<ThemeSettings />);

            // Theme mode selector
            expect(screen.getByRole("combobox", { name: /theme mode/i })).toBeInTheDocument();

            // File input for import
            expect(screen.getByLabelText(/file upload/i)).toBeInTheDocument();
        });

        it("should have proper form labels", () => {
            renderWithTheme(<ThemeSettings />);

            expect(screen.getByText("Theme Mode")).toBeInTheDocument();
        });
    });

    describe("Component Props", () => {
        it("should accept and apply className prop", () => {
            const { container } = renderWithTheme(<ThemeSettings className="custom-class" />);

            expect(container.querySelector(".ThemeSettings.custom-class")).toBeInTheDocument();
        });

        it("should render without className prop", () => {
            const { container } = renderWithTheme(<ThemeSettings />);

            expect(container.querySelector(".ThemeSettings")).toBeInTheDocument();
        });
    });

    describe("Theme Context Integration", () => {
        it("should integrate with theme context", () => {
            // This test verifies the component renders without crashing when wrapped in ThemeProvider
            renderWithTheme(<ThemeSettings />);

            // If the component renders successfully, it means the theme context integration works
            expect(screen.getByText("Theme Customization")).toBeInTheDocument();
        });
    });
});
