import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Input } from "../Input/Input";
import { FormField } from "./FormField";

describe("FormField", () => {
    test("should render with label and children", () => {
        render(
            <FormField label="Username">
                <Input placeholder="Enter username" />
            </FormField>
        );

        const label = screen.getByText(/username/i);
        const input = screen.getByPlaceholderText(/enter username/i);

        expect(label).toBeInTheDocument();
        expect(input).toBeInTheDocument();
    });

    test("should render without label", () => {
        render(
            <FormField>
                <Input placeholder="No label input" />
            </FormField>
        );

        const input = screen.getByPlaceholderText(/no label input/i);
        expect(input).toBeInTheDocument();
        expect(screen.queryByText(/.+/)).toBeNull();
    });

    test("should show required indicator", () => {
        render(
            <FormField label="Required Field" required>
                <Input />
            </FormField>
        );

        const label = screen.getByText(/required field/i);
        const requiredIndicator = screen.getByText("*");

        expect(label).toBeInTheDocument();
        expect(requiredIndicator).toBeInTheDocument();
        expect(label.closest(".FormField__label")).toHaveClass("FormField__label--required");
    });

    test("should display error message", () => {
        render(
            <FormField label="Email" error="Invalid email format">
                <Input />
            </FormField>
        );

        const errorMessage = screen.getByText(/invalid email format/i);
        expect(errorMessage).toBeInTheDocument();
        expect(screen.getByRole("textbox").closest(".FormField")).toHaveClass("FormField--error");
    });

    test("should display help text when no error", () => {
        render(
            <FormField label="Password" helpText="Must be at least 8 characters">
                <Input type="password" />
            </FormField>
        );

        const helpText = screen.getByText(/must be at least 8 characters/i);
        expect(helpText).toBeInTheDocument();
        expect(helpText).toHaveClass("FormField__help");
    });

    test("should not display help text when error is present", () => {
        render(
            <FormField label="Password" helpText="Must be at least 8 characters" error="Password is required">
                <Input type="password" />
            </FormField>
        );

        const errorMessage = screen.getByText(/password is required/i);
        expect(errorMessage).toBeInTheDocument();
        expect(screen.queryByText(/must be at least 8 characters/i)).not.toBeInTheDocument();
    });

    test("should render in inline layout", () => {
        render(
            <FormField label="Inline Field" inline>
                <Input />
            </FormField>
        );

        const formField = screen.getByText(/inline field/i).closest(".FormField");
        expect(formField).toHaveClass("FormField--inline");
    });

    test("should apply custom className", () => {
        render(
            <FormField className="custom-form-field">
                <Input />
            </FormField>
        );

        const formField = screen.getByRole("textbox").closest(".FormField");
        expect(formField).toHaveClass("FormField", "custom-form-field");
    });

    test("should apply custom label className", () => {
        render(
            <FormField label="Custom Label" labelClassName="custom-label">
                <Input />
            </FormField>
        );

        const label = screen.getByText(/custom label/i);
        expect(label).toHaveClass("FormField__label", "custom-label");
    });
});
