---
applyTo: '**'
---
# react

Important to make sure everything below is truth!:

- this should be structure of app's frontend.

    ```structure
    ├───assets
    ├───components
    │   ├───compOneDir
    │   ├───compTwoDir
    │   ├───...
    │   └───index.ts
    ├───features
    │   ├───featureOneDir
    │   ├───featureTwoDir
    │   ├───...
    │   └───index.ts
    ├───utils
    ├───constants
    ├───styles
    └───types
    ```

- Module isolation: Each feature or component gets its own directory with index.ts barrel export, make sure to use named barrel exports don't use `export * ...`
- Use functional components with hooks
- Follow the React hooks rules (no conditional hooks)
- Keep components small and focused
- each component has its own `component-name.css` file and imports it directly.
