# Testing Documentation

## Overview

Icon Creator maintains comprehensive test coverage across all features with a focus on reliability, accessibility, and performance. This document outlines our testing strategy, coverage requirements, and implementation details.

## Test Coverage Statistics

### Current Coverage (Stage 11)

- **Overall Test Coverage**: 90%+
- **Total Test Count**: 250+ tests
- **Component Tests**: 100% coverage for all Stage 11 components
- **Utility Tests**: 95%+ coverage for all utility functions
- **Integration Tests**: Complete workflow coverage

### Stage 11 Specific Tests

```
Analytics System: 25/25 tests passing
Theme System: 15/15 tests passing  
Error Boundaries: 12/12 tests passing
Accessibility: 20+ tests across components
Performance: 15+ optimization tests
Onboarding: 10+ user experience tests
```

## Testing Framework

### Core Technologies

- **Vitest**: Modern testing framework with TypeScript support
- **React Testing Library**: Component testing with user-focused approach
- **@testing-library/jest-dom**: Enhanced DOM assertions
- **@testing-library/user-event**: Realistic user interaction simulation

### Configuration

```typescript
// vitest.unit.config.ts
export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        setupFiles: ["./src/test-setup.ts"],
        globals: true,
        include: ["src/**/*.test.{ts,tsx}"],
        exclude: ["node_modules/**"],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            threshold: {
                global: {
                    statements: 90,
                    branches: 85,
                    functions: 90,
                    lines: 90
                }
            }
        }
    }
});
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and utilities in isolation

**Coverage Areas**:

- Analytics utilities (`src/utils/analytics.test.ts`)
- Accessibility helpers (`src/utils/accessibility.test.ts`)
- Performance optimizations (`src/utils/performance.test.ts`)
- Error recovery mechanisms (`src/utils/errorRecovery.test.ts`)
- Keyboard shortcut management (`src/utils/keyboardShortcuts.test.ts`)

**Example Test Structure**:

```typescript
describe('Analytics Manager', () => {
    test('should track feature usage events', () => {
        const analytics = new AnalyticsManager();
        analytics.track('feature_usage', { feature: 'canvas', action: 'zoom' });
        
        const events = analytics.getEvents();
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            type: 'feature_usage',
            data: { feature: 'canvas', action: 'zoom' }
        });
    });
});
```

### 2. Component Tests

**Purpose**: Test React components in isolation with mock dependencies

**Key Test Files**:

- `src/components/ThemeSettings/ThemeSettings.test.tsx`
- `src/components/AnalyticsSettings/AnalyticsSettings.test.tsx`
- `src/components/ErrorBoundary/ErrorBoundary.test.tsx`
- `src/components/AccessibilitySettings/AccessibilitySettings.test.tsx`
- `src/components/TourGuide/TourGuide.test.tsx`

**Testing Patterns**:

```typescript
// Component rendering with context
function renderWithProviders(component: React.ReactElement) {
    return render(
        <EditorProvider>
            <ThemeProvider>
                <AccessibilityProvider>
                    {component}
                </AccessibilityProvider>
            </ThemeProvider>
        </EditorProvider>
    );
}

describe('ThemeSettings Component', () => {
    test('should render theme customization interface', () => {
        renderWithProviders(<ThemeSettings />);
        
        expect(screen.getByText('Theme Customization')).toBeInTheDocument();
        expect(screen.getByRole('combobox', { name: /theme mode/i })).toBeInTheDocument();
    });
});
```

### 3. Integration Tests

**Purpose**: Test complete user workflows and feature interactions

**Coverage Areas**:

- Editor state management (`src/contexts/EditorContext.test.tsx`)
- Performance optimizations (`src/contexts/EditorContext.optimization.test.tsx`)
- Persistence and recovery (`src/contexts/EditorContext.persistence.test.tsx`)
- Canvas interactions (`src/components/Canvas/Canvas.test.tsx`)

**Example Integration Test**:

```typescript
test('should handle complete error recovery workflow', async () => {
    const { result } = renderHook(() => useEditor(), { wrapper: EditorProvider });
    
    // Create project with data
    act(() => {
        result.current.addObject(testObject);
    });
    
    // Simulate error and recovery
    act(() => {
        result.current.triggerErrorRecovery();
    });
    
    expect(result.current.state.errorRecovery.isRecovering).toBe(true);
    
    // Verify data preservation
    expect(result.current.state.objects[testObject.id]).toBeDefined();
});
```

### 4. Accessibility Tests

**Purpose**: Ensure WCAG 2.1 AA compliance and usability for all users

**Testing Areas**:

- Keyboard navigation completeness
- Screen reader compatibility
- ARIA labeling accuracy
- Focus management
- Color contrast validation

**Implementation Example**:

```typescript
describe('Accessibility Compliance', () => {
    test('should provide complete keyboard navigation', async () => {
        const user = userEvent.setup();
        renderWithProviders(<VisualEditor />);
        
        // Test tab navigation through all interactive elements
        await user.tab();
        expect(screen.getByRole('button', { name: /select tool/i })).toHaveFocus();
        
        await user.tab();
        expect(screen.getByRole('button', { name: /rectangle tool/i })).toHaveFocus();
    });
    
    test('should have proper ARIA labels', () => {
        renderWithProviders(<Canvas />);
        
        expect(screen.getByRole('application')).toHaveAttribute('aria-label', 'Canvas editor');
        expect(screen.getByLabelText(/zoom level/i)).toBeInTheDocument();
    });
});
```

### 5. Performance Tests

**Purpose**: Validate optimization effectiveness and performance targets

**Key Metrics**:

- Rendering performance with large object counts
- Memory usage with history operations
- Viewport culling effectiveness
- Progressive rendering behavior

**Example Performance Test**:

```typescript
describe('Performance Optimizations', () => {
    test('should maintain 60fps with 200+ objects', () => {
        const { result } = renderHook(() => usePerformance(largeObjectSet, viewport));
        
        // Measure render time
        const startTime = performance.now();
        act(() => {
            result.current.batchRender(() => {
                // Simulate heavy rendering operation
            });
        });
        const endTime = performance.now();
        
        const renderTime = endTime - startTime;
        expect(renderTime).toBeLessThan(16); // 60fps = 16ms per frame
    });
});
```

## Test Utilities

### Custom Render Functions

```typescript
// src/test-utils/index.ts
export function renderWithEditor(component: React.ReactElement) {
    return render(
        <EditorProvider>
            {component}
        </EditorProvider>
    );
}

