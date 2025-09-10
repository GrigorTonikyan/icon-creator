---
applyTo: "**"
---

# Frontend Testing Guidelines

## Guiding Principles

- **Test Behavior, Not Implementation:** Tests validate user experience, not internal logic. This makes them resilient to refactoring.
- **Confidence & Reliability:** A passing suite must ensure production readiness. Tests must be deterministic.
- **Clarity & Readability:** Tests are living documentation and must be easily understood.

## 1. Core Stack

- **Runner:** Vitest
- **Component Testing:** React Testing Library (`@testing-library/react`)
- **User Simulation:** `@testing-library/user-event`
- **DOM:** `jsdom`
- **Assertions:** `@testing-library/jest-dom`
- **API Mocking:** Vitest's built-in mocking (`vi.mock`)
- **Configuration:** `vitest.config.ts` defines the `jsdom` environment and global setup.

## 2. File Structure & Naming

- **Location:** All test files must be co-located with their source files.
- **Naming Convention:** Use the suffix `*.test.{ts,tsx}` for all test files.
  - **Components:** `MyComponent.test.tsx`
  - **Hooks:** `useMyHook.test.ts`
  - **Utilities:** `myUtil.test.ts`
- **Integration Tests:** Place tests covering full user flows in a top-level `__tests__/` directory (e.g., `src/features/authentication/__tests__/login-flow.test.tsx`).

## 3. Test Requirements & Examples

### A. Component Tests (`*.test.tsx`)

**Mandatory Coverage:**

- Renders without crashing.
- All props (including default/optional) are handled correctly.
- All user interactions trigger expected behavior.
- All conditional rendering paths.
- Loading, error, and empty states.

**Example:**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi } from 'vitest';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  test('should call onClick handler when the button is clicked', async () => {
    // Arrange
    const mockOnClick = vi.fn();
    render(<MyComponent onClick={mockOnClick} />);
    const button = screen.getByRole('button', { name: /click me/i });
    
    // Act
    await userEvent.setup().click(button);

    // Assert
    expect(button).toBeInTheDocument();
    expect(mockOnClick).toHaveBeenCalledOnce();
  });
});
```

### B. Hook Tests (`*.test.ts`)

**Mandatory Coverage:**

- Correct initial state and return values.
- Correct state updates in response to actions.
- Side effects (e.g., API calls) are triggered.
- Cleanup functions are called on unmount.

### C. Utility Tests (`*.test.ts`)

**Mandatory Coverage:**

- Returns expected outputs for valid inputs.
- Handles edge cases (`null`, `undefined`, empty arrays, `0`).
- Throws errors for invalid inputs as designed.

## 4. Mocking

### API / Service Mocks

Use `vi.mock` at the top level of the test file to mock modules.

**Example: Default Mock**

```ts
// At the top of MyComponent.test.tsx
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  fetchData: vi.fn(() => Promise.resolve({ id: 1, name: 'Mock Data' })),
}));
```

**Example: Controlling Mock Behavior in a Test**

```ts
import { fetchData } from '../services/api';

test('should display an error message when API call fails', async () => {
  // Arrange: Override the default mock for this specific test
  vi.mocked(fetchData).mockRejectedValueOnce(new Error('API Error'));

  render(<MyComponent />);

  // Act & Assert
  expect(await screen.findByText(/failed to load/i)).toBeInTheDocument();
});
```

### Child Component Mocks

Mock heavy child components to isolate the component under test.

```tsx
vi.mock('../components/ComplexChart', () => ({
  ComplexChart: vi.fn(() => <div data-testid="mock-chart"></div>),
}));
```

## 5. Best Practices

- **Structure:** Always use the `Arrange -> Act -> Assert` pattern.
- **Descriptive Test Names:** Use the format "should [do something] when [condition occurs]".
- **Query Priority:**
    1. `getByRole`, `getByLabelText`, `getByPlaceholderText` (Accessible to everyone)
    2. `getByText` (Visible to users)
    3. `getByTestId` (**Last resort**). Use only for elements where content is dynamic and no accessible role applies.
        - **Example:** `<div data-testid={`user-status-${userId}`}></div>`
- **Async Operations:** Use `async/await` with `findBy*` queries or `waitFor`.
- **Test Data:** For simple data, define inline. For complex or shared data, use a `*.mock.ts` file.
- **Coverage:** Aim for **>80%** line coverage. Critical user paths **require 100%**.

## 6. What Not to Test

- **Third-Party Libraries:** Do not test library internals. Mock them and test your integration logic (e.g., that you passed the correct props).
- **Implementation Details:** Avoid testing internal state, private methods, or component lifecycle. Focus on the user-visible output.
- **Trivial Code:** Do not test code with no logic (e.g., constants, components that only render static content).

## 7. References

- [Vitest](https://vitest.dev/guide/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [@testing-library/user-event](https://testing-library.com/docs/user-event/intro)
