import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { APITester } from "./APITester";

// Mock fetch globally
const mockFetch = vi.fn() as any;
Object.defineProperty(globalThis, "fetch", {
    value: mockFetch,
    writable: true,
});

// Mock URL constructor for endpoint validation
Object.defineProperty(globalThis, "URL", {
    value: vi.fn().mockImplementation((url) => {
        if (typeof url !== "string" || !url.includes("://")) {
            throw new TypeError("Invalid URL");
        }
        return {
            href: url,
            protocol: url.split("://")[0] + ":",
            hostname: url.split("://")[1]?.split("/")[0] || "",
            pathname: "/" + (url.split("://")[1]?.split("/").slice(1).join("/") || ""),
        };
    }),
    writable: true,
});

describe("APITester", () => {
    beforeEach(() => {
        mockFetch.mockClear();
    });

    test("should render without crashing", () => {
        render(<APITester />);

        expect(screen.getByLabelText("HTTP Method")).toBeInTheDocument();
        expect(screen.getByLabelText("API Endpoint")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /send/i })).toBeInTheDocument();
        expect(screen.getByLabelText("API Response")).toBeInTheDocument();
    });

    test("should call API when button is clicked", async () => {
        const user = userEvent.setup();

        // Mock successful API response
        mockFetch.mockResolvedValueOnce({
            status: 200,
            statusText: "OK",
            json: vi.fn().mockResolvedValueOnce({ message: "Hello, world!" }),
        });

        render(<APITester />);

        const sendButton = screen.getByRole("button", { name: /send/i });
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Set a valid URL
        await user.clear(endpointInput);
        await user.type(endpointInput, "https://api.example.com/test");

        // Act
        await user.click(sendButton);

        // Assert
        expect(mockFetch).toHaveBeenCalledOnce();
    });

    test("should handle API success response correctly", async () => {
        const user = userEvent.setup();
        const mockResponseData = { message: "Hello, world!", status: "success" };

        mockFetch.mockResolvedValueOnce({
            status: 200,
            statusText: "OK",
            json: vi.fn().mockResolvedValueOnce(mockResponseData),
        });

        const { container } = render(<APITester />);

        const sendButton = screen.getByRole("button", { name: /send/i });
        const responseArea = screen.getByLabelText("API Response");
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Set a valid URL
        await user.clear(endpointInput);
        await user.type(endpointInput, "https://api.example.com/test");

        // Act
        await user.click(sendButton);

        // Assert
        await waitFor(
            () => {
                expect(responseArea).toHaveValue(JSON.stringify(mockResponseData, null, 2));
            },
            { container }
        );

        expect(responseArea).toHaveClass("success");
        expect(responseArea).toHaveClass("status-200");
    });

    test("should handle API error response correctly", async () => {
        const user = userEvent.setup();

        mockFetch.mockResolvedValueOnce({
            status: 404,
            statusText: "Not Found",
            json: vi.fn().mockResolvedValueOnce({ error: "Not found" }),
        });

        const { container } = render(<APITester />);

        const sendButton = screen.getByRole("button", { name: /send/i });
        const responseArea = screen.getByLabelText("API Response");
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Set a valid URL
        await user.clear(endpointInput);
        await user.type(endpointInput, "https://api.example.com/test");

        // Act
        await user.click(sendButton);

        // Assert
        await waitFor(
            () => {
                expect(responseArea).toHaveClass("status-404");
            },
            { container }
        );
    });

    test("should handle network errors correctly", async () => {
        const user = userEvent.setup();
        const errorMessage = "Network error occurred";

        mockFetch.mockRejectedValueOnce(new Error(errorMessage));

        const { container } = render(<APITester />);

        const sendButton = screen.getByRole("button", { name: /send/i });
        const responseArea = screen.getByLabelText("API Response");
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Set a valid URL
        await user.clear(endpointInput);
        await user.type(endpointInput, "https://api.example.com/test");

        // Act
        await user.click(sendButton);

        // Assert
        await waitFor(
            () => {
                expect(responseArea).toHaveValue(`Error: ${errorMessage}`);
            },
            { container }
        );
    });

    test("should allow changing HTTP method", async () => {
        const user = userEvent.setup();

        mockFetch.mockResolvedValueOnce({
            status: 200,
            statusText: "OK",
            json: vi.fn().mockResolvedValueOnce({ method: "PUT" }),
        });

        render(<APITester />);

        const methodSelect = screen.getByLabelText("HTTP Method");
        const sendButton = screen.getByRole("button", { name: /send/i });
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Set a valid URL
        await user.clear(endpointInput);
        await user.type(endpointInput, "https://api.example.com/test");

        // Act - change method to PUT
        await user.selectOptions(methodSelect, "PUT");
        await user.click(sendButton);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                href: "https://api.example.com/test",
            }),
            { method: "PUT" }
        );
    });

    test("should allow changing endpoint URL", async () => {
        const user = userEvent.setup();
        const customEndpoint = "https://api.example.com/custom";

        mockFetch.mockResolvedValueOnce({
            status: 200,
            statusText: "OK",
            json: vi.fn().mockResolvedValueOnce({ endpoint: customEndpoint }),
        });

        render(<APITester />);

        const urlInput = screen.getByLabelText("API Endpoint");
        const sendButton = screen.getByRole("button", { name: /send/i });

        // Act - change endpoint
        await user.clear(urlInput);
        await user.type(urlInput, customEndpoint);
        await user.click(sendButton);

        // Assert
        expect(mockFetch).toHaveBeenCalledWith(
            expect.objectContaining({
                href: customEndpoint,
            }),
            { method: "GET" }
        );
    });

    test("should accept custom className prop", () => {
        const customClass = "custom-api-tester";
        render(<APITester className={customClass} />);

        const responseArea = screen.getByLabelText("API Response");
        expect(responseArea).toHaveClass(customClass);
    });

    test("should have proper default placeholder text", () => {
        render(<APITester />);

        const urlInput = screen.getByPlaceholderText("/api/hello");
        const responseArea = screen.getByPlaceholderText("Response will appear here...");

        expect(urlInput).toBeInTheDocument();
        expect(responseArea).toBeInTheDocument();
    });
});
