---
applyTo: '**'
description: CSS Architecture Rules
---

# Core Principles

- There are `global-scope` css which is reusable and accessible for all other css in application. and there are `component-scope` CSS files which are only imported and used by respective component.
- use `classnames` to manage class names in react components, but import it as `cn` example: `import cn from "classnames"`

## `global-scope` CSS

- Lives in `src/styles/` only.
- has single entry and it is `src/styles/_index.css` imported in `src/index.tsx`.
- `_index.css` only imports `global-scope` CSS files.

## `component-scope` CSS

- File naming: use `name-of-component-which-imports.css` for `component-scope` styles.
- `example-component.css` can only be imported by `exampleComponent.tsx` and they are inside same dir.

### Example

Component file: `FeatureExample/featureExample.tsx`

```tsx
import {useState} from "react"
import {some, exampleComponent} from "./someOtherStaff"

import cn from 'classnames'
import './featureExample.css';

export function FeatureExample({ className }) {

    const [status, setStatus] = useState({
        code: 0,
        text: ""
    })

    const featureExampleCn = cn("FeatureExample", className, [status.code], {
        success: status.code === 200,
        active: status?.code !== 0
    });

    return <div className={featureExampleCn}>...</div>;
}
```

CSS file: `featureExample.css`

```css
.feature-example {
    display: flex;
    /* ... */

    &.active { /* ... */ } /* same as .feature-example.active selector */
    button { /* ... */ }    /* all child buttons */
}
```

## File Structure and Responsibilities

### `global.css` this is `global-scope`

### `variables.css` this is `global-scope`

- All sizes, spacing, and timing values must be defined here
- Use semantic variable names with consistent naming patterns
- Include responsive breakpoints, animation durations, z-index layers

### `typography.css` is `global-scope`

- All text, icon, and glyph-related parameters
- Font families, sizes, weights, line heights
- Icon sizing and spacing rules
- Text decoration and transformation rules

### `animations.css` this is `global-scope`

### `skin*.css` is `global-scope`

- All colors must be defined here using an entity-based system
- Each entity (body, modal, sidebar, button, input, tab, etc.) should have:
  - 1 or more background and text color pairs
  - accent background and text color pairs
  - borders: radius, thickness, color, and type
  - hover color pairs
  - focus states and disabled states

## Entity System for Colors

Each UI entity should define complete color schemes:

- Primary states (normal, hover, focus, active)
- Secondary/alternative states
- Disabled states
- Error/warning/success states
- Border and shadow variations
