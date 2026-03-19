# DECP Platform - Test Suite

Comprehensive testing suite covering unit tests, integration tests, E2E tests, performance tests, and security tests.

## Test Structure

```
tests/
├── unit/                    # Unit tests for all services
├── integration/            # Integration tests
├── e2e/                    # End-to-end tests (Cypress)
├── performance/            # Performance tests (k6)
├── security/               # Security tests
├── mobile/                 # Mobile E2E tests (Detox)
└── coverage/               # Test coverage reports
```

## Running Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Performance Tests
```bash
npm run test:performance
```

### All Tests
```bash
npm run test:all
```

## Test Coverage
- Backend Services: > 85%
- Frontend: > 80%
- Mobile: > 75%
