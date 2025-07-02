# Integration Tests

This directory contains comprehensive integration tests for the Cards Validator API. The tests are organized into different categories to provide thorough coverage of the application's functionality.

## Test Structure

```
__tests__/
├── utils/
│   └── test-data.ts          # Reusable test data and helper functions
├── services/
│   └── cards.service.spec.ts # Unit tests for the service layer
├── integration/
│   └── cards.controller.integration.spec.ts # Controller integration tests
└── e2e/
    ├── app.e2e-spec.ts       # Application health and bootstrap tests
    └── cards.e2e-spec.ts     # End-to-end API tests
```

## Test Categories

### 1. Unit Tests (`__tests__/services/`)
- **Purpose**: Test individual service methods in isolation
- **Scope**: Business logic validation, Luhn algorithm, date validation
- **Focus**: Pure function testing without HTTP layer

### 2. Integration Tests (`__tests__/integration/`)
- **Purpose**: Test the complete request flow through NestJS application layers
- **Scope**: Controller → Service → Response transformation
- **Focus**: HTTP request/response handling, DTO validation, interceptors

### 3. End-to-End Tests (`__tests__/e2e/`)
- **Purpose**: Test the complete application as a black box
- **Scope**: Full application bootstrap → HTTP server → Response
- **Focus**: API contract validation, performance, concurrent requests

## Test Data

The `TestDataHelper` class in `utils/test-data.ts` provides:

### Valid Test Cards
- **Visa Cards**: 16-digit cards that pass Luhn algorithm
- **Mastercard**: 16-digit cards with valid checksums
- **American Express**: 15-digit cards with proper validation
- **Generic Cards**: 13-digit cards for edge case testing

### Invalid Test Cards
- **Luhn Failures**: Cards that fail the Luhn algorithm check
- **Invalid Lengths**: Cards with 12, 14, 17+ digits
- **Expired Cards**: Cards with past expiry dates
- **Edge Cases**: Boundary condition testing

### Query Parameter Test Cases
- Missing required parameters
- Invalid data types (non-numeric years/months)
- Out-of-range values (month > 12, year < 1900)
- Empty string values

## Running Tests

### All Tests
```bash
npm test                    # Run all tests (unit + integration + e2e)
npm run test:all           # Run unit, integration, and e2e tests sequentially
```

### Specific Test Types
```bash
npm run test:unit          # Run only unit tests
npm run test:integration   # Run only integration tests
npm run test:e2e:new       # Run only new e2e tests
npm run test:e2e           # Run original e2e tests (legacy)
```

### Development
```bash
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage report
npm run test:debug         # Run tests in debug mode
```

### Docker E2E
```bash
npm run test:e2e:docker    # Run e2e tests in Docker environment
```

## Test Coverage

### Controller Integration Tests
- ✅ Valid card validation (all card types and lengths)
- ✅ Invalid card rejection (Luhn failures, wrong lengths, expired)
- ✅ Query parameter validation and transformation
- ✅ HTTP method validation (GET only)
- ✅ Response format consistency
- ✅ Error handling and interceptor behavior
- ✅ Service integration and dependency injection
- ✅ Edge cases and boundary conditions

### End-to-End Tests
- ✅ Complete application bootstrap
- ✅ API contract validation
- ✅ Concurrent request handling
- ✅ Performance testing (response times)
- ✅ Global interceptor and middleware behavior
- ✅ Application health checks
- ✅ Routing and HTTP method validation
- ✅ CORS and header validation

## Key Test Scenarios

### Valid Card Validation
```typescript
// Example: Valid Visa card
GET /cards/validate?cardNumber=4111111111111111&expiryYear=2025&expiryMonth=12
Response: { "valid": true }
```

### Invalid Card Rejection
```typescript
// Example: Failed Luhn algorithm
GET /cards/validate?cardNumber=4111111111111112&expiryYear=2025&expiryMonth=12
Response: {
  "valid": false,
  "error": {
    "code": 400,
    "message": "Invalid card number (failed Luhn algorithm check)"
  }
}
```

### Validation Errors
```typescript
// Example: Missing required parameter
GET /cards/validate?cardNumber=4111111111111111&expiryYear=2025
Response: {
  "valid": false,
  "error": {
    "code": 400,
    "message": "expiryMonth should not be empty"
  }
}
```

## Test Configuration

### Jest Configuration
The tests use the main Jest configuration from `package.json` with:
- TypeScript support via `ts-jest`
- Module path mapping for `src/` imports
- Coverage collection from source files
- Test matching for `__tests__/**/*.spec.ts`

### NestJS Testing Setup
- Uses `@nestjs/testing` for module creation
- Applies global validation pipes to match production
- Proper application lifecycle management (init/close)
- Dependency injection testing

## Best Practices

### Test Organization
- **Descriptive test names**: Each test clearly describes what it validates
- **Grouped scenarios**: Related tests are grouped in `describe` blocks
- **Data-driven tests**: Use `forEach` for testing multiple similar scenarios
- **Isolated tests**: Each test is independent and can run in any order

### Test Data Management
- **Centralized test data**: All test data is managed in `TestDataHelper`
- **Dynamic dates**: Test data uses current date for expiry validation
- **Comprehensive coverage**: Test data covers all edge cases and scenarios
- **Reusable helpers**: Common operations are extracted to helper methods

### Assertions
- **Specific expectations**: Tests check exact response structure and values
- **Error message validation**: Error tests verify specific error messages
- **Type checking**: Tests validate response data types
- **Complete response validation**: Tests check entire response structure

## Debugging Tests

### Common Issues
1. **Date-related test failures**: Tests may fail if run at month boundaries
2. **Async test issues**: Ensure proper `await` usage in async tests
3. **Module import errors**: Check path mappings in Jest configuration

### Debug Commands
```bash
# Run specific test file
npm test -- __tests__/integration/cards.controller.integration.spec.ts

# Run specific test case
npm test -- --testNamePattern="should validate Valid Visa 16-digit card"

# Run with verbose output
npm test -- --verbose

# Run in debug mode
npm run test:debug
```

## Contributing

When adding new tests:

1. **Add test data** to `TestDataHelper` if needed
2. **Follow naming conventions** for test descriptions
3. **Group related tests** in appropriate `describe` blocks
4. **Test both success and failure scenarios**
5. **Validate complete response structure**
6. **Add documentation** for complex test scenarios

## Performance Considerations

- Tests are designed to run quickly (< 1 second per test)
- Concurrent request testing validates application performance
- Database-free testing ensures fast execution
- Proper application lifecycle management prevents memory leaks
