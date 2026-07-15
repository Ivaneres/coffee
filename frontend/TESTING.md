# Frontend Test Suite

This document describes the comprehensive test suite for the Espresso Tracker frontend application.

## Test Structure

The test suite is organized as follows:

```
src/
├── setupTests.ts              # Jest setup and global mocks
├── test-utils.tsx             # Custom render function with providers
├── __mocks__/
│   └── axios.ts               # Axios mock
├── contexts/__tests__/
│   └── AuthContext.test.tsx    # Authentication context tests
├── pages/__tests__/
│   ├── Login.test.tsx         # Login page tests
│   ├── Register.test.tsx      # Registration page tests
│   ├── BeansList.test.tsx     # Beans list page tests
│   ├── BeanDetail.test.tsx    # Bean detail page tests
│   ├── AddRecord.test.tsx     # Add/Edit record page tests
│   ├── Search.test.tsx        # Search page tests
│   └── Settings.test.tsx      # Settings page tests
├── components/__tests__/
│   ├── PrivateRoute.test.tsx  # Private route component tests
│   ├── Navbar.test.tsx        # Navigation bar tests
│   ├── RecordCard.test.tsx    # Record card component tests
│   └── SearchBar.test.tsx      # Search bar component tests
├── api/__tests__/
│   └── client.test.ts         # API client tests
└── App.test.tsx               # App routing integration tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run a specific test file
```bash
npm test -- Login.test.tsx
```

## Test Coverage

The test suite covers:

### Authentication
- ✅ Login functionality
- ✅ Registration functionality
- ✅ Session restoration from localStorage
- ✅ Logout functionality
- ✅ Token expiration handling
- ✅ Protected route access

### Beans Management
- ✅ Displaying beans list
- ✅ Creating new beans
- ✅ Viewing bean details
- ✅ Deleting beans
- ✅ Empty state handling
- ✅ Loading states

### Records Management
- ✅ Creating new records
- ✅ Editing existing records
- ✅ Deleting records
- ✅ Displaying record details
- ✅ Form validation
- ✅ Rating sliders
- ✅ Default values from settings

### Search
- ✅ Search by bean variety
- ✅ Search by roaster
- ✅ Search by machine
- ✅ Search by grinder
- ✅ Multiple criteria search
- ✅ Empty results handling

### Settings
- ✅ Loading settings
- ✅ Updating default machine
- ✅ Updating default grinder
- ✅ Saving state handling
- ✅ Error handling

### Navigation
- ✅ Navbar display
- ✅ Navigation links
- ✅ Logout functionality
- ✅ Private route protection
- ✅ Route redirects

### API Integration
- ✅ Token injection in requests
- ✅ 401 error handling
- ✅ Request/response interceptors

## Test Utilities

### Custom Render Function
The `test-utils.tsx` file provides a custom `render` function that automatically wraps components with:
- `BrowserRouter` for routing
- `AuthProvider` for authentication context

Usage:
```typescript
import { render, screen } from '../test-utils';

test('example', () => {
  render(<MyComponent />);
  // ...
});
```

### Mocks
- **Axios**: Mocked to prevent actual API calls
- **React Router**: Navigation functions are mocked
- **Auth Context**: Can be mocked per test
- **Window APIs**: `confirm`, `alert`, `matchMedia` are mocked

## Writing New Tests

When adding new features, follow these patterns:

1. **Mock external dependencies**:
```typescript
jest.mock('../../api/beans');
const mockedBeansApi = beansApi as jest.Mocked<typeof beansApi>;
```

2. **Use custom render for components with context**:
```typescript
import { render } from '../../test-utils';
render(<MyComponent />);
```

3. **Test user interactions**:
```typescript
import userEvent from '@testing-library/user-event';
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');
```

4. **Wait for async operations**:
```typescript
import { waitFor } from '@testing-library/react';
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

## Best Practices

1. **Clear mocks between tests**: Use `beforeEach` to reset mocks
2. **Test user behavior**: Focus on what users see and do
3. **Test error states**: Ensure error handling works correctly
4. **Test loading states**: Verify loading indicators appear
5. **Test edge cases**: Empty states, missing data, etc.
6. **Keep tests isolated**: Each test should be independent
7. **Use descriptive test names**: Clearly describe what is being tested

## Continuous Integration

Tests should pass before merging any pull request. The CI pipeline will:
1. Install dependencies
2. Run linting
3. Run all tests
4. Generate coverage report

## Troubleshooting

### Tests failing due to localStorage
- Tests automatically clear localStorage in `beforeEach`
- If issues persist, check `setupTests.ts`

### Router navigation not working in tests
- Use the custom `render` from `test-utils.tsx`
- Mock `useNavigate` if needed

### Async operations timing out
- Use `waitFor` for async operations
- Increase timeout if needed: `waitFor(..., { timeout: 3000 })`
