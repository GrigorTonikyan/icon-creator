import cn from "classnames";
import type { SyntheticEvent } from "react";
import { useRef, useState } from "react";
import { Button } from "../../components/ui/Button/Button";
import { Input } from "../../components/ui/Input/Input";
import "./APITester.css";

interface RequestStatus {
    status: number;
    statusText: string;
}

interface APITesterProps {
    className?: string;
}

export const APITester = ({ className }: APITesterProps) => {
    const responseInputRef = useRef<HTMLTextAreaElement>(null);
    const [status, setStatus] = useState<RequestStatus>({ status: 0, statusText: "" });
    const [endpointError, setEndpointError] = useState<string>("");

    const apiTesterCn = cn("api-tester", className);

    const validateEndpoint = (endpoint: string): string => {
        if (!endpoint.trim()) {
            return "API endpoint is required";
        }

        try {
            // Check if it's a valid URL format
            if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
                new URL(endpoint);
            } else if (endpoint.startsWith("/")) {
                // Relative URL is valid
                return "";
            } else {
                return "Please enter a valid URL (starting with http://, https://, or /)";
            }
        } catch {
            return "Please enter a valid URL format";
        }

        return "";
    };

    const testEndpoint = async (event: SyntheticEvent) => {
        event.preventDefault();
        if (!responseInputRef.current) return;

        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const method = formData.get("method") as string;
        const endpoint = formData.get("endpoint") as string;

        // Validate endpoint
        const validationError = validateEndpoint(endpoint);
        if (validationError) {
            setEndpointError(validationError);
            return;
        }

        // Clear any previous validation errors
        setEndpointError("");

        setStatus({ status: 0, statusText: "Loading" });
        responseInputRef.current.value = "Loading...";

        try {
            const url = endpoint.startsWith("/") ? `${window.location.origin}${endpoint}` : endpoint;
            const res = await fetch(new URL(url), { method });

            setStatus({
                status: res.status,
                statusText: res.statusText,
            });

            if (!res.ok) {
                const errorText = await res.text();
                responseInputRef.current.value = JSON.stringify(
                    {
                        error: `HTTP ${res.status} ${res.statusText}`,
                        message: errorText || "Request failed",
                        status: res.status,
                        statusText: res.statusText,
                    },
                    null,
                    2
                );
                return;
            }

            const contentType = res.headers.get("content-type");
            if (contentType?.includes("application/json")) {
                const data = await res.json();
                responseInputRef.current.value = JSON.stringify(data, null, 2);
            } else {
                const text = await res.text();
                responseInputRef.current.value = text;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            setStatus({
                status: 0,
                statusText: "Error",
            });

            responseInputRef.current.value = JSON.stringify(
                {
                    error: "Request failed",
                    message: errorMessage,
                    timestamp: new Date().toISOString(),
                },
                null,
                2
            );
        }
    };

    const responseAreaCn = cn(className, "response-area", `status-${status.status}`, {
        [status.statusText]: Boolean(status.statusText),
        success: status.status === 200,
    });

    return (
        <div className={apiTesterCn}>
            <form onSubmit={testEndpoint} className="endpoint-row">
                <label htmlFor="method-select" className="sr-only">
                    HTTP Method
                </label>
                <select id="method-select" name="method" className="method">
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                </select>
                <label htmlFor="endpoint-input" className="sr-only">
                    API Endpoint
                </label>
                <Input
                    id="endpoint-input"
                    name="endpoint"
                    defaultValue="/api/hello"
                    className="url-input"
                    placeholder="/api/hello"
                    error={endpointError}
                    aria-label="API endpoint URL"
                />
                <Button type="submit" className="send-button">
                    Send
                </Button>
            </form>
            <label htmlFor="response-area" className="sr-only">
                API Response
            </label>
            <textarea
                id="response-area"
                name="response-area"
                ref={responseInputRef}
                readOnly
                placeholder="Response will appear here..."
                className={responseAreaCn}
            />
        </div>
    );
};
