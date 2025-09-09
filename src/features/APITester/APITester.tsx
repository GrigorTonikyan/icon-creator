import { useEffect, useRef, useState, type FC, type FormEvent } from "react";

import cn from "classnames";
import "./APITester.css";

interface APITesterProps {
    className?: string;
}

export const APITester: FC<APITesterProps> = ({ className }) => {
    const responseInputRef = useRef<HTMLTextAreaElement>(null);
    const [status, setStatus] = useState({ status: 0, statusText: "" });

    const apiTesterCn = cn("APITester", className);

    useEffect(() => {
        if (!status.status) return;
    }, [status]);

    const testEndpoint = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const form = e.currentTarget;
            const formData = new FormData(form);
            const endpoint = formData.get("endpoint") as string;
            const url = new URL(endpoint, location.href);
            const method = formData.get("method") as string;
            const res = await fetch(url, { method });

            setStatus({
                status: res?.status,
                statusText: res?.statusText,
            });

            console.log(res);
            const data = await res.json();

            responseInputRef.current!.value = JSON.stringify(data, null, 2);
        } catch (error) {
            responseInputRef.current!.value = String(error);
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
                <input
                    id="endpoint-input"
                    type="text"
                    name="endpoint"
                    defaultValue="/api/hello"
                    className="url-input"
                    placeholder="/api/hello"
                />
                <button type="submit" className="send-button">
                    Send
                </button>
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
