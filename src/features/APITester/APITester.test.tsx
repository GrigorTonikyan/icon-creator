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
const MockedURL = class URL {
    href: string;
    protocol: string;
    hostname: string;
    pathname: string;

    constructor(url: string) {
        if (typeof url !== "string" || !url.includes("://")) {
            throw new TypeError("Invalid URL");
        }
        this.href = url;
        this.protocol = url.split("://")[0] + ":";
        this.hostname = url.split("://")[1]?.split("/")[0] || "";
        this.pathname = "/" + (url.split("://")[1]?.split("/").slice(1).join("/") || "");
    }
};

Object.defineProperty(globalThis, "URL", {
    value: MockedURL,
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
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "content-type") return "application/json";
                    return null;
                }),
            },
            json: vi.fn().mockResolvedValueOnce({ message: "Hello, world!" }),
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ message: "Hello, world!" })),
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
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "content-type") return "application/json";
                    return null;
                }),
            },
            json: vi.fn().mockResolvedValueOnce(mockResponseData),
            text: vi.fn().mockResolvedValueOnce(JSON.stringify(mockResponseData)),
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
            ok: false,
            status: 404,
            statusText: "Not Found",
            headers: {
                get: vi.fn().mockReturnValue(null),
            },
            text: vi.fn().mockResolvedValueOnce("Not found"),
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

        // Check that the error response is in the new structured format
        const expectedErrorResponse = {
            error: "HTTP 404 Not Found",
            message: "Not found",
            status: 404,
            statusText: "Not Found",
        };

        await waitFor(() => {
            expect(responseArea).toHaveValue(JSON.stringify(expectedErrorResponse, null, 2));
        });
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
                const responseValue = (responseArea as HTMLTextAreaElement).value;
                const parsedResponse = JSON.parse(responseValue);
                expect(parsedResponse.error).toBe("Request failed");
                expect(parsedResponse.message).toBe(errorMessage);
                expect(parsedResponse.timestamp).toBeDefined();
            },
            { container }
        );
    });

    test("should allow changing HTTP method", async () => {
        const user = userEvent.setup();

        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "content-type") return "application/json";
                    return null;
                }),
            },
            json: vi.fn().mockResolvedValueOnce({ method: "PUT" }),
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ method: "PUT" })),
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
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "content-type") return "application/json";
                    return null;
                }),
            },
            json: vi.fn().mockResolvedValueOnce({ endpoint: customEndpoint }),
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ endpoint: customEndpoint })),
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

        const endpointInput = screen.getByLabelText("API Endpoint");
        expect(endpointInput).toHaveAttribute("placeholder", "/api/hello");

        const responseArea = screen.getByLabelText("API Response");
        expect(responseArea).toHaveAttribute("placeholder", "Response will appear here...");
    });

    test("should validate endpoint URL and show error message", async () => {
        const user = userEvent.setup();

        render(<APITester />);

        const sendButton = screen.getByRole("button", { name: /send/i });
        const endpointInput = screen.getByLabelText("API Endpoint");

        // Test empty endpoint validation
        await user.clear(endpointInput);
        await user.click(sendButton);

        await waitFor(() => {
            expect(screen.getByText("API endpoint is required")).toBeInTheDocument();
        });

        // Test invalid URL format validation
        await user.clear(endpointInput);
        await user.type(endpointInput, "invalid-url");
        await user.click(sendButton);

        await waitFor(() => {
            expect(
                screen.getByText("Please enter a valid URL (starting with http://, https://, or /)")
            ).toBeInTheDocument();
        });

        // Test that valid relative URL clears error
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
                get: vi.fn((name: string) => {
                    if (name === "content-type") return "application/json";
                    return null;
                }),
            },
            json: vi.fn().mockResolvedValueOnce({ status: "success" }),
            text: vi.fn().mockResolvedValueOnce(JSON.stringify({ status: "success" })),
        });

        await user.clear(endpointInput);
        await user.type(endpointInput, "/api/valid");
        await user.click(sendButton);

        await waitFor(() => {
            expect(screen.queryByText("API endpoint is required")).not.toBeInTheDocument();
            expect(
                screen.queryByText("Please enter a valid URL (starting with http://, https://, or /)")
            ).not.toBeInTheDocument();
        });
    });
});
