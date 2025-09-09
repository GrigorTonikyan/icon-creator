import { serve } from "bun";
import index from "src/index.html";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = serve({
    port: PORT,
    routes: {
        // Serve index.html for all unmatched routes.
        "/*": index,

        "/api/hello": {
            async GET(req) {
                return Response.json({
                    message: "Hello, world!",
                    method: "GET",
                });
            },
            async PUT(req) {
                return Response.json({
                    message: "Hello, world!",
                    method: "PUT",
                });
            },
        },

        "/api/hello/:name": async (req) => {
            const name = req.params.name;
            return Response.json({
                message: `Hello, ${name}!`,
            });
        },
    },

    development: process.env.NODE_ENV !== "production" && {
        // Enable browser hot reloading in development
        hmr: true,

        // Echo console logs from the browser to the server
        console: true,
    },

    error(error) {
        if (error.code === "EADDRINUSE") {
            console.error(
                `❌ Port ${PORT} is already in use. Please try a different port by setting the PORT environment variable.`
            );
            console.error(`   Example: PORT=3001 bun dev`);
            process.exit(1);
        }
        console.error("Server error:", error);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log(`🚀 Server running at ${server.url}`);
