import { useEffect, useRef, useState, type FormEvent } from "react";

import cn from "classnames";

export function APITester({ className }) {
    const responseInputRef = useRef<HTMLTextAreaElement>(null);
    const [status, setStatus] = useState({ status: 0, statusText: "" });

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

    const responseAreaCn = cn(className, "response-area", [status.status], {
        [status.statusText]: true,
        success: status.status === 200,
    });

    return (
        <div className="api-tester">
            <form onSubmit={testEndpoint} className="endpoint-row">
                <select name="method" className="method">
                    <option value="GET">GET</option>
                    <option value="PUT">PUT</option>
                </select>
                <input
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
            <textarea
                name="response-area"
                ref={responseInputRef}
                readOnly
                placeholder="Response will appear here..."
                className={responseAreaCn}
            />
        </div>
    );
}
