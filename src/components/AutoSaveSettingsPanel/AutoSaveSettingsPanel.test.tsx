import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { EditorProvider } from "../../contexts/EditorContext";
import type { AutoSaveSettings } from "../../types/editor";
import { AutoSaveSettingsPanel } from "./AutoSaveSettingsPanel";

// Mock auto-save functionality
const mockGetAutoSaveSettings = vi.fn();
const mockUpdateAutoSaveSettings = vi.fn();
const mockIsAutoSaveEnabled = vi.fn();
const mockGetLastSaveTime = vi.fn();

// Mock the useEditor hook
vi.mock("../../contexts/EditorContext", async () => {
    const actual = await vi.importActual("../../contexts/EditorContext");
    return {
        ...actual,
        useEditor: vi.fn(() => ({
            getAutoSaveSettings: mockGetAutoSaveSettings,
            updateAutoSaveSettings: mockUpdateAutoSaveSettings,
            isAutoSaveEnabled: mockIsAutoSaveEnabled,
            getLastSaveTime: mockGetLastSaveTime,
        })),
        EditorProvider: ({ children }: { children: React.ReactNode }) => children,
    };
});

describe("AutoSaveSettingsPanel", () => {
    const defaultSettings: AutoSaveSettings = {
        enabled: true,
        interval: 300000, // 5 minutes
        maxAutoSaves: 5,
        showRecoveryPrompt: true,
    };

    beforeEach(() => {
        mockGetAutoSaveSettings.mockReturnValue(defaultSettings);
        mockIsAutoSaveEnabled.mockReturnValue(true);
        mockGetLastSaveTime.mockReturnValue(Date.now() - 60000); // 1 minute ago
        mockUpdateAutoSaveSettings.mockClear();
    });

    test("should render auto-save settings", () => {
        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        expect(screen.getByText(/auto.*save.*settings/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/enable auto-save/i)).toBeChecked();
    });

    test("should call updateAutoSaveSettings when toggling auto-save enabled", () => {
        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        const enabledCheckbox = screen.getByLabelText(/enable auto-save/i);
        fireEvent.click(enabledCheckbox);

        expect(mockUpdateAutoSaveSettings).toHaveBeenCalledWith({
            enabled: false,
        });
    });

    test("should call updateAutoSaveSettings when changing save interval", () => {
        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        const intervalInput = screen.getByLabelText(/save interval/i);
        fireEvent.change(intervalInput, { target: { value: "10" } });

        expect(mockUpdateAutoSaveSettings).toHaveBeenCalledWith({
            interval: 600000, // 10 minutes in milliseconds
        });
    });

    test("should call updateAutoSaveSettings when changing max auto-saves", () => {
        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        const maxSavesInput = screen.getByLabelText(/maximum auto-saves/i);
        fireEvent.change(maxSavesInput, { target: { value: "10" } });

        expect(mockUpdateAutoSaveSettings).toHaveBeenCalledWith({
            maxAutoSaves: 10,
        });
    });

    test("should disable interval and max saves inputs when auto-save is disabled", () => {
        const disabledSettings: AutoSaveSettings = {
            ...defaultSettings,
            enabled: false,
        };

        mockGetAutoSaveSettings.mockReturnValue(disabledSettings);

        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        expect(screen.getByLabelText(/save interval/i)).toBeDisabled();
        expect(screen.getByLabelText(/maximum auto-saves/i)).toBeDisabled();
    });

    test("should show last save time when available", () => {
        const lastSaveTime = Date.now() - 300000; // 5 minutes ago
        mockGetLastSaveTime.mockReturnValue(lastSaveTime);

        render(
            <EditorProvider>
                <AutoSaveSettingsPanel />
            </EditorProvider>
        );

        expect(screen.getByText(/last saved/i)).toBeInTheDocument();
    });

    test("should handle close callback", () => {
        const mockOnClose = vi.fn();

        render(
            <EditorProvider>
                <AutoSaveSettingsPanel onClose={mockOnClose} />
            </EditorProvider>
        );

        const closeButton = screen.getByRole("button", { name: /close/i });
        fireEvent.click(closeButton);

        expect(mockOnClose).toHaveBeenCalled();
    });
});
