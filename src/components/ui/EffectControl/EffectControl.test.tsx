import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EffectControl } from "./EffectControl";

describe("EffectControl", () => {
    test("should render effects control component", () => {
        const mockOnChange = vi.fn();

        render(<EffectControl effects={[]} onChange={mockOnChange} />);

        expect(screen.getByText("Effects")).toBeInTheDocument();
        expect(screen.getByText("Add Effect")).toBeInTheDocument();
    });

    test("should render effect types in dropdown", () => {
        const mockOnChange = vi.fn();

        render(<EffectControl effects={[]} onChange={mockOnChange} />);

        const select = screen.getByRole("combobox");
        expect(select).toBeInTheDocument();

        // Check first option
        expect(screen.getByText("Drop Shadow")).toBeInTheDocument();
    });
});