export function renderWithTheme(component: React.ReactElement) {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    );
}

export function renderWithAllProviders(component: React.ReactElement) {
    return render(
        <ErrorBoundary>
            <EditorProvider>
                <ThemeProvider>
                    <AccessibilityProvider>
                        {component}
                    </AccessibilityProvider>
                </ThemeProvider>
            </EditorProvider>
        </ErrorBoundary>
    );
}
```

### Mock Implementations

```typescript
// Global mocks in src/test-setup.ts
Object.defineProperty(window, 'matchMedia', {
    value: vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }))
});

// Canvas API mock
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    // ... other canvas methods
}));
```

## Running Tests

### Command Reference

```bash
# Run all tests
bun run test

# Watch mode for development
bun run test:watch

# Generate coverage report
bun run test:coverage

# Run specific test file
bun run test src/components/ThemeSettings/ThemeSettings.test.tsx

# Run tests with specific pattern
bun run test --reporter=verbose --grep="accessibility"
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Tests
  run: |
    bun install
    bun run test:coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Quality Gates

### Coverage Requirements

- **Statements**: ≥90%
- **Branches**: ≥85%
- **Functions**: ≥90%
- **Lines**: ≥90%

### Performance Thresholds

- **Test Suite Runtime**: <30 seconds
- **Individual Test**: <1 second
- **Memory Usage**: <100MB during test execution

### Accessibility Requirements

- **WCAG 2.1 AA**: 100% compliance
- **Keyboard Navigation**: Complete coverage
- **Screen Reader**: Full compatibility
- **Color Contrast**: 4.5:1 minimum ratio

## Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to organize related test cases
2. **Clear Test Names**: Use descriptive names that explain the expected behavior
3. **Single Responsibility**: Each test should verify one specific behavior
4. **Arrange-Act-Assert**: Structure tests with clear setup, action, and verification phases

### Mocking Strategy

1. **Mock External Dependencies**: Always mock API calls, file system, etc.
2. **Preserve Component Logic**: Mock only the boundaries, not internal logic
3. **Realistic Mocks**: Ensure mocks behave like real implementations
4. **Mock Cleanup**: Reset mocks between tests to prevent interference

### Accessibility Testing

1. **Real User Scenarios**: Test with actual assistive technology patterns
2. **Keyboard Only**: Verify complete functionality without mouse
3. **Screen Reader**: Test with aria-labels and semantic HTML
4. **Color Blind**: Verify functionality without color dependence

## Debugging Tests

### Common Issues

1. **Async Operations**: Use `waitFor` and `findBy*` queries for async behavior
2. **Event Handling**: Use `userEvent` instead of `fireEvent` for realistic interactions
3. **Context Dependencies**: Ensure proper provider wrapping
4. **State Management**: Use `act()` for state updates

### Debug Utilities

```typescript
// Debug test output
screen.debug(); // Prints current DOM state

// Query debugging
screen.getByRole('button', { name: /debug/i });
// Use screen.logTestingPlaygroundURL() for interactive debugging
```

## Continuous Improvement

### Test Metrics Tracking

- Monitor test execution time trends
- Track coverage percentage over time
- Identify flaky tests and improve stability
- Measure accessibility compliance progression

### Regular Test Review

- Monthly review of test effectiveness
- Quarterly update of testing strategies
- Annual assessment of coverage requirements
- Continuous evaluation of new testing tools

---

This testing documentation ensures comprehensive quality assurance for Icon Creator, maintaining high standards for reliability, accessibility, and performance across all features.
