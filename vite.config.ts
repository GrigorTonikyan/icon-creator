import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    root: "./src",
    build: {
        outDir: "../dist",
        emptyOutDir: true,
    },
    test: {
        globals: true,
        environment: "happy-dom",
        setupFiles: ["./src/test-setup.ts"],
    },
});
