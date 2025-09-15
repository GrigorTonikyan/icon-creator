import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test-setup.ts"],
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["node_modules/**"],
        mockReset: true,
        clearMocks: true,
        restoreMocks: true,
    },
});
